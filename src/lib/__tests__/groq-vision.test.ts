import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PackagingAnalysis } from "@/types/analysis";

// ─── Hoist mock references so they're available inside vi.mock factory ────────

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("groq-sdk", () => ({
  // Must use a regular function (not arrow) so `new Groq()` works as a constructor
  default: vi.fn(function () {
    return { chat: { completions: { create: mockCreate } } };
  }),
}));

// Import AFTER mocks are registered
import { analyzePackaging } from "@/lib/groq-vision";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function makeGroqResponse(analysis: Partial<PackagingAnalysis>): object {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify({
            packaging_type: "bottle",
            materials: [],
            overall_confidence: 0.9,
            guided_query_required: false,
            notes: "",
            ...analysis,
          }),
        },
      },
    ],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("analyzePackaging()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a valid PackagingAnalysis from a well-formed Groq response", async () => {
    mockCreate.mockResolvedValueOnce(
      makeGroqResponse({
        packaging_type: "bottle",
        materials: [
          {
            part: "cuerpo",
            material_name: "Polietileno tereftalato",
            material_code: "01",
            material_abbrev: "PET",
            confidence: 0.95,
            visual_evidence: "Transparent body with resin code on base",
          },
        ],
        overall_confidence: 0.95,
        guided_query_required: false,
      })
    );

    const result = await analyzePackaging([{ base64: MOCK_BASE64, mimeType: "image/jpeg" }]);

    expect(result.packaging_type).toBe("bottle");
    expect(result.materials).toHaveLength(1);
    expect(result.materials[0].material_abbrev).toBe("PET");
    expect(result.overall_confidence).toBe(0.95);
    expect(result.guided_query_required).toBe(false);
  });

  it("enforces guided_query_required = true when any material has confidence < 0.8", async () => {
    mockCreate.mockResolvedValueOnce(
      makeGroqResponse({
        materials: [
          {
            part: "cuerpo",
            material_name: "Polipropileno",
            material_code: "05",
            material_abbrev: "PP",
            confidence: 0.9,
            visual_evidence: "Opaque body",
          },
          {
            part: "tapón",
            material_name: "Material desconocido",
            material_code: null,
            material_abbrev: null,
            confidence: 0.6, // < 0.8 → triggers guided query
            visual_evidence: "Unclear material",
          },
        ],
        overall_confidence: 0.85,
        guided_query_required: false, // model returned false, but code must override
      })
    );

    const result = await analyzePackaging([{ base64: MOCK_BASE64, mimeType: "image/jpeg" }]);

    expect(result.guided_query_required).toBe(true);
  });

  it("enforces guided_query_required = true when overall_confidence < 0.8", async () => {
    mockCreate.mockResolvedValueOnce(
      makeGroqResponse({
        materials: [
          {
            part: "cuerpo",
            material_name: "Vidrio",
            material_code: "70",
            material_abbrev: "GL",
            confidence: 0.85,
            visual_evidence: "Transparent, heavy",
          },
        ],
        overall_confidence: 0.75, // < 0.8
        guided_query_required: false,
      })
    );

    const result = await analyzePackaging([{ base64: MOCK_BASE64, mimeType: "image/jpeg" }]);

    expect(result.guided_query_required).toBe(true);
  });

  it("keeps guided_query_required = false when all confidences are ≥ 0.8", async () => {
    mockCreate.mockResolvedValueOnce(
      makeGroqResponse({
        materials: [
          {
            part: "cuerpo",
            material_name: "Aluminio",
            material_code: "41",
            material_abbrev: "ALU",
            confidence: 0.98,
            visual_evidence: "Metallic sheen, lightweight",
          },
        ],
        overall_confidence: 0.98,
        guided_query_required: false,
      })
    );

    const result = await analyzePackaging([{ base64: MOCK_BASE64, mimeType: "image/jpeg" }]);

    expect(result.guided_query_required).toBe(false);
  });

  it("throws when Groq returns an empty response", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "" } }],
    });

    await expect(analyzePackaging([{ base64: MOCK_BASE64, mimeType: "image/jpeg" }])).rejects.toThrow(
      "Groq returned an empty response"
    );
  });

  it("throws when Groq returns invalid JSON", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "not json at all {broken" } }],
    });

    await expect(analyzePackaging([{ base64: MOCK_BASE64, mimeType: "image/jpeg" }])).rejects.toThrow(
      "Groq returned invalid JSON"
    );
  });

  it("sends the correct mimeType in the image_url", async () => {
    mockCreate.mockResolvedValue(makeGroqResponse({}));

    await analyzePackaging([{ base64: MOCK_BASE64, mimeType: "image/png" }]);

    // Pass 2 is the second mockCreate call; content[0] is the image_url block
    const pass2Call = mockCreate.mock.calls[1][0];
    const imageUrl = pass2Call.messages[0].content[0].image_url.url;
    expect(imageUrl).toMatch(/^data:image\/png;base64,/);
  });
});
