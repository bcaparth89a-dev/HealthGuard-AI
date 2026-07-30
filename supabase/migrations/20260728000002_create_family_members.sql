-- Create family_members table
CREATE TABLE IF NOT EXISTS public.family_members (
  member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  age INTEGER NOT NULL,
  dob DATE,
  blood_group TEXT,
  relationship TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  height NUMERIC,
  weight NUMERIC,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on family_members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Select policy
DROP POLICY IF EXISTS "Users can view their own family members" ON public.family_members;
CREATE POLICY "Users can view their own family members" 
  ON public.family_members FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Insert policy
DROP POLICY IF EXISTS "Users can insert their own family members" ON public.family_members;
CREATE POLICY "Users can insert their own family members" 
  ON public.family_members FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Update policy
DROP POLICY IF EXISTS "Users can update their own family members" ON public.family_members;
CREATE POLICY "Users can update their own family members" 
  ON public.family_members FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Delete policy
DROP POLICY IF EXISTS "Users can delete their own family members" ON public.family_members;
CREATE POLICY "Users can delete their own family members" 
  ON public.family_members FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow service_role full management
DROP POLICY IF EXISTS "Allow service_role full management on family_members" ON public.family_members;
CREATE POLICY "Allow service_role full management on family_members" 
  ON public.family_members FOR ALL 
  TO service_role 
  USING (true);

-- Alter health_records table to reference family_members
ALTER TABLE public.health_records 
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.family_members(member_id) ON DELETE CASCADE;

-- Alter risk_predictions table to reference family_members
ALTER TABLE public.risk_predictions 
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.family_members(member_id) ON DELETE CASCADE;

-- Alter health_reports table to reference family_members and add EMR compatibility columns
ALTER TABLE public.health_reports 
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.family_members(member_id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS report_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS personal_information JSONB,
ADD COLUMN IF NOT EXISTS lifestyle JSONB,
ADD COLUMN IF NOT EXISTS prediction JSONB,
ADD COLUMN IF NOT EXISTS overall_health_score INTEGER;

-- Alter ai_reports table to reference family_members
ALTER TABLE public.ai_reports 
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.family_members(member_id) ON DELETE CASCADE;
