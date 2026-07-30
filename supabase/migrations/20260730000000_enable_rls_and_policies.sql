-- ========================================================
-- HEALTHGUARD AI - SECURE DB SYNCHRONIZATION AND RLS SCRIPT
-- ========================================================

-- 1. Create the Users Table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  avatar_url TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create the Trigger Function to Sync Profiles on Registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    null
  )
  ON CONFLICT (id) DO UPDATE 
  SET email = EXCLUDED.email, 
      full_name = CASE WHEN public.users.full_name = '' THEN EXCLUDED.full_name ELSE public.users.full_name END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind the Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Sync any existing auth.users into public.users
INSERT INTO public.users (id, email, full_name, avatar_url)
SELECT 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
  null
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 5. Enable Row Level Security (RLS) on all application tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- 6. Setup RLS Policies for each table
-- ========================================================

-- public.users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;
CREATE POLICY "Users can delete their own profile" ON public.users FOR DELETE TO authenticated USING (auth.uid() = id);


-- public.health_records policies
DROP POLICY IF EXISTS "Users can view their own health records" ON public.health_records;
CREATE POLICY "Users can view their own health records" ON public.health_records FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own health records" ON public.health_records;
CREATE POLICY "Users can insert their own health records" ON public.health_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own health records" ON public.health_records;
CREATE POLICY "Users can update their own health records" ON public.health_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own health records" ON public.health_records;
CREATE POLICY "Users can delete their own health records" ON public.health_records FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- public.risk_predictions policies
DROP POLICY IF EXISTS "Users can view their own risk predictions" ON public.risk_predictions;
CREATE POLICY "Users can view their own risk predictions" ON public.risk_predictions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own risk predictions" ON public.risk_predictions;
CREATE POLICY "Users can insert their own risk predictions" ON public.risk_predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own risk predictions" ON public.risk_predictions;
CREATE POLICY "Users can update their own risk predictions" ON public.risk_predictions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own risk predictions" ON public.risk_predictions;
CREATE POLICY "Users can delete their own risk predictions" ON public.risk_predictions FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- public.ai_reports policies
DROP POLICY IF EXISTS "Users can view their own ai reports" ON public.ai_reports;
CREATE POLICY "Users can view their own ai reports" ON public.ai_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own ai reports" ON public.ai_reports;
CREATE POLICY "Users can insert their own ai reports" ON public.ai_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ai reports" ON public.ai_reports;
CREATE POLICY "Users can update their own ai reports" ON public.ai_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own ai reports" ON public.ai_reports;
CREATE POLICY "Users can delete their own ai reports" ON public.ai_reports FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- public.health_reports policies
DROP POLICY IF EXISTS "Users can view their own reports" ON public.health_reports;
CREATE POLICY "Users can view their own reports" ON public.health_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reports" ON public.health_reports;
CREATE POLICY "Users can insert their own reports" ON public.health_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reports" ON public.health_reports;
CREATE POLICY "Users can update their own reports" ON public.health_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reports" ON public.health_reports;
CREATE POLICY "Users can delete their own reports" ON public.health_reports FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow service_role full management on health_reports" ON public.health_reports;
CREATE POLICY "Allow service_role full management on health_reports" ON public.health_reports FOR ALL TO service_role USING (true) WITH CHECK (true);


-- public.family_members policies
DROP POLICY IF EXISTS "Users can view their own family members" ON public.family_members;
CREATE POLICY "Users can view their own family members" ON public.family_members FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own family members" ON public.family_members;
CREATE POLICY "Users can insert their own family members" ON public.family_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own family members" ON public.family_members;
CREATE POLICY "Users can update their own family members" ON public.family_members FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own family members" ON public.family_members;
CREATE POLICY "Users can delete their own family members" ON public.family_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow service_role full management on family_members" ON public.family_members;
CREATE POLICY "Allow service_role full management on family_members" ON public.family_members FOR ALL TO service_role USING (true) WITH CHECK (true);


-- public.predictions policies
DROP POLICY IF EXISTS "Users can view their own predictions" ON public.predictions;
CREATE POLICY "Users can view their own predictions" ON public.predictions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own predictions" ON public.predictions;
CREATE POLICY "Users can insert their own predictions" ON public.predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own predictions" ON public.predictions;
CREATE POLICY "Users can update their own predictions" ON public.predictions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own predictions" ON public.predictions;
CREATE POLICY "Users can delete their own predictions" ON public.predictions FOR DELETE TO authenticated USING (auth.uid() = user_id);
