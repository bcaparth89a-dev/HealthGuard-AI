-- Alter health_records table to add any missing lifestyle columns
ALTER TABLE public.health_records 
ADD COLUMN IF NOT EXISTS diet TEXT,
ADD COLUMN IF NOT EXISTS fast_food TEXT,
ADD COLUMN IF NOT EXISTS sugary_drinks TEXT,
ADD COLUMN IF NOT EXISTS stress TEXT,
ADD COLUMN IF NOT EXISTS screen_time NUMERIC,
ADD COLUMN IF NOT EXISTS fruit_intake TEXT,
ADD COLUMN IF NOT EXISTS vegetable_intake TEXT,
ADD COLUMN IF NOT EXISTS physical_activity TEXT;

-- Create health_reports table
CREATE TABLE IF NOT EXISTS public.health_reports (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  patient_name TEXT,
  assessment_date DATE DEFAULT CURRENT_DATE,
  assessment_time TIME DEFAULT CURRENT_TIME,
  personal_info JSONB,
  lifestyle_info JSONB,
  medical_history JSONB,
  symptoms TEXT,
  prediction_results JSONB,
  gemini_summary TEXT,
  gemini_recommendations JSONB,
  health_score INTEGER,
  health_index INTEGER,
  overall_risk TEXT,
  disease_risks JSONB,
  pdf_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on health_reports
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;

-- Select policy
DROP POLICY IF EXISTS "Users can view their own reports" ON public.health_reports;
CREATE POLICY "Users can view their own reports" 
  ON public.health_reports FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Insert policy
DROP POLICY IF EXISTS "Users can insert their own reports" ON public.health_reports;
CREATE POLICY "Users can insert their own reports" 
  ON public.health_reports FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Update policy
DROP POLICY IF EXISTS "Users can update their own reports" ON public.health_reports;
CREATE POLICY "Users can update their own reports" 
  ON public.health_reports FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Delete policy
DROP POLICY IF EXISTS "Users can delete their own reports" ON public.health_reports;
CREATE POLICY "Users can delete their own reports" 
  ON public.health_reports FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow service role full access
DROP POLICY IF EXISTS "Allow service_role full management on health_reports" ON public.health_reports;
CREATE POLICY "Allow service_role full management on health_reports" 
  ON public.health_reports FOR ALL 
  TO service_role 
  USING (true);
