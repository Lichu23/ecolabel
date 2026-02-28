import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * E2E Pipeline Timing Test
 *
 * Validates that the full photo → analysis → label pipeline:
 *   1. Composes without errors
 *   2. Produces the expected output shapes
 *   3. Completes within the 60-second SLA
 *
 * All external services (Groq, Cohere, Supabase, QRCode) are mocked so the
 * test is deterministic and runs offline. Timing stays representative of the
 * orchestration logic, not network latency.
 */

// ─── Hoist mock references ────────────────────────────────────────────────────

const mockCreate = vi.hoisted(() => vi.fn());
const mockRpc = vi.hoisted(() => vi.fn());
const mockEmbedQuery = vi.hoisted(() => vi.fn());

vi.mock("groq-sdk", () => ({
  // Must use a regular function (not arrow) so `new Groq()` works as a constructor
  default: vi.fn(function () {
    return { chat: { completions: { create: mockCreate } } };
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ rpc: mockRpc })),
}));

vi.mock("@/lib/cohere", () => ({
  embedQuery: mockEmbedQuery,
}));

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mockQR"),
  },
}));

// Import AFTER mocks
import { analyzePackaging } from "@/lib/groq-vision";
import { searchLegalContext } from "@/lib/rag";
import { generateLabelSVG } from "@/lib/label-generator";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const MOCK_ANALYSIS = {
  packaging_type: "bottle" as const,
  materials: [
    {
      part: "cuerpo",
      material_name: "Polietileno tereftalato",
      material_code: "01",
      material_abbrev: "PET",
      confidence: 0.95,
      visual_evidence: "Transparent body",
    },
    {
      part: "tapón",
      material_name: "Polipropileno",
      material_code: "05",
      material_abbrev: "PP",
      confidence: 0.92,
      visual_evidence: "Opaque cap",
    },
  ],
  overall_confidence: 0.94,
  guided_query_required: false,
  notes: "Standard PET water bottle",
};

const MOCK_LEGAL_CHUNK = {
  id: "legal-001",
  title: "Identificación materiales plásticos",
  article_ref: "RD 1055/2022 Art. 12",
  content:
    "Los envases plásticos PET se identifican con código 01 según Anexo II.",
  similarity: 0.88,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("E2E Pipeline — photo upload → label generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(MOCK_ANALYSIS) } }],
    });

    mockEmbedQuery.mockResolvedValue(new Array(1024).fill(0.01));

    mockRpc.mockResolvedValue({
      data: [MOCK_LEGAL_CHUNK],
      error: null,
    });
  });

  it("completes the full pipeline in under 60 seconds", async () => {
    const start = Date.now();

    // Step 1 — AI Vision
    const analysis = await analyzePackaging([{ base64: MOCK_BASE64, mimeType: "image/jpeg" }]);

    // Step 2 — RAG: retrieve relevant legal context
    const query = `${analysis.packaging_type} ${analysis.materials
      .map((m) => m.material_name)
      .join(" ")}`;
    const legalContext = await searchLegalContext(query);

    // Step 3 — Label generation
    const label = await generateLabelSVG({
      companyName: "Empresa Demo S.L.",
      cif: "B99999999",
      productName: "Producto de prueba",
      materials: analysis.materials,
      analysisId: "test-analysis-id-0001",
      baseUrl: "https://app.example.com",
    });

    const elapsedMs = Date.now() - start;

    // ── Timing assertion ─────────────────────────────────────────────────────
    expect(elapsedMs).toBeLessThan(60_000);

    // ── Output shape assertions ──────────────────────────────────────────────
    expect(analysis.materials.length).toBeGreaterThan(0);
    expect(analysis.overall_confidence).toBeGreaterThan(0);

    expect(legalContext).toContain("RD 1055/2022");

    expect(label.svg).toContain("<svg");
    expect(label.qrUrl).toMatch(/\/label\/test-analysis-id-0001$/);
  });

  it("propagates material data from vision → label correctly", async () => {
    const analysis = await analyzePackaging([{ base64: MOCK_BASE64, mimeType: "image/jpeg" }]);

    const label = await generateLabelSVG({
      companyName: "Test S.A.",
      cif: "A11111111",
      productName: "Caja cartón",
      materials: analysis.materials,
      analysisId: "pipeline-test-id-002",
      baseUrl: "https://app.example.com",
    });

    // Material abbreviations detected by vision must appear in the label SVG
    for (const material of analysis.materials) {
      if (material.material_abbrev) {
        expect(label.svg).toContain(material.material_abbrev);
      }
    }
  });

  it("sets guided_query_required when the AI is not confident enough", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ...MOCK_ANALYSIS,
              materials: [
                {
                  ...MOCK_ANALYSIS.materials[0],
                  confidence: 0.55, // low confidence
                },
              ],
              overall_confidence: 0.55,
              guided_query_required: false, // model may return false; code enforces it
            }),
          },
        },
      ],
    });

    const analysis = await analyzePackaging([{ base64: MOCK_BASE64, mimeType: "image/jpeg" }]);

    expect(analysis.guided_query_required).toBe(true);
  });
});
