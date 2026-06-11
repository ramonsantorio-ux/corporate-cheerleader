import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, AlertTriangle, CheckCircle2,
  ArrowUpRight, ShieldAlert,
  Activity, Zap, AlertOctagon, HeartPulse, PieChart as PieChartIcon, Search, X, Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import {
  AreaChart, Area, RadialBarChart, RadialBar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip
} from 'recharts';

// ─── Types ───
interface Func { id: string; nome: string; cargo: string; departamento: string; foto_url: string; feedbacks_recebidos: number; feedbacks_resolvidos: number; turno: string; letra: string; data_admissao: string; }
interface FeedbackRow { id: string; setor: string; status: string; prioridade: string; criado_em: string; autor: string; }
interface AttendanceRow { id: string; employee_id: string; date: string; status: string; }
interface WarningRow { id: string; employee_id: string; date: string; applied: boolean; }
interface EventRow { id: string; event_date: string; involved_name: string; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg shadow-xl p-3 text-xs text-slate-100 z-50">
      <p className="font-bold mb-1 opacity-80">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span>{p.name}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
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

  // ─── KPIs & SCORE CALCULATION ───
  const totalColab = funcionarios.length;
  const fbTotal = periodFeedbacks.length;
  const fbResolvidos = periodFeedbacks.filter(f => f.status === 'resolvido').length;
  const fbTaxaResolucao = fbTotal > 0 ? Math.round((fbResolvidos / fbTotal) * 100) : 100;

  const totalFaltasInj = filteredAttendance.filter(a => a.status === 'falta' || a.status === 'falta_injustificada').length;
  const totalAtestados = filteredAttendance.filter(a => a.status === 'atestado').length;
  const absenteismo = totalColab > 0 ? Math.min(100, Math.round(((totalFaltasInj + totalAtestados) / (totalColab * 22)) * 100)) : 0;
  
  const totalAdvertencias = filteredWarnings.length;
  const totalEventsCount = filteredEvents.length;

  const riskEmployees = useMemo(() => {
    const warnCount: Record<string, number> = {};
    warnings.forEach(w => { warnCount[w.employee_id] = (warnCount[w.employee_id] || 0) + 1; });
    if (sel) return (warnCount[sel.id] || 0) >= 2 ? 1 : 0;
    return Object.entries(warnCount).filter(([, c]) => c >= 2).length;
  }, [warnings, sel]);

  // Corporate Health Score (0-100)
  const healthScore = useMemo(() => {
    if (sel) return 0;
    const hrScore = fbTaxaResolucao; // 0-100
    const opsScore = Math.max(0, 100 - (totalEventsCount * 2)); // Penalty for events
    const attScore = Math.max(0, 100 - (absenteismo * 10)); // Penalty for absenteism
    return Math.round((hrScore + opsScore + attScore) / 3);
  }, [fbTaxaResolucao, totalEventsCount, absenteismo, sel]);

  const healthColor = healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444';
  const gaugeData = [{ name: 'Score', value: healthScore, fill: healthColor }];

  // Radar Data (Gente & Gestão)
  const radarData = useMemo(() => {
    if (sel) return [];
    const deptMap: Record<string, { resolvidos: number; total: number }> = {};
    periodFeedbacks.forEach(f => {
      if (!deptMap[f.setor]) deptMap[f.setor] = { resolvidos: 0, total: 0 };
      deptMap[f.setor].total++;
      if (f.status === 'resolvido') deptMap[f.setor].resolvidos++;
    });
    return Object.entries(deptMap).map(([k, v]) => ({
      subject: k.length > 10 ? k.substring(0, 10) + '...' : k,
      A: v.total > 0 ? Math.round((v.resolvidos / v.total) * 100) : 0,
      fullMark: 100
    })).slice(0, 6);
  }, [periodFeedbacks, sel]);

  // Sparkline Mock Data
  const sparklineData = Array.from({ length: 15 }, (_, i) => ({ day: i, val: 50 + Math.random() * 50 }));

