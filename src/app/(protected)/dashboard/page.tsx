import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArchiveButton } from "./ArchiveButton";
import { LabelRowArraySchema } from "@/lib/schemas";
import type { z } from "zod";
import type { LabelRowSchema } from "@/lib/schemas";

type LabelRow = z.infer<typeof LabelRowSchema>;

// ─── Status maps ──────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  string,
  "success" | "warning" | "secondary" | "destructive"
> = {
  completed: "success",
  needs_review: "warning",
  processing: "secondary",
  pending: "secondary",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Completado",
  needs_review: "Revisión",
  processing: "Procesando",
  pending: "Pendiente",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

// ─── Shared table component ───────────────────────────────────────────────────

function LabelTable({
  labels,
  showArchiveButton,
}: {
  labels: LabelRow[];
  showArchiveButton: boolean;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="px-6 py-3 font-medium">Producto</th>
          <th className="px-6 py-3 font-medium">Fecha</th>
          <th className="px-6 py-3 font-medium">Hora</th>
          <th className="px-6 py-3 font-medium">Confianza</th>
          <th className="px-6 py-3 font-medium">Estado</th>
          <th className="px-6 py-3 font-medium">Consulta guiada</th>
          <th className="px-6 py-3 font-medium">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {labels.map((label) => {
          const status = label.analyses?.status ?? "pending";
          const confidence = label.analyses?.overall_confidence;
          const guidedQuery = label.analyses?.guided_query_required;
          const { date, time } = formatTimestamp(label.created_at);

          return (
            <tr
              key={label.id}
              className="border-b last:border-0 hover:bg-muted/30 transition-colors"
            >
              <td className="px-6 py-3">
                {label.products?.name ?? "—"}
                {label.version > 1 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    v{label.version}
                  </span>
                )}
              </td>
              <td className="px-6 py-3 text-muted-foreground tabular-nums">
                {date}
              </td>
              <td className="px-6 py-3 text-muted-foreground tabular-nums">
                {time}
              </td>
              <td className="px-6 py-3 tabular-nums">
                {confidence != null
                  ? `${Math.round(confidence * 100)}%`
                  : "—"}
              </td>
              <td className="px-6 py-3">
                <Badge variant={STATUS_BADGE[status] ?? "secondary"}>
                  {STATUS_LABEL[status] ?? status}
                </Badge>
              </td>
              <td className="px-6 py-3">
                {guidedQuery ? (
                  <Badge variant="warning">Sí</Badge>
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </td>
              <td className="px-6 py-3 flex items-center gap-1">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/label/${label.id}`}>Ver</Link>
                </Button>
                {showArchiveButton && (
                  <ArchiveButton labelId={label.id} />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("user_id", user!.id)
    .single();

  const baseSelect = `id, version, created_at, is_archived, qr_url,
    products(name),
    analyses(overall_confidence, status, guided_query_required)`;

  const [{ data: activeLabels }, { data: archivedLabels }] = company
    ? await Promise.all([
        supabase
          .from("labels")
          .select(baseSelect)
          .eq("company_id", company.id)
          .eq("is_archived", false)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("labels")
          .select(baseSelect)
          .eq("company_id", company.id)
          .eq("is_archived", true)
          .order("created_at", { ascending: false })
          .limit(100),
      ])
    : [{ data: [] }, { data: [] }];

  const activeParsed = LabelRowArraySchema.safeParse(activeLabels ?? []);
  const archivedParsed = LabelRowArraySchema.safeParse(archivedLabels ?? []);

  if (!activeParsed.success) {
    console.error("[dashboard] Unexpected active labels shape:", activeParsed.error.issues);
  }
  if (!archivedParsed.success) {
    console.error("[dashboard] Unexpected archived labels shape:", archivedParsed.error.issues);
  }

  const active: LabelRow[] = activeParsed.success ? activeParsed.data : [];
  const archived: LabelRow[] = archivedParsed.success ? archivedParsed.data : [];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {company && (
            <p className="text-muted-foreground text-sm mt-1">{company.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {company && active.length + archived.length > 0 && (
            <Button asChild variant="outline" size="sm">
              <a href="/api/audit/export" download>
                Exportar CSV
              </a>
            </Button>
          )}
          <Button asChild>
            <Link href="/upload">+ Nueva análisis</Link>
          </Button>
        </div>
      </div>

      {/* ── No company warning ── */}
      {!company && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-base text-yellow-800">
              Configura tu empresa
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Antes de analizar envases necesitas registrar los datos de tu
              empresa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/settings">Ir a Ajustes →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Active labels ── */}
      {company && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Etiquetas activas</CardTitle>
            <CardDescription>
              {active.length > 0
                ? `${active.length} etiqueta${active.length === 1 ? "" : "s"} activa${active.length === 1 ? "" : "s"}`
                : "Aún no has generado ninguna etiqueta."}
            </CardDescription>
          </CardHeader>

          {active.length > 0 && (
            <CardContent className="p-0 overflow-x-auto">
              <LabelTable labels={active} showArchiveButton />
            </CardContent>
          )}

          {active.length === 0 && (
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sube la primera imagen de un envase para comenzar.
              </p>
              <Button asChild variant="outline">
                <Link href="/upload">Analizar primer envase →</Link>
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {/* ── Archived labels (audit trail) ── */}
      {company && archived.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">
              Historial de auditoría — archivadas
            </CardTitle>
            <CardDescription>
              {archived.length} registro{archived.length === 1 ? "" : "s"}{" "}
              archivado{archived.length === 1 ? "" : "s"}. Los registros son
              inmutables y se mantienen para inspecciones de cumplimiento.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <LabelTable labels={archived} showArchiveButton={false} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
