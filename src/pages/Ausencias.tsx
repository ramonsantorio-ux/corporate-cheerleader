import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays, Plus, Loader2, Trash2, Check, X, Clock, AlertTriangle,
  Upload, Download, Users, TrendingUp, Sun, Moon, Briefcase, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Attendance {
  id: string; employee_id: string; date: string; status: string;
  observation: string; created_at: string; employee_name?: string;
  turno?: string; letra?: string; cargo?: string;
}

interface VacationRecord {
  id: string; employee_id: string; last_vacation_year1: string; last_vacation_year2: string;
  days_count: number; scheduled_month: string; start_date: string | null; end_date: string | null;
  remaining_days: number | null; observation: string; employee_name?: string;
  turno?: string; letra?: string; cargo?: string;
}

interface OvertimeRecord {
  id: string; employee_id: string; period_start: string; period_end: string;
  extras_count: number; max_extras: number; employee_name?: string;
}

interface Func { id: string; nome: string; turno: string; letra: string; cargo: string; }

const statusLabels: Record<string, string> = {
  presente: 'Presente', falta: 'Falta', falta_justificada: 'Falta Justificada',
  atestado: 'Atestado', extra: 'Extra', ferias: 'Férias', afastamento: 'Afastamento',
  abono: 'Abono', banco_horas: 'Banco de Horas',
};

const statusColors: Record<string, string> = {
  presente: 'hsl(var(--success))', falta: 'hsl(var(--destructive))',
  falta_justificada: 'hsl(35, 90%, 50%)', atestado: 'hsl(200, 70%, 50%)',
  extra: 'hsl(260, 60%, 55%)', ferias: 'hsl(160, 60%, 45%)',
  afastamento: 'hsl(0, 50%, 50%)', abono: 'hsl(45, 80%, 50%)',
  banco_horas: 'hsl(220, 60%, 55%)',
};

