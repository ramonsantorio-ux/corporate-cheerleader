import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Target, TrendingUp, AlertTriangle, Calendar, Users, Star, Pencil, Trash2, Plus, GraduationCap, FileText, Briefcase, ExternalLink, Camera, Loader2, Clock, Sun, Shield, CalendarDays, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { statusLabels, statusColors, priorityLabels, priorityColors, FeedbackStatus, FeedbackPriority } from '@/lib/feedbackData';
import FitCulturalSection from '@/components/fit-cultural/FitCulturalSection';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Funcionario {
  id: string; nome: string; cargo: string; departamento: string; foto_url: string;
  feedbacks_recebidos: number; feedbacks_resolvidos: number; email: string; data_admissao: string;
  escolaridade: string; graduacao: string; pos_graduacao: boolean; pos_graduacao_tipo: string;
  turno: string; letra: string; encarregado_id: string | null;
}

interface FeedbackItem { id: string; titulo: string; status: string; prioridade: string; criado_em: string; gestor: string; autor: string; }
interface MeetingItem { id: string; meeting_date: string; manager_name: string; notes: string; status: string; }
interface Goal { id: string; cargo: string; descricao: string; peso: number; resultado: number | null; muito_abaixo: string; abaixo: string; dentro: string; acima: string; muito_acima: string; }
interface EmployeeDocument { id: string; file_url: string; file_name: string; document_type: string; created_at: string; }
interface AttendanceRecord { id: string; date: string; status: string; observation: string; }
interface VacationInfo { id: string; start_date: string | null; end_date: string | null; days_count: number; scheduled_month: string; remaining_days: number | null; observation: string; }
interface WarningRecord { id: string; date: string; reason: string; applied: boolean; observation: string; created_at: string; }
interface EventRecord { id: string; event_date: string; event_time: string; day_of_week: string; description: string; location: string; equipment: string; plate_tag: string; shift: string; supervisor: string; }

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--accent))'];
const emptyGoalForm = { descricao: '', peso: 0, resultado: '' as string, muito_abaixo: '', abaixo: '', dentro: '', acima: '', muito_acima: '' };
const turnoLabels: Record<string, string> = { dia_a: 'Dia A', dia_b: 'Dia B', noite_a: 'Noite A', noite_b: 'Noite B', adm: 'ADM' };
const attendanceStatusLabels: Record<string, string> = {
  presente: 'Presente', falta: 'Falta Injustificada', falta_injustificada: 'Falta Injustificada',
  falta_justificada: 'Falta Justificada',
  atestado: 'Atestado', extra: 'Extra', ferias: 'Férias', afastamento: 'Afastamento',
  abono: 'Abono', banco_horas: 'Banco de Horas',
};
const attendanceStatusColors: Record<string, string> = {
  presente: 'bg-success/10 text-success', falta: 'bg-destructive/10 text-destructive',
  falta_injustificada: 'bg-destructive/10 text-destructive',
  falta_justificada: 'bg-warning/10 text-warning', atestado: 'bg-blue-500/10 text-blue-600',
  extra: 'bg-purple-500/10 text-purple-600', ferias: 'bg-teal-500/10 text-teal-600',
  afastamento: 'bg-red-500/10 text-red-600', abono: 'bg-yellow-500/10 text-yellow-700',
  banco_horas: 'bg-indigo-500/10 text-indigo-600',
};

