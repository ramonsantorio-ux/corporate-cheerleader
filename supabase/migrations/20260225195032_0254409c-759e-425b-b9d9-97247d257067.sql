
CREATE TABLE public.fit_cultural (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  criteria text NOT NULL,
  stage text NOT NULL DEFAULT 'autoavaliacao',
  score integer DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fit_cultural ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage fit_cultural"
  ON public.fit_cultural
  FOR ALL
  USING (true)
  WITH CHECK (true);
