
ALTER TABLE public.funcionarios
  ADD COLUMN IF NOT EXISTS turno text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS letra text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS encarregado_id uuid REFERENCES public.funcionarios(id) ON DELETE SET NULL;