export default function FuncionarioProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [func, setFunc] = useState<Funcionario | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [allFuncionarios, setAllFuncionarios] = useState<Funcionario[]>([]);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [vacationInfo, setVacationInfo] = useState<VacationInfo | null>(null);
  const [employeeWarnings, setEmployeeWarnings] = useState<WarningRecord[]>([]);
  const [employeeEvents, setEmployeeEvents] = useState<EventRecord[]>([]);
  const [extrasCount, setExtrasCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [encarregadoNome, setEncarregadoNome] = useState('');
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState(emptyGoalForm);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('funcionarios').select('*').eq('id', id).single(),
      supabase.from('feedbacks').select('id, titulo, status, prioridade, criado_em, gestor, autor').order('criado_em', { ascending: false }),
      supabase.from('funcionarios').select('id, nome, cargo, departamento, foto_url, feedbacks_recebidos, feedbacks_resolvidos, email, data_admissao'),
      supabase.from('meetings').select('*').eq('employee_id', id).order('meeting_date', { ascending: false }),
      supabase.from('employee_documents').select('*').eq('employee_id', id).order('created_at', { ascending: false }),
    ]).then(([funcRes, fbRes, allRes, meetRes, docRes]) => {
      if (funcRes.data) {
        const f = funcRes.data as unknown as Funcionario;
        setFunc(f);
        if (f.encarregado_id) {
          supabase.from('funcionarios').select('nome').eq('id', f.encarregado_id).single().then(({ data }) => {
            if (data) setEncarregadoNome((data as any).nome);
          });
        }
      }
      if (fbRes.data) setFeedbacks(fbRes.data as FeedbackItem[]);
      if (allRes.data) setAllFuncionarios(allRes.data as Funcionario[]);
      if (meetRes.data) setMeetings(meetRes.data as MeetingItem[]);
      if (docRes.data) setDocuments(docRes.data as unknown as EmployeeDocument[]);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => { if (func) fetchGoals(); }, [func]);

  // Fetch attendance + vacation + warnings data for this employee
  useEffect(() => {
    if (!id || !func) return;
    Promise.all([
      supabase.from('daily_attendance').select('id, date, status, observation').eq('employee_id', id).order('date', { ascending: false }).limit(100),
      supabase.from('vacation_control').select('*').eq('employee_id', id).maybeSingle(),
      supabase.from('daily_attendance').select('*', { count: 'exact', head: true }).eq('employee_id', id).eq('status', 'extra'),
      supabase.from('employee_warnings').select('*').eq('employee_id', id).order('date', { ascending: false }),
      supabase.from('events').select('*').ilike('involved_name', func.nome).order('event_date', { ascending: false }),
    ]).then(([attRes, vacRes, extrasRes, warnRes, eventsRes]) => {
      if (attRes.data) setAttendanceRecords(attRes.data as AttendanceRecord[]);
      if (vacRes.data) setVacationInfo(vacRes.data as unknown as VacationInfo);
      setExtrasCount(extrasRes.count || 0);
      if (warnRes.data) setEmployeeWarnings(warnRes.data as unknown as WarningRecord[]);
      if (eventsRes.data) setEmployeeEvents(eventsRes.data as unknown as EventRecord[]);
    });
  }, [id, func]);

  async function fetchGoals() {
    if (!func) return;
    const { data } = await supabase.from('goals').select('*').eq('cargo', func.cargo).order('peso', { ascending: false });
    if (data) setGoals(data as Goal[]);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !func) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadErr) throw uploadErr;
      const newUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
      const { error: updateErr } = await supabase.from('funcionarios').update({ foto_url: newUrl }).eq('id', func.id);
      if (updateErr) throw updateErr;
      setFunc({ ...func, foto_url: newUrl });
      toast({ title: 'Foto atualizada!' });
    } catch { toast({ title: 'Erro ao atualizar foto', variant: 'destructive' }); }
    setUploadingPhoto(false);
  }

  function openNewGoal() { setEditGoal(null); setGoalForm(emptyGoalForm); setGoalDialogOpen(true); }
  function openEditGoal(goal: Goal) {
    setEditGoal(goal);
    setGoalForm({ descricao: goal.descricao, peso: goal.peso, resultado: goal.resultado != null ? String(goal.resultado) : '', muito_abaixo: goal.muito_abaixo, abaixo: goal.abaixo, dentro: goal.dentro, acima: goal.acima, muito_acima: goal.muito_acima });
    setGoalDialogOpen(true);
  }

  async function saveGoal() {
    if (!goalForm.descricao || !goalForm.peso) { toast({ title: 'Preencha descrição e peso', variant: 'destructive' }); return; }
    if (editGoal) {
      const { error } = await supabase.from('goals').update({ descricao: goalForm.descricao, peso: goalForm.peso, resultado: goalForm.resultado !== '' ? Number(goalForm.resultado) : null, muito_abaixo: goalForm.muito_abaixo, abaixo: goalForm.abaixo, dentro: goalForm.dentro, acima: goalForm.acima, muito_acima: goalForm.muito_acima }).eq('id', editGoal.id);
      if (error) { toast({ title: 'Erro ao salvar', variant: 'destructive' }); return; }
      toast({ title: 'Meta atualizada!' });
    } else {
      const { error } = await supabase.from('goals').insert([{ cargo: func!.cargo, descricao: goalForm.descricao, peso: goalForm.peso, muito_abaixo: goalForm.muito_abaixo, abaixo: goalForm.abaixo, dentro: goalForm.dentro, acima: goalForm.acima, muito_acima: goalForm.muito_acima }]);
      if (error) { toast({ title: 'Erro ao criar', variant: 'destructive' }); return; }
      toast({ title: 'Meta criada!' });
    }
    setGoalDialogOpen(false); fetchGoals();
  }

  async function confirmDeleteGoal() {
    if (!deleteGoalId) return;
    await supabase.from('goals').delete().eq('id', deleteGoalId);
    setDeleteGoalId(null); toast({ title: 'Meta excluída' }); fetchGoals();
  }

  const employeeFeedbacks = useMemo(() => {
    if (!func) return [];
    return feedbacks.filter(f => f.autor?.toLowerCase() === func.nome.toLowerCase() || f.titulo?.toLowerCase().includes(func.nome.toLowerCase()));
  }, [feedbacks, func]);

  const [fitScores, setFitScores] = useState<{ criteria: string; stage: string; score: number | null }[]>([]);
  useEffect(() => {
    if (!id) return;
    supabase.from('fit_cultural').select('criteria, stage, score').eq('employee_id', id).then(({ data }) => { if (data) setFitScores(data as any); });
  }, [id]);

  const scoreFit = useMemo(() => {
    const scored = fitScores.filter(s => s.score != null);
    if (scored.length === 0) return 0;
    return Math.round((scored.reduce((sum, s) => sum + (s.score || 0), 0) / scored.length / 5) * 100);
  }, [fitScores]);

  const scoreMeta = useMemo(() => {
    if (goals.length === 0) return 0;
    const withResult = goals.filter(g => g.resultado != null);
    if (withResult.length === 0) return 0;
    const totalPeso = withResult.reduce((s, g) => s + g.peso, 0);
    const weighted = withResult.reduce((s, g) => s + (g.resultado! * g.peso / 100), 0);
    return Math.min(Math.round((weighted / totalPeso) * 100), 100);
  }, [goals]);

  const score = useMemo(() => {
    if (scoreFit === 0 && scoreMeta === 0) return 0;
    if (scoreFit === 0) return scoreMeta;
    if (scoreMeta === 0) return scoreFit;
    return Math.round((scoreFit + scoreMeta) / 2);
  }, [scoreFit, scoreMeta]);

  const deptAvg = useMemo(() => {
    if (!func) return 0;
    const deptPeople = allFuncionarios.filter(f => f.departamento === func.departamento);
    if (deptPeople.length === 0) return 0;
    return Math.round(deptPeople.reduce((acc, f) => acc + (f.feedbacks_recebidos > 0 ? (f.feedbacks_resolvidos / f.feedbacks_recebidos) * 100 : 0), 0) / deptPeople.length);
  }, [func, allFuncionarios]);

  const pctResolvido = func && func.feedbacks_recebidos > 0 ? Math.round((func.feedbacks_resolvidos / func.feedbacks_recebidos) * 100) : 0;

  const pendencias = useMemo(() => {
    const items: string[] = [];
    if (func && func.feedbacks_recebidos > func.feedbacks_resolvidos) items.push(`${func.feedbacks_recebidos - func.feedbacks_resolvidos} feedback(s) pendente(s)`);
    if (meetings.length === 0) items.push('Nenhuma reunião 1:1 registrada');
    const faltasInj = attendanceRecords.filter(a => a.status === 'falta' || a.status === 'falta_injustificada').length;
    if (faltasInj > 0) items.push(`${faltasInj} falta(s) injustificada(s)`);
    if (employeeWarnings.length > 0) items.push(`${employeeWarnings.length} advertência(s) registrada(s)`);
    if (employeeEvents.length > 0) items.push(`${employeeEvents.length} evento(s) registrado(s)`);
    return items;
  }, [func, meetings, attendanceRecords, employeeWarnings, employeeEvents]);

  const pieData = goals.map(g => ({ name: g.descricao, value: g.peso }));
  const barData = goals.map(g => ({ name: g.descricao.length > 20 ? g.descricao.slice(0, 18) + '…' : g.descricao, Peso: g.peso }));

  const attendanceStats = useMemo(() => {
    const counts: Record<string, number> = {};
    attendanceRecords.forEach(a => {
      const key = a.status === 'falta' ? 'falta_injustificada' : a.status;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [attendanceRecords]);

  const isOnVacation = useMemo(() => {
    if (!vacationInfo?.start_date || !vacationInfo?.end_date) return false;
    const today = new Date();
    return today >= new Date(vacationInfo.start_date) && today <= new Date(vacationInfo.end_date);
  }, [vacationInfo]);

  const vacationSoon = useMemo(() => {
    if (!vacationInfo?.start_date) return false;
    const today = new Date();
    const start = new Date(vacationInfo.start_date);
    return start > today && (start.getTime() - today.getTime()) <= 7 * 86400000;
  }, [vacationInfo]);

  // ─── Deviations Report PDF for this employee ────────────────────────
  function exportEmployeeDeviationsReport() {
    if (!func) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE DESVIOS — FICHA DO COLABORADOR', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Emitido: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 20);
    doc.text('CONFIDENCIAL — PARA USO EXCLUSIVO DO RH', pageWidth - 14, 20, { align: 'right' });

    doc.setTextColor(0, 0, 0);

    // Employee info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO COLABORADOR', 14, 36);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const info = [
      ['Nome', func.nome],
      ['Cargo', func.cargo],
      ['Departamento', func.departamento],
      ['Turno / Letra', `${func.turno} / ${func.letra}`],
      ['Admissão', new Date(func.data_admissao).toLocaleDateString('pt-BR')],
      ['E-mail', func.email || '—'],
    ];

    autoTable(doc, {
      startY: 40,
      body: info,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    });

    // Deviations summary
    const faltasInj = attendanceRecords.filter(a => a.status === 'falta' || a.status === 'falta_injustificada').length;
    const faltasJust = attendanceRecords.filter(a => a.status === 'falta_justificada').length;
    const atestados = attendanceRecords.filter(a => a.status === 'atestado').length;
    const hrsNeg = faltasInj + faltasJust + atestados;
    const advApplied = employeeWarnings.filter(w => w.applied).length;
    const advPending = employeeWarnings.filter(w => !w.applied).length;

    let y = (doc as any).lastAutoTable?.finalY || 70;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO DE DESVIOS', 14, y + 10);

    autoTable(doc, {
      startY: y + 14,
      head: [['Indicador', 'Quantidade']],
      body: [
        ['Horas Negativas (Total)', String(hrsNeg)],
        ['Faltas Injustificadas', String(faltasInj)],
        ['Faltas Justificadas', String(faltasJust)],
        ['Atestados Médicos', String(atestados)],
        ['Horas Extras', String(extrasCount)],
        ['Advertências Aplicadas', String(advApplied)],
        ['Advertências Pendentes', String(advPending)],
        ['Eventos Registrados', String(employeeEvents.length)],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
    });

    // Warning details
    if (employeeWarnings.length > 0) {
      y = (doc as any).lastAutoTable?.finalY || 140;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('HISTÓRICO DE ADVERTÊNCIAS', 14, y + 10);

      autoTable(doc, {
        startY: y + 14,
        head: [['Data', 'Motivo', 'Aplicada', 'Observação']],
        body: employeeWarnings.map(w => [
          new Date(w.date + 'T00:00:00').toLocaleDateString('pt-BR'),
          w.reason,
          w.applied ? 'SIM' : 'NÃO',
          w.observation || '—',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [180, 40, 40], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 248, 248] },
      });
    }

    // Events history
    if (employeeEvents.length > 0) {
      y = (doc as any).lastAutoTable?.finalY || 180;
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`HISTÓRICO DE EVENTOS (${employeeEvents.length})`, 14, y + 10);

      autoTable(doc, {
        startY: y + 14,
        head: [['Data', 'Descrição', 'Local', 'Equipamento']],
        body: employeeEvents.map(ev => [
          new Date(ev.event_date + 'T00:00:00').toLocaleDateString('pt-BR'),
          ev.description.length > 60 ? ev.description.slice(0, 57) + '...' : ev.description,
          ev.location || '—',
          ev.equipment || '—',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [200, 130, 0], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 250, 240] },
      });
    }

    // Attendance history
    if (attendanceRecords.length > 0) {
      y = (doc as any).lastAutoTable?.finalY || 180;
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('HISTÓRICO DE REGISTROS', 14, y + 10);

      const deviationRecords = attendanceRecords.filter(a =>
        ['falta', 'falta_injustificada', 'falta_justificada', 'atestado'].includes(a.status)
      );

      if (deviationRecords.length > 0) {
        autoTable(doc, {
          startY: y + 14,
          head: [['Data', 'Status', 'Observação']],
          body: deviationRecords.map(a => [
            new Date(a.date + 'T00:00:00').toLocaleDateString('pt-BR'),
            attendanceStatusLabels[a.status] || a.status,
            a.observation || '—',
          ]),
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });
      }
    }

    // Signature area
    const lastY = (doc as any).lastAutoTable?.finalY || 200;
    const sigY = Math.max(lastY + 30, 240);
    if (sigY > 270) { doc.addPage(); }
    const finalSigY = sigY > 270 ? 40 : sigY;

    doc.setDrawColor(0);
    doc.line(14, finalSigY, 90, finalSigY);
    doc.line(120, finalSigY, 196, finalSigY);
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text('Assinatura do Colaborador', 14, finalSigY + 5);
    doc.text('Assinatura do Gestor / RH', 120, finalSigY + 5);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(`GESTÃO PORTO — Ficha de Desvios: ${func.nome} — Pág. ${i}/${pageCount}`, 14, doc.internal.pageSize.getHeight() - 8);
      doc.text('Documento confidencial de uso exclusivo do RH — Desligamento', pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    }

    doc.save(`Desvios_${func.nome.replace(/\s+/g, '_')}.pdf`);
    toast({ title: 'Relatório de desvios exportado!' });
  }

  if (loading) return <div className="flex justify-center py-12 text-muted-foreground">Carregando...</div>;
  if (!func) return <div className="text-center py-12 text-muted-foreground">Funcionário não encontrado</div>;

  const turnoDisplay = func.turno ? (turnoLabels[func.turno] || func.turno) : null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1"><h1 className="text-2xl font-bold">Perfil do Funcionário</h1><p className="text-muted-foreground text-sm">Visão consolidada de desempenho</p></div>
        <Button variant="outline" size="sm" className="border-orange-500/30 text-orange-600 hover:bg-orange-500/5" onClick={exportEmployeeDeviationsReport}>
          <FileText className="w-4 h-4 mr-2" />Relatório de Desvios (RH)
        </Button>
      </motion.div>

      {/* Header Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <div className="relative group">
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            {func.foto_url ? (
              <img src={func.foto_url} alt={func.nome} className="w-24 h-24 rounded-full object-cover border-4 border-primary/20" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">{func.nome.charAt(0)}</div>
            )}
            <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto} className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingPhoto ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
            </button>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold">{func.nome}</h2>
            <p className="text-muted-foreground">{func.cargo} · {func.departamento}</p>
            <p className="text-sm text-muted-foreground mt-1">{func.email || 'Sem e-mail'} · Admissão: {new Date(func.data_admissao).toLocaleDateString('pt-BR')}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {func.escolaridade && <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"><GraduationCap className="w-3 h-3" />{func.escolaridade}</span>}
              {func.graduacao && <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-accent/50 text-accent-foreground">{func.graduacao}</span>}
              {func.pos_graduacao && func.pos_graduacao_tipo && <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-chart-2/20 text-foreground">Pós: {func.pos_graduacao_tipo}</span>}
              {turnoDisplay && <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-chart-3/20 text-foreground"><Briefcase className="w-3 h-3" />Turno: {turnoDisplay}</span>}
              {func.letra && <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-chart-4/20 text-foreground font-semibold">Letra: {func.letra}</span>}
              {encarregadoNome && <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-chart-4/20 text-foreground"><Users className="w-3 h-3" />Enc.: {encarregadoNome}</span>}
              {employeeEvents.length > 0 && <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-warning/15 text-warning font-semibold"><AlertTriangle className="w-3 h-3" />{employeeEvents.length} evento(s)</span>}
            </div>
          </div>
          <div className="flex gap-4">
            {[
              { label: 'Score Geral', value: score, color: 'hsl(var(--primary))' },
              { label: 'FIT Cultural', value: scoreFit, color: 'hsl(var(--chart-2))' },
              { label: 'Meta', value: scoreMeta, color: 'hsl(var(--chart-3))' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="35" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                    <circle cx="40" cy="40" r="35" fill="none" stroke={s.color} strokeWidth="6" strokeDasharray={`${(s.value / 100) * 220} 220`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-bold">{s.value}</span></div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: MessageSquare, label: 'Feedbacks Recebidos', value: func.feedbacks_recebidos, color: 'text-primary' },
          { icon: Target, label: 'Feedbacks Resolvidos', value: `${pctResolvido}%`, color: pctResolvido >= 70 ? 'text-success' : 'text-warning' },
          { icon: Calendar, label: 'Reuniões 1:1', value: meetings.length, color: 'text-primary' },
          { icon: AlertTriangle, label: 'Eventos', value: employeeEvents.length, color: employeeEvents.length > 0 ? 'text-warning' : 'text-muted-foreground' },
          { icon: Users, label: 'Média Equipe', value: `${deptAvg}%`, color: 'text-muted-foreground' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4 text-center">
            <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {pendencias.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5 border-l-4 border-warning">
          <h3 className="font-semibold flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5 text-warning" />Alertas e Pendências</h3>
          <ul className="space-y-1">{pendencias.map((p, i) => <li key={i} className="text-sm text-muted-foreground flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />{p}</li>)}</ul>
        </motion.div>
      )}

      <Tabs defaultValue="desempenho" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
          <TabsTrigger value="ponto-ferias">Ponto / Férias</TabsTrigger>
          <TabsTrigger value="eventos">Eventos ({employeeEvents.length})</TabsTrigger>
          <TabsTrigger value="desvios">Desvios</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
          <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
          <TabsTrigger value="fit-cultural">Fit Cultural</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="desempenho" className="space-y-6 mt-4">
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Comparativo com Equipe ({func.departamento})</h3>
            <div className="space-y-3">
              <div><div className="flex justify-between text-sm mb-1"><span>{func.nome}</span><span className="font-bold">{pctResolvido}%</span></div><Progress value={pctResolvido} className="h-3" /></div>
              <div><div className="flex justify-between text-sm mb-1"><span>Média da equipe</span><span className="font-bold">{deptAvg}%</span></div><Progress value={deptAvg} className="h-3" /></div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />Últimas Reuniões 1:1</h3>
            {meetings.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma reunião registrada.</p> : (
              <div className="space-y-3">{meetings.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium">{new Date(m.meeting_date).toLocaleDateString('pt-BR')} — {m.manager_name}</p><p className="text-xs text-muted-foreground truncate">{m.notes || 'Sem anotações'}</p></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'completed' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>{m.status === 'completed' ? 'Concluída' : 'Agendada'}</span>
                </div>
              ))}</div>
            )}
          </div>
        </TabsContent>

        {/* ════ PONTO / FÉRIAS TAB ════ */}
        <TabsContent value="ponto-ferias" className="space-y-6 mt-4">
          {isOnVacation && vacationInfo && (
            <div className="flex items-center gap-3 rounded-lg p-4 border bg-teal-500/5 border-teal-500/20">
              <Sun className="w-5 h-5 text-teal-500" />
              <div>
                <p className="font-semibold text-sm">Colaborador em Férias</p>
                <p className="text-xs text-muted-foreground">Período: {new Date(vacationInfo.start_date! + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(vacationInfo.end_date! + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          )}
          {vacationSoon && vacationInfo && (
            <div className="flex items-center gap-3 rounded-lg p-4 border bg-warning/5 border-warning/20">
              <CalendarDays className="w-5 h-5 text-warning" />
              <div>
                <p className="font-semibold text-sm">Férias Programadas</p>
                <p className="text-xs text-muted-foreground">Início em {new Date(vacationInfo.start_date! + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total Registros', value: attendanceRecords.length, icon: CalendarDays, color: 'text-primary' },
              { label: 'Presenças', value: attendanceStats.presente || 0, icon: Users, color: 'text-success' },
              { label: 'Faltas Injust.', value: (attendanceStats.falta_injustificada || 0), icon: AlertTriangle, color: 'text-destructive' },
              { label: 'Atestados', value: attendanceStats.atestado || 0, icon: Clock, color: 'text-blue-600' },
              { label: 'Extras', value: extrasCount, icon: TrendingUp, color: extrasCount >= 3 ? 'text-destructive' : 'text-primary' },
            ].map(k => (
              <div key={k.label} className="glass-card rounded-xl p-4 text-center">
                <k.icon className={`w-5 h-5 mx-auto mb-2 ${k.color}`} />
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-primary" />Controle de Horas Extras</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Extras no período atual</span>
                  <span className={`font-bold ${extrasCount >= 3 ? 'text-destructive' : ''}`}>{extrasCount}/3 {extrasCount >= 3 ? '⛔ BLOQUEADO' : ''}</span>
                </div>
                <Progress value={Math.min((extrasCount / 3) * 100, 100)} className={`h-3 ${extrasCount >= 3 ? '[&>div]:bg-destructive' : extrasCount >= 2 ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`} />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-primary" />Resumo de Ocorrências</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(attendanceStatusLabels).filter(([key]) => (attendanceStats[key] || 0) > 0).map(([key, label]) => (
                <div key={key} className={`rounded-lg p-3 text-center ${attendanceStatusColors[key] || 'bg-muted text-muted-foreground'}`}>
                  <p className="text-xl font-bold">{attendanceStats[key]}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider">{label}</p>
                </div>
              ))}
              {Object.keys(attendanceStats).length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground text-center py-4">Nenhuma ocorrência registrada</p>
              )}
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4"><Sun className="w-5 h-5 text-primary" />Informações de Férias</h3>
            {vacationInfo ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs">Dias Programados</p><p className="font-semibold">{vacationInfo.days_count} dias</p></div>
                <div><p className="text-muted-foreground text-xs">Mês Programado</p><p className="font-semibold">{vacationInfo.scheduled_month || '—'}</p></div>
                <div><p className="text-muted-foreground text-xs">Início</p><p className="font-semibold">{vacationInfo.start_date ? new Date(vacationInfo.start_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</p></div>
                <div><p className="text-muted-foreground text-xs">Fim</p><p className="font-semibold">{vacationInfo.end_date ? new Date(vacationInfo.end_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</p></div>
                {vacationInfo.remaining_days != null && (
                  <div><p className="text-muted-foreground text-xs">Dias Restantes</p><p className="font-semibold">{vacationInfo.remaining_days}</p></div>
                )}
                {vacationInfo.observation && (
                  <div className="col-span-2"><p className="text-muted-foreground text-xs">Observação</p><p className="font-semibold">{vacationInfo.observation}</p></div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum registro de férias cadastrado.</p>
            )}
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-primary/5">
              <h4 className="text-sm font-bold flex items-center gap-2"><Calendar className="w-4 h-4" />Histórico de Registros (últimos 100)</h4>
            </div>
            {attendanceRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro de ponto encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/30 border-b border-border">
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Data</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Observação</th>
                  </tr></thead>
                  <tbody>
                    {attendanceRecords.slice(0, 30).map((a, i) => (
                      <tr key={a.id} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}>
                        <td className="px-4 py-2 text-xs">{new Date(a.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${attendanceStatusColors[a.status] || attendanceStatusColors[a.status === 'falta' ? 'falta_injustificada' : a.status] || 'bg-muted text-muted-foreground'}`}>
                            {attendanceStatusLabels[a.status] || a.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{a.observation || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ════ EVENTOS TAB ════ */}
        <TabsContent value="eventos" className="space-y-6 mt-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warning" />Eventos Registrados ({employeeEvents.length})</h3>
          
          {employeeEvents.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhum evento registrado para este colaborador.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(() => {
                  const medical = employeeEvents.filter(e => e.location?.toUpperCase().includes('ATENDIMENTO MÉDICO') || e.location?.toUpperCase().includes('PROBLEMA PARTICULAR')).length;
                  const operational = employeeEvents.length - medical;
                  const years = new Set(employeeEvents.map(e => e.event_date.slice(0, 4)));
                  return [
                    { label: 'Total Eventos', value: employeeEvents.length, color: 'bg-warning/10 text-warning' },
                    { label: 'Operacionais', value: operational, color: 'bg-destructive/10 text-destructive' },
                    { label: 'Médicos/Pessoais', value: medical, color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Anos c/ Registro', value: years.size, color: 'bg-primary/10 text-primary' },
                  ];
                })().map(d => (
                  <div key={d.label} className={`rounded-xl p-4 text-center ${d.color}`}>
                    <p className="text-3xl font-bold">{d.value}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider mt-1">{d.label}</p>
                  </div>
                ))}
              </div>

              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border bg-warning/5">
                  <h4 className="text-sm font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" />Histórico de Eventos</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Data</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Descrição</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Local</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Equipamento</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Turno</th>
                    </tr></thead>
                    <tbody>
                      {employeeEvents.map((ev, i) => (
                        <tr key={ev.id} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}>
                          <td className="px-4 py-2 text-xs whitespace-nowrap">{new Date(ev.event_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-2 text-xs max-w-[300px]">{ev.description}</td>
                          <td className="px-4 py-2 text-xs">{ev.location || '—'}</td>
                          <td className="px-4 py-2 text-xs">{ev.equipment || '—'}</td>
                          <td className="px-4 py-2 text-xs">{ev.shift || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ════ DESVIOS TAB ════ */}
        <TabsContent value="desvios" className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-destructive" />Desvios e Advertências</h3>
            <Button variant="outline" size="sm" className="border-orange-500/30 text-orange-600" onClick={exportEmployeeDeviationsReport}>
              <FileText className="w-4 h-4 mr-2" />Exportar PDF (RH)
            </Button>
          </div>

          {/* Deviations Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Faltas Injust.', value: attendanceRecords.filter(a => a.status === 'falta' || a.status === 'falta_injustificada').length, color: 'bg-destructive/10 text-destructive' },
              { label: 'Faltas Just.', value: attendanceRecords.filter(a => a.status === 'falta_justificada').length, color: 'bg-warning/10 text-warning' },
              { label: 'Atestados', value: attendanceRecords.filter(a => a.status === 'atestado').length, color: 'bg-blue-500/10 text-blue-600' },
              { label: 'Advertências', value: employeeWarnings.length, color: 'bg-red-600/10 text-red-600' },
            ].map(d => (
              <div key={d.label} className={`rounded-xl p-4 text-center ${d.color}`}>
                <p className="text-3xl font-bold">{d.value}</p>
                <p className="text-[10px] font-medium uppercase tracking-wider mt-1">{d.label}</p>
              </div>
            ))}
          </div>

          {/* Warnings Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-destructive/5">
              <h4 className="text-sm font-bold flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-destructive" />Histórico de Advertências ({employeeWarnings.length})</h4>
            </div>
            {employeeWarnings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma advertência registrada</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/30 border-b border-border">
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Data</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Motivo</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Aplicada</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Observação</th>
                  </tr></thead>
                  <tbody>
                    {employeeWarnings.map((w, i) => (
                      <tr key={w.id} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}>
                        <td className="px-4 py-2 text-xs">{new Date(w.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-2 text-xs">{w.reason}</td>
                        <td className="px-4 py-2 text-center">
                          {w.applied ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-destructive/10 text-destructive">APLICADA</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-warning/10 text-warning">PENDENTE</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{w.observation || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Deviations note */}
          <div className="rounded-lg p-4 border border-orange-500/20 bg-orange-500/5">
            <p className="text-xs text-orange-700 font-medium">
              ⚠️ <strong>Nota:</strong> Faltas Injustificadas NÃO contemplam banco de horas. Este relatório é anexado à ficha do colaborador para envio ao RH no momento do desligamento.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="metas" className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Metas — {func.cargo}</h3>
            <Button size="sm" onClick={openNewGoal}><Plus className="w-4 h-4 mr-1" /> Nova Meta</Button>
          </div>
          {goals.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhuma meta encontrada para o cargo "{func.cargo}".</div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card rounded-xl p-5"><h4 className="text-base font-semibold mb-4">Distribuição de Pesos</h4><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} label={({ value }) => `${value}%`}>{pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => `${v}%`} /><Legend /></PieChart></ResponsiveContainer></div>
                <div className="glass-card rounded-xl p-5"><h4 className="text-base font-semibold mb-4">Peso por Meta</h4><ResponsiveContainer width="100%" height={280}><BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" tickFormatter={v => `${v}%`} /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} /><Tooltip formatter={(v: number) => `${v}%`} /><Bar dataKey="Peso" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>
              </div>
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border bg-primary/5"><h4 className="text-base font-bold">{func.cargo}</h4></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-muted/60"><th className="text-left p-3 font-semibold">Descrição</th><th className="text-center p-3 font-semibold">Peso</th><th className="text-center p-3 font-semibold">Resultado</th><th className="text-center p-3 font-semibold whitespace-nowrap">Muito Abaixo</th><th className="text-center p-3 font-semibold whitespace-nowrap">Abaixo</th><th className="text-center p-3 font-semibold whitespace-nowrap">Dentro</th><th className="text-center p-3 font-semibold whitespace-nowrap">Acima</th><th className="text-center p-3 font-semibold whitespace-nowrap">Muito Acima</th><th className="text-center p-3 font-semibold">Ações</th></tr></thead>
                    <tbody>
                      {goals.map((goal, i) => (
                        <tr key={goal.id} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                          <td className="p-3 font-medium">{goal.descricao}</td><td className="p-3 text-center font-semibold">{goal.peso}%</td><td className="p-3 text-center text-muted-foreground">{goal.resultado != null ? goal.resultado : '—'}</td>
                          <td className="p-3 text-center text-xs text-destructive">{goal.muito_abaixo}</td><td className="p-3 text-center text-xs text-destructive/70">{goal.abaixo}</td><td className="p-3 text-center text-xs">{goal.dentro}</td><td className="p-3 text-center text-xs text-primary">{goal.acima}</td><td className="p-3 text-center text-xs text-primary font-medium">{goal.muito_acima}</td>
                          <td className="p-3 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => openEditGoal(goal)} className="p-1 text-muted-foreground hover:text-primary" title="Editar"><Pencil className="w-4 h-4" /></button><button onClick={() => setDeleteGoalId(goal.id)} className="p-1 text-muted-foreground hover:text-destructive" title="Excluir"><Trash2 className="w-4 h-4" /></button></div></td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50 font-bold"><td className="p-3">TOTAL</td><td className="p-3 text-center">{goals.reduce((s, g) => s + g.peso, 0)}%</td><td colSpan={7}></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="feedbacks" className="space-y-4 mt-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" />Feedbacks ({employeeFeedbacks.length})</h3>
          {employeeFeedbacks.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhum feedback encontrado.</div>
          ) : (
            <div className="space-y-3">{employeeFeedbacks.map(fb => {
              const status = fb.status as FeedbackStatus; const priority = fb.prioridade as FeedbackPriority;
              return (
                <div key={fb.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/feedbacks/${fb.id}`)}>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{fb.titulo}</p><p className="text-xs text-muted-foreground mt-1">{new Date(fb.criado_em).toLocaleDateString('pt-BR')} · Gestor: {fb.gestor || '—'}</p></div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-muted text-muted-foreground'}`}>{statusLabels[status] || fb.status}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[priority] || 'bg-muted text-muted-foreground'}`}>{priorityLabels[priority] || fb.prioridade}</span>
                  </div>
                </div>
              );
            })}</div>
          )}
        </TabsContent>

        <TabsContent value="fit-cultural" className="mt-4">
          <div className="glass-card rounded-xl p-6"><FitCulturalSection employeeId={func.id} employeeName={func.nome} /></div>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4 mt-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Documentos</h3>
          {documents.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhum documento anexado.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{documents.map(doc => (
              <div key={doc.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{doc.file_name}</p><p className="text-xs text-muted-foreground">{doc.document_type} · {new Date(doc.created_at).toLocaleDateString('pt-BR')}</p></div>
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-muted"><ExternalLink className="w-4 h-4 text-muted-foreground" /></a>
              </div>
            ))}</div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label>Descrição</Label><Input value={goalForm.descricao} onChange={e => setGoalForm({ ...goalForm, descricao: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Peso (%)</Label><Input type="number" value={goalForm.peso} onChange={e => setGoalForm({ ...goalForm, peso: Number(e.target.value) })} /></div><div><Label>Resultado</Label><Input type="number" value={goalForm.resultado} onChange={e => setGoalForm({ ...goalForm, resultado: e.target.value })} placeholder="Ex: 85" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Muito Abaixo</Label><Input value={goalForm.muito_abaixo} onChange={e => setGoalForm({ ...goalForm, muito_abaixo: e.target.value })} /></div><div><Label>Abaixo</Label><Input value={goalForm.abaixo} onChange={e => setGoalForm({ ...goalForm, abaixo: e.target.value })} /></div><div><Label>Dentro</Label><Input value={goalForm.dentro} onChange={e => setGoalForm({ ...goalForm, dentro: e.target.value })} /></div><div><Label>Acima</Label><Input value={goalForm.acima} onChange={e => setGoalForm({ ...goalForm, acima: e.target.value })} /></div><div className="col-span-2"><Label>Muito Acima</Label><Input value={goalForm.muito_acima} onChange={e => setGoalForm({ ...goalForm, muito_acima: e.target.value })} /></div></div>
            <Button onClick={saveGoal} className="w-full">{editGoal ? 'Salvar' : 'Criar'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteGoalId} onOpenChange={open => !open && setDeleteGoalId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir meta?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteGoal}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
