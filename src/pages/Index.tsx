import { MessageSquare, TrendingUp, AlertTriangle, CheckCircle2, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '@/components/dashboard/StatCard';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setorLabels, FeedbackSetor } from '@/lib/feedbackData';

interface DashboardFuncionario {
  id: string; nome: string; cargo: string; departamento: string; foto_url: string;
  feedbacks_recebidos: number; feedbacks_resolvidos: number; turno: string; letra: string;
}

interface FeedbackRow { id: string; setor: string; status: string; criado_em: string; autor: string; }

const turnoLabels: Record<string, string> = { dia_a: 'Dia A', dia_b: 'Dia B', noite_a: 'Noite A', noite_b: 'Noite B', adm: 'ADM' };

export default function Index() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [funcionarios, setFuncionarios] = useState<DashboardFuncionario[]>([]);

  useEffect(() => {
    supabase.from('feedbacks').select('id, setor, status, criado_em, autor').then(({ data }) => { if (data) setFeedbacks(data); });
    supabase.from('funcionarios').select('id, nome, cargo, departamento, foto_url, feedbacks_recebidos, feedbacks_resolvidos, turno, letra').then(({ data }) => { if (data) setFuncionarios(data as DashboardFuncionario[]); });
  }, []);

  const total = feedbacks.length;
  const emAndamento = feedbacks.filter(f => f.status === 'em_andamento' || f.status === 'em_analise').length;
  const criticos = feedbacks.filter(f => f.status !== 'resolvido' && f.status !== 'arquivado').length;
  const resolvidos = feedbacks.filter(f => f.status === 'resolvido').length;

  const setorCounts: Record<string, number> = {};
  feedbacks.forEach(f => { setorCounts[f.setor] = (setorCounts[f.setor] || 0) + 1; });
  const setorData = Object.entries(setorCounts).map(([key, count]) => ({
    label: setorLabels[key as FeedbackSetor] || key, count, pct: total > 0 ? Math.round((count / total) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral dos feedbacks da empresa</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={total} change={`${total} registrados`} changeType="neutral" icon={MessageSquare} delay={0} />
        <StatCard title="Em Andamento" value={emAndamento} change="Ativos" changeType="neutral" icon={Clock} delay={0.1} />
        <StatCard title="Pendentes" value={criticos} change="Não resolvidos" changeType={criticos > 0 ? "negative" : "positive"} icon={AlertTriangle} delay={0.2} />
        <StatCard title="Resolvidos" value={resolvidos} change={total > 0 ? `Taxa de ${Math.round((resolvidos / total) * 100)}%` : '0%'} changeType="positive" icon={CheckCircle2} delay={0.3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Funcionários</h2>
          <button onClick={() => navigate('/colaboradores')} className="text-sm text-primary hover:underline">Ver todos</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {funcionarios.map((func, i) => {
            const pct = func.feedbacks_recebidos > 0 ? Math.round((func.feedbacks_resolvidos / func.feedbacks_recebidos) * 100) : 0;
            return (
              <motion.div key={func.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card rounded-xl p-4 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/funcionario/${func.id}`)}>
                {func.foto_url ? <img src={func.foto_url} alt={func.nome} className="w-14 h-14 rounded-full mx-auto mb-2 object-cover border-2 border-primary/20" /> : <div className="w-14 h-14 rounded-full mx-auto mb-2 bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">{func.nome.charAt(0)}</div>}
                <p className="font-semibold text-sm truncate">{func.nome}</p>
                <p className="text-xs text-muted-foreground truncate">{func.cargo}</p>
                <p className="text-xs text-muted-foreground truncate mb-1">{func.departamento}</p>
                {(func.turno || func.letra) && (
                  <p className="text-[10px] text-muted-foreground">
                    {func.turno && (turnoLabels[func.turno] || func.turno)}
                    {func.turno && func.letra && ' · '}
                    {func.letra && `Letra ${func.letra}`}
                  </p>
                )}
                <div className="flex justify-center gap-3 text-xs mt-1">
                  <div><p className="font-bold text-foreground">{func.feedbacks_recebidos}</p><p className="text-muted-foreground">Receb.</p></div>
                  <div><p className={`font-bold ${pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-destructive'}`}>{pct}%</p><p className="text-muted-foreground">Resolv.</p></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Distribuição por Setor</h2>
        {setorData.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum feedback registrado ainda.</p> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{setorData.map(cat => (
            <div key={cat.label} className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xl font-bold">{cat.count}</p>
              <p className="text-xs text-muted-foreground mt-1">{cat.label}</p>
              <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${cat.pct}%` }} /></div>
            </div>
          ))}</div>
        )}
      </motion.div>
    </div>
  );
}
