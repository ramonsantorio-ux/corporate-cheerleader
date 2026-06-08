-- Migration para adicionar campos de Saúde e Severidade de Ocorrências
ALTER TABLE events
ADD COLUMN IF NOT EXISTS cid text,
ADD COLUMN IF NOT EXISTS atestado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS afastamento boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS danos_materiais boolean DEFAULT false;
