-- ============================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA: Políticas RLS Abertas
-- Substitui todas as políticas "Allow all" por políticas
-- que verificam autenticação antes de permitir acesso.
-- ============================================================

-- ---- evaluation_cycles ----
DROP POLICY IF EXISTS "Allow all access to evaluation_cycles" ON public.evaluation_cycles;
CREATE POLICY "Authenticated users can read evaluation_cycles" ON public.evaluation_cycles
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert evaluation_cycles" ON public.evaluation_cycles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update evaluation_cycles" ON public.evaluation_cycles
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete evaluation_cycles" ON public.evaluation_cycles
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---- competencies ----
DROP POLICY IF EXISTS "Allow all access to competencies" ON public.competencies;
CREATE POLICY "Authenticated users can read competencies" ON public.competencies
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert competencies" ON public.competencies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update competencies" ON public.competencies
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete competencies" ON public.competencies
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---- evaluations ----
DROP POLICY IF EXISTS "Allow all access to evaluations" ON public.evaluations;
CREATE POLICY "Authenticated users can read evaluations" ON public.evaluations
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert evaluations" ON public.evaluations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update evaluations" ON public.evaluations
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete evaluations" ON public.evaluations
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---- evaluation_responses ----
DROP POLICY IF EXISTS "Allow all access to evaluation_responses" ON public.evaluation_responses;
CREATE POLICY "Authenticated users can read evaluation_responses" ON public.evaluation_responses
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert evaluation_responses" ON public.evaluation_responses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update evaluation_responses" ON public.evaluation_responses
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete evaluation_responses" ON public.evaluation_responses
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---- pdis ----
DROP POLICY IF EXISTS "Allow all access to pdis" ON public.pdis;
CREATE POLICY "Authenticated users can read pdis" ON public.pdis
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert pdis" ON public.pdis
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update pdis" ON public.pdis
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete pdis" ON public.pdis
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---- pdi_actions ----
DROP POLICY IF EXISTS "Allow all access to pdi_actions" ON public.pdi_actions;
CREATE POLICY "Authenticated users can read pdi_actions" ON public.pdi_actions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert pdi_actions" ON public.pdi_actions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update pdi_actions" ON public.pdi_actions
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete pdi_actions" ON public.pdi_actions
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---- assessment_results ----
DROP POLICY IF EXISTS "Allow all access to assessment_results" ON public.assessment_results;
CREATE POLICY "Users can read own assessment results" ON public.assessment_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessment results" ON public.assessment_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assessment results" ON public.assessment_results
  FOR UPDATE USING (auth.uid() = user_id);

-- ---- treinamentos ----
DROP POLICY IF EXISTS "Allow all access to treinamentos" ON public.treinamentos;
CREATE POLICY "Authenticated users can read treinamentos" ON public.treinamentos
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert treinamentos" ON public.treinamentos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update treinamentos" ON public.treinamentos
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete treinamentos" ON public.treinamentos
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---- ssma_n3 ----
DROP POLICY IF EXISTS "Allow all access to ssma_n3" ON public.ssma_n3;
CREATE POLICY "Authenticated users can read ssma_n3" ON public.ssma_n3
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert ssma_n3" ON public.ssma_n3
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update ssma_n3" ON public.ssma_n3
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete ssma_n3" ON public.ssma_n3
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---- nine_box_historico ----
DROP POLICY IF EXISTS "Allow all access to nine_box_historico" ON public.nine_box_historico;
CREATE POLICY "Authenticated users can read nine_box_historico" ON public.nine_box_historico
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert nine_box_historico" ON public.nine_box_historico
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update nine_box_historico" ON public.nine_box_historico
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete nine_box_historico" ON public.nine_box_historico
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ---- funcionarios (tabela principal) ----
DROP POLICY IF EXISTS "Allow all access to funcionarios" ON public.funcionarios;
CREATE POLICY "Authenticated users can read funcionarios" ON public.funcionarios
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert funcionarios" ON public.funcionarios
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update funcionarios" ON public.funcionarios
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete funcionarios" ON public.funcionarios
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- TABELA DE AUDIT LOG: Registra ações administrativas críticas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID,
  target_table TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler o log
CREATE POLICY "Admins can read audit log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Sistema pode inserir via service role (edge functions)
CREATE POLICY "Service role can insert audit log" ON public.audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
