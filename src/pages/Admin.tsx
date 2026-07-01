import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Plus, Shield, Users, Edit, Lock, Ban, KeyRound, Check, Trash2, Eye, EyeOff, MoreHorizontal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerfisDeAcesso } from '@/components/admin/PerfisDeAcesso';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FastInput } from '@/components/ui/fast-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { PAGES, PAGE_GROUPS } from '@/lib/permissions';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: string;
  banned: boolean;
  profile_id: string | null;
}

export default function Admin() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', profile_id: '' });
  const [accessProfiles, setAccessProfiles] = useState<{id: string, name: string}[]>([]);

  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editPerms, setEditPerms] = useState<{ page: string; can_view: boolean; can_edit: boolean }[]>([]);

  // Edit user dialog
  const [editUserDialog, setEditUserDialog] = useState<UserWithRole | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editProfileId, setEditProfileId] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Change password dialog
  const [passwordUser, setPasswordUser] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Block confirmation
  const [blockUser, setBlockUser] = useState<UserWithRole | null>(null);
  const [blockAction, setBlockAction] = useState<'ban' | 'unban'>('ban');
  const [savingBlock, setSavingBlock] = useState(false);


  const adminAuthRequest = async (action: 'create' | 'manage', payload: any) => {
    const functionName = action === 'create' ? 'create-user' : 'manage-user';
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });
    
    if (error) {
       console.error("Function error:", error);
       throw new Error(error.message || 'Erro na Edge Function');
    }
    if (data?.error) {
       throw new Error(data.error);
    }
    return data;
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      supabase.from('access_profiles').select('id, name').then(({data}) => setAccessProfiles(data || []));
    }
  }, [isAdmin]);

  async function fetchUsers() {
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (!profiles) { setLoading(false); return; }

    const { data: bannedRows } = await supabase.from('user_permissions').select('user_id').eq('page', 'banned');
    const bannedUserIds = new Set(bannedRows?.map(r => r.user_id) || []);

    const usersWithRoles: UserWithRole[] = [];
    for (const p of profiles) {
      if (p.full_name === '__DELETED__') continue;

      const { data: roles } = await supabase.from('user_roles').select('role, profile_id').eq('user_id', p.id);
      
      usersWithRoles.push({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        role: (roles as any)?.[0]?.role || 'user',
        banned: bannedUserIds.has(p.id),
        profile_id: (roles as any)?.[0]?.profile_id || null,
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
      await adminAuthRequest('manage', { action: 'update', user_id: deleteUser.id, full_name: '__DELETED__', email: deleteUser.email });
      await adminAuthRequest('manage', { action: 'ban', user_id: deleteUser.id });

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
    
    try {
      const user = await adminAuthRequest('create', {
        email: newUser.email,
        password: newUser.password,
        full_name: newUser.full_name,
      });

      toast.success('Usuário criado com sucesso!');
      setNewUser({ email: '', password: '', full_name: '', profile_id: '' });
      setDialogOpen(false);
      const userId = user.user_id;
      if (userId) {
          const defaultPerms = PAGES.map(p => ({
            user_id: userId,
            page: p.key,
            can_view: true,
            can_edit: false,
          }));
          await supabase.from('user_permissions').insert(defaultPerms);
          await supabase.from('user_roles').insert({ user_id: userId, role: 'user', profile_id: newUser.profile_id || null });
        }
        fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado');
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
    setEditProfileId(user.profile_id || '');
  }

  async function saveEditUser() {
    if (!editUserDialog) return;
    setSavingEdit(true);
    try {
      await adminAuthRequest('manage', { action: 'update', user_id: editUserDialog.id, email: editEmail, full_name: editName });

      const { data: roleData } = await supabase.from('user_roles').select('*').eq('user_id', editUserDialog.id).maybeSingle();
      if (roleData) {
         await supabase.from('user_roles').update({ profile_id: editProfileId || null }).eq('user_id', editUserDialog.id);
      } else {
         await supabase.from('user_roles').insert({ user_id: editUserDialog.id, role: 'user', profile_id: editProfileId || null });
      }

      toast.success('Usuário atualizado com sucesso!');
      setEditUserDialog(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar');
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
    try {
      await adminAuthRequest('manage', { action: blockAction, user_id: blockUser.id });

      if (blockAction === 'ban') {
        await supabase.from('user_permissions').insert({ user_id: blockUser.id, page: 'banned', can_view: true });
      } else {
        await supabase.from('user_permissions').delete().eq('user_id', blockUser.id).eq('page', 'banned');
      }

      toast.success(blockAction === 'ban' ? 'Usuário bloqueado!' : 'Usuário desbloqueado!');
      setUsers(prev => prev.map(u => u.id === blockUser.id ? { ...u, banned: blockAction === 'ban' } : u));
      setBlockUser(null);
    } catch(err:any) {
      toast.error(err.message || 'Erro');
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
    try {
      await adminAuthRequest('manage', { action: 'change_password', user_id: passwordUser.id, password: newPassword });
      toast.success('Senha alterada com sucesso!');
      setPasswordUser(null);
      setNewPassword('');
    } catch(err:any) {
      toast.error(err.message || 'Erro ao alterar senha');
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
      <Tabs defaultValue="usuarios" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administração</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerenciar usuários e permissões</p>
        </div>
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="perfis">Perfis de Acesso</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="perfis">
        <PerfisDeAcesso />
      </TabsContent>

      <TabsContent value="usuarios" className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div />
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
                <Label>Perfil de Acesso</Label>
                <Select value={newUser.profile_id || 'none'} onValueChange={(v) => setNewUser({...newUser, profile_id: v === 'none' ? '' : v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfil (Opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (Permissões individuais)</SelectItem>
                    {accessProfiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <div className="relative">
                  <FastInput type={showPassword ? "text" : "password"} value={newUser.password} onValueChange={v => setNewUser({ ...newUser, password: v })} placeholder="Mínimo 6 caracteres" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
                {u.profile_id && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {accessProfiles.find(p => p.id === u.profile_id)?.name || 'Perfil desconhecido'}
                  </span>
                )}
                {u.banned && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-destructive/10 text-destructive">
                    Bloqueado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => openEditUser(u)}>
                      <Edit className="w-4 h-4 mr-2 text-muted-foreground" /> Editar Usuário
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openChangePassword(u)}>
                      <KeyRound className="w-4 h-4 mr-2 text-muted-foreground" /> Alterar Senha
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openPermissions(u)}>
                      <Shield className="w-4 h-4 mr-2 text-muted-foreground" /> Permissões
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => openBlockUser(u)} className={u.banned ? "" : "text-destructive focus:bg-destructive/10 focus:text-destructive"}>
                      {u.banned ? <Check className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                      {u.banned ? 'Desbloquear' : 'Bloquear'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteUser(u)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir Conta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Permissions dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Permissões — {editingUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pt-2">
            <div className="grid grid-cols-[1fr_80px_80px] gap-4 px-2 mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Módulo / Página</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase text-center">Ver</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase text-center">Editar</span>
            </div>
            
            <div className="space-y-6">
              {PAGE_GROUPS.map((group) => (
                <div key={group.module} className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary/80 uppercase tracking-wider px-2">
                    {group.module}
                  </h4>
                  <div className="space-y-1">
                    {group.pages.map((page) => {
                      const permIdx = editPerms.findIndex(p => p.page === page.key);
                      const perm = editPerms[permIdx];
                      if (!perm) return null;
                      return (
                        <div key={page.key} className="grid grid-cols-[1fr_80px_80px] gap-4 px-2 py-2 border-b border-border last:border-0 hover:bg-muted/30 transition-colors rounded-lg">
                          <span className="text-sm font-medium text-muted-foreground">{page.label}</span>
                          <div className="flex justify-center items-center">
                            <Checkbox checked={perm.can_view} onCheckedChange={(c: boolean) => {
                              const upd = [...editPerms];
                              upd[permIdx].can_view = c;
                              if (!c) upd[permIdx].can_edit = false;
                              setEditPerms(upd);
                            }} />
                          </div>
                          <div className="flex justify-center items-center">
                            <Checkbox checked={perm.can_edit} disabled={!perm.can_view} onCheckedChange={(c: boolean) => {
                              const upd = [...editPerms]; upd[permIdx].can_edit = c; setEditPerms(upd);
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t mt-auto">
            <Button onClick={savePermissions} className="w-full">
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
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select value={editProfileId || 'none'} onValueChange={(v) => setEditProfileId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil (Opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (Permissões individuais)</SelectItem>
                  {accessProfiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <div className="relative">
                <FastInput
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onValueChange={setNewPassword}
                  placeholder="Mínimo 6 caracteres"
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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

        </TabsContent>
      </Tabs>

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
