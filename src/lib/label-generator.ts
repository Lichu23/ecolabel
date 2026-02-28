import QRCode from "qrcode";
import type { DetectedMaterial } from "@/types/analysis";
import {
  getContainerFraction,
  getInseparableFraction,
  validateCompliance,
  REGULATORY_VERSION,
  PPWR_NOTICE,
  type ContainerFraction,
  type ComplianceItem,
  type MandatoryMarkingInputs,
} from "./legal-decisions";

export interface LabelData {
  companyName: string;
  cif: string;
  productName: string;
  materials: DetectedMaterial[];
  analysisId: string;
  /** Base URL of the app, e.g. https://yourapp.vercel.app */
  baseUrl: string;
  /** Intended packaging use — defaults to "household" */
  packagingUse?: "household" | "commercial" | "industrial";
  /** Container fraction per material part — computed if absent */
  containerFractions?: Record<string, ContainerFraction>;
  /** Pre-computed compliance checklist — computed if absent */
  complianceItems?: ComplianceItem[];
  /** Mandatory marking inputs — used to render reuse banner when isReusable=true */
  marking?: MandatoryMarkingInputs;
  /** Regulatory version string */
  regulatoryVersion?: string;
  /** ISO timestamp of generation */
  generatedAt?: string;
}

export interface GeneratedLabel {
  svg: string;
  qrUrl: string;
}

/** Escape XML special characters for safe SVG embedding */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const BADGE_COLORS: Record<
  ContainerFraction,
  { bg: string; text: string; label: string }
> = {
  amarillo: { bg: "#FFD700", text: "#333333", label: "AMARILLO" },
  azul:     { bg: "#0066CC", text: "#ffffff", label: "AZUL" },
  verde:    { bg: "#006633", text: "#ffffff", label: "VERDE" },
  otro:     { bg: "#888888", text: "#ffffff", label: "OTRO" },
};

/**
 * Builds a two-line SVG material row:
 *   Line 1: ♻ PART: ABBREV (CODE)
 *   Line 2: Deposita en el contenedor [BADGE]
 */
function buildMaterialRow(
  m: DetectedMaterial,
  fraction: ContainerFraction,
  y: number
): string {
  const part = escapeXml(m.part.toUpperCase().substring(0, 12));
  const abbrev = escapeXml(m.material_abbrev ?? "?");
  const code = escapeXml(m.material_code ?? "?");
  const badge = BADGE_COLORS[fraction];

  const BADGE_W = 72;
  const BADGE_H = 14;
  // Placed right after "Deposita en el contenedor" (~25 chars × 5px at font-size 9, start x=28)
  const BADGE_X = 152;

  return `
    <text x="18" y="${y + 13}" font-size="11" fill="#333333"
          font-family="Arial, Helvetica, sans-serif">&#9851; ${part}: ${abbrev} (${code})</text>
    <text x="28" y="${y + 27}" font-size="9" fill="#555555"
          font-family="Arial, Helvetica, sans-serif">Deposita en el contenedor</text>
    <rect x="${BADGE_X}" y="${y + 15}" width="${BADGE_W}" height="${BADGE_H}"
          fill="${badge.bg}" rx="3"/>
    <text x="${BADGE_X + BADGE_W / 2}" y="${y + 26}" text-anchor="middle"
          font-size="8" font-weight="bold" fill="${badge.text}"
          font-family="Arial, Helvetica, sans-serif">${badge.label}</text>`;
}

/**
 * Builds a two-line SVG row for an inseparable composite group.
 * Shows all parts and their codes in one row, labelled "CONJUNTO".
 */
