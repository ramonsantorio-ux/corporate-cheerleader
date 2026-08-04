-- Fix RLS policies and foreign key for assessment_results
ALTER TABLE public.assessment_results DROP CONSTRAINT IF EXISTS assessment_results_user_id_fkey;
ALTER TABLE public.assessment_results ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to assessment_results" ON public.assessment_results;
DROP POLICY IF EXISTS "Users can read own assessment results" ON public.assessment_results;
DROP POLICY IF EXISTS "Users can insert own assessment results" ON public.assessment_results;
DROP POLICY IF EXISTS "Users can update own assessment results" ON public.assessment_results;
DROP POLICY IF EXISTS "Users can view their own assessment results" ON public.assessment_results;
DROP POLICY IF EXISTS "Users can insert their own assessment results" ON public.assessment_results;
DROP POLICY IF EXISTS "Admins can view all assessment results" ON public.assessment_results;
DROP POLICY IF EXISTS "Admins can insert all assessment results" ON public.assessment_results;
DROP POLICY IF EXISTS "Admins can update all assessment results" ON public.assessment_results;
DROP POLICY IF EXISTS "Admins can delete all assessment results" ON public.assessment_results;

CREATE POLICY "Allow all access to assessment_results" ON public.assessment_results
  FOR ALL USING (true) WITH CHECK (true);
