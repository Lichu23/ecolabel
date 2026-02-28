import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoist mock references ─────────────────────────────────────────────────────

const mockRpc = vi.hoisted(() => vi.fn());
const mockEmbedQuery = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    rpc: mockRpc,
  })),
}));

vi.mock("@/lib/cohere", () => ({
  embedQuery: mockEmbedQuery,
}));

import { searchLegalContext } from "@/lib/rag";
import { FALLBACK_LEGAL_CONTEXT } from "@/lib/legal-decisions";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// Realistic mock embedding (1024 dims for Cohere embed-multilingual-v3.0)
const MOCK_EMBEDDING = new Array(1024).fill(0.01);

const PET_LEGAL_CHUNK = {
  id: "aaa-111",
  title: "Identificación de materiales plásticos",
  article_ref: "RD 1055/2022 Art. 12",
  content:
    "Los envases de Polietileno tereftalato (PET) deben identificarse con el código numérico 01 y las siglas PET según el Anexo II del presente Real Decreto.",
  similarity: 0.87,
};

const RECYCLING_CHUNK = {
  id: "bbb-222",
  title: "Sistemas de identificación de materiales de envase",
  article_ref: "RD 1055/2022 Art. 13",
  content:
    "Los pictogramas de reciclaje deben imprimirse en el envase de forma legible e indeleble.",
  similarity: 0.72,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("searchLegalContext() — RAG accuracy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmbedQuery.mockResolvedValue(MOCK_EMBEDDING);
  });

  it("returns formatted legal context for a PET bottle query", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [PET_LEGAL_CHUNK, RECYCLING_CHUNK],
      error: null,
    });

    const result = await searchLegalContext("botella PET reciclaje plástico");

    // Must contain the article reference
    expect(result).toContain("RD 1055/2022 Art. 12");
    // Must contain the material keyword
    expect(result).toContain("PET");
    // Must contain the legal content
    expect(result).toContain("código numérico 01");
    // Second chunk should also be included
    expect(result).toContain("RD 1055/2022 Art. 13");
  });

  it("calls embedQuery with the original search query", async () => {
    mockRpc.mockResolvedValueOnce({ data: [PET_LEGAL_CHUNK], error: null });

    await searchLegalContext("envase vidrio GL transparente");

    expect(mockEmbedQuery).toHaveBeenCalledWith("envase vidrio GL transparente");
  });

  it("passes the embedding vector to the search_legal_docs RPC", async () => {
    mockRpc.mockResolvedValueOnce({ data: [PET_LEGAL_CHUNK], error: null });

    await searchLegalContext("PET reciclaje");

    expect(mockRpc).toHaveBeenCalledWith(
      "search_legal_docs",
      expect.objectContaining({
        query_embedding: MOCK_EMBEDDING,
      })
    );
  });

  it("returns fallback legal context when no chunks match", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    const result = await searchLegalContext("material completamente desconocido xyz");

    expect(result).toBe(FALLBACK_LEGAL_CONTEXT);
    expect(result).toContain("RD 1055/2022");
    expect(result).toContain("artículo 13");
  });

  it("formats multiple results separated by --- dividers", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [PET_LEGAL_CHUNK, RECYCLING_CHUNK],
      error: null,
    });

    const result = await searchLegalContext("PET pictograma");

    expect(result).toContain("---");
    const sections = result.split("---");
    expect(sections.length).toBeGreaterThanOrEqual(2);
  });

  it("throws when the RPC returns an error", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "relation does not exist" },
    });

    await expect(searchLegalContext("PET")).rejects.toThrow(
      "RAG search failed: relation does not exist"
    );
  });
});
