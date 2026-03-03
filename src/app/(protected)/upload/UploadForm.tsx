"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PackagingUse } from "@/types/analysis";

const PACKAGING_USE_LABEL: Record<PackagingUse, string> = {
  household: "Doméstico",
  commercial: "Comercial",
  industrial: "Industrial",
};

const MAX_IMAGES = 5;

interface Props {
  companyName: string;
  packagingUse: PackagingUse;
  isPending: boolean;
  error: string | null;
  files: File[];
  filePreviews: string[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onFilesAdd: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  onChangePackagingType: () => void;
}

export function UploadForm({
  companyName,
  packagingUse,
  isPending,
  error,
  files,
  filePreviews,
  onSubmit,
  onFilesAdd,
  onFileRemove,
  onChangePackagingType,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) onFilesAdd(dropped);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) onFilesAdd(selected);
    e.target.value = "";
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Analizar envase</h1>
      <Card>
        <CardHeader>
          <CardTitle>Subir imagen del envase</CardTitle>
          <p className="text-sm text-muted-foreground">
            La IA identificará los materiales y generará el etiquetado conforme
            al RD&nbsp;1055/2022. Empresa: <strong>{companyName}</strong>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product_name">Nombre del producto *</Label>
              <Input
                id="product_name"
                name="product_name"
                placeholder="Ej: Botella de agua 500ml"
                required
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Tipo de envase</Label>
              <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm">
                <span className="font-medium">{PACKAGING_USE_LABEL[packagingUse]}</span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
                  disabled={isPending}
                  onClick={onChangePackagingType}
                >
                  Cambiar
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Clasificado según Art. 2 RD 1055/2022.{" "}
                {packagingUse === "household"
                  ? "Sujeto a indicación de fracción de recogida (Art. 13.2)."
                  : "Exento de indicación de fracción de recogida (Art. 13.2)."}
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              className={`rounded-lg border-2 border-dashed transition-colors ${
                dragging ? "border-green-500 bg-green-50" : "border-gray-300"
              }`}
            >
              {files.length === 0 ? (
                <button
                  type="button"
                  className="flex w-full flex-col items-center justify-center gap-2 p-10 text-center cursor-pointer hover:bg-gray-50 rounded-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                >
                  <span className="text-3xl text-muted-foreground">📷</span>
                  <p className="text-sm text-muted-foreground">
                    Arrastra imágenes aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG · PNG · WebP · Hasta {MAX_IMAGES} fotos
                  </p>
                </button>
              ) : (
                <div className="p-3 flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={filePreviews[i]}
                          alt={f.name}
                          className="h-20 w-20 object-cover rounded border"
                        />
                        {i === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold bg-green-600 text-white rounded-b py-0.5">
                            Principal
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onFileRemove(i)}
                          disabled={isPending}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Eliminar imagen"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {files.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPending}
                        className="h-20 w-20 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-600 transition-colors text-xl"
                        aria-label="Añadir más imágenes"
                      >
                        +
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {files.length}/{MAX_IMAGES} imágenes · la primera es la vista principal
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isPending}
              />
            </div>

            {error && (
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button type="submit" disabled={isPending || !files.length}>
              Analizar envase
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
