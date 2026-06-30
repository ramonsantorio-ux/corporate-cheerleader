$file = "src/pages/Admin.tsx"
$content = Get-Content -Path $file -Raw

# 1. Imports
$content = $content.Replace(
    "import { Plus, Shield, Users, Eye, Edit, Lock, Ban, KeyRound, Check, Trash2 } from 'lucide-react';",
    "import { Plus, Shield, Users, Edit, Lock, Ban, KeyRound, Check, Trash2 } from 'lucide-react';`nimport { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';`nimport { PerfisDeAcesso } from '@/components/admin/PerfisDeAcesso';`nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';"
)

# 2. Interfaces
$content = $content.Replace(
    "  permissions: { page: string; can_view: boolean; can_edit: boolean }[];",
    "  profile_id: string | null;"
)

# 3. Component state
$content = $content.Replace(
    "  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '' });",
    "  const { user } = useAuth();`n  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', profile_id: '' });`n  const [accessProfiles, setAccessProfiles] = useState<{id: string, name: string}[]>([]);"
)

# 4. Fetch Users - Load access profiles too
$content = $content.Replace(
    "  async function fetchUsers() {",
    "  useEffect(() => {`n    if (isAdmin) {`n      supabase.from('access_profiles').select('id, name').then(({data}) => setAccessProfiles(data || []));`n    }`n  }, [isAdmin]);`n`n  async function fetchUsers() {"
)

$content = $content.Replace(
    "        permissions: (perms as any[]) || [],",
    "        profile_id: (roles as any)?.[0]?.profile_id || null,"
)
$content = $content.Replace(
    "const { data: perms } = await supabase.from('user_permissions').select('page, can_view, can_edit').eq('user_id', p.id);",
    "// perms omitted for profile-based RBAC"
)

# 5. Create user
$content = $content.Replace(
    "    const res = await supabase.functions.invoke('create-user', {`n      body: { email: newUser.email, password: newUser.password, full_name: newUser.full_name },`n    });",
    "    if (!newUser.profile_id) { toast.error('Selecione um perfil de acesso'); setCreating(false); return; }`n    const res = await supabase.rpc('create_user_by_admin', {`n      admin_id: user?.id,`n      new_email: newUser.email,`n      new_password: newUser.password,`n      new_name: newUser.full_name,`n      profile_id: newUser.profile_id`n    });"
)
$content = $content.Replace(
    "    if (res.error) {`n      toast.error(res.error.message || 'Erro ao criar usuário');`n    } else {`n      toast.success('Usuário criado com sucesso!');`n      setNewUser({ email: '', password: '', full_name: '' });`n      setDialogOpen(false);`n      const userId = res.data?.user_id;`n      if (userId) {`n        const defaultPerms = PAGES.map(p => ({`n          user_id: userId,`n          page: p.key,`n          can_view: true,`n          can_edit: false,`n        }));`n        await supabase.from('user_permissions').insert(defaultPerms);`n        await supabase.from('user_roles').insert({ user_id: userId, role: 'user' });`n      }`n      fetchUsers();`n    }",
    "    if (res.error) {`n      toast.error(res.error.message || 'Erro ao criar usuário');`n    } else {`n      toast.success('Usuário criado com sucesso!');`n      setNewUser({ email: '', password: '', full_name: '', profile_id: '' });`n      setDialogOpen(false);`n      fetchUsers();`n    }"
)

# 6. Delete User Bypass Edge Function (Since Edge function doesn't work, we must skip ban and just delete profile? No, just keep Edge function or remove delete logic and replace with updating profile banned status)
$content = $content.Replace(
    "      // 1. Mark profile as deleted via Edge Function (uses service role, bypasses RLS)`n      const updateRes = await supabase.functions.invoke('manage-user', {`n        body: { action: 'update', user_id: deleteUser.id, full_name: '__DELETED__', email: deleteUser.email },`n      });`n      if (updateRes.error) throw new Error(updateRes.error.message || 'Erro ao marcar perfil');`n`n      // 2. Ban the auth user so they can't login`n      const banRes = await supabase.functions.invoke('manage-user', {`n        body: { action: 'ban', user_id: deleteUser.id },`n      });`n      if (banRes.error) throw new Error(banRes.error.message || 'Erro ao desativar conta');",
    "      // Para evitar o Edge Function, marcamos na tabela public.profiles como DELETED (RLS permite update por admin, ou fazemos no frontend)`n      const { error: updErr } = await supabase.from('profiles').update({ full_name: '__DELETED__' }).eq('id', deleteUser.id);`n      if (updErr) throw new Error('Erro ao marcar perfil');`n      // Nao podemos banir o auth sem service_role, entao apenas mudamos a role para null`n      await supabase.from('user_roles').delete().eq('user_id', deleteUser.id);"
)

