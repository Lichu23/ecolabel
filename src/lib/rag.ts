import "server-only";
import { createClient } from "@supabase/supabase-js";
import { embedQuery, rerankDocuments } from "./cohere";
import { FALLBACK_LEGAL_CONTEXT } from "./legal-decisions";

interface LegalMatch {
  id: string;
  title: string;
  article_ref: string;
  content: string;
  similarity: number;
}

/**
 * Searches the legal_docs knowledge base using vector similarity.
 * Returns the most relevant RD 1055/2022 articles for a given query.
 *
 * @param query - Natural language query (e.g. "botella PET reciclaje")
 * @param matchCount - Number of chunks to return (default 4)
 * @param similarityThreshold - Minimum similarity score 0-1 (default 0.4)
 */
export async function searchLegalContext(
  query: string,
  matchCount = 8,
  similarityThreshold = 0.4
): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const embedding = await embedQuery(query);

  const { data, error } = await supabase.rpc("search_legal_docs", {
    query_embedding: embedding,
    match_count: matchCount,
    similarity_threshold: similarityThreshold,
  });

  if (error) throw new Error(`RAG search failed: ${error.message}`);

  const matches = (data as LegalMatch[]) ?? [];

  if (matches.length === 0) {
    return FALLBACK_LEGAL_CONTEXT;
  }

  // Rerank: second-pass precision filter — keep top 5 from the 8 vector candidates
  let finalMatches = matches;
  try {
    const docs = matches.map((m) => `${m.title}\n${m.content}`);
    const reranked = await rerankDocuments(query, docs, 5);
    finalMatches = reranked.map((r) => matches[r.index]);
  } catch {
    // Rerank failure is non-fatal — fall back to vector search order
    finalMatches = matches.slice(0, 5);
  }

  return finalMatches
    .map((m) => `[${m.article_ref}] ${m.title}\n${m.content}`)
    .join("\n\n---\n\n");
}
