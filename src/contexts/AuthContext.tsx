/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  userDepartment: string | null;
  effectiveDepartment: string | null;
  isDepartmentLocked: boolean;
  setEffectiveDepartment: (dept: string | null) => void;
  permissions: Record<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: true, isAdmin: false,
  userDepartment: null, effectiveDepartment: null, isDepartmentLocked: false,
  setEffectiveDepartment: () => {},
  permissions: {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [effectiveDepartment, setEffectiveDepartment] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }>>({});

  useEffect(() => {
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer fetching to avoid deadlocks; cancel any previous pending call
        if (pendingTimer !== null) clearTimeout(pendingTimer);
        pendingTimer = setTimeout(() => {
          pendingTimer = null;
          fetchRoleAndPermissions(session.user);
        }, 0);
      } else {
        setIsAdmin(false);
        setUserDepartment(null);
        setEffectiveDepartment(null);
        setPermissions({});
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoleAndPermissions(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      if (pendingTimer !== null) clearTimeout(pendingTimer);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchRoleAndPermissions(authUser: User) {
    const userId = authUser.id;
    const { data: rolesData } = await supabase.from('user_roles').select('role, profile_id').eq('user_id', userId);
    const roles = rolesData?.map((r: { role: string; profile_id?: string }) => r.role) ?? [];
    const isUserAdmin = roles.includes('admin');
    setIsAdmin(isUserAdmin);

    // Identifica departamento do usuário
    let dept: string | null = (authUser.user_metadata?.departamento as string) || null;

    if (!dept) {
      // Tenta buscar no perfil
      try {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (prof && (prof as Record<string, unknown>).departamento) {
          dept = (prof as Record<string, unknown>).departamento as string;
        }
      } catch {
        // ignora se coluna nao existir
      }
    }

    if (!dept && authUser.email) {
      // Tenta vincular com funcionário com mesmo email
      const { data: func } = await supabase.from('funcionarios').select('departamento').eq('email', authUser.email).maybeSingle();
      if (func?.departamento) {
        dept = func.departamento;
      }
    }

    // Se ainda assim não encontrou e houver no localStorage
    if (!dept) {
      const saved = localStorage.getItem(`user_dept_${userId}`);
      if (saved) dept = saved;
    }

    setUserDepartment(dept);
    setEffectiveDepartment(dept || null);

    const profileId = rolesData?.[0]?.profile_id;
    const permsMap: Record<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }> = {};

    if (profileId) {
      // Sistema moderno: permissões via perfil de acesso
      const { data: permsRes } = await supabase.from('access_profile_permissions')
        .select('page, can_view, can_create, can_edit, can_delete')
        .eq('profile_id', profileId);

      permsRes?.forEach((p: { page: string; can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }) => {
        permsMap[p.page] = {
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
        };
      });
    } else if (roles.includes('admin')) {
      // Admin sem perfil → acesso total a todas as páginas do sistema
      const allPages = [
        'dashboard', 'colaboradores', 'organograma', 'ausencias',
        'desempenho', 'treinamentos', 'disc', 'mbti', 'bigfive',
        'eventos', 'evolucao', 'notificacoes', 'configuracoes',
        'cadastro', 'feedbacks', 'novo_feedback', 'relatorios',
        'reunioes', 'cco', 'admin',
      ];
      allPages.forEach(page => {
        permsMap[page] = { can_view: true, can_create: true, can_edit: true, can_delete: true };
      });
    } else {
      // Sistema legado: permissões individuais via user_permissions
      // Fallback para usuários sem perfil atribuído
      const { data: legacyPerms } = await supabase.from('user_permissions')
        .select('page, can_view, can_create, can_edit, can_delete')
        .eq('user_id', userId)
        .neq('page', 'banned'); // 'banned' é sentinela de bloqueio, não permissão real

      legacyPerms?.forEach((p: { page: string; can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }) => {
        permsMap[p.page] = {
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
        };
      });
    }

    // Se o usuário pertencer a um departamento específico (não-admin)
    if (dept && !isUserAdmin) {
      const deptPagesAllowed = [
        'colaboradores', 'organograma', 'ausencias',
        'desempenho', 'feedbacks', 'novo_feedback',
        'treinamentos', 'disc', 'mbti', 'bigfive',
        'configuracoes'
      ];
      const deptPagesBlocked = ['dashboard', 'eventos', 'evolucao', 'notificacoes', 'admin'];

      deptPagesAllowed.forEach(page => {
        permsMap[page] = { can_view: true, can_create: true, can_edit: true, can_delete: true };
      });
      deptPagesBlocked.forEach(page => {
        permsMap[page] = { can_view: false, can_create: false, can_edit: false, can_delete: false };
      });
    }

    setPermissions(permsMap);
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const isDepartmentLocked = !isAdmin && !!userDepartment;

  return (
    <AuthContext.Provider value={{
      user, session, loading, isAdmin,
      userDepartment, effectiveDepartment, isDepartmentLocked,
      setEffectiveDepartment,
      permissions, signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}
