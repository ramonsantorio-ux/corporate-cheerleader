import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, Loader2, CheckCircle2, Clock, Trash2, Search, X, Users,
  BarChart3, TrendingUp, Eye, FileText, Upload, ChevronDown, ChevronUp,
  Target, Clipboard, AlertCircle, Presentation, ListChecks, UserCheck
} from 'lucide-react';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FastInput } from '@/components/ui/fast-input';
import { FastTextarea } from '@/components/ui/fast-textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '@/components/dashboard/StatCard';

interface Meeting {
  id: string; employee_id: string; manager_name: string; meeting_date: string;
  notes: string; action_items: string; status: string; created_at: string;
  meeting_type: string; title: string; material_url: string;
  employee_name?: string; cargo?: string; departamento?: string;
}

interface Func { id: string; nome: string; cargo: string; departamento: string; foto_url: string; }

interface ActionItem {
  id: string; meeting_id: string; what: string; why: string; who: string;
  when: string | null; where_location: string; how: string; how_much: string;
  status: string; completed_at: string | null; created_at: string;
}

interface Attendee {
  id: string; meeting_id: string; employee_id: string; present: boolean;
}

const MEETING_TYPES = [
  { value: '1:1', label: 'Reunião 1:1' },
  { value: 'mensal_operacional', label: 'Reunião Mensal Operacional' },
  { value: 'dds', label: 'DDS (Diálogo Diário de Segurança)' },
  { value: 'alinhamento_semanal', label: 'Alinhamento Semanal' },
  { value: 'outro', label: 'Outro' },
];

const MEETING_TYPE_LABELS: Record<string, string> = Object.fromEntries(MEETING_TYPES.map(t => [t.value, t.label]));

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

const emptyAction = { what: '', why: '', who: '', when: '', where_location: '', how: '', how_much: '' };