const PIE_COLORS = ['#0d9488', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#dc2626', '#eab308', '#6366f1'];

// ─── Helper to get current period (21st to 20th) ────────────────────────────
function getCurrentPeriod() {
  const now = new Date();
  const day = now.getDate();
  let start: Date, end: Date;
  if (day >= 21) {
    start = new Date(now.getFullYear(), now.getMonth(), 21);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 20);
  } else {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 21);
    end = new Date(now.getFullYear(), now.getMonth(), 20);
  }
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label: `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
  };
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function PontoFerias() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [vacations, setVacations] = useState<VacationRecord[]>([]);
  const [overtimes, setOvertimes] = useState<OvertimeRecord[]>([]);
  const [funcionarios, setFuncionarios] = useState<Func[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ponto');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vacDialogOpen, setVacDialogOpen] = useState(false);
  const period = getCurrentPeriod();

  const [form, setForm] = useState({ employee_id: '', date: '', status: 'presente', observation: '' });
  const [vacForm, setVacForm] = useState({
    employee_id: '', days_count: '30', scheduled_month: '', start_date: '', end_date: '', observation: ''
  });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [attRes, vacRes, ovtRes, fRes] = await Promise.all([
      supabase.from('daily_attendance').select('*').gte('date', period.start).lte('date', period.end).order('date', { ascending: false }),
      supabase.from('vacation_control').select('*'),
      supabase.from('overtime_control').select('*').gte('period_start', period.start).lte('period_end', period.end),
      supabase.from('funcionarios').select('id, nome, turno, letra, cargo').order('nome'),
    ]);
    const funcs = (fRes.data || []) as Func[];
    setFuncionarios(funcs);
    const nameMap = Object.fromEntries(funcs.map(f => [f.id, f]));

    setAttendance((attRes.data || []).map((a: any) => ({
      ...a, employee_name: nameMap[a.employee_id]?.nome || 'Desconhecido',
      turno: nameMap[a.employee_id]?.turno, letra: nameMap[a.employee_id]?.letra,
      cargo: nameMap[a.employee_id]?.cargo,
    })));
    setVacations((vacRes.data || []).map((v: any) => ({
      ...v, employee_name: nameMap[v.employee_id]?.nome || 'Desconhecido',
      turno: nameMap[v.employee_id]?.turno, letra: nameMap[v.employee_id]?.letra,
      cargo: nameMap[v.employee_id]?.cargo,
    })));
    setOvertimes((ovtRes.data || []).map((o: any) => ({
      ...o, employee_name: nameMap[o.employee_id]?.nome || 'Desconhecido',
    })));
    setLoading(false);
  }

  // ─── Ponto registration with overtime limit enforcement ────────────────
  async function handleCreateAttendance() {
    if (!form.employee_id || !form.date) { toast.error('Preencha os campos obrigatórios'); return; }

    // Enforce 3 extras limit
    if (form.status === 'extra') {
      const { count } = await supabase.from('daily_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', form.employee_id)
        .eq('status', 'extra')
        .gte('date', period.start).lte('date', period.end);

      if ((count || 0) >= 3) {
        toast.error('⚠️ LIMITE ATINGIDO: Este colaborador já realizou 3 extras neste período. Não é permitido registrar mais.');
        return;
      }
    }

    const { error } = await supabase.from('daily_attendance').insert({
      employee_id: form.employee_id, date: form.date, status: form.status, observation: form.observation,
    });
    if (error) {
      if (error.code === '23505') toast.error('Já existe registro para este colaborador nesta data');
      else toast.error('Erro ao registrar ponto');
      return;
    }

    // Update overtime control
    if (form.status === 'extra') {
      const { data: existing } = await supabase.from('overtime_control')
        .select('*').eq('employee_id', form.employee_id)
        .eq('period_start', period.start).eq('period_end', period.end).maybeSingle();

      if (existing) {
        await supabase.from('overtime_control').update({
          extras_count: (existing as any).extras_count + 1, updated_at: new Date().toISOString()
        }).eq('id', (existing as any).id);
      } else {
        await supabase.from('overtime_control').insert({
          employee_id: form.employee_id, period_start: period.start, period_end: period.end, extras_count: 1, max_extras: 3,
        });
      }
    }

    setDialogOpen(false);
    setForm({ employee_id: '', date: '', status: 'presente', observation: '' });
    toast.success('Ponto registrado com sucesso');
    fetchAll();
  }

  // ─── Vacation registration ─────────────────────────────────────────────
  async function handleCreateVacation() {
    if (!vacForm.employee_id) { toast.error('Selecione o funcionário'); return; }
    const { error } = await supabase.from('vacation_control').upsert({
      employee_id: vacForm.employee_id,
      days_count: parseInt(vacForm.days_count) || 30,
      scheduled_month: vacForm.scheduled_month,
      start_date: vacForm.start_date || null, end_date: vacForm.end_date || null,
      observation: vacForm.observation,
      remaining_days: vacForm.start_date && vacForm.end_date
        ? Math.ceil((new Date(vacForm.end_date).getTime() - new Date().getTime()) / 86400000)
        : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'employee_id' });
    if (error) { toast.error('Erro ao registrar férias'); return; }
    setVacDialogOpen(false);
    setVacForm({ employee_id: '', days_count: '30', scheduled_month: '', start_date: '', end_date: '', observation: '' });
    toast.success('Férias registradas!');
    fetchAll();
  }

  async function deleteAttendance(id: string) {
    await supabase.from('daily_attendance').delete().eq('id', id);
    toast.success('Registro removido');
    fetchAll();
  }

  async function deleteVacation(id: string) {
    await supabase.from('vacation_control').delete().eq('id', id);
    toast.success('Registro removido');
    fetchAll();
  }

  // ─── Computed data ─────────────────────────────────────────────────────
  const vacationAlerts = useMemo(() => {
    const today = new Date();
    return vacations.filter(v => {
      if (!v.start_date || !v.end_date) return false;
      const start = new Date(v.start_date);
      const end = new Date(v.end_date);
      return (today >= start && today <= end) || (start.getTime() - today.getTime() <= 7 * 86400000 && start > today);
    });
  }, [vacations]);

  const overtimeLimitAlerts = useMemo(() => {
    const extrasMap: Record<string, number> = {};
    attendance.filter(a => a.status === 'extra').forEach(a => {
      extrasMap[a.employee_id] = (extrasMap[a.employee_id] || 0) + 1;
    });
    return Object.entries(extrasMap)
      .filter(([, count]) => count >= 3)
      .map(([empId, count]) => ({
        employee_name: attendance.find(a => a.employee_id === empId)?.employee_name || 'Desconhecido',
        count,
      }));
  }, [attendance]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    attendance.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return Object.entries(counts).map(([status, value]) => ({
      name: statusLabels[status] || status, value, fill: statusColors[status] || '#94a3b8'
    }));
  }, [attendance]);

  const dailyChartData = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {};
    attendance.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = {};
      byDate[a.date][a.status] = (byDate[a.date][a.status] || 0) + 1;
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-15)
      .map(([date, statuses]) => ({
        date: new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        Presentes: statuses.presente || 0,
        Faltas: (statuses.falta || 0) + (statuses.falta_justificada || 0),
        Extras: statuses.extra || 0,
        Atestados: statuses.atestado || 0,
        Férias: statuses.ferias || 0,
      }));
  }, [attendance]);

  const extrasPerEmployee = useMemo(() => {
    const map: Record<string, { name: string; count: number; limit: number }> = {};
    attendance.filter(a => a.status === 'extra').forEach(a => {
      if (!map[a.employee_id]) map[a.employee_id] = { name: a.employee_name || '', count: 0, limit: 3 };
      map[a.employee_id].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [attendance]);

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      presente: 'bg-success/10 text-success', falta: 'bg-destructive/10 text-destructive',
      falta_justificada: 'bg-warning/10 text-warning', atestado: 'bg-blue-500/10 text-blue-600',
      extra: 'bg-purple-500/10 text-purple-600', ferias: 'bg-teal-500/10 text-teal-600',
      afastamento: 'bg-red-500/10 text-red-600', abono: 'bg-yellow-500/10 text-yellow-700',
      banco_horas: 'bg-indigo-500/10 text-indigo-600',
    };
    return colors[s] || 'bg-muted text-muted-foreground';
  };

  // ─── Custom Tooltip ────────────────────────────────────────────────────
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ponto / Férias</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Controle diário e gestão de férias · Período: <span className="font-medium text-foreground">{period.label}</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── Alerts Banner ──────────────────────────────────────────── */}
      {(vacationAlerts.length > 0 || overtimeLimitAlerts.length > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {vacationAlerts.map(v => {
            const start = new Date(v.start_date!);
            const today = new Date();
            const isOnVacation = today >= start && today <= new Date(v.end_date!);
            return (
              <div key={v.id} className={`flex items-center gap-3 rounded-lg p-3 border ${isOnVacation ? 'bg-teal-500/5 border-teal-500/20' : 'bg-warning/5 border-warning/20'}`}>
                <Sun className={`w-4 h-4 flex-shrink-0 ${isOnVacation ? 'text-teal-500' : 'text-warning'}`} />
                <p className="text-sm">
                  <span className="font-semibold">{v.employee_name}</span>
                  {isOnVacation
                    ? ` está de férias até ${formatDate(v.end_date)}`
                    : ` inicia férias em ${formatDate(v.start_date)}`}
                </p>
              </div>
            );
          })}
          {overtimeLimitAlerts.map(o => (
            <div key={o.employee_name} className="flex items-center gap-3 rounded-lg p-3 border bg-destructive/5 border-destructive/20">
              <Shield className="w-4 h-4 flex-shrink-0 text-destructive" />
              <p className="text-sm">
                <span className="font-semibold">{o.employee_name}</span> atingiu o limite de <strong>{o.count}/3 extras</strong> neste período. Novas extras bloqueadas.
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* ─── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Registros no Período', value: attendance.length, icon: CalendarDays, accent: 'border-t-primary' },
          { label: 'Colaboradores em Férias', value: vacationAlerts.filter(v => { const t = new Date(); return t >= new Date(v.start_date!) && t <= new Date(v.end_date!); }).length, icon: Sun, accent: 'border-t-teal-500' },
          { label: 'Extras no Período', value: attendance.filter(a => a.status === 'extra').length, icon: TrendingUp, accent: 'border-t-purple-500' },
          { label: 'Limites Atingidos', value: overtimeLimitAlerts.length, icon: AlertTriangle, accent: 'border-t-destructive' },
        ].map((kpi) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`corporate-kpi ${kpi.accent}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ─── Tabs ───────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="ponto">Ponto Diário</TabsTrigger>
          <TabsTrigger value="ferias">Férias</TabsTrigger>
          <TabsTrigger value="extras">Controle Extras</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
        </TabsList>

        {/* ─── Tab: Ponto Diário ────────────────────────────────── */}
        <TabsContent value="ponto" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Registrar Ponto</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Ponto Diário</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Funcionário</Label>
                    <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {funcionarios.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nome} <span className="text-muted-foreground ml-1">({f.letra}-{f.turno})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {form.status === 'extra' && form.employee_id && (() => {
                      const extrasUsed = attendance.filter(a => a.employee_id === form.employee_id && a.status === 'extra').length;
                      return (
                        <p className={`text-xs mt-1 ${extrasUsed >= 3 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                          {extrasUsed}/3 extras utilizadas neste período {extrasUsed >= 3 ? '— BLOQUEADO' : ''}
                        </p>
                      );
                    })()}
                  </div>
                  <div className="space-y-2">
                    <Label>Observação</Label>
                    <Textarea value={form.observation} onChange={e => setForm({ ...form, observation: e.target.value })} rows={2} />
                  </div>
                  <Button className="w-full" onClick={handleCreateAttendance}>Registrar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {attendance.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum registro de ponto no período</p>
            </div>
          ) : (
            <div className="corporate-section p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Colaborador</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Turno/Letra</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Função</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Data</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Observação</th>
                      <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a, i) => (
                      <tr key={a.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}>
                        <td className="px-4 py-3 font-medium">{a.employee_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{a.letra}-{a.turno}</td>
                        <td className="px-4 py-3 text-muted-foreground">{a.cargo}</td>
                        <td className="px-4 py-3">{formatDate(a.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(a.status)}`}>
                            {statusLabels[a.status] || a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{a.observation || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteAttendance(a.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Tab: Férias ──────────────────────────────────────── */}
        <TabsContent value="ferias" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={vacDialogOpen} onOpenChange={setVacDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Registrar Férias</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar / Atualizar Férias</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Funcionário</Label>
                    <Select value={vacForm.employee_id} onValueChange={v => setVacForm({ ...vacForm, employee_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Qtd. Dias</Label>
                      <Input type="number" value={vacForm.days_count} onChange={e => setVacForm({ ...vacForm, days_count: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Mês Programado</Label>
                      <Input placeholder="Ex: Março" value={vacForm.scheduled_month} onChange={e => setVacForm({ ...vacForm, scheduled_month: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Início</Label><Input type="date" value={vacForm.start_date} onChange={e => setVacForm({ ...vacForm, start_date: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Fim</Label><Input type="date" value={vacForm.end_date} onChange={e => setVacForm({ ...vacForm, end_date: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Observação</Label><Textarea value={vacForm.observation} onChange={e => setVacForm({ ...vacForm, observation: e.target.value })} rows={2} /></div>
                  <Button className="w-full" onClick={handleCreateVacation}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {vacations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Sun className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum registro de férias</p>
            </div>
          ) : (
            <div className="corporate-section p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Colaborador</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Função</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Turno/Letra</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Dias</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Mês Prog.</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Início</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Fim</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vacations.map((v, i) => {
                      const today = new Date();
                      const isOnVac = v.start_date && v.end_date && today >= new Date(v.start_date) && today <= new Date(v.end_date);
                      const isPending = v.scheduled_month && !v.start_date;
                      return (
                        <tr key={v.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}>
                          <td className="px-4 py-3 font-medium">{v.employee_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{v.cargo}</td>
                          <td className="px-4 py-3 text-muted-foreground">{v.letra}-{v.turno}</td>
                          <td className="px-4 py-3">{v.days_count}</td>
                          <td className="px-4 py-3">{v.scheduled_month || '—'}</td>
                          <td className="px-4 py-3">{formatDate(v.start_date)}</td>
                          <td className="px-4 py-3">{formatDate(v.end_date)}</td>
                          <td className="px-4 py-3">
                            {isOnVac ? (
                              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-teal-500/10 text-teal-600">Em Férias</span>
                            ) : isPending ? (
                              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-warning/10 text-warning">Programada</span>
                            ) : (
                              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-muted text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="icon" onClick={() => deleteVacation(v.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Tab: Controle de Extras ──────────────────────────── */}
        <TabsContent value="extras" className="space-y-4 mt-4">
          <div className="corporate-section">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Controle de Horas Extras — Limite: 3 por período
            </h3>
            {extrasPerEmployee.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma extra registrada no período</p>
            ) : (
              <div className="space-y-3">
                {extrasPerEmployee.map(emp => {
                  const pct = (emp.count / emp.limit) * 100;
                  const isBlocked = emp.count >= emp.limit;
                  return (
                    <div key={emp.name} className={`rounded-lg p-4 border ${isBlocked ? 'border-destructive/30 bg-destructive/5' : 'border-border'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{emp.name}</span>
                        <span className={`text-xs font-bold ${isBlocked ? 'text-destructive' : 'text-foreground'}`}>
                          {emp.count}/{emp.limit}
                          {isBlocked && <span className="ml-2 text-destructive">⛔ BLOQUEADO</span>}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isBlocked ? 'bg-destructive' : pct >= 66 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── Tab: Gráficos ────────────────────────────────────── */}
        <TabsContent value="graficos" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Bar Chart */}
            <div className="corporate-section">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Movimentação Diária</h3>
              {dailyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Presentes" stackId="a" fill="hsl(var(--success))" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Faltas" stackId="a" fill="hsl(var(--destructive))" />
                    <Bar dataKey="Extras" stackId="a" fill="hsl(260, 60%, 55%)" />
                    <Bar dataKey="Atestados" stackId="a" fill="hsl(200, 70%, 50%)" />
                    <Bar dataKey="Férias" stackId="a" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center py-12 text-muted-foreground text-sm">Sem dados no período</p>
              )}
            </div>

            {/* Pie Chart */}
            <div className="corporate-section">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Distribuição por Status</h3>
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {statusDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.fill || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center py-12 text-muted-foreground text-sm">Sem dados no período</p>
              )}
            </div>
          </div>

          {/* Extras Gauge */}
          <div className="corporate-section">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Extras por Colaborador (Limite 3)
            </h3>
            {extrasPerEmployee.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(200, extrasPerEmployee.length * 40)}>
                <BarChart data={extrasPerEmployee} layout="vertical" margin={{ left: 140 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={130} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Extras" fill="hsl(260, 60%, 55%)" radius={[0, 4, 4, 0]}>
                    {extrasPerEmployee.map((entry, i) => (
                      <Cell key={i} fill={entry.count >= 3 ? 'hsl(var(--destructive))' : entry.count >= 2 ? 'hsl(35, 90%, 50%)' : 'hsl(260, 60%, 55%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma extra registrada</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
