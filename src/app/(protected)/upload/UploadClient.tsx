"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PackagingUse, PackagingAnalysis, DetectedMaterial, InferenceMethod } from "@/types/analysis";
import { MaterialConfirmationFlow, type ConfirmingData } from "./MaterialConfirmationFlow";
import { MaterialDecomposer } from "./MaterialDecomposer";
import { PackagingTypeWizard } from "./PackagingTypeWizard";
import { MandatoryMarkingQuestionnaire } from "./MandatoryMarkingQuestionnaire";
import type { MandatoryMarkingInputs } from "@/lib/legal-decisions";
import { scanForProhibitedLanguage } from "@/lib/greenwashing-guard";

type Phase = "wizard" | "questionnaire" | "form" | "analyzing" | "confirming" | "decomposing" | "preview" | "saving";

interface ComplianceItem {
  check: string;
  passed: boolean;
  detail?: string;
}

interface PreviewData {
  analysis: PackagingAnalysis;
  legalContext: string;
  labelSvg: string | null;
  labelPdf: string | null;
  containerFractions: Record<string, string>;
  complianceItems: ComplianceItem[];
  productName: string;
  packagingUse: PackagingUse;
  imageFile: File;
  imageObjectUrl: string;
}

const PACKAGING_USE_LABEL: Record<PackagingUse, string> = {
  household: "Doméstico",
  commercial: "Comercial",
  industrial: "Industrial",
};

const INFERENCE_BADGE: Record<InferenceMethod, { label: string; className: string }> = {
  visual:         { label: "Visual",      className: "bg-green-100 text-green-800 font-medium text-xs px-1.5 py-0.5 rounded" },
  contextual:     { label: "Contextual",  className: "bg-blue-100 text-blue-800 font-medium text-xs px-1.5 py-0.5 rounded" },
  lookup:         { label: "Tabla",       className: "bg-purple-100 text-purple-800 font-medium text-xs px-1.5 py-0.5 rounded" },
  user_confirmed: { label: "Confirmado",  className: "bg-gray-100 text-gray-700 font-medium text-xs px-1.5 py-0.5 rounded" },
};

const CONTAINER_BADGE: Record<string, { label: string; className: string }> = {
  amarillo: {
    label: "AMARILLO",
    className:
      "bg-yellow-300 text-yellow-900 font-bold text-xs px-2 py-0.5 rounded",
  },
  azul: {
    label: "AZUL",
    className: "bg-blue-600 text-white font-bold text-xs px-2 py-0.5 rounded",
  },
  verde: {
    label: "VERDE",
    className: "bg-green-800 text-white font-bold text-xs px-2 py-0.5 rounded",
  },
  otro: {
    label: "OTRO",
    className: "bg-gray-500 text-white font-bold text-xs px-2 py-0.5 rounded",
  },
};

