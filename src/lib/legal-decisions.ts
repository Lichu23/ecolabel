/**
 * Core legal compliance logic for RD 1055/2022 (BOE-A-2022-22199).
 * Packaging material → separate collection fraction mapping and validation.
 */

export type ContainerFraction = "amarillo" | "azul" | "verde" | "otro";

// ── Container fraction lookup ─────────────────────────────────────────────────

/** Lookup table: material_code or material_abbrev (uppercase) → bin fraction */
const CONTAINER_TABLE: Record<string, ContainerFraction> = {
  // Aluminium
  "41": "amarillo",
  "ALU": "amarillo",
  // PET
  "01": "amarillo",
  "PET": "amarillo",
  // HDPE
  "02": "amarillo",
  "HDPE": "amarillo",
  // PP
  "05": "amarillo",
  "PP": "amarillo",
  // LDPE
  "04": "amarillo",
  "LDPE": "amarillo",
  // PS
  "06": "amarillo",
  "PS": "amarillo",
  // PVC
  "03": "amarillo",
  "PVC": "amarillo",
  // Steel / Iron
  "40": "amarillo",
  "FE": "amarillo",
  // Composites (codes 81–84) — Decision 97/129/CE
  "81": "amarillo",
  "82": "amarillo",
  "83": "amarillo",
  "84": "amarillo",
  // Composite abbreviations (C/ prefix)
  "C/PAP":  "amarillo", // tetrabrik (papel + PE + AL)
  "C/LDPE": "amarillo",
  "C/PP":   "amarillo",
  "C/PS":   "amarillo",
  // Paper / Cardboard
  "20": "azul",
  "21": "azul",
  "22": "azul",
  "PAP": "azul",
  // Glass
  "70": "verde",
  "71": "verde",
  "72": "verde",
  "73": "verde",
  "74": "verde",
  "GL": "verde",
};

/**
 * Returns the separate-collection bin colour for a given material.
 * Falls back to "otro" if the material is not in the lookup table.
 */
export function getContainerFraction(
  code: string | null,
  abbrev: string | null
): ContainerFraction {
  if (code) {
    const byCode = CONTAINER_TABLE[code.trim()];
    if (byCode) return byCode;
  }
  if (abbrev) {
    const upper = abbrev.trim().toUpperCase();
    const byAbbrev = CONTAINER_TABLE[upper];
    if (byAbbrev) return byAbbrev;
    // Composites: abbreviation starts with "C/"
    if (upper.startsWith("C/")) return "amarillo";
  }
  return "otro";
}

/**
 * For a group of inseparable materials, returns the container fraction
 * using the predominant-material rule (Decision 97/129/CE).
 * Glass takes precedence (verde); all other composites default to amarillo.
 * Rule: verde > azul > amarillo > otro
 */
export function getInseparableFraction(
  materials: Array<{ material_code: string | null; material_abbrev: string | null }>
): ContainerFraction {
  const fractions = materials.map((m) =>
    getContainerFraction(m.material_code, m.material_abbrev)
  );
  if (fractions.includes("verde")) return "verde";
  if (fractions.includes("amarillo")) return "amarillo";
  if (fractions.includes("azul")) return "azul";
  return "otro";
}

// ── Regulatory constants ──────────────────────────────────────────────────────

export const REGULATORY_VERSION = "RD 1055/2022";
export const REGULATORY_DATE = "27 de diciembre de 2022";

/**
 * Fallback legal context used when the RAG search returns no results.
 * Ensures the label always cites a valid regulatory basis.
 */
export const FALLBACK_LEGAL_CONTEXT =
  `Etiquetado conforme al artículo 13 del Real Decreto 1055/2022, de 27 de diciembre,\n` +
  `sobre envases y residuos de envases.\n` +
  `Envase doméstico. Obligación de indicar la fracción de recogida separada conforme al Anexo II.\n` +
  `Versión reglamentaria: RD 1055/2022 (BOE-A-2022-22199).`;

// ── Compliance validation ─────────────────────────────────────────────────────

export interface ComplianceItem {
  check: string;
  passed: boolean;
  detail?: string;
  obligation: "mandatory" | "voluntary" | "upcoming";
  article: string;
}

/** Static PPWR display constant — not a ComplianceItem, appended at display layer only */
export const PPWR_NOTICE = {
  label: "Reglamento (UE) 2025/40 (PPWR)",
  detail: "Aplicable a partir de agosto 2026 — sin impacto normativo hasta esa fecha",
  article: "Reglamento (UE) 2025/40 — DO L 2025/40",
  obligation: "upcoming" as const,
};

/**
 * User-provided mandatory marking attributes (Phase 13 questionnaire).
 * Collected before upload, stored in raw_response JSONB, and threaded
 * through validateCompliance() to produce the full 9-item checklist.
 */
