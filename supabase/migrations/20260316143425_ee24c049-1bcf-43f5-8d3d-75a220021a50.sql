
CREATE TABLE public.employee_warnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT NOT NULL DEFAULT '',
  applied BOOLEAN NOT NULL DEFAULT false,
  observation TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage employee_warnings"
  ON public.employee_warnings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
