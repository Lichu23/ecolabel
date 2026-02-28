import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AuditLabelRowArraySchema } from "@/lib/schemas";
import type { z } from "zod";
import type { AuditLabelRowSchema } from "@/lib/schemas";

type AuditLabelRow = z.infer<typeof AuditLabelRowSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Prefix formula injection characters to prevent Excel execution
  const safe = /^[=+\-@\t\r]/.test(str) ? `\t${str}` : str;
  // Wrap in quotes if it contains comma, newline or double-quote
  if (safe.includes(",") || safe.includes("\n") || safe.includes('"')) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function rowToCsv(label: AuditLabelRow): string {
  const materials =
    label.analyses?.materials
      ?.map((m) => `${m.part}:${m.material_abbrev ?? m.material_name}`)
      .join("; ") ?? "";

  const fields = [
    label.id,
    label.products?.name ?? "",
    label.companies?.name ?? "",
    label.companies?.cif ?? "",
    new Date(label.created_at).toLocaleDateString("es-ES"),
    new Date(label.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    label.version,
    label.analyses?.status ?? "",
    label.analyses?.overall_confidence != null
      ? `${Math.round(label.analyses.overall_confidence * 100)}%`
      : "",
    label.analyses?.guided_query_required ? "Sí" : "No",
    materials,
    label.is_archived ? "Sí" : "No",
    label.qr_url ?? "",
  ];

  return fields.map(escapeCsvField).join(",");
}

// ─── GET /api/audit/export ────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Get user's company
  const { data: company } = await supabase
    .from("companies")
    .select("id, name, cif")
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json(
      { error: "No company found for this user" },
      { status: 404 }
    );
  }

  // 2. Fetch all labels (active + archived) with full audit data
  const { data: labels, error } = await supabase
    .from("labels")
    .select(
      `id, version, created_at, is_archived, qr_url,
       products(name),
       companies(name, cif),
       analyses(status, overall_confidence, guided_query_required, materials)`
    )
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const parsed = AuditLabelRowArraySchema.safeParse(labels ?? []);
  if (!parsed.success) {
    console.error("[audit/export] Unexpected Supabase shape:", parsed.error.issues);
    return NextResponse.json({ error: "Unexpected data shape from database" }, { status: 500 });
  }
  const rows: AuditLabelRow[] = parsed.data;

  // 3. Build CSV
  const header =
    "ID,Producto,Empresa,CIF,Fecha,Hora,Versión,Estado,Confianza IA,Consulta Guiada,Materiales,Archivada,URL QR";

  const csvLines = [header, ...rows.map(rowToCsv)].join("\r\n");

  // 4. Return as downloadable file
  const filename = `auditoria_etiquetas_${company.cif}_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return new NextResponse(csvLines, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
