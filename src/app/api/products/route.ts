import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Product name is required" },
      { status: 400 }
    );
  }

  // Resolve company for this user
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

  const { data: product, error } = await supabase
    .from("products")
    .insert({ name, company_id: company.id })
    .select("id")
    .single();

  if (error || !product) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create product" },
      { status: 500 }
    );
  }

  return NextResponse.json({ product_id: product.id }, { status: 201 });
}
