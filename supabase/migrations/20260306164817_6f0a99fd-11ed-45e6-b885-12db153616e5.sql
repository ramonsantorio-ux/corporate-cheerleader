
CREATE TABLE public.cco_third_party (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os text NOT NULL DEFAULT '',
  data date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Finalizada',
  dono text NOT NULL DEFAULT '',
  tipo_equipamento text NOT NULL DEFAULT '',
  tag text NOT NULL DEFAULT '',
  atendimento text NOT NULL DEFAULT 'Sim',
  desvio text NOT NULL DEFAULT '',
  justificativa text NOT NULL DEFAULT '',
  df_percent numeric DEFAULT NULL,
  hora_prog_inicio text NOT NULL DEFAULT '',
  hora_prog_final text NOT NULL DEFAULT '',
  total_hora_prog numeric DEFAULT NULL,
  hora_real_inicio text NOT NULL DEFAULT '',
  hora_real_final text NOT NULL DEFAULT '',
  total_hora_real numeric DEFAULT NULL,
  aderencia numeric DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cco_third_party ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage cco_third_party"
  ON public.cco_third_party
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
