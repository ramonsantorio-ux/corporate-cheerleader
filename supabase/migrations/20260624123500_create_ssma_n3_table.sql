CREATE TABLE IF NOT EXISTS public.ssma_n3 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_email TEXT NOT NULL,
    periodo TEXT NOT NULL,
    total_verificacoes INTEGER DEFAULT 0,
    total_treinamentos INTEGER DEFAULT 0,
    total_assistencia INTEGER DEFAULT 0,
    verificacoes_nc INTEGER DEFAULT 0,
    perguntas_nc INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.ssma_n3 ENABLE ROW LEVEL SECURITY;

-- Criar políticas (todos podem ler e escrever por enquanto, seguindo o padrão)
CREATE POLICY "Permitir leitura para todos os usuários autenticados" ON public.ssma_n3
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção/atualização para usuários autenticados" ON public.ssma_n3
    FOR ALL USING (true);
