import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: analysisId } = await params;

  // Fetch analysis + related label + product (RLS ensures ownership)
  const { data: analysis, error: fetchError } = await supabase
    .from("analyses")
    .select(
      `id, raw_response,
       products ( id ),
       labels ( id, svg_path, pdf_path )`
    )
    .eq("id", analysisId)
    .single();

  if (fetchError || !analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  const adminClient = createAdminClient();

  // Delete storage files (non-fatal)
  const labels = Array.isArray(analysis.labels) ? analysis.labels : analysis.labels ? [analysis.labels] : [];
  const storageFiles: string[] = [];

  for (const label of labels) {
    if (label.svg_path) storageFiles.push(label.svg_path);
    if (label.pdf_path) storageFiles.push(label.pdf_path);
  }

  // Also remove the original source image
  const rawResponse = analysis.raw_response as Record<string, unknown> | null;
  if (rawResponse?.image_path && typeof rawResponse.image_path === "string") {
    storageFiles.push(rawResponse.image_path);
  }

  if (storageFiles.length > 0) {
    await adminClient.storage
      .from("labels")
      .remove(storageFiles)
      .catch((err) => console.error("[analyses/delete] Storage remove error:", err));
  }

  // Delete label rows
  for (const label of labels) {
    await supabase.from("labels").delete().eq("id", label.id);
  }

  // Delete analysis
  const { error: deleteAnalysisError } = await supabase
    .from("analyses")
    .delete()
    .eq("id", analysisId);

  if (deleteAnalysisError) {
    return NextResponse.json(
      { error: "Failed to delete analysis" },
      { status: 500 }
    );
  }

  // Delete product (normalise the join: Supabase types it as array | object)
  const product = Array.isArray(analysis.products)
    ? analysis.products[0]
    : analysis.products;
  if (product?.id) {
    await supabase.from("products").delete().eq("id", product.id);
  }

  return NextResponse.json({ success: true });
}
