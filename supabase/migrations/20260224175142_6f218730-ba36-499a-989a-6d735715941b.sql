
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  departamento TEXT NOT NULL,
  cargo TEXT NOT NULL,
  data_admissao DATE NOT NULL DEFAULT CURRENT_DATE,
  feedbacks_recebidos INTEGER NOT NULL DEFAULT 0,
  feedbacks_resolvidos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view funcionarios" ON public.funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert funcionarios" ON public.funcionarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update funcionarios" ON public.funcionarios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete funcionarios" ON public.funcionarios FOR DELETE TO authenticated USING (true);
