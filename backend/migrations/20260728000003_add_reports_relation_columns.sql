-- Alter health_reports table to add explicit foreign keys to source tables
ALTER TABLE public.health_reports 
ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES public.health_records(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS prediction_id UUID REFERENCES public.risk_predictions(id) ON DELETE SET NULL;
