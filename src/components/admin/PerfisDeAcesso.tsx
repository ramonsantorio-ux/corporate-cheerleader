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

import { PAGES, PAGE_GROUPS } from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';

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
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Unified dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState<{ id: string | null; name: string; description: string }>({ id: null, name: '', description: '' });
  const [editingPerms, setEditingPerms] = useState<ProfilePermission[]>([]);
  const [saving, setSaving] = useState(false);

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

  function openCreateProfile() {
    setProfileData({ id: null, name: '', description: '' });
    const defaultPerms = PAGES.map(p => ({
      page: p.key,
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
    }));
    setEditingPerms(defaultPerms);
    setDialogOpen(true);
  }

  async function openEditProfile(profile: AccessProfile) {
    setProfileData({ id: profile.id, name: profile.name, description: profile.description || '' });
    
    const { data, error } = await supabase.from('access_profile_permissions').select('*').eq('profile_id', profile.id);
    
    if (error) {
      toast.error('Erro ao carregar permissões');
      return;
    }

    const permsMap = new Map(data?.map(p => [p.page, p]));
    type PermRow = { page: string; can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean };
    const defaultPerms = PAGES.map(p => {
      const existing = permsMap.get(p.key) as PermRow | undefined;
      return {
        page: p.key,
        can_view: existing?.can_view || false,
        can_create: existing?.can_create || false,
        can_edit: existing?.can_edit || false,
        can_delete: existing?.can_delete || false,
      };
    });
    setEditingPerms(defaultPerms);
    setDialogOpen(true);
  }

  async function handleSaveProfile() {
    if (!profileData.name) return toast.error('Nome do perfil é obrigatório');
    setSaving(true);
    
    let profileId = profileData.id;
    
    if (!profileId) {
      // Create new profile
      const { data, error } = await supabase.from('access_profiles').insert({
        name: profileData.name,
        description: profileData.description
      }).select().single();
      
      if (error) {
        toast.error('Erro ao criar perfil');
        setSaving(false);
        return;
      }
      profileId = data.id;
      setProfiles([...profiles, data]);
    } else {
      // Update existing profile
      const { error } = await supabase.from('access_profiles').update({
        name: profileData.name,
        description: profileData.description
      }).eq('id', profileId);
      
      if (error) {
        toast.error('Erro ao atualizar perfil');
        setSaving(false);
        return;
      }
      setProfiles(profiles.map(p => p.id === profileId ? { ...p, name: profileData.name, description: profileData.description } : p));
    }
    
    // Save permissions
    await supabase.from('access_profile_permissions').delete().eq('profile_id', profileId);
    
    const toInsert = editingPerms.map(p => ({
      profile_id: profileId,
      ...p
    }));

    const { error: permsError } = await supabase.from('access_profile_permissions').insert(toInsert);
    
    if (permsError) {
      toast.error('Erro ao salvar permissões');
    } else {
      toast.success(profileData.id ? 'Perfil atualizado com sucesso!' : 'Perfil criado com sucesso!');
      setDialogOpen(false);
    }
    setSaving(false);
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
        {isAdmin && (
          <Button size="sm" onClick={openCreateProfile}><Plus className="w-4 h-4 mr-2" /> Novo Perfil</Button>
        )}
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
              <Button variant="outline" size="sm" className={isAdmin ? "flex-1" : "w-full"} onClick={() => openEditProfile(p)}>
                <Shield className="w-3.5 h-3.5 mr-1" /> Permissões
              </Button>
              {isAdmin && (
                <>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditProfile(p)} title="Editar Perfil">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteProfile(p.id)} title="Excluir Perfil">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{profileData.id ? 'Editar Perfil' : 'Criar Novo Perfil'}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 pt-2 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              <div className="space-y-2">
                <Label>Nome do Perfil</Label>
                <FastInput disabled={!isAdmin} value={profileData.name} onValueChange={v => setProfileData({ ...profileData, name: v })} placeholder="Ex: Analista de RH" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <FastInput disabled={!isAdmin} value={profileData.description} onValueChange={v => setProfileData({ ...profileData, description: v })} placeholder="Acessos do departamento..." />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider px-2 pt-2 border-t border-border">Permissões de Acesso</h3>
              <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-4 px-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Módulo / Página</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase text-center">Ver</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase text-center">Criar</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase text-center">Editar</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase text-center">Excluir</span>
              </div>
              
              <div className="space-y-6">
                {PAGE_GROUPS.map((group) => (
                  <div key={group.module} className="space-y-2">
                    <h4 className="text-sm font-semibold text-primary/80 uppercase tracking-wider px-2">
                      {group.module}
                    </h4>
                    <div className="space-y-1">
                      {group.pages.map((page) => {
                        const permIdx = editingPerms.findIndex(p => p.page === page.key);
                        const perm = editingPerms[permIdx];
                        if (!perm) return null;
                        return (
                          <div key={page.key} className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-4 px-2 py-2 border-b border-border last:border-0 hover:bg-muted/30 transition-colors rounded-lg">
                            <span className="text-sm font-medium text-muted-foreground">{page.label}</span>
                            <div className="flex justify-center items-center">
                              <Checkbox checked={perm.can_view} disabled={!isAdmin} onCheckedChange={(c) => {
                                const isChecked = c === true;
                                const upd = [...editingPerms];
                                upd[permIdx] = { ...upd[permIdx], can_view: isChecked };
                                if (!isChecked) {
                                  upd[permIdx].can_create = false;
                                  upd[permIdx].can_edit = false;
                                  upd[permIdx].can_delete = false;
                                }
                                setEditingPerms(upd);
                              }} />
                            </div>
                            <div className="flex justify-center items-center">
                              <Checkbox checked={perm.can_create} disabled={!perm.can_view || !isAdmin} onCheckedChange={(c) => {
                                const upd = [...editingPerms];
                                upd[permIdx] = { ...upd[permIdx], can_create: c === true };
                                setEditingPerms(upd);
                              }} />
                            </div>
                            <div className="flex justify-center items-center">
                              <Checkbox checked={perm.can_edit} disabled={!perm.can_view || !isAdmin} onCheckedChange={(c) => {
                                const upd = [...editingPerms];
                                upd[permIdx] = { ...upd[permIdx], can_edit: c === true };
                                setEditingPerms(upd);
                              }} />
                            </div>
                            <div className="flex justify-center items-center">
                              <Checkbox checked={perm.can_delete} disabled={!perm.can_view || !isAdmin} onCheckedChange={(c) => {
                                const upd = [...editingPerms];
                                upd[permIdx] = { ...upd[permIdx], can_delete: c === true };
                                setEditingPerms(upd);
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
          </div>
          <div className="pt-4 border-t mt-auto">
            {isAdmin ? (
              <Button onClick={handleSaveProfile} className="w-full" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {profileData.id ? 'Salvar Alterações' : 'Criar Perfil'}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground text-center">Apenas administradores podem alterar permissões.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
