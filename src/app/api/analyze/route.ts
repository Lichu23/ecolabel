import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzePackaging, canonicalPart, type ImageInput } from "@/lib/groq-vision";
import { searchLegalContext } from "@/lib/rag";
import { generateLabelSVG } from "@/lib/label-generator";
import { labelSvgToPdf } from "@/lib/label-to-pdf";
import {
  getContainerFraction,
  validateCompliance,
  REGULATORY_VERSION,
  type ContainerFraction,
  type MandatoryMarkingInputs,
} from "@/lib/legal-decisions";
import { lookupProductMaterials } from "@/lib/product-lookup";
import type { DetectedMaterial, PackagingUse } from "@/types/analysis";

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const imageFiles = formData.getAll("image") as File[];
  const packagingUse =
    (formData.get("packaging_use") as string | null) ?? "household";
  const productName =
    (formData.get("product_name") as string | null)?.trim() ?? "Producto";

  let markingInputs: MandatoryMarkingInputs | undefined;
  try {
    const raw = formData.get("marking_inputs") as string | null;
    if (raw) markingInputs = JSON.parse(raw) as MandatoryMarkingInputs;
  } catch {
    markingInputs = undefined;
  }

  if (imageFiles.length === 0) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  // 3. Validate image types (max 5 images)
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const MAX_IMAGES = 5;
  const validFiles = imageFiles.slice(0, MAX_IMAGES);
  for (const f of validFiles) {
    if (!allowedTypes.includes(f.type)) {
      return NextResponse.json(
        { error: "All images must be JPEG, PNG or WebP" },
        { status: 400 }
      );
    }
  }

  // 4. Convert all images to base64
  const images: ImageInput[] = await Promise.all(
    validFiles.map(async (f) => ({
      base64: Buffer.from(await f.arrayBuffer()).toString("base64"),
      mimeType: f.type as ImageInput["mimeType"],
    }))
  );

  // 5. Run Groq Vision analysis (55 s timeout)
  let analysis;
  try {
    analysis = await Promise.race([
      analyzePackaging(images),
      new Promise<never>((_, reject) =>
        AbortSignal.timeout(55_000).addEventListener("abort", () =>
          reject(new Error("Groq vision analysis timed out after 55 seconds"))
        )
      ),
    ]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Vision analysis failed" },
      { status: 502 }
    );
  }

  // DEBUG — log raw Groq materials before any merging
  console.log("[analyze] Groq raw materials:", analysis.materials.map((m) => `${m.part} (${m.material_code})`));

  // 5b. Apply product lookup table — merge lookup materials into AI result
  const lookupMaterials = lookupProductMaterials(productName, analysis);
  if (lookupMaterials) {
    // Build a map of lookup materials keyed by canonical part name so that
    // "tapa" (AI) matches "tapón" (lookup) via the same synonym normalisation.
    const lookupByPart = new Map<string, DetectedMaterial>(
      lookupMaterials.map((m) => [canonicalPart(m.part), m])
    );

    // Merge: for each AI material, check if a lookup entry covers the same part.
    // Always delete the matched key so it is NOT appended as "remaining" later.
    // Override AI result only when AI is uncertain (confidence < 0.8 or no code).
    const mergedMaterials = analysis.materials.map((aiMat) => {
      const key = canonicalPart(aiMat.part);
      const matched = lookupByPart.get(key);
      if (matched) {
        lookupByPart.delete(key); // always consume — prevents duplicate append
        const aiIsConfident = aiMat.confidence >= 0.8 && aiMat.material_code !== null;
        if (!aiIsConfident) {
          return {
            ...matched,
            visual_evidence: aiMat.visual_evidence || matched.visual_evidence,
          };
        }
      }
      return aiMat;
    });

    // Append any lookup materials whose parts weren't in the AI result
    for (const remaining of lookupByPart.values()) {
      mergedMaterials.push(remaining);
    }

    analysis = { ...analysis, materials: mergedMaterials };
  }

  // DEBUG — log materials after lookup merge
  console.log("[analyze] After lookup merge:", analysis.materials.map((m) => `${m.part} (${m.material_code})`));

  // Safety deduplication after lookup merge — the lookup can reintroduce
  // duplicates if Groq already returned a part twice and the lookup key was
  // consumed on the first match, letting the second copy through unchanged.
  {
    const seen = new Map<string, DetectedMaterial>();
    for (const mat of analysis.materials) {
      const key = mat.part.toLowerCase().trim();
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, mat);
      } else {
        const betterConfidence = mat.confidence > existing.confidence;
        const sameConfidenceButHasCode =
          mat.confidence === existing.confidence &&
          mat.material_code !== null &&
          existing.material_code === null;
        if (betterConfidence || sameConfidenceButHasCode) seen.set(key, mat);
      }
    }
    analysis = { ...analysis, materials: Array.from(seen.values()) };
  }

  console.log("[analyze] Final materials sent to client:", analysis.materials.map((m) => `${m.part} (${m.material_code})`));

  // 6. RAG legal context
  const materialQuery = analysis.materials
    .map((m) => `${m.material_name} ${m.material_abbrev ?? ""} envase`)
    .join(", ");

  let legalContext = "";
  try {
    legalContext = await searchLegalContext(materialQuery);
  } catch {
    legalContext = "No se pudo obtener contexto legal en este momento.";
  }

  // 7. Compute container fractions + compliance (always, used in preview and label)
  const containerFractions: Record<string, ContainerFraction> = {};
  for (const m of analysis.materials) {
    containerFractions[m.part] = getContainerFraction(
      m.material_code,
      m.material_abbrev
    );
  }
  const complianceItems = validateCompliance(
    analysis.materials,
    packagingUse as PackagingUse,
    markingInputs
  );

  // 8. Generate label SVG + PDF preview (no DB writes — uses "preview" as analysisId)
  let labelSvg: string | null = null;
  let labelPdf: string | null = null;
  try {
    const { data: company } = await supabase
      .from("companies")
      .select("name, cif")
      .eq("user_id", user.id)
      .single();

    if (company) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        `https://${request.headers.get("host")}`;

      const { svg } = await generateLabelSVG({
        companyName: company.name,
        cif: company.cif,
        productName,
        materials: analysis.materials,
        analysisId: "preview",
        baseUrl,
        packagingUse: packagingUse as PackagingUse,
        containerFractions,
        complianceItems,
        marking: markingInputs,
        regulatoryVersion: REGULATORY_VERSION,
        generatedAt: new Date().toISOString(),
      });
      labelSvg = svg;

      const pdfBuffer = await labelSvgToPdf(svg);
      labelPdf = pdfBuffer.toString("base64");
    }
  } catch {
    labelSvg = null;
    labelPdf = null;
  }

  return NextResponse.json({
    analysis: { ...analysis, packaging_use: packagingUse },
    legal_context: legalContext,
    label_svg: labelSvg,
    label_pdf: labelPdf,
    container_fractions: containerFractions,
    compliance_items: complianceItems,
  });
}
