
-- Fix overly permissive RLS policies on existing tables
-- Replace with authenticated-only access

DROP POLICY IF EXISTS "Allow all access to competencies" ON public.competencies;
CREATE POLICY "Authenticated users can manage competencies" ON public.competencies
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to evaluation_cycles" ON public.evaluation_cycles;
CREATE POLICY "Authenticated users can manage evaluation_cycles" ON public.evaluation_cycles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to evaluation_responses" ON public.evaluation_responses;
CREATE POLICY "Authenticated users can manage evaluation_responses" ON public.evaluation_responses
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to evaluations" ON public.evaluations;
CREATE POLICY "Authenticated users can manage evaluations" ON public.evaluations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to pdi_actions" ON public.pdi_actions;
CREATE POLICY "Authenticated users can manage pdi_actions" ON public.pdi_actions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to pdis" ON public.pdis;
CREATE POLICY "Authenticated users can manage pdis" ON public.pdis
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
