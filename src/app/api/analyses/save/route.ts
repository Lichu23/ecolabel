import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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

  const productName = (formData.get("product_name") as string | null)?.trim();
  const packagingUse =
    (formData.get("packaging_use") as string | null) ?? "household";
  const analysisJson = formData.get("analysis") as string | null;
  const legalContext = (formData.get("legal_context") as string | null) ?? "";
  const imageFile = formData.get("image") as File | null;

  let markingInputs = null;
  try {
    const raw = formData.get("marking_inputs") as string | null;
    if (raw) markingInputs = JSON.parse(raw);
  } catch {
    markingInputs = null;
  }

  if (!productName) {
    return NextResponse.json(
      { error: "product_name is required" },
      { status: 400 }
    );
  }
  if (!analysisJson) {
    return NextResponse.json(
      { error: "analysis is required" },
      { status: 400 }
    );
  }
  if (!imageFile) {
    return NextResponse.json({ error: "image is required" }, { status: 400 });
  }

  let analysis;
  try {
    analysis = JSON.parse(analysisJson);
  } catch {
    return NextResponse.json(
      { error: "Invalid analysis JSON" },
      { status: 400 }
    );
  }

  // 3. Check company
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json(
      {
        error:
          "Company profile not set up. Go to /settings to create your company first.",
        code: "NO_COMPANY",
      },
      { status: 422 }
    );
  }

  // 4. Create product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({ name: productName, company_id: company.id })
    .select("id")
    .single();

  if (productError || !product) {
    return NextResponse.json(
      { error: productError?.message ?? "Failed to create product" },
      { status: 500 }
    );
  }

  // 5. Create analysis record
  const { data: analysisRow, error: insertError } = await supabase
    .from("analyses")
    .insert({ product_id: product.id, status: "processing" })
    .select("id")
    .single();

  if (insertError || !analysisRow) {
    return NextResponse.json(
      { error: "Failed to create analysis record" },
      { status: 500 }
    );
  }

  const analysisId = analysisRow.id;

  // 6. Upload image to storage
  const arrayBuffer = await imageFile.arrayBuffer();
  const imageBytes = Buffer.from(arrayBuffer);
  const mimeType = imageFile.type;
  const ext =
    mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const sourcePath = `${company.id}/${analysisId}/source.${ext}`;

  const adminClient = createAdminClient();
  await adminClient.storage
    .from("labels")
    .upload(sourcePath, imageBytes, { contentType: mimeType, upsert: true })
    .catch((err) => console.error("[analyses/save] Image upload error:", err));

  // 7. Save completed analysis
  const rawResponse = {
    ...analysis,
    image_path: sourcePath,
    packaging_use: packagingUse,
    marking_inputs: markingInputs,
  };

  const { error: updateError } = await supabase
    .from("analyses")
    .update({
      status: "completed",
      raw_response: rawResponse,
      materials: analysis.materials,
      overall_confidence: analysis.overall_confidence,
      guided_query_required: analysis.guided_query_required,
      legal_context: legalContext,
    })
    .eq("id", analysisId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to save analysis" },
      { status: 500 }
    );
  }

  // 8. Auto-generate label
  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";

  const generateRes = await fetch(`${protocol}://${host}/api/label/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") ?? "",
    },
    body: JSON.stringify({ analysis_id: analysisId, packaging_use: packagingUse }),
  }).catch(() => null);

  const generateData = generateRes?.ok ? await generateRes.json() : null;

  return NextResponse.json({
    analysis_id: analysisId,
    label_id: generateData?.label_id ?? null,
  });
}
