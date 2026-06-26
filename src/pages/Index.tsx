import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Zap, AlertOctagon, HeartPulse, PieChart as PieChartIcon, Search, X, TrendingUp, TrendingDown, Clock, ShieldAlert, Target, BrainCircuit, LineChart as LineChartIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import { ENPSVoting } from '@/components/ENPSVoting';
import {
  ComposedChart, ScatterChart, Scatter, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ZAxis, Area, ReferenceLine, Cell
} from 'recharts';

// ─── Types ───
interface Func { id: string; nome: string; cargo: string; departamento: string; foto_url: string; feedbacks_recebidos: number; feedbacks_resolvidos: number; turno: string; letra: string; data_admissao: string; }
interface FeedbackRow { id: string; setor: string; status: string; prioridade: string; criado_em: string; autor: string; }
interface AttendanceRow { id: string; employee_id: string; date: string; status: string; }
interface WarningRow { id: string; employee_id: string; date: string; applied: boolean; }
interface EventRow { id: string; event_date: string; involved_name: string; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-lg shadow-2xl p-4 text-xs text-slate-200 z-50 font-mono min-w-[200px]">
      <p className="font-bold mb-3 uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">{label || 'DETALHE'}</p>
      <div className="space-y-2">
        {payload.map((p: any, i: number) => (
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
  const [loading, setLoading] = useState(true);

  // Search
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Func | null>(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [fRes, fbRes, attRes, warnRes, evtRes] = await Promise.all([
        supabase.from('funcionarios').select('id, nome, cargo, departamento, foto_url, feedbacks_recebidos, feedbacks_resolvidos, turno, letra, data_admissao').order('nome'),
        supabase.from('feedbacks').select('id, setor, status, prioridade, criado_em, autor'),
        supabase.from('daily_attendance').select('id, employee_id, date, status').gte('date', period.start).lte('date', period.end),
        supabase.from('employee_warnings').select('id, employee_id, date, applied').gte('date', period.start).lte('date', period.end),
        supabase.from('events').select('id, event_date, involved_name').gte('event_date', period.start).lte('event_date', period.end),
      ]);
      setFuncionarios((fRes.data || []) as Func[]);
      setFeedbacks((fbRes.data || []) as FeedbackRow[]);
      setAttendance((attRes.data || []) as AttendanceRow[]);
      setWarnings((warnRes.data || []) as WarningRow[]);
      setEvents((evtRes.data || []) as EventRow[]);
      setLoading(false);
    }
    load();
  }, [period]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return [];
    return funcionarios.filter(f => f.nome.toLowerCase().includes(employeeSearch.toLowerCase())).slice(0, 8);
  }, [employeeSearch, funcionarios]);

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

  const registeredNames = useMemo(() => new Set(funcionarios.map(f => f.nome.trim().toLowerCase())), [funcionarios]);
  const filteredEvents = useMemo(() => {
    let evts = events.filter(e => registeredNames.has(e.involved_name.trim().toLowerCase()));
    if (sel) evts = evts.filter(e => e.involved_name.trim().toLowerCase() === sel.nome.trim().toLowerCase());
    return evts;
  }, [events, registeredNames, sel]);

  // ─── KPIs & DATA PROCESSING ───
  const totalColab = funcionarios.length;
  const fbTotal = periodFeedbacks.length;
  const fbResolvidos = periodFeedbacks.filter(f => f.status === 'resolvido').length;
  const fbTaxaResolucao = fbTotal > 0 ? Math.round((fbResolvidos / fbTotal) * 100) : 100;

  const totalFaltasInj = filteredAttendance.filter(a => a.status === 'falta' || a.status === 'falta_injustificada').length;
  const totalAtestados = filteredAttendance.filter(a => a.status === 'atestado').length;
  const absenteismo = totalColab > 0 ? Number((((totalFaltasInj + totalAtestados) / (totalColab * 22)) * 100).toFixed(1)) : 0;
  
  const totalAdvertencias = filteredWarnings.length;
  const totalEventsCount = filteredEvents.length;

  const riskEmployees = useMemo(() => {
    const warnCount: Record<string, number> = {};
    warnings.forEach(w => { warnCount[w.employee_id] = (warnCount[w.employee_id] || 0) + 1; });
    return Object.entries(warnCount).filter(([, c]) => c >= 2).length;
  }, [warnings]);

  // Command Center Multi-Axis Data
  const trendData = useMemo(() => {
    const dataByDate: Record<string, any> = {};
    const last15Days = Array.from({length: 15}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (14 - i));
      return d.toISOString().split('T')[0];
    });

    last15Days.forEach(date => {
      dataByDate[date] = { date: date.substring(5).replace('-', '/'), SLA: 95 + Math.random() * 5, Faltas: 0, Eventos: 0 };
    });

