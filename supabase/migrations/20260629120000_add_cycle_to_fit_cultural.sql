ALTER TABLE public.fit_cultural ADD COLUMN cycle_id uuid REFERENCES public.evaluation_cycles(id) ON DELETE SET NULL;
