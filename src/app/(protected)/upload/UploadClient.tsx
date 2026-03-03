"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import type { PackagingUse, PackagingAnalysis, DetectedMaterial } from "@/types/analysis";
import { MaterialConfirmationFlow, type ConfirmingData } from "./MaterialConfirmationFlow";
import { MaterialDecomposer } from "./MaterialDecomposer";
import { PackagingTypeWizard } from "./PackagingTypeWizard";
import { MandatoryMarkingQuestionnaire } from "./MandatoryMarkingQuestionnaire";
import type { MandatoryMarkingInputs } from "@/lib/legal-decisions";
import { UploadForm } from "./UploadForm";
import { AnalysisPreview, type PreviewData } from "./AnalysisPreview";
import { track } from "@vercel/analytics";

type Phase =
  | "wizard"
  | "questionnaire"
  | "form"
  | "analyzing"
  | "confirming"
  | "decomposing"
  | "preview"
  | "saving";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 5;

export function UploadClient({ companyName }: { companyName: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [packagingUse, setPackagingUse] = useState<PackagingUse>("household");
  const [markingInputs, setMarkingInputs] = useState<MandatoryMarkingInputs | null>(null);
  const [phase, setPhase] = useState<Phase>("wizard");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [confirming, setConfirming] = useState<ConfirmingData | null>(null);
  const [decomposingData, setDecomposingData] = useState<{
    correctedAnalysis: PackagingAnalysis;
    legalContext: string;
    productName: string;
    packagingUse: PackagingUse;
    imageFile: File;
    imageObjectUrl: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const submittingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setFilePreviews(urls);
    return () => { urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [files]);

  // ── File management ─────────────────────────────────────────────────────────

  function validateFile(f: File): string | null {
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      return "Formato no válido. Usa JPEG, PNG o WebP.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `La imagen supera el límite de 5 MB (${(f.size / 1024 / 1024).toFixed(1)} MB).`;
    }
    return null;
  }

  function addFiles(incoming: File[]) {
    const slots = MAX_IMAGES - files.length;
    if (slots <= 0) return;
    const toAdd = incoming.slice(0, slots);
    let firstError: string | null = null;
    const valid: File[] = [];
    for (const f of toAdd) {
      const err = validateFile(f);
      if (err) { if (!firstError) firstError = err; }
      else valid.push(f);
    }
    if (firstError) setError(firstError);
    else setError(null);
    if (valid.length > 0) setFiles((prev) => [...prev, ...valid]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // ── API calls ────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!files.length) { setError("Selecciona al menos una imagen del envase."); return; }
    if (submittingRef.current || isPending) return;
    submittingRef.current = true;

    const productName = String(new FormData(e.currentTarget).get("product_name") ?? "").trim();
    setError(null);
    setPhase("analyzing");
    track("upload_started", { packaging_use: packagingUse });

    startTransition(async () => {
      try {
        const form = new FormData();
        for (const f of files) form.append("image", f);
        form.append("packaging_use", packagingUse);
        form.append("product_name", productName);
        form.append(
          "marking_inputs",
          JSON.stringify(markingInputs ?? { isCompostable: false, isSUP: false, isReusable: false, isSDDR: false })
        );

        const analyzeRes = await fetch("/api/analyze", { method: "POST", body: form });
        const analyzeData = await analyzeRes.json();

        if (!analyzeRes.ok) {
          setError(analyzeData.error ?? "Error en el análisis de imagen.");
          setPhase("form");
          return;
        }

        const needsConfirmation = (analyzeData.analysis.materials as DetectedMaterial[]).some(
          (m) => m.confidence < 0.8 || m.material_code === null
        );
        const imageObjectUrl = URL.createObjectURL(files[0]);
        const source = { legalContext: analyzeData.legal_context, productName, packagingUse, imageFile: files[0], imageObjectUrl };
        const previewPayload: PreviewData = {
          analysis: analyzeData.analysis,
          legalContext: analyzeData.legal_context,
          labelSvg: analyzeData.label_svg ?? null,
          labelPdf: analyzeData.label_pdf ?? null,
          containerFractions: analyzeData.container_fractions ?? {},
          complianceItems: analyzeData.compliance_items ?? [],
          productName,
          packagingUse,
          imageFile: files[0],
          imageObjectUrl,
        };

        if (needsConfirmation) {
          setConfirming(previewPayload);
          setPhase("confirming");
        } else if ((analyzeData.analysis.materials as DetectedMaterial[]).length >= 2) {
          setDecomposingData({ correctedAnalysis: analyzeData.analysis, ...source });
          setPhase("decomposing");
        } else {
          setPreview(previewPayload);
          setPhase("preview");
        }
      } catch {
        setError("Error de red. Comprueba tu conexión e inténtalo de nuevo.");
        setPhase("form");
      } finally {
        submittingRef.current = false;
      }
    });
  }

  function handleSave() {
    if (!preview || submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    setPhase("saving");

    startTransition(async () => {
      try {
        const form = new FormData();
        form.append("product_name", preview.productName);
        form.append("packaging_use", preview.packagingUse);
        form.append("analysis", JSON.stringify(preview.analysis));
        form.append("legal_context", preview.legalContext);
        form.append("image", preview.imageFile);
        form.append(
          "marking_inputs",
          JSON.stringify(markingInputs ?? { isCompostable: false, isSUP: false, isReusable: false, isSDDR: false })
        );

        const saveRes = await fetch("/api/analyses/save", { method: "POST", body: form });
        const saveData = await saveRes.json();

        if (!saveRes.ok) {
          setError(
            saveData.code === "NO_COMPANY"
              ? "Primero configura tu empresa en Ajustes."
              : (saveData.error ?? "Error al guardar el producto.")
          );
          setPhase("preview");
          return;
        }

        track("label_generated", { packaging_use: preview.packagingUse });
        router.push(`/analyze/${saveData.analysis_id}`);
      } catch {
        setError("Error de red. Comprueba tu conexión e inténtalo de nuevo.");
        setPhase("preview");
      } finally {
        submittingRef.current = false;
      }
    });
  }

  async function generatePreview(
    analysisToPreview: PackagingAnalysis,
    source: {
      legalContext: string;
      productName: string;
      packagingUse: PackagingUse;
      imageFile: File;
      imageObjectUrl: string;
    }
  ) {
    try {
      const res = await fetch("/api/label/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: analysisToPreview,
          packaging_use: source.packagingUse,
          product_name: source.productName,
          marking_inputs: markingInputs ?? { isCompostable: false, isSUP: false, isReusable: false, isSDDR: false },
        }),
      });
      const updated = await res.json();
      setPreview({
        analysis: analysisToPreview,
        legalContext: source.legalContext,
        labelSvg: updated.label_svg ?? null,
        labelPdf: updated.label_pdf ?? null,
        containerFractions: updated.container_fractions ?? {},
        complianceItems: updated.compliance_items ?? [],
        productName: source.productName,
        packagingUse: source.packagingUse,
        imageFile: source.imageFile,
        imageObjectUrl: source.imageObjectUrl,
      });
      setPhase("preview");
    } catch {
      setError("Error al generar la vista previa. Inténtalo de nuevo.");
    }
  }

  // ── Phase transition handlers ────────────────────────────────────────────────

  async function handleConfirmationComplete(correctedAnalysis: PackagingAnalysis) {
    if (!confirming) return;
    if (correctedAnalysis.materials.length >= 2) {
      setDecomposingData({
        correctedAnalysis,
        legalContext: confirming.legalContext,
        productName: confirming.productName,
        packagingUse: confirming.packagingUse,
        imageFile: confirming.imageFile,
        imageObjectUrl: confirming.imageObjectUrl,
      });
      setPhase("decomposing");
    } else {
      await generatePreview(correctedAnalysis, confirming);
    }
  }

  async function handleDecompositionComplete(updatedAnalysis: PackagingAnalysis) {
    if (!decomposingData) return;
    await generatePreview(updatedAnalysis, decomposingData);
  }

  function handleNewAnalysis() {
    if (preview) URL.revokeObjectURL(preview.imageObjectUrl);
    setPreview(null);
    setConfirming(null);
    setDecomposingData(null);
    setFiles([]);
    setPackagingUse("household");
    setMarkingInputs(null);
    setError(null);
    setPhase("wizard");
  }

  // ── Phase routing ────────────────────────────────────────────────────────────

  if (phase === "wizard") {
    return (
      <div className="flex justify-center">
        <PackagingTypeWizard
          onComplete={(use) => { setPackagingUse(use); setPhase("questionnaire"); }}
        />
      </div>
    );
  }

  if (phase === "questionnaire") {
    return (
      <div className="flex justify-center">
        <MandatoryMarkingQuestionnaire
          onComplete={(inputs) => { setMarkingInputs(inputs); setPhase("form"); }}
          onBack={() => setPhase("wizard")}
        />
      </div>
    );
  }

  if (phase === "analyzing") {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Analizar envase</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            <p className="text-sm text-muted-foreground">Analizando envase… puede tardar hasta 60 s</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "confirming" && confirming) {
    return (
      <div className="flex justify-center">
        <MaterialConfirmationFlow
          data={confirming}
          onComplete={handleConfirmationComplete}
          onBack={() => { setPhase("form"); setConfirming(null); }}
        />
      </div>
    );
  }

  if (phase === "decomposing" && decomposingData) {
    return (
      <div className="flex justify-center">
        <MaterialDecomposer
          analysis={decomposingData.correctedAnalysis}
          productName={decomposingData.productName}
          packagingUse={decomposingData.packagingUse}
          onComplete={handleDecompositionComplete}
          onBack={() => {
            if (confirming) {
              setPhase("confirming");
            } else {
              URL.revokeObjectURL(decomposingData.imageObjectUrl);
              setPhase("form");
              setDecomposingData(null);
            }
          }}
        />
      </div>
    );
  }

  if ((phase === "preview" || phase === "saving") && preview) {
    return (
      <AnalysisPreview
        preview={preview}
        companyName={companyName}
        isSaving={phase === "saving" || isPending}
        error={error}
        onSave={handleSave}
        onNewAnalysis={handleNewAnalysis}
      />
    );
  }

  return (
    <UploadForm
      companyName={companyName}
      packagingUse={packagingUse}
      isPending={isPending}
      error={error}
      files={files}
      filePreviews={filePreviews}
      onSubmit={handleSubmit}
      onFilesAdd={addFiles}
      onFileRemove={removeFile}
      onChangePackagingType={() => setPhase("questionnaire")}
    />
  );
}
