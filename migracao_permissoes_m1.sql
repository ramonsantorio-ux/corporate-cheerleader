-- Este script finaliza a consolidação do Módulo de Permissões (M1).
-- Ele adiciona as colunas 'can_create' e 'can_delete' à tabela legada de permissões individuais,
-- para que ela tenha a mesma granularidade dos Perfis de Acesso.

-- 1. Adiciona as colunas ausentes
ALTER TABLE public.user_permissions 
ADD COLUMN IF NOT EXISTS can_create BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_delete BOOLEAN DEFAULT false;

-- 2. Migra os dados antigos (copiando 'can_edit' para 'can_create') para não quebrar fluxos atuais
UPDATE public.user_permissions
SET can_create = can_edit
WHERE can_create IS NULL OR can_create = false;