export interface MandatoryMarkingInputs {
  isCompostable: boolean; // Art. 13.5 — UNE EN 13432:2001 cert required
  isSUP: boolean;         // Art. 13.7 — single-use plastic; EU 2020/2151 pictograms required
  isReusable: boolean;    // Art. 13.2 — reusable condition marking required
  isSDDR: boolean;        // Arts. 46.8, 47.7 — beverage deposit system (próximamente obligatorio)
}

type MaterialLike = {
  material_code: string | null;
  material_abbrev: string | null;
};

/**
 * Runs a compliance checklist for a packaging label per RD 1055/2022.
 * Returns 5 base items. When `marking` is provided, adds 4 more items
 * (items 6–9) covering mandatory marking categories from Phase 13.
 *
 * @param materials    - Detected materials from the analysis
 * @param packagingUse - Intended use of the packaging
 * @param marking      - Optional user-provided mandatory marking attributes
 */
export function validateCompliance(
  materials: MaterialLike[],
  packagingUse: "household" | "commercial" | "industrial" = "household",
  marking?: MandatoryMarkingInputs
): ComplianceItem[] {
  const allIdentified =
    materials.length > 0 &&
    materials.every(
      (m) => m.material_code !== null || m.material_abbrev !== null
    );

  const allFractionsKnown =
    materials.length > 0 &&
    materials.every(
      (m) => getContainerFraction(m.material_code, m.material_abbrev) !== "otro"
    );

  const useLabel =
    packagingUse === "commercial"
      ? "Comercial"
      : packagingUse === "industrial"
        ? "Industrial"
        : "Doméstico";

  return [
    {
      check: "Material identificado",
      passed: allIdentified,
      detail: allIdentified
        ? `${materials.length} material(es) con código de identificación`
        : "Faltan códigos en uno o más materiales",
      obligation: "mandatory" as const,
      article: "Art. 13.1 RD 1055/2022",
    },
    {
      check: "Indicación de contenedor (Art. 13.2 — Solo envases domésticos)",
      passed: packagingUse !== "household" ? true : allFractionsKnown,
      detail:
        packagingUse !== "household"
          ? "No aplica — envase no doméstico: exento de indicar fracción de recogida separada (Art. 13.2)"
          : allFractionsKnown
            ? "Todos los materiales tienen contenedor de recogida asignado"
            : "Algunos materiales no tienen fracción de recogida conocida",
      obligation: "mandatory" as const,
      article: "Art. 13.2 RD 1055/2022",
    },
    {
      check: `Texto conforme ${REGULATORY_VERSION}`,
      passed: true,
      detail: `Art. 13 · Anexo II · BOE-A-2022-22199`,
      obligation: "mandatory" as const,
      article: "Art. 13 RD 1055/2022 (BOE-A-2022-22199)",
    },
    {
      check: "Sin claims medioambientales no permitidos",
      passed: true,
      detail: "Sin declaraciones ambientales genéricas",
      obligation: "mandatory" as const,
      article: "Art. 13.3 RD 1055/2022 · Dir. UE 2024/825",
    },
    {
      check: "Versión reglamentaria validada",
      passed: REGULATORY_VERSION === "RD 1055/2022",
      detail: `${REGULATORY_VERSION} — ${REGULATORY_DATE} — Uso: ${useLabel}`,
      obligation: "mandatory" as const,
      article: "RD 1055/2022 (BOE-A-2022-22199)",
    },
    // ── Items 6–9: only included when marking inputs are provided ──────────
    ...(marking
      ? [
          {
            check: "Compostabilidad certificada (Art. 13.5)",
            passed: !marking.isCompostable,
            detail: marking.isCompostable
              ? "Requiere certificación UNE EN 13432:2001 — inclúyela en el etiquetado"
              : "No aplica — envase no compostable",
            obligation: "mandatory" as const,
            article: "Art. 13.5 RD 1055/2022",
          },
          {
            check: "Pictogramas plástico de un solo uso SUP (Art. 13.7)",
            passed: !marking.isSUP,
            detail: marking.isSUP
              ? "Requiere pictogramas obligatorios EU 2020/2151 conforme Art. 13.7"
              : "No aplica — envase no es plástico de un solo uso",
            obligation: "mandatory" as const,
            article: "Art. 13.7 RD 1055/2022 · Dir. UE 2020/2151",
          },
          {
            check: "Indicación de reutilización (Art. 13.2)",
            passed: true, // label generator includes the marking when isReusable=true
            detail: marking.isReusable
              ? "Condición de reutilización indicada en etiqueta (Art. 13.2)"
              : "No aplica — envase no reutilizable",
            obligation: "mandatory" as const,
            article: "Art. 13.2 RD 1055/2022",
          },
          {
            check: "Sistema de depósito SDDR (Arts. 46.8, 47.7)",
            passed: true, // not currently enforced — shown as informational
            detail: marking.isSDDR
              ? "Próximamente obligatorio — SDDR en fase de implantación. No es exigible actualmente."
              : "No aplica — envase no incluido en SDDR",
            obligation: "upcoming" as const,
            article: "Arts. 46.8 · 47.7 RD 1055/2022",
          },
        ]
      : []),
  ];
}
