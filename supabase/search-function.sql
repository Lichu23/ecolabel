-- Run this in the Supabase SQL Editor BEFORE running the ingestion script.
-- Creates the RPC function used by searchLegalContext() in src/lib/rag.ts

CREATE OR REPLACE FUNCTION search_legal_docs(
  query_embedding VECTOR(1024),
  match_count     INT   DEFAULT 4,
  similarity_threshold FLOAT DEFAULT 0.4
)
RETURNS TABLE (
  id           UUID,
  title        TEXT,
  article_ref  TEXT,
  content      TEXT,
  similarity   FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    legal_docs.id,
    legal_docs.title,
    legal_docs.article_ref,
    legal_docs.content,
    1 - (legal_docs.embedding <=> query_embedding) AS similarity
  FROM legal_docs
  WHERE 1 - (legal_docs.embedding <=> query_embedding) > similarity_threshold
  ORDER BY legal_docs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
