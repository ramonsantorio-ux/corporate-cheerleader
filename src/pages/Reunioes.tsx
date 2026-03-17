import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Loader2, CheckCircle2, Clock, Trash2, Search, X, Users, BarChart3, TrendingUp, Eye } from 'lucide-react';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FastTextarea } from '@/components/ui/fast-textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '@/components/dashboard/StatCard';

interface Meeting {
  id: string; employee_id: string; manager_name: string; meeting_date: string;
  notes: string; action_items: string; status: string; created_at: string;
  employee_name?: string; cargo?: string; departamento?: string;
}

interface Func { id: string; nome: string; cargo: string; departamento: string; foto_url: string; }

const CHART_COLORS = ['hsl(200, 80%, 38%)', 'hsl(155, 60%, 38%)', 'hsl(38, 90%, 50%)', 'hsl(0, 68%, 50%)', 'hsl(280, 60%, 55%)'];

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

export default function Reunioes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [funcionarios, setFuncionarios] = useState<Func[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: '', meeting_date: '', notes: '', action_items: '' });
  const [period, setPeriod] = useState<PeriodRange>(getPortoPeriod(0));

  // Employee filter
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Func | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [mRes, fRes] = await Promise.all([
      supabase.from('meetings').select('*').order('meeting_date', { ascending: false }),
      supabase.from('funcionarios').select('id, nome, cargo, departamento, foto_url').order('nome'),
    ]);
    const funcs = (fRes.data || []) as Func[];
    setFuncionarios(funcs);
    const nameMap = Object.fromEntries(funcs.map(f => [f.id, f]));
    setMeetings((mRes.data || []).map((m: any) => ({
      ...m,
      employee_name: nameMap[m.employee_id]?.nome || 'Desconhecido',
      cargo: nameMap[m.employee_id]?.cargo,
      departamento: nameMap[m.employee_id]?.departamento,
    })));
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.employee_id || !form.meeting_date) { toast.error('Preencha funcionário e data'); return; }
    const { error } = await supabase.from('meetings').insert({
      employee_id: form.employee_id,
      manager_name: user?.user_metadata?.full_name || user?.email || 'Gestor',
      meeting_date: form.meeting_date,
      notes: form.notes,
      action_items: form.action_items,
    });
    if (error) { toast.error('Erro ao criar reunião'); return; }
    setDialogOpen(false);
    setForm({ employee_id: '', meeting_date: '', notes: '', action_items: '' });
    toast.success('Reunião agendada!');
    fetchAll();
  }

  async function toggleStatus(id: string, current: string) {
    const newStatus = current === 'completed' ? 'scheduled' : 'completed';
    await supabase.from('meetings').update({ status: newStatus }).eq('id', id);
    fetchAll();
  }

  async function deleteMeeting(id: string) {
    await supabase.from('meetings').delete().eq('id', id);
    toast.success('Reunião removida');
    fetchAll();
  }

  const filteredSearchEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return [];
    return funcionarios.filter(f => f.nome.toLowerCase().includes(employeeSearch.toLowerCase())).slice(0, 8);
  }, [employeeSearch, funcionarios]);

  // Filter meetings by period + employee
  const filteredMeetings = useMemo(() => {
    let result = meetings.filter(m => m.meeting_date >= period.start && m.meeting_date <= period.end);
    if (selectedEmployee) result = result.filter(m => m.employee_id === selectedEmployee.id);
    return result;
  }, [meetings, period, selectedEmployee]);

  // KPIs
  const kpis = useMemo(() => {
    const total = filteredMeetings.length;
    const completed = filteredMeetings.filter(m => m.status === 'completed').length;
    const scheduled = filteredMeetings.filter(m => m.status === 'scheduled').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Unique employees with meetings
    const uniqueEmployees = new Set(filteredMeetings.map(m => m.employee_id)).size;

    // Coverage: employees with at least 1 meeting / total employees
    const totalEmployees = selectedEmployee ? 1 : funcionarios.length;
    const coverageRate = totalEmployees > 0 ? Math.round((uniqueEmployees / totalEmployees) * 100) : 0;

    return { total, completed, scheduled, completionRate, uniqueEmployees, coverageRate };
  }, [filteredMeetings, funcionarios, selectedEmployee]);

  // Chart: meetings per employee (top 10)
  const byEmployeeChart = useMemo(() => {
    if (selectedEmployee) return [];
    const map: Record<string, { name: string; completed: number; scheduled: number }> = {};
    filteredMeetings.forEach(m => {
      if (!map[m.employee_id]) map[m.employee_id] = { name: m.employee_name || '?', completed: 0, scheduled: 0 };
      if (m.status === 'completed') map[m.employee_id].completed++;
      else map[m.employee_id].scheduled++;
    });
    return Object.values(map).sort((a, b) => (b.completed + b.scheduled) - (a.completed + a.scheduled)).slice(0, 10);
  }, [filteredMeetings, selectedEmployee]);

  // Chart: status distribution
  const statusPie = useMemo(() => {
    const completed = filteredMeetings.filter(m => m.status === 'completed').length;
    const scheduled = filteredMeetings.filter(m => m.status === 'scheduled').length;
    return [
      { name: 'Concluídas', value: completed, fill: 'hsl(var(--success))' },
      { name: 'Agendadas', value: scheduled, fill: 'hsl(var(--primary))' },
    ].filter(d => d.value > 0);
  }, [filteredMeetings]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reuniões 1:1</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhamento individual dos funcionários</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nova Reunião</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Agendar Reunião 1:1</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Funcionário</Label>
                <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={form.meeting_date} onChange={e => setForm({ ...form, meeting_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Pauta / Anotações</Label>
                <FastTextarea value={form.notes} onValueChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="O que será discutido..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Ações combinadas</Label>
                <FastTextarea value={form.action_items} onValueChange={v => setForm(f => ({ ...f, action_items: v }))} placeholder="Itens de ação..." rows={2} />
              </div>
              <Button className="w-full" onClick={handleCreate}>Agendar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="flex-1 w-full">
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
        {/* Employee selector */}
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
              <input type="text" placeholder="Filtrar por funcionário..." value={employeeSearch}
                onChange={e => { setEmployeeSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
            )}
          </div>
          {showDropdown && filteredSearchEmployees.length > 0 && !selectedEmployee && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
              {filteredSearchEmployees.map(f => (
                <button key={f.id} onClick={() => { setSelectedEmployee(f); setEmployeeSearch(''); setShowDropdown(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left">
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

      {/* Employee banner */}
      {selectedEmployee && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 border-l-4 border-l-primary flex items-center gap-4">
          {selectedEmployee.foto_url ? (
            <img src={selectedEmployee.foto_url} className="w-10 h-10 rounded-full object-cover border-2 border-primary/30" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{selectedEmployee.nome.charAt(0)}</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">{selectedEmployee.nome}</p>
            <p className="text-sm text-muted-foreground">{selectedEmployee.cargo} · {selectedEmployee.departamento}</p>
          </div>
          <button onClick={() => navigate(`/funcionario/${selectedEmployee.id}`)} className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium shrink-0">
            <Eye className="w-3.5 h-3.5" /> Ver Perfil
          </button>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total no Período" value={kpis.total} change={`${kpis.uniqueEmployees} funcionários`} changeType="neutral" icon={Calendar} delay={0} />
        <StatCard title="Concluídas" value={kpis.completed} change={`${kpis.completionRate}% conclusão`} changeType={kpis.completionRate >= 70 ? 'positive' : kpis.completionRate < 40 ? 'negative' : 'neutral'} icon={CheckCircle2} delay={0.05} />
        <StatCard title="Agendadas" value={kpis.scheduled} change="pendentes" changeType={kpis.scheduled > 0 ? 'negative' : 'positive'} icon={Clock} delay={0.1} />
        <StatCard title="Cobertura" value={`${kpis.coverageRate}%`} change={`${kpis.uniqueEmployees}/${selectedEmployee ? 1 : funcionarios.length} funcionários`} changeType={kpis.coverageRate >= 80 ? 'positive' : 'negative'} icon={Users} delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Pie */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="corporate-section">
          <div className="corporate-section-header">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Status das Reuniões</h2>
          </div>
          <div className="corporate-section-body flex items-center justify-center">
            {statusPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: '10px' }}>
                    {statusPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8">Sem reuniões no período</p>
            )}
          </div>
        </motion.div>

        {/* By Employee Bar */}
        {!selectedEmployee && byEmployeeChart.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="corporate-section lg:col-span-2">
            <div className="corporate-section-header">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Reuniões por Funcionário</h2>
            </div>
            <div className="corporate-section-body">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byEmployeeChart} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="completed" name="Concluídas" stackId="a" fill="hsl(var(--success))" radius={[0, 0, 0, 0]} barSize={16} />
                  <Bar dataKey="scheduled" name="Agendadas" stackId="a" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {/* Meeting List */}
      {filteredMeetings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma reunião no período selecionado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredMeetings.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${m.status === 'completed' ? 'bg-success/10' : 'bg-primary/10'}`}>
                {m.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Clock className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{m.employee_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(m.meeting_date).toLocaleDateString('pt-BR')} · {m.manager_name}</p>
                {m.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{m.notes}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => toggleStatus(m.id, m.status)}>
                  {m.status === 'completed' ? 'Reabrir' : 'Concluir'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMeeting(m.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
