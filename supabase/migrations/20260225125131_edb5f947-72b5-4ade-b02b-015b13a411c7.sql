
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  peso NUMERIC NOT NULL,
  resultado NUMERIC NULL,
  muito_abaixo TEXT NOT NULL DEFAULT '',
  abaixo TEXT NOT NULL DEFAULT '',
  dentro TEXT NOT NULL DEFAULT '',
  acima TEXT NOT NULL DEFAULT '',
  muito_acima TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view goals" ON public.goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert goals" ON public.goals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update goals" ON public.goals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete goals" ON public.goals FOR DELETE TO authenticated USING (true);
