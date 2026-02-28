"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { archiveLabel } from "./actions";

export function ArchiveButton({ labelId }: { labelId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        "¿Archivar esta etiqueta? El registro quedará en el historial de auditoría pero no aparecerá como activo."
      )
    )
      return;
    startTransition(() => { archiveLabel(labelId); });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-destructive"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "…" : "Archivar"}
    </Button>
  );
}
