-- Crie a tabela para registrar os encerramentos do Fit Cultural
CREATE TABLE public.fit_cultural_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.evaluation_cycles(id) ON DELETE CASCADE,
    closed_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Garante que um funcionário só possa ter um encerramento por ciclo
    UNIQUE(employee_id, cycle_id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.fit_cultural_closures ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso para permitir operações apenas de usuários autenticados
CREATE POLICY "Permitir tudo para usuários autenticados" 
ON public.fit_cultural_closures FOR ALL 
USING (auth.role() = 'authenticated');
