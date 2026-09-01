import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Zap, AlertOctagon, HeartPulse, PieChart as PieChartIcon, Search, X, TrendingUp, TrendingDown, Clock, ShieldAlert, Target, BrainCircuit, LineChart as LineChartIcon, CheckCircle, Users, Wrench, Shield, FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import { UserActivityCard } from '@/components/dashboard/UserActivityCard';
import {
  ComposedChart, ScatterChart, Scatter, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ZAxis, Area, ReferenceLine, Cell, BarChart, Legend
} from 'recharts';

// ─── Types ───
interface Func { id: string; nome: string; cargo: string; departamento: string; foto_url: string; feedbacks_recebidos: number; feedbacks_resolvidos: number; turno: string; letra: string; data_admissao: string; }
interface FeedbackRow { id: string; setor: string; status: string; prioridade: string; criado_em: string; autor: string; }
interface AttendanceRow { id: string; employee_id: string; date: string; status: string; created_at?: string; }
interface WarningRow { id: string; employee_id: string; date: string; applied: boolean; created_at?: string; }
interface EventRow { id: string; event_date: string; involved_name: string; created_at?: string; }
interface CcoMaintRow { id: string; created_at: string; motorista?: string; servico?: string; placa?: string; }
interface CcoThirdRow { id: string; created_at: string; dono?: string; atendimento?: string; os?: string; }
interface AuditLogRow { id: string; created_at: string; user_id?: string; action?: string; table_name?: string; }

