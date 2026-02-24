
-- Ciclos de avaliação (períodos)
CREATE TABLE public.evaluation_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Competências (personalizáveis)
CREATE TABLE public.competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cycle_id UUID REFERENCES public.evaluation_cycles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Avaliações 360° (quem avalia quem)
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.evaluation_cycles(id) ON DELETE CASCADE,
  evaluator_name TEXT NOT NULL,
  evaluator_role TEXT NOT NULL CHECK (evaluator_role IN ('self', 'manager', 'peer', 'subordinate')),
  evaluated_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Respostas das competências por avaliação
CREATE TABLE public.evaluation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PDIs (Plano de Desenvolvimento Individual)
CREATE TABLE public.pdis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.evaluation_cycles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ações do PDI
CREATE TABLE public.pdi_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  competency_id UUID REFERENCES public.competencies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS - habilitar em todas as tabelas
ALTER TABLE public.evaluation_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_actions ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para leitura/escrita (sem auth por enquanto, será restrito depois)
CREATE POLICY "Allow all access to evaluation_cycles" ON public.evaluation_cycles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to competencies" ON public.competencies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to evaluations" ON public.evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to evaluation_responses" ON public.evaluation_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to pdis" ON public.pdis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to pdi_actions" ON public.pdi_actions FOR ALL USING (true) WITH CHECK (true);
