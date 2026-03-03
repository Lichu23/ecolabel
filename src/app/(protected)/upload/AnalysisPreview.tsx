"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PackagingUse, InferenceMethod } from "@/types/analysis";
import type { ConfirmingData } from "./MaterialConfirmationFlow";
import { scanForProhibitedLanguage } from "@/lib/greenwashing-guard";

// Re-export so UploadClient can use a single named type
export type PreviewData = ConfirmingData;

const PACKAGING_USE_LABEL: Record<PackagingUse, string> = {
  household: "Doméstico",
  commercial: "Comercial",
  industrial: "Industrial",
};

const INFERENCE_BADGE: Record<InferenceMethod, { label: string; className: string }> = {
  visual:         { label: "Visual",     className: "bg-green-100 text-green-800 font-medium text-xs px-1.5 py-0.5 rounded" },
  contextual:     { label: "Contextual", className: "bg-blue-100 text-blue-800 font-medium text-xs px-1.5 py-0.5 rounded" },
  lookup:         { label: "Tabla",      className: "bg-purple-100 text-purple-800 font-medium text-xs px-1.5 py-0.5 rounded" },
  user_confirmed: { label: "Confirmado", className: "bg-gray-100 text-gray-700 font-medium text-xs px-1.5 py-0.5 rounded" },
};

const CONTAINER_BADGE: Record<string, { label: string; className: string }> = {
  amarillo: { label: "AMARILLO", className: "bg-yellow-300 text-yellow-900 font-bold text-xs px-2 py-0.5 rounded" },
  azul:     { label: "AZUL",     className: "bg-blue-600 text-white font-bold text-xs px-2 py-0.5 rounded" },
  verde:    { label: "VERDE",    className: "bg-green-800 text-white font-bold text-xs px-2 py-0.5 rounded" },
  otro:     { label: "OTRO",     className: "bg-gray-500 text-white font-bold text-xs px-2 py-0.5 rounded" },
};

interface Props {
  preview: PreviewData;
  companyName: string;
  isSaving: boolean;
  error: string | null;
  onSave: () => void;
  onNewAnalysis: () => void;
}

export function AnalysisPreview({ preview, companyName, isSaving, error, onSave, onNewAnalysis }: Props) {
  const [showLabelModal, setShowLabelModal] = useState(false);

  const gwViolations = scanForProhibitedLanguage(
    `${preview.productName} ${preview.analysis.notes ?? ""}`
  );
  const confidence = preview.analysis.overall_confidence;
  const confidenceTier = confidence >= 0.8 ? "success" : confidence >= 0.5 ? "warning" : "destructive";
  const confidenceLabel = confidence >= 0.8 ? "Alta" : confidence >= 0.5 ? "Media" : "Baja";

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Resultado del análisis</h1>
          <p className="text-muted-foreground text-sm mt-1">{preview.productName}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onNewAnalysis} disabled={isSaving}>
            ← Nuevo análisis
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving}>
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
        {/* LEFT: image + info */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Envase</h2>

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
                <span className="font-medium capitalize">{preview.analysis.packaging_type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Uso del envase</span>
                <span className="font-medium">{PACKAGING_USE_LABEL[preview.packagingUse]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Confianza global</span>
                <Badge variant={confidenceTier}>
                  {confidenceLabel} ({Math.round(confidence * 100)}%)
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: analysis results */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Análisis</h2>

          {/* Greenwashing guard */}
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
              <ul className="list-disc pl-4 space-y-0.5 text-sm">
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
              <CardTitle className="text-base">Materiales detectados</CardTitle>
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
                    const fraction = preview.containerFractions[m.part] ?? "otro";
                    const badge = CONTAINER_BADGE[fraction] ?? CONTAINER_BADGE.otro;
                    const conf = m.confidence;
                    const confTier = conf >= 0.8 ? "success" : conf >= 0.5 ? "warning" : "destructive";
                    const confLabel = conf >= 0.8 ? "Alta" : conf >= 0.5 ? "Media" : "Baja";
                    const inferenceBadge = m.inference_method ? INFERENCE_BADGE[m.inference_method] : null;
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
                          <span className={badge.className}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-2">
                          {inferenceBadge
                            ? <span className={inferenceBadge.className}>{inferenceBadge.label}</span>
                            : <span className="text-muted-foreground text-xs">—</span>}
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
                <div
                  className="flex justify-center bg-gray-50 rounded-lg p-4 cursor-zoom-in overflow-hidden [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-80 [&>svg]:border [&>svg]:shadow-sm [&>svg]:rounded"
                  style={{ maxHeight: 340 }}
                  onClick={() => setShowLabelModal(true)}
                  dangerouslySetInnerHTML={{ __html: preview.labelSvg }}
                />
                <p className="text-xs text-muted-foreground">Haz clic en la etiqueta para ampliarla</p>
                {preview.labelPdf && (
                  <Button asChild size="sm" className="self-start">
                    <a href={`data:application/pdf;base64,${preview.labelPdf}`} download="etiqueta-preview.pdf">
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
                <CardTitle className="text-base">Validación de cumplimiento</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {preview.complianceItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 shrink-0 font-bold ${item.passed ? "text-green-700" : "text-red-600"}`}>
                      {item.passed ? "✓" : "✗"}
                    </span>
                    <div>
                      <span className={item.passed ? "text-green-800" : "text-red-700"}>{item.check}</span>
                      {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
                    </div>
                  </div>
                ))}
                <p className="mt-2 text-xs text-muted-foreground border-t pt-2">
                  Validación conforme a RD 1055/2022 a fecha{" "}
                  {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Legal context */}
          {preview.legalContext && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Contexto legal (RD 1055/2022)</CardTitle>
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

      {/* Label modal */}
      {showLabelModal && preview.labelSvg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowLabelModal(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl flex flex-col max-w-2xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
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
            <div
              className="overflow-auto p-5 flex justify-center bg-gray-50 [&>svg]:w-full [&>svg]:max-w-xl [&>svg]:border [&>svg]:shadow-sm [&>svg]:rounded"
              dangerouslySetInnerHTML={{ __html: preview.labelSvg }}
            />
            {preview.labelPdf && (
              <div className="flex justify-end px-5 py-3 border-t">
                <Button asChild size="sm">
                  <a href={`data:application/pdf;base64,${preview.labelPdf}`} download="etiqueta-preview.pdf">
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