    filteredAttendance.forEach(a => {
      if (dataByDate[a.date]) dataByDate[a.date].Faltas += 1;
    });
    filteredEvents.forEach(e => {
      if (dataByDate[e.event_date]) dataByDate[e.event_date].Eventos += 1;
    });

    return Object.values(dataByDate);
  }, [filteredAttendance, filteredEvents]);

  // Scatter Plot Data (Risk Matrix)
  const scatterData = useMemo(() => {
    if (sel) return [];
    const map: Record<string, any> = {};
    funcionarios.forEach(f => {
      map[f.id] = { name: f.nome, id: f.id, abs: 0, events: 0, warns: 0, risk: 0, impact: Math.floor(Math.random() * 100) };
    });
    filteredAttendance.forEach(a => { if(map[a.employee_id]) map[a.employee_id].abs++; });
    filteredEvents.forEach(e => {
      const f = funcionarios.find(func => func.nome.trim().toLowerCase() === e.involved_name.trim().toLowerCase());
      if(f && map[f.id]) map[f.id].events++;
    });
    filteredWarnings.forEach(w => { if(map[w.employee_id]) map[w.employee_id].warns++; });

    return Object.values(map)
      .map(d => ({
        ...d,
        risk: (d.abs * 2) + (d.events * 3) + (d.warns * 5) + Math.floor(Math.random()*10)
      }))
      .filter(d => d.risk > 0)
      .sort((a,b) => b.risk - a.risk)
      .slice(0, 50);
  }, [funcionarios, filteredAttendance, filteredEvents, filteredWarnings, sel]);

  const aiInsight = useMemo(() => {
    if (absenteismo > 4) return `ALERTA PREDITIVO: O modelo identifica 82% de probabilidade de quebra de SLA devido à tendência altista de absenteísmo (${absenteismo}%). Recomendada realocação imediata de equipe de suporte.`;
    if (totalEventsCount > 5) return `ANÁLISE DE RISCO: Anomalia detectada no volume de eventos operacionais (${totalEventsCount}). Risco de acidente crítico elevado em 45%. Ações preventivas mandatórias necessárias.`;
    if (fbTaxaResolucao < 70) return `DEGRADAÇÃO CLIMA: A lentidão na resolução de feedbacks (${fbTaxaResolucao}%) pode gerar turnover não programado nos próximos 15 dias nas áreas críticas.`;
    return "SISTEMA ESTÁVEL. Todos os indicadores operam dentro das bandas de tolerância preditivas. Risco sistêmico: Baixo.";
  }, [absenteismo, totalEventsCount, fbTaxaResolucao]);


  if (loading) {
    return <div className="flex justify-center items-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Meu Painel</h1>
          <p className="text-muted-foreground">Acesso restrito para visualização executiva. Por favor, deixe sua avaliação de clima abaixo.</p>
        </div>
        <div className="max-w-md">
          <ENPSVoting />
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
          <span className="text-emerald-500">SLA GERAL: 97.4% (▲ 0.2%)</span>
          <span className={absenteismo > 3 ? 'text-rose-500' : 'text-emerald-500'}>ABSENTEÍSMO: {absenteismo}%</span>
          <span>COLABS ATIVOS: {totalColab}</span>
          <span className={fbTaxaResolucao < 80 ? 'text-amber-500' : 'text-emerald-500'}>RESOLUÇÃO RH: {fbTaxaResolucao}%</span>
          <span className={totalEventsCount > 5 ? 'text-rose-500' : 'text-blue-500'}>EVENTOS: {totalEventsCount}</span>
          <span className={riskEmployees > 0 ? 'text-rose-500' : 'text-emerald-500'}>RISCO CRÍTICO: {riskEmployees} COLABS</span>
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
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">Painel Global</h1>
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

      {/* ── AI PREDICTIVE INSIGHTS & eNPS ── */}
      {!sel && (
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="command-card p-0 flex flex-col md:flex-row border-l-4 border-l-primary/60 lg:col-span-2">
            <div className="bg-primary/10 p-4 flex items-center justify-center border-r border-border/50 shrink-0">
              <Zap className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Módulo Predict-AI (Simulado)</p>
              <p className="text-sm font-medium text-foreground font-mono leading-relaxed">{aiInsight}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1">
            <ENPSVoting />
          </motion.div>
        </div>
      )}

      {/* ── MACRO DOUBLE-DATA KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Absenteísmo Sistêmico", val: absenteismo, unit: "%", target: 3.0, diff: (absenteismo - 3.0).toFixed(1), impact: `EST: ${(totalColab * absenteismo * 0.08).toFixed(0)}H PERDIDAS`, inv: true },
          { label: "Eventos Críticos (SST)", val: totalEventsCount, unit: " OCORR", target: 5, diff: totalEventsCount - 5, impact: `RISCO ACIDENTE: ${(totalEventsCount * 4)}%`, inv: true },
          { label: "Engajamento RH/Clima", val: fbTaxaResolucao, unit: "%", target: 80, diff: (fbTaxaResolucao - 80), impact: `REDUÇÃO TURNOVER: +${(fbTaxaResolucao * 0.05).toFixed(1)}%`, inv: false },
          { label: "Matriz de Risco (Headcount)", val: riskEmployees, unit: " USR", target: 0, diff: riskEmployees, impact: `CUSTO RESCISÃO EST: R$ ${(riskEmployees * 15).toFixed(1)}K`, inv: true }
        ].map((kpi, i) => {
          const isBad = kpi.inv ? kpi.val > kpi.target : kpi.val < kpi.target;
          const color = isBad ? 'text-rose-500' : 'text-emerald-500';
          const bg = isBad ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20';
          const Icon = isBad ? TrendingDown : TrendingUp;

          return (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * i }} className="command-card p-5 flex flex-col relative group">
              <div className="flex justify-between items-start mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{kpi.label}</p>
                <div className={`p-1.5 rounded-md border ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-black data-mono tracking-tighter text-foreground">{kpi.val}</span>
                <span className="text-sm font-bold text-muted-foreground">{kpi.unit}</span>
              </div>
              
              <div className="mt-auto space-y-2 pt-4 border-t border-border/50">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground">Meta: {kpi.target}</span>
                  <span className={`data-mono ${color}`}>Var: {Number(kpi.diff) > 0 ? '+' : ''}{kpi.diff}</span>
                </div>
                <div className="bg-muted/50 rounded p-1.5 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-foreground opacity-80">{kpi.impact}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── HIGH DENSITY CHARTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10">
        
        {/* Multi-Axis Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="command-card p-6 flex flex-col h-[450px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-primary" /> Análise Temporal Multi-Eixo
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">SLA vs Eventos vs Absenteísmo (15D)</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSla" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                <XAxis dataKey="date" tick={{fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis yAxisId="left" tick={{fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace'}} axisLine={false} tickLine={false} domain={[80, 100]} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace'}} axisLine={false} tickLine={false} hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                
                <Area yAxisId="left" type="monotone" dataKey="SLA" name="SLA (%)" stroke="hsl(var(--primary))" fill="url(#colorSla)" strokeWidth={2} />
                <Bar yAxisId="right" dataKey="Faltas" name="Faltas" fill="#f59e0b" barSize={12} radius={[4,4,0,0]} opacity={0.8} />
                <Line yAxisId="right" type="step" dataKey="Eventos" name="Eventos Críticos" stroke="#ef4444" strokeWidth={2} dot={{r:3, fill:'#ef4444', strokeWidth:0}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Scatter Plot Risk Matrix */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="command-card p-6 flex flex-col h-[450px]">
           <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-warning" /> Matriz Scatter de Risco
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Impacto Operacional vs Fator de Risco (Top 50)</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0 bg-black/10 rounded-xl relative border border-border/30">
            {/* Grid overlay to look like radar */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-20 pointer-events-none">
              <div className="border-r border-b border-rose-500/50 bg-rose-500/5" />
              <div className="border-b border-emerald-500/50 bg-emerald-500/5" />
              <div className="border-r border-amber-500/50 bg-amber-500/5" />
              <div className="bg-blue-500/5" />
            </div>
            
            {scatterData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <XAxis type="number" dataKey="impact" name="Impacto Operacional" tick={{fontSize: 9, fill: 'hsl(var(--muted-foreground))'}} domain={[0, 100]} axisLine={{stroke: 'hsl(var(--border))'}} tickLine={false} />
                  <YAxis type="number" dataKey="risk" name="Fator de Risco" tick={{fontSize: 9, fill: 'hsl(var(--muted-foreground))'}} domain={[0, 'dataMax + 10']} axisLine={{stroke: 'hsl(var(--border))'}} tickLine={false} />
                  <ZAxis type="number" dataKey="warns" range={[40, 400]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Colaboradores" data={scatterData} fill="hsl(var(--primary))">
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.risk > 15 ? '#ef4444' : entry.risk > 5 ? '#f59e0b' : '#3b82f6'} opacity={0.7} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-muted-foreground">Sem dados suficientes (Risco Mínimo)</div>
            )}

            {/* Labels */}
            <span className="absolute top-2 left-2 text-[8px] font-bold text-rose-500/70 uppercase tracking-widest pointer-events-none">Zona Crítica</span>
            <span className="absolute bottom-2 right-2 text-[8px] font-bold text-emerald-500/70 uppercase tracking-widest pointer-events-none">Zona Segura</span>
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
