import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays, Plus, Loader2, Trash2, Clock, AlertTriangle,
  Users, TrendingUp, Sun, Shield, ChevronDown, ChevronUp, Eye,
  Upload, Pencil, Bell, MinusCircle, FileText, ShieldAlert, Search, X, Download
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FastInput } from '@/components/ui/fast-input';
import { FastTextarea } from '@/components/ui/fast-textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBusatoLogoBase64, drawBusatoHeader, drawBusatoFooter } from '@/lib/pdfLogo';

import { ExpandableChart } from '@/components/ui/ExpandableChart';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

interface Warning {
  id: string; employee_id: string; date: string; reason: string;
  applied: boolean; observation: string; created_at: string;
  employee_name?: string;
}

interface Func { id: string; nome: string; turno: string; letra: string; cargo: string; departamento: string; foto_url?: string; }

const statusLabels: Record<string, string> = {
  presente: 'Presente', falta_injustificada: 'Falta Injustificada', falta_justificada: 'Falta Justificada',
  atestado: 'Atestado', extra: 'Extra', ferias: 'FÃ©rias', afastamento: 'Afastamento',
  abono: 'Abono', banco_horas: 'Banco de Horas',
};

const statusColors: Record<string, string> = {
  presente: 'hsl(var(--success))', falta_injustificada: 'hsl(var(--destructive))',
  falta_justificada: 'hsl(35, 90%, 50%)', atestado: 'hsl(200, 70%, 50%)',
  extra: 'hsl(260, 60%, 55%)', ferias: 'hsl(160, 60%, 45%)',
  afastamento: 'hsl(0, 50%, 50%)', abono: 'hsl(45, 80%, 50%)',
  banco_horas: 'hsl(220, 60%, 55%)',
};

