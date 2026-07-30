-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create knowledge_base table to store chunk text and 768-dimension Gemini embeddings
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL UNIQUE,
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- 4. Allow read access (select) to all users (authenticated and anonymous)
DROP POLICY IF EXISTS "Allow read access to all users" ON public.knowledge_base;
CREATE POLICY "Allow read access to all users" ON public.knowledge_base
  FOR SELECT TO public USING (true);

-- 5. Allow full write access to the service_role key
DROP POLICY IF EXISTS "Allow service role full management" ON public.knowledge_base;
CREATE POLICY "Allow service role full management" ON public.knowledge_base
  FOR ALL TO service_role USING (true);
