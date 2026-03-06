
-- CCO Fleet assignments table
CREATE TABLE public.cco_fleet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento text NOT NULL,
  placa text NOT NULL DEFAULT '',
  local text NOT NULL DEFAULT '',
  operador_turno_a text NOT NULL DEFAULT '',
  operador_turno_b text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT 'porto',
  tipo text NOT NULL DEFAULT 'operacional',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cco_fleet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage cco_fleet"
  ON public.cco_fleet FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- CCO Maintenance records table
CREATE TABLE public.cco_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL DEFAULT CURRENT_DATE,
  placa text NOT NULL DEFAULT '',
  tipo_equipamento text NOT NULL DEFAULT '',
  motorista text NOT NULL DEFAULT '',
  letra text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  servico text NOT NULL DEFAULT '',
  tipo_manutencao text NOT NULL DEFAULT '',
  inicio time,
  liberacao time,
  horas_perdidas text NOT NULL DEFAULT '00:00:00',
  observacao text DEFAULT '',
  status text NOT NULL DEFAULT 'EM ANDAMENTO',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cco_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage cco_maintenance"
  ON public.cco_maintenance FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