const PIE_COLORS = ['#0d9488', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#dc2626', '#eab308', '#6366f1'];

const DAILY_MOVEMENT_GOAL = 3;

// getCurrentPeriod kept for backward compat
function getCurrentPeriod() {
  return getPortoPeriod(0);
}

function formatDate(d: string | null) {
  if (!d) return 'â€”';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function PontoFerias() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [vacations, setVacations] = useState<VacationRecord[]>([]);
  const [overtimes, setOvertimes] = useState<OvertimeRecord[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [funcionarios, setFuncionarios] = useState<Func[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vacDialogOpen, setVacDialogOpen] = useState(false);
  const [editVacDialogOpen, setEditVacDialogOpen] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [showPontoTable, setShowPontoTable] = useState(false);
  const [showFeriasTable, setShowFeriasTable] = useState(false);
  const [showWarningsTable, setShowWarningsTable] = useState(false);
  const [alertsShown, setAlertsShown] = useState(false);
  const pontoFileRef = useRef<HTMLInputElement>(null);
  const feriasFileRef = useRef<HTMLInputElement>(null);
  const extrasFileRef = useRef<HTMLInputElement>(null);
  const [period, setPeriod] = useState<PeriodRange>(getCurrentPeriod());
  const navigate = useNavigate();

  // Employee filter
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Func | null>(null);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);

  const filteredSearchEmps = useMemo(() => {
    if (!employeeSearch.trim()) return [];
    return funcionarios.filter(f => f.nome.toLowerCase().includes(employeeSearch.toLowerCase())).slice(0, 8);
  }, [employeeSearch, funcionarios]);

  const [form, setForm] = useState({ employee_id: '', date: '', status: 'presente', observation: '' });
  const [vacForm, setVacForm] = useState({
    employee_id: '', days_count: '30', scheduled_month: '', start_date: '', end_date: '', observation: ''
  });
  const [editVacForm, setEditVacForm] = useState({
    id: '', employee_id: '', days_count: '30', scheduled_month: '', start_date: '', end_date: '', observation: ''
  });
  const [warningForm, setWarningForm] = useState({
    employee_id: '', date: new Date().toISOString().split('T')[0], reason: '', applied: 'true', observation: ''
  });

  useEffect(() => { fetchAll(); }, [period]);

  // â”€â”€â”€ Leader alert popups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (alertsShown || loading || attendance.length === 0) return;

    const extrasMap: Record<string, { name: string; count: number }> = {};
    attendance.filter(a => a.status === 'extra').forEach(a => {
      if (!extrasMap[a.employee_id]) extrasMap[a.employee_id] = { name: a.employee_name || '', count: 0 };
      extrasMap[a.employee_id].count++;
    });
    const blocked = Object.values(extrasMap).filter(e => e.count >= 3);
    blocked.forEach(emp => {
      toast.warning(`â›” ALERTA: ${emp.name} atingiu ${emp.count}/3 extras no perÃ­odo. Novas extras BLOQUEADAS.`, {
        duration: 8000,
        icon: <Shield className="w-4 h-4" />,
      });
    });

    const today = new Date();
    vacations.forEach(v => {
      if (!v.start_date || !v.end_date) return;
      const start = new Date(v.start_date);
      const end = new Date(v.end_date);
      if (today >= start && today <= end) {
        toast.info(`ðŸ–ï¸ ${v.employee_name} estÃ¡ em FÃ‰RIAS atÃ© ${formatDate(v.end_date)}`, {
          duration: 6000,
          icon: <Sun className="w-4 h-4" />,
        });
      } else if (start.getTime() - today.getTime() <= 7 * 86400000 && start > today) {
        toast.info(`ðŸ“… ${v.employee_name} inicia fÃ©rias em ${formatDate(v.start_date)}`, {
          duration: 6000,
        });
      }
    });

    setAlertsShown(true);
  }, [attendance, vacations, loading, alertsShown]);

  async function fetchAll() {
    setLoading(true);
    const [attRes, vacRes, ovtRes, fRes, warnRes] = await Promise.all([
      supabase.from('daily_attendance').select('*').gte('date', period.start).lte('date', period.end).order('date', { ascending: false }),
      supabase.from('vacation_control').select('*'),
      supabase.from('overtime_control').select('*').gte('period_start', period.start).lte('period_end', period.end),
      supabase.from('funcionarios').select('id, nome, turno, letra, cargo, departamento, foto_url').order('nome'),
      supabase.from('employee_warnings').select('*').order('date', { ascending: false }),
    ]);
    const funcs = (fRes.data || []) as Func[];
    setFuncionarios(funcs);
    const nameMap = Object.fromEntries(funcs.map(f => [f.id, f]));

    // Migrate old 'falta' status to 'falta_injustificada' in display
    setAttendance((attRes.data || []).map((a: any) => ({
      ...a,
      status: a.status === 'falta' ? 'falta_injustificada' : a.status,
      employee_name: nameMap[a.employee_id]?.nome || 'Desconhecido',
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
    setWarnings((warnRes.data || []).map((w: any) => ({
      ...w, employee_name: nameMap[w.employee_id]?.nome || 'Desconhecido',
    })));
    setLoading(false);
  }

  async function handleCreateAttendance() {
    if (!form.employee_id || !form.date) { toast.error('Preencha os campos obrigatÃ³rios'); return; }

    // Falta injustificada does NOT count for banco de horas
    const statusToSave = form.status === 'falta_injustificada' ? 'falta' : form.status;

    if (form.status === 'extra') {
      const { count } = await supabase.from('daily_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', form.employee_id)
        .eq('status', 'extra')
        .gte('date', period.start).lte('date', period.end);

      if ((count || 0) >= 3) {
        toast.error('âš ï¸ LIMITE ATINGIDO: Este colaborador jÃ¡ realizou 3 extras neste perÃ­odo.');
        return;
      }
    }

    const { error } = await supabase.from('daily_attendance').insert({
      employee_id: form.employee_id, date: form.date, status: statusToSave, observation: form.observation,
    });
    if (error) {
      if (error.code === '23505') toast.error('JÃ¡ existe registro para este colaborador nesta data');
      else toast.error('Erro ao registrar ponto');
      return;
    }

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

      const newCount = (existing ? (existing as any).extras_count + 1 : 1);
      if (newCount >= 3) {
        const empName = funcionarios.find(f => f.id === form.employee_id)?.nome || '';
        toast.warning(`â›” ALERTA LÃDER: ${empName} atingiu o LIMITE de 3 extras! Novas extras BLOQUEADAS.`, { duration: 10000 });
      }
    }

    setDialogOpen(false);
    setForm({ employee_id: '', date: '', status: 'presente', observation: '' });
    toast.success('Ponto registrado com sucesso');
    fetchAll();
  }

  async function handleCreateVacation() {
    if (!vacForm.employee_id) { toast.error('Selecione o funcionÃ¡rio'); return; }
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
    if (error) { toast.error('Erro ao registrar fÃ©rias'); return; }
    setVacDialogOpen(false);
    setVacForm({ employee_id: '', days_count: '30', scheduled_month: '', start_date: '', end_date: '', observation: '' });
    toast.success('FÃ©rias registradas!');

    const empName = funcionarios.find(f => f.id === vacForm.employee_id)?.nome || '';
    if (vacForm.start_date) {
      toast.info(`ðŸ“… ALERTA: FÃ©rias programadas para ${empName} â€” InÃ­cio: ${formatDate(vacForm.start_date)}`, { duration: 8000 });
    }
    fetchAll();
  }

  async function handleEditVacation() {
    if (!editVacForm.id) return;
    const { error } = await supabase.from('vacation_control').update({
      days_count: parseInt(editVacForm.days_count) || 30,
      scheduled_month: editVacForm.scheduled_month,
      start_date: editVacForm.start_date || null,
      end_date: editVacForm.end_date || null,
      observation: editVacForm.observation,
      remaining_days: editVacForm.start_date && editVacForm.end_date
        ? Math.ceil((new Date(editVacForm.end_date).getTime() - new Date().getTime()) / 86400000)
        : null,
      updated_at: new Date().toISOString(),
    }).eq('id', editVacForm.id);
    if (error) { toast.error('Erro ao atualizar fÃ©rias'); return; }
    setEditVacDialogOpen(false);
    toast.success('FÃ©rias atualizadas!');
    fetchAll();
  }

  function openEditVacation(v: VacationRecord) {
    setEditVacForm({
      id: v.id, employee_id: v.employee_id,
      days_count: String(v.days_count || 30), scheduled_month: v.scheduled_month || '',
      start_date: v.start_date || '', end_date: v.end_date || '', observation: v.observation || '',
    });
    setEditVacDialogOpen(true);
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

  // â”€â”€â”€ Warning handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleCreateWarning() {
    if (!warningForm.employee_id || !warningForm.reason) { toast.error('Preencha funcionÃ¡rio e motivo'); return; }
    const { error } = await supabase.from('employee_warnings').insert({
      employee_id: warningForm.employee_id,
      date: warningForm.date,
      reason: warningForm.reason,
      applied: warningForm.applied === 'true',
      observation: warningForm.observation,
    });
    if (error) { toast.error('Erro ao registrar advertÃªncia'); return; }
    setWarningDialogOpen(false);
    setWarningForm({ employee_id: '', date: new Date().toISOString().split('T')[0], reason: '', applied: 'true', observation: '' });
    toast.success('AdvertÃªncia registrada!');
    fetchAll();
  }

  async function deleteWarning(id: string) {
    await supabase.from('employee_warnings').delete().eq('id', id);
    toast.success('AdvertÃªncia removida');
    fetchAll();
  }

  // â”€â”€â”€ Import handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleImportPonto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws);

      const nameToId = Object.fromEntries(funcionarios.map(f => [f.nome.toLowerCase().trim(), f.id]));
      let imported = 0;

      for (const row of rows) {
        const nome = String(row['Nome'] || row['nome'] || row['Colaborador'] || row['colaborador'] || '').toLowerCase().trim();
        const empId = nameToId[nome];
        if (!empId) continue;
        const date = row['Data'] || row['data'] || '';
        const status = String(row['Status'] || row['status'] || 'presente').toLowerCase().trim();
        const obs = row['ObservaÃ§Ã£o'] || row['observacao'] || row['Obs'] || '';

        if (!date) continue;
        let dateStr = date;
        if (typeof date === 'number') {
          const d = XLSX.SSF.parse_date_code(date);
          dateStr = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        }

        await supabase.from('daily_attendance').insert({
          employee_id: empId, date: dateStr, status, observation: obs,
        });
        imported++;
      }
      toast.success(`${imported} registros de ponto importados com sucesso!`);
      fetchAll();
    } catch {
      toast.error('Erro ao importar arquivo de ponto');
    }
    if (pontoFileRef.current) pontoFileRef.current.value = '';
  }

  async function handleImportFerias(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws);

      const nameToId = Object.fromEntries(funcionarios.map(f => [f.nome.toLowerCase().trim(), f.id]));
      let imported = 0;

      for (const row of rows) {
        const nome = String(row['Nome'] || row['nome'] || row['Colaborador'] || row['colaborador'] || '').toLowerCase().trim();
        const empId = nameToId[nome];
        if (!empId) continue;

        let startDate = row['InÃ­cio'] || row['inicio'] || row['Start'] || '';
        let endDate = row['Fim'] || row['fim'] || row['End'] || '';
        if (typeof startDate === 'number') {
          const d = XLSX.SSF.parse_date_code(startDate);
          startDate = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        }
        if (typeof endDate === 'number') {
          const d = XLSX.SSF.parse_date_code(endDate);
          endDate = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        }

        await supabase.from('vacation_control').upsert({
          employee_id: empId,
          days_count: parseInt(row['Dias'] || row['dias'] || '30') || 30,
          scheduled_month: row['MÃªs'] || row['mes'] || '',
          start_date: startDate || null, end_date: endDate || null,
          observation: row['ObservaÃ§Ã£o'] || row['observacao'] || '',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'employee_id' });
        imported++;
      }
      toast.success(`${imported} registros de fÃ©rias importados com sucesso!`);
      fetchAll();
    } catch {
      toast.error('Erro ao importar arquivo de fÃ©rias');
    }
    if (feriasFileRef.current) feriasFileRef.current.value = '';
  }

  async function handleImportExtras(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws);
      const nameToId = Object.fromEntries(funcionarios.map(f => [f.nome.toLowerCase().trim(), f.id]));
      let imported = 0;
      for (const row of rows) {
        const nome = String(row['Nome'] || row['nome'] || row['Colaborador'] || '').toLowerCase().trim();
        const empId = nameToId[nome];
        if (!empId) continue;
        let periodStart = row['InÃ­cio PerÃ­odo'] || row['inicio_periodo'] || '';
        let periodEnd = row['Fim PerÃ­odo'] || row['fim_periodo'] || '';
        if (typeof periodStart === 'number') { const d = XLSX.SSF.parse_date_code(periodStart); periodStart = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`; }
        if (typeof periodEnd === 'number') { const d = XLSX.SSF.parse_date_code(periodEnd); periodEnd = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`; }
        if (!periodStart || !periodEnd) continue;
        await supabase.from('overtime_control').insert({
          employee_id: empId,
          period_start: periodStart,
          period_end: periodEnd,
          extras_count: parseInt(row['Extras Realizadas'] || row['extras_count'] || '0') || 0,
          max_extras: parseInt(row['MÃ¡ximo Extras'] || row['max_extras'] || '3') || 3,
        });
        imported++;
      }
      toast.success(`${imported} registros de extras importados com sucesso!`);
      fetchAll();
    } catch {
      toast.error('Erro ao importar arquivo de extras');
    }
    if (extrasFileRef.current) extrasFileRef.current.value = '';
  }


  // â”€â”€â”€ Deviations Report PDF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function exportDeviationsReport() {
    const logoBase64 = await getBusatoLogoBase64();
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header with Busato logo
    drawBusatoHeader(doc, logoBase64, { pageWidth });

    doc.setTextColor(0, 0, 0);

    // Build data per employee
    const deviationRows: any[][] = [];
    funcionarios.forEach(f => {
      const empAtt = attendance.filter(a => a.employee_id === f.id);
      const faltasInj = empAtt.filter(a => a.status === 'falta_injustificada').length;
      const faltasJust = empAtt.filter(a => a.status === 'falta_justificada').length;
      const atestados = empAtt.filter(a => a.status === 'atestado').length;
      const hrsNeg = faltasInj + faltasJust + atestados;
      const extras = empAtt.filter(a => a.status === 'extra').length;
      const empWarnings = warnings.filter(w => w.employee_id === f.id);
      const advApplied = empWarnings.filter(w => w.applied).length;
      const advPending = empWarnings.filter(w => !w.applied).length;

      if (hrsNeg > 0 || faltasInj > 0 || atestados > 0 || advApplied > 0) {
        deviationRows.push([
          f.nome,
          `${f.cargo}`,
          `${f.turno}/${f.letra}`,
          hrsNeg,
          faltasInj,
          faltasJust,
          atestados,
          extras,
          advApplied > 0 ? `${advApplied} aplicada(s)` : 'â€”',
          advPending > 0 ? `${advPending} pendente(s)` : 'â€”',
        ]);
      }
    });

    autoTable(doc, {
      startY: 34,
      head: [['Colaborador', 'Cargo', 'Turno/Letra', 'Hrs Neg.', 'Faltas Inj.', 'Faltas Just.', 'Atestados', 'Extras', 'AdvertÃªncias', 'Pendentes']],
      body: deviationRows.length > 0 ? deviationRows : [['Nenhum desvio registrado no perÃ­odo', '', '', '', '', '', '', '', '', '']],
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 187], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        3: { halign: 'center', fontStyle: 'bold' },
        4: { halign: 'center', textColor: [220, 38, 38] },
        5: { halign: 'center', textColor: [180, 120, 0] },
        6: { halign: 'center', textColor: [37, 99, 235] },
        7: { halign: 'center' },
      },
    });

    // Warning details section
    if (warnings.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALHAMENTO DE ADVERTÃŠNCIAS', 14, finalY + 12);

      autoTable(doc, {
        startY: finalY + 18,
        head: [['Colaborador', 'Data', 'Motivo', 'Aplicada', 'ObservaÃ§Ã£o']],
        body: warnings.map(w => [
          w.employee_name,
          formatDate(w.date),
          w.reason,
          w.applied ? 'SIM' : 'NÃƒO',
          w.observation || 'â€”',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [255, 245, 245] },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(`BUSATO â€” RelatÃ³rio de Desvios â€” PÃ¡g. ${i}/${pageCount}`, 14, doc.internal.pageSize.getHeight() - 8);
      doc.text('Documento confidencial de uso exclusivo do RH', pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    }

    doc.save(`Relatorio_Desvios_${period.start}_${period.end}.pdf`);
    toast.success('RelatÃ³rio de desvios exportado com sucesso!');
  }

  // â”€â”€â”€ Computed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const vacationAlerts = useMemo(() => {
    const today = new Date();
    return vacations.filter(v => {
      if (!v.start_date || !v.end_date) return false;
      const start = new Date(v.start_date);
      const end = new Date(v.end_date);
      return (today >= start && today <= end) || (start.getTime() - today.getTime() <= 7 * 86400000 && start > today);
    });
  }, [vacations]);

  const onVacationNow = useMemo(() => {
    const today = new Date();
    return vacations.filter(v => v.start_date && v.end_date && today >= new Date(v.start_date) && today <= new Date(v.end_date));
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

  // â”€â”€â”€ Employee-filtered data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const empAttendance = useMemo(() => {
    if (!selectedEmployee) return attendance;
    return attendance.filter(a => a.employee_id === selectedEmployee.id);
  }, [attendance, selectedEmployee]);

  const empWarnings = useMemo(() => {
    if (!selectedEmployee) return warnings;
    return warnings.filter(w => w.employee_id === selectedEmployee.id);
  }, [warnings, selectedEmployee]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    empAttendance.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return Object.entries(counts).map(([status, value]) => ({
      name: statusLabels[status] || status, value, fill: statusColors[status] || '#94a3b8'
    }));
  }, [empAttendance]);

  const dailyChartData = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {};
    empAttendance.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = {};
      byDate[a.date][a.status] = (byDate[a.date][a.status] || 0) + 1;
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-15)
      .map(([date, statuses]) => ({
        date: new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        'Hrs Negativas': (statuses.falta_injustificada || 0) + (statuses.falta_justificada || 0) + (statuses.atestado || 0),
        'Faltas Inj.': statuses.falta_injustificada || 0,
        Extras: statuses.extra || 0,
        Atestados: statuses.atestado || 0,
        FÃ©rias: statuses.ferias || 0,
      }));
  }, [empAttendance]);

  const extrasPerEmployee = useMemo(() => {
    const map: Record<string, { name: string; count: number; limit: number }> = {};
    empAttendance.filter(a => a.status === 'extra').forEach(a => {
      if (!map[a.employee_id]) map[a.employee_id] = { name: a.employee_name || '', count: 0, limit: 3 };
      map[a.employee_id].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [empAttendance]);

  const negativeHoursPerEmployee = useMemo(() => {
    const map: Record<string, { name: string; faltasInj: number; faltasJust: number; atestados: number; total: number }> = {};
    empAttendance.forEach(a => {
      if (!['falta_injustificada', 'falta_justificada', 'atestado'].includes(a.status)) return;
      if (!map[a.employee_id]) map[a.employee_id] = { name: a.employee_name || '', faltasInj: 0, faltasJust: 0, atestados: 0, total: 0 };
      if (a.status === 'falta_injustificada') map[a.employee_id].faltasInj++;
      if (a.status === 'falta_justificada') map[a.employee_id].faltasJust++;
      if (a.status === 'atestado') map[a.employee_id].atestados++;
      map[a.employee_id].total++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [empAttendance]);

  const dailyMovements = useMemo(() => {
    const byDate: Record<string, number> = {};
    empAttendance.forEach(a => { byDate[a.date] = (byDate[a.date] || 0) + 1; });
    const today = new Date().toISOString().split('T')[0];
    const todayCount = byDate[today] || 0;
    const totalDays = Object.keys(byDate).length;
    const daysMetGoal = Object.values(byDate).filter(c => c >= DAILY_MOVEMENT_GOAL).length;
    return { todayCount, totalDays, daysMetGoal, goalPct: totalDays > 0 ? Math.round((daysMetGoal / totalDays) * 100) : 0 };
  }, [empAttendance]);

  const totalHorasNegativas = empAttendance.filter(a => ['falta_injustificada', 'falta_justificada', 'atestado'].includes(a.status)).length;
  const totalFaltasInj = empAttendance.filter(a => a.status === 'falta_injustificada').length;
  const totalExtras = empAttendance.filter(a => a.status === 'extra').length;
  const totalAtestados = empAttendance.filter(a => a.status === 'atestado').length;
  const totalWarnings = empWarnings.length;

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      presente: 'bg-success/10 text-success', falta_injustificada: 'bg-destructive/10 text-destructive',
      falta_justificada: 'bg-warning/10 text-warning', atestado: 'bg-blue-500/10 text-blue-600',
      extra: 'bg-purple-500/10 text-purple-600', ferias: 'bg-teal-500/10 text-teal-600',
      afastamento: 'bg-red-500/10 text-red-600', abono: 'bg-yellow-500/10 text-yellow-700',
      banco_horas: 'bg-indigo-500/10 text-indigo-600',
    };
    return colors[s] || 'bg-muted text-muted-foreground';
  };

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
      <input ref={pontoFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportPonto} />
      <input ref={feriasFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFerias} />
      <input ref={extrasFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExtras} />

      {/* â•â•â• HEADER + ACTIONS â•â•â• */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">GestÃ£o Ã  Vista â€” Ponto / FÃ©rias</h1>
            <p className="text-muted-foreground text-sm mt-1">Painel de controle operacional</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" />Registrar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDialogOpen(true)}><CalendarDays className="w-4 h-4 mr-2" />Registrar Ponto</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setVacDialogOpen(true)}><Sun className="w-4 h-4 mr-2" />Registrar FÃ©rias</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Ponto DiÃ¡rio</DialogTitle>
                  <DialogDescription>Registre o ponto para um colaborador no perÃ­odo atual.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>FuncionÃ¡rio</Label>
                    <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {funcionarios.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nome} ({f.letra}-{f.turno})
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
                    {form.status === 'falta_injustificada' && (
                      <p className="text-xs text-destructive mt-1 font-medium">âš ï¸ Falta Injustificada NÃƒO contempla banco de horas</p>
                    )}
                    {form.status === 'extra' && form.employee_id && (() => {
                      const extrasUsed = attendance.filter(a => a.employee_id === form.employee_id && a.status === 'extra').length;
                      return (
                        <p className={`text-xs mt-1 ${extrasUsed >= 3 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                          {extrasUsed}/3 extras utilizadas neste perÃ­odo {extrasUsed >= 3 ? 'â€” â›” BLOQUEADO' : ''}
                        </p>
                      );
                    })()}
                  </div>
                  <div className="space-y-2">
                    <Label>ObservaÃ§Ã£o</Label>
                    <FastTextarea value={form.observation} onValueChange={v => setForm(f => ({ ...f, observation: v }))} rows={2} />
                  </div>
                  <Button className="w-full" onClick={handleCreateAttendance}>Registrar</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={vacDialogOpen} onOpenChange={setVacDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar / Atualizar FÃ©rias</DialogTitle>
                  <DialogDescription>Gerencie o perÃ­odo de fÃ©rias de um colaborador.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>FuncionÃ¡rio</Label>
                    <Select value={vacForm.employee_id} onValueChange={v => setVacForm({ ...vacForm, employee_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Qtd. Dias</Label><Input type="number" value={vacForm.days_count} onChange={e => setVacForm({ ...vacForm, days_count: e.target.value })} /></div>
                    <div className="space-y-2"><Label>MÃªs Programado</Label><FastInput placeholder="Ex: MarÃ§o" value={vacForm.scheduled_month} onValueChange={v => setVacForm(f => ({ ...f, scheduled_month: v }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>InÃ­cio</Label><Input type="date" value={vacForm.start_date} onChange={e => setVacForm({ ...vacForm, start_date: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Fim</Label><Input type="date" value={vacForm.end_date} onChange={e => setVacForm({ ...vacForm, end_date: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>ObservaÃ§Ã£o</Label><FastTextarea value={vacForm.observation} onValueChange={v => setVacForm(f => ({ ...f, observation: v }))} rows={2} /></div>
                  <Button className="w-full" onClick={handleCreateVacation}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Warning Dialog */}
            <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/5">
                  <ShieldAlert className="w-4 h-4 mr-2" />AdvertÃªncia
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar AdvertÃªncia</DialogTitle>
                  <DialogDescription>Aplique uma advertÃªncia formal a um colaborador.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>FuncionÃ¡rio</Label>
                    <Select value={warningForm.employee_id} onValueChange={v => setWarningForm({ ...warningForm, employee_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome} ({f.cargo})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input type="date" value={warningForm.date} onChange={e => setWarningForm({ ...warningForm, date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Aplicada?</Label>
                      <Select value={warningForm.applied} onValueChange={v => setWarningForm({ ...warningForm, applied: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Sim â€” Aplicada</SelectItem>
                          <SelectItem value="false">NÃ£o â€” Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Motivo</Label>
                    <FastTextarea value={warningForm.reason} onValueChange={v => setWarningForm(f => ({ ...f, reason: v }))} rows={2} placeholder="Descreva o motivo da advertÃªncia" />
                  </div>
                  <div className="space-y-2">
                    <Label>ObservaÃ§Ã£o</Label>
                    <FastTextarea value={warningForm.observation} onValueChange={v => setWarningForm(f => ({ ...f, observation: v }))} rows={2} />
                  </div>
                  <Button className="w-full" onClick={handleCreateWarning}>Registrar AdvertÃªncia</Button>
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline"><Upload className="w-4 h-4 mr-2" />Importar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => pontoFileRef.current?.click()}><Upload className="w-4 h-4 mr-2" />Importar Ponto</DropdownMenuItem>
                <DropdownMenuItem onClick={() => feriasFileRef.current?.click()}><Upload className="w-4 h-4 mr-2" />Importar FÃ©rias</DropdownMenuItem>
                <DropdownMenuItem onClick={() => extrasFileRef.current?.click()}><Upload className="w-4 h-4 mr-2" />Importar Extras</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Deviations Report */}
            <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-600 hover:bg-orange-500/5" onClick={exportDeviationsReport}>
              <FileText className="w-4 h-4 mr-2" />RelatÃ³rio de Desvios
            </Button>
          </div>
        </div>
      </motion.div>

      {/* â•â•â• PERIOD FILTER + EMPLOYEE FILTER â•â•â• */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="flex-1 w-full">
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
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
              <input type="text" placeholder="Filtrar por funcionÃ¡rio..." value={employeeSearch}
                onChange={e => { setEmployeeSearch(e.target.value); setShowEmpDropdown(true); }}
                onFocus={() => setShowEmpDropdown(true)}
                className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
            )}
          </div>
          {showEmpDropdown && filteredSearchEmps.length > 0 && !selectedEmployee && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
              {filteredSearchEmps.map(f => (
                <button key={f.id} onClick={() => { setSelectedEmployee(f); setEmployeeSearch(''); setShowEmpDropdown(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left">
                  {f.foto_url ? (
                    <img src={f.foto_url} className="w-7 h-7 rounded-full object-cover border border-border" alt="" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{f.nome.charAt(0)}</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{f.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{f.cargo} Â· {f.turno}/{f.letra}</p>
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
            <img src={selectedEmployee.foto_url} className="w-10 h-10 rounded-full object-cover border-2 border-primary/30" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{selectedEmployee.nome.charAt(0)}</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">{selectedEmployee.nome}</p>
            <p className="text-sm text-muted-foreground">{selectedEmployee.cargo} Â· {selectedEmployee.departamento} Â· {selectedEmployee.turno}/{selectedEmployee.letra}</p>
          </div>
          <button onClick={() => navigate(`/funcionario/${selectedEmployee.id}`)} className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium shrink-0">
            <Eye className="w-3.5 h-3.5" /> Ver Perfil
          </button>
        </motion.div>
      )}

      {/* â•â•â• ALERTS BANNER â•â•â• */}
      {(vacationAlerts.length > 0 || overtimeLimitAlerts.length > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {vacationAlerts.map(v => {
            const start = new Date(v.start_date!);
            const today = new Date();
            const isOnVacation = today >= start && today <= new Date(v.end_date!);
            return (
              <div key={v.id} className={`flex items-center gap-3 rounded-lg p-3 border ${isOnVacation ? 'bg-teal-500/5 border-teal-500/20' : 'bg-warning/5 border-warning/20'}`}>
                <Sun className={`w-4 h-4 flex-shrink-0 ${isOnVacation ? 'text-teal-500' : 'text-warning'}`} />
                <p className="text-sm">
                  <span className="font-semibold">{v.employee_name}</span>
                  {isOnVacation ? ` em fÃ©rias atÃ© ${formatDate(v.end_date)}` : ` inicia fÃ©rias em ${formatDate(v.start_date)}`}
                </p>
              </div>
            );
          })}
          {overtimeLimitAlerts.map(o => (
            <div key={o.employee_name} className="flex items-center gap-3 rounded-lg p-3 border bg-destructive/5 border-destructive/20">
              <Shield className="w-4 h-4 flex-shrink-0 text-destructive" />
              <p className="text-sm">
                <span className="font-semibold">{o.employee_name}</span> â€” <strong>{o.count}/3 extras</strong> â›” BLOQUEADO
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* â•â•â• KPI CARDS â•â•â• */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Registros', value: attendance.length, icon: CalendarDays, color: 'border-t-primary' },
          { label: 'Horas Negativas', value: totalHorasNegativas, icon: MinusCircle, color: 'border-t-orange-500' },
          { label: 'Faltas Injust.', value: totalFaltasInj, icon: AlertTriangle, color: 'border-t-destructive' },
          { label: 'Extras', value: totalExtras, icon: TrendingUp, color: 'border-t-purple-500' },
          { label: 'Atestados', value: totalAtestados, icon: Clock, color: 'border-t-blue-500' },
          { label: 'Em FÃ©rias', value: onVacationNow.length, icon: Sun, color: 'border-t-teal-500' },
          { label: 'Bloqueados', value: overtimeLimitAlerts.length, icon: Shield, color: 'border-t-destructive' },
          { label: 'AdvertÃªncias', value: totalWarnings, icon: ShieldAlert, color: 'border-t-red-600' },
        ].map((kpi, idx) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className={`corporate-kpi ${kpi.color}`}>
            <div className="flex items-center justify-between mb-1">
              <kpi.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* â•â•â• META DIÃRIA â•â•â• */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="corporate-section">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Meta DiÃ¡ria â€” {DAILY_MOVEMENT_GOAL} MovimentaÃ§Ãµes / Dia
          </h3>
          <span className="text-xs text-muted-foreground">Hoje: {dailyMovements.todayCount}/{DAILY_MOVEMENT_GOAL}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg p-4 border border-border bg-card">
            <p className="text-xs text-muted-foreground mb-2">MovimentaÃ§Ãµes Hoje</p>
            <div className="flex items-center gap-3">
              <p className={`text-3xl font-bold ${dailyMovements.todayCount >= DAILY_MOVEMENT_GOAL ? 'text-success' : 'text-warning'}`}>
                {dailyMovements.todayCount}
              </p>
              <div className="flex-1">
                <Progress value={Math.min((dailyMovements.todayCount / DAILY_MOVEMENT_GOAL) * 100, 100)}
                  className={`h-2 ${dailyMovements.todayCount >= DAILY_MOVEMENT_GOAL ? '[&>div]:bg-success' : '[&>div]:bg-warning'}`} />
              </div>
              {dailyMovements.todayCount >= DAILY_MOVEMENT_GOAL ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-success/10 text-success">âœ“ META</span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-warning/10 text-warning">PENDENTE</span>
              )}
            </div>
          </div>
          <div className="rounded-lg p-4 border border-border bg-card">
            <p className="text-xs text-muted-foreground mb-2">Dias com Meta Atingida</p>
            <p className="text-3xl font-bold text-foreground">{dailyMovements.daysMetGoal}<span className="text-sm text-muted-foreground">/{dailyMovements.totalDays}</span></p>
          </div>
          <div className="rounded-lg p-4 border border-border bg-card">
            <p className="text-xs text-muted-foreground mb-2">AderÃªncia Ã  Meta</p>
            <p className={`text-3xl font-bold ${dailyMovements.goalPct >= 80 ? 'text-success' : dailyMovements.goalPct >= 50 ? 'text-warning' : 'text-destructive'}`}>
              {dailyMovements.goalPct}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* â•â•â• CHARTS ROW â•â•â• */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="corporate-section lg:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            MovimentaÃ§Ã£o DiÃ¡ria â€” Ãšltimos 15 dias
          </h3>
          {dailyChartData.length > 0 ? (
            


<ExpandableChart title="Visualização Ampliada">
<ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Hrs Negativas" stackId="a" fill="hsl(25, 90%, 50%)" />
                <Bar dataKey="Faltas Inj." stackId="a" fill="hsl(var(--destructive))" />
                <Bar dataKey="Extras" stackId="a" fill="hsl(260, 60%, 55%)" />
                <Bar dataKey="Atestados" stackId="a" fill="hsl(200, 70%, 50%)" />
                <Bar dataKey="FÃ©rias" stackId="a" fill="hsl(160, 60%, 45%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
</ExpandableChart>



          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarDays className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Nenhum registro de ponto no perÃ­odo</p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="corporate-section">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            DistribuiÃ§Ã£o por Status
          </h3>
          {statusDistribution.length > 0 ? (
            


<ExpandableChart title="Visualização Ampliada">
<ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
</ExpandableChart>



          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Eye className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Sem dados para exibir</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* â•â•â• HORAS NEGATIVAS POR COLABORADOR â•â•â• */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
        className="corporate-section">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          <MinusCircle className="w-3.5 h-3.5 inline mr-1.5" />
          Horas Negativas por Colaborador â€” {period.label}
        </h3>
        {negativeHoursPerEmployee.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Colaborador</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Faltas Injust.</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Faltas Just.</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Atestados</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Total Hrs Neg.</th>
                </tr>
              </thead>
              <tbody>
                {negativeHoursPerEmployee.map((emp, i) => (
                  <tr key={emp.name} className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}>
                    <td className="px-4 py-2.5 font-medium text-sm">{emp.name}</td>
                    <td className="px-4 py-2.5 text-center text-xs font-semibold text-destructive">{emp.faltasInj}</td>
                    <td className="px-4 py-2.5 text-center text-xs font-semibold text-warning">{emp.faltasJust}</td>
                    <td className="px-4 py-2.5 text-center text-xs font-semibold text-blue-600">{emp.atestados}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${emp.total >= 3 ? 'bg-destructive/10 text-destructive' : 'bg-orange-500/10 text-orange-600'}`}>
                        {emp.total}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MinusCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Nenhuma hora negativa registrada no perÃ­odo</p>
          </div>
        )}
      </motion.div>

      {/* â•â•â• EXTRAS CONTROL â•â•â• */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="corporate-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Controle de Horas Extras â€” Limite: 3 por PerÃ­odo
          </h3>
          <span className="text-xs text-muted-foreground">{period.label}</span>
        </div>

        {extrasPerEmployee.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {extrasPerEmployee.map(emp => {
              const pct = (emp.count / emp.limit) * 100;
              const isBlocked = emp.count >= emp.limit;
              return (
                <div key={emp.name} className={`rounded-lg p-4 border transition-colors ${isBlocked ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm truncate mr-2">{emp.name}</span>
                    <span className={`text-xs font-bold whitespace-nowrap ${isBlocked ? 'text-destructive' : 'text-foreground'}`}>
                      {emp.count}/{emp.limit}
                      {isBlocked && ' â›”'}
                    </span>
                  </div>
                  <Progress value={Math.min(pct, 100)} className={`h-2 ${isBlocked ? '[&>div]:bg-destructive' : pct >= 66 ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`} />
                  {isBlocked && <p className="text-[10px] text-destructive font-semibold mt-1.5 uppercase tracking-wider">Novas extras bloqueadas</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Nenhuma extra registrada no perÃ­odo atual</p>
          </div>
        )}
      </motion.div>

      {/* â•â•â• ADVERTÃŠNCIAS â•â•â• */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.27 }}
        className="corporate-section">
        <button onClick={() => setShowWarningsTable(!showWarningsTable)}
          className="w-full flex items-center justify-between text-left">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            AdvertÃªncias Registradas ({warnings.length})
          </h3>
          {showWarningsTable ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showWarningsTable && (
          <div className="mt-4 overflow-x-auto">
            {warnings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma advertÃªncia registrada</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Colaborador</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Data</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Motivo</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Aplicada</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">ObservaÃ§Ã£o</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">AÃ§Ã£o</th>
                  </tr>
                </thead>
                <tbody>
                  {warnings.map((w, i) => (
                    <tr key={w.id} className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}>
                      <td className="px-4 py-2.5 font-medium text-sm">{w.employee_name}</td>
                      <td className="px-4 py-2.5 text-xs">{formatDate(w.date)}</td>
                      <td className="px-4 py-2.5 text-xs max-w-[200px] truncate">{w.reason}</td>
                      <td className="px-4 py-2.5 text-center">
                        {w.applied ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-destructive/10 text-destructive">APLICADA</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-warning/10 text-warning">PENDENTE</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate">{w.observation || 'â€”'}</td>
                      <td className="px-4 py-2.5 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteWarning(w.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </motion.div>

      {/* â•â•â• VACATION OVERVIEW â•â•â• */}
      {vacations.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="corporate-section">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            ProgramaÃ§Ã£o de FÃ©rias â€” {vacations.length} colaboradores
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {vacations.slice(0, 9).map(v => {
              const today = new Date();
              const isOnVac = v.start_date && v.end_date && today >= new Date(v.start_date) && today <= new Date(v.end_date);
              const isPending = v.scheduled_month && !v.start_date;
              return (
                <div key={v.id} className={`rounded-lg p-3 border transition-colors ${isOnVac ? 'border-teal-500/40 bg-teal-500/5' : 'border-border bg-card'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm truncate">{v.employee_name}</span>
                    <div className="flex items-center gap-1">
                      {isOnVac ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-teal-500/10 text-teal-600 whitespace-nowrap">EM FÃ‰RIAS</span>
                      ) : isPending ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-warning/10 text-warning whitespace-nowrap">PROGRAMADA</span>
                      ) : null}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditVacation(v)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{v.cargo} Â· {v.letra}-{v.turno}</p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>InÃ­cio: {formatDate(v.start_date)}</span>
                    <span>Fim: {formatDate(v.end_date)}</span>
                  </div>
                  {v.scheduled_month && <p className="text-xs text-muted-foreground mt-1">MÃªs prog.: {v.scheduled_month}</p>}
                </div>
              );
            })}
          </div>
          {vacations.length > 9 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              + {vacations.length - 9} colaboradores. Veja todos na tabela abaixo.
            </p>
          )}
        </motion.div>
      )}

      {/* â•â•â• EMPLOYEE ROSTER â•â•â• */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
        className="corporate-section">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Quadro de Colaboradores â€” {funcionarios.length} cadastrados
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Colaborador</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">FunÃ§Ã£o</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Turno / Letra</th>
                <th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Hrs Negativas</th>
                <th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Faltas Inj.</th>
                <th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Atestados</th>
                <th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Extras</th>
                <th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Advert.</th>
                <th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((f, i) => {
                const empAtt = attendance.filter(a => a.employee_id === f.id);
                const hrsNeg = empAtt.filter(a => ['falta_injustificada', 'falta_justificada', 'atestado'].includes(a.status)).length;
                const faltasInj = empAtt.filter(a => a.status === 'falta_injustificada').length;
                const atestados = empAtt.filter(a => a.status === 'atestado').length;
                const extras = empAtt.filter(a => a.status === 'extra').length;
                const empWarns = warnings.filter(w => w.employee_id === f.id).length;
                const vac = vacations.find(v => v.employee_id === f.id);
                const today = new Date();
                const isOnVac = vac?.start_date && vac?.end_date && today >= new Date(vac.start_date) && today <= new Date(vac.end_date);
                const isBlocked = extras >= 3;
                return (
                  <tr key={f.id} className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}>
                    <td className="px-4 py-2.5 font-medium text-sm">{f.nome}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{f.cargo}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{f.turno} / {f.letra}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-bold ${hrsNeg > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>{hrsNeg}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs font-semibold text-destructive">{faltasInj}</td>
                    <td className="px-4 py-2.5 text-center text-xs font-semibold text-blue-600">{atestados}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-bold ${isBlocked ? 'text-destructive' : ''}`}>
                        {extras}/3 {isBlocked ? 'â›”' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {empWarns > 0 ? (
                        <span className="text-xs font-bold text-destructive">{empWarns}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {isOnVac ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-teal-500/10 text-teal-600">EM FÃ‰RIAS</span>
                      ) : isBlocked ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-destructive/10 text-destructive">BLOQUEADO</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-success/10 text-success">ATIVO</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* â•â•â• COLLAPSIBLE TABLES â•â•â• */}
      <div className="corporate-section">
        <button onClick={() => setShowPontoTable(!showPontoTable)}
          className="w-full flex items-center justify-between text-left">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Registros de Ponto Detalhados ({attendance.length})
          </h3>
          {showPontoTable ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showPontoTable && (
          <div className="mt-4 overflow-x-auto">
            {attendance.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum registro de ponto no perÃ­odo</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Colaborador</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Turno</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">FunÃ§Ã£o</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Data</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Obs.</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">AÃ§Ã£o</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a, i) => (
                    <tr key={a.id} className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}>
                      <td className="px-4 py-2.5 font-medium text-sm">{a.employee_name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{a.letra}-{a.turno}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{a.cargo}</td>
                      <td className="px-4 py-2.5 text-xs">{formatDate(a.date)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge(a.status)}`}>
                          {statusLabels[a.status] || a.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate">{a.observation || 'â€”'}</td>
                      <td className="px-4 py-2.5 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteAttendance(a.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* FÃ©rias Table */}
      <div className="corporate-section">
        <button onClick={() => setShowFeriasTable(!showFeriasTable)}
          className="w-full flex items-center justify-between text-left">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Registros de FÃ©rias Detalhados ({vacations.length})
          </h3>
          {showFeriasTable ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showFeriasTable && (
          <div className="mt-4 overflow-x-auto">
            {vacations.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum registro de fÃ©rias</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Colaborador</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">FunÃ§Ã£o</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Turno</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Dias</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">InÃ­cio</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Fim</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">AÃ§Ãµes</th>
                  </tr>
                </thead>
                <tbody>
                  {vacations.map((v, i) => {
                    const today = new Date();
                    const isOnVac = v.start_date && v.end_date && today >= new Date(v.start_date) && today <= new Date(v.end_date);
                    const isPending = v.scheduled_month && !v.start_date;
                    return (
                      <tr key={v.id} className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}>
                        <td className="px-4 py-2.5 font-medium text-sm">{v.employee_name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{v.cargo}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{v.letra}-{v.turno}</td>
                        <td className="px-4 py-2.5 text-xs">{v.days_count}</td>
                        <td className="px-4 py-2.5 text-xs">{formatDate(v.start_date)}</td>
                        <td className="px-4 py-2.5 text-xs">{formatDate(v.end_date)}</td>
                        <td className="px-4 py-2.5">
                          {isOnVac ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-teal-500/10 text-teal-600">Em FÃ©rias</span>
                          ) : isPending ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-warning/10 text-warning">Programada</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">â€”</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditVacation(v)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteVacation(v.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* â•â•â• EDIT VACATION DIALOG â•â•â• */}
      <Dialog open={editVacDialogOpen} onOpenChange={setEditVacDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar FÃ©rias</DialogTitle>
            <DialogDescription>Altere as datas ou informaÃ§Ãµes das fÃ©rias do colaborador.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Qtd. Dias</Label><Input type="number" value={editVacForm.days_count} onChange={e => setEditVacForm({ ...editVacForm, days_count: e.target.value })} /></div>
              <div className="space-y-2"><Label>MÃªs Programado</Label><Input value={editVacForm.scheduled_month} onChange={e => setEditVacForm({ ...editVacForm, scheduled_month: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>InÃ­cio</Label><Input type="date" value={editVacForm.start_date} onChange={e => setEditVacForm({ ...editVacForm, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Fim</Label><Input type="date" value={editVacForm.end_date} onChange={e => setEditVacForm({ ...editVacForm, end_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>ObservaÃ§Ã£o</Label><FastTextarea value={editVacForm.observation} onValueChange={v => setEditVacForm(f => ({ ...f, observation: v }))} rows={2} /></div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleEditVacation}>Salvar AlteraÃ§Ãµes</Button>
              <Button variant="destructive" onClick={() => { deleteVacation(editVacForm.id); setEditVacDialogOpen(false); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
