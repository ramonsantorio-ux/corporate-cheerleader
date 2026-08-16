import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, ChevronDown, ChevronUp, CheckCircle2, Clock, PlayCircle, Trash2, 
  Calendar as CalendarIcon, Target, TrendingUp, FileText, Search, Sparkles,
  Building2, Users, Shield, MessageSquare, AlertTriangle, Printer, ExternalLink,
  Award, Check, ArrowRight, BookOpen, Layers
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FastInput } from '@/components/ui/fast-input';
import { FastTextarea } from '@/components/ui/fast-textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DEPARTAMENTOS } from '@/lib/departments';
import { PDI_COMPETENCY_TRACKS, PdiCompetencyTrack, PdiActionSuggestion } from '@/lib/pdiTemplates';

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

const categoryLabels: Record<string, { label: string; tag: string; color: string; border: string; bg: string; dot: string }> = {
  '70_experience': { 
    label: '70% Prática & Projetos', 
    tag: 'Experiência On-the-Job', 
    color: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    dot: 'bg-blue-500'
  },
  '20_exposure': { 
    label: '20% Social & Mentoria', 
    tag: 'Exposição & Feedback', 
    color: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    dot: 'bg-purple-500'
  },
  '10_education': { 
    label: '10% Educação Formal', 
    tag: 'Cursos & Certificações', 
    color: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    dot: 'bg-amber-500'
  }
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

const getDeadlineStatus = (deadline: string | null, status: string) => {
  if (status === 'completed') return { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
  if (!deadline) return { label: 'Sem prazo', color: 'bg-muted text-muted-foreground' };
  
  const target = new Date(deadline);
  const now = new Date();
  now.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { label: `Atrasado (${Math.abs(diffDays)}d)`, color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400' };
  }
  if (diffDays === 0) {
    return { label: 'Vence hoje', color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400' };
  }
  if (diffDays <= 7) {
    return { label: `${diffDays}d restantes`, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30' };
  }
  return { label: `${diffDays}d restantes`, color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300' };
};

interface PDIPageProps {
  initialEmployeeName?: string;
  autoOpenDialog?: boolean;
  onDialogClose?: () => void;
}

export default function PDIPage({ initialEmployeeName, autoOpenDialog, onDialogClose }: PDIPageProps = {}) {
  const { userDepartment, effectiveDepartment, isDepartmentLocked } = useAuth();
  const [deptFilter, setDeptFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [funcionarios, setFuncionarios] = useState<{ id: string; nome: string; cargo?: string; departamento: string }[]>([]);

  useEffect(() => {
    if (isDepartmentLocked && userDepartment) {
      setDeptFilter(userDepartment);
    } else if (effectiveDepartment) {
      setDeptFilter(effectiveDepartment);
    }
  }, [isDepartmentLocked, userDepartment, effectiveDepartment]);

  const [pdis, setPdis] = useState<PDI[]>([]);
  const [actions, setActions] = useState<Record<string, PDIAction[]>>({});
  const [checkins, setCheckins] = useState<Record<string, PDICheckin[]>>({});
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  
  // Modais
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionDialogPdiId, setActionDialogPdiId] = useState<string | null>(null);
  const [actionTab, setActionTab] = useState<'templates' | 'custom'>('templates');
  const [selectedTrack, setSelectedTrack] = useState<string>('lideranca_operacional');
  
  const [checkinDialogPdiId, setCheckinDialogPdiId] = useState<string | null>(null);
  const [printPdi, setPrintPdi] = useState<PDI | null>(null);

  // Forms
  const [pdiForm, setPdiForm] = useState({ cycle_id: '', employee_name: '' });
  const [actionForm, setActionForm] = useState({ title: '', description: '', deadline: '', competency_id: '', category: '70_experience' });
  const [checkinForm, setCheckinForm] = useState({ date: new Date().toISOString().split('T')[0], notes: '', next_steps: '', status: 'on_track' });
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('funcionarios').select('id, nome, cargo, departamento').then(({ data }) => {
      if (data) setFuncionarios(data as { id: string; nome: string; cargo?: string; departamento: string }[]);
    });
  }, []);

  const activeDept = (isDepartmentLocked && userDepartment) ? userDepartment : deptFilter;

  useEffect(() => {
    Promise.all([fetchPDIs(), fetchCycles(), fetchCompetencies()]);
  }, [deptFilter, isDepartmentLocked, userDepartment, funcionarios]);

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
      const allPdis = data as PDI[];
      const filteredPdis = (activeDept === 'todos' || funcionarios.length === 0)
        ? allPdis
        : allPdis.filter(p => {
            const f = funcionarios.find(emp => emp.nome.toLowerCase() === p.employee_name.toLowerCase());
            return f ? f.departamento === activeDept : true;
          });

      setPdis(filteredPdis);
      const ids = filteredPdis.map(p => p.id);
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
      } else {
        setActions({});
        setCheckins({});
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
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('pdis').insert([{
      ...pdiForm,
      status: 'in_progress'
    }]);
    if (error) {
      toast({ title: 'Erro ao criar PDI', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'PDI criado com sucesso!' });
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
      toast({ title: 'Erro ao adicionar ação', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ação adicionada ao PDI!' });
      setActionDialogPdiId(null);
      setActionForm({ title: '', description: '', deadline: '', competency_id: '', category: '70_experience' });
      fetchPDIs();
    }
  }

  const applyTemplateAction = (suggestion: PdiActionSuggestion) => {
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + suggestion.suggestedDays);
    const deadlineStr = deadlineDate.toISOString().split('T')[0];

    setActionForm({
      title: suggestion.title,
      description: suggestion.description,
      deadline: deadlineStr,
      competency_id: '',
      category: suggestion.category
    });
    setActionTab('custom');
    toast({ title: 'Sugestão aplicada!', description: 'Você pode personalizar o prazo e salvar.' });
  };

  async function createCheckin(pdiId: string) {
    if (!checkinForm.date || !checkinForm.notes) {
      toast({ title: 'A data e o resumo do check-in são obrigatórios', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('pdi_checkins').insert([{
      pdi_id: pdiId,
      date: checkinForm.date,
      notes: `[Saúde: ${checkinForm.status}] ${checkinForm.notes}`,
      next_steps: checkinForm.next_steps
    }]);
    if (error) {
      toast({ title: 'Erro ao salvar check-in', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Check-in 1:1 registrado com sucesso!' });
      setCheckinDialogPdiId(null);
      setCheckinForm({ date: new Date().toISOString().split('T')[0], notes: '', next_steps: '', status: 'on_track' });
      fetchPDIs();
    }
  }

  async function updateActionProgress(actionId: string, progress: number) {
    const newStatus = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';
    await supabase.from('pdi_actions').update({ progress: Math.min(100, Math.max(0, progress)), status: newStatus }).eq('id', actionId);
    fetchPDIs();
  }

  async function updatePdiStatus(pdiId: string, newStatus: string) {
    await supabase.from('pdis').update({ status: newStatus }).eq('id', pdiId);
    toast({ title: `PDI marcado como ${newStatus === 'completed' ? 'Concluído' : 'Em andamento'}` });
    fetchPDIs();
  }

  async function deleteAction(actionId: string) {
    await supabase.from('pdi_actions').delete().eq('id', actionId);
    toast({ title: 'Ação removida' });
    fetchPDIs();
  }

  const cycleName = (id: string) => cycles.find(c => c.id === id)?.name || 'Ciclo Anual';
  const compName = (id: string | null) => competencies.find(c => c.id === id)?.name || '';

  const getPdiProgress = (pdiId: string) => {
    const pdiActions = actions[pdiId] || [];
    if (pdiActions.length === 0) return 0;
    return Math.round(pdiActions.reduce((acc, a) => acc + a.progress, 0) / pdiActions.length);
  };

  const getPdiBalance = (pdiActions: PDIAction[]) => {
    const total = pdiActions.length;
    if (total === 0) return { p70: 0, p20: 0, p10: 0, total: 0, isHealthy: false };
    let count70 = 0, count20 = 0, count10 = 0;
    pdiActions.forEach(a => {
      const meta = parseActionMeta(a.description);
      if (meta.category === '70_experience') count70++;
      else if (meta.category === '20_exposure') count20++;
      else count10++;
    });
    const p70 = Math.round((count70 / total) * 100);
    const p20 = Math.round((count20 / total) * 100);
    const p10 = Math.round((count10 / total) * 100);
    // Saudável se pelo menos 50% for prática
    const isHealthy = p70 >= 50;
    return { p70, p20, p10, total, isHealthy };
  };

  // Dashboard Stats
  const globalStats = useMemo(() => {
    const allActions = Object.values(actions).flat();
    const total = allActions.length;
    let count70 = 0, count20 = 0, count10 = 0;
    let delayed = 0, onTrack = 0, completed = 0;
    const now = new Date();
    now.setHours(0,0,0,0);
    
    allActions.forEach(a => {
      const meta = parseActionMeta(a.description);
      if (meta.category === '70_experience') count70++;
      else if (meta.category === '20_exposure') count20++;
      else count10++;
      
      if (a.status === 'completed') {
        completed++;
      } else if (a.deadline && new Date(a.deadline) < now) {
        delayed++;
      } else {
        onTrack++;
      }
    });

    const activePdisCount = pdis.filter(p => p.status === 'in_progress' || p.status === 'pending').length;
    const globalProgress = total > 0 ? Math.round(allActions.reduce((acc, a) => acc + a.progress, 0) / total) : 0;

    return {
      activePdis: activePdisCount,
      totalPdis: pdis.length,
      globalProgress,
      totalActions: total,
      p70: total > 0 ? (count70 / total) * 100 : 0,
      p20: total > 0 ? (count20 / total) * 100 : 0,
      p10: total > 0 ? (count10 / total) * 100 : 0,
      delayed,
      onTrack,
      completed,
      onTimeRate: (delayed + onTrack) > 0 ? Math.round((onTrack / (delayed + onTrack)) * 100) : 100
    };
  }, [pdis, actions]);

  // Lista filtrada de PDIs
  const filteredPdis = useMemo(() => {
    return pdis.filter(p => {
      const matchesSearch = p.employee_name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'completed') return p.status === 'completed';
      if (statusFilter === 'in_progress') return p.status === 'in_progress' || p.status === 'pending';
      if (statusFilter === 'delayed') {
        const pdiActions = actions[p.id] || [];
        const now = new Date();
        now.setHours(0,0,0,0);
        return pdiActions.some(a => a.status !== 'completed' && a.deadline && new Date(a.deadline) < now);
      }
      return true;
    });
  }, [pdis, searchTerm, statusFilter, actions]);

  const careerLevels = [
    { cargo: 'Encarregado Operacional', requisito: 'Ensino médio completo + Liderança de Campo', tempoMedio: '1 a 2 anos' },
    { cargo: 'Supervisor de Campo', requisito: 'Curso Superior ou cursando + Gestão de SSMA', tempoMedio: '2 a 3 anos' },
    { cargo: 'Coordenador Operacional', requisito: 'Curso Superior completo + Gestão de Contratos', tempoMedio: '3 a 4 anos' },
    { cargo: 'Gerente Operacional', requisito: 'Pós-graduação/Especialização + Gestão Estratégica', tempoMedio: '4+ anos' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Executivo com Filtros */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              Metodologia 70:20:10
            </span>
            <span className="text-xs text-muted-foreground">Morgan McCall / CCL Standard</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-1">PDI - Plano de Desenvolvimento Individual</h1>
          <p className="text-muted-foreground text-sm">
            Gestão estratégica de competências, metas S.M.A.R.T e acompanhamento de carreira
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDepartmentLocked && userDepartment ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary font-semibold text-xs rounded-lg whitespace-nowrap">
              <Building2 className="w-4 h-4" />
              <span>{userDepartment}</span>
            </div>
          ) : (
            <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v)}>
              <SelectTrigger className="w-44 h-9 text-xs">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Departamentos</SelectItem>
                {DEPARTAMENTOS.map(d => (
                  <SelectItem key={d} value={d}>🏢 {d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Novo PDI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Criar Plano de Desenvolvimento
                </DialogTitle>
                <DialogDescription>
                  Inicie um ciclo de evolução estruturada 70:20:10 para o colaborador.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Ciclo de Avaliação / Desenvolvimento</Label>
                  <Select value={pdiForm.cycle_id} onValueChange={v => setPdiForm({ ...pdiForm, cycle_id: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o ciclo..." /></SelectTrigger>
                    <SelectContent>
                      {cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Colaborador</Label>
                  <Select value={pdiForm.employee_name} onValueChange={v => setPdiForm(f => ({ ...f, employee_name: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o colaborador..." /></SelectTrigger>
                    <SelectContent>
                      {funcionarios
                        .filter(f => activeDept === 'todos' || f.departamento === activeDept)
                        .map(f => (
                          <SelectItem key={f.id} value={f.nome}>
                            {f.nome} {f.cargo ? `(${f.cargo})` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createPDI} className="w-full mt-2">Iniciar PDI</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* KPIs Executivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>PDIs Ativos</span>
              <Users className="w-4 h-4 text-primary" />
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-foreground">{globalStats.activePdis}</span>
              <span className="text-xs text-muted-foreground">de {globalStats.totalPdis} total</span>
            </div>
            <Progress value={globalStats.totalPdis > 0 ? (globalStats.activePdis / globalStats.totalPdis) * 100 : 0} className="h-1.5 mt-3" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Equilíbrio 70:20:10</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </p>
            <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-muted mt-3">
              <div style={{ width: `${globalStats.p70}%` }} className="bg-blue-500" title={`70% Prática: ${Math.round(globalStats.p70)}%`} />
              <div style={{ width: `${globalStats.p20}%` }} className="bg-purple-500" title={`20% Social: ${Math.round(globalStats.p20)}%`} />
              <div style={{ width: `${globalStats.p10}%` }} className="bg-amber-500" title={`10% Formal: ${Math.round(globalStats.p10)}%`} />
            </div>
            <div className="flex justify-between text-[9px] uppercase font-bold tracking-wider mt-2 text-muted-foreground">
              <span className="text-blue-600">{Math.round(globalStats.p70)}% Prática</span>
              <span className="text-purple-600">{Math.round(globalStats.p20)}% Social</span>
              <span className="text-amber-600">{Math.round(globalStats.p10)}% Formal</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Aderência aos Prazos</span>
              <Clock className="w-4 h-4 text-emerald-500" />
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-emerald-600">{globalStats.onTimeRate}%</span>
              <span className="text-xs text-muted-foreground">em dia</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {globalStats.onTrack} no prazo • {globalStats.delayed} em atraso
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Progresso Médio</span>
              <TrendingUp className="w-4 h-4 text-violet-500" />
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-foreground">{globalStats.globalProgress}%</span>
              <span className="text-xs text-muted-foreground">{globalStats.totalActions} ações cadastradas</span>
            </div>
            <Progress value={globalStats.globalProgress} className="h-1.5 mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="pdis" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="pdis" className="flex items-center gap-2 text-xs sm:text-sm">
            <Target className="w-4 h-4" /> Planos Individuais ({filteredPdis.length})
          </TabsTrigger>
          <TabsTrigger value="biblioteca" className="flex items-center gap-2 text-xs sm:text-sm">
            <BookOpen className="w-4 h-4" /> Biblioteca de Trilhas 70:20:10
          </TabsTrigger>
          <TabsTrigger value="carreira" className="flex items-center gap-2 text-xs sm:text-sm">
            <Award className="w-4 h-4" /> Matriz de Evolução de Carreira
          </TabsTrigger>
        </TabsList>

        {/* ═══ ABA 1: PLANOS INDIVIDUAIS ═══ */}
        <TabsContent value="pdis" className="space-y-4">
          {/* Filtros de Busca e Status */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/50 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar colaborador..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="delayed">Com Atrasos</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredPdis.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Target className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-lg text-foreground">Nenhum PDI encontrado</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                Não há planos de desenvolvimento correspondentes aos filtros selecionados. Clique em "Novo PDI" para iniciar o desenvolvimento de um colaborador.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="mt-4" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Iniciar Primeiro PDI
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPdis.map(pdi => {
                const isExpanded = expanded === pdi.id;
                const pdiActions = actions[pdi.id] || [];
                const pdiCheckins = checkins[pdi.id] || [];
                const progress = getPdiProgress(pdi.id);
                const balance = getPdiBalance(pdiActions);
                const func = funcionarios.find(f => f.nome.toLowerCase() === pdi.employee_name.toLowerCase());

                return (
                  <Card key={pdi.id} className="overflow-hidden border border-border/70 shadow-sm transition-all hover:border-primary/40">
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card">
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                          {pdi.employee_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-base text-foreground truncate">{pdi.employee_name}</h3>
                            {func?.departamento && (
                              <Badge variant="outline" className="text-[10px] bg-muted/40 font-normal">
                                🏢 {func.departamento}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px]">
                              {cycleName(pdi.cycle_id)}
                            </Badge>
                            {pdi.status === 'completed' ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                                Concluído
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">
                                Em Andamento
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {func?.cargo || 'Colaborador'} • {pdiActions.length} ações planejadas • {pdiCheckins.length} check-ins realizados
                          </p>
                        </div>
                      </div>

                      {/* Progresso e Equilíbrio */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:w-96">
                        <div className="flex-1 min-w-[140px]">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground font-medium">Progresso Geral</span>
                            <span className="font-bold text-foreground">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {balance.total > 0 && (
                          <div className="w-32 hidden sm:block">
                            <div className="flex h-2 rounded-full overflow-hidden bg-muted" title={`70% Prática: ${balance.p70}%, 20% Social: ${balance.p20}%, 10% Formal: ${balance.p10}%`}>
                              <div style={{ width: `${balance.p70}%` }} className="bg-blue-500" />
                              <div style={{ width: `${balance.p20}%` }} className="bg-purple-500" />
                              <div style={{ width: `${balance.p10}%` }} className="bg-amber-500" />
                            </div>
                            <p className="text-[9px] text-muted-foreground mt-1 text-center font-medium">
                              {balance.p70}% Prática ({balance.total} ações)
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 shrink-0 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPrintPdi(pdi)}
                            title="Exportar / Imprimir Ficha Executiva do PDI"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExpanded(isExpanded ? null : pdi.id)}
                            className="h-8 text-xs gap-1"
                          >
                            {isExpanded ? 'Ocultar' : 'Gerenciar'}
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Detalhes Expandidos */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-border/50 bg-muted/20 p-4 sm:p-6 space-y-6"
                        >
                          {/* Ações Rápidas do Gestor */}
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-background p-3 rounded-lg border border-border/40">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActionDialogPdiId(pdi.id);
                                  setActionTab('templates');
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar Meta / Ação
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCheckinDialogPdiId(pdi.id)}
                                className="text-xs h-8"
                              >
                                <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-primary" /> Registrar Check-in 1:1
                              </Button>
                            </div>

                            <div className="flex items-center gap-2">
                              {pdi.status !== 'completed' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updatePdiStatus(pdi.id, 'completed')}
                                  className="text-xs h-8 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Concluir Plano
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updatePdiStatus(pdi.id, 'in_progress')}
                                  className="text-xs h-8"
                                >
                                  Reabrir PDI
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Lista de Ações 70:20:10 */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 text-primary" /> Plano de Ação 70:20:10 ({pdiActions.length})
                              </h4>
                              {balance.total > 0 && !balance.isHealthy && (
                                <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50 gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Atenção: Adicione mais ações práticas (70%)
                                </Badge>
                              )}
                            </div>

                            {pdiActions.length === 0 ? (
                              <div className="bg-background p-6 rounded-lg text-center border border-dashed text-muted-foreground text-xs">
                                Nenhuma ação cadastrada para este plano. Clique em "Adicionar Meta / Ação" para estruturar o desenvolvimento.
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {pdiActions.map(action => {
                                  const meta = parseActionMeta(action.description);
                                  const catConfig = categoryLabels[meta.category as keyof typeof categoryLabels] || categoryLabels['70_experience'];
                                  const deadlineInfo = getDeadlineStatus(action.deadline, action.status);
                                  const comp = compName(action.competency_id);

                                  return (
                                    <div key={action.id} className="bg-background rounded-lg p-3.5 border border-border/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Badge variant="outline" className={`text-[10px] font-semibold ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${catConfig.dot} mr-1`} />
                                            {catConfig.label}
                                          </Badge>
                                          {comp && (
                                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                              Competência: {comp}
                                            </Badge>
                                          )}
                                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${deadlineInfo.color}`}>
                                            {action.deadline ? `Prazo: ${new Date(action.deadline).toLocaleDateString('pt-BR')} • ${deadlineInfo.label}` : 'Sem prazo'}
                                          </span>
                                        </div>

                                        <p className="font-semibold text-sm text-foreground leading-snug">{action.title}</p>
                                        {meta.text && (
                                          <p className="text-xs text-muted-foreground line-clamp-2">{meta.text}</p>
                                        )}
                                      </div>

                                      {/* Quick Progress Selector */}
                                      <div className="flex items-center gap-3 shrink-0">
                                        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                                          {[0, 50, 100].map(step => (
                                            <button
                                              key={step}
                                              onClick={() => updateActionProgress(action.id, step)}
                                              className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                                                action.progress === step
                                                  ? step === 100 ? 'bg-emerald-600 text-white' : 'bg-primary text-white shadow-xs'
                                                  : 'text-muted-foreground hover:text-foreground hover:bg-background'
                                              }`}
                                            >
                                              {step}%
                                            </button>
                                          ))}
                                        </div>

                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => deleteAction(action.id)}
                                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Histórico de Check-ins 1:1 */}
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-primary" /> Histórico de Check-ins 1:1 ({pdiCheckins.length})
                              </h4>
                            </div>

                            {pdiCheckins.length === 0 ? (
                              <div className="bg-background p-4 rounded-lg text-center border border-border/30 text-muted-foreground text-xs">
                                Nenhum check-in registrado ainda. Recomenda-se realizar acompanhamentos quinzenais ou mensais.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {pdiCheckins.map(chk => (
                                  <div key={chk.id} className="bg-background p-3.5 rounded-lg border border-border/50 text-xs space-y-1.5">
                                    <div className="flex items-center justify-between text-muted-foreground font-semibold">
                                      <span>Data: {new Date(chk.date).toLocaleDateString('pt-BR')}</span>
                                      <Badge variant="outline" className="text-[10px]">Acompanhamento 1:1</Badge>
                                    </div>
                                    <p className="text-foreground text-xs leading-relaxed"><strong className="text-muted-foreground">Resumo:</strong> {chk.notes}</p>
                                    {chk.next_steps && (
                                      <p className="text-primary text-xs pt-1 border-t border-border/30">
                                        <strong>Próximos Passos:</strong> {chk.next_steps}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ ABA 2: BIBLIOTECA DE TRILHAS 70:20:10 ═══ */}
        <TabsContent value="biblioteca" className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Biblioteca Corporativa de Trilhas & Competências
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Utilize as ações recomendadas abaixo para acelerar o preenchimento de PDIs estruturados para sua equipe.
              </p>
            </div>
            <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1">
              Padrão CCL / Morgan McCall
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PDI_COMPETENCY_TRACKS.map(track => (
              <Card key={track.id} className="border border-border/70 shadow-sm flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" /> {track.name}
                  </CardTitle>
                  <CardDescription className="text-xs">{track.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <div className="space-y-2">
                    {track.actions.map((act, i) => {
                      const catConfig = categoryLabels[act.category];
                      return (
                        <div key={i} className="bg-muted/30 p-2.5 rounded-lg border border-border/40 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={`text-[9px] ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}>
                              {catConfig.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">Prazo sugerido: {act.suggestedDays} dias</span>
                          </div>
                          <p className="font-semibold text-foreground">{act.title}</p>
                          <p className="text-[11px] text-muted-foreground">{act.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ ABA 3: MATRIZ DE CARREIRA & SUCESSÃO ═══ */}
        <TabsContent value="carreira" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Trilha de Carreira Operacional
              </CardTitle>
              <CardDescription>
                Critérios e requisitos formais para evolução hierárquica e planos de sucessão.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {careerLevels.map((lvl, i) => (
                  <div key={lvl.cargo} className="relative p-4 rounded-xl border border-border/60 bg-card shadow-sm flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                          Nível {i + 1}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{lvl.tempoMedio}</span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground">{lvl.cargo}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{lvl.requisito}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-primary font-medium">
                      <span>Prontidão via PDI</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ MODAL: ADICIONAR META / AÇÃO ═══ */}
      <Dialog open={!!actionDialogPdiId} onOpenChange={open => !open && setActionDialogPdiId(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Adicionar Meta ao PDI (70:20:10)
            </DialogTitle>
            <DialogDescription>
              Escolha uma ação recomendada da biblioteca ou crie uma meta personalizada no formato S.M.A.R.T.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={actionTab} onValueChange={v => setActionTab(v as 'templates' | 'custom')} className="mt-2">
            <TabsList className="w-full grid grid-cols-2 bg-muted/60">
              <TabsTrigger value="templates" className="text-xs">
                ✨ Sugestões da Biblioteca (1 Clique)
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs">
                ✍️ Ação Personalizada
              </TabsTrigger>
            </TabsList>

            {/* Sub-Aba: Sugestões */}
            <TabsContent value="templates" className="space-y-3 pt-3">
              <div>
                <Label className="text-xs">Selecione a Trilha de Competência:</Label>
                <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                  <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PDI_COMPETENCY_TRACKS.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {PDI_COMPETENCY_TRACKS.find(t => t.id === selectedTrack)?.actions.map((sug, i) => {
                  const catConfig = categoryLabels[sug.category];
                  return (
                    <div key={i} className="p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <Badge variant="outline" className={`text-[9px] ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}>
                          {catConfig.label}
                        </Badge>
                        <p className="font-semibold text-xs text-foreground">{sug.title}</p>
                        <p className="text-[11px] text-muted-foreground">{sug.description}</p>
                      </div>
                      <Button size="sm" onClick={() => applyTemplateAction(sug)} className="shrink-0 h-8 text-xs">
                        Aplicar
                      </Button>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Sub-Aba: Personalizada */}
            <TabsContent value="custom" className="space-y-4 pt-3">
              <div>
                <Label>Pilar Metodológico (70:20:10)</Label>
                <Select value={actionForm.category} onValueChange={v => setActionForm({ ...actionForm, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="70_experience">70% Prática & Projetos (On-the-job, Desafios Reais)</SelectItem>
                    <SelectItem value="20_exposure">20% Exposição & Mentoria (Shadowing, Feedback 1:1)</SelectItem>
                    <SelectItem value="10_education">10% Educação Formal (Cursos, NRs, Certificações)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>O que será feito? (Objetivo S.M.A.R.T)</Label>
                <FastInput
                  value={actionForm.title}
                  onValueChange={v => setActionForm({ ...actionForm, title: v })}
                  placeholder="Ex: Conduzir 8 reuniões de DDS em campo..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Como será medido e entregue?</Label>
                <FastTextarea
                  value={actionForm.description}
                  onValueChange={v => setActionForm({ ...actionForm, description: v })}
                  placeholder="Descreva as etapas, entregáveis e critérios de sucesso..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prazo Limite</Label>
                  <Input
                    type="date"
                    value={actionForm.deadline}
                    onChange={e => setActionForm({ ...actionForm, deadline: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Competência Foco</Label>
                  <Select value={actionForm.competency_id} onValueChange={v => setActionForm({ ...actionForm, competency_id: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Opcional..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma / Geral</SelectItem>
                      {competencies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={createAction} className="w-full mt-2">Salvar Meta no PDI</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: REGISTRAR CHECK-IN 1:1 ═══ */}
      <Dialog open={!!checkinDialogPdiId} onOpenChange={open => !open && setCheckinDialogPdiId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Registrar Check-in 1:1
            </DialogTitle>
            <DialogDescription>
              Acompanhamento de alinhamento, feedbacks e desbloqueio de obstáculos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data do Check-in</Label>
                <Input
                  type="date"
                  value={checkinForm.date}
                  onChange={e => setCheckinForm({ ...checkinForm, date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Saúde do Plano</Label>
                <Select value={checkinForm.status} onValueChange={v => setCheckinForm({ ...checkinForm, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_track">🟢 No Prazo (On Track)</SelectItem>
                    <SelectItem value="attention">🟡 Em Atenção</SelectItem>
                    <SelectItem value="critical">🔴 Crítico / Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Resumo dos Pontos Discutidos</Label>
              <FastTextarea
                value={checkinForm.notes}
                onValueChange={v => setCheckinForm({ ...checkinForm, notes: v })}
                placeholder="Discutido avanço das metas, principais aprendizados e suporte necessário..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Próximos Passos & Compromissos</Label>
              <FastInput
                value={checkinForm.next_steps}
                onValueChange={v => setCheckinForm({ ...checkinForm, next_steps: v })}
                placeholder="Ex: Concluir módulo 2 até sexta-feira..."
                className="mt-1"
              />
            </div>

            <Button onClick={() => checkinDialogPdiId && createCheckin(checkinDialogPdiId)} className="w-full mt-2">
              Salvar Registro de Check-in
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: FICHA EXECUTIVA DO PDI (PRINT READY) ═══ */}
      <Dialog open={!!printPdi} onOpenChange={open => !open && setPrintPdi(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8">
          {printPdi && (() => {
            const pdiActions = actions[printPdi.id] || [];
            const pdiCheckins = checkins[printPdi.id] || [];
            const progress = getPdiProgress(printPdi.id);
            const balance = getPdiBalance(pdiActions);
            const func = funcionarios.find(f => f.nome.toLowerCase() === printPdi.employee_name.toLowerCase());

            return (
              <div className="space-y-6 text-foreground print:text-black">
                {/* Header Timbrado */}
                <div className="border-b-2 border-primary pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-primary">GRUPO BUSATO</h2>
                    <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Plano de Desenvolvimento Individual (PDI 70:20:10)</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p><strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                    <p><strong>Status:</strong> {printPdi.status === 'completed' ? 'Concluído' : 'Em Andamento'}</p>
                  </div>
                </div>

                {/* Dados do Colaborador */}
                <div className="grid grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg text-xs">
                  <div>
                    <span className="text-muted-foreground block font-medium">Colaborador:</span>
                    <strong className="text-sm">{printPdi.employee_name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Cargo / Função:</span>
                    <strong>{func?.cargo || 'Colaborador'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Departamento:</span>
                    <strong>{func?.departamento || userDepartment || 'Operacional'}</strong>
                  </div>
                </div>

                {/* Progresso e Equilíbrio Metodológico */}
                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg text-xs">
                  <div>
                    <span className="text-muted-foreground block font-medium mb-1">Avanço Global do Plano:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-3 flex-1" />
                      <strong className="text-sm">{progress}%</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium mb-1">Distribuição Metodológica:</span>
                    <span className="font-semibold text-blue-600">{balance.p70}% Prática (70%)</span> •{' '}
                    <span className="font-semibold text-purple-600">{balance.p20}% Social (20%)</span> •{' '}
                    <span className="font-semibold text-amber-600">{balance.p10}% Formal (10%)</span>
                  </div>
                </div>

                {/* Tabela de Ações */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Metas & Ações Estruturadas</h4>
                  <table className="w-full text-left text-xs border border-border/50 rounded-lg overflow-hidden">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-2.5 border-b">Pilar</th>
                        <th className="p-2.5 border-b">Ação / Meta S.M.A.R.T</th>
                        <th className="p-2.5 border-b">Prazo</th>
                        <th className="p-2.5 border-b text-right">Progresso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pdiActions.map((act, idx) => {
                        const meta = parseActionMeta(act.description);
                        const cat = categoryLabels[meta.category as keyof typeof categoryLabels] || categoryLabels['70_experience'];
                        return (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="p-2.5 font-semibold text-[11px] whitespace-nowrap">{cat.tag}</td>
                            <td className="p-2.5">
                              <p className="font-semibold">{act.title}</p>
                              {meta.text && <p className="text-[10px] text-muted-foreground">{meta.text}</p>}
                            </td>
                            <td className="p-2.5 whitespace-nowrap">{act.deadline ? new Date(act.deadline).toLocaleDateString('pt-BR') : '-'}</td>
                            <td className="p-2.5 text-right font-bold">{act.progress}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Histórico de Check-ins */}
                {pdiCheckins.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registros de Check-in 1:1</h4>
                    <div className="space-y-2">
                      {pdiCheckins.map((chk, i) => (
                        <div key={i} className="border p-2.5 rounded-lg text-xs">
                          <p className="font-semibold text-muted-foreground mb-0.5">Data: {new Date(chk.date).toLocaleDateString('pt-BR')}</p>
                          <p className="text-foreground">{chk.notes}</p>
                          {chk.next_steps && <p className="text-primary text-[11px] mt-1">Próximos passos: {chk.next_steps}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assinaturas */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t">
                  <div className="text-center">
                    <div className="border-t border-muted-foreground/50 pt-2 text-xs font-semibold">
                      Assinatura do Colaborador
                    </div>
                    <p className="text-[10px] text-muted-foreground">{printPdi.employee_name}</p>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-muted-foreground/50 pt-2 text-xs font-semibold">
                      Assinatura do Gestor / RH
                    </div>
                    <p className="text-[10px] text-muted-foreground">Liderança Responsável</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setPrintPdi(null)}>Fechar</Button>
                  <Button onClick={() => window.print()} className="bg-primary text-primary-foreground gap-2">
                    <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
