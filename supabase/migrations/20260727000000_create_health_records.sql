-- Create health_records table to store modular assessment responses
CREATE TABLE IF NOT EXISTS public.health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Step 1: Personal Information
  full_name TEXT,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  height NUMERIC NOT NULL,
  weight NUMERIC NOT NULL,
  bmi NUMERIC,
  blood_group TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  
  -- Step 2: Lifestyle
  exercise_frequency TEXT,
  smoking TEXT,
  alcohol TEXT,
  sleep_hours NUMERIC,
  water_intake NUMERIC,
  food_preference TEXT,
  occupation TEXT,
  
  -- Step 3: Medical Information
  blood_pressure TEXT,
  blood_sugar NUMERIC,
  heart_rate NUMERIC,
  cholesterol NUMERIC,
  known_diseases TEXT,
  current_medicines TEXT,
  allergies TEXT,
  family_history TEXT,
  
  -- Step 4: Symptoms
  symptoms TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) on the table
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view only their own records
CREATE POLICY "Users can view their own health records" 
  ON public.health_records FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own records
CREATE POLICY "Users can insert their own health records" 
  ON public.health_records FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);
