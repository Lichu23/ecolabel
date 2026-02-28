/**
 * One-time ingestion script — run with:
 *   npm run ingest
 *
 * Embeds all legal chunks from legal-content.ts using Cohere
 * and stores them in Supabase legal_docs table.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { CohereClient } from "cohere-ai";
import { LEGAL_CHUNKS } from "./legal-content";

const BATCH_SIZE = 20; // Cohere free tier: safe batch size

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cohereKey = process.env.COHERE_API_KEY;

  if (!supabaseUrl || !serviceRoleKey || !cohereKey) {
    throw new Error("Missing environment variables. Check .env.local");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const cohere = new CohereClient({ token: cohereKey });

  // Clear existing data so re-runs are idempotent (no duplicate rows)
  console.log("Clearing existing legal_docs...");
  const { error: deleteError } = await supabase
    .from("legal_docs")
    .delete()
    .not("id", "is", null); // deletes all rows (service_role bypasses RLS)
  if (deleteError) {
    console.error("Delete error:", deleteError.message);
    process.exit(1);
  }
  console.log("✓ Cleared existing data");

  console.log(`Starting ingestion of ${LEGAL_CHUNKS.length} chunks...`);

  // Process in batches to respect Cohere rate limits
  for (let i = 0; i < LEGAL_CHUNKS.length; i += BATCH_SIZE) {
    const batch = LEGAL_CHUNKS.slice(i, i + BATCH_SIZE);
    const texts = batch.map((chunk) => chunk.content);

    console.log(
      `Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(LEGAL_CHUNKS.length / BATCH_SIZE)}...`
    );

    const response = await cohere.embed({
      texts,
      model: "embed-multilingual-v3.0",
      inputType: "search_document",
      embeddingTypes: ["float"],
    });

    const floats = response.embeddings as { float: number[][] };
    const embeddings = floats.float;

    const rows = batch.map((chunk, idx) => ({
      title: chunk.title,
      article_ref: chunk.article_ref,
      chunk_index: i + idx,
      content: chunk.content,
      embedding: JSON.stringify(embeddings[idx]),
      metadata: chunk.metadata ?? {},
    }));

    const { error } = await supabase.from("legal_docs").insert(rows);

    if (error) {
      console.error("Insert error:", error.message);
      process.exit(1);
    }

    console.log(`  ✓ Inserted ${rows.length} rows`);

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < LEGAL_CHUNKS.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\n✅ Ingestion complete. ${LEGAL_CHUNKS.length} chunks stored.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
