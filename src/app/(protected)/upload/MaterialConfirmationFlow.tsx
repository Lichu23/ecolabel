"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PackagingAnalysis, DetectedMaterial, PackagingUse } from "@/types/analysis";

// ── Types ──────────────────────────────────────────────────────────────────

interface ComplianceItem {
  check: string;
  passed: boolean;
  detail?: string;
}

export interface ConfirmingData {
  analysis: PackagingAnalysis;
  legalContext: string;
  labelSvg: string | null;
  labelPdf: string | null;
  containerFractions: Record<string, string>;
  complianceItems: ComplianceItem[];
  productName: string;
  packagingUse: PackagingUse;
  imageFile: File;
  imageObjectUrl: string;
}

interface Props {
  data: ConfirmingData;
  onComplete: (correctedAnalysis: PackagingAnalysis) => void;
  onBack: () => void;
}

interface MaterialCorrection {
  tier2Confirmed?: boolean;   // undefined = unanswered
  material_code?: string;
  material_abbrev?: string;
  material_name?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const MATERIAL_OPTIONS = [
  { code: "01", abbrev: "PET",  name: "Polietileno tereftalato" },
  { code: "02", abbrev: "HDPE", name: "Polietileno de alta densidad" },
  { code: "03", abbrev: "PVC",  name: "Cloruro de polivinilo" },
  { code: "04", abbrev: "LDPE", name: "Polietileno de baja densidad" },
  { code: "05", abbrev: "PP",   name: "Polipropileno" },
  { code: "06", abbrev: "PS",   name: "Poliestireno" },
  { code: "20", abbrev: "PAP",  name: "Cartón ondulado" },
  { code: "21", abbrev: "PAP",  name: "Cartón" },
  { code: "22", abbrev: "PAP",  name: "Papel" },
  { code: "40", abbrev: "FE",   name: "Acero" },
  { code: "41", abbrev: "ALU",  name: "Aluminio" },
  { code: "70", abbrev: "GL",   name: "Vidrio incoloro" },
];

// ── Tier classification ────────────────────────────────────────────────────

type Tier = 1 | 2 | 3;

function getTier(m: DetectedMaterial): Tier {
  if (m.confidence >= 0.8 && m.material_code !== null) return 1;
  if (m.confidence >= 0.8 && m.material_code === null) return 2;
  return 3;
}

// ── Tier 3 form (shared by native Tier 3 and Tier 2 escalated) ────────────

interface Tier3FormProps {
  material: DetectedMaterial;
  correction: MaterialCorrection;
  onChange: (c: MaterialCorrection) => void;
}

function Tier3Form({ material, correction, onChange }: Tier3FormProps) {
  const selectedOption = MATERIAL_OPTIONS.find(
    (o) => o.code === correction.material_code
  );

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const opt = MATERIAL_OPTIONS.find((o) => o.code === e.target.value);
    if (!opt) {
      onChange({ ...correction, material_code: undefined, material_abbrev: undefined, material_name: undefined });
    } else {
      onChange({ ...correction, material_code: opt.code, material_abbrev: opt.abbrev, material_name: opt.name });
    }
  }

  const isConfirmed = !!correction.material_code;

