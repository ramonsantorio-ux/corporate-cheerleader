import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronDown, ChevronUp, CheckCircle2, Clock, PlayCircle, Trash2 } from 'lucide-react';
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
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionDialogPdiId, setActionDialogPdiId] = useState<string | null>(null);
  const [pdiForm, setPdiForm] = useState({ cycle_id: '', employee_name: '' });
  const [actionForm, setActionForm] = useState({ title: '', description: '', deadline: '', competency_id: '', category: '70_experience' });
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
      // Fetch actions for all PDIs
      const ids = (data as PDI[]).map(p => p.id);
      if (ids.length > 0) {
        const { data: actionsData } = await supabase.from('pdi_actions').select('*').in('pdi_id', ids);
        if (actionsData) {
          const grouped: Record<string, PDIAction[]> = {};
          (actionsData as PDIAction[]).forEach(a => {
            if (!grouped[a.pdi_id]) grouped[a.pdi_id] = [];
            grouped[a.pdi_id].push(a);
          });
          setActions(grouped);
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
          <h1 className="text-2xl font-bold text-foreground">PDI - Plano de Desenvolvimento</h1>
          <p className="text-muted-foreground text-sm mt-1">Ações de desenvolvimento vinculadas a competências</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Novo PDI</Button>
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

      {/* Action creation dialog */}
      <Dialog open={!!actionDialogPdiId} onOpenChange={open => !open && setActionDialogPdiId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Adicionar Ação de Desenvolvimento</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
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
            <div><Label>Título (Meta SMART)</Label><FastInput value={actionForm.title} onValueChange={v => setActionForm({ ...actionForm, title: v })} placeholder="Ex: Liderar o projeto X até o fim do mês" /></div>
            <div><Label>Descrição / Como Fazer</Label><FastTextarea value={actionForm.description} onValueChange={v => setActionForm({ ...actionForm, description: v })} placeholder="Detalhe as etapas e recursos necessários..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prazo</Label><Input type="date" value={actionForm.deadline} onChange={e => setActionForm({ ...actionForm, deadline: e.target.value })} /></div>
              <div>
                <Label>Competência Foco</Label>
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
        <div className="space-y-3">
          {pdis.map((pdi, i) => {
            const pdiActions = actions[pdi.id] || [];
            const progress = getPdiProgress(pdi.id);
            const isExpanded = expanded === pdi.id;
            return (
              <motion.div key={pdi.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl overflow-hidden"
              >
                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : pdi.id)}>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{pdi.employee_name}</h3>
                    <p className="text-sm text-muted-foreground">Ciclo: {cycleName(pdi.cycle_id)} · {pdiActions.length} ações · {pdiStatusLabels[pdi.status]}</p>
                  </div>
                  <div className="flex-1 max-w-[300px] hidden md:block">
                    {renderBalance(pdiActions)}
                  </div>
                  <div className="flex items-center gap-3 min-w-[140px] ml-4">
                    <Progress value={progress} className="h-2 flex-1" />
                    <span className="text-sm font-medium text-foreground w-10 text-right">{progress}%</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground ml-2" /> : <ChevronDown className="w-5 h-5 text-muted-foreground ml-2" />}
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                    {pdiActions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma ação adicionada.</p>
                    ) : pdiActions.map(action => {
                      const Icon = statusIcons[action.status] || Clock;
                      const meta = parseActionMeta(action.description);
                      return (
                        <div key={action.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors">
                          <Icon className={`w-5 h-5 flex-shrink-0 mt-1 md:mt-0 ${action.status === 'completed' ? 'text-green-600' : action.status === 'in_progress' ? 'text-blue-600' : 'text-yellow-600'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryColors[meta.category]}`}>{categoryLabels[meta.category]}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground">{action.title}</p>
                            {meta.text && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{meta.text}</p>}
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-2">
                              {action.competency_id && <span className="px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">Foco: {compName(action.competency_id)}</span>}
                              {action.deadline && <span className="px-2 py-1 bg-background border rounded-md">Prazo: {new Date(action.deadline).toLocaleDateString('pt-BR')}</span>}
                              <span className={`px-2 py-1 rounded-md font-medium ${statusColors[action.status]}`}>{statusLabels[action.status]}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-border/50">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground hidden md:block">Progresso:</Label>
                              <Input
                                type="number" min={0} max={100} value={action.progress}
                                onChange={e => updateActionProgress(action.id, parseInt(e.target.value) || 0)}
                                className="w-16 h-8 text-xs text-center font-semibold bg-background"
                              />
                              <span className="text-xs font-medium text-muted-foreground">%</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deleteAction(action.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <Button variant="outline" size="sm" onClick={() => setActionDialogPdiId(pdi.id)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Ação
                    </Button>
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
