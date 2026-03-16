import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Target, TrendingUp, AlertTriangle, Calendar, Users, Star, Pencil, Trash2, Plus, GraduationCap, FileText, Briefcase, ExternalLink, Camera, Loader2, Clock, Sun, Shield, CalendarDays } from 'lucide-react';
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

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--accent))'];
const emptyGoalForm = { descricao: '', peso: 0, resultado: '' as string, muito_abaixo: '', abaixo: '', dentro: '', acima: '', muito_acima: '' };
const turnoLabels: Record<string, string> = { dia_a: 'Dia A', dia_b: 'Dia B', noite_a: 'Noite A', noite_b: 'Noite B', adm: 'ADM' };
const attendanceStatusLabels: Record<string, string> = {
  presente: 'Presente', falta: 'Falta', falta_justificada: 'Falta Justificada',
  atestado: 'Atestado', extra: 'Extra', ferias: 'Férias', afastamento: 'Afastamento',
  abono: 'Abono', banco_horas: 'Banco de Horas',
};
const attendanceStatusColors: Record<string, string> = {
  presente: 'bg-success/10 text-success', falta: 'bg-destructive/10 text-destructive',
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
    return items;
  }, [func, meetings]);

  const pieData = goals.map(g => ({ name: g.descricao, value: g.peso }));
  const barData = goals.map(g => ({ name: g.descricao.length > 20 ? g.descricao.slice(0, 18) + '…' : g.descricao, Peso: g.peso }));

  if (loading) return <div className="flex justify-center py-12 text-muted-foreground">Carregando...</div>;
  if (!func) return <div className="text-center py-12 text-muted-foreground">Funcionário não encontrado</div>;

  const turnoDisplay = func.turno ? (turnoLabels[func.turno] || func.turno) : null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
        <div><h1 className="text-2xl font-bold">Perfil do Funcionário</h1><p className="text-muted-foreground text-sm">Visão consolidada de desempenho</p></div>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, label: 'Feedbacks Recebidos', value: func.feedbacks_recebidos, color: 'text-primary' },
          { icon: Target, label: 'Feedbacks Resolvidos', value: `${pctResolvido}%`, color: pctResolvido >= 70 ? 'text-success' : 'text-warning' },
          { icon: Calendar, label: 'Reuniões 1:1', value: meetings.length, color: 'text-primary' },
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
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
