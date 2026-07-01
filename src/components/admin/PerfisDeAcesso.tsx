import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Shield, Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { FastInput } from '@/components/ui/fast-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

interface AccessProfile {
  id: string;
  name: string;
  description: string;
}

interface ProfilePermission {
  page: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export function PerfisDeAcesso() {
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProfileOpen, setNewProfileOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({ name: '', description: '' });
  
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState<{ id: string; name: string; description: string } | null>(null);
  
  const [editingProfile, setEditingProfile] = useState<AccessProfile | null>(null);
  const [editingPerms, setEditingPerms] = useState<ProfilePermission[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    const { data, error } = await supabase.from('access_profiles').select('*').order('created_at', { ascending: true });
    if (error) {
      toast.error('Erro ao buscar perfis');
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  }

  async function handleCreateProfile() {
    if (!newProfile.name) return toast.error('Nome do perfil é obrigatório');
    const { data, error } = await supabase.from('access_profiles').insert({
      name: newProfile.name,
      description: newProfile.description
    }).select().single();

    if (error) {
      toast.error('Erro ao criar perfil');
    } else {
      toast.success('Perfil criado com sucesso!');
      setProfiles([...profiles, data]);
      setNewProfileOpen(false);
      setNewProfile({ name: '', description: '' });
    }
  }

  function openEditProfile(profile: AccessProfile) {
    setEditProfileData({ id: profile.id, name: profile.name, description: profile.description || '' });
    setEditProfileOpen(true);
  }

  async function handleSaveEditProfile() {
    if (!editProfileData || !editProfileData.name) return toast.error('Nome do perfil é obrigatório');
    const { error } = await supabase.from('access_profiles').update({
      name: editProfileData.name,
      description: editProfileData.description
    }).eq('id', editProfileData.id);

    if (error) {
      toast.error('Erro ao atualizar perfil');
    } else {
      toast.success('Perfil atualizado com sucesso!');
      setProfiles(profiles.map(p => p.id === editProfileData.id ? { ...p, name: editProfileData.name, description: editProfileData.description } : p));
      setEditProfileOpen(false);
    }
  }

  async function openPermissions(profile: AccessProfile) {
    setEditingProfile(profile);
    const { data, error } = await supabase.from('access_profile_permissions').select('*').eq('profile_id', profile.id);
    
    if (error) {
      toast.error('Erro ao carregar permissões');
      return;
    }

    const permsMap = new Map(data?.map(p => [p.page, p]));
    const defaultPerms = PAGES.map(p => {
      const existing = permsMap.get(p.key) as any;
      return {
        page: p.key,
        can_view: existing?.can_view || false,
        can_create: existing?.can_create || false,
        can_edit: existing?.can_edit || false,
        can_delete: existing?.can_delete || false,
      };
    });
    setEditingPerms(defaultPerms);
  }

  async function savePermissions() {
    if (!editingProfile) return;
    setSavingPerms(true);
    
    // Deleta permissões antigas
    await supabase.from('access_profile_permissions').delete().eq('profile_id', editingProfile.id);
    
    // Insere as novas
    const toInsert = editingPerms.map(p => ({
      profile_id: editingProfile.id,
      ...p
    }));

    const { error } = await supabase.from('access_profile_permissions').insert(toInsert);
    
    if (error) {
      toast.error('Erro ao salvar permissões');
    } else {
      toast.success('Permissões salvas com sucesso!');
      setEditingProfile(null);
    }
    setSavingPerms(false);
  }

  async function handleDeleteProfile(id: string) {
    if (!confirm('Tem certeza que deseja excluir este perfil? Usuários associados perderão seus acessos.')) return;
    const { error } = await supabase.from('access_profiles').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir. Verifique se existem usuários atrelados.');
    } else {
      toast.success('Perfil excluído com sucesso');
      setProfiles(profiles.filter(p => p.id !== id));
    }
  }

  if (loading) return <div className="p-4 text-muted-foreground">Carregando perfis...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Perfis de Acesso</h2>
        <Dialog open={newProfileOpen} onOpenChange={setNewProfileOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Novo Perfil</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Novo Perfil</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nome do Perfil</Label>
                <FastInput value={newProfile.name} onValueChange={v => setNewProfile({ ...newProfile, name: v })} placeholder="Ex: Analista de RH" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <FastInput value={newProfile.description} onValueChange={v => setNewProfile({ ...newProfile, description: v })} placeholder="Acessos do departamento..." />
              </div>
              <Button onClick={handleCreateProfile} className="w-full">Criar Perfil</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map(p => (
          <div key={p.id} className="glass-card rounded-xl p-5 space-y-4 border border-border/50">
            <div>
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <Shield className="w-4 h-4" /> {p.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">{p.description || 'Sem descrição'}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openPermissions(p)}>
                <Shield className="w-3.5 h-3.5 mr-1" /> Permissões
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditProfile(p)} title="Editar Perfil">
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteProfile(p.id)} title="Excluir Perfil">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Permissões — {editingProfile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pt-2">
            <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-4 px-2 mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Módulo / Página</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase text-center">Ver</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase text-center">Criar</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase text-center">Editar</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase text-center">Excluir</span>
            </div>
            
            {editingPerms.map((perm, idx) => {
              const pageLabel = PAGES.find(p => p.key === perm.page)?.label || perm.page;
              return (
                <div key={perm.page} className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-4 px-2 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors rounded-lg">
                  <span className="text-sm font-medium">{pageLabel}</span>
                  <div className="flex justify-center">
                    <Checkbox checked={perm.can_view} onCheckedChange={(c: boolean) => {
                      const upd = [...editingPerms];
                      upd[idx].can_view = c;
                      if (!c) { upd[idx].can_create = false; upd[idx].can_edit = false; upd[idx].can_delete = false; }
                      setEditingPerms(upd);
                    }} />
                  </div>
                  <div className="flex justify-center">
                    <Checkbox checked={perm.can_create} disabled={!perm.can_view} onCheckedChange={(c: boolean) => {
                      const upd = [...editingPerms]; upd[idx].can_create = c; setEditingPerms(upd);
                    }} />
                  </div>
                  <div className="flex justify-center">
                    <Checkbox checked={perm.can_edit} disabled={!perm.can_view} onCheckedChange={(c: boolean) => {
                      const upd = [...editingPerms]; upd[idx].can_edit = c; setEditingPerms(upd);
                    }} />
                  </div>
                  <div className="flex justify-center">
                    <Checkbox checked={perm.can_delete} disabled={!perm.can_view} onCheckedChange={(c: boolean) => {
                      const upd = [...editingPerms]; upd[idx].can_delete = c; setEditingPerms(upd);
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-4 border-t mt-auto">
            <Button onClick={savePermissions} className="w-full" disabled={savingPerms}>
              {savingPerms ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Permissões
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
          {editProfileData && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nome do Perfil</Label>
                <FastInput value={editProfileData.name} onValueChange={v => setEditProfileData({ ...editProfileData, name: v })} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <FastInput value={editProfileData.description} onValueChange={v => setEditProfileData({ ...editProfileData, description: v })} />
              </div>
              <Button onClick={handleSaveEditProfile} className="w-full">Salvar Alterações</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
