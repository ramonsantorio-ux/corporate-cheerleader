CREATE TABLE treinamentos_ssma (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cpf TEXT,
    funcao TEXT,
    situacao TEXT,
    cnh_categoria TEXT,
    cnh_vencimento DATE,
    treinamentos JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE treinamentos_ssma ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso público para testes/dev
CREATE POLICY "Acesso total publico para treinamentos_ssma" 
ON treinamentos_ssma FOR ALL USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_updated_at_treinamentos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_treinamentos_updated_at
BEFORE UPDATE ON treinamentos_ssma
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_treinamentos();
