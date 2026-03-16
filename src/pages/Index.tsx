import { MessageSquare, TrendingUp, AlertTriangle, CheckCircle2, Clock, Users, ArrowUpRight } from 'lucide-react';
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

  // Department grouping for employee grid
  const deptGroups = funcionarios.reduce<Record<string, DashboardFuncionario[]>>((acc, f) => {
    const dept = f.departamento || 'Outros';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Painel Executivo</p>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Atualizado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Feedbacks" value={total} change={`${total} registrados`} changeType="neutral" icon={MessageSquare} delay={0} />
        <StatCard title="Em Andamento" value={emAndamento} change="Ativos" changeType="neutral" icon={Clock} delay={0.05} />
        <StatCard title="Pendentes" value={criticos} change="Não resolvidos" changeType={criticos > 0 ? "negative" : "positive"} icon={AlertTriangle} delay={0.1} />
        <StatCard title="Resolvidos" value={resolvidos} change={total > 0 ? `Taxa ${Math.round((resolvidos / total) * 100)}%` : '0%'} changeType="positive" icon={CheckCircle2} delay={0.15} />
      </div>

      {/* Distribution Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="corporate-section">
        <div className="corporate-section-header">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Distribuição por Setor</h2>
          </div>
          <span className="text-xs text-muted-foreground">{setorData.length} setores</span>
        </div>
        <div className="corporate-section-body">
          {setorData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum feedback registrado.</p>
          ) : (
            <div className="space-y-3">
              {setorData.map((cat, i) => (
                <motion.div key={cat.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.03 }}
                  className="flex items-center gap-4">
                  <span className="text-sm text-foreground w-40 shrink-0 truncate font-medium">{cat.label}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${cat.pct}%` }} transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                      className="h-full bg-primary rounded-full" />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-8 text-right">{cat.count}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right">{cat.pct}%</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Employees Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="corporate-section">
        <div className="corporate-section-header">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Quadro de Colaboradores</h2>
          </div>
          <button onClick={() => navigate('/colaboradores')} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
            Ver todos <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="corporate-section-body space-y-6">
          {Object.entries(deptGroups).sort(([a], [b]) => a.localeCompare(b)).map(([dept, employees]) => (
            <div key={dept}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{dept}</h3>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{employees.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {employees.map((func, i) => {
                  const pct = func.feedbacks_recebidos > 0 ? Math.round((func.feedbacks_resolvidos / func.feedbacks_recebidos) * 100) : 0;
                  return (
                    <motion.div key={func.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.02 }}
                      className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => navigate(`/funcionario/${func.id}`)}>
                      <div className="flex items-center gap-3 mb-2">
                        {func.foto_url ? (
                          <img src={func.foto_url} alt={func.nome} className="w-10 h-10 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm">
                            {func.nome.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">{func.nome}</p>
                          <p className="text-xs text-muted-foreground truncate">{func.cargo}</p>
                        </div>
                      </div>
                      {(func.turno || func.letra) && (
                        <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">
                          {func.turno && (turnoLabels[func.turno] || func.turno)}
                          {func.turno && func.letra && ' · '}
                          {func.letra && `Letra ${func.letra}`}
                        </p>
                      )}
                      <div className="flex items-center gap-3 pt-2 border-t border-border">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Feedbacks</p>
                          <p className="text-sm font-semibold text-foreground">{func.feedbacks_recebidos}</p>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-xs text-muted-foreground">Resolução</p>
                          <p className={`text-sm font-semibold ${pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-destructive'}`}>{pct}%</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