function buildCompositeRow(
  parts: DetectedMaterial[],
  fraction: ContainerFraction,
  y: number
): string {
  const badge = BADGE_COLORS[fraction];
  const BADGE_W = 72;
  const BADGE_H = 14;
  // Placed right after "Conjunto inseparable — Deposita en el contenedor"
  // (~49 chars × 5.4px at font-size 9, starting at x=28)
  const BADGE_X = 296;

  const partNames = parts
    .map((m) => m.part.toUpperCase().substring(0, 7))
    .join("+");
  const codes = parts
    .map((m) => `${m.material_abbrev ?? "?"}(${m.material_code ?? "?"})`)
    .join("+");

  return `
    <text x="18" y="${y + 13}" font-size="10" fill="#333333"
          font-family="Arial, Helvetica, sans-serif">&#9851; CONJUNTO ${escapeXml(partNames)}: ${escapeXml(codes)}</text>
    <text x="28" y="${y + 27}" font-size="9" fill="#555555"
          font-family="Arial, Helvetica, sans-serif">Conjunto inseparable — Deposita en el contenedor</text>
    <rect x="${BADGE_X}" y="${y + 15}" width="${BADGE_W}" height="${BADGE_H}"
          fill="${badge.bg}" rx="3"/>
    <text x="${BADGE_X + BADGE_W / 2}" y="${y + 26}" text-anchor="middle"
          font-size="8" font-weight="bold" fill="${badge.text}"
          font-family="Arial, Helvetica, sans-serif">${badge.label}</text>`;
}

/**
 * Generates an SVG label for environmental packaging compliance (RD 1055/2022).
 *
 * Layout (top → bottom):
 *   1. Green header — company, CIF, product name, packaging use
 *   2. Materials section — each material + bin colour badge
 *   3. Compliance checklist — 5-point validation
 *   4. Footer — regulatory reference, QR code, generation date
 */
