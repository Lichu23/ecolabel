import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateLabelSVG } from "@/lib/label-generator";
import { labelSvgToPdf } from "@/lib/label-to-pdf";
import { sendLabelNotification } from "@/lib/whatsapp";
import { AnalysisGenerateRowSchema } from "@/lib/schemas";
import {
  getContainerFraction,
  validateCompliance,
  REGULATORY_VERSION,
  type ContainerFraction,
  type MandatoryMarkingInputs,
} from "@/lib/legal-decisions";
import { scanForProhibitedLanguage, hasBlockingViolations } from "@/lib/greenwashing-guard";
import type { z } from "zod";
import type { AnalysisGenerateRowSchema as AnalysisGenerateRowSchemaType } from "@/lib/schemas";
import type { PackagingUse, PackagingAnalysis } from "@/types/analysis";

type AnalysisRow = z.infer<typeof AnalysisGenerateRowSchemaType>;

// ─── POST /api/label/generate ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let body: { analysis_id?: string; packaging_use?: PackagingUse };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { analysis_id, packaging_use: packagingUse = "household" } = body;
  if (!analysis_id) {
    return NextResponse.json(
      { error: "analysis_id is required" },
      { status: 400 }
    );
  }

  // 3. Fetch analysis + product + company (RLS ensures ownership)
  const { data: analysis, error: fetchError } = await supabase
    .from("analyses")
    .select(
      `id, status, materials, raw_response,
       products (
         id, name, company_id,
         companies ( id, name, cif, whatsapp_number )
       )`
    )
    .eq("id", analysis_id)
    .single();

  if (fetchError || !analysis) {
    return NextResponse.json(
      { error: "Analysis not found or access denied" },
      { status: 404 }
    );
  }

  const parsed = AnalysisGenerateRowSchema.safeParse(analysis);
  if (!parsed.success) {
    console.error("[label/generate] Unexpected Supabase shape:", parsed.error.issues);
    return NextResponse.json({ error: "Unexpected data shape from database" }, { status: 500 });
  }
  const row: AnalysisRow = parsed.data;

  if (!row.materials || row.materials.length === 0) {
    return NextResponse.json(
      { error: "Analysis has no materials — run vision analysis first" },
      { status: 422 }
    );
  }

  // ── Greenwashing guard — Art. 13.3 RD 1055/2022 ──────────────────────────
  const textsToScan = [
    row.products?.name ?? "",
    (row.raw_response as PackagingAnalysis)?.notes ?? "",
  ].join(" ");

  const gwViolations = scanForProhibitedLanguage(textsToScan);
  if (hasBlockingViolations(gwViolations)) {
    return NextResponse.json(
      {
        error:
          "La etiqueta contiene declaraciones medioambientales genéricas prohibidas por el Art. 13.3 del RD 1055/2022 y la Directiva UE 2024/825. Elimina o certifica los claims antes de generar la etiqueta.",
        violations: gwViolations.filter((v) => v.severity === "error"),
        article: "Art. 13.3 RD 1055/2022 (BOE-A-2022-22199)",
      },
      { status: 400 }
    );
  }

  const product = row.products;
  const company = product.companies;

  // 4. Generate SVG label
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    `https://${request.headers.get("host")}`;

  // Extract marking_inputs stored in raw_response during save
  let markingInputs: MandatoryMarkingInputs | undefined;
  try {
    const rawResp = row.raw_response as Record<string, unknown> | null;
    if (rawResp?.marking_inputs && typeof rawResp.marking_inputs === "object") {
      markingInputs = rawResp.marking_inputs as MandatoryMarkingInputs;
    }
  } catch { /* non-fatal — compliance items 6-9 simply won't appear */ }

  // Compute container fractions and compliance checklist
  const containerFractions: Record<string, ContainerFraction> = {};
  for (const m of row.materials) {
    containerFractions[m.part] = getContainerFraction(
      m.material_code,
      m.material_abbrev
    );
  }
  const complianceItems = validateCompliance(row.materials, packagingUse, markingInputs);

  let svg: string;
  let qrUrl: string;

  try {
    ({ svg, qrUrl } = await generateLabelSVG({
      companyName: company.name,
      cif: company.cif,
      productName: product.name,
      materials: row.materials,
      analysisId: analysis_id,
      baseUrl,
      packagingUse,
      containerFractions,
      complianceItems,
      marking: markingInputs,
      regulatoryVersion: REGULATORY_VERSION,
      generatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    return NextResponse.json(
      {
        error: `Label SVG generation failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }

  // 5. Convert SVG → PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await labelSvgToPdf(svg);
  } catch (err) {
    return NextResponse.json(
      {
        error: `PDF conversion failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }

  // 6. Upload to Supabase Storage — bucket: "labels"
  // Path: labels/{company_id}/{analysis_id}/label.svg & label.pdf
  // Uses service-role client to bypass storage RLS (auth already verified above).
  const adminClient = createAdminClient();
  const storagePath = `${company.id}/${analysis_id}`;

  const { error: svgUploadError } = await adminClient.storage
    .from("labels")
    .upload(`${storagePath}/label.svg`, Buffer.from(svg, "utf-8"), {
      contentType: "image/svg+xml",
      upsert: true,
    });

  if (svgUploadError) {
    return NextResponse.json(
      { error: `SVG upload failed: ${svgUploadError.message}` },
      { status: 500 }
    );
  }

  const { error: pdfUploadError } = await adminClient.storage
    .from("labels")
    .upload(`${storagePath}/label.pdf`, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (pdfUploadError) {
    return NextResponse.json(
      { error: `PDF upload failed: ${pdfUploadError.message}` },
      { status: 500 }
    );
  }

  // 7. Get signed URLs (valid 24 hours)
  const { data: svgSigned } = await adminClient.storage
    .from("labels")
    .createSignedUrl(`${storagePath}/label.svg`, 86400);

  const { data: pdfSigned } = await adminClient.storage
    .from("labels")
    .createSignedUrl(`${storagePath}/label.pdf`, 86400);

  // 8. Insert into labels table
  const { data: labelRow, error: insertError } = await supabase
    .from("labels")
    .insert({
      analysis_id,
      product_id: product.id,
      company_id: company.id,
      svg_path: `${storagePath}/label.svg`,
      pdf_path: `${storagePath}/label.pdf`,
      qr_url: qrUrl,
    })
    .select("id, version")
    .single();

  if (insertError || !labelRow) {
    return NextResponse.json(
      { error: "Failed to create label record in database" },
      { status: 500 }
    );
  }

  // 9. Fire WhatsApp notification (non-blocking — never fails the request)
  if (company.whatsapp_number) {
    sendLabelNotification({
      toPhone: company.whatsapp_number,
      companyName: company.name,
      productName: product.name,
      materials: row.materials,
      pdfUrl: pdfSigned?.signedUrl ?? null,
      analysisId: analysis_id,
    }).catch((err) =>
      console.error("[WhatsApp] Notification dispatch error:", err)
    );
  }

  // 10. Return URLs
  return NextResponse.json({
    label_id: labelRow.id,
    version: labelRow.version,
    svg_url: svgSigned?.signedUrl ?? null,
    pdf_url: pdfSigned?.signedUrl ?? null,
    qr_url: qrUrl,
  });
}