export function UploadClient({ companyName }: { companyName: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
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
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const submittingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const MAX_IMAGES = 5;

  // Manage object URLs for thumbnails — revoke old ones on files change
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setFilePreviews(urls);
    return () => { urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [files]);

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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) addFiles(dropped);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) addFiles(selected);
    e.target.value = ""; // reset so the same file can be re-selected
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!files.length) {
      setError("Selecciona al menos una imagen del envase.");
      return;
    }
    if (submittingRef.current || isPending) return;
    submittingRef.current = true;

    const productName = String(
      new FormData(e.currentTarget).get("product_name") ?? "",
    ).trim();

    setError(null);
    setPhase("analyzing");

    startTransition(async () => {
      try {
        const form = new FormData();
        for (const f of files) form.append("image", f);
        form.append("packaging_use", packagingUse);
        form.append("product_name", productName);
        form.append(
          "marking_inputs",
          JSON.stringify(
            markingInputs ?? { isCompostable: false, isSUP: false, isReusable: false, isSDDR: false }
          )
        );

        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          body: form,
        });
        const analyzeData = await analyzeRes.json();

        if (!analyzeRes.ok) {
          setError(analyzeData.error ?? "Error en el análisis de imagen.");
          setPhase("form");
          return;
        }

        const needsConfirmation = (analyzeData.analysis.materials as DetectedMaterial[]).some(
          (m: DetectedMaterial) => m.confidence < 0.8 || m.material_code === null
        );

        if (needsConfirmation) {
          setConfirming({
            analysis: analyzeData.analysis,
            legalContext: analyzeData.legal_context,
            labelSvg: analyzeData.label_svg ?? null,
            labelPdf: analyzeData.label_pdf ?? null,
            containerFractions: analyzeData.container_fractions ?? {},
            complianceItems: analyzeData.compliance_items ?? [],
            productName,
            packagingUse,
            imageFile: files[0],
            imageObjectUrl: URL.createObjectURL(files[0]),
          });
          setPhase("confirming");
        } else {
          const imageObjectUrl = URL.createObjectURL(files[0]);
          const source = {
            legalContext: analyzeData.legal_context,
            productName,
            packagingUse,
            imageFile: files[0],
            imageObjectUrl,
          };
          // ≥2 materials → always ask per-component separability in MaterialDecomposer
          if ((analyzeData.analysis.materials as DetectedMaterial[]).length >= 2) {
            setDecomposingData({
              correctedAnalysis: analyzeData.analysis,
              ...source,
            });
            setPhase("decomposing");
          } else {
            setPreview({
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
            });
            setPhase("preview");
          }
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
          JSON.stringify(
            markingInputs ?? { isCompostable: false, isSUP: false, isReusable: false, isSDDR: false }
          )
        );

        const saveRes = await fetch("/api/analyses/save", {
          method: "POST",
          body: form,
        });
        const saveData = await saveRes.json();

        if (!saveRes.ok) {
          setError(
            saveData.code === "NO_COMPANY"
              ? "Primero configura tu empresa en Ajustes."
              : (saveData.error ?? "Error al guardar el producto."),
          );
          setPhase("preview");
          return;
        }

        router.push(`/analyze/${saveData.analysis_id}`);
      } catch {
        setError("Error de red. Comprueba tu conexión e inténtalo de nuevo.");
        setPhase("preview");
      } finally {
        submittingRef.current = false;
      }
    });
  }

  // Shared helper: call /api/label/preview and transition to the preview phase
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
          marking_inputs:
            markingInputs ?? { isCompostable: false, isSUP: false, isReusable: false, isSDDR: false },
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

  // After material confirmation: go to decomposer if ≥2 materials, else straight to preview
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

  // After decomposition: regenerate preview with separability-annotated analysis
  async function handleDecompositionComplete(updatedAnalysis: PackagingAnalysis) {
    if (!decomposingData) return;
    await generatePreview(updatedAnalysis, decomposingData);
  }

  // ── Wizard state ──
  if (phase === "wizard") {
    return (
      <PackagingTypeWizard
        onComplete={(use) => {
          setPackagingUse(use);
          setPhase("questionnaire");
        }}
      />
    );
  }

  // ── Questionnaire state ──
  if (phase === "questionnaire") {
    return (
      <MandatoryMarkingQuestionnaire
        onComplete={(inputs) => {
          setMarkingInputs(inputs);
          setPhase("form");
        }}
        onBack={() => setPhase("wizard")}
      />
    );
  }

  // ── Analyzing state ──
  if (phase === "analyzing") {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold mb-6">Analizar envase</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            <p className="text-sm text-muted-foreground">
              Analizando envase… puede tardar hasta 60 s
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Confirming state ──
  if (phase === "confirming" && confirming) {
    return (
      <MaterialConfirmationFlow
        data={confirming}
        onComplete={handleConfirmationComplete}
        onBack={() => {
          setPhase("form");
          setConfirming(null);
        }}
      />
    );
  }

  // ── Decomposing state ──
  if (phase === "decomposing" && decomposingData) {
    return (
      <MaterialDecomposer
        analysis={decomposingData.correctedAnalysis}
        productName={decomposingData.productName}
        packagingUse={decomposingData.packagingUse}
        onComplete={handleDecompositionComplete}
        onBack={() => {
          // Return to confirming if we went through it, otherwise back to form
          if (confirming) {
            setPhase("confirming");
          } else {
            URL.revokeObjectURL(decomposingData.imageObjectUrl);
            setPhase("form");
            setDecomposingData(null);
          }
        }}
      />
    );
  }

  // ── Preview / Saving state ── full-width analyze-page layout
  if ((phase === "preview" || phase === "saving") && preview) {
    const gwViolations = scanForProhibitedLanguage(
      `${preview.productName} ${preview.analysis.notes ?? ""}`
    );
    const confidence = preview.analysis.overall_confidence;
    const confidenceTier =
      confidence >= 0.8
        ? "success"
        : confidence >= 0.5
          ? "warning"
          : "destructive";
    const confidenceLabel =
      confidence >= 0.8 ? "Alta" : confidence >= 0.5 ? "Media" : "Baja";
    const isSaving = phase === "saving" || isPending;

    return (
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Resultado del análisis</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {preview.productName}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                URL.revokeObjectURL(preview.imageObjectUrl);
                setPreview(null);
                setConfirming(null);
                setDecomposingData(null);
                setFiles([]);
                setPackagingUse("household");
                setMarkingInputs(null);
                setError(null);
                setPhase("wizard");
              }}
              disabled={isSaving}
            >
              ← Nuevo análisis
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>

        {error && (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* ── LEFT: image + info ── */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Envase
            </h2>

            {/* Product image */}
            <Card>
              <CardContent className="p-4 flex justify-center bg-gray-50 rounded-xl min-h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.imageObjectUrl}
                  alt="Imagen del envase"
                  className="max-w-full max-h-80 object-contain rounded"
                />
              </CardContent>
            </Card>

            {/* Product info */}
            <Card>
              <CardContent className="p-4 flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Empresa</span>
                  <span className="font-medium">{companyName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Producto</span>
                  <span className="font-medium">{preview.productName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tipo de envase</span>
                  <span className="font-medium capitalize">
                    {preview.analysis.packaging_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Uso del envase</span>
                  <span className="font-medium">
                    {PACKAGING_USE_LABEL[preview.packagingUse]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Confianza global
                  </span>
                  <Badge variant={confidenceTier}>
                    {confidenceLabel} ({Math.round(confidence * 100)}%)
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT: analysis results ── */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Análisis
            </h2>

            {/* Greenwashing guard warning */}
            {gwViolations.length > 0 && (
              <div className={`rounded-md border p-3 text-sm ${
                gwViolations.some((v) => v.severity === "error")
                  ? "border-red-300 bg-red-50"
                  : "border-yellow-300 bg-yellow-50"
              }`}>
                <p className={`font-semibold mb-1 ${
                  gwViolations.some((v) => v.severity === "error") ? "text-red-700" : "text-yellow-800"
                }`}>
                  ⚠ Declaraciones ambientales a revisar (Art. 13.3)
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-sm text-red-600">
                  {gwViolations.map((v, i) => (
                    <li key={i} className={v.severity === "warning" ? "text-yellow-700" : "text-red-600"}>
                      {v.pattern}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-gray-500">
                  {gwViolations.some((v) => v.severity === "error")
                    ? "La generación de etiqueta estará bloqueada. Puedes guardar el análisis pero deberás corregir los claims antes de generar la etiqueta."
                    : "Advertencias: verifica que los claims sean correctos antes de generar la etiqueta."}
                </p>
              </div>
            )}

            {/* Materials table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Materiales detectados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 pb-2 pt-0 font-medium">Parte</th>
                      <th className="px-4 pb-2 pt-0 font-medium">Material</th>
                      <th className="px-4 pb-2 pt-0 font-medium">Código</th>
                      <th className="px-4 pb-2 pt-0 font-medium">Contenedor</th>
                      <th className="px-4 pb-2 pt-0 font-medium">Origen</th>
                      <th className="px-4 pb-2 pt-0 font-medium">Confianza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.analysis.materials.map((m, i) => {
                      const fraction =
                        preview.containerFractions[m.part] ?? "otro";
                      const badge =
                        CONTAINER_BADGE[fraction] ?? CONTAINER_BADGE.otro;
                      const conf = m.confidence;
                      const confTier =
                        conf >= 0.8
                          ? "success"
                          : conf >= 0.5
                            ? "warning"
                            : "destructive";
                      const confLabel =
                        conf >= 0.8 ? "Alta" : conf >= 0.5 ? "Media" : "Baja";
                      const inferenceBadge = m.inference_method
                        ? INFERENCE_BADGE[m.inference_method]
                        : null;
                      return (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-4 py-2">{m.part}</td>
                          <td className="px-4 py-2">{m.material_name}</td>
                          <td className="px-4 py-2">
                            {m.material_code && m.material_abbrev
                              ? `${m.material_code} ${m.material_abbrev}`
                              : "—"}
                          </td>
                          <td className="px-4 py-2">
                            <span className={badge.className}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {inferenceBadge ? (
                              <span className={inferenceBadge.className}>
                                {inferenceBadge.label}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant={confTier}>
                              {confLabel} ({Math.round(conf * 100)}%)
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Label preview */}
            {preview.labelSvg && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Etiqueta generada</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex justify-center bg-gray-50 rounded-lg p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(preview.labelSvg)))}`}
                      alt="Etiqueta de reciclaje — haz clic para ampliar"
                      className="max-w-full border shadow-sm rounded cursor-zoom-in"
                      style={{ maxHeight: 320 }}
                      onClick={() => setShowLabelModal(true)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Haz clic en la etiqueta para ampliarla
                  </p>
                  {preview.labelPdf && (
                    <Button asChild size="sm" className="self-start">
                      <a
                        href={`data:application/pdf;base64,${preview.labelPdf}`}
                        download="etiqueta-preview.pdf"
                      >
                        Descargar PDF
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Compliance checklist */}
            {preview.complianceItems.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Validación de cumplimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {preview.complianceItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span
                        className={`mt-0.5 shrink-0 font-bold ${
                          item.passed ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {item.passed ? "✓" : "✗"}
                      </span>
                      <div>
                        <span
                          className={
                            item.passed ? "text-green-800" : "text-red-700"
                          }
                        >
                          {item.check}
                        </span>
                        {item.detail && (
                          <p className="text-xs text-muted-foreground">
                            {item.detail}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="mt-2 text-xs text-muted-foreground border-t pt-2">
                    Validación conforme a RD 1055/2022 a fecha{" "}
                    {new Date().toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Legal context */}
            {preview.legalContext && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Contexto legal (RD 1055/2022)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono leading-relaxed">
                    {preview.legalContext}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ── Label modal ── */}
        {showLabelModal && preview.labelSvg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowLabelModal(false)}
          >
            <div
              className="relative bg-white rounded-xl shadow-2xl flex flex-col max-w-2xl w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-3 border-b">
                <span className="text-sm font-semibold">Vista previa de etiqueta</span>
                <button
                  onClick={() => setShowLabelModal(false)}
                  className="text-gray-400 hover:text-gray-700 text-xl leading-none"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* Modal body — scrollable */}
              <div className="overflow-auto p-5 flex justify-center bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(preview.labelSvg)))}`}
                  alt="Etiqueta de reciclaje"
                  className="w-full max-w-xl border shadow-sm rounded"
                />
              </div>

              {/* Modal footer */}
              {preview.labelPdf && (
                <div className="flex justify-end px-5 py-3 border-t">
                  <Button asChild size="sm">
                    <a
                      href={`data:application/pdf;base64,${preview.labelPdf}`}
                      download="etiqueta-preview.pdf"
                    >
                      Descargar PDF
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Form state (default) ──
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Analizar envase</h1>
      <Card>
        <CardHeader>
          <CardTitle>Subir imagen del envase</CardTitle>
          <p className="text-sm text-muted-foreground">
            La IA identificará los materiales y generará el etiquetado conforme
            al RD&nbsp;1055/2022. Empresa: <strong>{companyName}</strong>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product_name">Nombre del producto *</Label>
              <Input
                id="product_name"
                name="product_name"
                placeholder="Ej: Botella de agua 500ml"
                required
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Tipo de envase</Label>
              <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm">
                <span className="font-medium">
                  {PACKAGING_USE_LABEL[packagingUse]}
                </span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
                  disabled={isPending}
                  onClick={() => setPhase("questionnaire")}
                >
                  Cambiar
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Clasificado según Art. 2 RD 1055/2022.{" "}
                {packagingUse === "household"
                  ? "Sujeto a indicación de fracción de recogida (Art. 13.2)."
                  : "Exento de indicación de fracción de recogida (Art. 13.2)."}
              </p>
            </div>

            {/* Drop zone / multi-image area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              className={`rounded-lg border-2 border-dashed transition-colors ${
                dragging ? "border-green-500 bg-green-50" : "border-gray-300"
              }`}
            >
              {files.length === 0 ? (
                /* Empty state — click or drag */
                <button
                  type="button"
                  className="flex w-full flex-col items-center justify-center gap-2 p-10 text-center cursor-pointer hover:bg-gray-50 rounded-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                >
                  <span className="text-3xl text-muted-foreground">📷</span>
                  <p className="text-sm text-muted-foreground">
                    Arrastra imágenes aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG · PNG · WebP · Hasta {MAX_IMAGES} fotos
                  </p>
                </button>
              ) : (
                /* Thumbnails grid */
                <div className="p-3 flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={filePreviews[i]}
                          alt={f.name}
                          className="h-20 w-20 object-cover rounded border"
                        />
                        {i === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold bg-green-600 text-white rounded-b py-0.5">
                            Principal
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          disabled={isPending}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Eliminar imagen"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {files.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPending}
                        className="h-20 w-20 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-600 transition-colors text-xl"
                        aria-label="Añadir más imágenes"
                      >
                        +
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {files.length}/{MAX_IMAGES} imágenes · la primera es la vista principal
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isPending}
              />
            </div>

            {error && (
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button type="submit" disabled={isPending || !files.length}>
              Analizar envase
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