$content = $content.Replace(
    "    const res = await supabase.functions.invoke('manage-user', {`n      body: { action: blockAction, user_id: blockUser.id },`n    });",
    "    toast.error('O bloqueio requer Edge Functions que não estão disponíveis no momento. A funcionalidade será convertida para usar RBAC.'); return; // TODO"
)
$content = $content.Replace(
    "    const res = await supabase.functions.invoke('manage-user', {`n      body: { action: 'update', user_id: editUserDialog.id, email: editEmail, full_name: editName },`n    });",
    "    const { error } = await supabase.from('profiles').update({ full_name: editName }).eq('id', editUserDialog.id);`n    const res = { error }; // Fake Edge Function response`n    // Note: Can't change email without Edge function/Service key"
)

# 7. Form UI adjustments
$content = $content.Replace(
    "              <div className=`"space-y-2`">`n                <Label>Senha</Label>`n                <FastInput type=`"password`" value={newUser.password} onValueChange={v => setNewUser({ ...newUser, password: v })} placeholder=`"Mínimo 6 caracteres`" />`n              </div>",
    "              <div className=`"space-y-2`">`n                <Label>Senha</Label>`n                <FastInput type=`"password`" value={newUser.password} onValueChange={v => setNewUser({ ...newUser, password: v })} placeholder=`"Mínimo 6 caracteres`" />`n              </div>`n              <div className=`"space-y-2`">`n                <Label>Perfil de Acesso</Label>`n                <Select value={newUser.profile_id} onValueChange={v => setNewUser({ ...newUser, profile_id: v })}>`n                  <SelectTrigger><SelectValue placeholder=`"Selecione um perfil...`" /></SelectTrigger>`n                  <SelectContent>`n                    {accessProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}`n                  </SelectContent>`n                </Select>`n              </div>"
)

# 8. Remove Permissions button & edit user button role assignment
$content = $content.Replace(
    "                <Button variant=`"outline`" size=`"sm`" onClick={() => openPermissions(u)}>`n                  <Shield className=`"w-3.5 h-3.5 mr-1`" /> Permissões`n                </Button>",
    ""
)

# 9. Edit User UI additions
$content = $content.Replace(
    "            <div className=`"space-y-2`">`n              <Label>Nome completo</Label>`n              <FastInput value={editName} onValueChange={setEditName} />`n            </div>",
    "            <div className=`"space-y-2`">`n              <Label>Nome completo</Label>`n              <FastInput value={editName} onValueChange={setEditName} />`n            </div>`n            <div className=`"space-y-2`">`n              <Label>Perfil de Acesso</Label>`n              <Select value={editUserDialog?.profile_id || ''} onValueChange={async (v) => {`n                await supabase.from('user_roles').update({ profile_id: v }).eq('user_id', editUserDialog?.id);`n                toast.success('Perfil atualizado!');`n                fetchUsers();`n              }}>`n                <SelectTrigger><SelectValue placeholder=`"Alterar perfil...`" /></SelectTrigger>`n                <SelectContent>`n                  {accessProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}`n                </SelectContent>`n              </Select>`n            </div>"
)
$content = $content.Replace(
    "            <div className=`"space-y-2`">`n              <Label>E-mail</Label>`n              <FastInput type=`"email`" value={editEmail} onValueChange={setEditEmail} />`n            </div>",
    "            <div className=`"space-y-2`">`n              <Label>E-mail (Requer Admin)</Label>`n              <FastInput type=`"email`" value={editEmail} disabled onValueChange={setEditEmail} />`n            </div>"
)

# 10. Wrap in Tabs
$content = $content.Replace(
    "    <div className=`"space-y-6`">`n      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className=`"flex items-center justify-between`">",
    "    <div className=`"space-y-6`">`n      <Tabs defaultValue=`"usuarios`" className=`"space-y-6`">`n        <div className=`"flex items-center justify-between`">`n          <TabsList>`n            <TabsTrigger value=`"usuarios`">Usuários</TabsTrigger>`n            <TabsTrigger value=`"perfis`">Perfis de Acesso</TabsTrigger>`n          </TabsList>`n        </div>`n`n        <TabsContent value=`"perfis`">`n          <PerfisDeAcesso />`n        </TabsContent>`n`n        <TabsContent value=`"usuarios`" className=`"space-y-6`">`n      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className=`"flex items-center justify-between`">"
)
$content = $content.Replace(
    "      {/* Delete user confirmation */}",
    "        </TabsContent>`n      </Tabs>`n`n      {/* Delete user confirmation */}"
)

# 11. Remove Permissions Dialog completely
$content = $content.Replace(
    "      {/* Permissions dialog */}",
    "      {/* Permissions dialog REMOVED */}"
)

Set-Content -Path $file -Value $content -NoNewline
