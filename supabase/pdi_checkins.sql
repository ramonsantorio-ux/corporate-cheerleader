-- Criar tabela de histórico de check-ins do PDI
CREATE TABLE IF NOT EXISTS public.pdi_checkins (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    pdi_id uuid NOT NULL,
    date timestamp with time zone NOT NULL DEFAULT now(),
    notes text,
    next_steps text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT pdi_checkins_pkey PRIMARY KEY (id),
    CONSTRAINT pdi_checkins_pdi_id_fkey FOREIGN KEY (pdi_id) REFERENCES public.pdis (id) ON DELETE CASCADE
);

-- Adicionar políticas de RLS
ALTER TABLE public.pdi_checkins ENABLE ROW LEVEL SECURITY;

-- Política para permitir select a todos os usuários autenticados
CREATE POLICY "Permitir leitura de checkins para todos" ON public.pdi_checkins
    AS PERMISSIVE FOR SELECT
    TO public
    USING (true);

-- Política para permitir insert a todos os usuários autenticados
CREATE POLICY "Permitir criacao de checkins" ON public.pdi_checkins
    AS PERMISSIVE FOR INSERT
    TO public
    WITH CHECK (true);

-- Política para permitir update a todos os usuários autenticados
CREATE POLICY "Permitir atualizacao de checkins" ON public.pdi_checkins
    AS PERMISSIVE FOR UPDATE
    TO public
    USING (true);

-- Política para permitir delete a todos os usuários autenticados
CREATE POLICY "Permitir exclusao de checkins" ON public.pdi_checkins
    AS PERMISSIVE FOR DELETE
    TO public
    USING (true);
