import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY! });

/**
 * Embed a single query string (for search at runtime).
 * Uses input_type "search_query" as required by embed-multilingual-v3.0.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const response = await cohere.embed({
    texts: [text],
    model: "embed-multilingual-v3.0",
    inputType: "search_query",
    embeddingTypes: ["float"],
  });

  const floats = response.embeddings as { float: number[][] };
  if (!Array.isArray(floats?.float?.[0])) {
    throw new Error("Cohere returned unexpected embedding shape in embedQuery");
  }
  return floats.float[0];
}

/**
 * Embed a batch of documents (for ingestion).
 * Uses input_type "search_document".
 * Cohere free tier: max 96 texts per request.
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const response = await cohere.embed({
    texts,
    model: "embed-multilingual-v3.0",
    inputType: "search_document",
    embeddingTypes: ["float"],
  });

  const floats = response.embeddings as { float: number[][] };
  if (!Array.isArray(floats?.float?.[0])) {
    throw new Error("Cohere returned unexpected embedding shape in embedDocuments");
  }
  return floats.float;
}

/**
 * Rerank candidate documents by relevance to a query.
 * Used as second-pass precision filter after vector search.
 * Free tier: ~100 requests/min.
 *
 * @param query     - The original search query
 * @param documents - Candidate text strings to rerank
 * @param topN      - How many top results to return
 * @returns Sorted indices into the original documents array
 */
export async function rerankDocuments(
  query: string,
  documents: string[],
  topN: number
): Promise<Array<{ index: number; relevanceScore: number }>> {
  const response = await cohere.rerank({
    model: "rerank-multilingual-v3.0",
    query,
    documents,
    topN,
  });
  return response.results.map((r) => ({
    index: r.index,
    relevanceScore: r.relevanceScore,
  }));
}
