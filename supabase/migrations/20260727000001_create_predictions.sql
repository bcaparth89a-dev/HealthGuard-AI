-- Create predictions table to store model outputs
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Model outputs
  health_score INTEGER NOT NULL,
  cardio_risk INTEGER NOT NULL,
  diabetes_risk INTEGER NOT NULL,
  stroke_risk INTEGER NOT NULL,
  overall_risk TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) on the table
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view only their own predictions
CREATE POLICY "Users can view their own predictions" 
  ON public.predictions FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own predictions
CREATE POLICY "Users can insert their own predictions" 
  ON public.predictions FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);
