import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, MessageSquare, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  ArrowUpRight, ShieldAlert, CalendarDays, Target, Award, BarChart3,
  Activity, UserCheck, UserX, Briefcase, Timer
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import StatCard from '@/components/dashboard/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, RadialBarChart, RadialBar,
  LineChart, Line
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Func {
  id: string; nome: string; cargo: string; departamento: string;
  foto_url: string; feedbacks_recebidos: number; feedbacks_resolvidos: number;
  turno: string; letra: string; data_admissao: string;
}
interface FeedbackRow { id: string; setor: string; status: string; prioridade: string; criado_em: string; autor: string; }
interface AttendanceRow { id: string; employee_id: string; date: string; status: string; }
interface VacationRow { id: string; employee_id: string; start_date: string | null; end_date: string | null; }
interface WarningRow { id: string; employee_id: string; date: string; applied: boolean; }
interface EvalRow { id: string; evaluated_name: string; status: string; completed_at: string | null; }
interface MeetingRow { id: string; employee_id: string; meeting_date: string; status: string; }
interface EventRow { id: string; event_date: string; involved_name: string; }

const CHART_COLORS = [
  'hsl(200, 80%, 38%)', 'hsl(155, 60%, 38%)', 'hsl(38, 90%, 50%)',
  'hsl(280, 60%, 55%)', 'hsl(0, 68%, 50%)', 'hsl(180, 60%, 45%)',
  'hsl(220, 60%, 55%)', 'hsl(45, 80%, 50%)'
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main ───────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodRange>(getPortoPeriod(0));
  const [funcionarios, setFuncionarios] = useState<Func[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [vacations, setVacations] = useState<VacationRow[]>([]);
  const [warnings, setWarnings] = useState<WarningRow[]>([]);
  const [evaluations, setEvaluations] = useState<EvalRow[]>([]);
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [fRes, fbRes, attRes, vacRes, warnRes, evalRes, meetRes, evtRes] = await Promise.all([
        supabase.from('funcionarios').select('id, nome, cargo, departamento, foto_url, feedbacks_recebidos, feedbacks_resolvidos, turno, letra, data_admissao').order('nome'),
        supabase.from('feedbacks').select('id, setor, status, prioridade, criado_em, autor'),
        supabase.from('daily_attendance').select('id, employee_id, date, status').gte('date', period.start).lte('date', period.end),
        supabase.from('vacation_control').select('id, employee_id, start_date, end_date'),
        supabase.from('employee_warnings').select('id, employee_id, date, applied').gte('date', period.start).lte('date', period.end),
        supabase.from('evaluations').select('id, evaluated_name, status, completed_at'),
        supabase.from('meetings').select('id, employee_id, meeting_date, status').gte('meeting_date', period.start).lte('meeting_date', period.end),
        supabase.from('events').select('id, event_date, involved_name').gte('event_date', period.start).lte('event_date', period.end),
      ]);
      setFuncionarios((fRes.data || []) as Func[]);
      setFeedbacks((fbRes.data || []) as FeedbackRow[]);
      setAttendance((attRes.data || []) as AttendanceRow[]);
      setVacations((vacRes.data || []) as VacationRow[]);
      setWarnings((warnRes.data || []) as WarningRow[]);
      setEvaluations((evalRes.data || []) as EvalRow[]);
      setMeetings((meetRes.data || []) as MeetingRow[]);
      setEvents((evtRes.data || []) as EventRow[]);
      setLoading(false);
    }
    load();
  }, [period]);

  // ─── Derived metrics ──────────────────────────────────────────────────
  const totalColaboradores = funcionarios.length;

  // Feedbacks in period
  const periodFeedbacks = useMemo(() => feedbacks.filter(f => {
    const d = new Date(f.criado_em).toISOString().split('T')[0];
    return d >= period.start && d <= period.end;
  }), [feedbacks, period]);

  const fbTotal = periodFeedbacks.length;
  const fbResolvidos = periodFeedbacks.filter(f => f.status === 'resolvido').length;
  const fbPendentes = periodFeedbacks.filter(f => f.status !== 'resolvido' && f.status !== 'arquivado').length;
  const fbTaxaResolucao = fbTotal > 0 ? Math.round((fbResolvidos / fbTotal) * 100) : 0;

  // Attendance KPIs
  const totalFaltasInj = attendance.filter(a => a.status === 'falta' || a.status === 'falta_injustificada').length;
  const totalAtestados = attendance.filter(a => a.status === 'atestado').length;
  const totalExtras = attendance.filter(a => a.status === 'extra').length;
  const totalHorasNeg = totalFaltasInj + totalAtestados + attendance.filter(a => a.status === 'falta_justificada').length;

  // Vacations active now
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const emFerias = vacations.filter(v => v.start_date && v.end_date && todayStr >= v.start_date && todayStr <= v.end_date).length;

  // Warnings
  const totalAdvertencias = warnings.length;
  const advertenciasAplicadas = warnings.filter(w => w.applied).length;

  // Evaluations
  const evalsCompleted = evaluations.filter(e => e.status === 'completed').length;
  const evalsPending = evaluations.filter(e => e.status === 'pending').length;

  // Meetings
  const meetingsCompleted = meetings.filter(m => m.status === 'completed').length;
  const meetingsScheduled = meetings.length;

  // Events
  const totalEvents = events.length;

  // ─── Chart data ───────────────────────────────────────────────────────

  // Feedback by priority
  const fbByPriority = useMemo(() => {
    const counts: Record<string, number> = {};
    periodFeedbacks.forEach(f => { counts[f.prioridade] = (counts[f.prioridade] || 0) + 1; });
    const labels: Record<string, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa', critica: 'Crítica' };
    return Object.entries(counts).map(([k, v]) => ({ name: labels[k] || k, value: v }));
  }, [periodFeedbacks]);

  // Feedback by status
  const fbByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    periodFeedbacks.forEach(f => { counts[f.status] = (counts[f.status] || 0) + 1; });
    const labels: Record<string, string> = { novo: 'Novo', em_analise: 'Em Análise', em_andamento: 'Em Andamento', resolvido: 'Resolvido', arquivado: 'Arquivado' };
    return Object.entries(counts).map(([k, v]) => ({ name: labels[k] || k, value: v }));
  }, [periodFeedbacks]);

  // Attendance daily trend
  const attendanceTrend = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {};
    attendance.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = {};
      const s = a.status === 'falta' ? 'falta_injustificada' : a.status;
      byDate[a.date][s] = (byDate[a.date][s] || 0) + 1;
    });
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).slice(-15).map(([date, s]) => ({
      date: new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      'Hrs Negativas': (s.falta_injustificada || 0) + (s.falta_justificada || 0) + (s.atestado || 0),
      Extras: s.extra || 0,
      Atestados: s.atestado || 0,
    }));
  }, [attendance]);

  // Headcount by department
  const headcountByDept = useMemo(() => {
    const counts: Record<string, number> = {};
    funcionarios.forEach(f => { counts[f.departamento || 'Outros'] = (counts[f.departamento || 'Outros'] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ dept: k, total: v })).sort((a, b) => b.total - a.total);
  }, [funcionarios]);

  // Turnover indicators (employees with warnings >= 2)
  const riskEmployees = useMemo(() => {
    const warnCount: Record<string, number> = {};
    warnings.forEach(w => { warnCount[w.employee_id] = (warnCount[w.employee_id] || 0) + 1; });
    return Object.entries(warnCount).filter(([, c]) => c >= 2).length;
  }, [warnings]);

  // Top 5 employees by deviations
  const topDeviations = useMemo(() => {
    const map: Record<string, { name: string; faltas: number; atestados: number; advertencias: number; total: number }> = {};
    const nameMap = Object.fromEntries(funcionarios.map(f => [f.id, f.nome]));

    attendance.forEach(a => {
      const s = a.status === 'falta' ? 'falta_injustificada' : a.status;
      if (!['falta_injustificada', 'falta_justificada', 'atestado'].includes(s)) return;
      if (!map[a.employee_id]) map[a.employee_id] = { name: nameMap[a.employee_id] || '?', faltas: 0, atestados: 0, advertencias: 0, total: 0 };
      if (s === 'falta_injustificada') map[a.employee_id].faltas++;
      if (s === 'atestado') map[a.employee_id].atestados++;
      map[a.employee_id].total++;
    });

    warnings.forEach(w => {
      if (!map[w.employee_id]) map[w.employee_id] = { name: nameMap[w.employee_id] || '?', faltas: 0, atestados: 0, advertencias: 0, total: 0 };
      map[w.employee_id].advertencias++;
      map[w.employee_id].total++;
    });

    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [attendance, warnings, funcionarios]);

  // Radial gauge for key metrics
  const gaugeData = useMemo(() => [
    { name: 'Resolução FB', value: fbTaxaResolucao, fill: 'hsl(155, 60%, 38%)' },
    { name: 'Avaliações', value: evaluations.length > 0 ? Math.round((evalsCompleted / evaluations.length) * 100) : 0, fill: 'hsl(200, 80%, 38%)' },
    { name: 'Reuniões 1:1', value: meetingsScheduled > 0 ? Math.round((meetingsCompleted / meetingsScheduled) * 100) : 0, fill: 'hsl(280, 60%, 55%)' },
  ], [fbTaxaResolucao, evalsCompleted, evaluations, meetingsCompleted, meetingsScheduled]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Painel Executivo</p>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Corporativo</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Atualizado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </motion.div>

      <PeriodFilter value={period} onChange={setPeriod} />

      {/* ═══ MAIN KPIs — Executive Overview ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Colaboradores" value={totalColaboradores} change={`${emFerias} em férias`} changeType="neutral" icon={Users} delay={0} />
        <StatCard title="Feedbacks" value={fbTotal} change={`${fbTaxaResolucao}% resolvidos`} changeType={fbTaxaResolucao >= 70 ? 'positive' : 'negative'} icon={MessageSquare} delay={0.03} />
        <StatCard title="Hrs Negativas" value={totalHorasNeg} change={`${totalFaltasInj} inj. / ${totalAtestados} atest.`} changeType={totalHorasNeg > 0 ? 'negative' : 'positive'} icon={Clock} delay={0.06} />
        <StatCard title="Extras" value={totalExtras} change="No período" changeType="neutral" icon={Timer} delay={0.09} />
        <StatCard title="Advertências" value={totalAdvertencias} change={`${advertenciasAplicadas} aplicadas`} changeType={totalAdvertencias > 0 ? 'negative' : 'positive'} icon={ShieldAlert} delay={0.12} />
        <StatCard title="Clima Org." value={avgClimate > 0 ? `${avgClimate}/5` : '—'} change={`${climateScores.length} respostas`} changeType={avgClimate >= 3.5 ? 'positive' : avgClimate > 0 ? 'negative' : 'neutral'} icon={Award} delay={0.15} />
      </div>

      {/* ═══ ROW 2 — Gauges + Priority ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radial Gauge — Compliance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="corporate-section lg:col-span-1">
          <div className="corporate-section-header">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Indicadores de Aderência</h2>
            </div>
          </div>
          <div className="corporate-section-body">
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="90%" barSize={14} data={gaugeData} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'hsl(var(--muted))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {gaugeData.map(g => (
                <div key={g.name} className="text-center">
                  <p className="text-2xl font-bold text-foreground">{g.value}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{g.name}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Feedback by Status — Donut */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="corporate-section">
          <div className="corporate-section-header">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Feedbacks por Status</h2>
            </div>
            <button onClick={() => navigate('/feedbacks')} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
              Detalhar <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="corporate-section-body flex items-center justify-center">
            {fbByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={fbByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: '10px' }}>
                    {fbByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12">Sem feedbacks no período</p>
            )}
          </div>
        </motion.div>

        {/* Feedback by Priority — Donut */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="corporate-section">
          <div className="corporate-section-header">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Feedbacks por Prioridade</h2>
            </div>
          </div>
          <div className="corporate-section-body flex items-center justify-center">
            {fbByPriority.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={fbByPriority} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: '10px' }}>
                    {fbByPriority.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12">Sem feedbacks no período</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ═══ ROW 3 — Attendance Trend + Headcount ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="corporate-section lg:col-span-2">
          <div className="corporate-section-header">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Evolução Diária — Ponto</h2>
            </div>
            <button onClick={() => navigate('/ausencias')} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
              Gestão à Vista <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="corporate-section-body">
            {attendanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={attendanceTrend}>
                  <defs>
                    <linearGradient id="gradHrsNeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 68%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 68%, 50%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradExtras" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(280, 60%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(280, 60%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="Hrs Negativas" stroke="hsl(0, 68%, 50%)" fill="url(#gradHrsNeg)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Extras" stroke="hsl(280, 60%, 55%)" fill="url(#gradExtras)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Atestados" stroke="hsl(200, 70%, 50%)" fill="hsl(200, 70%, 50%)" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">Sem registros de ponto no período</p>
            )}
          </div>
        </motion.div>

        {/* Headcount by Department */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="corporate-section">
          <div className="corporate-section-header">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Headcount por Depto.</h2>
            </div>
            <span className="text-xs text-muted-foreground">{totalColaboradores} total</span>
          </div>
          <div className="corporate-section-body space-y-3">
            {headcountByDept.map((d, i) => (
              <div key={d.dept} className="flex items-center gap-3">
                <span className="text-xs text-foreground w-32 truncate font-medium">{d.dept}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${totalColaboradores > 0 ? (d.total / totalColaboradores) * 100 : 0}%` }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.04 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground w-8 text-right">{d.total}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ═══ ROW 4 — Risk + People Management ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* People KPIs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="corporate-kpi corporate-kpi-accent">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avaliações Concluídas</p>
              <p className="text-3xl font-bold text-foreground mt-1">{evalsCompleted}</p>
              <p className="text-xs text-muted-foreground mt-1">{evalsPending} pendentes</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} className="corporate-kpi">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reuniões 1:1</p>
              <p className="text-3xl font-bold text-foreground mt-1">{meetingsCompleted}</p>
              <p className="text-xs text-muted-foreground mt-1">{meetingsScheduled} agendadas</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.51 }}
          className={`corporate-kpi ${riskEmployees > 0 ? 'corporate-kpi-danger' : ''}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Colabs. em Risco</p>
              <p className="text-3xl font-bold text-foreground mt-1">{riskEmployees}</p>
              <p className="text-xs text-destructive mt-1">≥2 advertências</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center">
              <UserX className="w-5 h-5 text-destructive" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }} className="corporate-kpi">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Em Férias</p>
              <p className="text-3xl font-bold text-foreground mt-1">{emFerias}</p>
              <p className="text-xs text-muted-foreground mt-1">colaboradores hoje</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ ROW 5 — Top Deviations Table ═══ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="corporate-section">
        <div className="corporate-section-header">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Top 5 — Colaboradores com Desvios</h2>
          </div>
          <button onClick={() => navigate('/ausencias')} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
            Ver Todos <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="corporate-section-body">
          {topDeviations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Colaborador</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Faltas Inj.</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Atestados</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Advertências</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider text-destructive">Total Desvios</th>
                  </tr>
                </thead>
                <tbody>
                  {topDeviations.map((d, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground">{d.name}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${d.faltas > 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                          {d.faltas}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${d.atestados > 0 ? 'bg-info/10 text-info' : 'bg-muted text-muted-foreground'}`}>
                          {d.atestados}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${d.advertencias > 0 ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                          {d.advertencias}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 text-destructive text-sm font-bold">
                          {d.total}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum desvio registrado no período</p>
          )}
        </div>
      </motion.div>

      {/* ═══ ROW 6 — Employee Grid (collapsed) ═══ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="corporate-section">
        <div className="corporate-section-header">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Quadro de Colaboradores</h2>
          </div>
          <button onClick={() => navigate('/colaboradores')} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
            Gerenciar <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="corporate-section-body">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {funcionarios.slice(0, 12).map((func, i) => {
              const pct = func.feedbacks_recebidos > 0 ? Math.round((func.feedbacks_resolvidos / func.feedbacks_recebidos) * 100) : 0;
              return (
                <motion.div key={func.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.02 }}
                  className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/funcionario/${func.id}`)}>
                  <div className="flex items-center gap-2.5 mb-2">
                    {func.foto_url ? (
                      <img src={func.foto_url} alt={func.nome} className="w-9 h-9 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-xs">
                        {func.nome.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate text-foreground group-hover:text-primary transition-colors">{func.nome}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{func.cargo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground">FB</p>
                      <p className="text-xs font-bold text-foreground">{func.feedbacks_recebidos}</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-[10px] text-muted-foreground">Resolução</p>
                      <p className={`text-xs font-bold ${pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-destructive'}`}>{pct}%</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {funcionarios.length > 12 && (
            <div className="text-center mt-4">
              <button onClick={() => navigate('/colaboradores')} className="text-xs text-primary hover:underline font-medium">
                Ver todos os {funcionarios.length} colaboradores →
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
