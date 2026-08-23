import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, CheckCircle2, Clock, PlayCircle, Trash2, CalendarIcon,
  TrendingUp, ChevronDown, ChevronUp, MessageSquare, Sparkles, BookOpen,
  Award, ArrowRight, BarChart2, AlertTriangle, Check, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { FastInput } from '@/components/ui/fast-input';
import { FastTextarea } from '@/components/ui/fast-textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PDI_COMPETENCY_TRACKS, PdiActionSuggestion } from '@/lib/pdiTemplates';

interface PDI { id: string; cycle_id: string; employee_name: string; status: string; created_at: string; }
interface PDIAction { id: string; pdi_id: string; competency_id: string | null; title: string; description: string | null; deadline: string | null; status: string; progress: number; }
interface PDICheckin { id: string; pdi_id: string; date: string; notes: string; next_steps: string; created_at: string; }
interface Cycle { id: string; name: string; }

const statusIcons: Record<string, typeof CheckCircle2> = { pending: Clock, in_progress: PlayCircle, completed: CheckCircle2 };
const statusLabels: Record<string, string> = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluído' };
const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
};

const categoryLabels: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  '70_experience': { label: '70% Prática', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  '20_exposure':   { label: '20% Social',   color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  '10_education':  { label: '10% Formação', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
};

const parseActionMeta = (desc: string | null) => {
  if (!desc) return { text: '', category: '70_experience' };
  try {
    const parsed = JSON.parse(desc);
    if (parsed.category) return parsed;
    return { text: desc, category: '70_experience' };
  } catch { return { text: desc, category: '70_experience' }; }
};

const getDeadlineStatus = (deadline: string | null, status: string) => {
  if (status === 'completed') return { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
  if (!deadline) return { label: 'Sem prazo', color: 'bg-muted text-muted-foreground' };
  const target = new Date(deadline);
  const now = new Date(); now.setHours(0,0,0,0); target.setHours(0,0,0,0);
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000*60*60*24));
  if (diffDays < 0) return { label: `Atrasado (${Math.abs(diffDays)}d)`, color: 'bg-red-100 text-red-700 border-red-300' };
  if (diffDays === 0) return { label: 'Vence hoje', color: 'bg-amber-100 text-amber-700 border-amber-300' };
  if (diffDays <= 7) return { label: `${diffDays}d restantes`, color: 'bg-amber-50 text-amber-600 border-amber-200' };
  return { label: `${diffDays}d restantes`, color: 'bg-slate-100 text-slate-600 border-slate-200' };
};

interface Props { employeeName: string; employeeId: string; }

export default function PDIProfileTab({ employeeName }: Props) {
  const { toast } = useToast();
  const [pdis, setPdis] = useState<PDI[]>([]);
  const [actions, setActions] = useState<Record<string, PDIAction[]>>({});
  const [checkins, setCheckins] = useState<Record<string, PDICheckin[]>>({});
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Dialogs
  const [newPdiOpen, setNewPdiOpen] = useState(false);
  const [editPdiOpen, setEditPdiOpen] = useState(false);
  const [editingPdi, setEditingPdi] = useState<PDI | null>(null);
  const [deletePdiId, setDeletePdiId] = useState<string | null>(null);
  const [actionDialogPdiId, setActionDialogPdiId] = useState<string | null>(null);
  const [checkinDialogPdiId, setCheckinDialogPdiId] = useState<string | null>(null);
  const [actionTab, setActionTab] = useState<'templates' | 'custom'>('templates');
  const [selectedTrack, setSelectedTrack] = useState('lideranca_operacional');

  // Forms
  const [pdiForm, setPdiForm] = useState({ cycle_id: '', status: 'in_progress' });
  const [editPdiForm, setEditPdiForm] = useState({ cycle_id: '', status: 'in_progress' });
  const [actionForm, setActionForm] = useState({ title: '', description: '', deadline: '', category: '70_experience' });
  const [checkinForm, setCheckinForm] = useState({ date: new Date().toISOString().split('T')[0], notes: '', next_steps: '', status: 'on_track' });

  const fetchAll = async () => {
    const [{ data: pdiData }, { data: cycleData }] = await Promise.all([
      supabase.from('pdis').select('*').ilike('employee_name', employeeName).order('created_at', { ascending: false }),
      supabase.from('evaluation_cycles').select('id, name'),
    ]);
    const pdiList = (pdiData || []) as PDI[];
    setPdis(pdiList);
    if (cycleData) setCycles(cycleData as Cycle[]);

    const ids = pdiList.map(p => p.id);
    if (ids.length > 0) {
      const [{ data: actData }, { data: chkData }] = await Promise.all([
        supabase.from('pdi_actions').select('*').in('pdi_id', ids),
        supabase.from('pdi_checkins').select('*').in('pdi_id', ids).order('date', { ascending: false }),
      ]);
      const groupedAct: Record<string, PDIAction[]> = {};
      (actData || []).forEach((a: PDIAction) => { if (!groupedAct[a.pdi_id]) groupedAct[a.pdi_id] = []; groupedAct[a.pdi_id].push(a); });
      setActions(groupedAct);
      const groupedChk: Record<string, PDICheckin[]> = {};
      (chkData || []).forEach((c: PDICheckin) => { if (!groupedChk[c.pdi_id]) groupedChk[c.pdi_id] = []; groupedChk[c.pdi_id].push(c); });
      setCheckins(groupedChk);
    } else {
      setActions({}); setCheckins({});
    }
    setLoading(false);
  };

  useEffect(() => { setLoading(true); fetchAll(); }, [employeeName]);

  const getPdiProgress = (pdiId: string) => {
    const a = actions[pdiId] || [];
    return a.length === 0 ? 0 : Math.round(a.reduce((acc, x) => acc + x.progress, 0) / a.length);
  };

  const summaryStats = useMemo(() => {
    const allActs = Object.values(actions).flat();
    const completed = allActs.filter(a => a.status === 'completed').length;
    const total = allActs.length;
    const now = new Date(); now.setHours(0,0,0,0);
    const delayed = allActs.filter(a => a.status !== 'completed' && a.deadline && new Date(a.deadline) < now).length;
    const globalProgress = total > 0 ? Math.round(allActs.reduce((acc, a) => acc + a.progress, 0) / total) : 0;
    return { total: pdis.length, active: pdis.filter(p => p.status === 'in_progress').length, completed: pdis.filter(p => p.status === 'completed').length, globalProgress, actionsTotal: total, actionsCompleted: completed, delayed };
  }, [pdis, actions]);

  async function createPDI() {
    if (!pdiForm.cycle_id) { toast({ title: 'Selecione um ciclo', variant: 'destructive' }); return; }
    const { error } = await supabase.from('pdis').insert([{ cycle_id: pdiForm.cycle_id, employee_name: employeeName, status: pdiForm.status }]);
    if (error) { toast({ title: 'Erro ao criar PDI', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'PDI criado com sucesso!' });
    setNewPdiOpen(false);
    setPdiForm({ cycle_id: '', status: 'in_progress' });
    fetchAll();
  }

  function openEditPdi(pdi: PDI) {
    setEditingPdi(pdi);
    setEditPdiForm({ cycle_id: pdi.cycle_id, status: pdi.status });
    setEditPdiOpen(true);
  }

  async function saveEditPdi() {
    if (!editingPdi || !editPdiForm.cycle_id) { toast({ title: 'Selecione um ciclo', variant: 'destructive' }); return; }
    const { error } = await supabase.from('pdis').update({ cycle_id: editPdiForm.cycle_id, status: editPdiForm.status }).eq('id', editingPdi.id);
    if (error) { toast({ title: 'Erro ao editar PDI', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'PDI atualizado com sucesso!' });
    setEditPdiOpen(false);
    setEditingPdi(null);
    fetchAll();
  }

  async function confirmDeletePdi() {
    if (!deletePdiId) return;
    await Promise.all([
      supabase.from('pdi_actions').delete().eq('pdi_id', deletePdiId),
      supabase.from('pdi_checkins').delete().eq('pdi_id', deletePdiId),
    ]);
    const { error } = await supabase.from('pdis').delete().eq('id', deletePdiId);
    if (error) { toast({ title: 'Erro ao excluir PDI', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'PDI excluído com sucesso!' });
    setDeletePdiId(null);
    fetchAll();
  }

  async function createAction() {
    if (!actionDialogPdiId || !actionForm.title) { toast({ title: 'Informe o título', variant: 'destructive' }); return; }
    const desc = JSON.stringify({ text: actionForm.description, category: actionForm.category });
    const { error } = await supabase.from('pdi_actions').insert([{ pdi_id: actionDialogPdiId, title: actionForm.title, description: desc, deadline: actionForm.deadline || null, status: 'pending', progress: 0 }]);
    if (error) { toast({ title: 'Erro ao adicionar ação', variant: 'destructive' }); return; }
    toast({ title: 'Ação adicionada!' });
    setActionDialogPdiId(null);
    setActionForm({ title: '', description: '', deadline: '', category: '70_experience' });
    fetchAll();
  }

  async function createCheckin(pdiId: string) {
    if (!checkinForm.date || !checkinForm.notes) { toast({ title: 'Data e resumo são obrigatórios', variant: 'destructive' }); return; }
    const { error } = await supabase.from('pdi_checkins').insert([{ pdi_id: pdiId, date: checkinForm.date, notes: `[Saúde: ${checkinForm.status}] ${checkinForm.notes}`, next_steps: checkinForm.next_steps }]);
    if (error) { toast({ title: 'Erro ao salvar check-in', variant: 'destructive' }); return; }
    toast({ title: 'Check-in registrado!' });
    setCheckinDialogPdiId(null);
    setCheckinForm({ date: new Date().toISOString().split('T')[0], notes: '', next_steps: '', status: 'on_track' });
    fetchAll();
  }

  async function updateActionProgress(actionId: string, progress: number) {
    const newStatus = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';
    await supabase.from('pdi_actions').update({ progress: Math.min(100, Math.max(0, progress)), status: newStatus }).eq('id', actionId);
    fetchAll();
  }

  async function deleteAction(actionId: string) {
    await supabase.from('pdi_actions').delete().eq('id', actionId);
    toast({ title: 'Ação removida' });
    fetchAll();
  }

  async function updatePdiStatus(pdiId: string, newStatus: string) {
    await supabase.from('pdis').update({ status: newStatus }).eq('id', pdiId);
    toast({ title: `Status atualizado` });
    fetchAll();
  }

  const applyTemplate = (s: PdiActionSuggestion) => {
    const d = new Date(); d.setDate(d.getDate() + s.suggestedDays);
    setActionForm({ title: s.title, description: s.description, deadline: d.toISOString().split('T')[0], category: s.category });
    setActionTab('custom');
  };

  const cycleName = (id: string) => cycles.find(c => c.id === id)?.name || 'Ciclo';

  const checkinHealthIcon = (notes: string) => {
    if (notes.includes('on_track')) return <span className="inline-flex items-center gap-1 text-emerald-600 text-xs"><Check className="w-3 h-3" />No prazo</span>;
    if (notes.includes('at_risk')) return <span className="inline-flex items-center gap-1 text-amber-600 text-xs"><AlertTriangle className="w-3 h-3" />Em risco</span>;
    if (notes.includes('off_track')) return <span className="inline-flex items-center gap-1 text-red-600 text-xs"><AlertTriangle className="w-3 h-3" />Atrasado</span>;
    return null;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'PDIs Ativos', value: summaryStats.active, icon: Target, color: 'text-blue-600', bg: 'bg-blue-500/10' },
          { label: 'PDIs Concluídos', value: summaryStats.completed, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
          { label: 'Progresso Geral', value: `${summaryStats.globalProgress}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
          { label: 'Ações Atrasadas', value: summaryStats.delayed, icon: AlertTriangle, color: summaryStats.delayed > 0 ? 'text-red-600' : 'text-emerald-600', bg: summaryStats.delayed > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="kpi-card p-4 rounded-xl flex items-center gap-3">
            <div className={`${bg} p-2.5 rounded-lg`}><Icon className={`w-5 h-5 ${color}`} /></div>
            <div>
              <p className="text-2xl font-black text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Evolução de Progresso */}
      {pdis.length > 0 && (
        <div className="kpi-card p-4 rounded-xl">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2"><BarChart2 className="w-4 h-4" /> Evolução de Progresso por PDI</h4>
          <div className="space-y-3">
            {pdis.map(pdi => {
              const prog = getPdiProgress(pdi.id);
              const StatusIcon = statusIcons[pdi.status] || Clock;
              return (
                <div key={pdi.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <StatusIcon className="w-3 h-3 text-muted-foreground" />
                      {cycleName(pdi.cycle_id)}
                      <span className="text-muted-foreground">· {new Date(pdi.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                    </span>
                    <span className="font-bold text-foreground">{prog}%</span>
                  </div>
                  <Progress value={prog} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botão Novo PDI */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Planos de Desenvolvimento</h3>
        <Button onClick={() => setNewPdiOpen(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo PDI
        </Button>
      </div>

      {/* Lista de PDIs */}
      {pdis.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-muted/20">
          <Target className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-base font-semibold text-muted-foreground">Nenhum PDI cadastrado</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Clique em "Novo PDI" para iniciar o desenvolvimento</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pdis.map(pdi => {
            const pdiActions = actions[pdi.id] || [];
            const pdiCheckins = checkins[pdi.id] || [];
            const progress = getPdiProgress(pdi.id);
            const isExpanded = expanded === pdi.id;
            const StatusIcon = statusIcons[pdi.status] || Clock;
            const completedCount = pdiActions.filter(a => a.status === 'completed').length;
            const now = new Date(); now.setHours(0,0,0,0);
            const delayedCount = pdiActions.filter(a => a.status !== 'completed' && a.deadline && new Date(a.deadline) < now).length;

            // 70/20/10 balance
            const total = pdiActions.length;
            const catCounts = { '70_experience': 0, '20_exposure': 0, '10_education': 0 };
            pdiActions.forEach(a => { const m = parseActionMeta(a.description); if (m.category in catCounts) (catCounts as Record<string,number>)[m.category]++; });

            return (
              <motion.div key={pdi.id} layout className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
                {/* Card Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-muted/40 transition-colors flex items-center justify-between gap-4"
                  onClick={() => setExpanded(isExpanded ? null : pdi.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${statusColors[pdi.status]?.split(' ').slice(2).join(' ') || 'bg-muted'}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-sm">{cycleName(pdi.cycle_id)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(pdi.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-emerald-600 font-bold">{completedCount}</span>/{total} ações
                      {delayedCount > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{delayedCount} atrasada{delayedCount > 1 ? 's' : ''}</Badge>}
                    </div>
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <Progress value={progress} className="h-1.5 w-16" />
                      <span className="text-xs font-bold text-foreground">{progress}%</span>
                    </div>
                    <Badge className={`text-[10px] border ${statusColors[pdi.status] || ''}`}>{statusLabels[pdi.status]}</Badge>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-4 space-y-5">
                        {/* 70/20/10 Balance */}
                        {total > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Distribuição 70/20/10</p>
                            <div className="flex gap-2 flex-wrap">
                              {Object.entries(catCounts).map(([cat, count]) => {
                                const cl = categoryLabels[cat];
                                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                return (
                                  <div key={cat} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${cl.bg} ${cl.color}`}>
                                    <div className={`w-2 h-2 rounded-full ${cl.dot}`} />
                                    {cl.label}: <span className="font-bold">{pct}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Ações */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações de Desenvolvimento</p>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setActionDialogPdiId(pdi.id)}>
                              <Plus className="w-3 h-3" /> Adicionar Ação
                            </Button>
                          </div>
                          {pdiActions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ação cadastrada ainda.</p>
                          ) : (
                            <div className="space-y-2">
                              {pdiActions.map(action => {
                                const meta = parseActionMeta(action.description);
                                const cl = categoryLabels[meta.category] || categoryLabels['70_experience'];
                                const deadline = getDeadlineStatus(action.deadline, action.status);
                                const StatusIcon2 = statusIcons[action.status] || Clock;
                                return (
                                  <div key={action.id} className={`p-3 rounded-xl border ${cl.bg} space-y-2`}>
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-start gap-2">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cl.dot}`} />
                                        <div>
                                          <p className="text-sm font-semibold text-foreground">{action.title}</p>
                                          {meta.text && <p className="text-xs text-muted-foreground mt-0.5">{meta.text}</p>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <Badge className={`text-[10px] border ${deadline.color}`}>{deadline.label}</Badge>
                                        <button onClick={() => deleteAction(action.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Progress value={action.progress} className="h-1.5 flex-1" />
                                      <span className="text-xs font-bold text-foreground w-8 text-right">{action.progress}%</span>
                                      <div className="flex gap-1">
                                        {[0, 25, 50, 75, 100].map(v => (
                                          <button key={v} onClick={() => updateActionProgress(action.id, v)} className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${action.progress === v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-primary/20 text-muted-foreground'}`}>{v}%</button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <StatusIcon2 className="w-3 h-3" />
                                      <span className={cl.color + ' font-medium'}>{cl.label}</span>
                                      {action.deadline && <span>· Prazo: {new Date(action.deadline).toLocaleDateString('pt-BR')}</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Check-ins Timeline */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" /> Histórico de Check-ins
                            </p>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setCheckinDialogPdiId(pdi.id)}>
                              <Plus className="w-3 h-3" /> Novo Check-in
                            </Button>
                          </div>
                          {pdiCheckins.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-3">Nenhum check-in registrado.</p>
                          ) : (
                            <div className="relative pl-4 border-l-2 border-border space-y-3">
                              {pdiCheckins.slice(0, 5).map((chk, i) => (
                                <div key={chk.id} className={`relative ${i === 0 ? 'opacity-100' : 'opacity-70'}`}>
                                  <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-primary border-2 border-background" />
                                  <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-foreground">{new Date(chk.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                      {checkinHealthIcon(chk.notes)}
                                    </div>
                                    <p className="text-xs text-foreground">{chk.notes.replace(/\[Saúde: \w+\] /, '')}</p>
                                    {chk.next_steps && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowRight className="w-3 h-3" /> {chk.next_steps}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {pdiCheckins.length > 5 && (
                                <p className="text-xs text-muted-foreground pl-1">+ {pdiCheckins.length - 5} check-ins anteriores</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setCheckinDialogPdiId(pdi.id)}>
                            <MessageSquare className="w-3.5 h-3.5" /> Novo Check-in
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs text-blue-600 border-blue-300 hover:bg-blue-50" onClick={() => openEditPdi(pdi)}>
                            <Pencil className="w-3.5 h-3.5" /> Editar PDI
                          </Button>
                          {pdi.status !== 'completed' ? (
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => updatePdiStatus(pdi.id, 'completed')}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Concluir PDI
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => updatePdiStatus(pdi.id, 'in_progress')}>
                              <PlayCircle className="w-3.5 h-3.5" /> Reabrir
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-600 border-red-300 hover:bg-red-50 ml-auto" onClick={() => setDeletePdiId(pdi.id)}>
                            <Trash2 className="w-3.5 h-3.5" /> Excluir PDI
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dialog Novo PDI */}
      <Dialog open={newPdiOpen} onOpenChange={setNewPdiOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Novo PDI para {employeeName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Ciclo de Avaliação</Label>
              <Select value={pdiForm.cycle_id} onValueChange={v => setPdiForm(p => ({ ...p, cycle_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o ciclo..." /></SelectTrigger>
                <SelectContent>
                  {cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  {cycles.length === 0 && <SelectItem value="_none" disabled>Nenhum ciclo cadastrado</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setNewPdiOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={createPDI}>Criar PDI</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nova Ação */}
      <Dialog open={!!actionDialogPdiId} onOpenChange={v => !v && setActionDialogPdiId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Adicionar Ação ao PDI</DialogTitle>
          </DialogHeader>
          <Tabs value={actionTab} onValueChange={v => setActionTab(v as 'templates' | 'custom')}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="templates"><BookOpen className="w-3.5 h-3.5 mr-1.5" />Templates</TabsTrigger>
              <TabsTrigger value="custom">Personalizada</TabsTrigger>
            </TabsList>
            <TabsContent value="templates" className="space-y-3">
              <div className="space-y-1.5">
                <Label>Trilha de Competências</Label>
                <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PDI_COMPETENCY_TRACKS.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(PDI_COMPETENCY_TRACKS.find(t => t.id === selectedTrack)?.actions ?? []).map((s, i) => {
                  const cl = categoryLabels[s.category] || categoryLabels['70_experience'];
                  return (
                    <div key={i} className={`p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all ${cl.bg}`} onClick={() => applyTemplate(s)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cl.dot}`} />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{s.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <Badge className={`text-[10px] border ${cl.bg} ${cl.color}`}>{cl.label}</Badge>
                          <span className="text-[10px] text-muted-foreground">{s.suggestedDays}d</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            <TabsContent value="custom" className="space-y-3">
              <div className="space-y-1.5">
                <Label>Título da Ação *</Label>
                <FastInput value={actionForm.title} onChange={v => setActionForm(p => ({ ...p, title: v }))} placeholder="Ex: Liderar reunião de kick-off" />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <FastTextarea value={actionForm.description} onChange={v => setActionForm(p => ({ ...p, description: v }))} placeholder="Contexto e objetivos da ação..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Categoria 70/20/10</Label>
                  <Select value={actionForm.category} onValueChange={v => setActionForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="70_experience">70% Prática (On-the-Job)</SelectItem>
                      <SelectItem value="20_exposure">20% Social (Mentoria)</SelectItem>
                      <SelectItem value="10_education">10% Formação (Cursos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Prazo</Label>
                  <FastInput type="date" value={actionForm.deadline} onChange={v => setActionForm(p => ({ ...p, deadline: v }))} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setActionDialogPdiId(null)}>Cancelar</Button>
                <Button className="flex-1 gap-1.5" onClick={createAction}><Plus className="w-4 h-4" />Salvar Ação</Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog Check-in */}
      <Dialog open={!!checkinDialogPdiId} onOpenChange={v => !v && setCheckinDialogPdiId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Registrar Check-in</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <FastInput type="date" value={checkinForm.date} onChange={v => setCheckinForm(p => ({ ...p, date: v }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Saúde do PDI</Label>
                <Select value={checkinForm.status} onValueChange={v => setCheckinForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_track">✅ No prazo</SelectItem>
                    <SelectItem value="at_risk">⚠️ Em risco</SelectItem>
                    <SelectItem value="off_track">🔴 Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Resumo da conversa *</Label>
              <FastTextarea value={checkinForm.notes} onChange={v => setCheckinForm(p => ({ ...p, notes: v }))} placeholder="O que foi discutido, conquistas e dificuldades..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Próximos passos</Label>
              <FastTextarea value={checkinForm.next_steps} onChange={v => setCheckinForm(p => ({ ...p, next_steps: v }))} placeholder="Ações concretas para o próximo período..." rows={2} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setCheckinDialogPdiId(null)}>Cancelar</Button>
              <Button className="flex-1 gap-1.5" onClick={() => checkinDialogPdiId && createCheckin(checkinDialogPdiId)}>
                <CalendarIcon className="w-4 h-4" /> Salvar Check-in
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar PDI */}
      <Dialog open={editPdiOpen} onOpenChange={setEditPdiOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Pencil className="w-5 h-5" /> Editar PDI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Ciclo de Avaliação *</Label>
              <Select value={editPdiForm.cycle_id} onValueChange={v => setEditPdiForm(p => ({ ...p, cycle_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o ciclo..." /></SelectTrigger>
                <SelectContent>
                  {cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status do PDI</Label>
              <Select value={editPdiForm.status} onValueChange={v => setEditPdiForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">⏳ Pendente</SelectItem>
                  <SelectItem value="in_progress">🔵 Em andamento</SelectItem>
                  <SelectItem value="completed">✅ Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditPdiOpen(false)}>Cancelar</Button>
              <Button className="flex-1 gap-1.5" onClick={saveEditPdi}><Check className="w-4 h-4" /> Salvar Alterações</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Excluir PDI */}
      <AlertDialog open={!!deletePdiId} onOpenChange={open => !open && setDeletePdiId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Excluir este PDI?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente este Plano de Desenvolvimento, incluindo todas as suas ações e histórico de check-ins. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePdi} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Excluir PDI
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
