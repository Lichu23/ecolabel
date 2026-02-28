"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteAnalysisButton({ analysisId }: { analysisId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/analyses/${analysisId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al eliminar el análisis.");
        setConfirming(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          ¿Seguro que quieres eliminar este análisis? Se borrará la etiqueta y
          los archivos asociados.
        </p>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? "Eliminando…" : "Sí, eliminar"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setConfirming(false)}
          >
            Cancelar
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
      onClick={() => setConfirming(true)}
    >
      Eliminar análisis
    </Button>
  );
}
