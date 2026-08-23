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
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { AccessDenied } from '@/components/auth/PageGuard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { statusLabels, statusColors, priorityLabels, priorityColors, FeedbackStatus, FeedbackPriority } from '@/lib/feedbackData';
import FitCulturalSection from '@/components/fit-cultural/FitCulturalSection';
import PotencialSection from '@/components/potencial/PotencialSection';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBusatoLogoBase64, drawBusatoHeader, drawBusatoFooter } from '@/lib/pdfLogo';
import { DiscReport, MbtiReport, BigFiveReport } from '@/components/ExecutiveReports';
import Organograma from './Organograma';
import NineBoxSection from '@/components/nine-box/NineBoxSection';
import PDIProfileTab from '@/components/profile/PDIProfileTab';

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

interface DiscResultData { profile_name?: string; [key: string]: unknown; }
interface MbtiResultData { mbti_type?: string; [key: string]: unknown; }
interface BigFiveResultData { [key: string]: unknown; }
interface DocWithAutoTable { lastAutoTable?: { finalY: number }; }

interface TooltipEntry { name: string; value: number | string; color?: string; fill?: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string; }
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 border border-border/50 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[150px]">
        {label && <p className="font-black text-sm mb-3 border-b border-border/50 pb-2">{label}</p>}
        <div className="space-y-2">
          {payload.map((entry, index: number) => (
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
  const { canCreate, canEdit, canDelete } = usePermissions();
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

  const [discResult, setDiscResult] = useState<DiscResultData | null>(null);
  const [mbtiResult, setMbtiResult] = useState<MbtiResultData | null>(null);
  const [bigFiveResult, setBigFiveResult] = useState<BigFiveResultData | null>(null);

  const refreshFunc = async () => {
    if (!id) return;
    const { data } = await supabase.from('funcionarios').select('*').eq('id', id).maybeSingle();
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
      supabase.from('assessment_results').select('*').eq('user_id', id)
    ]).then(([funcRes, fbRes, allRes, meetRes, docRes, assessRes]) => {
      if (funcRes.data) {
        const f = funcRes.data as unknown as Funcionario;
        setFunc(f);
      }
      if (fbRes.data) setFeedbacks(fbRes.data as FeedbackItem[]);
      if (allRes.data) setAllFuncionarios(allRes.data as Funcionario[]);
      if (meetRes.data) setMeetings(meetRes.data as MeetingItem[]);
      if (docRes.data) setDocuments(docRes.data as unknown as EmployeeDocument[]);
      
      const tryParseLocal = (key: string) => {
        try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; }
      };

      const arr = (assessRes.data || []) as { type?: string; assessment_type?: string; result_data: DiscResultData | MbtiResultData | BigFiveResultData }[];
      const disc = arr.find(a => (a.type || a.assessment_type) === 'disc');
      const mbti = arr.find(a => (a.type || a.assessment_type) === 'mbti');
      const bigfive = arr.find(a => (a.type || a.assessment_type) === 'bigfive');
      
      const discData = disc?.result_data as DiscResultData || tryParseLocal(`disc_${id}`);
      const mbtiData = mbti?.result_data as MbtiResultData || tryParseLocal(`mbti_${id}`);
      const bigfiveData = bigfive?.result_data as BigFiveResultData || tryParseLocal(`bigfive_${id}`);

      if (discData) setDiscResult(discData);
      if (mbtiData) setMbtiResult(mbtiData);
      if (bigfiveData) setBigFiveResult(bigfiveData);
      
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
    if (!canDelete('colaboradores')) { toast({ title: 'Sem permissão para excluir meta', variant: 'destructive' }); return; }
    try {
      const { error } = await supabase.from('goals').delete().eq('id', deleteGoalId);
      if (error) throw error;
      setDeleteGoalId(null); toast({ title: 'Meta excluída' }); fetchGoals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Erro ao excluir meta', description: msg, variant: 'destructive' });
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
    supabase.from('fit_cultural').select('criteria, stage, score').eq('employee_id', id).then(({ data }) => { if (data) setFitScores(data as { criteria: string; stage: string; score: number | null }[]); });
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
    const faltasInj = attendanceRecords.filter(a => a.status === 'falta' || a.status === 'falta_injustificada').length;
    if (faltasInj > 0) items.push(`${faltasInj} falta(s) injustificada(s)`);
    if (employeeWarnings.length > 0) items.push(`${employeeWarnings.length} advertência(s) registrada(s)`);
    if (employeeEvents.length > 0) items.push(`${employeeEvents.length} evento(s) registrado(s)`);
    return items;
  }, [func, attendanceRecords, employeeWarnings, employeeEvents]);

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



function getTempoEmpresa(dataAdmissao: string | null | undefined): string {
  if (!dataAdmissao) return 'Não informada';
  try {
    const start = new Date(dataAdmissao.includes('T') ? dataAdmissao : dataAdmissao + 'T00:00:00');
    if (isNaN(start.getTime())) return 'Não informada';
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years === 0 && months === 0) return 'Menos de 1 mês';
    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
    return parts.join(' e ');
  } catch {
    return 'Não informada';
  }
}

  async function exportFullProfileReport() {
    if (!func) return;
    toast({ title: 'Gerando PDF do Dossiê...', description: 'Aguarde um momento enquanto reunimos todas as informações do colaborador.' });
    
    try {
      const logoBase64 = await getBusatoLogoBase64();

      // Buscar dados adicionais para o dossiê com tratamento individual resiliente
      const pdisRes = await supabase.from('pdis').select('*').eq('employee_id', func.id);
      const fitRes = await supabase.from('fit_cultural').select('*').eq('employee_id', func.id);
      const nineBoxRes = await supabase.from('nine_box_historico').select('*').eq('employee_id', func.id).order('created_at', { ascending: false });

      const pdisData = pdisRes.data || [];
      const fitList = fitRes.data || [];
      const nineBoxHist = (nineBoxRes.data || []) as unknown as { cycle: string; desempenho: string; potencial: string; created_at: string }[];

      // Buscar ações dos PDIs separadamente se houver PDIs
      let pdiActions: { pdi_id: string; description: string; status: string }[] = [];
      if (pdisData.length > 0) {
        const pdiIds = pdisData.map(p => p.id);
        const { data: actData } = await supabase.from('pdi_actions').select('*').in('pdi_id', pdiIds);
        if (actData) pdiActions = actData as unknown as { pdi_id: string; description: string; status: string }[];
      }

      const pdisList = pdisData.map(p => ({
        ...p,
        pdi_actions: pdiActions.filter(a => a.pdi_id === p.id)
      }));

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const blue: [number, number, number] = [59, 130, 187];
      const blueLt: [number, number, number] = [232, 241, 250];
      const margin = 14;

      function drawHeader() {
        drawBusatoHeader(doc, logoBase64, 'DOSSIÊ COMPLETO DE GESTÃO DE PESSOAS', 'Relatório Consolidado do Colaborador', { pageWidth });
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
          return 75;
        }
        return y;
      }

      // ─── START DOC ───
      drawHeader();
      let y = 75;

      // Subcabeçalho Dossiê ID
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, 'FD');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(`COLABORADOR: ${(func.nome || 'NÃO INFORMADO').toUpperCase()}`, margin + 6, y + 6);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} | ID / Matrícula: ${(func.id || '').slice(0, 8).toUpperCase()} | Cargo: ${func.cargo || '—'}`, margin + 6, y + 11);
      doc.setTextColor(0, 0, 0);

      y += 18;

      // ─── 1. DADOS CADASTRAIS & ESTRUTURA ORGANIZACIONAL ───
      y = drawSectionHeadingLocal('1. DADOS CADASTRAIS E ESTRUTURA ORGANIZACIONAL', y);

      const tempoEmpresa = getTempoEmpresa(func.data_admissao);
      const infoBody = [
        ['Nome Completo', (func.nome || '—').toUpperCase(), 'Matrícula / ID', (func.id || '').slice(0, 8).toUpperCase()],
        ['Cargo / Função', func.cargo || '—', 'Departamento / Contrato', func.departamento || '—'],
        ['Data de Admissão', func.data_admissao ? new Date(func.data_admissao + 'T00:00:00').toLocaleDateString('pt-BR') : '—', 'Tempo de Empresa', tempoEmpresa],
        ['E-mail Corporativo', func.email || 'Não informado', 'Escolaridade / Turno', `${func.escolaridade || '—'} | ${func.turno || '—'}`],
      ];

      autoTable(doc, {
        startY: y,
        body: infoBody,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 38 }, 
          1: { cellWidth: 52 },
          2: { fontStyle: 'bold', cellWidth: 38 }, 
          3: { cellWidth: 52 }
        },
        margin: { left: margin, right: margin },
      });

      y = (doc as unknown as DocWithAutoTable).lastAutoTable?.finalY + 6 || y + 40;

      // ─── DASHBOARD DE RESUMO EXECUTIVO (KPIS) ───
      y = checkPageBreak(y, 25);
      const cardWidth = (pageWidth - margin * 2 - 9) / 4;
      const cardHeight = 16;
      
      const kpis = [
        { label: 'SCORE FIT CULTURAL', value: func.fit_cultural ? `${func.fit_cultural}%` : 'Pendente', color: [59, 130, 187] as [number, number, number] },
        { label: 'NINE BOX ATUAL', value: func.nine_box_desempenho ? `${func.nine_box_desempenho} / ${func.nine_box_potencial || ''}` : 'Não Avaliado', color: [42, 90, 140] as [number, number, number] },
        { label: 'STATUS DO PDI', value: pdisList.length > 0 ? `${pdisList.length} Plano(s)` : 'Sem PDI', color: [58, 79, 122] as [number, number, number] },
        { label: 'PRONTUÁRIO / DESVIOS', value: `${(employeeWarnings || []).filter(w => w.applied).length} Adv. Aplicadas`, color: (employeeWarnings || []).filter(w => w.applied).length > 0 ? [217, 83, 79] as [number, number, number] : [40, 167, 69] as [number, number, number] },
      ];

      kpis.forEach((kpi, index) => {
        const xPos = margin + index * (cardWidth + 3);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(220, 226, 235);
        doc.roundedRect(xPos, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

        doc.setFillColor(...kpi.color);
        doc.rect(xPos, y, cardWidth, 2, 'F');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 110, 120);
        doc.text(kpi.label, xPos + 4, y + 6);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 40, 50);
        doc.text(kpi.value, xPos + 4, y + 12);
      });

      y += cardHeight + 10;

      // ─── 2. MAPEAMENTO PSICOMÉTRICO E COMPORTAMENTAL ───
      y = checkPageBreak(y, 35);
      y = drawSectionHeadingLocal('2. MAPEAMENTO PSICOMÉTRICO E COMPORTAMENTAL', y);

      const tests = [
        ['DISC (Perfil Comportamental)', discResult ? `Perfil Predominante: ${discResult.profile_name || 'Concluído'}` : 'Não realizado'],
        ['MBTI (Tipo Cognitivo)', mbtiResult ? `Tipo: ${mbtiResult.mbti_type || 'Concluído'}` : 'Não realizado'],
        ['Big Five (5 Fatores)', bigFiveResult ? 'Avaliação de Fatores Concluída e Registrada' : 'Não realizado'],
      ];

      autoTable(doc, {
        startY: y,
        body: tests,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 48 } },
        margin: { left: margin, right: margin },
      });

      y = (doc as unknown as DocWithAutoTable).lastAutoTable?.finalY + 6 || y + 25;

      // ─── 3. PLANO DE DESENVOLVIMENTO INDIVIDUAL (PDI) E AÇÕES ───
      y = checkPageBreak(y, 35);
      y = drawSectionHeadingLocal(`3. PLANOS DE DESENVOLVIMENTO INDIVIDUAL - PDI E METAS (${pdisList.length})`, y);

      if (pdisList.length > 0) {
        const pdiRows: string[][] = [];
        pdisList.forEach((p, idx) => {
          const statusMap: Record<string, string> = { pending: 'Pendente', in_progress: 'Em Andamento', completed: 'Concluído' };
          pdiRows.push([
            `PDI #${idx + 1} (${statusMap[p.status] || p.status})`,
            `Criado em: ${new Date(p.created_at).toLocaleDateString('pt-BR')}`,
            `${p.pdi_actions?.length || 0} meta(s) cadastrada(s)`
          ]);

          (p.pdi_actions || []).forEach((act, aIdx) => {
            const actStatusMap: Record<string, string> = { pending: 'Pendente', in_progress: 'Em Andamento', completed: 'Concluído' };
            pdiRows.push([
              `   └ Meta ${aIdx + 1}: ${act.description}`,
              `Status: ${actStatusMap[act.status] || act.status}`,
              'Ação de Desenvolvimento'
            ]);
          });
        });

        autoTable(doc, {
          startY: y,
          head: [['Plano / Meta de Desenvolvimento', 'Situação', 'Tipo / Detalhes']],
          body: pdiRows,
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: blueLt },
          margin: { left: margin, right: margin },
        });
        y = (doc as unknown as DocWithAutoTable).lastAutoTable?.finalY + 6 || y + 25;
      } else {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Nenhum Plano de Desenvolvimento Individual registrado para este colaborador.', margin, y);
        y += 10;
      }

      // ─── 4. HISTÓRICO DE AVALIAÇÕES NINE BOX ───
      y = checkPageBreak(y, 35);
      y = drawSectionHeadingLocal(`4. HISTÓRICO DE AVALIAÇÕES NINE BOX (${nineBoxHist.length})`, y);

      if (nineBoxHist.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Ciclo de Avaliação', 'Desempenho (Entrega)', 'Potencial', 'Data do Registro']],
          body: nineBoxHist.map(n => [
            n.cycle || '—',
            n.desempenho || '—',
            n.potencial || '—',
            n.created_at ? new Date(n.created_at).toLocaleDateString('pt-BR') : '—'
          ]),
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: blueLt },
          margin: { left: margin, right: margin },
        });
        y = (doc as unknown as DocWithAutoTable).lastAutoTable?.finalY + 6 || y + 25;
      } else {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Nenhum registro histórico de Nine Box anterior.', margin, y);
        y += 10;
      }

      // ─── 5. RESUMO DE OCORRÊNCIAS & ABSENTEÍSMO ───
      const faltasInj = (attendanceRecords || []).filter(a => a.status === 'falta' || a.status === 'falta_injustificada').length;
      const faltasJust = (attendanceRecords || []).filter(a => a.status === 'falta_justificada').length;
      const atestados = (attendanceRecords || []).filter(a => a.status === 'atestado').length;
      const advApplied = (employeeWarnings || []).filter(w => w.applied).length;

      y = checkPageBreak(y, 40);
      y = drawSectionHeadingLocal('5. INDICADORES DE ABSENTEÍSMO E DESVIOS OPERACIONAIS', y);

      autoTable(doc, {
        startY: y,
        head: [['Indicador de Gestão', 'Quantidade Registrada', 'Situação / Impacto']],
        body: [
          ['Faltas Injustificadas', String(faltasInj), faltasInj > 0 ? 'Atenção Requerida (Prontuário)' : 'Regular'],
          ['Faltas Justificadas / Atestados Médicos', String(faltasJust + atestados), 'Acompanhado por RH'],
          ['Advertências Disciplinares Aplicadas', String(advApplied), advApplied > 0 ? 'Registrado em Prontuário' : 'Sem ocorrências'],
          ['Eventos Operacionais de SSMA', String((employeeEvents || []).length), (employeeEvents || []).length > 0 ? 'Registrado' : 'Sem registros'],
        ],
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: blueLt },
        margin: { left: margin, right: margin },
      });

      y = (doc as unknown as DocWithAutoTable).lastAutoTable?.finalY + 6 || y + 35;

      // ─── 6. REGISTRO DE ADVERTÊNCIAS E OCORRÊNCIAS ───
      if ((employeeWarnings || []).length > 0) {
        y = checkPageBreak(y, 35);
        y = drawSectionHeadingLocal(`6. DETALHAMENTO DE ADVERTÊNCIAS (${employeeWarnings.length})`, y);

        autoTable(doc, {
          startY: y,
          head: [['Data', 'Motivo da Ocorrência', 'Aplicada', 'Observações / Tratativa']],
          body: employeeWarnings.map(w => [
            w.date ? new Date(w.date + 'T00:00:00').toLocaleDateString('pt-BR') : '—',
            w.reason || '—',
            w.applied ? 'SIM' : 'NÃO',
            w.observation || '—',
          ]),
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: blueLt },
          margin: { left: margin, right: margin },
        });
        y = (doc as unknown as DocWithAutoTable).lastAutoTable?.finalY + 6 || y + 25;
      }

      // ─── 7. FEEDBACKS REGISTRADOS ───
      const feedbacksList = employeeFeedbacks || [];
      y = checkPageBreak(y, 40);
      y = drawSectionHeadingLocal(`7. HISTÓRICO DE FEEDBACKS (${feedbacksList.length})`, y);

      if (feedbacksList.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Data', 'Título do Feedback', 'Gestor / Responsável', 'Status']],
          body: feedbacksList.slice(0, 15).map(f => [
            f.criado_em ? new Date(f.criado_em).toLocaleDateString('pt-BR') : '—',
            (f.titulo || '—').length > 45 ? (f.titulo || '').substring(0, 42) + '...' : (f.titulo || '—'),
            f.gestor || '—',
            statusLabels[f.status as FeedbackStatus] || f.status || '—'
          ]),
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: blueLt },
          margin: { left: margin, right: margin },
        });
        y = (doc as unknown as DocWithAutoTable).lastAutoTable?.finalY + 6 || y + 25;
      }

      // ─── 8. ASSINATURAS INSTITUCIONAIS ───
      y = checkPageBreak(y, 45);
      y = y + 25;
      doc.setDrawColor(180, 180, 180);
      doc.line(margin + 10, y, 85, y);
      doc.line(pageWidth / 2 + 10, y, pageWidth - margin - 10, y);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text((func.nome || 'COLABORADOR').toUpperCase(), margin + 15, y + 5);
      doc.text('DIREÇÃO DE RH / LIDERANÇA RESPONSÁVEL', pageWidth / 2 + 15, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text('Assinatura do Colaborador', margin + 22, y + 9);
      doc.text('Busato Contratos - Gestão de Pessoas', pageWidth / 2 + 22, y + 9);

      // ─── FOOTER & HEADERS EM TODAS AS PÁGINAS ───
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        drawFooter(i, pageCount);
        if (i > 1) drawHeader();
      }

      const safeFileName = (func.nome || 'Colaborador').replace(/[^a-zA-Z0-9_\-]/g, '_');
      doc.save(`Dossie_Executivo_${safeFileName}.pdf`);
      toast({ title: 'Dossiê Executivo Exportado!', description: 'O relatório em PDF de alto padrão foi gerado com sucesso.' });
    } catch (err: unknown) {
      console.error('Erro ao gerar PDF do Dossiê:', err);
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro ao gerar PDF do Dossiê', description: msg, variant: 'destructive' });
    }
  }

  const { userDepartment, isDepartmentLocked } = useAuth();

  if (loading) return <div className="flex justify-center py-12 text-muted-foreground">Carregando...</div>;
  if (!func) return <div className="text-center py-12 text-muted-foreground">Funcionário não encontrado</div>;

  if (isDepartmentLocked && userDepartment && func.departamento !== userDepartment) {
    return <AccessDenied />;
  }

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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-6 h-auto p-1.5 bg-muted/50 rounded-xl">
          <TabsTrigger value="visao-geral" className="py-2.5 rounded-lg text-sm font-medium">Visão Geral</TabsTrigger>
          <TabsTrigger value="talentos" className="py-2.5 rounded-lg text-sm font-medium">Perfil Psicométrico</TabsTrigger>
          <TabsTrigger value="fit-cultural" className="py-2.5 rounded-lg text-sm font-medium">Fit Cultural</TabsTrigger>
          <TabsTrigger value="nine-box" className="py-2.5 rounded-lg text-sm font-medium">Nine Box</TabsTrigger>
          <TabsTrigger value="desempenho" className="py-2.5 rounded-lg text-sm font-medium">Feedback</TabsTrigger>
          <TabsTrigger value="pdi" className="py-2.5 rounded-lg text-sm font-medium border-emerald-500/30 text-emerald-600 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-600">PDI</TabsTrigger>
        </TabsList>

        {/* 1. VISÃO GERAL */}
        <TabsContent value="visao-geral" className="space-y-6 mt-4">
          {/* Grid Principal Bento */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Score & Desempenho */}
            <div className="kpi-card p-6 rounded-2xl flex flex-col justify-between items-center text-center space-y-4 shadow-sm border border-border bg-card">
              <div className="w-full flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Score de Performance</h3>
                <Award className="w-4 h-4 text-primary" />
              </div>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle cx="40" cy="40" r="35" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray={`${(score / 100) * 220} 220`} strokeLinecap="round" className="drop-shadow-md" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black">{score}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">/ 100</span>
                </div>
              </div>
              <div className="w-full pt-2 border-t border-border flex items-center justify-around text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Fit Cultural</span>
                  <span className="font-bold text-foreground">{func.fit_cultural ? `${func.fit_cultural}%` : 'Pendente'}</span>
                </div>
                <div className="w-px h-6 bg-border" />
                <div>
                  <span className="text-muted-foreground block text-[10px]">Nine Box</span>
                  <span className="font-bold text-foreground truncate max-w-[90px] block" title={`${func.nine_box_desempenho || '—'} / ${func.nine_box_potencial || '—'}`}>
                    {func.nine_box_desempenho ? `${func.nine_box_desempenho}` : 'Pendente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Informações Cadastrais do Perfil */}
            <div className="kpi-card p-6 rounded-2xl md:col-span-1 lg:col-span-2 flex flex-col justify-between shadow-sm border border-border bg-card">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Informações Cadastrais do Colaborador
                </h3>
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                  ID: {func.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Nome Completo</span>
                  <span className="font-bold text-foreground leading-tight">{func.nome}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Cargo</span>
                  <span className="font-bold text-foreground leading-tight">{func.cargo}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Departamento</span>
                  <span className="font-bold text-foreground leading-tight">{func.departamento}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Data de Admissão</span>
                  <span className="font-bold text-foreground leading-tight">
                    {new Date(func.data_admissao + 'T00:00:00').toLocaleDateString('pt-BR')}
                    {(() => {
                      const adm = new Date(func.data_admissao + 'T00:00:00');
                      if (isNaN(adm.getTime())) return null;
                      const now = new Date();
                      let y = now.getFullYear() - adm.getFullYear();
                      let m = now.getMonth() - adm.getMonth();
                      if (m < 0) { y--; m += 12; }
                      const str = y > 0 ? `${y} ano${y > 1 ? 's' : ''}` : `${m} mês${m > 1 ? 'es' : ''}`;
                      return <span className="text-xs font-normal text-muted-foreground block">({str} na empresa)</span>;
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">E-mail</span>
                  <span className="font-semibold text-foreground truncate block" title={func.email || '—'}>{func.email || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Escolaridade / Turno</span>
                  <span className="font-semibold text-foreground">{func.escolaridade || '—'} {turnoDisplay ? `• ${turnoDisplay}` : ''}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Perfil Psicométrico Summary */}
            <div className="kpi-card p-6 rounded-2xl flex flex-col justify-between shadow-sm border border-border bg-card">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" /> Perfil Psicométrico
                </h3>
                <span className="text-[10px] text-purple-600 bg-purple-500/10 font-bold px-2 py-0.5 rounded-full">Talentos</span>
              </div>
              <div className="space-y-3 py-2">
                <div className="p-2.5 rounded-xl bg-muted/40 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">DISC</span>
                  <span className="text-xs font-bold text-foreground">
                    {discResult ? (discResult.profile_name || 'Concluído') : 'Não realizado'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">MBTI</span>
                  <span className="text-xs font-bold text-foreground">
                    {mbtiResult ? (mbtiResult.mbti_type || 'Concluído') : 'Não realizado'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Big Five</span>
                  <span className="text-xs font-bold text-foreground">
                    {bigFiveResult ? 'Concluído' : 'Não realizado'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Segunda Linha Bento: Métricas Operacionais + Alertas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Quick Stats Grid */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="kpi-card p-4 rounded-2xl flex flex-col justify-between border border-border bg-card shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{employeeFeedbacks.length}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Feedbacks</p>
                </div>
              </div>

              <div className="kpi-card p-4 rounded-2xl flex flex-col justify-between border border-border bg-card shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-chart-4/10 flex items-center justify-center mb-2">
                  <Calendar className="w-4 h-4 text-chart-4" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">
                    {attendanceRecords.filter(a => a.status === 'falta' || a.status === 'falta_injustificada').length}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Faltas Injustif.</p>
                </div>
              </div>

              <div className="kpi-card p-4 rounded-2xl flex flex-col justify-between border border-border bg-card shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{employeeEvents.length}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Ocorrências</p>
                </div>
              </div>

              <div className="kpi-card p-4 rounded-2xl flex flex-col justify-between border border-border bg-card shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center mb-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{employeeWarnings.length}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Advertências</p>
                </div>
              </div>
            </div>

            {/* Alertas e Pendências */}
            <div className="kpi-card p-6 rounded-2xl flex flex-col justify-between border border-border bg-card shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-warning" /> Alertas e Pendências
              </h3>
              {pendencias.length > 0 ? (
                <ul className="space-y-2.5">
                  {pendencias.map((p, i) => (
                    <li key={i} className="text-xs font-semibold flex items-center gap-2.5 bg-warning/10 text-warning px-3 py-2.5 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0 animate-pulse" />
                      {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center bg-success/5 rounded-xl border border-success/10 py-6">
                  <CheckCircle2 className="w-7 h-7 text-success mb-2" />
                  <p className="text-sm font-bold text-success">Tudo em dia!</p>
                  <p className="text-xs text-success/70">Nenhuma pendência para este colaborador.</p>
                </div>
              )}
            </div>

          </div>
        </TabsContent>

        {/* 2. PERFIL PSICOMÉTRICO */}
        <TabsContent value="talentos" className="space-y-6 mt-4">
          <div className="flex flex-col gap-6">
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

        {/* 3. FIT CULTURAL */}
        <TabsContent value="fit-cultural" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="glass-card rounded-xl p-6 shadow-sm border-t-4 border-t-chart-2">
              <FitCulturalSection employeeId={func.id} employeeName={func.nome} onCloseTab={() => handleTabChange('nine-box')} />
          </div>
        </TabsContent>

        {/* 4. NINE BOX */}
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

        {/* 5. FEEDBACK */}
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
                    <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{fb.titulo}</p><p className="text-xs text-muted-foreground mt-1">{new Date(fb.criado_em).toLocaleDateString('pt-BR')} • Gestor: {fb.gestor || '—'}</p></div>
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

        {/* 6. PDI */}
        <TabsContent value="pdi" className="mt-4">
          {func && (
            <PDIProfileTab employeeName={func.nome} employeeId={func.id} />
          )}
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
