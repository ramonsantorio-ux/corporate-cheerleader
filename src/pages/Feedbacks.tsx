import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, Bell, AlertCircle, ChevronDown, ChevronUp, Users, Plus, Send, X, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle, BarChart3, Target, Activity } from 'lucide-react';
import { FastInput } from '@/components/ui/fast-input';
import { FastTextarea } from '@/components/ui/fast-textarea';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import { useNavigate } from 'react-router-dom';
import FeedbackCard from '@/components/feedback/FeedbackCard';
import { Feedback, FeedbackStatus, FeedbackPriority, FeedbackSetor, statusLabels, priorityLabels, setorLabels } from '@/lib/feedbackData';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid, RadialBarChart, RadialBar, Legend } from 'recharts';

const departamentos = Object.entries(setorLabels) as [FeedbackSetor, string][];

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--info))',
  'hsl(var(--accent))',
];

const STATUS_COLORS: Record<string, string> = {
  novo: 'hsl(var(--info))',
  em_analise: 'hsl(var(--warning))',
  em_andamento: 'hsl(var(--primary))',
  resolvido: 'hsl(var(--success))',
  arquivado: 'hsl(var(--muted-foreground))',
};

const PRIORITY_COLORS: Record<string, string> = {
  baixa: 'hsl(var(--muted-foreground))',
  media: 'hsl(var(--info))',
  alta: 'hsl(var(--warning))',
  critica: 'hsl(var(--destructive))',
};

