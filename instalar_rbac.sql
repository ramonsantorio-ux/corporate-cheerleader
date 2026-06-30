-- 1. Tabela de Perfis de Acesso
CREATE TABLE IF NOT EXISTS public.access_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Permissões dos Perfis
CREATE TABLE IF NOT EXISTS public.access_profile_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.access_profiles(id) ON DELETE CASCADE,
    page TEXT NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, page)
);

-- 3. Atualizar a tabela user_roles para aceitar perfil
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.access_profiles(id) ON DELETE SET NULL;

-- 4. Função para Criar Usuário Seguramente pelo Gestor (Bypass do Edge Function)
CREATE OR REPLACE FUNCTION public.create_user_by_admin(
    admin_id UUID,
    new_email TEXT,
    new_password TEXT,
    new_name TEXT,
    profile_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_admin BOOLEAN;
    new_user_id UUID;
    encrypted_pw TEXT;
BEGIN
    -- Verifica se quem está chamando é Admin (se a coluna role='admin' existir ou tem perfil de admin)
    SELECT EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = admin_id AND role = 'admin'
    ) INTO is_admin;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem criar usuários.';
    END IF;

    new_user_id := gen_random_uuid();
    -- A senha precisa ser encriptada. O Supabase Auth usa pgcrypto.
    -- Para isso a extensão pgcrypto precisa estar habilitada
    encrypted_pw := crypt(new_password, gen_salt('bf'));

    -- Insere o usuário na tabela auth.users do Supabase
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
        role, confirmation_token, recovery_token, email_change_token_new, email_change
    )
    VALUES (
        new_user_id, '00000000-0000-0000-0000-000000000000', new_email, encrypted_pw, now(),
        '{"provider":"email","providers":["email"]}', 
        jsonb_build_object('full_name', new_name), 
        now(), now(), 'authenticated', '', '', '', ''
    );

    -- Insere a identidade de login
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    VALUES (
        gen_random_uuid(), new_user_id, 
        format('{"sub":"%s","email":"%s"}', new_user_id::text, new_email)::jsonb, 
        'email', now(), now(), now()
    );

    -- Registra o perfil na tabela pública
    INSERT INTO public.user_roles (user_id, role, profile_id)
    VALUES (new_user_id, 'user', profile_id);

    -- Registra o nome na tabela de profiles (se houver)
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (new_user_id, new_name, new_email);

    RETURN new_user_id;
END;
$$;


-- 5. Perfis Iniciais (Opcional)
INSERT INTO public.access_profiles (name, description)
VALUES 
    ('Administrador', 'Acesso total a todas as páginas e ações do sistema.'),
    ('Gestor', 'Acesso à gestão de desempenho, relatórios e equipe.'),
    ('RH', 'Acesso aos módulos de recursos humanos, avaliações e colaboradores.'),
    ('Colaborador', 'Acesso restrito apenas ao próprio painel e preenchimento de autoavaliações.')
ON CONFLICT DO NOTHING;

-- Atribui permissões totais ao Administrador
DO $$
DECLARE
    admin_prof_id UUID;
BEGIN
    SELECT id INTO admin_prof_id FROM public.access_profiles WHERE name = 'Administrador' LIMIT 1;
    
    IF admin_prof_id IS NOT NULL THEN
        -- Lista de todas as páginas do sistema
        INSERT INTO public.access_profile_permissions (profile_id, page, can_view, can_create, can_edit, can_delete)
        VALUES 
            (admin_prof_id, 'dashboard', true, true, true, true),
            (admin_prof_id, 'cadastro', true, true, true, true),
            (admin_prof_id, 'colaboradores', true, true, true, true),
            (admin_prof_id, 'feedbacks', true, true, true, true),
            (admin_prof_id, 'novo_feedback', true, true, true, true),
            (admin_prof_id, 'desempenho', true, true, true, true),
            (admin_prof_id, 'relatorios', true, true, true, true),
            (admin_prof_id, 'reunioes', true, true, true, true),
            (admin_prof_id, 'eventos', true, true, true, true),
            (admin_prof_id, 'ausencias', true, true, true, true),
            (admin_prof_id, 'cco', true, true, true, true),
            (admin_prof_id, 'configuracoes', true, true, true, true)
        ON CONFLICT (profile_id, page) DO UPDATE 
        SET can_view = true, can_create = true, can_edit = true, can_delete = true;
    END IF;
END $$;
