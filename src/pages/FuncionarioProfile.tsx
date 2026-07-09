import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Target, TrendingUp, AlertTriangle, Calendar, Users, Star, Pencil, Trash2, Plus, GraduationCap, FileText, Briefcase, ExternalLink, Camera, Loader2, Clock, Sun, Shield, CalendarDays, ShieldAlert, Award, Crown, ShieldCheck, Lightbulb, Wrench, Brain, Zap, BarChart2, CheckCircle2, User } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { ExpandableChart } from '@/components/ui/ExpandableChart';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FastInput } from '@/components/ui/fast-input';
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
import { getBusatoLogoBase64, drawBusatoHeader, drawBusatoFooter } from '@/lib/pdfLogo';
import { DiscReport, MbtiReport, BigFiveReport } from '@/components/ExecutiveReports';
import Organograma from './Organograma';
import NineBoxSection from '@/components/nine-box/NineBoxSection';

interface Funcionario {
  id: string; nome: string; cargo: string; departamento: string; foto_url: string;
  feedbacks_recebidos: number; feedbacks_resolvidos: number; email: string; data_admissao: string;
  escolaridade: string; graduacao: string; pos_graduacao: boolean; pos_graduacao_tipo: string;
  turno: string; letra: string; encarregado_id: string | null;
  nine_box_desempenho: string | null; nine_box_potencial: string | null; fit_cultural: number | null;
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
const CARGOS_SEM_META = ['Motorista', 'Operador de Equipamentos', 'Ajudante de Caminhão Pipa', 'Operador de Mini Carregadeira'];
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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'visao-geral';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'visao-geral');
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val }, { replace: true });
  };
  
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
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState(emptyGoalForm);
  const cargoSemMeta = func ? CARGOS_SEM_META.includes(func.cargo) : false;

  const [discResult, setDiscResult] = useState<any>(null);
  const [mbtiResult, setMbtiResult] = useState<any>(null);
  const [bigFiveResult, setBigFiveResult] = useState<any>(null);

  const refreshFunc = async () => {
    if (!id) return;
    const { data } = await supabase.from('funcionarios').select('*').eq('id', id).single();
    if (data) setFunc(data as unknown as Funcionario);
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('funcionarios').select('*').eq('id', id).single(),
      supabase.from('feedbacks').select('id, titulo, status, prioridade, criado_em, gestor, autor').order('criado_em', { ascending: false }),
      supabase.from('funcionarios').select('id, nome, cargo, departamento, foto_url, feedbacks_recebidos, feedbacks_resolvidos, email, data_admissao'),
      supabase.from('meetings').select('*').eq('employee_id', id).order('meeting_date', { ascending: false }),
      supabase.from('employee_documents').select('*').eq('employee_id', id).order('created_at', { ascending: false }),
      supabase.from('employee_assessments').select('*').eq('employee_id', id)
    ]).then(([funcRes, fbRes, allRes, meetRes, docRes, assessRes]) => {
      if (funcRes.data) {
        const f = funcRes.data as unknown as Funcionario;
        setFunc(f);
      }
      if (fbRes.data) setFeedbacks(fbRes.data as FeedbackItem[]);
      if (allRes.data) setAllFuncionarios(allRes.data as Funcionario[]);
      if (meetRes.data) setMeetings(meetRes.data as MeetingItem[]);
      if (docRes.data) setDocuments(docRes.data as unknown as EmployeeDocument[]);
      if (assessRes.data) {
        const arr = assessRes.data as any[];
        const disc = arr.find(a => a.assessment_type === 'disc');
        const mbti = arr.find(a => a.assessment_type === 'mbti');
        const bigfive = arr.find(a => a.assessment_type === 'bigfive');
        if (disc) setDiscResult(disc.result_data);
        if (mbti) setMbtiResult(mbti.result_data);
        if (bigfive) setBigFiveResult(bigfive.result_data);
      }
      setLoading(false);
    });
  }, [id]);

  const fetchGoals = useCallback(async () => {
    if (!func) return;
    const { data } = await supabase.from('goals').select('*').eq('cargo', func.cargo).order('peso', { ascending: false });
    if (data) setGoals(data as Goal[]);
  }, [func]);

  useEffect(() => {
    if (!func || cargoSemMeta) {
      setGoals([]);
      return;
    }
    fetchGoals();
  }, [func, cargoSemMeta, fetchGoals]);

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
    try {
      const { error } = await supabase.from('goals').delete().eq('id', deleteGoalId);
      if (error) throw error;
      setDeleteGoalId(null); toast({ title: 'Meta excluída' }); fetchGoals();
    } catch (err: any) {
      toast({ title: 'Erro ao excluir meta', description: err.message, variant: 'destructive' });
    }
  }

  const employeeFeedbacks = useMemo(() => {
    if (!func) return [];
    const nome = func.nome?.toLowerCase() || '';
    return feedbacks.filter(f => f.autor?.toLowerCase() === nome || f.titulo?.toLowerCase().includes(nome));
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
    if (cargoSemMeta || goals.length === 0) return 0;
    const withResult = goals.filter(g => g.resultado != null);
    if (withResult.length === 0) return 0;
    const totalPeso = withResult.reduce((s, g) => s + g.peso, 0);
    const weighted = withResult.reduce((s, g) => s + (g.resultado! * g.peso / 100), 0);
    return Math.min(Math.round((weighted / totalPeso) * 100), 100);
  }, [goals, cargoSemMeta]);

  const score = useMemo(() => {
    if (cargoSemMeta) return scoreFit;
    if (scoreFit === 0 && scoreMeta === 0) return 0;
    if (scoreFit === 0) return scoreMeta;
    if (scoreMeta === 0) return scoreFit;
    return Math.round((scoreFit + scoreMeta) / 2);
  }, [scoreFit, scoreMeta, cargoSemMeta]);

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

  const fixEncoding = (str: string) => str.replace(/Ã£/g, 'ã').replace(/Ã§/g, 'ç').replace(/Ãµ/g, 'õ').replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã­/g, 'í').replace(/Ãª/g, 'ê').replace(/Ã´/g, 'ô').replace(/Ã‡/g, 'Ç').replace(/Ãƒ/g, 'Ã').replace(/Ã‰/g, 'É').replace(/Ã“/g, 'Ó').replace(/Ãš/g, 'Ú').replace(/Ã‚/g, 'Â').replace(/ÃŠ/g, 'Ê').replace(/ Eventuãis/g, ' Eventuais').replace(/Ã /g, 'à');
  const pieData = goals.map(g => ({ name: fixEncoding(g.descricao || ''), value: g.peso }));
  const barData = goals.map(g => ({ name: fixEncoding(g.descricao || '').length > 20 ? fixEncoding(g.descricao || '').slice(0, 18) + '...' : fixEncoding(g.descricao || ''), Peso: g.peso }));

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/80 border border-border/50 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[150px]">
          {label && <p className="font-black text-sm mb-3 border-b border-border/50 pb-2">{label}</p>}
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.fill }} />
                  <span className="text-muted-foreground font-medium">{entry.name}</span>
                </div>
                <span className="font-bold text-foreground">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  async function exportFullProfileReport() {
    if (!func) return;
    toast({ title: 'Gerando PDF consolidado...', description: 'Aguarde um momento enquanto os dados são reunidos.' });
    
    const logoBase64 = await getBusatoLogoBase64();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const blue: [number, number, number] = [59, 130, 187];
    const blueLt: [number, number, number] = [232, 241, 250];
    const margin = 14;

    function drawHeader() {
      drawBusatoHeader(doc, logoBase64, { pageWidth });
      doc.setTextColor(0, 0, 0);
    }

    function drawFooter(pageNum: number, totalPages: number) {
      drawBusatoFooter(doc, pageNum, { pageWidth, pageHeight });
    }

    function drawSectionHeadingLocal(title: string, yPos: number) {
      doc.setFillColor(...blueLt);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
      doc.setFillColor(...blue);
      doc.rect(margin, yPos, 3, 8, 'F');
      doc.setTextColor(...blue);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 7, yPos + 6);
      doc.setTextColor(0, 0, 0);
      return yPos + 12;
    }

    function checkPageBreak(y: number, needed: number): number {
      if (y + needed > pageHeight - 25) {
        doc.addPage();
        drawHeader();
        return 38;
      }
      return y;
    }

    // ─── START DOC ───
    drawHeader();
    let y = 36;

    // Title
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 16, 2, 2, 'FD');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('DOSSIÊ COMPLETO DO COLABORADOR', margin + 6, y + 7);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} | Matrícula: ${func.id.slice(0, 8).toUpperCase()}`, margin + 6, y + 13);
    doc.setTextColor(0, 0, 0);

    y = y + 20;

    // ─── DADOS CADASTRAIS & PERFORMANCE ───
    y = drawSectionHeadingLocal('DADOS CADASTRAIS E PERFORMANCE', y);

    const infoBody = [
      ['Nome Completo', func.nome.toUpperCase(), 'Fit Cultural', func.fit_cultural ? `${func.fit_cultural}%` : 'Não Avaliado'],
      ['Cargo', func.cargo, 'Nine Box (Desemp.)', func.nine_box_desempenho || 'Não Avaliado'],
      ['Departamento', func.departamento, 'Nine Box (Potenc.)', func.nine_box_potencial || 'Não Avaliado'],
      ['E-mail', func.email || '—', 'Turno', func.turno],
      ['Data de Admissão', new Date(func.data_admissao).toLocaleDateString('pt-BR'), 'Escolaridade', func.escolaridade || '—'],
    ];

    autoTable(doc, {
      startY: y,
      body: infoBody,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: { top: 2, bottom: 2, left: 4, right: 4 } },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 35 }, 
        1: { cellWidth: 55 },
        2: { fontStyle: 'bold', cellWidth: 35 }, 
        3: { cellWidth: 55 }
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable?.finalY + 6 || y + 40;

    // ─── PERFIL PSICOMÉTRICO ───
    y = checkPageBreak(y, 30);
    y = drawSectionHeadingLocal('PERFIL PSICOMÉTRICO', y);

    const tests = [
      ['DISC', discResult ? `Perfil Predominante: ${discResult.profile_name || 'Concluído'}` : 'Não realizado'],
      ['MBTI', mbtiResult ? `Tipo: ${mbtiResult.mbti_type || 'Concluído'}` : 'Não realizado'],
      ['Big Five', bigFiveResult ? 'Avaliação concluída e registrada no sistema' : 'Não realizado'],
    ];

    autoTable(doc, {
      startY: y,
      body: tests,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
      margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable?.finalY + 6 || y + 20;

    // ─── RESUMO DE OCORRÊNCIAS ───
    const faltasInj = attendanceRecords.filter(a => a.status === 'falta' || a.status === 'falta_injustificada').length;
    const faltasJust = attendanceRecords.filter(a => a.status === 'falta_justificada').length;
    const atestados = attendanceRecords.filter(a => a.status === 'atestado').length;
    const hrsNeg = faltasInj + faltasJust + atestados;
    const advApplied = employeeWarnings.filter(w => w.applied).length;

    y = checkPageBreak(y, 40);
    y = drawSectionHeadingLocal('RESUMO DE OCORRÊNCIAS DISCIPLINARES', y);

    autoTable(doc, {
      startY: y,
      head: [['Indicador', 'Quantidade']],
      body: [
        ['Faltas Injustificadas', String(faltasInj)],
        ['Faltas Justificadas / Atestados', String(faltasJust + atestados)],
        ['Advertências Aplicadas', String(advApplied)],
        ['Total de Eventos Registrados', String(employeeEvents.length)],
      ],
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: blueLt },
      margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable?.finalY + 6 || y + 40;

    // ─── FEEDBACKS ───
    y = checkPageBreak(y, 40);
    y = drawSectionHeadingLocal(`FEEDBACKS (${employeeFeedbacks.length})`, y);

    if (employeeFeedbacks.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Data', 'Título', 'Gestor', 'Status']],
        body: employeeFeedbacks.slice(0, 15).map(f => [
          new Date(f.criado_em).toLocaleDateString('pt-BR'),
          f.titulo.length > 50 ? f.titulo.substring(0, 47) + '...' : f.titulo,
          f.gestor || '—',
          statusLabels[f.status as FeedbackStatus] || f.status
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: blueLt },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable?.finalY + 6 || y + 20;
    } else {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Nenhum feedback registrado.', margin, y);
      y += 8;
    }

    // ─── HISTÓRICO DE ADVERTÊNCIAS E EVENTOS ───
    y = checkPageBreak(y, 40);
    y = drawSectionHeadingLocal(`HISTÓRICO DE ADVERTÊNCIAS E DESVIOS GRAVES`, y);

    if (employeeWarnings.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Data', 'Motivo', 'Aplicada', 'Observação']],
        body: employeeWarnings.map(w => [
          new Date(w.date + 'T00:00:00').toLocaleDateString('pt-BR'),
          w.reason,
          w.applied ? 'SIM' : 'NÃO',
          w.observation || '—',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: blueLt },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable?.finalY + 6 || y + 20;
    } else {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Nenhuma advertência registrada.', margin, y);
      y += 8;
    }

    // ─── ASSINATURAS ───
    y = checkPageBreak(y, 40);
    y = y + 20;
    doc.setDrawColor(0);
    doc.line(margin + 10, y, 85, y);
    doc.line(pageWidth / 2 + 10, y, pageWidth - margin - 10, y);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura do Colaborador', margin + 25, y + 5);
    doc.text('Assinatura do Gestor/RH', pageWidth / 2 + 25, y + 5);

    // ─── FOOTER on all pages ───
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      drawFooter(i, pageCount);
      // Re-draw header on pages 2+ (page 1 already has it)
      if (i > 1) drawHeader();
    }

    doc.save(`Dossie_Completo_${func.nome.replace(/\s+/g, '_')}.pdf`);
    toast({ title: 'Dossiê completo exportado com sucesso!' });
  }

  if (loading) return <div className="flex justify-center py-12 text-muted-foreground">Carregando...</div>;
  if (!func) return <div className="text-center py-12 text-muted-foreground">Funcionário não encontrado</div>;

  const turnoDisplay = func.turno ? (turnoLabels[func.turno] || func.turno) : null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1"><h1 className="text-2xl font-bold">Perfil do Funcionário</h1><p className="text-muted-foreground text-sm">Visão consolidada de desempenho</p></div>
      </motion.div>

      {/* Header Card Moderno (Bento/Lattice style) */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 lg:p-8 border-t-4 border-t-primary shadow-sm relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center relative z-10">
          <div className="relative group shrink-0">
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            {func.foto_url ? (
              <img src={func.foto_url} alt={func.nome} className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-md" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl shadow-sm border-4 border-background">{func.nome.charAt(0)}</div>
            )}
            <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto} className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              {uploadingPhoto ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
            </button>
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">{func.nome}</h2>
              <p className="text-lg text-primary font-medium">{func.cargo} <span className="text-muted-foreground font-normal mx-2">•</span> {func.departamento}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-1">
              {func.email && <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground"><MessageSquare className="w-3.5 h-3.5" />{func.email}</span>}
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground"><Calendar className="w-3.5 h-3.5" />Admissão: {new Date(func.data_admissao).toLocaleDateString('pt-BR')}</span>
              {func.escolaridade && <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground"><GraduationCap className="w-3.5 h-3.5" />{func.escolaridade}</span>}
              {turnoDisplay && <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-chart-3/10 text-chart-3"><Briefcase className="w-3.5 h-3.5" />{turnoDisplay}</span>}
            </div>
          </div>
          
          <div className="flex flex-col gap-3 shrink-0 w-full lg:w-auto">
            <Button className="w-full justify-start shadow-sm" onClick={() => navigate('/desempenho?tab=feedbacks')}><MessageSquare className="w-4 h-4 mr-2" /> Dar Feedback</Button>
            <Button variant="outline" className="w-full justify-start border-primary/30 text-primary hover:bg-primary/10 shadow-sm" onClick={exportFullProfileReport}>
              <FileText className="w-4 h-4 mr-2" /> Exportar Dossiê Completo
            </Button>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-6 h-auto p-1.5 bg-muted/50 rounded-xl">
          <TabsTrigger value="visao-geral" className="py-2.5 rounded-lg text-sm font-medium">Visão Geral</TabsTrigger>
          <TabsTrigger value="desempenho" className="py-2.5 rounded-lg text-sm font-medium">Feedbacks</TabsTrigger>
          <TabsTrigger value="talentos" className="py-2.5 rounded-lg text-sm font-medium">Perfil Psicométrico</TabsTrigger>
          <TabsTrigger value="fit-cultural" className="py-2.5 rounded-lg text-sm font-medium">Fit Cultural</TabsTrigger>
          <TabsTrigger value="nine-box" className="py-2.5 rounded-lg text-sm font-medium">Nine Box</TabsTrigger>
          <TabsTrigger value="dossie" className="py-2.5 rounded-lg text-sm font-medium border-orange-500/30 text-orange-600 data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-600">Dossiê (RH)</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6 mt-4">
          {/* Bento Grid Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {/* Score Principal */}
            <div className="kpi-card p-6 rounded-2xl md:col-span-1 flex flex-col justify-center items-center text-center space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground w-full text-left">Score de Performance</h3>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle cx="40" cy="40" r="35" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray={`${(score / 100) * 220} 220`} strokeLinecap="round" className="drop-shadow-md" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black">{score}</span>
                  <span className="text-[10px] text-muted-foreground">/ 100</span>
                </div>
              </div>
              <div className="flex gap-4 w-full justify-center text-xs text-muted-foreground">
                <div className="flex flex-col"><span className="font-bold text-foreground">{scoreFit}</span> Fit</div>
              </div>
            </div>

            {/* Alertas e Pendências */}
            <div className="kpi-card p-6 rounded-2xl md:col-span-2 flex flex-col">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Alertas e Pendências</h3>
              {pendencias.length > 0 ? (
                <ul className="space-y-3 mt-auto mb-auto">
                  {pendencias.map((p, i) => (
                    <li key={i} className="text-sm font-medium flex items-center gap-3 bg-warning/10 text-warning px-4 py-3 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0 animate-pulse" />
                      {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center bg-success/5 rounded-xl border border-success/10 mt-auto mb-auto py-6">
                  <CheckCircle2 className="w-8 h-8 text-success mb-2" />
                  <p className="text-sm font-medium text-success">Tudo em dia!</p>
                  <p className="text-xs text-success/70">Nenhuma pendência ou alerta.</p>
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="md:col-span-3 lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="kpi-card p-4 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><MessageSquare className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Feedbacks Recebidos</p>
                  <p className="text-xl font-bold">{func.feedbacks_recebidos}</p>
                </div>
              </div>

              <div className="kpi-card p-4 rounded-xl flex items-center gap-4 col-span-2 lg:col-span-1">
                <div className="w-10 h-10 rounded-full bg-chart-4/10 flex items-center justify-center shrink-0"><Calendar className="w-5 h-5 text-chart-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Reuniões 1:1</p>
                  <p className="text-xl font-bold">{meetings.length}</p>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>

        <TabsContent value="desempenho" className="space-y-6 mt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" />Feedbacks ({employeeFeedbacks.length})</h3>
            {employeeFeedbacks.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhum feedback encontrado.</div>
            ) : (
              <div className="space-y-3">{employeeFeedbacks.map(fb => {
                const status = fb.status as FeedbackStatus; const priority = fb.prioridade as FeedbackPriority;
                return (
                  <div key={fb.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/feedbacks/${fb.id}`)}>
                    <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{fb.titulo}</p><p className="text-xs text-muted-foreground mt-1">{new Date(fb.criado_em).toLocaleDateString('pt-BR')} Â· Gestor: {fb.gestor || '—'}</p></div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-muted text-muted-foreground'}`}>{statusLabels[status] || fb.status}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[priority] || 'bg-muted text-muted-foreground'}`}>{priorityLabels[priority] || fb.prioridade}</span>
                    </div>
                  </div>
                );
              })}</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="talentos" className="space-y-6 mt-4">
          <div className="flex flex-col gap-6">
            {/* â•â•â• ANÁLISES COMPORTAMENTAIS â•â•â• */}
            <div className="glass-card rounded-xl p-6 border-t-4 border-t-purple-500 shadow-sm flex flex-col min-h-[400px]">
              <Tabs defaultValue="disc" className="w-full flex flex-col h-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <h3 className="font-semibold flex items-center gap-2"><Brain className="w-5 h-5 text-purple-500" />Perfil Psicométrico e Comportamental</h3>
                  <TabsList className="h-9 w-full sm:w-auto grid grid-cols-3">
                    <TabsTrigger value="disc" className="text-xs">DISC</TabsTrigger>
                    <TabsTrigger value="mbti" className="text-xs">MBTI</TabsTrigger>
                    <TabsTrigger value="bigfive" className="text-xs">Big Five</TabsTrigger>
                  </TabsList>
                </div>

                {/* â”€â”€ DISC â”€â”€ */}
                <TabsContent value="disc" className="flex-1 mt-0">
                  {discResult ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                      <DiscReport resultScreen={discResult} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center h-full bg-muted/10 rounded-xl border border-dashed border-border/50">
                      <Brain className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">Teste DISC não realizado.</p>
                    </div>
                  )}
                </TabsContent>

                {/* â”€â”€ MBTI â”€â”€ */}
                <TabsContent value="mbti" className="flex-1 mt-0">
                  {mbtiResult ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                      <MbtiReport resultScreen={mbtiResult} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center h-full bg-muted/10 rounded-xl border border-dashed border-border/50">
                      <Brain className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">Teste MBTI (16 Personalidades) não realizado.</p>
                    </div>
                  )}
                </TabsContent>

                {/* â”€â”€ BIG FIVE â”€â”€ */}
                <TabsContent value="bigfive" className="flex-1 mt-0">
                  {bigFiveResult ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                      <BigFiveReport resultScreen={bigFiveResult} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center h-full bg-muted/10 rounded-xl border border-dashed border-border/50">
                      <Brain className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">Teste Big Five (OCEAN) não realizado.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

          </div>
        </TabsContent>

        <TabsContent value="fit-cultural" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="glass-card rounded-xl p-6 shadow-sm border-t-4 border-t-chart-2">
              <FitCulturalSection employeeId={func.id} employeeName={func.nome} onCloseTab={() => handleTabChange('nine-box')} />
          </div>
        </TabsContent>

        <TabsContent value="nine-box" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="glass-card rounded-xl p-6 border-t-4 border-t-blue-500 shadow-sm flex flex-col">
            <NineBoxSection 
              employeeId={func.id} 
              initialDesempenho={func.nine_box_desempenho} 
              initialPotencial={func.nine_box_potencial} 
              cargo={func.cargo} 
              onUpdate={refreshFunc} 
            />
          </div>
        </TabsContent>

        {/* ═══ DOSSIÊ (RH) TAB (Histórico Disciplinar e Assiduidade) ═══ */}
        <TabsContent value="dossie" className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 glass-card rounded-xl p-6 border-l-4 border-l-orange-500">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-orange-500" /> Dossiê Funcional (RH)</h2>
              <p className="text-sm text-muted-foreground">Histórico completo de assiduidade, ocorrências, advertências e documentações para uso estratégico.</p>
            </div>
          </div>

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



          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-primary" />Controle de Horas Extras</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Extras no período atual</span>
                  <span className={`font-bold ${extrasCount >= 3 ? 'text-destructive' : ''}`}>{extrasCount}/3 {extrasCount >= 3 ? 'â›” BLOQUEADO' : ''}</span>
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

          {/* â”€â”€ Desvios e Advertências â”€â”€ */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-destructive" />Desvios e Advertências</h3>
          </div>

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

          <div className="rounded-lg p-4 border border-orange-500/20 bg-orange-500/5">
            <p className="text-xs text-orange-700 font-medium">
              ⚠️ <strong>Nota:</strong> Faltas Injustificadas NÃO contemplam banco de horas. Este relatório é anexado à ficha do colaborador para envio ao RH no momento do desligamento.
            </p>
          </div>
          
          <div className="border-t border-border/50 pt-6 mt-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-warning" />Eventos Registrados ({employeeEvents.length})</h3>
            
            {employeeEvents.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhum evento registrado para este colaborador.</div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {(() => {
                    const medical = employeeEvents.filter(e => e.location?.toUpperCase().includes('ATENDIMENTO MÃ‰DICO') || e.location?.toUpperCase().includes('PROBLEMA PARTICULAR')).length;
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
          </div>
          <div className="border-t border-border/50 pt-6 mt-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-primary" />Documentação Anexada</h3>
            {documents.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhum documento anexado ao prontuário.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{documents.map(doc => (
                <div key={doc.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{doc.file_name}</p><p className="text-xs text-muted-foreground">{doc.document_type} Â· {new Date(doc.created_at).toLocaleDateString('pt-BR')}</p></div>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-muted"><ExternalLink className="w-4 h-4 text-muted-foreground" /></a>
                </div>
              ))}</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label>Descrição</Label><FastInput value={goalForm.descricao} onValueChange={v => setGoalForm(f => ({ ...f, descricao: v }))} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Peso (%)</Label><Input type="number" value={goalForm.peso} onChange={e => setGoalForm({ ...goalForm, peso: Number(e.target.value) })} /></div><div><Label>Resultado</Label><Input type="number" value={goalForm.resultado} onChange={e => setGoalForm({ ...goalForm, resultado: e.target.value })} placeholder="Ex: 85" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Muito Abaixo</Label><FastInput value={goalForm.muito_abaixo} onValueChange={v => setGoalForm(f => ({ ...f, muito_abaixo: v }))} /></div><div><Label>Abaixo</Label><FastInput value={goalForm.abaixo} onValueChange={v => setGoalForm(f => ({ ...f, abaixo: v }))} /></div><div><Label>Dentro</Label><FastInput value={goalForm.dentro} onValueChange={v => setGoalForm(f => ({ ...f, dentro: v }))} /></div><div><Label>Acima</Label><FastInput value={goalForm.acima} onValueChange={v => setGoalForm(f => ({ ...f, acima: v }))} /></div><div className="col-span-2"><Label>Muito Acima</Label><FastInput value={goalForm.muito_acima} onValueChange={v => setGoalForm(f => ({ ...f, muito_acima: v }))} /></div></div>
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