function getDaysSince(dateStr: string) {
  const now = new Date();
  const created = new Date(dateStr);
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

function getAlertType(fb: Feedback): 'quinzenal' | 'mensal' | null {
  if (fb.status === 'resolvido' || fb.status === 'arquivado') return null;
  const days = getDaysSince(fb.criadoEm);
  if (days >= 30) return 'mensal';
  if (days >= 15) return 'quinzenal';
  return null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-card border border-border px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function Feedbacks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'todos'>('todos');
  const [priorityFilter, setPriorityFilter] = useState<FeedbackPriority | 'todos'>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);
  const [selectedDept, setSelectedDept] = useState<FeedbackSetor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodRange>(getPortoPeriod(0));

  const [funcionariosFull, setFuncionariosFull] = useState<{ id: string; nome: string; cargo: string }[]>([]);
  const [funcionarios, setFuncionarios] = useState<string[]>([]);
  const [gestorName, setGestorName] = useState('');
  const [expandedFbCargo, setExpandedFbCargo] = useState<string | null>(null);
  const [form, setForm] = useState({
    titulo: '', descricao: '', setor: 'contrato_porto' as FeedbackSetor,
    prioridade: 'media' as FeedbackPriority, departamento: '', funcionario: '',
    pontos_positivos: '', pontos_melhoria: '',
  });

  useEffect(() => {
    fetchFeedbacks();
    supabase.from('funcionarios').select('id, nome, cargo').then(({ data }) => {
      if (data) {
        setFuncionariosFull(data as { id: string; nome: string; cargo: string }[]);
        setFuncionarios(data.map(f => f.nome));
      }
    });
    if (user?.id) {
      supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
        if (data) setGestorName(data.full_name || user.email || '');
      });
    }
  }, [user]);

  async function fetchFeedbacks() {
    const { data } = await supabase.from('feedbacks').select('*').order('criado_em', { ascending: false });
    if (data) {
      setFeedbacks(data.map(row => ({
        id: row.id, titulo: row.titulo, descricao: row.descricao,
        setor: row.setor as FeedbackSetor, prioridade: row.prioridade as FeedbackPriority,
        status: row.status as FeedbackStatus, autor: row.autor, departamento: row.departamento,
        criadoEm: new Date(row.criado_em).toISOString().split('T')[0],
        atualizadoEm: new Date(row.atualizado_em).toISOString().split('T')[0],
        votos: row.votos, comentarios: row.comentarios,
      })));
    }
  }

  async function handleCreateFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descricao.trim() || !form.funcionario) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    const { error } = await supabase.from('feedbacks').insert({
      titulo: form.titulo, descricao: form.descricao, setor: form.setor,
      prioridade: form.prioridade, autor: form.funcionario, departamento: form.departamento,
      pontos_positivos: form.pontos_positivos, pontos_melhoria: form.pontos_melhoria,
      observacoes: form.departamento, gestor: gestorName,
    });
    if (error) { toast.error('Erro ao enviar feedback.'); return; }

    const { data: funcData } = await supabase.from('funcionarios').select('id, feedbacks_recebidos').eq('nome', form.funcionario).single();
    if (funcData) {
      await supabase.from('funcionarios').update({ feedbacks_recebidos: funcData.feedbacks_recebidos + 1 }).eq('id', funcData.id);
    }
    toast.success('Feedback enviado com sucesso!');
    setForm({ titulo: '', descricao: '', setor: 'contrato_porto', prioridade: 'media', departamento: '', funcionario: '', pontos_positivos: '', pontos_melhoria: '' });
    setCreateOpen(false);
    fetchFeedbacks();
  }

  const filtered = feedbacks.filter((fb) => {
    const matchSearch = fb.titulo.toLowerCase().includes(search.toLowerCase()) || fb.descricao.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todos' || fb.status === statusFilter;
    const matchPriority = priorityFilter === 'todos' || fb.prioridade === priorityFilter;
    const matchPeriod = fb.criadoEm >= period.start && fb.criadoEm <= period.end;
    return matchSearch && matchStatus && matchPriority && matchPeriod;
  });

  const alertFeedbacks = useMemo(() => feedbacks.filter(fb => getAlertType(fb) !== null), [feedbacks]);

  // ── KPI Computations ──
  const kpis = useMemo(() => {
    const total = filtered.length;
    const resolvidos = filtered.filter(fb => fb.status === 'resolvido').length;
    const criticos = filtered.filter(fb => fb.prioridade === 'critica' && fb.status !== 'resolvido' && fb.status !== 'arquivado').length;
    const abertos = filtered.filter(fb => fb.status !== 'resolvido' && fb.status !== 'arquivado').length;
    const taxaResolucao = total > 0 ? Math.round((resolvidos / total) * 100) : 0;

    // Avg resolution time (days) for resolved feedbacks
    const resolvedFbs = filtered.filter(fb => fb.status === 'resolvido');
    const avgDays = resolvedFbs.length > 0
      ? Math.round(resolvedFbs.reduce((sum, fb) => sum + Math.max(0, getDaysSince(fb.criadoEm)), 0) / resolvedFbs.length)
      : 0;

    // SLA: feedbacks resolved within 15 days
    const withinSla = resolvedFbs.filter(fb => {
      const diff = Math.abs(new Date(fb.atualizadoEm).getTime() - new Date(fb.criadoEm).getTime());
      return diff / (1000 * 60 * 60 * 24) <= 15;
    }).length;
    const slaRate = resolvedFbs.length > 0 ? Math.round((withinSla / resolvedFbs.length) * 100) : 100;

    return { total, resolvidos, criticos, abertos, taxaResolucao, avgDays, slaRate };
  }, [filtered]);

  // ── Chart Data ──
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(fb => { counts[fb.status] = (counts[fb.status] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({
      name: statusLabels[key as FeedbackStatus] || key,
      value,
      fill: STATUS_COLORS[key] || CHART_COLORS[0],
    }));
  }, [filtered]);

  const priorityChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(fb => { counts[fb.prioridade] = (counts[fb.prioridade] || 0) + 1; });
    return Object.entries(priorityLabels).map(([key, label]) => ({
      name: label,
      value: counts[key] || 0,
      fill: PRIORITY_COLORS[key] || CHART_COLORS[0],
    })).filter(d => d.value > 0);
  }, [filtered]);

  const trendData = useMemo(() => {
    const byMonth: Record<string, { abertos: number; resolvidos: number }> = {};
    filtered.forEach(fb => {
      const month = fb.criadoEm.substring(0, 7); // YYYY-MM
      if (!byMonth[month]) byMonth[month] = { abertos: 0, resolvidos: 0 };
      byMonth[month].abertos++;
      if (fb.status === 'resolvido') byMonth[month].resolvidos++;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const [y, m] = month.split('-');
        const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        return { name: label, Abertos: data.abertos, Resolvidos: data.resolvidos };
      });
  }, [filtered]);

  const deptChartData = useMemo(() => {
    return departamentos.map(([key, label]) => {
      const deptFbs = filtered.filter(fb => fb.setor === key);
      const resolved = deptFbs.filter(fb => fb.status === 'resolvido').length;
      const pending = deptFbs.length - resolved;
      return { name: label, Resolvidos: resolved, Pendentes: pending, total: deptFbs.length };
    }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const deptStats = useMemo(() => {
    return departamentos.map(([key, label]) => {
      const deptFbs = feedbacks.filter(fb => fb.setor === key);
      const resolved = deptFbs.filter(fb => fb.status === 'resolvido').length;
      const pending = deptFbs.filter(fb => fb.status !== 'resolvido' && fb.status !== 'arquivado').length;
      return { key, label, total: deptFbs.length, resolved, pending };
    }).filter(d => d.total > 0);
  }, [feedbacks]);

  const selectedDeptPeople = useMemo(() => {
    if (!selectedDept) return [];
    const peopleFbs = feedbacks.filter(fb => fb.setor === selectedDept);
    const byAuthor: Record<string, { nome: string; total: number; resolvidos: number }> = {};
    peopleFbs.forEach(fb => {
      if (!byAuthor[fb.autor]) byAuthor[fb.autor] = { nome: fb.autor, total: 0, resolvidos: 0 };
      byAuthor[fb.autor].total++;
      if (fb.status === 'resolvido') byAuthor[fb.autor].resolvidos++;
    });
    return Object.values(byAuthor);
  }, [selectedDept, feedbacks]);

  // ── Feedback por Cargo (mín. 1 feedback por funcionário) ──
  const feedbackCargoStats = useMemo(() => {
    const cargos: Record<string, { cargo: string; total: number; comFeedback: number; pendentes: number; pendenteNomes: { id: string; nome: string }[] }> = {};
    funcionariosFull.forEach(f => {
      if (!cargos[f.cargo]) cargos[f.cargo] = { cargo: f.cargo, total: 0, comFeedback: 0, pendentes: 0, pendenteNomes: [] };
      cargos[f.cargo].total++;
      const hasFb = feedbacks.some(fb => fb.autor.toLowerCase() === f.nome.toLowerCase());
      if (hasFb) {
        cargos[f.cargo].comFeedback++;
      } else {
        cargos[f.cargo].pendentes++;
        cargos[f.cargo].pendenteNomes.push({ id: f.id, nome: f.nome });
      }
    });
    return Object.values(cargos).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [funcionariosFull, feedbacks]);

  const fbCargoChartData = feedbackCargoStats.map(c => ({
    cargo: c.cargo.length > 18 ? c.cargo.slice(0, 16) + '…' : c.cargo,
    'Com Feedback': c.comFeedback,
    Pendentes: c.pendentes,
  }));

  function openCreateForEmployee(nome: string) {
    setForm(prev => ({ ...prev, funcionario: nome }));
    setCreateOpen(true);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from('feedbacks').delete().eq('id', deleteId);
    if (error) { toast.error('Erro ao excluir feedback.'); return; }
    setFeedbacks(feedbacks.filter(fb => fb.id !== deleteId));
    setDeleteId(null);
    toast.success('Feedback excluído!');
  }

  const inputClass = "w-full bg-muted rounded-lg px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-shadow";
  const labelClass = "text-sm font-medium mb-1.5 block";

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Feedbacks</h1>
          <p className="text-muted-foreground text-sm mt-1">Painel analítico de acompanhamento e resolução</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo Feedback</Button>
      </motion.div>

      <PeriodFilter value={period} onChange={setPeriod} />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="corporate-kpi">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total no Período</p>
              <p className="text-3xl font-bold tracking-tight text-foreground">{kpis.total}</p>
              <p className="text-xs text-muted-foreground">{kpis.abertos} abertos · {kpis.resolvidos} resolvidos</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className={`corporate-kpi ${kpis.taxaResolucao >= 70 ? 'corporate-kpi-accent' : kpis.taxaResolucao < 40 ? 'corporate-kpi-danger' : ''}`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Taxa de Resolução</p>
              <p className="text-3xl font-bold tracking-tight text-foreground">{kpis.taxaResolucao}%</p>
              <p className={`text-xs font-medium ${kpis.taxaResolucao >= 70 ? 'text-success' : kpis.taxaResolucao < 40 ? 'text-destructive' : 'text-warning'}`}>
                {kpis.taxaResolucao >= 70 ? '↑ Dentro da meta' : kpis.taxaResolucao >= 40 ? '→ Atenção necessária' : '↓ Abaixo da meta'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-success/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-success" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`corporate-kpi ${kpis.slaRate >= 80 ? 'corporate-kpi-accent' : 'corporate-kpi-danger'}`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">SLA (≤15 dias)</p>
              <p className="text-3xl font-bold tracking-tight text-foreground">{kpis.slaRate}%</p>
              <p className="text-xs text-muted-foreground">Tempo médio: {kpis.avgDays}d</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-info/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-info" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={`corporate-kpi ${kpis.criticos > 0 ? 'corporate-kpi-danger' : ''}`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Críticos Abertos</p>
              <p className="text-3xl font-bold tracking-tight text-foreground">{kpis.criticos}</p>
              <p className={`text-xs font-medium ${kpis.criticos > 0 ? 'text-destructive' : 'text-success'}`}>
                {kpis.criticos > 0 ? '⚠ Requer ação imediata' : '✓ Nenhum pendente'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Acompanhamento de Feedbacks por Cargo ── */}
      {feedbackCargoStats.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="corporate-section">
          <div className="corporate-section-header">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Acompanhamento — Mín. 1 Feedback por Colaborador</h2>
            </div>
            <span className="text-xs text-muted-foreground">{feedbackCargoStats.length} cargos</span>
          </div>
          <div className="corporate-section-body">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={fbCargoChartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="cargo" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Bar dataKey="Com Feedback" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Pendentes" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {feedbackCargoStats.some(c => c.pendentes > 0) && (
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Colaboradores sem Feedback</p>
                <div className="space-y-1">
                  {feedbackCargoStats.filter(c => c.pendentes > 0).map(c => (
                    <div key={c.cargo} className="rounded-lg border border-border overflow-hidden">
                      <button onClick={() => setExpandedFbCargo(expandedFbCargo === c.cargo ? null : c.cargo)}
                        className="w-full flex items-center justify-between text-left px-4 py-2.5 hover:bg-muted/30 transition-colors">
                        <span className="text-sm font-medium text-foreground">{c.cargo}</span>
                        <div className="flex items-center gap-2">
                          <span className="corporate-badge bg-destructive/10 text-destructive">{c.pendentes}</span>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedFbCargo === c.cargo ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {expandedFbCargo === c.cargo && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          className="border-t border-border bg-muted/20 px-4 py-2 space-y-1">
                          {c.pendenteNomes.map(emp => (
                            <button key={emp.id} onClick={() => openCreateForEmployee(emp.nome)}
                              className="block text-sm text-primary hover:underline cursor-pointer py-0.5 text-left">
                              • {emp.nome}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Status Donut */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />Distribuição por Status
          </h3>
          {statusChartData.length > 0 ? (
            <div className="flex items-center gap-2">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))">
                    {statusChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {statusChartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.fill }} />
                    <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
                    <span className="font-bold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados no período</p>
          )}
        </motion.div>

        {/* Priority Bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />Distribuição por Prioridade
          </h3>
          {priorityChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={priorityChartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Qtd" radius={[0, 6, 6, 0]} barSize={20}>
                  {priorityChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados no período</p>
          )}
        </motion.div>

        {/* Trend Area */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />Tendência Mensal
          </h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trendData} margin={{ left: -10, right: 5, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAbertos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradResolvidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Abertos" stroke="hsl(var(--warning))" fill="url(#gradAbertos)" strokeWidth={2} />
                <Area type="monotone" dataKey="Resolvidos" stroke="hsl(var(--success))" fill="url(#gradResolvidos)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados no período</p>
          )}
        </motion.div>
      </div>

      {/* ── Department Performance Chart ── */}
      {deptChartData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />Performance por Departamento
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptChartData} margin={{ left: -5, right: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Resolvidos" stackId="a" fill="hsl(var(--success))" radius={[0, 0, 0, 0]} barSize={28} />
              <Bar dataKey="Pendentes" stackId="a" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: 'hsl(var(--success))' }} /> Resolvidos</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: 'hsl(var(--warning))' }} /> Pendentes</div>
          </div>
        </motion.div>
      )}

      {/* Alert banner */}
      {alertFeedbacks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl border-l-4 border-l-warning">
          <button onClick={() => setShowAlerts(!showAlerts)} className="w-full flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-5 h-5 text-warning" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold">{alertFeedbacks.length}</span>
              </div>
              <span className="text-sm font-semibold">{alertFeedbacks.length} alerta(s) de SLA pendente(s)</span>
            </div>
            {showAlerts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {showAlerts && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4 space-y-2">
                  {alertFeedbacks.map(fb => {
                    const alertType = getAlertType(fb)!;
                    const days = getDaysSince(fb.criadoEm);
                    return (
                      <div key={fb.id} onClick={() => navigate(`/feedbacks/${fb.id}`)} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                        <AlertCircle className={`w-4 h-4 flex-shrink-0 ${alertType === 'mensal' ? 'text-destructive' : 'text-warning'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{fb.titulo}</p>
                          <p className="text-xs text-muted-foreground">{fb.autor} · {setorLabels[fb.setor]}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${alertType === 'mensal' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                          {days}d · {alertType === 'mensal' ? 'Mensal' : 'Quinzenal'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar feedbacks..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm hover:bg-muted transition-colors">
          <SlidersHorizontal className="w-4 h-4" />Filtros
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card rounded-xl p-4 flex flex-wrap gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | 'todos')} className="bg-muted border-none rounded-lg px-3 py-2 text-sm outline-none">
              <option value="todos">Todos</option>
              {(Object.entries(statusLabels) as [FeedbackStatus, string][]).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Prioridade</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as FeedbackPriority | 'todos')} className="bg-muted border-none rounded-lg px-3 py-2 text-sm outline-none">
              <option value="todos">Todas</option>
              {(Object.entries(priorityLabels) as [FeedbackPriority, string][]).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
          </div>
        </motion.div>
      )}

      <p className="text-sm text-muted-foreground">{filtered.length} feedback(s) encontrado(s)</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((fb, i) => (
          <FeedbackCard key={fb.id} feedback={fb} index={i} onClick={() => navigate(`/feedbacks/${fb.id}`)} onDelete={() => setDeleteId(fb.id)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Filter className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum feedback encontrado com os filtros aplicados.</p>
        </div>
      )}

      {/* Department tracking detail */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
        <h2 className="font-semibold text-lg mb-4">Detalhamento por Departamento</h2>
        <div className="space-y-3">
          {deptStats.map(dept => {
            const maxTotal = Math.max(...deptStats.map(d => d.total), 1);
            const isSelected = selectedDept === dept.key;
            return (
              <div key={dept.key}>
                <button onClick={() => setSelectedDept(isSelected ? null : dept.key)} className="w-full text-left">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm w-32 shrink-0 font-medium">{dept.label}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden flex">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(dept.resolved / maxTotal) * 100}%` }} transition={{ duration: 0.5 }} className="h-full bg-success" />
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(dept.pending / maxTotal) * 100}%` }} transition={{ duration: 0.5 }} className="h-full bg-warning" />
                    </div>
                    <span className="text-xs w-16 text-right text-muted-foreground">{dept.resolved}✓ {dept.pending}⏳</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="ml-32 pl-3 mt-2 space-y-2 border-l-2 border-primary/20">
                        {selectedDeptPeople.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">Sem pessoas neste departamento</p>
                        ) : (
                          selectedDeptPeople.map(person => (
                            <div key={person.nome} className="flex items-center gap-3 py-1.5">
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm flex-1">{person.nome}</span>
                              <span className="text-xs text-muted-foreground">{person.resolvidos}/{person.total} resolvidos</span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Create Feedback Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader><DialogTitle>Novo Feedback</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateFeedback} className="space-y-4 pt-2">
            <div>
              <label className={labelClass}>Gestor Responsável</label>
              <input type="text" value={gestorName} readOnly className={`${inputClass} opacity-70 cursor-not-allowed`} />
            </div>
            <div>
              <label className={labelClass}>Título *</label>
              <FastInput placeholder="Resumo breve do feedback" value={form.titulo} onValueChange={(v) => setForm(f => ({ ...f, titulo: v }))} className={inputClass} maxLength={100} />
            </div>
            <div>
              <label className={labelClass}>Funcionário *</label>
              <select value={form.funcionario} onChange={(e) => setForm({ ...form, funcionario: e.target.value })} className={inputClass}>
                <option value="">Selecione o funcionário</option>
                {funcionarios.map((nome) => (<option key={nome} value={nome}>{nome}</option>))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Descrição *</label>
              <FastTextarea placeholder="Descreva em detalhes o feedback..." value={form.descricao} onValueChange={(v) => setForm(f => ({ ...f, descricao: v }))} className={`${inputClass} min-h-[100px] resize-none`} maxLength={1000} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Pontos Positivos</label>
                <FastTextarea placeholder="Destaque os pontos positivos..." value={form.pontos_positivos} onValueChange={(v) => setForm(f => ({ ...f, pontos_positivos: v }))} className={`${inputClass} min-h-[60px] resize-none`} />
              </div>
              <div>
                <label className={labelClass}>Pontos de Melhoria</label>
                <textarea placeholder="Indique os pontos de melhoria..." value={form.pontos_melhoria} onChange={(e) => setForm({ ...form, pontos_melhoria: e.target.value })} className={`${inputClass} min-h-[60px] resize-none`} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Departamento</label>
                <select value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value as FeedbackSetor })} className={inputClass}>
                  {(Object.entries(setorLabels) as [FeedbackSetor, string][]).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Prioridade</label>
                <select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value as FeedbackPriority })} className={inputClass}>
                  {(Object.entries(priorityLabels) as [FeedbackPriority, string][]).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Observações</label>
              <textarea placeholder="Observações adicionais..." value={form.departamento} onChange={(e) => setForm({ ...form, departamento: e.target.value })} className={`${inputClass} min-h-[60px] resize-none`} maxLength={500} />
            </div>
            <Button type="submit" className="w-full"><Send className="w-4 h-4 mr-2" />Enviar Feedback</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir feedback?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. O feedback será removido permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
