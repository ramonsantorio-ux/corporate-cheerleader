
CREATE TABLE public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  setor TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'novo',
  autor TEXT NOT NULL,
  departamento TEXT NOT NULL DEFAULT '',
  pontos_positivos TEXT DEFAULT '',
  pontos_melhoria TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  votos INTEGER NOT NULL DEFAULT 0,
  comentarios INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view feedbacks" ON public.feedbacks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert feedbacks" ON public.feedbacks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update feedbacks" ON public.feedbacks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete feedbacks" ON public.feedbacks FOR DELETE TO authenticated USING (true);
