import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronDown, ChevronUp, CheckCircle2, Clock, PlayCircle, Trash2, Calendar as CalendarIcon, Target, TrendingUp, GripVertical, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FastInput } from '@/components/ui/fast-input';
import { FastTextarea } from '@/components/ui/fast-textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface PDI {
  id: string;
  cycle_id: string;
  employee_name: string;
  status: string;
  created_at: string;
}

interface PDIAction {
  id: string;
  pdi_id: string;
  competency_id: string | null;
  title: string;
  description: string | null;
  deadline: string | null;
  status: string;
  progress: number;
}

interface PDICheckin {
  id: string;
  pdi_id: string;
  date: string;
  notes: string;
  next_steps: string;
  created_at: string;
}

interface Cycle { id: string; name: string; }
interface Competency { id: string; name: string; }

const statusIcons: Record<string, typeof CheckCircle2> = {
  pending: Clock,
  in_progress: PlayCircle,
  completed: CheckCircle2,
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluída',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

const pdiStatusLabels: Record<string, string> = {
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const categoryLabels: Record<string, string> = {
  '70_experience': '70% Experiência (Prática)',
  '20_exposure': '20% Exposição (Social)',
  '10_education': '10% Educação (Formal)'
};

const categoryColors: Record<string, string> = {
  '70_experience': 'bg-blue-100 text-blue-700 border-blue-200',
  '20_exposure': 'bg-purple-100 text-purple-700 border-purple-200',
  '10_education': 'bg-orange-100 text-orange-700 border-orange-200'
};

const parseActionMeta = (desc: string | null) => {
  if (!desc) return { text: '', category: '70_experience' };
  try {
    const parsed = JSON.parse(desc);
    if (parsed.category) return parsed;
    return { text: desc, category: '70_experience' };
  } catch {
    return { text: desc, category: '70_experience' };
  }
};

interface PDIPageProps {
  initialEmployeeName?: string;
  autoOpenDialog?: boolean;
  onDialogClose?: () => void;
}

export default function PDIPage({ initialEmployeeName, autoOpenDialog, onDialogClose }: PDIPageProps = {}) {
  const [pdis, setPdis] = useState<PDI[]>([]);
  const [actions, setActions] = useState<Record<string, PDIAction[]>>({});
  const [checkins, setCheckins] = useState<Record<string, PDICheckin[]>>({});
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionDialogPdiId, setActionDialogPdiId] = useState<string | null>(null);
  const [pdiForm, setPdiForm] = useState({ cycle_id: '', employee_name: '' });
  const [actionForm, setActionForm] = useState({ title: '', description: '', deadline: '', competency_id: '', category: '70_experience' });
  const [checkinForm, setCheckinForm] = useState({ date: new Date().toISOString().split('T')[0], notes: '', next_steps: '' });
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([fetchPDIs(), fetchCycles(), fetchCompetencies()]);
  }, []);

  useEffect(() => {
    if (autoOpenDialog && initialEmployeeName) {
      setPdiForm(prev => ({ ...prev, employee_name: initialEmployeeName }));
      setDialogOpen(true);
    }
  }, [autoOpenDialog, initialEmployeeName]);

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open && onDialogClose) {
      onDialogClose();
    }
  };

  async function fetchPDIs() {
    const { data } = await supabase.from('pdis').select('*').order('created_at', { ascending: false });
    if (data) {
      setPdis(data as PDI[]);
      const ids = (data as PDI[]).map(p => p.id);
      if (ids.length > 0) {
        const [{ data: actionsData }, { data: checkinsData }] = await Promise.all([
          supabase.from('pdi_actions').select('*').in('pdi_id', ids),
          supabase.from('pdi_checkins').select('*').in('pdi_id', ids).order('date', { ascending: false })
        ]);
        
        if (actionsData) {
          const grouped: Record<string, PDIAction[]> = {};
          (actionsData as PDIAction[]).forEach(a => {
            if (!grouped[a.pdi_id]) grouped[a.pdi_id] = [];
            grouped[a.pdi_id].push(a);
          });
          setActions(grouped);
        }
        
        if (checkinsData) {
          const grouped: Record<string, PDICheckin[]> = {};
          (checkinsData as PDICheckin[]).forEach(c => {
            if (!grouped[c.pdi_id]) grouped[c.pdi_id] = [];
            grouped[c.pdi_id].push(c);
          });
          setCheckins(grouped);
        }
      }
    }
    setLoading(false);
  }

  async function fetchCycles() {
    const { data } = await supabase.from('evaluation_cycles').select('id, name');
    if (data) setCycles(data as Cycle[]);
  }

  async function fetchCompetencies() {
    const { data } = await supabase.from('competencies').select('id, name');
    if (data) setCompetencies(data as Competency[]);
  }

  async function createPDI() {
    if (!pdiForm.cycle_id || !pdiForm.employee_name) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('pdis').insert([pdiForm]);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'PDI criado!' });
      handleOpenChange(false);
      setPdiForm({ cycle_id: '', employee_name: '' });
      fetchPDIs();
    }
  }

  async function createAction() {
    if (!actionDialogPdiId || !actionForm.title) {
      toast({ title: 'Informe o título da ação', variant: 'destructive' });
      return;
    }
    const actionMeta = JSON.stringify({
      text: actionForm.description,
      category: actionForm.category
    });

    const { error } = await supabase.from('pdi_actions').insert([{
      pdi_id: actionDialogPdiId,
      title: actionForm.title,
      description: actionMeta,
      deadline: actionForm.deadline || null,
      competency_id: actionForm.competency_id || null,
      status: 'pending',
      progress: 0
    }]);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ação adicionada!' });
      setActionDialogPdiId(null);
      setActionForm({ title: '', description: '', deadline: '', competency_id: '', category: '70_experience' });
      fetchPDIs();
    }
  }
  
  async function createCheckin(pdiId: string) {
    if (!checkinForm.date || !checkinForm.notes) {
      toast({ title: 'A data e o resumo são obrigatórios', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('pdi_checkins').insert([{
      pdi_id: pdiId,
      date: checkinForm.date,
      notes: checkinForm.notes,
      next_steps: checkinForm.next_steps
    }]);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Check-in registrado!' });
      setCheckinForm({ date: new Date().toISOString().split('T')[0], notes: '', next_steps: '' });
      fetchPDIs();
    }
  }

  async function updateActionStatus(actionId: string, newStatus: string) {
    let progress = 0;
    if (newStatus === 'completed') progress = 100;
    else if (newStatus === 'in_progress') progress = 50;
    
    await supabase.from('pdi_actions').update({ status: newStatus, progress }).eq('id', actionId);
    fetchPDIs();
  }

  async function updateActionProgress(actionId: string, progress: number) {
    const newStatus = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';
    await supabase.from('pdi_actions').update({ progress: Math.min(100, Math.max(0, progress)), status: newStatus }).eq('id', actionId);
    fetchPDIs();
  }

  async function deleteAction(actionId: string) {
    await supabase.from('pdi_actions').delete().eq('id', actionId);
    fetchPDIs();
  }

  const cycleName = (id: string) => cycles.find(c => c.id === id)?.name || '';
  const compName = (id: string | null) => competencies.find(c => c.id === id)?.name || '';

  const getPdiProgress = (pdiId: string) => {
    const pdiActions = actions[pdiId] || [];
    if (pdiActions.length === 0) return 0;
    return Math.round(pdiActions.reduce((acc, a) => acc + a.progress, 0) / pdiActions.length);
  };

  const renderBalance = (pdiActions: PDIAction[]) => {
    const total = pdiActions.length;
    if (total === 0) return null;
    let count70 = 0, count20 = 0, count10 = 0;
    pdiActions.forEach(a => {
      const meta = parseActionMeta(a.description);
      if (meta.category === '70_experience') count70++;
      else if (meta.category === '20_exposure') count20++;
      else count10++;
    });
    const p70 = (count70/total)*100;
    const p20 = (count20/total)*100;
    const p10 = (count10/total)*100;
    
    return (
      <div className="w-full mt-3 px-1">
        <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-1">
          <span className="text-blue-700">70% Prática ({Math.round(p70)}%)</span>
          <span className="text-purple-700">20% Social ({Math.round(p20)}%)</span>
          <span className="text-orange-700">10% Formal ({Math.round(p10)}%)</span>
        </div>
        <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
          <div style={{ width: `${p70}%` }} className="bg-blue-500 transition-all duration-500" />
          <div style={{ width: `${p20}%` }} className="bg-purple-500 transition-all duration-500" />
          <div style={{ width: `${p10}%` }} className="bg-orange-500 transition-all duration-500" />
        </div>
      </div>
    );
  };
  
  // Dashboards Stats
  const globalStats = useMemo(() => {
    const allActions = Object.values(actions).flat();
    const total = allActions.length;
    let count70 = 0, count20 = 0, count10 = 0;
    let delayed = 0, onTrack = 0;
    const now = new Date();
    
    allActions.forEach(a => {
      const meta = parseActionMeta(a.description);
      if (meta.category === '70_experience') count70++;
      else if (meta.category === '20_exposure') count20++;
      else count10++;
      
      if (a.deadline && a.status !== 'completed' && new Date(a.deadline) < now) {
        delayed++;
      } else if (a.status !== 'completed') {
        onTrack++;
      }
    });

    return {
      activePdis: pdis.filter(p => p.status === 'in_progress' || p.status === 'pending').length,
      p70: total > 0 ? (count70/total)*100 : 0,
      p20: total > 0 ? (count20/total)*100 : 0,
      p10: total > 0 ? (count10/total)*100 : 0,
      delayed,
      onTrack
    };
  }, [pdis, actions]);

  const careerLevels = [
    { cargo: 'Encarregado Operacional', requisito: 'Ensino médio completo', order: 1 },
    { cargo: 'Supervisor de Campo', requisito: 'Curso superior completo ou cursando', order: 2 },
    { cargo: 'Coordenador Operacional', requisito: 'Curso Superior completo', order: 3 },
    { cargo: 'Gerente Operacional', requisito: 'Curso Superior completo + 1 especialização na área', order: 4 },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">PDI - Plano de Desenvolvimento Individual</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhamento contínuo e desenvolvimento 70:20:10</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"><Plus className="w-4 h-4 mr-2" /> Novo PDI</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar PDI</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Ciclo</Label>
                <Select value={pdiForm.cycle_id} onValueChange={v => setPdiForm({ ...pdiForm, cycle_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Colaborador</Label><FastInput value={pdiForm.employee_name} onValueChange={v => setPdiForm(f => ({ ...f, employee_name: v }))} placeholder="Nome do colaborador" /></div>
              <Button onClick={createPDI} className="w-full">Criar PDI</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
      
      {/* Dashboard KPI's */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="corporate-kpi corporate-kpi-accent p-4 border border-border/50 rounded-xl bg-card shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">PDIs Ativos</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold text-foreground">{globalStats.activePdis}</p>
            <span className="text-sm text-muted-foreground">de {pdis.length} total</span>
          </div>
        </div>
        <div className="corporate-kpi p-4 border border-border/50 rounded-xl bg-card shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Equilíbrio da Equipe</p>
          <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted">
            <div style={{ width: `${globalStats.p70}%` }} className="bg-blue-500" title={`70% Prática: ${Math.round(globalStats.p70)}%`} />
            <div style={{ width: `${globalStats.p20}%` }} className="bg-purple-500" title={`20% Social: ${Math.round(globalStats.p20)}%`} />
            <div style={{ width: `${globalStats.p10}%` }} className="bg-orange-500" title={`10% Formal: ${Math.round(globalStats.p10)}%`} />
          </div>
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mt-2">
            <span className="text-blue-700">{Math.round(globalStats.p70)}% PRÁTICA</span>
            <span className="text-purple-700">{Math.round(globalStats.p20)}% SOCIAL</span>
            <span className="text-orange-700">{Math.round(globalStats.p10)}% FORMAL</span>
          </div>
        </div>
        <div className="corporate-kpi corporate-kpi-danger p-4 border border-border/50 rounded-xl bg-card shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ações em Atraso</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold text-red-500">{globalStats.delayed}</p>
            <span className="text-sm text-muted-foreground">vs {globalStats.onTrack} no prazo</span>
          </div>
        </div>
      </div>

      {/* Action creation dialog com foco SMART */}
      <Dialog open={!!actionDialogPdiId} onOpenChange={open => !open && setActionDialogPdiId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Meta S.M.A.R.T</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[80vh] overflow-y-auto px-1">
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
              <p className="text-xs text-primary font-medium mb-1">Dica: Formato S.M.A.R.T.</p>
              <p className="text-[11px] text-muted-foreground">Sua ação deve ser <strong>Específica</strong>, <strong>Mensurável</strong>, <strong>Alcançável</strong>, <strong>Relevante</strong> e ter um <strong>Prazo</strong> (Tempo).</p>
            </div>
            <div>
              <Label>Tipo de Aprendizado (70:20:10)</Label>
              <Select value={actionForm.category} onValueChange={v => setActionForm({ ...actionForm, category: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="70_experience">70% Experiência (Projetos, Prática, Desafios)</SelectItem>
                  <SelectItem value="20_exposure">20% Exposição (Mentoria, Feedback, Observação)</SelectItem>
                  <SelectItem value="10_education">10% Educação (Cursos, Livros, Workshops)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>O que será feito? (Específico)</Label>
              <FastInput value={actionForm.title} onValueChange={v => setActionForm({ ...actionForm, title: v })} placeholder="Ex: Liderar o projeto X entregando as 3 fases..." />
            </div>
            <div>
              <Label>Como será feito e medido? (Mensurável e Alcançável)</Label>
              <FastTextarea value={actionForm.description} onValueChange={v => setActionForm({ ...actionForm, description: v })} placeholder="Detalhe as etapas, métricas de sucesso e recursos necessários..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prazo (Temporal)</Label>
                <Input type="date" value={actionForm.deadline} onChange={e => setActionForm({ ...actionForm, deadline: e.target.value })} />
              </div>
              <div>
                <Label>Competência Foco (Relevante)</Label>
                <Select value={actionForm.competency_id} onValueChange={v => setActionForm({ ...actionForm, competency_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {competencies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={createAction} className="w-full">Adicionar Ação</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Career progression card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Plano de Carreira — Requisitos para Promoção</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {careerLevels.map((level, i) => (
            <div key={level.cargo} className="relative flex flex-col items-center text-center p-4 rounded-lg border border-border bg-muted/20">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mb-2">{level.order}</div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{level.cargo}</h3>
              <p className="text-xs text-muted-foreground">{level.requisito}</p>
              {i < careerLevels.length - 1 && (
                <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">→</div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : pdis.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhum PDI criado ainda.</div>
      ) : (
        <div className="space-y-4">
          {pdis.map((pdi, i) => {
            const pdiActions = actions[pdi.id] || [];
            const pdiCheckins = checkins[pdi.id] || [];
            const progress = getPdiProgress(pdi.id);
            const isExpanded = expanded === pdi.id;
            
            // Kanban columns
            const colPending = pdiActions.filter(a => a.status === 'pending');
            const colInProgress = pdiActions.filter(a => a.status === 'in_progress');
            const colCompleted = pdiActions.filter(a => a.status === 'completed');

            return (
              <motion.div key={pdi.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl overflow-hidden shadow-sm"
              >
                <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-muted/10 transition-colors" onClick={() => setExpanded(isExpanded ? null : pdi.id)}>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{pdi.employee_name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Ciclo: {cycleName(pdi.cycle_id)} · {pdiActions.length} ações · {pdiStatusLabels[pdi.status]}</p>
                  </div>
                  <div className="flex-1 max-w-[300px] hidden md:block">
                    {renderBalance(pdiActions)}
                  </div>
                  <div className="flex items-center gap-3 min-w-[140px] ml-4">
                    <Progress value={progress} className="h-2 flex-1 bg-muted" />
                    <span className="text-sm font-bold text-foreground w-10 text-right">{progress}%</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground ml-2" /> : <ChevronDown className="w-5 h-5 text-muted-foreground ml-2" />}
                </div>
                
                {isExpanded && (
                  <div className="border-t border-border bg-muted/5">
                    <Tabs defaultValue="kanban" className="w-full">
                      <div className="px-5 pt-3">
                        <TabsList className="bg-muted/50 border border-border/50">
                          <TabsTrigger value="kanban" className="text-xs data-[state=active]:bg-background"><Target className="w-3.5 h-3.5 mr-1.5"/> Metas & Ações</TabsTrigger>
                          <TabsTrigger value="checkins" className="text-xs data-[state=active]:bg-background"><CalendarIcon className="w-3.5 h-3.5 mr-1.5"/> 1:1 Check-ins</TabsTrigger>
                        </TabsList>
                      </div>

                      {/* Aba Metas e Ações (Kanban) */}
                      <TabsContent value="kanban" className="p-5 pt-4 m-0 border-0">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-semibold text-foreground">Plano de Ação</h4>
                          <Button size="sm" onClick={() => setActionDialogPdiId(pdi.id)}>
                            <Plus className="w-4 h-4 mr-1" /> Nova Ação
                          </Button>
                        </div>
                        
                        {pdiActions.length === 0 ? (
                          <div className="text-center py-8 border border-dashed border-border rounded-xl">
                            <Target className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Nenhuma ação cadastrada neste PDI.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Coluna Pendente */}
                            <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                                A Fazer <span className="bg-muted px-2 py-0.5 rounded-full text-foreground">{colPending.length}</span>
                              </h5>
                              <div className="space-y-3">
                                {colPending.map(action => <ActionCard key={action.id} action={action} compName={compName} onDelete={() => deleteAction(action.id)} onStatusChange={(s) => updateActionStatus(action.id, s)} onProgressChange={(p) => updateActionProgress(action.id, p)} />)}
                              </div>
                            </div>
                            {/* Coluna Em Andamento */}
                            <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3 flex items-center justify-between">
                                Em Andamento <span className="bg-blue-100 px-2 py-0.5 rounded-full">{colInProgress.length}</span>
                              </h5>
                              <div className="space-y-3">
                                {colInProgress.map(action => <ActionCard key={action.id} action={action} compName={compName} onDelete={() => deleteAction(action.id)} onStatusChange={(s) => updateActionStatus(action.id, s)} onProgressChange={(p) => updateActionProgress(action.id, p)} />)}
                              </div>
                            </div>
                            {/* Coluna Concluído */}
                            <div className="bg-green-500/5 rounded-xl p-3 border border-green-500/10">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-green-700 mb-3 flex items-center justify-between">
                                Concluído <span className="bg-green-100 px-2 py-0.5 rounded-full">{colCompleted.length}</span>
                              </h5>
                              <div className="space-y-3">
                                {colCompleted.map(action => <ActionCard key={action.id} action={action} compName={compName} onDelete={() => deleteAction(action.id)} onStatusChange={(s) => updateActionStatus(action.id, s)} onProgressChange={(p) => updateActionProgress(action.id, p)} />)}
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {/* Aba Check-ins */}
                      <TabsContent value="checkins" className="p-5 pt-4 m-0 border-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-1 space-y-4 bg-background p-4 rounded-xl border border-border shadow-sm">
                            <div>
                              <h4 className="text-sm font-semibold text-foreground flex items-center"><FileText className="w-4 h-4 mr-2"/> Registrar Check-in</h4>
                              <p className="text-xs text-muted-foreground mt-1">Anote os combinados e o progresso da reunião de acompanhamento.</p>
                            </div>
                            <div>
                              <Label>Data do Check-in</Label>
                              <Input type="date" value={checkinForm.date} onChange={e => setCheckinForm(f => ({ ...f, date: e.target.value }))} className="mt-1" />
                            </div>
                            <div>
                              <Label>Resumo da Conversa</Label>
                              <FastTextarea value={checkinForm.notes} onValueChange={v => setCheckinForm(f => ({ ...f, notes: v }))} placeholder="O que foi discutido? Quais os desafios?" className="mt-1 min-h-[100px]" />
                            </div>
                            <div>
                              <Label>Próximos Passos</Label>
                              <FastTextarea value={checkinForm.next_steps} onValueChange={v => setCheckinForm(f => ({ ...f, next_steps: v }))} placeholder="O que o liderado se compromete a fazer até o próximo check-in?" className="mt-1" />
                            </div>
                            <Button onClick={() => createCheckin(pdi.id)} className="w-full">Salvar Check-in</Button>
                          </div>
                          
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-semibold text-foreground mb-4">Histórico de Reuniões</h4>
                            {pdiCheckins.length === 0 ? (
                              <div className="text-center py-8 border border-dashed border-border rounded-xl">
                                <CalendarIcon className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Nenhum check-in registrado ainda.</p>
                                <p className="text-xs text-muted-foreground mt-1">Recomendamos reuniões 1:1 mensais para garantir o sucesso do PDI.</p>
                              </div>
                            ) : (
                              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                                {pdiCheckins.map((checkin, idx) => (
                                  <div key={checkin.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-background p-4 rounded-xl border border-border shadow-sm">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-sm text-foreground">{new Date(checkin.date).toLocaleDateString('pt-BR')}</span>
                                      </div>
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{checkin.notes}</p>
                                      {checkin.next_steps && (
                                        <div className="mt-3 pt-3 border-t border-border/50">
                                          <p className="text-xs font-semibold text-foreground">Próximos Passos:</p>
                                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{checkin.next_steps}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Subcomponente para o Card do Kanban
function ActionCard({ action, compName, onDelete, onStatusChange, onProgressChange }: { action: PDIAction, compName: (id: string | null) => string, onDelete: () => void, onStatusChange: (s: string) => void, onProgressChange: (p: number) => void }) {
  const meta = parseActionMeta(action.description);
  const isDelayed = action.deadline && action.status !== 'completed' && new Date(action.deadline) < new Date();
  
  return (
    <div className="bg-background p-3 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow group relative">
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${categoryColors[meta.category]}`}>{categoryLabels[meta.category].split(' ')[0]} {categoryLabels[meta.category].split(' ')[1]}</span>
        
        <Select value={action.status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-6 w-auto px-2 text-[10px] bg-muted/50 border-0 focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending" className="text-xs">Pendente</SelectItem>
            <SelectItem value="in_progress" className="text-xs">Andamento</SelectItem>
            <SelectItem value="completed" className="text-xs">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <h6 className="text-sm font-semibold text-foreground leading-tight">{action.title}</h6>
      {meta.text && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2" title={meta.text}>{meta.text}</p>}
      
      <div className="mt-3 pt-2 border-t border-border/50 flex flex-wrap gap-1.5 items-center justify-between">
        <div className="flex flex-col gap-1">
          {action.competency_id && <span className="text-[10px] text-muted-foreground flex items-center"><BrainCircuit className="w-3 h-3 mr-1"/> {compName(action.competency_id)}</span>}
          {action.deadline && <span className={`text-[10px] flex items-center ${isDelayed ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}><CalendarIcon className="w-3 h-3 mr-1"/> {new Date(action.deadline).toLocaleDateString('pt-BR')}</span>}
        </div>
      </div>
      
      {/* Progress and Delete Actions - Hidden initially, shown on hover on desktop */}
      <div className="mt-3 flex items-center justify-between gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5 flex-1">
          <Input 
            type="number" min={0} max={100} value={action.progress} 
            onChange={e => onProgressChange(parseInt(e.target.value) || 0)}
            className="h-6 w-14 text-[10px] px-1 text-center"
          />
          <span className="text-[10px] text-muted-foreground">%</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
