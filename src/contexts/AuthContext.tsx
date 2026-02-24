import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  permissions: Record<string, { can_view: boolean; can_edit: boolean }>;
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
  const [permissions, setPermissions] = useState<Record<string, { can_view: boolean; can_edit: boolean }>>({});

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
    const [rolesRes, permsRes] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId),
      supabase.from('user_permissions').select('page, can_view, can_edit').eq('user_id', userId),
    ]);

    const roles = rolesRes.data?.map((r: any) => r.role) ?? [];
    setIsAdmin(roles.includes('admin'));

    const permsMap: Record<string, { can_view: boolean; can_edit: boolean }> = {};
    permsRes.data?.forEach((p: any) => {
      permsMap[p.page] = { can_view: p.can_view, can_edit: p.can_edit };
    });
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
