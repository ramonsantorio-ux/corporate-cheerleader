import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, MessageSquare, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  ArrowUpRight, ShieldAlert, CalendarDays, Target, Award, BarChart3,
  Activity, UserCheck, UserX, Briefcase, Timer, Search, X, Eye, Check, X as XIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import StatCard from '@/components/dashboard/StatCard';
import { ExpandableChart } from '@/components/ui/ExpandableChart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, RadialBarChart, RadialBar,
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
interface MeetingRow { id: string; employee_id: string; meeting_date: string; status: string; meeting_type: string; }
interface EventRow { id: string; event_date: string; involved_name: string; }
interface ActionItemRow { id: string; meeting_id: string; status: string; }
interface AttendeeRow { id: string; meeting_id: string; employee_id: string; present: boolean; }

const CHART_COLORS = [
  'hsl(200, 80%, 38%)', 'hsl(155, 60%, 38%)', 'hsl(38, 90%, 50%)',
  'hsl(280, 60%, 55%)', 'hsl(0, 68%, 50%)', 'hsl(180, 60%, 45%)',
  'hsl(220, 60%, 55%)', 'hsl(45, 80%, 50%)'
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card rounded-lg shadow-lg p-3 text-xs">
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
  const { isAdmin } = useAuth();
  const [period, setPeriod] = useState<PeriodRange>(getPortoPeriod(0));
  const [funcionarios, setFuncionarios] = useState<Func[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [vacations, setVacations] = useState<VacationRow[]>([]);
  const [warnings, setWarnings] = useState<WarningRow[]>([]);
  const [evaluations, setEvaluations] = useState<EvalRow[]>([]);
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [meetingActions, setMeetingActions] = useState<ActionItemRow[]>([]);
  const [meetingAttendees, setMeetingAttendees] = useState<AttendeeRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Employee filter
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Func | null>(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [fRes, fbRes, attRes, vacRes, warnRes, evalRes, meetRes, evtRes, mActRes, mAttRes] = await Promise.all([
        supabase.from('funcionarios').select('id, nome, cargo, departamento, foto_url, feedbacks_recebidos, feedbacks_resolvidos, turno, letra, data_admissao').order('nome'),
        supabase.from('feedbacks').select('id, setor, status, prioridade, criado_em, autor'),
        supabase.from('daily_attendance').select('id, employee_id, date, status').gte('date', period.start).lte('date', period.end),
        supabase.from('vacation_control').select('id, employee_id, start_date, end_date'),
        supabase.from('employee_warnings').select('id, employee_id, date, applied').gte('date', period.start).lte('date', period.end),
        supabase.from('evaluations').select('id, evaluated_name, status, completed_at'),
        supabase.from('meetings').select('id, employee_id, meeting_date, status, meeting_type').gte('meeting_date', period.start).lte('meeting_date', period.end),
        supabase.from('events').select('id, event_date, involved_name').gte('event_date', period.start).lte('event_date', period.end),
        supabase.from('meeting_action_items').select('id, meeting_id, status'),
        supabase.from('meeting_attendees').select('id, meeting_id, employee_id, present'),
      ]);
      setFuncionarios((fRes.data || []) as Func[]);
      setFeedbacks((fbRes.data || []) as FeedbackRow[]);
      setAttendance((attRes.data || []) as AttendanceRow[]);
      setVacations((vacRes.data || []) as VacationRow[]);
      setWarnings((warnRes.data || []) as WarningRow[]);
      setEvaluations((evalRes.data || []) as EvalRow[]);
      setMeetings((meetRes.data || []) as MeetingRow[]);
      setEvents((evtRes.data || []) as EventRow[]);
      setMeetingActions((mActRes.data || []) as ActionItemRow[]);
      setMeetingAttendees((mAttRes.data || []) as AttendeeRow[]);
      setLoading(false);
    }
    load();
  }, [period]);

  // Filtered employee search list
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return [];
    return funcionarios.filter(f => f.nome.toLowerCase().includes(employeeSearch.toLowerCase())).slice(0, 8);
  }, [employeeSearch, funcionarios]);

  // ─── Data filtering by selected employee ──────────────────────────────
  const sel = selectedEmployee;

  const periodFeedbacks = useMemo(() => {
    let fbs = feedbacks.filter(f => {
      const d = new Date(f.criado_em).toISOString().split('T')[0];
      return d >= period.start && d <= period.end;
    });
    if (sel) fbs = fbs.filter(f => f.autor.trim().toLowerCase() === sel.nome.trim().toLowerCase());
    return fbs;
  }, [feedbacks, period, sel]);

  const filteredAttendance = useMemo(() => {
    if (!sel) return attendance;
    return attendance.filter(a => a.employee_id === sel.id);
  }, [attendance, sel]);

  const filteredWarnings = useMemo(() => {
    if (!sel) return warnings;
    return warnings.filter(w => w.employee_id === sel.id);
  }, [warnings, sel]);

  const filteredMeetings = useMemo(() => {
    if (!sel) return meetings;
    return meetings.filter(m => m.employee_id === sel.id);
  }, [meetings, sel]);

  const registeredNames = useMemo(() => new Set(funcionarios.map(f => f.nome.trim().toLowerCase())), [funcionarios]);

  const filteredEvents = useMemo(() => {
    let evts = events.filter(e => registeredNames.has(e.involved_name.trim().toLowerCase()));
    if (sel) evts = evts.filter(e => e.involved_name.trim().toLowerCase() === sel.nome.trim().toLowerCase());
    return evts;
  }, [events, registeredNames, sel]);

  const filteredEvaluations = useMemo(() => {
    if (!sel) return evaluations;
    return evaluations.filter(e => e.evaluated_name.trim().toLowerCase() === sel.nome.trim().toLowerCase());
  }, [evaluations, sel]);

  // ─── KPIs ──────────────────────────────────────────────────────────────
  const totalColaboradores = funcionarios.length;
  const fbTotal = periodFeedbacks.length;
  const fbResolvidos = periodFeedbacks.filter(f => f.status === 'resolvido').length;
  const fbPendentes = periodFeedbacks.filter(f => f.status !== 'resolvido' && f.status !== 'arquivado').length;
  const fbTaxaResolucao = fbTotal > 0 ? Math.round((fbResolvidos / fbTotal) * 100) : 0;

  const totalFaltasInj = filteredAttendance.filter(a => a.status === 'falta' || a.status === 'falta_injustificada').length;
  const totalAtestados = filteredAttendance.filter(a => a.status === 'atestado').length;
  const totalExtras = filteredAttendance.filter(a => a.status === 'extra').length;
  const totalHorasNeg = totalFaltasInj + totalAtestados + filteredAttendance.filter(a => a.status === 'falta_justificada').length;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const emFerias = vacations.filter(v => {
    if (sel && v.employee_id !== sel.id) return false;
    return v.start_date && v.end_date && todayStr >= v.start_date && todayStr <= v.end_date;
  }).length;

  const totalAdvertencias = filteredWarnings.length;
  const advertenciasAplicadas = filteredWarnings.filter(w => w.applied).length;

  const evalsCompleted = filteredEvaluations.filter(e => e.status === 'completed').length;
  const evalsPending = filteredEvaluations.filter(e => e.status === 'pending').length;

  const meetingsCompleted = filteredMeetings.filter(m => m.status === 'completed').length;
  const meetingsScheduled = filteredMeetings.length;

  const totalEvents = filteredEvents.length;

  // ─── Meeting KPIs (Mensal Operacional + Actions) ──────────────────
  const meetingKpis = useMemo(() => {
    const leaderCargos = ['gerente operacional', 'coordenador operacional', 'encarregado operacional', 'analista de controle', 'supervisor'];
    const leaders = funcionarios.filter(f => leaderCargos.some(c => f.cargo.toLowerCase().includes(c)));

    const mensalMeetings = filteredMeetings.filter(m => m.meeting_type === 'mensal_operacional');
    const monthsWithMensal = new Set(mensalMeetings.map(m => m.meeting_date.substring(0, 7))).size;
    const startDate = new Date(period.start);
    const endDate = new Date(period.end);
    let expectedMonths = 0;
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (d <= endDate) { expectedMonths++; d.setMonth(d.getMonth() + 1); }
    const mensalRate = expectedMonths > 0 ? Math.round((monthsWithMensal / expectedMonths) * 100) : 0;

    const mensalIds = new Set(mensalMeetings.map(m => m.id));
    const leaderIds = new Set(leaders.map(f => f.id));
    const attendedLeaders = new Set(
      meetingAttendees.filter(a => mensalIds.has(a.meeting_id) && a.present && leaderIds.has(a.employee_id)).map(a => a.employee_id)
    );
    const leaderCoverage = leaderIds.size > 0 ? Math.round((attendedLeaders.size / leaderIds.size) * 100) : 0;

    const meetingIds = new Set(filteredMeetings.map(m => m.id));
    const periodActions = meetingActions.filter(a => meetingIds.has(a.meeting_id));
    const pendentes = periodActions.filter(a => a.status === 'pendente').length;
    const concluidas = periodActions.filter(a => a.status === 'concluido').length;
    const conclusionRate = periodActions.length > 0 ? Math.round((concluidas / periodActions.length) * 100) : 0;

    return { mensalRate, monthsWithMensal, expectedMonths, leaderCoverage, attendedLeaders: attendedLeaders.size, totalLeaders: leaderIds.size, pendentes, concluidas, conclusionRate, totalActions: periodActions.length };
  }, [filteredMeetings, funcionarios, meetingActions, meetingAttendees, period]);

  // ─── Chart data ───────────────────────────────────────────────────────
  const fbByPriority = useMemo(() => {
    const counts: Record<string, number> = {};
    periodFeedbacks.forEach(f => { counts[f.prioridade] = (counts[f.prioridade] || 0) + 1; });
    const labels: Record<string, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa', critica: 'Crítica' };
    return Object.entries(counts).map(([k, v]) => ({ name: labels[k] || k, value: v }));
  }, [periodFeedbacks]);

  const fbByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    periodFeedbacks.forEach(f => { counts[f.status] = (counts[f.status] || 0) + 1; });
    const labels: Record<string, string> = { novo: 'Novo', em_analise: 'Em Análise', em_andamento: 'Em Andamento', resolvido: 'Resolvido', arquivado: 'Arquivado' };
    return Object.entries(counts).map(([k, v]) => ({ name: labels[k] || k, value: v }));
  }, [periodFeedbacks]);

  const attendanceTrend = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {};
    filteredAttendance.forEach(a => {
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
  }, [filteredAttendance]);

  const headcountByDept = useMemo(() => {
    const counts: Record<string, number> = {};
    funcionarios.forEach(f => { counts[f.departamento || 'Outros'] = (counts[f.departamento || 'Outros'] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ dept: k, total: v })).sort((a, b) => b.total - a.total);
  }, [funcionarios]);

  const riskEmployees = useMemo(() => {
    const warnCount: Record<string, number> = {};
    warnings.forEach(w => { warnCount[w.employee_id] = (warnCount[w.employee_id] || 0) + 1; });
    if (sel) return (warnCount[sel.id] || 0) >= 2 ? 1 : 0;
    return Object.entries(warnCount).filter(([, c]) => c >= 2).length;
  }, [warnings, sel]);

  const topDeviations = useMemo(() => {
    const map: Record<string, { name: string; id: string; faltas: number; atestados: number; advertencias: number; eventos: number; total: number }> = {};
    const nameMap = Object.fromEntries(funcionarios.map(f => [f.id, f.nome]));

    filteredAttendance.forEach(a => {
      const s = a.status === 'falta' ? 'falta_injustificada' : a.status;
      if (!['falta_injustificada', 'falta_justificada', 'atestado'].includes(s)) return;
      if (!map[a.employee_id]) map[a.employee_id] = { name: nameMap[a.employee_id] || '?', id: a.employee_id, faltas: 0, atestados: 0, advertencias: 0, eventos: 0, total: 0 };
      if (s === 'falta_injustificada') map[a.employee_id].faltas++;
      if (s === 'atestado') map[a.employee_id].atestados++;
      map[a.employee_id].total++;
    });

    filteredWarnings.forEach(w => {
      if (!map[w.employee_id]) map[w.employee_id] = { name: nameMap[w.employee_id] || '?', id: w.employee_id, faltas: 0, atestados: 0, advertencias: 0, eventos: 0, total: 0 };
      map[w.employee_id].advertencias++;
      map[w.employee_id].total++;
    });

    filteredEvents.forEach(e => {
      const func = funcionarios.find(f => f.nome.trim().toLowerCase() === e.involved_name.trim().toLowerCase());
      if (!func) return;
      if (!map[func.id]) map[func.id] = { name: func.nome, id: func.id, faltas: 0, atestados: 0, advertencias: 0, eventos: 0, total: 0 };
      map[func.id].eventos++;
      map[func.id].total++;
    });

    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 7);
  }, [filteredAttendance, filteredWarnings, filteredEvents, funcionarios]);

  const gaugeData = useMemo(() => [
    { name: 'Resolução FB', value: fbTaxaResolucao, fill: 'hsl(155, 60%, 38%)' },
    { name: 'Avaliações', value: filteredEvaluations.length > 0 ? Math.round((evalsCompleted / filteredEvaluations.length) * 100) : 0, fill: 'hsl(200, 80%, 38%)' },
    { name: 'Reuniões 1:1', value: meetingsScheduled > 0 ? Math.round((meetingsCompleted / meetingsScheduled) * 100) : 0, fill: 'hsl(280, 60%, 55%)' },
  ], [fbTaxaResolucao, evalsCompleted, filteredEvaluations, meetingsCompleted, meetingsScheduled]);

  // Department feedback performance
  const deptFbPerformance = useMemo(() => {
    if (sel) return [];
    const deptMap: Record<string, { resolvidos: number; total: number }> = {};
    periodFeedbacks.forEach(f => {
      if (!deptMap[f.setor]) deptMap[f.setor] = { resolvidos: 0, total: 0 };
      deptMap[f.setor].total++;
      if (f.status === 'resolvido') deptMap[f.setor].resolvidos++;
    });
    const labels: Record<string, string> = {
      contrato_porto: 'Porto', contrato_usina: 'Usina', frotas: 'Frotas', medicao: 'Medição',
      seguranca: 'Segurança', cco: 'CCO', ccm: 'CCM', manutencao: 'Manutenção', rh: 'RH', financeiro: 'Financeiro'
    };
    return Object.entries(deptMap).map(([k, v]) => ({
      name: labels[k] || k, Resolvidos: v.resolvidos, Pendentes: v.total - v.resolvidos,
    })).sort((a, b) => (b.Resolvidos + b.Pendentes) - (a.Resolvidos + a.Pendentes));
  }, [periodFeedbacks, sel]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meu Painel</h1>
            <p className="text-muted-foreground mt-1">Resumo das suas atividades e informações.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Saldo de Férias" value="15 dias" change="Vence em Nov/2026" changeType="positive" icon={CalendarDays} delay={0} />
          <StatCard title="Próximos Feedbacks" value="2" change="1 pendente de leitura" changeType="negative" icon={MessageSquare} delay={0.1} />
          <StatCard title="Eventos da Semana" value="1" change="Treinamento (Sexta)" changeType="neutral" icon={AlertTriangle} delay={0.2} />
        </div>
        <div className="mt-8 bg-card p-6 rounded-xl border border-border">
          <h2 className="text-lg font-semibold mb-4">Como você está se sentindo hoje?</h2>
          <div className="flex gap-4">
             {["😢", "😕", "😐", "🙂", "🤩"].map(emoji => (
               <button key={emoji} className="text-4xl hover:scale-125 transition-transform" onClick={() => alert('Humor registrado com sucesso!')}>{emoji}</button>
             ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Painel Executivo</p>
          <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Atualizado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </motion.div>

      {/* ═══ FILTERS ROW ═══ */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="flex-1 w-full">
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
        {/* Employee Selector */}
        <div className="relative w-full sm:w-72">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            {selectedEmployee ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {selectedEmployee.foto_url ? (
                  <img src={selectedEmployee.foto_url} className="w-6 h-6 rounded-full object-cover border border-border" alt="" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">{selectedEmployee.nome.charAt(0)}</div>
                )}
                <span className="text-sm font-medium truncate">{selectedEmployee.nome}</span>
                <button onClick={() => { setSelectedEmployee(null); setEmployeeSearch(''); }} className="ml-auto text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <input
                type="text"
                placeholder="Filtrar por funcionário..."
                value={employeeSearch}
                onChange={e => { setEmployeeSearch(e.target.value); setShowEmployeeDropdown(true); }}
                onFocus={() => setShowEmployeeDropdown(true)}
                className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
              />
            )}
          </div>
          {showEmployeeDropdown && filteredEmployees.length > 0 && !selectedEmployee && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
              {filteredEmployees.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setSelectedEmployee(f); setEmployeeSearch(''); setShowEmployeeDropdown(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                >
                  {f.foto_url ? (
                    <img src={f.foto_url} className="w-7 h-7 rounded-full object-cover border border-border" alt="" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{f.nome.charAt(0)}</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{f.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{f.cargo} · {f.departamento}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Employee context banner */}
      {selectedEmployee && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 border-l-4 border-l-primary flex items-center gap-4">
          {selectedEmployee.foto_url ? (
            <img src={selectedEmployee.foto_url} className="w-12 h-12 rounded-full object-cover border-2 border-primary/30" alt="" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">{selectedEmployee.nome.charAt(0)}</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">{selectedEmployee.nome}</p>
            <p className="text-sm text-muted-foreground">{selectedEmployee.cargo} · {selectedEmployee.departamento} · Turno {selectedEmployee.turno || '—'}</p>
          </div>
          <button onClick={() => navigate(`/funcionario/${selectedEmployee.id}`)} className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium shrink-0">
            <Eye className="w-3.5 h-3.5" /> Ver Perfil
          </button>
        </motion.div>
      )}

      {/* ═══ WORKFLOW APROVAÇÕES 1-CLIQUE ═══ */}
      {!sel && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Aprovação Pendente: Ausência</p>
              <p className="text-xs text-muted-foreground">João Silva solicitou férias (10 dias a partir de 15/06).</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 bg-success/10 text-success hover:bg-success/20 px-3 py-1.5 rounded text-xs font-semibold transition-colors" onClick={() => alert('Aprovado!')}>
              <Check className="w-3.5 h-3.5" /> Aprovar
            </button>
            <button className="flex items-center gap-1 bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 py-1.5 rounded text-xs font-semibold transition-colors" onClick={() => alert('Rejeitado!')}>
              <XIcon className="w-3.5 h-3.5" /> Rejeitar
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══ MAIN KPIs (ENTERPRISE) ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Colaboradores" value={sel ? 1 : totalColaboradores} change={sel ? selectedEmployee?.cargo || '' : `${emFerias} em férias`} changeType="neutral" icon={Users} delay={0} />
        <StatCard title="Turnover" value="2.4%" change="-0.5% vs mês ant." changeType="positive" icon={UserX} delay={0.03} />
        <StatCard title="eNPS" value="78" change="Zona de Excelência" changeType="positive" icon={Activity} delay={0.06} />
        <StatCard title="Hrs Treinamento" value="42h" change="Média por colab." changeType="positive" icon={Briefcase} delay={0.09} />
        <StatCard title="Absenteísmo" value="1.5%" change={`${totalFaltasInj} faltas inj.`} changeType={totalFaltasInj > 0 ? 'negative' : 'positive'} icon={AlertTriangle} delay={0.12} />
        <StatCard title="Feedbacks" value={fbTotal} change={`${fbTaxaResolucao}% resolvidos`} changeType={fbTaxaResolucao >= 70 ? 'positive' : 'negative'} icon={MessageSquare} delay={0.15} />
      </div>

      {/* ═══ ROW 2 — Gauges + Status + Priority ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radial Gauge */}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              {gaugeData.map(g => (
                <div key={g.name} className="text-center">
                  <p className="text-2xl font-bold text-foreground">{g.value}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{g.name}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Feedback by Status */}
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

        {/* Feedback by Priority */}
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
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Evolução Diária — Ponto {sel ? `(${sel.nome})` : ''}
              </h2>
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

        {/* Headcount or Dept FB Performance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="corporate-section">
          <div className="corporate-section-header">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                {sel ? 'Resumo Individual' : 'Headcount por Depto.'}
              </h2>
            </div>
            {!sel && <span className="text-xs text-muted-foreground">{totalColaboradores} total</span>}
          </div>
          <div className="corporate-section-body space-y-3">
            {sel ? (
              // Individual summary
              <div className="space-y-4">
                {[
                  { label: 'Feedbacks Recebidos', value: fbTotal, color: 'text-primary' },
                  { label: 'Feedbacks Resolvidos', value: fbResolvidos, color: 'text-success' },
                  { label: 'Horas Negativas', value: totalHorasNeg, color: totalHorasNeg > 0 ? 'text-destructive' : 'text-success' },
                  { label: 'Extras', value: totalExtras, color: 'text-foreground' },
                  { label: 'Advertências', value: totalAdvertencias, color: totalAdvertencias > 0 ? 'text-destructive' : 'text-success' },
                  { label: 'Eventos', value: totalEvents, color: totalEvents > 0 ? 'text-warning' : 'text-success' },
                  { label: 'Reuniões 1:1', value: meetingsScheduled, color: 'text-foreground' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              headcountByDept.map((d, i) => (
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
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* ═══ ROW 4 — Secondary KPIs ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* ═══ ROW 5 — Meeting KPIs (Reunião Mensal Operacional) ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Mensal Operacional" value={`${meetingKpis.mensalRate}%`} change={`${meetingKpis.monthsWithMensal}/${meetingKpis.expectedMonths} meses realizados`} changeType={meetingKpis.mensalRate >= 80 ? 'positive' : 'negative'} icon={CalendarDays} delay={0.57} />
        <StatCard title="Cobertura Liderança" value={`${meetingKpis.leaderCoverage}%`} change={`${meetingKpis.attendedLeaders}/${meetingKpis.totalLeaders} líderes presentes`} changeType={meetingKpis.leaderCoverage >= 80 ? 'positive' : 'negative'} icon={UserCheck} delay={0.6} />
        <StatCard title="Ações Pendentes" value={meetingKpis.pendentes} change={`${meetingKpis.totalActions} total de ações`} changeType={meetingKpis.pendentes > 5 ? 'negative' : 'positive'} icon={Target} delay={0.63} />
        <StatCard title="Conclusão de Ações" value={`${meetingKpis.conclusionRate}%`} change={`${meetingKpis.concluidas}/${meetingKpis.totalActions} concluídas`} changeType={meetingKpis.conclusionRate >= 70 ? 'positive' : 'negative'} icon={CheckCircle2} delay={0.66} />
      </div>

      {/* ═══ Department FB Performance (only when no employee selected) ═══ */}
      {!sel && deptFbPerformance.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="corporate-section">
          <div className="corporate-section-header">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Performance de Feedbacks por Setor</h2>
            </div>
          </div>
          <div className="corporate-section-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptFbPerformance} margin={{ left: -5, right: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Resolvidos" stackId="a" fill="hsl(155, 60%, 38%)" radius={[0, 0, 0, 0]} barSize={24} />
                <Bar dataKey="Pendentes" stackId="a" fill="hsl(38, 90%, 50%)" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: 'hsl(155, 60%, 38%)' }} /> Resolvidos</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: 'hsl(38, 90%, 50%)' }} /> Pendentes</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ Top Deviations Table ═══ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="corporate-section">
        <div className="corporate-section-header">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {sel ? 'Desvios do Colaborador' : 'Top 7 — Colaboradores com Desvios'}
            </h2>
          </div>
          <button onClick={() => navigate('/ausencias')} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
            Ver Todos <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="corporate-section-body">
          {topDeviations.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={Math.max(topDeviations.length * 50, 180)}>
                <BarChart data={topDeviations} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    width={140}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="faltas" name="Faltas Inj." stackId="a" fill="hsl(0, 68%, 50%)" barSize={20} />
                  <Bar dataKey="atestados" name="Atestados" stackId="a" fill="hsl(200, 80%, 38%)" barSize={20} />
                  <Bar dataKey="advertencias" name="Advertências" stackId="a" fill="hsl(38, 90%, 50%)" barSize={20} />
                  <Bar dataKey="eventos" name="Eventos" stackId="a" fill="hsl(280, 60%, 55%)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center flex-wrap">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: 'hsl(0, 68%, 50%)' }} /> Faltas Inj.</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: 'hsl(200, 80%, 38%)' }} /> Atestados</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: 'hsl(38, 90%, 50%)' }} /> Advertências</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: 'hsl(280, 60%, 55%)' }} /> Eventos</div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum desvio registrado no período</p>
          )}
        </div>
      </motion.div>

      {/* ═══ Employee Grid (only when no filter) ═══ */}
      {!sel && (
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
      )}
    </div>
  );
}
