import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DetectedMaterial } from "@/types/analysis";

// ─── Mock QRCode (only external dep of label-generator) ──────────────────────

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=="
    ),
  },
}));

import { generateLabelSVG } from "@/lib/label-generator";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ANALYSIS_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const BASE_URL = "https://app.example.com";

const PET_MATERIAL: DetectedMaterial = {
  part: "cuerpo",
  material_name: "Polietileno tereftalato",
  material_code: "01",
  material_abbrev: "PET",
  confidence: 0.95,
  visual_evidence: "Transparent body with resin code on base",
};

const PP_MATERIAL: DetectedMaterial = {
  part: "tapón",
  material_name: "Polipropileno",
  material_code: "05",
  material_abbrev: "PP",
  confidence: 0.9,
  visual_evidence: "Opaque colored cap",
};

const LABEL_DATA = {
  companyName: "Envases García S.L.",
  cif: "B12345678",
  productName: "Botella Agua 1.5L",
  materials: [PET_MATERIAL, PP_MATERIAL],
  analysisId: ANALYSIS_ID,
  baseUrl: BASE_URL,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("generateLabelSVG() — Label QR & structure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an object with svg and qrUrl", async () => {
    const result = await generateLabelSVG(LABEL_DATA);

    expect(result).toHaveProperty("svg");
    expect(result).toHaveProperty("qrUrl");
    expect(typeof result.svg).toBe("string");
    expect(typeof result.qrUrl).toBe("string");
  });

  it("qrUrl points to /label/{analysisId}", async () => {
    const { qrUrl } = await generateLabelSVG(LABEL_DATA);

    expect(qrUrl).toBe(`${BASE_URL}/label/${ANALYSIS_ID}`);
  });

  it("SVG is well-formed XML starting with <?xml", async () => {
    const { svg } = await generateLabelSVG(LABEL_DATA);

    expect(svg.trimStart()).toMatch(/^<\?xml/);
    expect(svg).toContain("<svg ");
    expect(svg).toContain("</svg>");
  });

  it("SVG embeds the company name and CIF", async () => {
    const { svg } = await generateLabelSVG(LABEL_DATA);

    expect(svg).toContain("Envases García S.L.");
    expect(svg).toContain("B12345678");
  });

  it("SVG embeds the product name", async () => {
    const { svg } = await generateLabelSVG(LABEL_DATA);

    expect(svg).toContain("Botella Agua 1.5L");
  });

  it("SVG contains material abbreviations for all materials", async () => {
    const { svg } = await generateLabelSVG(LABEL_DATA);

    expect(svg).toContain("PET");
    expect(svg).toContain("PP");
  });

  it("SVG contains material codes for all materials", async () => {
    const { svg } = await generateLabelSVG(LABEL_DATA);

    expect(svg).toContain("(01)");
    expect(svg).toContain("(05)");
  });

  it("SVG embeds the QR code as a data URI inside an <image> element", async () => {
    const { svg } = await generateLabelSVG(LABEL_DATA);

    expect(svg).toContain("<image");
    expect(svg).toContain("data:image/png;base64,");
  });

  it("SVG includes the RD 1055/2022 compliance footer", async () => {
    const { svg } = await generateLabelSVG(LABEL_DATA);

    expect(svg).toContain("RD 1055/2022");
  });

  it("SVG includes the short analysis ID in footer", async () => {
    const { svg } = await generateLabelSVG(LABEL_DATA);

    // First 8 chars of analysisId
    expect(svg).toContain(ANALYSIS_ID.slice(0, 8));
  });

  it("handles a single material correctly", async () => {
    const { svg } = await generateLabelSVG({
      ...LABEL_DATA,
      materials: [PET_MATERIAL],
    });

    expect(svg).toContain("PET");
    expect(svg).not.toContain("(05)"); // PP should not appear
  });

  it("handles materials with null code/abbrev using placeholder ?", async () => {
    const unknownMaterial: DetectedMaterial = {
      part: "film",
      material_name: "Material compuesto desconocido",
      material_code: null,
      material_abbrev: null,
      confidence: 0.6,
      visual_evidence: "Complex multilayer structure",
    };

    const { svg } = await generateLabelSVG({
      ...LABEL_DATA,
      materials: [unknownMaterial],
    });

    // Should render ? placeholder for unknown code/abbrev
    expect(svg).toContain("?");
  });

  it("escapes XML special characters in company name", async () => {
    const { svg } = await generateLabelSVG({
      ...LABEL_DATA,
      companyName: 'Empresa <Test> & "Cía."',
    });

    // Raw < > & " should not appear unescaped in SVG
    expect(svg).not.toMatch(/<text[^>]*>.*<Test>/);
    expect(svg).toContain("&amp;");
  });
});
