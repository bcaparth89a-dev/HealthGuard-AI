-- 1. Create the trigger function to automatically synchronize users on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger to execute handle_new_user() after insert on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Copy all existing auth.users into public.users
INSERT INTO public.users (id, email, full_name)
SELECT 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Consistently map all application foreign keys directly to public.users(id)
ALTER TABLE public.health_records 
  DROP CONSTRAINT IF EXISTS health_records_user_id_fkey;

ALTER TABLE public.health_records 
  ADD CONSTRAINT health_records_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.risk_predictions 
  DROP CONSTRAINT IF EXISTS risk_predictions_user_id_fkey;

ALTER TABLE public.risk_predictions 
  ADD CONSTRAINT risk_predictions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.ai_reports 
  DROP CONSTRAINT IF EXISTS ai_reports_user_id_fkey;

ALTER TABLE public.ai_reports 
  ADD CONSTRAINT ai_reports_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
