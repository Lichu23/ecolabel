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

  console.log(`[rag] Query: "${query}"`);

  const embedding = await embedQuery(query);
  console.log(`[rag] Embedding computed (dim=${embedding.length})`);

  const { data, error } = await supabase.rpc("search_legal_docs", {
    query_embedding: embedding,
    match_count: matchCount,
    similarity_threshold: similarityThreshold,
  });

  if (error) throw new Error(`RAG search failed: ${error.message}`);

  const matches = (data as LegalMatch[]) ?? [];

  if (matches.length === 0) {
    console.log(`[rag] Vector search → 0 matches (threshold=${similarityThreshold}) — using FALLBACK_LEGAL_CONTEXT`);
    return FALLBACK_LEGAL_CONTEXT;
  }

  console.log(`[rag] Vector search → ${matches.length} matches (threshold=${similarityThreshold}):`);
  for (const m of matches) {
    console.log(`[rag]   sim=${m.similarity.toFixed(3)} | ${m.article_ref} | "${m.title}"`);
  }

  // Rerank: second-pass precision filter — keep top 5 from the 8 vector candidates
  let finalMatches = matches;
  try {
    const docs = matches.map((m) => `${m.title}\n${m.content}`);
    const reranked = await rerankDocuments(query, docs, 5);
    finalMatches = reranked.map((r) => matches[r.index]);
    console.log(`[rag] Reranked ${matches.length} → ${finalMatches.length} results:`);
    for (let i = 0; i < finalMatches.length; i++) {
      console.log(`[rag]   #${i + 1} rerank_score=${reranked[i].relevanceScore.toFixed(3)} | ${finalMatches[i].article_ref} | "${finalMatches[i].title}"`);
    }
  } catch (err) {
    // Rerank failure is non-fatal — fall back to vector search order
    console.log(`[rag] Rerank failed (${err instanceof Error ? err.message : String(err)}) — using vector order, top ${Math.min(5, matches.length)}`);
    finalMatches = matches.slice(0, 5);
  }

  return finalMatches
    .map((m) => `[${m.article_ref}] ${m.title}\n${m.content}`)
    .join("\n\n---\n\n");
}
