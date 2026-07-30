-- 1. Ensure all health_records fields exist
ALTER TABLE public.health_records 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS symptoms TEXT,
ADD COLUMN IF NOT EXISTS medications TEXT,
ADD COLUMN IF NOT EXISTS allergies TEXT;

-- 2. Create risk_predictions table with strict 1:1 assessment constraint
CREATE TABLE IF NOT EXISTS public.risk_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.health_records(id) ON DELETE CASCADE,
  overall_risk TEXT NOT NULL,
  cardio_risk INTEGER NOT NULL,
  diabetes_risk INTEGER NOT NULL,
  stroke_risk INTEGER NOT NULL,
  health_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  recommendations TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_assessment_prediction UNIQUE (assessment_id)
);

-- Enable RLS on risk_predictions
ALTER TABLE public.risk_predictions ENABLE ROW LEVEL SECURITY;

-- Select policy
DROP POLICY IF EXISTS "Users can view their own risk predictions" ON public.risk_predictions;
CREATE POLICY "Users can view their own risk predictions" 
  ON public.risk_predictions FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Insert policy
DROP POLICY IF EXISTS "Users can insert their own risk predictions" ON public.risk_predictions;
CREATE POLICY "Users can insert their own risk predictions" 
  ON public.risk_predictions FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- 3. Create ai_reports table
CREATE TABLE IF NOT EXISTS public.ai_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.health_records(id) ON DELETE CASCADE,
  prediction_id UUID REFERENCES public.risk_predictions(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  health_status TEXT NOT NULL,
  diet TEXT[] NOT NULL,
  exercise TEXT[] NOT NULL,
  precautions TEXT[] NOT NULL,
  doctor_advice TEXT NOT NULL,
  emergency TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on ai_reports
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

-- Select policy
DROP POLICY IF EXISTS "Users can view their own ai reports" ON public.ai_reports;
CREATE POLICY "Users can view their own ai reports" 
  ON public.ai_reports FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Insert policy
DROP POLICY IF EXISTS "Users can insert their own ai reports" ON public.ai_reports;
CREATE POLICY "Users can insert their own ai reports" 
  ON public.ai_reports FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);