  return (
    <div className="flex flex-col gap-3 mt-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Selecciona el material correcto</label>
        <select
          value={correction.material_code ?? ""}
          onChange={handleSelect}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">— Seleccionar material —</option>
          {MATERIAL_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.code} {opt.abbrev} — {opt.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Notas adicionales (opcional)</label>
        <Input
          placeholder="Ej: símbolo ♻ visible en la base"
          value={(correction as { notes?: string }).notes ?? ""}
          onChange={(e) => onChange({ ...correction, ...{ notes: e.target.value } as object } as MaterialCorrection)}
        />
      </div>
      {selectedOption && (
        <p className="text-xs text-green-700 font-medium">
          ✓ Seleccionado: {selectedOption.code} {selectedOption.abbrev} — {selectedOption.name}
        </p>
      )}
      {!isConfirmed && (
        <p className="text-xs text-red-500">Selecciona un material para continuar.</p>
      )}
    </div>
  );
}

// ── Tier 2 card ────────────────────────────────────────────────────────────

interface Tier2CardProps {
  material: DetectedMaterial;
  correction: MaterialCorrection;
  onChange: (c: MaterialCorrection) => void;
}

function Tier2Card({ material, correction, onChange }: Tier2CardProps) {
  const answered = correction.tier2Confirmed !== undefined;
  const declined = correction.tier2Confirmed === false;

  return (
    <Card className="border-yellow-300">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-400 shrink-0" />
          <span className="font-medium text-sm">{material.part}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            Confianza: {Math.round(material.confidence * 100)}%
          </span>
        </div>
        <p className="text-sm font-semibold">{material.material_name}</p>
        {material.visual_evidence && (
          <p className="text-xs italic text-muted-foreground">{material.visual_evidence}</p>
        )}

        {!declined ? (
          <>
            <p className="text-sm mt-1">¿Es correcto el material identificado?</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={correction.tier2Confirmed === true ? "default" : "outline"}
                onClick={() => onChange({ ...correction, tier2Confirmed: true })}
              >
                Sí, confirmar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => onChange({ ...correction, tier2Confirmed: false })}
              >
                No, cambiar
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm mt-1 text-red-600">Indica el material correcto:</p>
            <Tier3Form
              material={material}
              correction={correction}
              onChange={onChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Tier 1 card ────────────────────────────────────────────────────────────

function Tier1Card({ material }: { material: DetectedMaterial }) {
  return (
    <Card className="border-green-300 bg-green-50">
      <CardContent className="p-4">
        <p className="text-sm text-green-800">
          ✓ <span className="font-medium">{material.part}</span>:{" "}
          {material.material_abbrev} ({material.material_code}) — identificado con alta confianza
        </p>
      </CardContent>
    </Card>
  );
}

// ── Tier 3 card ────────────────────────────────────────────────────────────

interface Tier3CardProps {
  material: DetectedMaterial;
  correction: MaterialCorrection;
  onChange: (c: MaterialCorrection) => void;
}

function Tier3Card({ material, correction, onChange }: Tier3CardProps) {
  return (
    <Card className="border-red-300">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
          <span className="font-medium text-sm">{material.part}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            Confianza: {Math.round(material.confidence * 100)}% — requiere confirmación
          </span>
        </div>
        {material.visual_evidence && (
          <p className="text-xs italic text-muted-foreground">{material.visual_evidence}</p>
        )}
        <Tier3Form
          material={material}
          correction={correction}
          onChange={onChange}
        />
      </CardContent>
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function MaterialConfirmationFlow({ data, onComplete, onBack }: Props) {
  const { analysis } = data;
  const materials = analysis.materials;

  // Initial corrections state — all unanswered
  const [corrections, setCorrections] = useState<Record<number, MaterialCorrection>>(
    () => Object.fromEntries(materials.map((_, i) => [i, {}]))
  );

  function setCorrection(i: number, c: MaterialCorrection) {
    setCorrections((prev) => ({ ...prev, [i]: c }));
  }

  // Tier classification
  const tiers = materials.map(getTier);

  // Sort indices: Tier 3 first, Tier 2, Tier 1
  const sortedIndices = [...materials.map((_, i) => i)].sort((a, b) => {
    const tierA = tiers[a];
    const tierB = tiers[b];
    if (tierA === tierB) return a - b;
    return tierB - tierA; // higher tier number = more friction = first
  });

  // Count answered Tier 2/3
  const needsAnswerIndices = materials
    .map((_, i) => i)
    .filter((i) => tiers[i] === 2 || tiers[i] === 3);

  const answeredCount = needsAnswerIndices.filter((i) => {
    const tier = tiers[i];
    const c = corrections[i];
    if (tier === 2) {
      if (c.tier2Confirmed === true) return true;
      if (c.tier2Confirmed === false) return !!c.material_code;
      return false;
    }
    // tier 3
    return !!c.material_code;
  }).length;

  const totalNeeds = needsAnswerIndices.length;
  const allAnswered = answeredCount === totalNeeds;

  function handleComplete() {
    if (!allAnswered) return;

    // Merge corrections into materials
    const correctedMaterials: DetectedMaterial[] = materials.map((m, i) => {
      const tier = tiers[i];
      const c = corrections[i];

      if (tier === 1) return m;

      if (tier === 2 && c.tier2Confirmed === true) {
        // User explicitly confirmed the AI's material identification
        return { ...m, inference_method: "user_confirmed" as const };
      }

      // Tier 3 or Tier 2 escalated to Tier 3 — apply correction
      if (c.material_code) {
        return {
          ...m,
          material_code: c.material_code,
          material_abbrev: c.material_abbrev ?? m.material_abbrev,
          material_name: c.material_name ?? m.material_name,
          inference_method: "user_confirmed" as const,
        };
      }

      return m;
    });

    const correctedAnalysis: PackagingAnalysis = {
      ...analysis,
      materials: correctedMaterials,
    };

    onComplete(correctedAnalysis);
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Confirmación de materiales</h1>
        <span className="text-sm text-muted-foreground">
          {answeredCount}/{totalNeeds} respondidos
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Revisa los materiales detectados. Confirma o corrige los que requieren tu atención.
      </p>

      <div className="flex flex-col gap-3">
        {sortedIndices.map((i) => {
          const m = materials[i];
          const tier = tiers[i];

          if (tier === 1) {
            return <Tier1Card key={i} material={m} />;
          }
          if (tier === 2) {
            return (
              <Tier2Card
                key={i}
                material={m}
                correction={corrections[i]}
                onChange={(c) => setCorrection(i, c)}
              />
            );
          }
          return (
            <Tier3Card
              key={i}
              material={m}
              correction={corrections[i]}
              onChange={(c) => setCorrection(i, c)}
            />
          );
        })}
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={onBack}>
          ← Nuevo análisis
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!allAnswered}
          className="flex-1"
        >
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
