"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PackagingAnalysis, DetectedMaterial, PackagingUse } from "@/types/analysis";

interface Props {
  analysis: PackagingAnalysis;
  productName: string;
  packagingUse: PackagingUse;
  onComplete: (updatedAnalysis: PackagingAnalysis) => void;
  onBack: () => void;
}

export function MaterialDecomposer({
  analysis,
  onComplete,
  onBack,
}: Props) {
  const materials = analysis.materials;

  // undefined = unanswered, true = separable, false = inseparable
  const [separability, setSeparability] = useState<Record<number, boolean | undefined>>(
    () => Object.fromEntries(materials.map((_, i) => [i, undefined]))
  );

  const allAnswered = materials.every((_, i) => separability[i] !== undefined);

  function handleComplete() {
    if (!allAnswered) return;

    const updatedMaterials: DetectedMaterial[] = materials.map((m, i) => ({
      ...m,
      separability: separability[i] ? "separable" : "inseparable",
    }));

    onComplete({ ...analysis, materials: updatedMaterials });
  }

  return (
    <div className="max-w-lg">
      <div className="mb-4">
        <h1 className="text-xl font-bold">Separabilidad de componentes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Indica si cada componente puede separarse del envase antes de desecharlo.
          Esto determina si se etiquetan individualmente o como conjunto compuesto.
        </p>
      </div>

      <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
        <strong>¿Por qué importa?</strong> Los componentes separables se etiquetan individualmente
        con su código de material. Los inseparables se tratan como un conjunto compuesto
        conforme a la Decisión 97/129/CE.
      </div>

      <div className="flex flex-col gap-3">
        {materials.map((m, i) => {
          const answered = separability[i] !== undefined;
          const isSeparable = separability[i] === true;

          return (
            <Card
              key={i}
              className={
                answered
                  ? isSeparable
                    ? "border-green-300 bg-green-50"
                    : "border-orange-300 bg-orange-50"
                  : "border-gray-200"
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{m.part}</span>
                  {m.material_abbrev && (
                    <span className="text-xs text-muted-foreground">
                      {m.material_abbrev}
                      {m.material_code ? ` (${m.material_code})` : ""}
                    </span>
                  )}
                </div>
                <p className="text-sm mb-3">
                  ¿El <strong>{m.part}</strong> puede separarse del envase antes de desecharlo?
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={separability[i] === true ? "default" : "outline"}
                    className="flex-1"
                    onClick={() =>
                      setSeparability((prev) => ({ ...prev, [i]: true }))
                    }
                  >
                    Sí, es separable
                  </Button>
                  <Button
                    size="sm"
                    variant={separability[i] === false ? "default" : "outline"}
                    className="flex-1"
                    onClick={() =>
                      setSeparability((prev) => ({ ...prev, [i]: false }))
                    }
                  >
                    No, es inseparable
                  </Button>
                </div>
                {answered && (
                  <p className="text-xs mt-2 font-medium">
                    {isSeparable ? (
                      <span className="text-green-700">
                        ✓ Se etiquetará individualmente con su código de material
                      </span>
                    ) : (
                      <span className="text-orange-700">
                        ✓ Se tratará como parte de un conjunto compuesto (Decisión 97/129/CE)
                      </span>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={onBack}>
          ← Atrás
        </Button>
        <Button onClick={handleComplete} disabled={!allAnswered} className="flex-1">
          Continuar →
        </Button>
      </div>

      {!allAnswered && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Responde todas las preguntas para continuar.
        </p>
      )}
    </div>
  );
}
