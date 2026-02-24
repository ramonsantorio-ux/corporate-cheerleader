import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Shield, Users, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const PAGES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'cadastro', label: 'Cadastro' },
  { key: 'feedbacks', label: 'Feedbacks' },
  { key: 'novo_feedback', label: 'Novo Feedback' },
  { key: 'desempenho', label: 'Desempenho' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'configuracoes', label: 'Configurações' },
];

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: string;
  permissions: { page: string; can_view: boolean; can_edit: boolean }[];
}

export default function Admin() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '' });
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editPerms, setEditPerms] = useState<{ page: string; can_view: boolean; can_edit: boolean }[]>([]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  async function fetchUsers() {
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (!profiles) { setLoading(false); return; }

    const usersWithRoles: UserWithRole[] = [];
    for (const p of profiles) {
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', p.id);
      const { data: perms } = await supabase.from('user_permissions').select('page, can_view, can_edit').eq('user_id', p.id);
      usersWithRoles.push({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        role: (roles as any)?.[0]?.role || 'user',
        permissions: (perms as any[]) || [],
      });
    }
    setUsers(usersWithRoles);
    setLoading(false);
  }

  async function createUser() {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (newUser.password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    setCreating(true);

    // Use edge function to create user (admin only)
    const { data: sessionData } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke('create-user', {
      body: { email: newUser.email, password: newUser.password, full_name: newUser.full_name },
    });

    if (res.error) {
      toast.error(res.error.message || 'Erro ao criar usuário');
    } else {
      toast.success('Usuário criado com sucesso!');
      setNewUser({ email: '', password: '', full_name: '' });
      setDialogOpen(false);
      // Set default permissions
      const userId = res.data?.user_id;
      if (userId) {
        const defaultPerms = PAGES.map(p => ({
          user_id: userId,
          page: p.key,
          can_view: true,
          can_edit: false,
        }));
        await supabase.from('user_permissions').insert(defaultPerms);
        await supabase.from('user_roles').insert({ user_id: userId, role: 'user' });
      }
      fetchUsers();
    }
    setCreating(false);
  }

  function openPermissions(user: UserWithRole) {
    setEditingUser(user);
    const perms = PAGES.map(p => {
      const existing = user.permissions.find(up => up.page === p.key);
      return { page: p.key, can_view: existing?.can_view ?? true, can_edit: existing?.can_edit ?? false };
    });
    setEditPerms(perms);
  }

  async function savePermissions() {
    if (!editingUser) return;
    // Delete old perms then insert new ones
    await supabase.from('user_permissions').delete().eq('user_id', editingUser.id);
    await supabase.from('user_permissions').insert(
      editPerms.map(p => ({ user_id: editingUser.id, ...p }))
    );
    toast.success('Permissões atualizadas!');
    setEditingUser(null);
    fetchUsers();
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Shield className="w-8 h-8 mr-3" />
        <p>Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administração</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerenciar usuários e permissões</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Novo Usuário</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} placeholder="Nome do usuário" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
              </div>
              <Button onClick={createUser} className="w-full" disabled={creating}>
                {creating ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : users.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
          Nenhum usuário cadastrado.
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{u.full_name || 'Sem nome'}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {u.role === 'admin' ? 'Administrador' : 'Usuário'}
              </span>
              <Button variant="outline" size="sm" onClick={() => openPermissions(u)}>
                <Shield className="w-3.5 h-3.5 mr-1.5" /> Permissões
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Permissions dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Permissões — {editingUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {editPerms.map((perm, idx) => {
              const pageLabel = PAGES.find(p => p.key === perm.page)?.label || perm.page;
              return (
                <div key={perm.page} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium">{pageLabel}</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      <Switch
                        checked={perm.can_view}
                        onCheckedChange={(checked) => {
                          const updated = [...editPerms];
                          updated[idx] = { ...perm, can_view: checked };
                          if (!checked) updated[idx].can_edit = false;
                          setEditPerms(updated);
                        }}
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                      <Switch
                        checked={perm.can_edit}
                        disabled={!perm.can_view}
                        onCheckedChange={(checked) => {
                          const updated = [...editPerms];
                          updated[idx] = { ...perm, can_edit: checked };
                          setEditPerms(updated);
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
            <Button onClick={savePermissions} className="w-full mt-2">
              Salvar Permissões
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