  if (loading) {
    return <div className="flex justify-center items-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Meu Painel</h1>
        <p className="text-muted-foreground">Acesso restrito para visualização executiva.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen pb-10">
      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-card/40 p-6 rounded-2xl border border-border backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div>
          <div className="flex items-center gap-2 mb-1 text-primary">
            <Zap className="w-5 h-5 fill-primary/20" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Cockpit Executivo</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Painel de Controladoria</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end w-full md:w-auto">
          <div className="w-full sm:w-64">
             <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              {selectedEmployee ? (
                <div className="flex items-center gap-2 bg-background border border-border rounded-lg pl-9 pr-3 py-2 w-full">
                  <span className="text-sm font-medium truncate flex-1">{selectedEmployee.nome}</span>
                  <button onClick={() => { setSelectedEmployee(null); setEmployeeSearch(''); }}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              ) : (
                <input
                  type="text" placeholder="Filtrar por Colaborador..." value={employeeSearch}
                  onChange={e => { setEmployeeSearch(e.target.value); setShowEmployeeDropdown(true); }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  className="bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm w-full outline-none focus:border-primary transition-colors"
                />
              )}
             </div>
             {showEmployeeDropdown && filteredEmployees.length > 0 && !selectedEmployee && (
              <div className="absolute mt-1 w-full sm:w-64 bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden">
                {filteredEmployees.map(f => (
                  <button key={f.id} onClick={() => { setSelectedEmployee(f); setEmployeeSearch(''); setShowEmployeeDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0 truncate">
                    {f.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
      </motion.div>

      {/* ── CRITICAL ALERTS BOARD ── */}
      <AnimatePresence>
        {!sel && (healthScore < 80 || riskEmployees > 0 || totalEventsCount > 5) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="bg-destructive/20 p-3 rounded-full shrink-0">
              <AlertOctagon className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-bold text-destructive uppercase tracking-wide">Alertas da Diretoria</h3>
              <div className="flex flex-wrap gap-2 text-xs font-medium text-destructive/80">
                {healthScore < 80 && <span className="bg-destructive/10 px-2 py-1 rounded-md">Saúde Corporativa em nível de Atenção ({healthScore}/100)</span>}
                {riskEmployees > 0 && <span className="bg-destructive/10 px-2 py-1 rounded-md">{riskEmployees} Colaboradores na Zona de Risco (SST/Disciplina)</span>}
                {totalEventsCount > 5 && <span className="bg-destructive/10 px-2 py-1 rounded-md">Alto Volume de Eventos Operacionais ({totalEventsCount})</span>}
                {absenteismo >= 5 && <span className="bg-destructive/10 px-2 py-1 rounded-md">Absenteísmo acima da meta ({absenteismo}%)</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ── LEFT COL: HEALTH SCORE ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-card rounded-2xl border border-border p-6 relative overflow-hidden flex-1 flex flex-col justify-center items-center shadow-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
              <HeartPulse className="w-4 h-4" /> Corporate Health
            </h2>
            
            <div className="w-full h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={gaugeData} startAngle={180} endAngle={0}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: 'hsl(var(--muted))' }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-6">
                <span className="text-5xl font-black tracking-tighter" style={{ color: healthColor }}>{healthScore}</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Score Geral</span>
              </div>
            </div>

            <div className="grid grid-cols-3 w-full gap-2 mt-4 text-center divide-x divide-border">
              <div>
                <p className="text-xl font-bold text-foreground">{fbTaxaResolucao}%</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">RH & Clima</p>
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{100 - (totalEventsCount * 2)}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">SST/Ops</p>
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{100 - (absenteismo * 10)}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Presença</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT COL: MACRO INDICATORS ── */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Absenteísmo Global", val: `${absenteismo}%`, target: "Meta: < 3%", icon: Users, trend: sparklineData, color: absenteismo < 3 ? '#10b981' : '#f59e0b' },
            { title: "Eventos Operacionais", val: totalEventsCount, target: "Impacto SST", icon: AlertTriangle, trend: sparklineData.slice().reverse(), color: totalEventsCount < 10 ? '#3b82f6' : '#ef4444' },
            { title: "Resolução de Demandas", val: `${fbTaxaResolucao}%`, target: "Meta: > 80%", icon: CheckCircle2, trend: sparklineData, color: fbTaxaResolucao >= 80 ? '#10b981' : '#f59e0b' },
            { title: "Advertências / Risco", val: totalAdvertencias, target: "Colabs: " + riskEmployees, icon: ShieldAlert, trend: sparklineData.slice(5), color: totalAdvertencias === 0 ? '#10b981' : '#ef4444' }
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.1 }} className="bg-card rounded-2xl border border-border p-5 flex flex-col justify-between group hover:border-primary/50 transition-colors shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{kpi.title}</p>
                  <h3 className="text-3xl font-black text-foreground">{kpi.val}</h3>
                  <p className="text-[10px] font-semibold text-muted-foreground mt-1 px-2 py-0.5 bg-muted rounded-full inline-block">{kpi.target}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                  <kpi.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
              <div className="h-12 w-full mt-auto opacity-50 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpi.trend}>
                    <defs>
                      <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={kpi.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={kpi.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="val" stroke={kpi.color} fill={`url(#grad-${i})`} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── RADAR DE LIDERANÇA ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
           <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 mb-6">
            <PieChartIcon className="w-4 h-4 text-primary" /> Radar de Engajamento por Setor
          </h2>
          <div className="h-[300px] w-full">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Resolução" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados suficientes no período.</div>
            )}
          </div>
        </motion.div>

        {/* ── MAPA DE CALOR / DESVIOS ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
           <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4 text-warning" /> Heatmap de Desvios (Top Ocorrências)
          </h2>
          <div className="space-y-4">
            {funcionarios.slice(0, 5).map((f, i) => {
              // Mock heatmap logic
              const score = Math.floor(Math.random() * 100);
              const color = score > 80 ? 'bg-destructive' : score > 50 ? 'bg-warning' : 'bg-success';
              return (
                <div key={f.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/funcionario/${f.id}`)}>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs shrink-0">{f.nome.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{f.nome}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{score} ocorrências</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, delay: 0.6 + i * 0.1 }} className={`h-full ${color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => navigate('/colaboradores')} className="mt-6 w-full py-2 bg-muted/50 hover:bg-muted text-xs font-bold text-foreground rounded-lg transition-colors">
            Ver Todos os Colaboradores
          </button>
        </motion.div>
      </div>

    </div>
  );
}
