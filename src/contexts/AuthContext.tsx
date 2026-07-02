import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  permissions: Record<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: true, isAdmin: false, permissions: {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }>>({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer fetching to avoid deadlocks
        setTimeout(() => {
          fetchRoleAndPermissions(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
        setPermissions({});
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoleAndPermissions(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchRoleAndPermissions(userId: string) {
    const { data: rolesData } = await supabase.from('user_roles').select('role, profile_id').eq('user_id', userId);
    const roles = rolesData?.map((r: any) => r.role) ?? [];
    setIsAdmin(roles.includes('admin'));

    const profileId = rolesData?.[0]?.profile_id;
    const permsMap: Record<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }> = {};

    if (profileId) {
      // Sistema moderno: permissões via perfil de acesso
      const { data: permsRes } = await supabase.from('access_profile_permissions')
        .select('page, can_view, can_create, can_edit, can_delete')
        .eq('profile_id', profileId);

      permsRes?.forEach((p: any) => {
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
        .select('page, can_view, can_edit')
        .eq('user_id', userId)
        .neq('page', 'banned'); // 'banned' é sentinela de bloqueio, não permissão real

      legacyPerms?.forEach((p: any) => {
        permsMap[p.page] = {
          can_view: p.can_view,
          can_create: p.can_edit,   // legado não tem can_create — mapeia de can_edit
          can_edit: p.can_edit,
          can_delete: false,         // legado não tem can_delete
        };
      });
    }

    setPermissions(permsMap);
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, permissions, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
