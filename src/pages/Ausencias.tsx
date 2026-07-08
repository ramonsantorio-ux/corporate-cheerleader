import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ExpandableChart } from '@/components/ui/ExpandableChart';
import {
  CalendarDays, Plus, Loader2, Trash2, Clock, AlertTriangle,
  Users, TrendingUp, Sun, Shield, ChevronDown, ChevronUp, Eye,
  Upload, Pencil, Bell, MinusCircle, FileText, ShieldAlert, Search, X, Download
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { readExcelRows, parseExcelDate } from '@/lib/excel';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBusatoLogoBase64, drawBusatoHeader, drawBusatoFooter } from '@/lib/pdfLogo';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Attendance {
  id: string; employee_id: string; date: string; status: string;
  observation: string; created_at: string; employee_name?: string;
  turno?: string; letra?: string; cargo?: string; cid?: string; crm?: string; dias_afastamento?: number;
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
  atestado: 'Atestado', extra: 'Extra', ferias: 'Férias', afastamento: 'Afastamento',
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
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

// ─── Main Component ─────────────────────────────────────────────────────────
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

  const [form, setForm] = useState({ employee_id: '', date: '', status: 'falta_injustificada', observation: '', cid: '', crm: '', dias_afastamento: '1' });
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

  // ─── Leader alert popups ──────────────────────────────────────────────
  useEffect(() => {
    if (alertsShown || loading || attendance.length === 0) return;

    const extrasMap: Record<string, { name: string; count: number }> = {};
    attendance.filter(a => a.status === 'extra').forEach(a => {
      if (!extrasMap[a.employee_id]) extrasMap[a.employee_id] = { name: a.employee_name || '', count: 0 };
      extrasMap[a.employee_id].count++;
    });
    const blocked = Object.values(extrasMap).filter(e => e.count >= 3);
    blocked.forEach(emp => {
      toast.warning(`⛔ ALERTA: ${emp.name} atingiu ${emp.count}/3 extras no período. Novas extras BLOQUEADAS.`, {
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
        toast.info(`🏖️ ${v.employee_name} está em FÉRIAS até ${formatDate(v.end_date)}`, {
          duration: 6000,
          icon: <Sun className="w-4 h-4" />,
        });
      } else if (start.getTime() - today.getTime() <= 7 * 86400000 && start > today) {
        toast.info(`📅 ${v.employee_name} inicia férias em ${formatDate(v.start_date)}`, {
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
    if (!form.employee_id || !form.date) { toast.error('Preencha os campos obrigatórios'); return; }

    // Falta injustificada does NOT count for banco de horas
    const statusToSave = form.status === 'falta_injustificada' ? 'falta' : form.status;

    if (form.status === 'extra') {
      const { count } = await supabase.from('daily_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', form.employee_id)
        .eq('status', 'extra')
        .gte('date', period.start).lte('date', period.end);

      if ((count || 0) >= 3) {
        toast.error('⚠️ LIMITE ATINGIDO: Este colaborador já realizou 3 extras neste período.');
        return;
      }
    }

    const { error } = await supabase.from('daily_attendance').insert({
      employee_id: form.employee_id, date: form.date, status: statusToSave, observation: form.observation, cid: form.status === 'atestado' ? form.cid : null, crm: form.status === 'atestado' ? form.crm : null, dias_afastamento: form.status === 'atestado' ? parseInt(form.dias_afastamento) || 0 : 0,
    });
    if (error) {
      if (error.code === '23505') toast.error('Já existe registro para este colaborador nesta data');
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
        toast.warning(`⛔ ALERTA LÍDER: ${empName} atingiu o LIMITE de 3 extras! Novas extras BLOQUEADAS.`, { duration: 10000 });
      }
    }

    setDialogOpen(false);
    setForm({ employee_id: '', date: '', status: 'falta_injustificada', observation: '', cid: '', crm: '', dias_afastamento: '1' });
    toast.success('Ponto registrado com sucesso');
    fetchAll();
  }

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

    const empName = funcionarios.find(f => f.id === vacForm.employee_id)?.nome || '';
    if (vacForm.start_date) {
      toast.info(`📅 ALERTA: Férias programadas para ${empName} — Início: ${formatDate(vacForm.start_date)}`, { duration: 8000 });
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
    if (error) { toast.error('Erro ao atualizar férias'); return; }
    setEditVacDialogOpen(false);
    toast.success('Férias atualizadas!');
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
    try {
      const { error } = await supabase.from('daily_attendance').delete().eq('id', id);
      if (error) throw error;
      toast.success('Registro removido');
      fetchAll();
    } catch (err: any) {
      toast.error('Erro ao remover: ' + err.message);
    }
  }

  async function deleteVacation(id: string) {
    try {
      const { error } = await supabase.from('vacation_control').delete().eq('id', id);
      if (error) throw error;
      toast.success('Registro removido');
      fetchAll();
    } catch (err: any) {
      toast.error('Erro ao remover: ' + err.message);
    }
  }

  // ─── Warning handlers ─────────────────────────────────────────────────
  async function handleCreateWarning() {
    if (!warningForm.employee_id || !warningForm.reason) { toast.error('Preencha funcionário e motivo'); return; }
    const { error } = await supabase.from('employee_warnings').insert({
      employee_id: warningForm.employee_id,
      date: warningForm.date,
      reason: warningForm.reason,
      applied: warningForm.applied === 'true',
      observation: warningForm.observation,
    });
    if (error) { toast.error('Erro ao registrar advertência'); return; }
    setWarningDialogOpen(false);
    setWarningForm({ employee_id: '', date: new Date().toISOString().split('T')[0], reason: '', applied: 'true', observation: '' });
    toast.success('Advertência registrada!');
    fetchAll();
  }

  async function deleteWarning(id: string) {
    try {
      const { error } = await supabase.from('employee_warnings').delete().eq('id', id);
      if (error) throw error;
      toast.success('Advertência removida');
      fetchAll();
    } catch (err: any) {
      toast.error('Erro ao remover: ' + err.message);
    }
  }

  // ─── Import handlers ──────────────────────────────────────────────────
  async function handleImportPonto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const rows = await readExcelRows(data);

      const nameToId = Object.fromEntries(funcionarios.map(f => [f.nome.toLowerCase().trim(), f.id]));
      let imported = 0;

      for (const row of rows) {
        const nome = String(row['Nome'] || row['nome'] || row['Colaborador'] || row['colaborador'] || '').toLowerCase().trim();
        const empId = nameToId[nome];
        if (!empId) continue;
        const date = row['Data'] || row['data'] || '';
        const status = String(row['Status'] || row['status'] || 'presente').toLowerCase().trim();
        const obs = row['Observação'] || row['observacao'] || row['Obs'] || '';

        if (!date) continue;
        // ExcelJS e parseExcelDate convertem a data
        const parsed = parseExcelDate(date);
        const dateStr = parsed || String(date);

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
      const rows = await readExcelRows(data);

      const nameToId = Object.fromEntries(funcionarios.map(f => [f.nome.toLowerCase().trim(), f.id]));
      let imported = 0;

      for (const row of rows) {
        const nome = String(row['Nome'] || row['nome'] || row['Colaborador'] || row['colaborador'] || '').toLowerCase().trim();
        const empId = nameToId[nome];
        if (!empId) continue;

        // ExcelJS e parseExcelDate convertem a data
        const startDate = parseExcelDate(row['Início'] || row['inicio'] || row['Start']) || '';
        const endDate = parseExcelDate(row['Fim'] || row['fim'] || row['End']) || '';

        await supabase.from('vacation_control').upsert({
          employee_id: empId,
          days_count: parseInt(String(row['Dias'] || row['dias'] || '30')) || 30,
          scheduled_month: row['Mês'] || row['mes'] || '',
          start_date: startDate || null, end_date: endDate || null,
          observation: row['Observação'] || row['observacao'] || '',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'employee_id' });
        imported++;
      }
      toast.success(`${imported} registros de férias importados com sucesso!`);
      fetchAll();
    } catch {
      toast.error('Erro ao importar arquivo de férias');
    }
    if (feriasFileRef.current) feriasFileRef.current.value = '';
  }

  async function handleImportExtras(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const rows = await readExcelRows(data);
      const nameToId = Object.fromEntries(funcionarios.map(f => [f.nome.toLowerCase().trim(), f.id]));
      let imported = 0;
      for (const row of rows) {
        const nome = String(row['Nome'] || row['nome'] || row['Colaborador'] || '').toLowerCase().trim();
        const empId = nameToId[nome];
        if (!empId) continue;
        // ExcelJS já converte datas para string ISO via readExcelRows
        const periodStart = parseExcelDate(row['Início Período'] || row['inicio_periodo']) || '';
        const periodEnd = parseExcelDate(row['Fim Período'] || row['fim_periodo']) || '';
        if (!periodStart || !periodEnd) continue;
        await supabase.from('overtime_control').insert({
          employee_id: empId,
          period_start: periodStart,
          period_end: periodEnd,
          extras_count: parseInt(String(row['Extras Realizadas'] || row['extras_count'] || '0')) || 0,
          max_extras: parseInt(String(row['Máximo Extras'] || row['max_extras'] || '3')) || 3,
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


  // ─── Deviations Report PDF ────────────────────────────────────────────
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
          advApplied > 0 ? `${advApplied} aplicada(s)` : '—',
          advPending > 0 ? `${advPending} pendente(s)` : '—',
        ]);
      }
    });

    autoTable(doc, {
      startY: 34,
      head: [['Colaborador', 'Cargo', 'Turno/Letra', 'Hrs Neg.', 'Faltas Inj.', 'Faltas Just.', 'Atestados', 'Extras', 'Advertências', 'Pendentes']],
      body: deviationRows.length > 0 ? deviationRows : [['Nenhum desvio registrado no período', '', '', '', '', '', '', '', '', '']],
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
      doc.text('DETALHAMENTO DE ADVERTÊNCIAS', 14, finalY + 12);

      autoTable(doc, {
        startY: finalY + 18,
        head: [['Colaborador', 'Data', 'Motivo', 'Aplicada', 'Observação']],
        body: warnings.map(w => [
          w.employee_name,
          formatDate(w.date),
          w.reason,
          w.applied ? 'SIM' : 'NÃO',
          w.observation || '—',
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
      doc.text(`BUSATO — Relatório de Desvios — Pág. ${i}/${pageCount}`, 14, doc.internal.pageSize.getHeight() - 8);
      doc.text('Documento confidencial de uso exclusivo do RH', pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    }

    doc.save(`Relatorio_Desvios_${period.start}_${period.end}.pdf`);
    toast.success('Relatório de desvios exportado com sucesso!');
  }

  // ─── Computed ──────────────────────────────────────────────────────────
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

  const medicalAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return attendance.filter(a => (a.status === 'atestado' || a.status === 'afastamento') && a.date).filter(a => {
      const start = new Date(a.date + 'T00:00:00');
      const dias = a.dias_afastamento || 1;
      const end = new Date(start.getTime() + (dias - 1) * 86400000);
      return today >= start && today <= end;
    });
  }, [attendance]);

  // ─── Employee-filtered data ───────────────────────────────────────────
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
        Férias: statuses.ferias || 0,
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

    // ─── Atestados Analytics ──────────────────────────────────────────────
  const atestadosAnalytics = useMemo(() => {
    let diasPerdidos = 0;
    const cidCount: Record<string, number> = {};
    const empAtestados: Record<string, { name: string, count: number, days: number }> = {};
    const cargoAtestados: Record<string, number> = {};

    attendance.forEach(a => {
      if (a.status === 'atestado') {
        const dias = a.dias_afastamento || 1; // assumindo 1 dia se não preenchido
        diasPerdidos += dias;
        
        if (a.cid) cidCount[a.cid.toUpperCase()] = (cidCount[a.cid.toUpperCase()] || 0) + 1;
        
        if (a.employee_id) {
          if (!empAtestados[a.employee_id]) empAtestados[a.employee_id] = { name: a.employee_name || '', count: 0, days: 0 };
          empAtestados[a.employee_id].count += 1;
          empAtestados[a.employee_id].days += dias;
        }

        if (a.cargo) {
          cargoAtestados[a.cargo] = (cargoAtestados[a.cargo] || 0) + 1;
        }
      }
    });

    const topCids = Object.entries(cidCount).sort(([,a], [,b]) => b - a).slice(0, 7).map(([name, value]) => ({ name, value }));
    const topEmpAtestados = Object.values(empAtestados).sort((a, b) => b.count - a.count).slice(0, 10);
    const topCargos = Object.entries(cargoAtestados).sort(([,a], [,b]) => b - a).slice(0, 5).map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value }));

    return { diasPerdidos, topCids, topEmpAtestados, topCargos };
  }, [attendance]);

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

      {/* ═══ HEADER + ACTIONS (Floating Premium) ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} 
        className="glass-card flex flex-col md:flex-row items-center justify-between gap-4 p-4 lg:px-6 lg:py-4 mb-6 z-10 sticky top-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-primary/10 text-primary p-2 rounded-xl"><CalendarDays className="w-5 h-5" /></span>
            Gestão à Vista — Ponto / Férias
          </h1>
          <p className="text-muted-foreground text-sm mt-1 ml-11">Painel de controle operacional centralizado</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"><Plus className="w-4 h-4 mr-2" />Registrar</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-xl border-border/40 backdrop-blur-xl bg-card/90">
              <DropdownMenuItem onClick={() => setDialogOpen(true)} className="cursor-pointer"><CalendarDays className="w-4 h-4 mr-2 text-primary" />Registrar Ponto</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setVacDialogOpen(true)} className="cursor-pointer"><Sun className="w-4 h-4 mr-2 text-warning" />Registrar Férias</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Ponto Diário</DialogTitle>
                  <DialogDescription>Registre o ponto para um colaborador no período atual.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Funcionário</Label>
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
                        {Object.entries(statusLabels)
                          .filter(([k]) => k !== 'presente' && k !== 'falta_justificada')
                          .map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {form.status === 'falta_injustificada' && (
                      <p className="text-xs text-destructive mt-1 font-medium">⚠️ Falta Injustificada NÃO contempla banco de horas</p>
                    )}
                    {form.status === 'extra' && form.employee_id && (() => {
                      const extrasUsed = attendance.filter(a => a.employee_id === form.employee_id && a.status === 'extra').length;
                      return (
                        <p className={`text-xs mt-1 ${extrasUsed >= 3 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                          {extrasUsed}/3 extras utilizadas neste período {extrasUsed >= 3 ? '— ⛔ BLOQUEADO' : ''}
                        </p>
                      );
                    })()}
                    {(form.status === 'atestado' || form.status === 'afastamento') && (
                      <div className="space-y-3 mt-4 border-t border-border pt-4">
                        <div className="space-y-2">
                          <Label>Número de Dias</Label>
                          <Input type="number" min="1" value={form.dias_afastamento} onChange={e => setForm({ ...form, dias_afastamento: e.target.value })} />
                        </div>
                        {form.date && parseInt(form.dias_afastamento) > 0 && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 text-sm text-blue-700 flex flex-col gap-1">
                            <span className="font-semibold text-xs uppercase tracking-wider">Retorno ao Trabalho</span>
                            <span>{(() => {
                              const start = new Date(form.date + 'T00:00:00');
                              const dias = parseInt(form.dias_afastamento);
                              const end = new Date(start.getTime() + dias * 86400000);
                              return end.toLocaleDateString('pt-BR');
                            })()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Observação</Label>
                    <FastTextarea value={form.observation} onValueChange={v => setForm(f => ({ ...f, observation: v }))} rows={2} />
                  </div>
                  <Button className="w-full" onClick={handleCreateAttendance}>Registrar</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={vacDialogOpen} onOpenChange={setVacDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar / Atualizar Férias</DialogTitle>
                  <DialogDescription>Gerencie o período de férias de um colaborador.</DialogDescription>
                </DialogHeader>
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
                    <div className="space-y-2"><Label>Qtd. Dias</Label><Input type="number" value={vacForm.days_count} onChange={e => setVacForm({ ...vacForm, days_count: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Mês Programado</Label><FastInput placeholder="Ex: Março" value={vacForm.scheduled_month} onValueChange={v => setVacForm(f => ({ ...f, scheduled_month: v }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Início</Label><Input type="date" value={vacForm.start_date} onChange={e => setVacForm({ ...vacForm, start_date: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Fim</Label><Input type="date" value={vacForm.end_date} onChange={e => setVacForm({ ...vacForm, end_date: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Observação</Label><FastTextarea value={vacForm.observation} onValueChange={v => setVacForm(f => ({ ...f, observation: v }))} rows={2} /></div>
                  <Button className="w-full" onClick={handleCreateVacation}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Warning Dialog */}
            <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/5">
                  <ShieldAlert className="w-4 h-4 mr-2" />Advertência
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Advertência</DialogTitle>
                  <DialogDescription>Aplique uma advertência formal a um colaborador.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Funcionário</Label>
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
                          <SelectItem value="true">Sim — Aplicada</SelectItem>
                          <SelectItem value="false">Não — Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Motivo</Label>
                    <FastTextarea value={warningForm.reason} onValueChange={v => setWarningForm(f => ({ ...f, reason: v }))} rows={2} placeholder="Descreva o motivo da advertência" />
                  </div>
                  <div className="space-y-2">
                    <Label>Observação</Label>
                    <FastTextarea value={warningForm.observation} onValueChange={v => setWarningForm(f => ({ ...f, observation: v }))} rows={2} />
                  </div>
                  <Button className="w-full" onClick={handleCreateWarning}>Registrar Advertência</Button>
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline"><Upload className="w-4 h-4 mr-2" />Importar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => pontoFileRef.current?.click()}><Upload className="w-4 h-4 mr-2" />Importar Ponto</DropdownMenuItem>
                <DropdownMenuItem onClick={() => feriasFileRef.current?.click()}><Upload className="w-4 h-4 mr-2" />Importar Férias</DropdownMenuItem>
                <DropdownMenuItem onClick={() => extrasFileRef.current?.click()}><Upload className="w-4 h-4 mr-2" />Importar Extras</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Deviations Report */}
            <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-600 hover:bg-orange-500/10 transition-colors shadow-sm bg-card/50" onClick={exportDeviationsReport}>
              <FileText className="w-4 h-4 mr-2" />Relatório de Desvios
            </Button>
          </div>
      </motion.div>

      {/* ═══ PERIOD FILTER + EMPLOYEE FILTER ═══ */}
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
              <input type="text" placeholder="Filtrar por funcionário..." value={employeeSearch}
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
                    <p className="text-[10px] text-muted-foreground">{f.cargo} · {f.turno}/{f.letra}</p>
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
            <p className="text-sm text-muted-foreground">{selectedEmployee.cargo} · {selectedEmployee.departamento} · {selectedEmployee.turno}/{selectedEmployee.letra}</p>
          </div>
          <button onClick={() => navigate(`/funcionario/${selectedEmployee.id}`)} className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium shrink-0">
            <Eye className="w-3.5 h-3.5" /> Ver Perfil
          </button>
        </motion.div>
      )}

      {/* ═══ ALERTS BANNER ═══ */}
      {(vacationAlerts.length > 0 || overtimeLimitAlerts.length > 0 || medicalAlerts.length > 0) && (
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
                  {isOnVacation ? ` em férias até ${formatDate(v.end_date)}` : ` inicia férias em ${formatDate(v.start_date)}`}
                </p>
              </div>
            );
          })}
          {overtimeLimitAlerts.map(o => (
            <div key={o.employee_name} className="flex items-center gap-3 rounded-lg p-3 border bg-destructive/5 border-destructive/20">
              <Shield className="w-4 h-4 flex-shrink-0 text-destructive" />
              <p className="text-sm">
                <span className="font-semibold">{o.employee_name}</span> — <strong>{o.count}/3 extras</strong> ⛔ BLOQUEADO
              </p>
            </div>
          ))}
          {medicalAlerts.map(a => {
            const start = new Date(a.date + 'T00:00:00');
            const dias = a.dias_afastamento || 1;
            const end = new Date(start.getTime() + (dias - 1) * 86400000);
            const isAfastamento = a.status === 'afastamento';
            return (
              <div key={a.id} className={`flex items-center gap-3 rounded-lg p-3 border ${isAfastamento ? 'bg-orange-500/5 border-orange-500/20 text-orange-700' : 'bg-blue-500/5 border-blue-500/20 text-blue-700'}`}>
                <Clock className={`w-4 h-4 flex-shrink-0 ${isAfastamento ? 'text-orange-500' : 'text-blue-500'}`} />
                <p className="text-sm">
                  <span className="font-semibold">{a.employee_name}</span> — <strong>{a.status === 'atestado' ? 'Atestado Médico' : 'Afastamento'}</strong> até {formatDate(end.toISOString().split('T')[0])}
                </p>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* ═══ BENTO GRID KPIs ═══ */}
      <div className="bento-grid mt-4">
        
        {/* 1. Super Card - Meta Diária */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }} 
          className="bento-col-span-2 bento-row-span-2 glass-card p-6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden bg-gradient-to-br from-card to-muted/20">
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Meta de Movimentações
              </h3>
              <p className="text-4xl font-black tracking-tight mt-1">
                {dailyMovements.todayCount} <span className="text-xl text-muted-foreground font-medium">/ {DAILY_MOVEMENT_GOAL} Hoje</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-background/50 p-3 rounded-xl border border-border/40">
                <p className="text-xs text-muted-foreground font-medium">Aderência</p>
                <p className={`text-2xl font-bold ${dailyMovements.goalPct >= 80 ? 'text-success' : dailyMovements.goalPct >= 50 ? 'text-warning' : 'text-destructive'}`}>
                  {dailyMovements.goalPct}%
                </p>
              </div>
              <div className="bg-background/50 p-3 rounded-xl border border-border/40">
                <p className="text-xs text-muted-foreground font-medium">Dias Batidos</p>
                <p className="text-2xl font-bold text-foreground">
                  {dailyMovements.daysMetGoal}<span className="text-sm text-muted-foreground">/{dailyMovements.totalDays}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="w-[160px] h-[160px] shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" cy="50%" 
                innerRadius="70%" outerRadius="100%" 
                barSize={12} 
                data={[{ name: 'Meta', value: dailyMovements.todayCount, fill: dailyMovements.todayCount >= DAILY_MOVEMENT_GOAL ? 'hsl(var(--success))' : 'hsl(var(--primary))' }]} 
                startAngle={90} endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, DAILY_MOVEMENT_GOAL]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: 'hsl(var(--muted))' }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {dailyMovements.todayCount >= DAILY_MOVEMENT_GOAL ? (
                <span className="text-success font-black text-xl">✓</span>
              ) : (
                <span className="text-primary font-black text-xl">{Math.round((dailyMovements.todayCount/DAILY_MOVEMENT_GOAL)*100)}%</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* 2. Critical KPIs */}
        {[
          { label: 'Horas Negativas', value: totalHorasNegativas, icon: MinusCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Faltas Injustificadas', value: totalFaltasInj, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
        ].map((kpi, idx) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + (idx * 0.05) }}
            className="glass-card p-5 flex flex-col justify-between group hover:border-border transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight">{kpi.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{kpi.label}</p>
            </div>
          </motion.div>
        ))}

        {/* 3. Secondary KPIs */}
        {[
          { label: 'Extras', value: totalExtras, icon: TrendingUp, class: 'purple' },
          { label: 'Atestados', value: totalAtestados, icon: Clock, class: 'info' },
          { label: 'Em Férias', value: onVacationNow.length, icon: Sun, class: 'success' },
          { label: 'Bloqueados', value: overtimeLimitAlerts.length, icon: Shield, class: 'danger' },
          { label: 'Advertências', value: totalWarnings, icon: ShieldAlert, class: 'danger' },
          { label: 'Total Reg.', value: attendance.length, icon: CalendarDays, class: 'primary' },
        ].map((kpi, idx) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (idx * 0.05) }}
            className={`kpi-card ${kpi.class}`}>
            <div className="flex items-center justify-between mb-2 z-10">
              <kpi.icon className="w-4 h-4 opacity-70" />
            </div>
            <div className="z-10">
              <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-0.5">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ═══ TABS CONTAINER ═══ */}
      <Tabs defaultValue="geral" className="w-full mb-8 mt-8">
        <TabsList className="w-full justify-start h-auto flex-wrap p-1.5 bg-card/80 backdrop-blur-md rounded-xl mb-6 border border-border shadow-sm">
          <TabsTrigger value="geral" className="px-5 py-2.5 text-sm font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">Visão Geral & Gráficos</TabsTrigger>
          <TabsTrigger value="eventos" className="px-5 py-2.5 text-sm font-semibold rounded-lg data-[state=active]:bg-warning data-[state=active]:text-warning-foreground data-[state=active]:shadow-md transition-all">Advertências & Férias</TabsTrigger>
          <TabsTrigger value="registros" className="px-5 py-2.5 text-sm font-semibold rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Quadro & Registros de Ponto</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6 outline-none">

      {/* ═══ CHARTS ROW ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="corporate-section lg:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Movimentação Diária — Últimos 15 dias
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
                <Bar dataKey="Férias" stackId="a" fill="hsl(160, 60%, 45%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
</ExpandableChart>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarDays className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Nenhum registro de ponto no período</p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="corporate-section">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Distribuição por Status
          </h3>
          {statusDistribution.length > 0 ? (
            <ExpandableChart title="Visualização Ampliada">
<ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" innerRadius="50%"
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

            {/* ═══ PAINEL CLÍNICO - ATESTADOS (DASHBOARD VISUAL) ═══ */}
      {totalAtestados > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.21 }} className="mt-8 glass-card bg-primary/5 p-6 border-primary/20">
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
            <div>
              <h2 className="text-3xl font-black text-primary tracking-tighter uppercase leading-none">Dashboard</h2>
              <h3 className="text-2xl font-bold text-primary/80 tracking-tight uppercase">Atestado Médico</h3>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2 text-primary font-bold text-xs cursor-pointer hover:bg-primary/10 transition-colors">
              <Clock className="w-4 h-4" /> Atualizar Dados
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
            
            {/* Esquerda: KPIs e Top 10 Funcionários */}
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-5 border-t-4 border-t-destructive flex flex-col items-center justify-center">
                   <p className="text-xs text-muted-foreground font-bold mb-3 uppercase tracking-wider text-center">Qtd. de Atestados</p>
                   <div className="flex items-center justify-center gap-4">
                     <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive"><User className="w-6 h-6" /></div>
                     <span className="text-4xl font-light text-foreground">{totalAtestados}</span>
                   </div>
                </div>
                <div className="glass-card p-5 border-t-4 border-t-primary flex flex-col items-center justify-center">
                   <p className="text-xs text-muted-foreground font-bold mb-3 uppercase tracking-wider text-center">Dias Perdidos</p>
                   <div className="flex items-center justify-center gap-4">
                     <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary"><Calendar className="w-6 h-6" /></div>
                     <span className="text-4xl font-light text-foreground">{atestadosAnalytics.diasPerdidos}</span>
                   </div>
                </div>
              </div>

              <div className="glass-card p-5 flex-1">
                <p className="text-sm text-primary font-bold text-center mb-6">Os 10 Funcionários que mais apresentaram atestado</p>
                <div className="space-y-4">
                  {atestadosAnalytics.topEmpAtestados.slice(0, 10).map((emp) => {
                    const maxAtestados = Math.max(...atestadosAnalytics.topEmpAtestados.map(e => e.count), 1);
                    const pct = (emp.count / maxAtestados) * 100;
                    return (
                      <div key={emp.name} className="flex items-center gap-4">
                        <span className="w-[130px] text-right truncate text-xs text-foreground font-medium" title={emp.name}>{emp.name}</span>
                        <div className="flex-1 h-6 bg-muted/30 rounded-full relative flex items-center overflow-visible">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} 
                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full shadow-sm"></motion.div>
                          <span className="absolute right-[-28px] font-bold text-xs text-foreground bg-background px-1.5 py-0.5 rounded shadow-sm border border-border">{emp.count}</span>
                        </div>
                        <div className="w-8"></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Direita: Gráficos */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="glass-card p-5 h-[240px] flex flex-col">
                 <p className="text-sm text-primary font-bold text-center mb-4">Os 7 CIDs mais predominantes</p>
                 <div className="flex-1 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={atestadosAnalytics.topCids.slice(0, 7)} margin={{ top: 20, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                       <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                       <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40}>
                         <LabelList dataKey="value" position="top" style={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 'bold' }} />
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6 h-[240px]">
                <div className="glass-card p-5 flex flex-col">
                   <p className="text-sm text-primary font-bold text-center mb-4">5 CRMs mais predominantes</p>
                   <div className="flex-1 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={atestadosAnalytics.topCrms.slice(0, 5)} margin={{ top: 20, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                         <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                         <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30}>
                           <LabelList dataKey="value" position="top" style={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 'bold' }} />
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>
                <div className="glass-card p-5 flex flex-col">
                   <p className="text-sm text-primary font-bold text-center mb-4">5 Funções com mais atestados</p>
                   <div className="flex-1 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={atestadosAnalytics.topCargos.slice(0, 5)} margin={{ top: 20, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                         <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                         <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30}>
                           <LabelList dataKey="value" position="top" style={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 'bold' }} />
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* ═══ HORAS NEGATIVAS POR COLABORADOR ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
        className="corporate-section">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          <MinusCircle className="w-3.5 h-3.5 inline mr-1.5" />
          Horas Negativas por Colaborador — {period.label}
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
            <p className="text-sm">Nenhuma hora negativa registrada no período</p>
          </div>
        )}
      </motion.div>

      {/* ═══ EXTRAS CONTROL ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="corporate-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Controle de Horas Extras — Limite: 3 por Período
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
                      {isBlocked && ' ⛔'}
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
            <p className="text-sm">Nenhuma extra registrada no período atual</p>
          </div>
        )}
      </motion.div>
      </TabsContent>

      <TabsContent value="eventos" className="space-y-6 outline-none">
      {/* ═══ ADVERTÊNCIAS ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.27 }}
        className="corporate-section">
        <button onClick={() => setShowWarningsTable(!showWarningsTable)}
          className="w-full flex items-center justify-between text-left">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Advertências Registradas ({warnings.length})
          </h3>
          {showWarningsTable ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showWarningsTable && (
          <div className="mt-4 overflow-x-auto">
            {warnings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma advertência registrada</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Colaborador</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Data</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Motivo</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Aplicada</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Observação</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Ação</th>
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
                      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate">{w.observation || '—'}</td>
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

      {/* ═══ VACATION OVERVIEW ═══ */}
      {vacations.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="corporate-section">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Programação de Férias — {vacations.length} colaboradores
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
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-teal-500/10 text-teal-600 whitespace-nowrap">EM FÉRIAS</span>
                      ) : isPending ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-warning/10 text-warning whitespace-nowrap">PROGRAMADA</span>
                      ) : null}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditVacation(v)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{v.cargo} · {v.letra}-{v.turno}</p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>Início: {formatDate(v.start_date)}</span>
                    <span>Fim: {formatDate(v.end_date)}</span>
                  </div>
                  {v.scheduled_month && <p className="text-xs text-muted-foreground mt-1">Mês prog.: {v.scheduled_month}</p>}
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
      </TabsContent>

      <TabsContent value="registros" className="space-y-6 outline-none">
      {/* ═══ EMPLOYEE ROSTER ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
        className="corporate-section">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Quadro de Colaboradores — {funcionarios.length} cadastrados
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Colaborador</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Função</th>
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
                        {extras}/3 {isBlocked ? '⛔' : ''}
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
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-teal-500/10 text-teal-600">EM FÉRIAS</span>
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

      {/* ═══ COLLAPSIBLE TABLES ═══ */}
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
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum registro de ponto no período</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Colaborador</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Turno</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Função</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Data</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
<th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Detalhe Médico</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Obs.</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Ação</th>
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
                      <td className="px-4 py-2.5 text-center">
    {a.status === 'atestado' ? (
      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
        CID: {a.cid || '—'} | {a.dias_afastamento || 0}d
      </span>
    ) : <span className="text-muted-foreground">—</span>}
  </td>
  <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate">{a.observation || '—'}</td>
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

      {/* Férias Table */}
      <div className="corporate-section">
        <button onClick={() => setShowFeriasTable(!showFeriasTable)}
          className="w-full flex items-center justify-between text-left">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Registros de Férias Detalhados ({vacations.length})
          </h3>
          {showFeriasTable ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showFeriasTable && (
          <div className="mt-4 overflow-x-auto">
            {vacations.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum registro de férias</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Colaborador</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Função</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Turno</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Dias</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Início</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Fim</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Ações</th>
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
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-teal-500/10 text-teal-600">Em Férias</span>
                          ) : isPending ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-warning/10 text-warning">Programada</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">—</span>
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
      </TabsContent>
      </Tabs>

      {/* ═══ EDIT VACATION DIALOG ═══ */}
      <Dialog open={editVacDialogOpen} onOpenChange={setEditVacDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Férias</DialogTitle>
            <DialogDescription>Altere as datas ou informações das férias do colaborador.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Qtd. Dias</Label><Input type="number" value={editVacForm.days_count} onChange={e => setEditVacForm({ ...editVacForm, days_count: e.target.value })} /></div>
              <div className="space-y-2"><Label>Mês Programado</Label><Input value={editVacForm.scheduled_month} onChange={e => setEditVacForm({ ...editVacForm, scheduled_month: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Início</Label><Input type="date" value={editVacForm.start_date} onChange={e => setEditVacForm({ ...editVacForm, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Fim</Label><Input type="date" value={editVacForm.end_date} onChange={e => setEditVacForm({ ...editVacForm, end_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Observação</Label><FastTextarea value={editVacForm.observation} onValueChange={v => setEditVacForm(f => ({ ...f, observation: v }))} rows={2} /></div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleEditVacation}>Salvar Alterações</Button>
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
