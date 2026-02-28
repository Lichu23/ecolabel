import { notFound } from "next/navigation";
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LabelPageRowSchema } from "@/lib/schemas";
import {
  getContainerFraction,
  validateCompliance,
  PPWR_NOTICE,
  type ContainerFraction,
} from "@/lib/legal-decisions";
import type { PackagingUse } from "@/types/analysis";

export default async function LabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Use server client for auth / RLS check
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data, error } = await supabase
    .from("labels")
    .select(
      "id, version, svg_path, pdf_path, qr_url, created_at, products(name), companies(name, cif), analyses(materials, raw_response, overall_confidence)"
    )
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const parsed = LabelPageRowSchema.safeParse(data);
  if (!parsed.success) {
    console.error("[label/page] Unexpected Supabase shape:", parsed.error.issues);
    notFound();
  }
  const label = parsed.data;

  // Use service-role client to create signed URLs (bypasses storage RLS)
  const adminClient = createAdminClient();

  // 24-hour expiry so bookmarked label pages remain usable throughout the day
  const [{ data: svgSigned }, { data: pdfSigned }] = await Promise.all([
    adminClient.storage.from("labels").createSignedUrl(label.svg_path, 86400),
    adminClient.storage.from("labels").createSignedUrl(label.pdf_path, 86400),
  ]);

  const svgUrl = svgSigned?.signedUrl ?? null;
  const pdfUrl = pdfSigned?.signedUrl ?? null;

  const createdDate = new Date(label.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Compute compliance and material data for legal justification section
  const analysisData = label.analyses;
  const materials = analysisData?.materials ?? [];
  const packagingUse: PackagingUse =
    (analysisData?.raw_response?.packaging_use as PackagingUse | undefined) ?? "household";
  const complianceItems = validateCompliance(materials, packagingUse);

  const CONTAINER_BADGE: Record<ContainerFraction, { label: string; className: string }> = {
    amarillo: { label: "AMARILLO", className: "bg-yellow-300 text-yellow-900 font-bold text-xs px-2 py-0.5 rounded" },
    azul:     { label: "AZUL",     className: "bg-blue-600 text-white font-bold text-xs px-2 py-0.5 rounded" },
    verde:    { label: "VERDE",    className: "bg-green-800 text-white font-bold text-xs px-2 py-0.5 rounded" },
    otro:     { label: "OTRO",     className: "bg-gray-500 text-white font-bold text-xs px-2 py-0.5 rounded" },
  };

  const OBLIGATION_CHIP = {
    mandatory: "bg-green-800 text-white",
    voluntary: "bg-gray-500 text-white",
    upcoming:  "bg-amber-800 text-white",
  } as const;
  const OBLIGATION_LABEL = { mandatory: "OBL.", voluntary: "VOL.", upcoming: "PROX." } as const;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Etiqueta generada</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {label.products?.name} · {label.companies?.name} ·{" "}
            {label.companies?.cif} · v{label.version} · {createdDate}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">← Dashboard</Link>
        </Button>
      </div>

      {/* SVG preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vista previa</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center bg-gray-50 rounded-b-xl p-6">
          {svgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={svgUrl}
              alt="Etiqueta de envase"
              className="max-w-full border shadow-sm rounded"
              style={{ maxHeight: 400 }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No se pudo cargar la vista previa.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Download actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Descargas</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          {svgUrl && (
            <Button asChild variant="outline">
              <a href={svgUrl} download={`etiqueta-${id.slice(0, 8)}.svg`}>
                Descargar SVG
              </a>
            </Button>
          )}
          {pdfUrl && (
            <Button asChild>
              <a href={pdfUrl} download={`etiqueta-${id.slice(0, 8)}.pdf`}>
                Descargar PDF
              </a>
            </Button>
          )}
          {!svgUrl && !pdfUrl && (
            <p className="text-sm text-muted-foreground">
              Los archivos no están disponibles. Es posible que el bucket{" "}
              <code>labels</code> aún no esté configurado en Supabase.
            </p>
          )}
        </CardContent>
      </Card>

      {/* QR URL */}
      {label.qr_url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Justificación legal (QR)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground break-all">
              {label.qr_url}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Legal justification — material rows */}
      {materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Justificación legal completa</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* Per-material table */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Identificación de materiales
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Elemento</th>
                      <th className="pb-2 pr-4 font-medium">Artículo</th>
                      <th className="pb-2 font-medium">Fundamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m, i) => {
                      const fraction = getContainerFraction(m.material_code, m.material_abbrev);
                      const fractionBadge = CONTAINER_BADGE[fraction];
                      return (
                        <>
                          <tr key={`mat-${i}`} className="border-b">
                            <td className="py-2 pr-4 align-top">
                              <span className="font-medium">{m.part.toUpperCase()}</span>
                              {" — "}
                              {m.material_name}
                              {m.material_code && m.material_abbrev && (
                                <span className="ml-1 font-mono text-xs text-muted-foreground">
                                  ({m.material_code} {m.material_abbrev})
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-4 align-top text-xs text-gray-500 whitespace-nowrap">
                              Art. 13.1 RD 1055/2022
                            </td>
                            <td className="py-2 align-top text-xs text-muted-foreground">
                              Identificación obligatoria de materiales
                            </td>
                          </tr>
                          <tr key={`frac-${i}`} className="border-b last:border-0">
                            <td className="py-2 pr-4 align-top pl-4">
                              Fracción de recogida:{" "}
                              <span className={fractionBadge.className}>{fractionBadge.label}</span>
                            </td>
                            <td className="py-2 pr-4 align-top text-xs text-gray-500 whitespace-nowrap">
                              Art. 13.2 RD 1055/2022
                            </td>
                            <td className="py-2 align-top text-xs text-muted-foreground">
                              Indicación obligatoria (envase doméstico)
                            </td>
                          </tr>
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Full compliance table with obligation badges */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Cumplimiento normativo
              </p>
              <div className="flex flex-col gap-2">
                {[...complianceItems, PPWR_NOTICE].map((item, i) => {
                  const isCompliance = "passed" in item;
                  const passed = isCompliance ? (item as typeof complianceItems[0]).passed : undefined;
                  const checkLabel = "check" in item ? (item as typeof complianceItems[0]).check : (item as typeof PPWR_NOTICE).label;
                  return (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span
                        className={`shrink-0 text-[10px] font-bold px-1 py-0.5 rounded mt-0.5 ${OBLIGATION_CHIP[item.obligation]}`}
                      >
                        {OBLIGATION_LABEL[item.obligation]}
                      </span>
                      {passed !== undefined ? (
                        <span className={`shrink-0 font-bold mt-0.5 ${passed ? "text-green-700" : "text-red-600"}`}>
                          {passed ? "✓" : "✗"}
                        </span>
                      ) : (
                        <span className="shrink-0 font-bold mt-0.5 text-amber-600">⚠</span>
                      )}
                      <div>
                        <span className={passed === undefined ? "text-amber-800" : passed ? "text-green-800" : "text-red-700"}>
                          {checkLabel}
                        </span>
                        {item.detail && (
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">{item.article}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
