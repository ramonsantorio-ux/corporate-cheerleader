import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Target, TrendingUp, AlertTriangle, Calendar, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface Funcionario {
  id: string; nome: string; cargo: string; departamento: string; foto_url: string;
  feedbacks_recebidos: number; feedbacks_resolvidos: number; email: string; data_admissao: string;
}

interface FeedbackItem {
  id: string; titulo: string; status: string; prioridade: string; criado_em: string; gestor: string;
}

interface MeetingItem {
  id: string; meeting_date: string; manager_name: string; notes: string; status: string;
}

export default function FuncionarioProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [func, setFunc] = useState<Funcionario | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [allFuncionarios, setAllFuncionarios] = useState<Funcionario[]>([]);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('funcionarios').select('*').eq('id', id).single(),
      supabase.from('feedbacks').select('id, titulo, status, prioridade, criado_em, gestor').order('criado_em', { ascending: false }),
      supabase.from('funcionarios').select('id, nome, cargo, departamento, foto_url, feedbacks_recebidos, feedbacks_resolvidos, email, data_admissao'),
      supabase.from('meetings').select('*').eq('employee_id', id).order('meeting_date', { ascending: false }),
    ]).then(([funcRes, fbRes, allRes, meetRes]) => {
      if (funcRes.data) setFunc(funcRes.data as Funcionario);
      if (fbRes.data) {
        const filtered = (fbRes.data as FeedbackItem[]).filter(f => f.gestor === funcRes.data?.nome || f.titulo?.includes(funcRes.data?.nome || ''));
        setFeedbacks(fbRes.data as FeedbackItem[]);
      }
      if (allRes.data) setAllFuncionarios(allRes.data as Funcionario[]);
      if (meetRes.data) setMeetings(meetRes.data as MeetingItem[]);
      setLoading(false);
    });
  }, [id]);

  const employeeFeedbacks = useMemo(() => {
    if (!func) return [];
    return feedbacks.filter(f => f.titulo?.toLowerCase().includes(func.nome.toLowerCase()));
  }, [feedbacks, func]);

  const score = useMemo(() => {
    if (!func) return 0;
    const resolRate = func.feedbacks_recebidos > 0 ? (func.feedbacks_resolvidos / func.feedbacks_recebidos) * 50 : 25;
    const meetingBonus = Math.min(meetings.length * 5, 25);
    const feedbackBonus = Math.min(func.feedbacks_recebidos * 2, 25);
    return Math.min(Math.round(resolRate + meetingBonus + feedbackBonus), 100);
  }, [func, meetings]);

  const deptAvg = useMemo(() => {
    if (!func) return 0;
    const deptPeople = allFuncionarios.filter(f => f.departamento === func.departamento);
    if (deptPeople.length === 0) return 0;
    const avg = deptPeople.reduce((acc, f) => {
      const rate = f.feedbacks_recebidos > 0 ? (f.feedbacks_resolvidos / f.feedbacks_recebidos) * 100 : 0;
      return acc + rate;
    }, 0) / deptPeople.length;
    return Math.round(avg);
  }, [func, allFuncionarios]);

  const pctResolvido = func && func.feedbacks_recebidos > 0
    ? Math.round((func.feedbacks_resolvidos / func.feedbacks_recebidos) * 100) : 0;

  const pendencias = useMemo(() => {
    const items: string[] = [];
    if (func && func.feedbacks_recebidos > func.feedbacks_resolvidos) {
      items.push(`${func.feedbacks_recebidos - func.feedbacks_resolvidos} feedback(s) pendente(s)`);
    }
    if (meetings.length === 0) items.push('Nenhuma reunião 1:1 registrada');
    return items;
  }, [func, meetings]);

  if (loading) return <div className="flex justify-center py-12 text-muted-foreground">Carregando...</div>;
  if (!func) return <div className="text-center py-12 text-muted-foreground">Funcionário não encontrado</div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Perfil do Funcionário</h1>
          <p className="text-muted-foreground text-sm">Visão consolidada de desempenho</p>
        </div>
      </motion.div>

      {/* Header Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-center">
        {func.foto_url ? (
          <img src={func.foto_url} alt={func.nome} className="w-24 h-24 rounded-full object-cover border-4 border-primary/20" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
            {func.nome.charAt(0)}
          </div>
        )}
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold">{func.nome}</h2>
          <p className="text-muted-foreground">{func.cargo} · {func.departamento}</p>
          <p className="text-sm text-muted-foreground mt-1">{func.email || 'Sem e-mail'} · Admissão: {new Date(func.data_admissao).toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="text-center">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="35" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle cx="40" cy="40" r="35" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                strokeDasharray={`${(score / 100) * 220} 220`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{score}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Score Geral</p>
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
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4 text-center">
            <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Comparativo */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Comparativo com Equipe ({func.departamento})</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1"><span>{func.nome}</span><span className="font-bold">{pctResolvido}%</span></div>
            <Progress value={pctResolvido} className="h-3" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1"><span>Média da equipe</span><span className="font-bold">{deptAvg}%</span></div>
            <Progress value={deptAvg} className="h-3" />
          </div>
        </div>
      </motion.div>

      {/* Alertas */}
      {pendencias.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-5 border-l-4 border-warning">
          <h3 className="font-semibold flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5 text-warning" />Alertas e Pendências</h3>
          <ul className="space-y-1">
            {pendencias.map((p, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />{p}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Timeline de Reuniões */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card rounded-xl p-6">
        <h3 className="font-semibold mb-4">Últimas Reuniões 1:1</h3>
        {meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma reunião registrada para este funcionário.</p>
        ) : (
          <div className="space-y-3">
            {meetings.slice(0, 5).map(m => (
              <div key={m.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{new Date(m.meeting_date).toLocaleDateString('pt-BR')} — {m.manager_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.notes || 'Sem anotações'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'completed' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                  {m.status === 'completed' ? 'Concluída' : 'Agendada'}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
