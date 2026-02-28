import { notFound } from "next/navigation";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getContainerFraction,
  validateCompliance,
  PPWR_NOTICE,
  type ContainerFraction,
} from "@/lib/legal-decisions";
import { DetectedMaterialSchema, PackagingAnalysisRowSchema } from "@/lib/schemas";
import type { PackagingUse } from "@/types/analysis";

// ── Zod schema for this page's query ─────────────────────────────────────────

const VerifyAnalysisSchema = z.object({
  id: z.string(),
  status: z.string(),
  materials: z.array(DetectedMaterialSchema),
  overall_confidence: z.number(),
  legal_context: z.string().nullable(),
  raw_response: PackagingAnalysisRowSchema.nullable(),
  created_at: z.string(),
  products: z.object({ name: z.string() }),
});

// ── Display constants ─────────────────────────────────────────────────────────

const PACKAGING_USE_LABEL: Record<PackagingUse, string> = {
  household: "Doméstico",
  commercial: "Comercial",
  industrial: "Industrial",
};

const CONTAINER_BADGE: Record<
  ContainerFraction,
  { label: string; className: string }
> = {
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
    className:
      "bg-green-800 text-white font-bold text-xs px-2 py-0.5 rounded",
  },
  otro: {
    label: "OTRO",
    className: "bg-gray-500 text-white font-bold text-xs px-2 py-0.5 rounded",
  },
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Admin client — bypasses RLS for public verification
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("analyses")
    .select(
      "id, status, materials, overall_confidence, legal_context, raw_response, created_at, products(name)"
    )
    .eq("id", id)
    .eq("status", "completed")
    .single();

  if (error || !data) notFound();

  const parsed = VerifyAnalysisSchema.safeParse(data);
  if (!parsed.success) {
    console.error("[verify/page] Unexpected shape:", parsed.error.issues);
    notFound();
  }

  const analysis = parsed.data;
  const packagingUse: PackagingUse =
    analysis.raw_response?.packaging_use ?? "household";
  const complianceItems = validateCompliance(analysis.materials, packagingUse);

  const analysisDate = new Date(analysis.created_at).toLocaleDateString(
    "es-ES",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const confidence = analysis.overall_confidence;
  const confidenceTier =
    confidence >= 0.8
      ? "success"
      : confidence >= 0.5
        ? "warning"
        : "destructive";
  const confidenceLabel =
    confidence >= 0.8 ? "Alta" : confidence >= 0.5 ? "Media" : "Baja";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* ── AI notice ── */}
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <span className="text-amber-600 text-lg shrink-0 mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Verificado por IA — sujeto a revisión humana
            </p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Este análisis fue generado mediante visión artificial y contexto
              legal RAG. Los resultados tienen valor orientativo. Verifique con
              un asesor cualificado antes de su uso oficial.
            </p>
          </div>
        </div>

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Verificación de etiquetado medioambiental
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Conforme al RD&nbsp;1055/2022 · ID:{" "}
            <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
              {id}
            </code>
          </p>
        </div>

        {/* ── Product info ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Información del producto</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Producto</span>
              <span className="font-medium">{analysis.products.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tipo de envase</span>
              <span className="font-medium capitalize">
                {analysis.raw_response?.packaging_type ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Uso del envase</span>
              <span className="font-medium">
                {PACKAGING_USE_LABEL[packagingUse]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Confianza global</span>
              <Badge variant={confidenceTier}>
                {confidenceLabel} ({Math.round(confidence * 100)}%)
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fecha de análisis</span>
              <span className="font-medium">{analysisDate}</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Materials ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Materiales identificados</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 pb-2 pt-0 font-medium">Parte</th>
                  <th className="px-4 pb-2 pt-0 font-medium">Material</th>
                  <th className="px-4 pb-2 pt-0 font-medium">Código</th>
                  <th className="px-4 pb-2 pt-0 font-medium">Contenedor</th>
                </tr>
              </thead>
              <tbody>
                {analysis.materials.map((m, i) => {
                  const fraction = getContainerFraction(
                    m.material_code,
                    m.material_abbrev
                  );
                  const badge = CONTAINER_BADGE[fraction];
                  return (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-2">{m.part}</td>
                      <td className="px-4 py-2">{m.material_name}</td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {m.material_code && m.material_abbrev
                          ? `${m.material_code} ${m.material_abbrev}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span className={badge.className}>{badge.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* ── Compliance checklist ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Validación de cumplimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {(() => {
              const OBLIGATION_CHIP = {
                mandatory: "bg-green-800 text-white",
                voluntary: "bg-gray-500 text-white",
                upcoming:  "bg-amber-800 text-white",
              } as const;
              const OBLIGATION_LABEL = {
                mandatory: "OBL.",
                voluntary: "VOL.",
                upcoming:  "PROX.",
              } as const;

              return complianceItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span
                    className={`mt-0.5 shrink-0 text-[10px] font-bold px-1 py-0.5 rounded ${OBLIGATION_CHIP[item.obligation]}`}
                  >
                    {OBLIGATION_LABEL[item.obligation]}
                  </span>
                  <span
                    className={`mt-0.5 shrink-0 font-bold ${
                      item.passed ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {item.passed ? "✓" : "✗"}
                  </span>
                  <div>
                    <span
                      className={item.passed ? "text-green-800" : "text-red-700"}
                    >
                      {item.check}
                    </span>
                    {item.detail && (
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{item.article}</p>
                  </div>
                </div>
              ));
            })()}
            <div className="mt-3 pt-2 border-t border-amber-200 text-xs text-amber-700">
              ⚠ {PPWR_NOTICE.label} — {PPWR_NOTICE.detail}
            </div>
            <p className="mt-2 text-xs text-muted-foreground border-t pt-2">
              Validación conforme a RD 1055/2022 (BOE-A-2022-22199) ·{" "}
              {analysisDate}
            </p>
          </CardContent>
        </Card>

        {/* ── Legal context ── */}
        {analysis.legal_context && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Referencias legales (RD&nbsp;1055/2022)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono leading-relaxed">
                {analysis.legal_context}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* ── Footer ── */}
        <div className="text-center text-xs text-gray-400 pb-4 flex flex-col gap-1">
          <p>Etiquetado ambiental generado por IA · RD 1055/2022 · BOE-A-2022-22199</p>
          <p>Este documento no tiene validez jurídica sin revisión humana cualificada</p>
        </div>

      </div>
    </div>
  );
}
