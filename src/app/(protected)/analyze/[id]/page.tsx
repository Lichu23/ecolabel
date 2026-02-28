import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DeleteAnalysisButton } from "./DeleteAnalysisButton";
import { AnalysisRowSchema, AnalyzeLabelSchema } from "@/lib/schemas";
import {
  getContainerFraction,
  validateCompliance,
  PPWR_NOTICE,
  type ContainerFraction,
  type MandatoryMarkingInputs,
} from "@/lib/legal-decisions";
import type { z } from "zod";
import type {
  AnalysisRowSchema as AnalysisRowSchemaType,
  AnalyzeLabelSchema as AnalyzeLabelSchemaType,
} from "@/lib/schemas";
import type { PackagingUse, InferenceMethod, PackagingAnalysis } from "@/types/analysis";
import { scanForProhibitedLanguage } from "@/lib/greenwashing-guard";

type AnalysisRow = z.infer<typeof AnalysisRowSchemaType>;
type AnalyzeLabel = z.infer<typeof AnalyzeLabelSchemaType>;

const CONFIDENCE_LABEL = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
} as const;

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

const CONTAINER_BADGE: Record<
  ContainerFraction,
  { label: string; className: string }
> = {
  amarillo: {
    label: "AMARILLO",
    className: "bg-yellow-300 text-yellow-900 font-bold text-xs px-2 py-0.5 rounded",
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

function confidenceTier(c: number): "high" | "medium" | "low" {
  if (c >= 0.8) return "high";
  if (c >= 0.5) return "medium";
  return "low";
}

function ConfidenceBadge({ value }: { value: number }) {
  const tier = confidenceTier(value);
  const variant =
    tier === "high" ? "success" : tier === "medium" ? "warning" : "destructive";
  return (
    <Badge variant={variant}>
      {CONFIDENCE_LABEL[tier]} ({Math.round(value * 100)}%)
    </Badge>
  );
}

export default async function AnalyzePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch analysis
  const { data, error } = await supabase
    .from("analyses")
    .select(
      "id, status, materials, overall_confidence, guided_query_required, legal_context, raw_response, products(name)"
    )
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const parsedAnalysis = AnalysisRowSchema.safeParse(data);
  if (!parsedAnalysis.success) {
    console.error("[analyze/page] Unexpected Supabase shape:", parsedAnalysis.error.issues);
    notFound();
  }
  const analysis: AnalysisRow = parsedAnalysis.data;

  // Greenwashing guard — Art. 13.3 RD 1055/2022
  const gwViolations = scanForProhibitedLanguage(
    [
      analysis.products?.name ?? "",
      (analysis.raw_response as PackagingAnalysis)?.notes ?? "",
    ].join(" ")
  );

  // Fetch latest label for this analysis
  const { data: labelData } = await supabase
    .from("labels")
    .select("id, svg_path, pdf_path, qr_url, version")
    .eq("analysis_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const parsedLabel = labelData ? AnalyzeLabelSchema.safeParse(labelData) : null;
  const label: AnalyzeLabel | null = parsedLabel?.success ? parsedLabel.data : null;

  // Signed URLs (admin client bypasses storage RLS)
  const adminClient = createAdminClient();
  const imagePath = analysis.raw_response?.image_path;

  const [imageSigned, svgSigned, pdfSigned] = await Promise.all([
    imagePath
      ? adminClient.storage.from("labels").createSignedUrl(imagePath, 3600)
      : Promise.resolve({ data: null }),
    label?.svg_path
      ? adminClient.storage.from("labels").createSignedUrl(label.svg_path, 86400)
      : Promise.resolve({ data: null }),
    label?.pdf_path
      ? adminClient.storage.from("labels").createSignedUrl(label.pdf_path, 86400)
      : Promise.resolve({ data: null }),
  ]);

  const imageUrl = imageSigned.data?.signedUrl ?? null;
  const svgUrl = svgSigned.data?.signedUrl ?? null;
  const pdfUrl = pdfSigned.data?.signedUrl ?? null;

  const packagingType = analysis.raw_response?.packaging_type ?? "—";
  const packagingUse: PackagingUse =
    (analysis.raw_response?.packaging_use as PackagingUse | undefined) ??
    "household";
  const markingInputs =
    (analysis.raw_response?.marking_inputs as MandatoryMarkingInputs | null | undefined) ??
    undefined;

  // Compute compliance for the right-panel checklist
  const complianceItems = validateCompliance(analysis.materials, packagingUse, markingInputs);
  const complianceDate = new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Análisis de envase</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {analysis.products?.name}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">← Dashboard</Link>
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* ── LEFT: BEFORE (product image + info) ── */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Antes
          </h2>

          {/* Product image */}
          <Card>
            <CardContent className="p-4 flex justify-center bg-gray-50 rounded-xl min-h-48">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Imagen del envase"
                  className="max-w-full max-h-80 object-contain rounded"
                />
              ) : (
                <div className="flex items-center justify-center w-full text-muted-foreground text-sm">
                  Sin imagen disponible
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product info */}
          <Card>
            <CardContent className="p-4 flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Producto</span>
                <span className="font-medium">{analysis.products?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tipo de envase</span>
                <span className="font-medium capitalize">{packagingType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Uso del envase</span>
                <span className="font-medium">
                  {PACKAGING_USE_LABEL[packagingUse]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Confianza global</span>
                <ConfidenceBadge value={analysis.overall_confidence ?? 0} />
              </div>
            </CardContent>
          </Card>

          {/* Delete */}
          <div className="pt-1">
            <DeleteAnalysisButton analysisId={id} />
          </div>
        </div>

        {/* ── RIGHT: AFTER (analysis result + label) ── */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Después
          </h2>

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
                  {(analysis.materials ?? []).map((m, i) => {
                    const fraction = getContainerFraction(
                      m.material_code,
                      m.material_abbrev
                    );
                    const badgeInfo = CONTAINER_BADGE[fraction];
                    const inferenceBadge = m.inference_method
                      ? INFERENCE_BADGE[m.inference_method as InferenceMethod]
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
                          <span className={badgeInfo.className}>
                            {badgeInfo.label}
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
                          <ConfidenceBadge value={m.confidence} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Legal context */}
          {analysis.legal_context && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Contexto legal (RD 1055/2022)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono leading-relaxed">
                  {analysis.legal_context}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Label preview */}
          {label ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Etiqueta generada
                  {label.version > 1 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      v{label.version}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {svgUrl && (
                  <div className="flex justify-center bg-gray-50 rounded-lg p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={svgUrl}
                      alt="Etiqueta de reciclaje"
                      className="max-w-full border shadow-sm rounded"
                      style={{ maxHeight: 320 }}
                    />
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {svgUrl && (
                    <Button asChild variant="outline" size="sm">
                      <a href={svgUrl} download={`etiqueta-${id.slice(0, 8)}.svg`}>
                        Descargar SVG
                      </a>
                    </Button>
                  )}
                  {pdfUrl && (
                    <Button asChild size="sm">
                      <a href={pdfUrl} download={`etiqueta-${id.slice(0, 8)}.pdf`}>
                        Descargar PDF
                      </a>
                    </Button>
                  )}
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/label/${label.id}`}>Ver página completa →</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-800">
                  La etiqueta se está generando o no pudo crearse. Vuelve en unos
                  segundos o{" "}
                  <Link href="/dashboard" className="underline">
                    vuelve al dashboard
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          )}

          {/* Greenwashing guard warning */}
          {gwViolations.length > 0 && (
            <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm">
              <p className="font-semibold text-red-700 mb-2">
                ⚠ Declaraciones medioambientales prohibidas (Art. 13.3 RD 1055/2022)
              </p>
              <ul className="list-disc pl-4 space-y-1 text-red-600">
                {gwViolations.map((v, i) => (
                  <li key={i}>
                    <span className="font-medium">{v.pattern}</span>
                    {v.severity === "warning" && (
                      <span className="ml-1 text-yellow-600 text-xs">(advertencia)</span>
                    )}
                    <span className="text-red-400 ml-1 text-xs">— {v.article}</span>
                  </li>
                ))}
              </ul>
              {gwViolations.some((v) => v.severity === "error") && (
                <p className="mt-2 text-xs text-red-500">
                  La generación de etiqueta está bloqueada. Edita el nombre del producto o las notas del análisis para eliminar los claims prohibidos.
                </p>
              )}
            </div>
          )}

          {/* Compliance checklist — two-section layout */}
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

            const mandatoryItems = complianceItems.filter(
              (item) => item.obligation !== "upcoming"
            );
            const upcomingItems = [
              ...complianceItems.filter((item) => item.obligation === "upcoming"),
              PPWR_NOTICE,
            ];

            const renderItem = (
              item: { check?: string; label?: string; passed?: boolean; detail?: string; article: string; obligation: "mandatory" | "voluntary" | "upcoming" },
              i: number
            ) => {
              const label = "check" in item ? item.check : item.label ?? "";
              const passed = "passed" in item ? item.passed : undefined;
              return (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span
                    className={`mt-0.5 shrink-0 text-[10px] font-bold px-1 py-0.5 rounded ${OBLIGATION_CHIP[item.obligation]}`}
                  >
                    {OBLIGATION_LABEL[item.obligation]}
                  </span>
                  {passed !== undefined && (
                    <span
                      className={`mt-0.5 shrink-0 font-bold ${
                        passed ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {passed ? "✓" : "✗"}
                    </span>
                  )}
                  {passed === undefined && (
                    <span className="mt-0.5 shrink-0 font-bold text-amber-600">⚠</span>
                  )}
                  <div>
                    <span
                      className={
                        passed === undefined
                          ? "text-amber-800"
                          : passed
                            ? "text-green-800"
                            : "text-red-700"
                      }
                    >
                      {label}
                    </span>
                    {item.detail && (
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{item.article}</p>
                  </div>
                </div>
              );
            };

            return (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Validación de cumplimiento</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-0">
                  {/* Mandatory section */}
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Obligaciones vigentes
                  </p>
                  <div className="flex flex-col gap-2 mb-4">
                    {mandatoryItems.map((item, i) => renderItem(item, i))}
                  </div>

                  {/* Upcoming section */}
                  {upcomingItems.length > 0 && (
                    <>
                      <div className="border-t my-2" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-2 mt-2">
                        Próximamente obligatorio
                      </p>
                      <div className="flex flex-col gap-2">
                        {upcomingItems.map((item, i) => renderItem(item as Parameters<typeof renderItem>[0], i))}
                      </div>
                    </>
                  )}

                  <p className="mt-3 text-xs text-muted-foreground border-t pt-2">
                    Documento generado conforme a la normativa vigente a fecha{" "}
                    {complianceDate}
                  </p>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
