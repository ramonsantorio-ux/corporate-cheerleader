
-- Reuniões 1:1
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE NOT NULL,
  manager_name TEXT NOT NULL,
  meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  action_items TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage meetings"
ON public.meetings FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Clima organizacional - Pesquisas
CREATE TABLE public.climate_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ
);

ALTER TABLE public.climate_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage climate_surveys"
ON public.climate_surveys FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Respostas das pesquisas
CREATE TABLE public.climate_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.climate_surveys(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.climate_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage climate_responses"
ON public.climate_responses FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Controle de ausências/férias
CREATE TABLE public.absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'ferias',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage absences"
ON public.absences FOR ALL TO authenticated
USING (true) WITH CHECK (true);
