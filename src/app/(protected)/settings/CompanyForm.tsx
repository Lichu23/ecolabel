"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CompanyFormProps {
  saveCompany: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  defaultValues?: {
    name: string;
    cif: string;
    address: string | null;
    phone: string | null;
    whatsapp_number: string | null;
  };
}

export function CompanyForm({ saveCompany, defaultValues }: CompanyFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await saveCompany(formData);
      if (result.error) setError(result.error);
      else setSuccess(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre de la empresa *</Label>
        <Input
          id="name"
          name="name"
          placeholder="Acme Packaging S.L."
          defaultValue={defaultValues?.name ?? ""}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cif">CIF *</Label>
        <Input
          id="cif"
          name="cif"
          placeholder="B12345678"
          defaultValue={defaultValues?.cif ?? ""}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          name="address"
          placeholder="Calle Ejemplo 1, 28001 Madrid"
          defaultValue={defaultValues?.address ?? ""}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+34 91 000 0000"
          defaultValue={defaultValues?.phone ?? ""}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="whatsapp_number">WhatsApp (para notificaciones)</Label>
        <Input
          id="whatsapp_number"
          name="whatsapp_number"
          type="tel"
          placeholder="+34 600 000 000"
          defaultValue={defaultValues?.whatsapp_number ?? ""}
        />
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Datos guardados correctamente.
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
