import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Shield, Users, Eye, Edit, Lock, Ban, KeyRound, Check, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FastInput } from '@/components/ui/fast-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const PAGES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'cadastro', label: 'Cadastro' },
  { key: 'colaboradores', label: 'Colaboradores' },
  { key: 'feedbacks', label: 'Feedbacks' },
  { key: 'novo_feedback', label: 'Novo Feedback' },
  { key: 'desempenho', label: 'Desempenho' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'reunioes', label: 'Reuniões 1:1' },
  { key: 'eventos', label: 'Eventos' },
  { key: 'ausencias', label: 'Ausências' },
  { key: 'cco', label: 'CCO / Informações' },
  { key: 'configuracoes', label: 'Configurações' },
];

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: string;
  banned: boolean;
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

  // Edit user dialog
  const [editUserDialog, setEditUserDialog] = useState<UserWithRole | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Change password dialog
  const [passwordUser, setPasswordUser] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Block confirmation
  const [blockUser, setBlockUser] = useState<UserWithRole | null>(null);
  const [blockAction, setBlockAction] = useState<'ban' | 'unban'>('ban');
  const [savingBlock, setSavingBlock] = useState(false);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  async function fetchUsers() {
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (!profiles) { setLoading(false); return; }

    const usersWithRoles: UserWithRole[] = [];
    for (const p of profiles) {
      // Skip deleted users
      if (p.full_name === '__DELETED__') continue;

      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', p.id);
      const { data: perms } = await supabase.from('user_permissions').select('page, can_view, can_edit').eq('user_id', p.id);
      usersWithRoles.push({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        role: (roles as any)?.[0]?.role || 'user',
        banned: false,
        permissions: (perms as any[]) || [],
      });
    }
    setUsers(usersWithRoles);
    setLoading(false);
  }

  // Delete user handler
  const [deleteUser, setDeleteUser] = useState<UserWithRole | null>(null);
  const [savingDelete, setSavingDelete] = useState(false);

  async function confirmDeleteUser() {
    if (!deleteUser) return;
    setSavingDelete(true);
    try {
      // 1. Mark profile as deleted via Edge Function (uses service role, bypasses RLS)
      const updateRes = await supabase.functions.invoke('manage-user', {
        body: { action: 'update', user_id: deleteUser.id, full_name: '__DELETED__', email: deleteUser.email },
      });
      if (updateRes.error) throw new Error(updateRes.error.message || 'Erro ao marcar perfil');

      // 2. Ban the auth user so they can't login
      const banRes = await supabase.functions.invoke('manage-user', {
        body: { action: 'ban', user_id: deleteUser.id },
      });
      if (banRes.error) throw new Error(banRes.error.message || 'Erro ao desativar conta');

      toast.success(`Conta de "${deleteUser.full_name}" excluída com sucesso!`);
      setUsers(prev => prev.filter(u => u.id !== deleteUser.id));
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir conta');
    }
    setSavingDelete(false);
    setDeleteUser(null);
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
    const res = await supabase.functions.invoke('create-user', {
      body: { email: newUser.email, password: newUser.password, full_name: newUser.full_name },
    });
    if (res.error) {
      toast.error(res.error.message || 'Erro ao criar usuário');
    } else {
      toast.success('Usuário criado com sucesso!');
      setNewUser({ email: '', password: '', full_name: '' });
      setDialogOpen(false);
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
    await supabase.from('user_permissions').delete().eq('user_id', editingUser.id);
    await supabase.from('user_permissions').insert(
      editPerms.map(p => ({ user_id: editingUser.id, ...p }))
    );
    toast.success('Permissões atualizadas!');
    setEditingUser(null);
    fetchUsers();
  }

  function openEditUser(user: UserWithRole) {
    setEditUserDialog(user);
    setEditName(user.full_name);
    setEditEmail(user.email);
  }

  async function saveEditUser() {
    if (!editUserDialog) return;
    setSavingEdit(true);
    const res = await supabase.functions.invoke('manage-user', {
      body: { action: 'update', user_id: editUserDialog.id, email: editEmail, full_name: editName },
    });
    if (res.error) {
      toast.error(res.error.message || 'Erro ao atualizar');
    } else {
      toast.success('Usuário atualizado com sucesso!');
      setEditUserDialog(null);
      fetchUsers();
    }
    setSavingEdit(false);
  }

  function openBlockUser(user: UserWithRole) {
    setBlockUser(user);
    setBlockAction(user.banned ? 'unban' : 'ban');
  }

  async function confirmBlock() {
    if (!blockUser) return;
    setSavingBlock(true);
    const res = await supabase.functions.invoke('manage-user', {
      body: { action: blockAction, user_id: blockUser.id },
    });
    if (res.error) {
      toast.error(res.error.message || 'Erro');
    } else {
      toast.success(blockAction === 'ban' ? 'Usuário bloqueado!' : 'Usuário desbloqueado!');
      setUsers(prev => prev.map(u => u.id === blockUser.id ? { ...u, banned: blockAction === 'ban' } : u));
      setBlockUser(null);
    }
    setSavingBlock(false);
  }

  function openChangePassword(user: UserWithRole) {
    setPasswordUser(user);
    setNewPassword('');
  }

  async function savePassword() {
    if (!passwordUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    setSavingPassword(true);
    const res = await supabase.functions.invoke('manage-user', {
      body: { action: 'change_password', user_id: passwordUser.id, password: newPassword },
    });
    if (res.error) {
      toast.error(res.error.message || 'Erro ao alterar senha');
    } else {
      toast.success('Senha alterada com sucesso!');
      setPasswordUser(null);
      setNewPassword('');
    }
    setSavingPassword(false);
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
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Novo Usuário</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <FastInput value={newUser.full_name} onValueChange={v => setNewUser({ ...newUser, full_name: v })} placeholder="Nome do usuário" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <FastInput type="email" value={newUser.email} onValueChange={v => setNewUser({ ...newUser, email: v })} placeholder="email@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <FastInput type="password" value={newUser.password} onValueChange={v => setNewUser({ ...newUser, password: v })} placeholder="Mínimo 6 caracteres" />
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {u.role === 'admin' ? 'Admin' : 'Usuário'}
                </span>
                {u.banned && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-destructive/10 text-destructive">
                    Bloqueado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => openEditUser(u)} title="Editar">
                  <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => openChangePassword(u)} title="Alterar Senha">
                  <KeyRound className="w-3.5 h-3.5 mr-1" /> Senha
                </Button>
                <Button
                  variant={u.banned ? "outline" : "destructive"}
                  size="sm"
                  onClick={() => openBlockUser(u)}
                  title={u.banned ? 'Desbloquear' : 'Bloquear'}
                >
                  {u.banned ? <Check className="w-3.5 h-3.5 mr-1" /> : <Ban className="w-3.5 h-3.5 mr-1" />}
                  {u.banned ? 'Desbloquear' : 'Bloquear'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => openPermissions(u)}>
                  <Shield className="w-3.5 h-3.5 mr-1" /> Permissões
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteUser(u)}
                  title="Excluir Conta"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                </Button>
              </div>
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

      {/* Edit user dialog */}
      <Dialog open={!!editUserDialog} onOpenChange={(open) => !open && setEditUserDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <FastInput value={editName} onValueChange={setEditName} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <FastInput type="email" value={editEmail} onValueChange={setEditEmail} />
            </div>
            <Button onClick={saveEditUser} className="w-full" disabled={savingEdit}>
              {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={!!passwordUser} onOpenChange={(open) => !open && setPasswordUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Senha — {passwordUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <FastInput
                type="password"
                value={newPassword}
                onValueChange={setNewPassword}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <Button onClick={savePassword} className="w-full" disabled={savingPassword}>
              {savingPassword ? 'Salvando...' : 'Alterar Senha'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block/Unblock confirmation */}
      <AlertDialog open={!!blockUser} onOpenChange={(open) => !open && setBlockUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockAction === 'ban' ? 'Bloquear Usuário' : 'Desbloquear Usuário'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockAction === 'ban'
                ? `Tem certeza que deseja bloquear "${blockUser?.full_name}"? O usuário não conseguirá fazer login.`
                : `Tem certeza que deseja desbloquear "${blockUser?.full_name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingBlock}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBlock} disabled={savingBlock}>
              {savingBlock ? 'Aguarde...' : blockAction === 'ban' ? 'Bloquear' : 'Desbloquear'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete user confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente a conta de "{deleteUser?.full_name}"?
              Esta ação não pode ser desfeita. Todos os dados do usuário serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} disabled={savingDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {savingDelete ? 'Excluindo...' : 'Excluir Permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