export async function generateLabelSVG(
  data: LabelData
): Promise<GeneratedLabel> {
  const {
    companyName,
    cif,
    productName,
    materials,
    analysisId,
    baseUrl,
    packagingUse = "household",
    regulatoryVersion = REGULATORY_VERSION,
    generatedAt = new Date().toISOString(),
  } = data;

  // Resolve container fractions (use provided map, fall back to computing)
  const fractionMap: Record<string, ContainerFraction> =
    data.containerFractions ?? {};
  const resolvedFractions = (m: DetectedMaterial): ContainerFraction =>
    fractionMap[m.part] ??
    getContainerFraction(m.material_code, m.material_abbrev);

  // Resolve compliance items
  const complianceItems: ComplianceItem[] =
    data.complianceItems ??
    validateCompliance(materials, packagingUse);

  // URL the QR code will point to (legal justification page)
  const qrUrl = `${baseUrl}/verify/${analysisId}`;

  // Generate QR code as PNG data URL
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 68,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  // ── Group materials by separability ──────────────────────────────────────────
  // Separable (or unset) → individual rows; inseparable → one composite row
  type RenderItem =
    | { type: "single"; material: DetectedMaterial; fraction: ContainerFraction }
    | { type: "composite"; parts: DetectedMaterial[]; fraction: ContainerFraction };

  const separableMats = materials.filter((m) => m.separability !== "inseparable");
  const inseparableMats = materials.filter((m) => m.separability === "inseparable");

  const renderItems: RenderItem[] = [
    ...separableMats.map((m) => ({
      type: "single" as const,
      material: m,
      fraction: resolvedFractions(m),
    })),
    ...(inseparableMats.length > 0
      ? [{ type: "composite" as const, parts: inseparableMats, fraction: getInseparableFraction(inseparableMats) }]
      : []),
  ];

  // ── Layout constants ─────────────────────────────────────────────────────────
  const WIDTH = 520;
  const MAX_MATERIALS = 4;
  const MAT_ROW_H = 34;
  const COMP_ROW_H = 30; // 2-line rows: check name + detail

  const shownItems = renderItems.slice(0, MAX_MATERIALS);
  const n = shownItems.length;

  // Reuse banner — shown when marking.isReusable = true
  const hasReuseBanner = data.marking?.isReusable === true;
  const REUSE_BANNER_H = hasReuseBanner ? 26 : 0;

  // Vertical positions (computed top-down)
  const HEADER_H = 56;
  const matTitleY = HEADER_H + 10;         // "MATERIALES…" label
  const matLineY = matTitleY + 14;         // green divider
  const matFirstY = matLineY + 8;          // first material row
  const compSectionY = matFirstY + n * MAT_ROW_H + 10 + REUSE_BANNER_H; // after materials (+ optional banner)
  const compTitleY = compSectionY + 14;    // "VALIDACIÓN…" label
  const compLineY = compTitleY + 4;        // light divider
  const compFirstY = compLineY + 10;       // first compliance item
  const footerLineY = compFirstY + complianceItems.length * COMP_ROW_H + 10;
  const QR_SIZE = 68;
  const FOOTER_H = QR_SIZE + 28; // +12 for PPWR notice line
  const HEIGHT = footerLineY + FOOTER_H;

  // Packaging use label
  const useLabel =
    packagingUse === "commercial"
      ? "Comercial"
      : packagingUse === "industrial"
        ? "Industrial"
        : "Doméstico";

  // Footer date
  const dateStr = new Date(generatedAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Build material rows (separable = individual, inseparable = composite group)
  const materialRows = shownItems
    .map((item, i) => {
      const y = matFirstY + i * MAT_ROW_H;
      if (item.type === "single") {
        return buildMaterialRow(item.material, item.fraction, y);
      }
      return buildCompositeRow(item.parts, item.fraction, y);
    })
    .join("");

  const overflowNote =
    renderItems.length > MAX_MATERIALS
      ? `<text x="18" y="${matFirstY + n * MAT_ROW_H + 2}" font-size="9"
              fill="#888888" font-family="Arial, Helvetica, sans-serif">
          +${renderItems.length - MAX_MATERIALS} material(es) más
        </text>`
      : "";

  // Obligation badge colors
  const OBLIG_BADGE: Record<"mandatory" | "voluntary" | "upcoming", { bg: string; text: string; label: string }> = {
    mandatory: { bg: "#166534", text: "#ffffff", label: "OBL." },
    voluntary: { bg: "#4b5563", text: "#ffffff", label: "VOL." },
    upcoming:  { bg: "#92400e", text: "#ffffff", label: "PROX." },
  };
  const BADGE_W = 28;
  const BADGE_H = 12;

  // Max characters before truncation (at font-size 9, ~68 chars fit in available width)
  const MAX_CHECK = 68;
  const MAX_DETAIL = 78;

  function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  }

  // Build compliance rows — 2 lines per item: check name + detail
  const complianceRows = complianceItems
    .map((item, i) => {
      const y = compFirstY + i * COMP_ROW_H;
      const icon = item.passed ? "&#10003;" : "&#10007;";
      const color = item.passed ? "#1a7a1a" : "#cc0000";
      const checkText = truncate(escapeXml(item.check), MAX_CHECK);
      const detailText = item.detail ? truncate(escapeXml(item.detail), MAX_DETAIL) : "";
      const badge = OBLIG_BADGE[item.obligation] ?? OBLIG_BADGE.mandatory;
      return `
    <rect x="18" y="${y + 3}" width="${BADGE_W}" height="${BADGE_H}" rx="2" fill="${badge.bg}"/>
    <text x="${18 + BADGE_W / 2}" y="${y + 12}" text-anchor="middle" font-size="7"
          font-weight="bold" fill="${badge.text}" font-family="Arial, Helvetica, sans-serif">${badge.label}</text>
    <text x="50" y="${y + 13}" font-size="9" fill="${color}"
          font-family="Arial, Helvetica, sans-serif">${icon} ${checkText}</text>${detailText ? `
    <text x="50" y="${y + 24}" font-size="7.5" fill="#666666"
          font-family="Arial, Helvetica, sans-serif">${detailText}</text>` : ""}`;
    })
    .join("");

  const QR_X = WIDTH - QR_SIZE - 12;
  const QR_Y = footerLineY + 8;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" rx="6" ry="6"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="none" stroke="#cccccc"
        stroke-width="1.5" rx="6" ry="6"/>

  <!-- Header background -->
  <rect width="${WIDTH}" height="${HEADER_H}" fill="#edf7ed" rx="6" ry="6"/>
  <rect y="6" width="${WIDTH}" height="${HEADER_H - 6}" fill="#edf7ed"/>

  <!-- Company name -->
  <text x="16" y="22" font-size="14" font-weight="bold" fill="#1a1a1a"
        font-family="Arial, Helvetica, sans-serif">${escapeXml(companyName)}</text>

  <!-- CIF (right-aligned) -->
  <text x="${WIDTH - 16}" y="22" font-size="11" fill="#555555" text-anchor="end"
        font-family="Arial, Helvetica, sans-serif">CIF: ${escapeXml(cif)}</text>

  <!-- Product + usage -->
  <text x="16" y="43" font-size="10" fill="#555555"
        font-family="Arial, Helvetica, sans-serif">
    Producto: ${escapeXml(productName)} &#xB7; Uso: ${escapeXml(useLabel)}
  </text>

  <!-- ── Materials section ── -->
  <text x="16" y="${matTitleY + 12}" font-size="10" font-weight="bold"
        fill="#2d7a2d" font-family="Arial, Helvetica, sans-serif">
    MATERIALES E INSTRUCCIONES DE RECICLAJE
  </text>
  <line x1="16" y1="${matLineY}" x2="${WIDTH - 16}" y2="${matLineY}"
        stroke="#2d7a2d" stroke-width="1"/>

  ${materialRows}
  ${overflowNote}

  ${hasReuseBanner ? `
  <!-- Reuse marking banner — Art. 13.2 RD 1055/2022 -->
  <rect x="16" y="${matFirstY + n * MAT_ROW_H + 4}" width="${WIDTH - 32}" height="22"
        fill="#dcfce7" rx="3"/>
  <text x="26" y="${matFirstY + n * MAT_ROW_H + 19}" font-size="9" font-weight="bold"
        fill="#166534" font-family="Arial, Helvetica, sans-serif">
    &#9851; ENVASE REUTILIZABLE &#183; Indicaci&#243;n obligatoria Art. 13.2 RD 1055/2022
  </text>` : ""}

  <!-- ── Compliance section ── -->
  <line x1="16" y1="${compSectionY}" x2="${WIDTH - 16}" y2="${compSectionY}"
        stroke="#cccccc" stroke-width="1"/>
  <text x="16" y="${compTitleY}" font-size="10" font-weight="bold"
        fill="#1a1a1a" font-family="Arial, Helvetica, sans-serif">
    VALIDACI&#211;N DE CUMPLIMIENTO
  </text>
  <line x1="16" y1="${compLineY}" x2="${WIDTH - 16}" y2="${compLineY}"
        stroke="#eeeeee" stroke-width="1"/>

  ${complianceRows}

  <!-- ── Footer ── -->
  <line x1="16" y1="${footerLineY}" x2="${WIDTH - 16}" y2="${footerLineY}"
        stroke="#cccccc" stroke-width="1"/>
  <rect y="${footerLineY}" width="${WIDTH}" height="${FOOTER_H}" fill="#edf7ed"
        rx="6" ry="6"/>
  <rect y="${footerLineY}" width="${WIDTH}" height="${FOOTER_H - 6}"
        fill="#edf7ed"/>

  <!-- QR code -->
  <image x="${QR_X}" y="${QR_Y}" width="${QR_SIZE}" height="${QR_SIZE}"
         href="${qrDataUrl}" preserveAspectRatio="xMidYMid meet"/>
  <text x="${QR_X + QR_SIZE / 2}" y="${QR_Y + QR_SIZE + 10}"
        text-anchor="middle" font-size="6" fill="#888888"
        font-family="Arial, Helvetica, sans-serif">Justificaci&#243;n legal</text>

  <!-- Footer text -->
  <text x="16" y="${footerLineY + 18}" font-size="8" fill="#555555"
        font-family="Arial, Helvetica, sans-serif">
    Conforme Art. 13 ${escapeXml(regulatoryVersion)} (BOE-A-2022-22199) &#xB7; Fracci&#243;n de recogida separada
  </text>
  <text x="16" y="${footerLineY + 32}" font-size="8" fill="#555555"
        font-family="Arial, Helvetica, sans-serif">
    Generado: ${escapeXml(dateStr)} &#xB7; ID: ${escapeXml(analysisId.slice(0, 8))}
  </text>
  <text x="16" y="${footerLineY + 46}" font-size="7" fill="#888888"
        font-family="Arial, Helvetica, sans-serif">
    No sustituye asesor&#237;a legal profesional
  </text>
  <text x="16" y="${footerLineY + 60}" font-size="7" fill="#888888"
        font-family="Arial, Helvetica, sans-serif">
    Identificaci&#243;n asistida &#8212; requiere confirmaci&#243;n del usuario
  </text>
  <text x="16" y="${footerLineY + 74}" font-size="7" fill="#92400e"
        font-family="Arial, Helvetica, sans-serif">
    &#9888; ${escapeXml(PPWR_NOTICE.label)} &#xB7; Aplicable agosto 2026
  </text>
</svg>`;

  return { svg, qrUrl };
}
