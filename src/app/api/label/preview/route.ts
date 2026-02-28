import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLabelSVG } from "@/lib/label-generator";
import { labelSvgToPdf } from "@/lib/label-to-pdf";
import {
  getContainerFraction,
  validateCompliance,
  REGULATORY_VERSION,
  type ContainerFraction,
  type MandatoryMarkingInputs,
} from "@/lib/legal-decisions";
import type { PackagingAnalysis, PackagingUse } from "@/types/analysis";

/**
 * POST /api/label/preview
 *
 * Recomputes SVG + container fractions + compliance after user material corrections.
 * No DB writes — returns { label_svg, container_fractions, compliance_items }.
 */
export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse JSON body
  let body: {
    analysis: PackagingAnalysis;
    packaging_use: PackagingUse;
    product_name: string;
    marking_inputs?: MandatoryMarkingInputs;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { analysis, packaging_use, product_name, marking_inputs } = body;

  if (!analysis || !packaging_use || !product_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 3. Fetch company info
  const { data: company } = await supabase
    .from("companies")
    .select("name, cif")
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Company not found. Configure it in Settings." }, { status: 404 });
  }

  // 4. Compute container fractions
  const containerFractions: Record<string, ContainerFraction> = {};
  for (const m of analysis.materials) {
    containerFractions[m.part] = getContainerFraction(m.material_code, m.material_abbrev);
  }

  // 5. Validate compliance
  const complianceItems = validateCompliance(analysis.materials, packaging_use, marking_inputs);

  // 6. Generate label SVG + PDF
  let labelSvg: string | null = null;
  let labelPdf: string | null = null;
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      `https://${request.headers.get("host")}`;

    const { svg } = await generateLabelSVG({
      companyName: company.name,
      cif: company.cif,
      productName: product_name,
      materials: analysis.materials,
      analysisId: "preview",
      baseUrl,
      packagingUse: packaging_use,
      containerFractions,
      complianceItems,
      marking: marking_inputs,
      regulatoryVersion: REGULATORY_VERSION,
      generatedAt: new Date().toISOString(),
    });
    labelSvg = svg;

    const pdfBuffer = await labelSvgToPdf(svg);
    labelPdf = pdfBuffer.toString("base64");
  } catch {
    labelSvg = null;
    labelPdf = null;
  }

  return NextResponse.json({
    label_svg: labelSvg,
    label_pdf: labelPdf,
    container_fractions: containerFractions,
    compliance_items: complianceItems,
  });
}