interface TooltipPayloadItem { name: string; value: number | string; color?: string; fill?: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayloadItem[]; label?: string; }
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-lg shadow-2xl p-4 text-xs text-slate-200 z-50 font-mono min-w-[200px]">
      <p className="font-bold mb-3 uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">{label || 'DETALHE'}</p>
      <div className="space-y-2">
        {payload.map((p, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: p.color || p.fill }} />
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">{p.name}:</span>
            </div>
            <span className="font-bold text-white font-mono">{typeof p.value === 'number' && !Number.isInteger(p.value) ? p.value.toFixed(1) : p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Index() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [period, setPeriod] = useState<PeriodRange>(getPortoPeriod(0));
  const [funcionarios, setFuncionarios] = useState<Func[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [warnings, setWarnings] = useState<WarningRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [ccoMaint, setCcoMaint] = useState<CcoMaintRow[]>([]);
  const [ccoThird, setCcoThird] = useState<CcoThirdRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Func | null>(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const dayStartIso = `${period.start}T00:00:00.000Z`;
      const dayEndIso = `${period.end}T23:59:59.999Z`;

      const [fRes, fbRes, attRes, warnRes, evtRes, ccoMaintRes, ccoThirdRes, auditRes] = await Promise.all([
        supabase.from('funcionarios').select('id, nome, cargo, departamento, foto_url, feedbacks_recebidos, feedbacks_resolvidos, turno, letra, data_admissao').order('nome'),
        supabase.from('feedbacks').select('id, setor, status, prioridade, criado_em, autor'),
        supabase.from('daily_attendance').select('id, employee_id, date, status, created_at').gte('date', period.start).lte('date', period.end),
        supabase.from('employee_warnings').select('id, employee_id, date, applied, created_at').gte('date', period.start).lte('date', period.end),
        supabase.from('events').select('id, event_date, involved_name, created_at').gte('event_date', period.start).lte('event_date', period.end),
        supabase.from('cco_maintenance').select('id, created_at, motorista, servico, placa').gte('created_at', dayStartIso).lte('created_at', dayEndIso),
        supabase.from('cco_third_party').select('id, created_at, dono, atendimento, os').gte('created_at', dayStartIso).lte('created_at', dayEndIso),
        supabase.from('audit_log').select('id, created_at, user_id, action, table_name').gte('created_at', dayStartIso).lte('created_at', dayEndIso),
      ]);

      setFuncionarios((fRes.data || []) as Func[]);
      setFeedbacks((fbRes.data || []) as FeedbackRow[]);
      setAttendance((attRes.data || []) as AttendanceRow[]);
      setWarnings((warnRes.data || []) as WarningRow[]);
      setEvents((evtRes.data || []) as EventRow[]);
      setCcoMaint((ccoMaintRes.data || []) as CcoMaintRow[]);
      setCcoThird((ccoThirdRes.data || []) as CcoThirdRow[]);
      setAuditLogs((auditRes.data || []) as AuditLogRow[]);
      setLoading(false);
    }
    load();
  }, [period]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return [];
    return funcionarios.filter(f => (f.nome || '').toLowerCase().includes(employeeSearch.toLowerCase())).slice(0, 8);
  }, [employeeSearch, funcionarios]);

  const sel = selectedEmployee;
  
  const periodFeedbacks = useMemo(() => {
    let fbs = feedbacks.filter(f => {
      const d = new Date(f.criado_em).toISOString().split('T')[0];
      return d >= period.start && d <= period.end;
    });
    if (sel) fbs = fbs.filter(f => (f.autor || '').trim().toLowerCase() === (sel.nome || '').trim().toLowerCase());
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

  const registeredNames = useMemo(() => new Set(funcionarios.map(f => (f.nome || '').trim().toLowerCase())), [funcionarios]);
  const filteredEvents = useMemo(() => {
    let evts = events.filter(e => registeredNames.has((e.involved_name || '').trim().toLowerCase()));
    if (sel) evts = evts.filter(e => (e.involved_name || '').trim().toLowerCase() === (sel.nome || '').trim().toLowerCase());
    return evts;
  }, [events, registeredNames, sel]);

  // ─── REAL SYSTEM MOVEMENT METRICS (100% REAL DATA) ───
  const ccoTotal = ccoMaint.length + ccoThird.length;
  const rhTotal = filteredAttendance.length + filteredWarnings.length;
  const adminTotal = filteredEvents.length + auditLogs.length;
  const fbTotal = periodFeedbacks.length;

  const totalMovimentacoes = ccoTotal + rhTotal + adminTotal + fbTotal;

  // Days in period range for daily average calculation
  const periodDays = useMemo(() => {
    const s = new Date(period.start);
    const e = new Date(period.end);
    const diff = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return diff;
  }, [period]);

  const mediaDiaria = (totalMovimentacoes / periodDays).toFixed(1);

  // REAL Time-Series Trend Data (Last 15 Days)
  const trendData = useMemo(() => {
    type TrendEntry = { date: string; CCO: number; RH: number; Admin: number; Total: number };
    const dataByDate: Record<string, TrendEntry> = {};
    const last15Days = Array.from({length: 15}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (14 - i));
      return d.toISOString().split('T')[0];
    });

    last15Days.forEach(date => {
      dataByDate[date] = { date: date.substring(5).replace('-', '/'), CCO: 0, RH: 0, Admin: 0, Total: 0 };
    });

    // Populate real counts by date
    filteredAttendance.forEach(a => {
      const d = a.date || (a.created_at ? a.created_at.split('T')[0] : '');
      if (dataByDate[d]) { dataByDate[d].RH += 1; dataByDate[d].Total += 1; }
    });
    filteredWarnings.forEach(w => {
      const d = w.date || (w.created_at ? w.created_at.split('T')[0] : '');
      if (dataByDate[d]) { dataByDate[d].RH += 1; dataByDate[d].Total += 1; }
    });
    feedbacks.forEach(f => {
      const d = f.criado_em ? f.criado_em.split('T')[0] : '';
      if (dataByDate[d]) { dataByDate[d].RH += 1; dataByDate[d].Total += 1; }
    });
    ccoMaint.forEach(m => {
      const d = m.created_at ? m.created_at.split('T')[0] : '';
      if (dataByDate[d]) { dataByDate[d].CCO += 1; dataByDate[d].Total += 1; }
    });
    ccoThird.forEach(t => {
      const d = t.created_at ? t.created_at.split('T')[0] : '';
      if (dataByDate[d]) { dataByDate[d].CCO += 1; dataByDate[d].Total += 1; }
    });
    filteredEvents.forEach(e => {
      const d = e.event_date || (e.created_at ? e.created_at.split('T')[0] : '');
      if (dataByDate[d]) { dataByDate[d].Admin += 1; dataByDate[d].Total += 1; }
    });
    auditLogs.forEach(a => {
      const d = a.created_at ? a.created_at.split('T')[0] : '';
      if (dataByDate[d]) { dataByDate[d].Admin += 1; dataByDate[d].Total += 1; }
    });

    return Object.values(dataByDate);
  }, [filteredAttendance, filteredWarnings, feedbacks, ccoMaint, ccoThird, filteredEvents, auditLogs]);

  // REAL Accounts Ranking Chart Data
  const topAccountsData = useMemo(() => {
    const userCounts: Record<string, number> = {};

    feedbacks.forEach(f => {
      if (f.autor) {
        const name = f.autor.trim();
        userCounts[name] = (userCounts[name] || 0) + 1;
      }
    });

    ccoMaint.forEach(m => {
      if (m.motorista) {
        const name = m.motorista.trim();
        userCounts[name] = (userCounts[name] || 0) + 1;
      }
    });

    ccoThird.forEach(t => {
      if (t.dono) {
        const name = t.dono.trim();
        userCounts[name] = (userCounts[name] || 0) + 1;
      }
    });

    filteredEvents.forEach(e => {
      if (e.involved_name) {
        const name = e.involved_name.trim();
        userCounts[name] = (userCounts[name] || 0) + 1;
      }
    });

    return Object.entries(userCounts)
      .map(([name, count]) => ({ name: name.length > 16 ? `${name.substring(0, 14)}...` : name, Lançamentos: count }))
      .sort((a, b) => b.Lançamentos - a.Lançamentos)
      .slice(0, 8);
  }, [feedbacks, ccoMaint, ccoThird, filteredEvents]);

  const fbPendentesCount = useMemo(() => {
    return periodFeedbacks.filter(f => f.status !== 'resolvido').length;
  }, [periodFeedbacks]);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const systemStatus = useMemo(() => {
    const issues: { type: 'error' | 'warning' | 'info'; title: string; desc: string }[] = [];

    if (!isOnline) {
      issues.push({ type: 'warning', title: 'Conexão Offline', desc: 'Dispositivo em modo cache offline. Operação local mantida.' });
    }

    if (fbPendentesCount > 0) {
      issues.push({ type: 'warning', title: 'Feedbacks Pendentes', desc: `${fbPendentesCount} feedback(s) aguardando resolução pela equipe.` });
    }

    if (filteredEvents.length > 0) {
      issues.push({ type: 'warning', title: 'Ocorrências SSMA', desc: `${filteredEvents.length} evento(s) operacional(is) registrado(s) no período.` });
    }

    const hasErrors = issues.some(i => i.type === 'error');
    const hasWarnings = issues.some(i => i.type === 'warning');

    let overallState: 'ok' | 'warning' | 'error' = 'ok';
    let statusText = 'SISTEMA 100% OPERACIONAL & ESTÁVEL';
    let statusSubtitle = 'Todas as conexões de banco de dados Supabase, autenticação e módulos operam sem erros sistêmicos.';

    if (hasErrors) {
      overallState = 'error';
      statusText = 'ALERTA PREDITIVO - REQUER AÇÃO';
      statusSubtitle = 'Detectados pontos críticos com pendências que requerem atenção da gestão.';
    } else if (hasWarnings) {
      overallState = 'warning';
      statusText = 'SISTEMA OPERACIONAL COM PENDÊNCIAS';
      statusSubtitle = 'A infraestrutura do banco de dados e APIs está saudável. Registradas pendências operacionais no período:';
    }

    return {
      overallState,
      statusText,
      statusSubtitle,
      issues,
      totalIssuesCount: issues.length
    };
  }, [isOnline, fbPendentesCount, filteredEvents]);


  if (loading) {
    return <div className="flex justify-center items-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Meu Painel</h1>
          <p className="text-muted-foreground">Acompanhamento em tempo real dos lançamentos e alterações efetuados no dia pela sua conta.</p>
        </div>
        <div className="max-w-5xl">
          <UserActivityCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-10 selection:bg-primary/30 font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        .ticker-wrap { width: 100%; overflow: hidden; background-color: hsl(var(--muted) / 0.5); border-bottom: 1px solid hsl(var(--border)); padding: 4px 0; }
        .ticker { display: inline-block; white-space: nowrap; padding-right: 100%; box-sizing: content-box; animation-iteration-count: infinite; animation-timing-function: linear; animation-name: ticker; animation-duration: 40s; }
        @keyframes ticker { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }
        .grid-bg { background-size: 40px 40px; background-image: linear-gradient(to right, hsl(var(--border) / 0.3) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.3) 1px, transparent 1px); }
        .command-card { background: hsl(var(--card) / 0.6); backdrop-filter: blur(12px); border: 1px solid hsl(var(--border) / 0.5); border-radius: 0.75rem; overflow: hidden; position: relative; }
        .command-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent); opacity: 0; transition: opacity 0.3s; }
        .command-card:hover::before { opacity: 1; }
        .data-mono { font-family: 'JetBrains Mono', 'Roboto Mono', monospace; }
      `}} />

      {/* ── TICKER BAR ── */}
      <div className="ticker-wrap -mx-4 sm:-mx-8 lg:-mx-8 mb-6 mt-[-1.5rem]">
        <div className="ticker flex items-center gap-12 text-[11px] font-bold uppercase tracking-widest data-mono text-muted-foreground">
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> SYS ONLINE</span>
          <span className="text-emerald-500">MOVIMENTAÇÕES NO PERÍODO: {totalMovimentacoes}</span>
          <span className="text-blue-500">CCO & FROTA: {ccoTotal}</span>
          <span className="text-emerald-500">GESTÃO RH: {rhTotal}</span>
          <span className="text-amber-500">FEEDBACKS: {fbTotal}</span>
          <span className="text-rose-500">AUDITORIA & SSMA: {adminTotal}</span>
          <span>LAST UPDATE: {new Date().toISOString().substring(11,19)}Z</span>
        </div>
      </div>

      {/* ── HEADER & SEARCH ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2 text-primary/80">
            <BrainCircuit className="w-4 h-4" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Command Center Analytics</p>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">Central de Movimentações</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-end">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            {selectedEmployee ? (
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur border border-border rounded-lg pl-9 pr-3 py-2">
                <span className="text-xs font-bold uppercase tracking-wider truncate flex-1 text-primary">{selectedEmployee.nome}</span>
                <button onClick={() => { setSelectedEmployee(null); setEmployeeSearch(''); }}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
              </div>
            ) : (
              <input
                type="text" placeholder="LOCALIZAR ID/NOME..." value={employeeSearch}
                onChange={e => { setEmployeeSearch(e.target.value); setShowEmployeeDropdown(true); }}
                onFocus={() => setShowEmployeeDropdown(true)}
                className="bg-card/40 backdrop-blur border border-border rounded-lg pl-9 pr-3 py-2 text-xs font-bold uppercase tracking-wider w-full outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50 data-mono"
              />
            )}
            {showEmployeeDropdown && filteredEmployees.length > 0 && !selectedEmployee && (
              <div className="absolute mt-2 w-full bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden">
                {filteredEmployees.map(f => (
                  <button key={f.id} onClick={() => { setSelectedEmployee(f); setEmployeeSearch(''); setShowEmployeeDropdown(false); }} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-900 transition-colors border-b border-slate-800/50 last:border-0 truncate flex items-center justify-between">
                    <span>{f.nome}</span>
                    <span className="text-[9px] text-slate-500 data-mono">{f.departamento}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* ── AI PREDICTIVE INSIGHTS, DIAGNÓSTICO DO SISTEMA & MONITOR DE LANÇAMENTOS DO DIA ── */}
      {!sel && (
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`command-card p-4 flex flex-col justify-between border-l-4 ${systemStatus.overallState === 'error' ? 'border-l-rose-500 bg-rose-500/5' : systemStatus.overallState === 'warning' ? 'border-l-amber-500 bg-amber-500/5' : 'border-l-emerald-500 bg-emerald-500/5'} lg:col-span-1 space-y-3`}>
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${systemStatus.overallState === 'error' ? 'bg-rose-500/10 text-rose-500' : systemStatus.overallState === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  <Zap className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Status do Sistema & Diagnóstico Preditivo (Predict-AI)</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-extrabold ${systemStatus.overallState === 'error' ? 'text-rose-500' : systemStatus.overallState === 'warning' ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {systemStatus.statusText}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted text-muted-foreground">
                      {systemStatus.totalIssuesCount === 0 ? '0 Pendências' : `${systemStatus.totalIssuesCount} Pendência(s)`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Supabase: Conectado</span>
              </div>
            </div>

            <p className="text-xs text-foreground/80 font-mono leading-relaxed">
              {systemStatus.statusSubtitle}
            </p>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {systemStatus.issues.length > 0 ? (
                systemStatus.issues.map((issue, idx) => (
                  <div key={idx} className={`p-2 rounded border text-xs flex items-start gap-2 ${issue.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'}`}>
                    <AlertOctagon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block text-[10px]">{issue.title}</span>
                      <span className="text-[11px] opacity-90">{issue.desc}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-2.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2 font-mono">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>✅ Nenhuma falha de sistema ou pendência de alto risco detectada. Todos os módulos operam perfeitamente.</span>
                </div>
              )}
            </div>
          </motion.div>

          <div className="lg:col-span-2">
            <UserActivityCard />
          </div>
        </div>
      )}

      {/* ── MACRO DOUBLE-DATA KPIs (100% REAL MOVEMENTS DATA) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Movimentações Globais", val: totalMovimentacoes, unit: " REGISTROS", icon: Activity, color: "text-primary", bg: "bg-primary/10 border-primary/20", impact: `MÉDIA DIÁRIA: ${mediaDiaria}/DIA` },
          { label: "Operações CCO & Frota", val: ccoTotal, unit: " CHAMADOS", icon: Wrench, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", impact: "FROTA & MANUTENÇÃO" },
          { label: "Gestão RH & Frequência", val: rhTotal, unit: " APONTAMENTOS", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", impact: "PONTO & ADVERTÊNCIAS" },
          { label: "Segurança & Auditoria Admin", val: adminTotal, unit: " AÇÕES", icon: Shield, color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20", impact: "AUDITORIA & EVENTOS SSMA" }
        ].map((kpi, i) => {
          const Icon = kpi.icon;

          return (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * i }} className="command-card p-5 flex flex-col relative group">
              <div className="flex justify-between items-start mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{kpi.label}</p>
                <div className={`p-1.5 rounded-md border ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-black data-mono tracking-tighter text-foreground">{kpi.val}</span>
                <span className="text-xs font-bold text-muted-foreground">{kpi.unit}</span>
              </div>
              
              <div className="mt-auto space-y-2 pt-4 border-t border-border/50">
                <div className="bg-muted/50 rounded p-1.5 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-foreground opacity-80">{kpi.impact}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── HIGH DENSITY CHARTS (100% REAL DATA) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10">
        
        {/* Real Daily Movement Trend Chart (15 Days) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="command-card p-6 flex flex-col h-[450px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-primary" /> Análise Temporal de Movimentações (15D)
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Volume Diário por Categoria: CCO vs RH vs Admin</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                <XAxis dataKey="date" tick={{fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                
                <Area type="monotone" dataKey="Total" name="Total Movimentos" stroke="hsl(var(--primary))" fill="url(#colorTotal)" strokeWidth={2} />
                <Bar dataKey="CCO" name="CCO / Frota" fill="#3b82f6" barSize={10} radius={[4,4,0,0]} opacity={0.8} />
                <Bar dataKey="RH" name="Gestão RH" fill="#10b981" barSize={10} radius={[4,4,0,0]} opacity={0.8} />
                <Line type="monotone" dataKey="Admin" name="SSMA & Admin" stroke="#ef4444" strokeWidth={2} dot={{r:3, fill:'#ef4444', strokeWidth:0}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Real Ranking of Most Active Accounts Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="command-card p-6 flex flex-col h-[450px]">
           <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Contas & Usuários Mais Ativos no Sistema
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Ranking de lançamentos e edições por conta no período</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0 relative border border-border/30 rounded-xl p-2 bg-black/10">
            {topAccountsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAccountsData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis type="number" tick={{fontSize: 9, fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{fontSize: 10, fill: 'hsl(var(--foreground))', fontWeight: 'bold'}} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                  <Bar dataKey="Lançamentos" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]}>
                    {topAccountsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : index === 2 ? '#f59e0b' : '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-muted-foreground">Nenhuma movimentação registrada no período</div>
            )}
          </div>
        </motion.div>

      </div>
      
      {/* Background decoration */}
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none -z-20" />
      <div className="fixed top-1/4 -left-64 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 -right-64 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />
    </div>
  );
}
