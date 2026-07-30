-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create knowledge_base table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL UNIQUE,
    embedding VECTOR(768),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create HNSW index for vector similarity search
-- HNSW is recommended over IVFFlat for better performance and recall
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_hnsw_idx 
ON public.knowledge_base 
USING hnsw (embedding vector_cosine_ops);

-- 4. Create similarity search function (match_documents)
CREATE OR REPLACE FUNCTION public.match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_base.id,
    knowledge_base.content,
    1 - (knowledge_base.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base
  WHERE 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_base.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Allow read access (select) to all users (authenticated and anonymous)
DROP POLICY IF EXISTS "Allow read access to all users" ON public.knowledge_base;
CREATE POLICY "Allow read access to all users" ON public.knowledge_base
  FOR SELECT TO public USING (true);

-- Allow full write access to the service_role key
DROP POLICY IF EXISTS "Allow service role full management" ON public.knowledge_base;
CREATE POLICY "Allow service role full management" ON public.knowledge_base
  FOR ALL TO service_role USING (true);
