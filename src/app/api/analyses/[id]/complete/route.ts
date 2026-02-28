import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
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

  let body: { guided_query_answers?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.guided_query_answers) {
    return NextResponse.json(
      { error: "guided_query_answers is required" },
      { status: 400 }
    );
  }

  // RLS ensures the user owns this analysis via company → product chain
  const { error } = await supabase
    .from("analyses")
    .update({
      guided_query_answers: body.guided_query_answers,
      status: "completed",
    })
    .eq("id", analysisId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