export default function Reunioes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [funcionarios, setFuncionarios] = useState<Func[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailMeeting, setDetailMeeting] = useState<Meeting | null>(null);
  const [form, setForm] = useState({ employee_id: '', meeting_date: '', notes: '', action_items: '', meeting_type: '1:1', title: '' });
  const [period, setPeriod] = useState<PeriodRange>(getPortoPeriod(0));
  const [activeTab, setActiveTab] = useState('todas');

  // Attendees for new mensal operacional
  const [newAttendees, setNewAttendees] = useState<Record<string, boolean>>({});
  // Action items for new meeting
  const [newActions, setNewActions] = useState([{ ...emptyAction }]);

  // Action items dialog
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionMeetingId, setActionMeetingId] = useState('');
  const [editAction, setEditAction] = useState({ ...emptyAction });

  // Employee filter
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Func | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Expanded meetings
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set());

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [mRes, fRes, aiRes, atRes] = await Promise.all([
      supabase.from('meetings').select('*').order('meeting_date', { ascending: false }),
      supabase.from('funcionarios').select('id, nome, cargo, departamento, foto_url').order('nome'),
      supabase.from('meeting_action_items').select('*').order('created_at'),
      supabase.from('meeting_attendees').select('*'),
    ]);
    const funcs = (fRes.data || []) as Func[];
    setFuncionarios(funcs);
    const nameMap = Object.fromEntries(funcs.map(f => [f.id, f]));
    setMeetings((mRes.data || []).map((m: any) => ({
      ...m,
      meeting_type: m.meeting_type || '1:1',
      title: m.title || '',
      material_url: m.material_url || '',
      employee_name: nameMap[m.employee_id]?.nome || 'Desconhecido',
      cargo: nameMap[m.employee_id]?.cargo,
      departamento: nameMap[m.employee_id]?.departamento,
    })));
    setActionItems((aiRes.data || []) as ActionItem[]);
    setAttendees((atRes.data || []) as Attendee[]);
    setLoading(false);
  }

  // Leadership employees (for mensal operacional)
  const leadershipFuncs = useMemo(() => {
    const leaderCargos = ['gerente operacional', 'coordenador operacional', 'encarregado operacional', 'analista de controle', 'supervisor'];
    return funcionarios.filter(f => leaderCargos.some(c => f.cargo.toLowerCase().includes(c)));
  }, [funcionarios]);

  async function handleCreate() {
    const isMensal = form.meeting_type === 'mensal_operacional';
    if (!isMensal && !form.employee_id) { toast.error('Selecione o funcionário'); return; }
    if (!form.meeting_date) { toast.error('Preencha a data'); return; }

    const insertData: any = {
      employee_id: isMensal ? (funcionarios[0]?.id || form.employee_id) : form.employee_id,
      manager_name: user?.user_metadata?.full_name || user?.email || 'Gestor',
      meeting_date: form.meeting_date,
      notes: form.notes,
      action_items: form.action_items,
      meeting_type: form.meeting_type,
      title: form.title || MEETING_TYPE_LABELS[form.meeting_type] || '',
    };

    const { data: newMeeting, error } = await supabase.from('meetings').insert(insertData).select().single();
    if (error || !newMeeting) { toast.error('Erro ao criar reunião'); return; }

    // Insert attendees for mensal operacional
    if (isMensal) {
      const attendeeRows = Object.entries(newAttendees)
        .filter(([, present]) => present)
        .map(([empId]) => ({ meeting_id: newMeeting.id, employee_id: empId, present: true }));
      if (attendeeRows.length > 0) {
        await supabase.from('meeting_attendees').insert(attendeeRows);
      }
    }

    // Insert action items (5W2H)
    const validActions = newActions.filter(a => a.what.trim());
    if (validActions.length > 0) {
      const actionRows = validActions.map(a => ({
        meeting_id: newMeeting.id,
        what: a.what,
        why: a.why,
        who: a.who,
        when: a.when || null,
        where_location: a.where_location,
        how: a.how,
        how_much: a.how_much,
        status: 'pendente',
      }));
      await supabase.from('meeting_action_items').insert(actionRows);
    }

    setDialogOpen(false);
    setForm({ employee_id: '', meeting_date: '', notes: '', action_items: '', meeting_type: '1:1', title: '' });
    setNewAttendees({});
    setNewActions([{ ...emptyAction }]);
    toast.success('Reunião registrada!');
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

  async function toggleActionStatus(actionId: string, current: string) {
    const newStatus = current === 'concluido' ? 'pendente' : 'concluido';
    await supabase.from('meeting_action_items').update({
      status: newStatus,
      completed_at: newStatus === 'concluido' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', actionId);
    fetchAll();
  }

  async function addActionToMeeting() {
    if (!editAction.what.trim()) { toast.error('Preencha o campo "O quê"'); return; }
    await supabase.from('meeting_action_items').insert({
      meeting_id: actionMeetingId,
      what: editAction.what,
      why: editAction.why,
      who: editAction.who,
      when: editAction.when || null,
      where_location: editAction.where_location,
      how: editAction.how,
      how_much: editAction.how_much,
      status: 'pendente',
    });
    setActionDialogOpen(false);
    setEditAction({ ...emptyAction });
    toast.success('Ação adicionada');
    fetchAll();
  }

  async function deleteAction(actionId: string) {
    await supabase.from('meeting_action_items').delete().eq('id', actionId);
    toast.success('Ação removida');
    fetchAll();
  }

  const filteredSearchEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return [];
    return funcionarios.filter(f => f.nome.toLowerCase().includes(employeeSearch.toLowerCase())).slice(0, 8);
  }, [employeeSearch, funcionarios]);

  // Filter meetings by period + employee + tab
  const filteredMeetings = useMemo(() => {
    let result = meetings.filter(m => m.meeting_date >= period.start && m.meeting_date <= period.end);
    if (selectedEmployee) result = result.filter(m => m.employee_id === selectedEmployee.id);
    if (activeTab !== 'todas') result = result.filter(m => m.meeting_type === activeTab);
    return result;
  }, [meetings, period, selectedEmployee, activeTab]);

  // All meetings in period (for KPIs regardless of tab)
  const allPeriodMeetings = useMemo(() => {
    let result = meetings.filter(m => m.meeting_date >= period.start && m.meeting_date <= period.end);
    if (selectedEmployee) result = result.filter(m => m.employee_id === selectedEmployee.id);
    return result;
  }, [meetings, period, selectedEmployee]);

  // KPIs
  const kpis = useMemo(() => {
    const total = allPeriodMeetings.length;
    const completed = allPeriodMeetings.filter(m => m.status === 'completed').length;
    const scheduled = allPeriodMeetings.filter(m => m.status === 'scheduled').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const uniqueEmployees = new Set(allPeriodMeetings.map(m => m.employee_id)).size;
    const totalEmployees = selectedEmployee ? 1 : funcionarios.length;
    const coverageRate = totalEmployees > 0 ? Math.round((uniqueEmployees / totalEmployees) * 100) : 0;

    // Mensal operacional KPIs
    const mensalMeetings = allPeriodMeetings.filter(m => m.meeting_type === 'mensal_operacional');
    const mensalCompleted = mensalMeetings.filter(m => m.status === 'completed').length;

    // Monthly coverage: how many distinct months have a mensal meeting
    const monthsWithMensal = new Set(mensalMeetings.map(m => m.meeting_date.substring(0, 7))).size;
    // Expected months in period
    const startDate = new Date(period.start);
    const endDate = new Date(period.end);
    let expectedMonths = 0;
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (d <= endDate) {
      expectedMonths++;
      d.setMonth(d.getMonth() + 1);
    }
    const mensalRealizationRate = expectedMonths > 0 ? Math.round((monthsWithMensal / expectedMonths) * 100) : 0;

    // Leadership coverage: % of leaders who attended at least one mensal
    const mensalMeetingIds = new Set(mensalMeetings.map(m => m.id));
    const leaderIds = new Set(leadershipFuncs.map(f => f.id));
    const attendedLeaders = new Set(
      attendees
        .filter(a => mensalMeetingIds.has(a.meeting_id) && a.present && leaderIds.has(a.employee_id))
        .map(a => a.employee_id)
    );
    const leadershipCoverage = leaderIds.size > 0 ? Math.round((attendedLeaders.size / leaderIds.size) * 100) : 0;

    // Action items KPIs
    const meetingIds = new Set(allPeriodMeetings.map(m => m.id));
    const periodActions = actionItems.filter(a => meetingIds.has(a.meeting_id));
    const actionsPendentes = periodActions.filter(a => a.status === 'pendente').length;
    const actionsConcluidas = periodActions.filter(a => a.status === 'concluido').length;
    const actionsTotal = periodActions.length;
    const actionsConclusionRate = actionsTotal > 0 ? Math.round((actionsConcluidas / actionsTotal) * 100) : 0;

    return {
      total, completed, scheduled, completionRate, uniqueEmployees, coverageRate,
      mensalRealizationRate, mensalCompleted, monthsWithMensal, expectedMonths,
      leadershipCoverage, attendedLeaders: attendedLeaders.size, totalLeaders: leaderIds.size,
      actionsPendentes, actionsConcluidas, actionsTotal, actionsConclusionRate,
    };
  }, [allPeriodMeetings, funcionarios, selectedEmployee, leadershipFuncs, attendees, actionItems, period]);

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

  // Chart: by type
  const byTypeChart = useMemo(() => {
    const map: Record<string, number> = {};
    allPeriodMeetings.forEach(m => {
      const label = MEETING_TYPE_LABELS[m.meeting_type] || m.meeting_type;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allPeriodMeetings]);

  // Chart: status distribution
  const statusPie = useMemo(() => {
    const completed = filteredMeetings.filter(m => m.status === 'completed').length;
    const scheduled = filteredMeetings.filter(m => m.status === 'scheduled').length;
    return [
      { name: 'Concluídas', value: completed, fill: 'hsl(var(--success))' },
      { name: 'Agendadas', value: scheduled, fill: 'hsl(var(--primary))' },
    ].filter(d => d.value > 0);
  }, [filteredMeetings]);

  // Actions for a meeting
  const getActionsForMeeting = (meetingId: string) => actionItems.filter(a => a.meeting_id === meetingId);
  const getAttendeesForMeeting = (meetingId: string) => attendees.filter(a => a.meeting_id === meetingId);

  const toggleExpanded = (id: string) => {
    setExpandedMeetings(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const isMensalForm = form.meeting_type === 'mensal_operacional';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reuniões</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão de reuniões, planos de ação e acompanhamento de liderança</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Nova Reunião</Button>
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

      {/* KPI Cards - Row 1: General */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total no Período" value={kpis.total} change={`${kpis.uniqueEmployees} funcionários`} changeType="neutral" icon={Calendar} delay={0} />
        <StatCard title="Concluídas" value={kpis.completed} change={`${kpis.completionRate}% conclusão`} changeType={kpis.completionRate >= 70 ? 'positive' : kpis.completionRate < 40 ? 'negative' : 'neutral'} icon={CheckCircle2} delay={0.05} />
        <StatCard title="Agendadas" value={kpis.scheduled} change="pendentes" changeType={kpis.scheduled > 0 ? 'negative' : 'positive'} icon={Clock} delay={0.1} />
        <StatCard title="Cobertura Geral" value={`${kpis.coverageRate}%`} change={`${kpis.uniqueEmployees}/${selectedEmployee ? 1 : funcionarios.length} funcionários`} changeType={kpis.coverageRate >= 80 ? 'positive' : 'negative'} icon={Users} delay={0.15} />
      </div>

      {/* KPI Cards - Row 2: Mensal Operacional + Ações */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Mensal Operacional" value={`${kpis.mensalRealizationRate}%`} change={`${kpis.monthsWithMensal}/${kpis.expectedMonths} meses`} changeType={kpis.mensalRealizationRate >= 80 ? 'positive' : 'negative'} icon={Presentation} delay={0.2} />
        <StatCard title="Cobertura Liderança" value={`${kpis.leadershipCoverage}%`} change={`${kpis.attendedLeaders}/${kpis.totalLeaders} líderes`} changeType={kpis.leadershipCoverage >= 80 ? 'positive' : 'negative'} icon={UserCheck} delay={0.25} />
        <StatCard title="Ações Pendentes" value={kpis.actionsPendentes} change={`${kpis.actionsTotal} total`} changeType={kpis.actionsPendentes > 5 ? 'negative' : 'positive'} icon={AlertCircle} delay={0.3} />
        <StatCard title="Taxa Conclusão Ações" value={`${kpis.actionsConclusionRate}%`} change={`${kpis.actionsConcluidas}/${kpis.actionsTotal} concluídas`} changeType={kpis.actionsConclusionRate >= 70 ? 'positive' : 'negative'} icon={ListChecks} delay={0.35} />
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

        {/* By Type Bar */}
        {byTypeChart.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="corporate-section">
            <div className="corporate-section-header">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Por Tipo</h2>
            </div>
            <div className="corporate-section-body">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byTypeChart} margin={{ left: -5, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Reuniões" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* By Employee Bar */}
        {!selectedEmployee && byEmployeeChart.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="corporate-section">
            <div className="corporate-section-header">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Por Funcionário</h2>
            </div>
            <div className="corporate-section-body">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byEmployeeChart} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="completed" name="Concluídas" stackId="a" fill="hsl(var(--success))" barSize={14} />
                  <Bar dataKey="scheduled" name="Agendadas" stackId="a" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {/* Tabs by Type */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="todas" className="text-xs">Todas</TabsTrigger>
          {MEETING_TYPES.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Meeting List */}
      {filteredMeetings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma reunião no período selecionado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredMeetings.map((m, i) => {
            const mActions = getActionsForMeeting(m.id);
            const mAttendees = getAttendeesForMeeting(m.id);
            const isExpanded = expandedMeetings.has(m.id);
            const pendingActions = mActions.filter(a => a.status === 'pendente').length;

            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="glass-card rounded-xl overflow-hidden">
                {/* Main row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${m.status === 'completed' ? 'bg-success/10' : 'bg-primary/10'}`}>
                    {m.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Clock className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{m.title || m.employee_name}</p>
                      <Badge variant="outline" className="text-[10px]">{MEETING_TYPE_LABELS[m.meeting_type] || m.meeting_type}</Badge>
                      {pendingActions > 0 && (
                        <Badge variant="destructive" className="text-[10px]">{pendingActions} ação(ões) pendente(s)</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(m.meeting_date).toLocaleDateString('pt-BR')} · {m.manager_name}</p>
                    {m.meeting_type !== 'mensal_operacional' && <p className="text-xs text-muted-foreground">{m.employee_name}</p>}
                    {m.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{m.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {(mActions.length > 0 || mAttendees.length > 0) && (
                      <Button variant="ghost" size="sm" onClick={() => toggleExpanded(m.id)}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => {
                      setActionMeetingId(m.id);
                      setEditAction({ ...emptyAction });
                      setActionDialogOpen(true);
                    }}>
                      <Plus className="w-4 h-4 mr-1" />Ação
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(m.id, m.status)}>
                      {m.status === 'completed' ? 'Reabrir' : 'Concluir'}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMeeting(m.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border">
                      {/* Attendees */}
                      {mAttendees.length > 0 && (
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Lista de Presença</p>
                          <div className="flex flex-wrap gap-2">
                            {mAttendees.map(att => {
                              const func = funcionarios.find(f => f.id === att.employee_id);
                              return (
                                <Badge key={att.id} variant={att.present ? 'default' : 'outline'} className="text-xs">
                                  {att.present ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                                  {func?.nome || 'Desconhecido'}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action Items */}
                      {mActions.length > 0 && (
                        <div className="px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Plano de Ação (5W2H)</p>
                          <div className="space-y-2">
                            {mActions.map(action => (
                              <div key={action.id} className={`p-3 rounded-lg border ${action.status === 'concluido' ? 'bg-success/5 border-success/20' : 'bg-card border-border'}`}>
                                <div className="flex items-start gap-3">
                                  <button onClick={() => toggleActionStatus(action.id, action.status)} className="mt-0.5">
                                    {action.status === 'concluido'
                                      ? <CheckCircle2 className="w-4 h-4 text-success" />
                                      : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${action.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}>{action.what}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] text-muted-foreground">
                                      {action.who && <span><strong>Quem:</strong> {action.who}</span>}
                                      {action.when && <span><strong>Quando:</strong> {new Date(action.when).toLocaleDateString('pt-BR')}</span>}
                                      {action.why && <span><strong>Por quê:</strong> {action.why}</span>}
                                      {action.how && <span><strong>Como:</strong> {action.how}</span>}
                                      {action.where_location && <span><strong>Onde:</strong> {action.where_location}</span>}
                                      {action.how_much && <span><strong>Quanto:</strong> {action.how_much}</span>}
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-6 w-6" onClick={() => deleteAction(action.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ DIALOG: Nova Reunião ═══ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Reunião</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Reunião</Label>
                <Select value={form.meeting_type} onValueChange={v => setForm({ ...form, meeting_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={form.meeting_date} onChange={e => setForm({ ...form, meeting_date: e.target.value })} />
              </div>
            </div>

            {!isMensalForm && (
              <div className="space-y-2">
                <Label>Funcionário</Label>
                <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Título (opcional)</Label>
              <FastInput value={form.title} onValueChange={v => setForm(f => ({ ...f, title: v }))} placeholder={MEETING_TYPE_LABELS[form.meeting_type]} />
            </div>

            <div className="space-y-2">
              <Label>Pauta / Anotações</Label>
              <FastTextarea value={form.notes} onValueChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="O que será discutido..." rows={3} />
            </div>

            {/* Attendance list for mensal operacional */}
            {isMensalForm && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clipboard className="w-4 h-4" />
                  Lista de Presença — Liderança
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                  {leadershipFuncs.length > 0 ? leadershipFuncs.map(f => (
                    <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded p-1.5">
                      <Checkbox
                        checked={!!newAttendees[f.id]}
                        onCheckedChange={(checked) => setNewAttendees(prev => ({ ...prev, [f.id]: !!checked }))}
                      />
                      <span>{f.nome}</span>
                      <span className="text-[10px] text-muted-foreground">({f.cargo})</span>
                    </label>
                  )) : (
                    <p className="text-xs text-muted-foreground col-span-2">Nenhum cargo de liderança cadastrado</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    const all: Record<string, boolean> = {};
                    leadershipFuncs.forEach(f => { all[f.id] = true; });
                    setNewAttendees(all);
                  }}>Marcar Todos</Button>
                  <Button variant="outline" size="sm" onClick={() => setNewAttendees({})}>Desmarcar Todos</Button>
                </div>
              </div>
            )}

            {/* Action Items (5W2H) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                Plano de Ação (5W2H)
              </Label>
              {newActions.map((action, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Ação {idx + 1}</span>
                    {newActions.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setNewActions(prev => prev.filter((_, i) => i !== idx))}>
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <FastInput placeholder="O quê? (What)" value={action.what} onValueChange={v => { const n = [...newActions]; n[idx] = { ...n[idx], what: v }; setNewActions(n); }} />
                    <FastInput placeholder="Quem? (Who)" value={action.who} onValueChange={v => { const n = [...newActions]; n[idx] = { ...n[idx], who: v }; setNewActions(n); }} />
                    <Input type="date" placeholder="Quando? (When)" value={action.when} onChange={e => { const n = [...newActions]; n[idx] = { ...n[idx], when: e.target.value }; setNewActions(n); }} />
                    <FastInput placeholder="Por quê? (Why)" value={action.why} onValueChange={v => { const n = [...newActions]; n[idx] = { ...n[idx], why: v }; setNewActions(n); }} />
                    <FastInput placeholder="Como? (How)" value={action.how} onValueChange={v => { const n = [...newActions]; n[idx] = { ...n[idx], how: v }; setNewActions(n); }} />
                    <FastInput placeholder="Onde? (Where)" value={action.where_location} onValueChange={v => { const n = [...newActions]; n[idx] = { ...n[idx], where_location: v }; setNewActions(n); }} />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setNewActions(prev => [...prev, { ...emptyAction }])}>
                <Plus className="w-3 h-3 mr-1" />Adicionar Ação
              </Button>
            </div>

            <Button className="w-full" onClick={handleCreate}>Registrar Reunião</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ DIALOG: Add Action to Existing Meeting ═══ */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Ação (5W2H)</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <FastInput placeholder="O quê? (What) *" value={editAction.what} onValueChange={v => setEditAction(p => ({ ...p, what: v }))} />
            <FastInput placeholder="Quem? (Who)" value={editAction.who} onValueChange={v => setEditAction(p => ({ ...p, who: v }))} />
            <Input type="date" value={editAction.when} onChange={e => setEditAction(p => ({ ...p, when: e.target.value }))} />
            <FastInput placeholder="Por quê? (Why)" value={editAction.why} onValueChange={v => setEditAction(p => ({ ...p, why: v }))} />
            <FastInput placeholder="Como? (How)" value={editAction.how} onValueChange={v => setEditAction(p => ({ ...p, how: v }))} />
            <FastInput placeholder="Onde? (Where)" value={editAction.where_location} onValueChange={v => setEditAction(p => ({ ...p, where_location: v }))} />
            <FastInput placeholder="Quanto? (How Much)" value={editAction.how_much} onValueChange={v => setEditAction(p => ({ ...p, how_much: v }))} />
            <Button className="w-full" onClick={addActionToMeeting}>Adicionar Ação</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
