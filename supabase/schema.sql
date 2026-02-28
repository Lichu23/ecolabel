-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- COMPANIES
-- ============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cif TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own company"
  ON companies FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_path TEXT,        -- private Supabase Storage path
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = products.company_id
        AND companies.user_id = auth.uid()
    )
  );

-- ============================================
-- ANALYSES (AI Vision results)
-- ============================================
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'needs_review')),
  raw_response JSONB,           -- full Groq response
  materials JSONB,              -- extracted materials array
  overall_confidence FLOAT,     -- 0.0 - 1.0
  guided_query_required BOOLEAN NOT NULL DEFAULT FALSE,
  guided_query_answers JSONB,   -- user answers to guided queries
  legal_context TEXT,           -- RAG-retrieved legal text
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own analyses"
  ON analyses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN companies ON companies.id = products.company_id
      WHERE products.id = analyses.product_id
        AND companies.user_id = auth.uid()
    )
  );

-- ============================================
-- LABELS (Generated SVG/PDF)
-- ============================================
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  svg_path TEXT,                -- Supabase Storage path
  pdf_path TEXT,                -- Supabase Storage path
  qr_url TEXT,                  -- public URL for QR code legal justification
  version INTEGER NOT NULL DEFAULT 1,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own labels"
  ON labels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = labels.company_id
        AND companies.user_id = auth.uid()
    )
  );

-- ============================================
-- LEGAL DOCS (RAG knowledge base)
-- ============================================
CREATE TABLE legal_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  article_ref TEXT,             -- e.g. "RD 1055/2022 Art. 12"
  chunk_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  embedding VECTOR(1024),       -- Cohere embed-multilingual-v3.0 dimensions
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IVFFlat index for fast ANN search
CREATE INDEX ON legal_docs USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- No RLS on legal_docs — public read, admin write
ALTER TABLE legal_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read on legal docs"
  ON legal_docs FOR SELECT
  USING (TRUE);

-- ============================================
-- NOTIFICATIONS LOG
-- ============================================
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'failed', 'pending')),
  recipient TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM labels
      JOIN companies ON companies.id = labels.company_id
      WHERE labels.id = notification_logs.label_id
        AND companies.user_id = auth.uid()
    )
  );

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_companies
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_analyses
  BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
