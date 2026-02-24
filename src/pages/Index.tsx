import { MessageSquare, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '@/components/dashboard/StatCard';
import FeedbackCard from '@/components/feedback/FeedbackCard';
import { mockFeedbacks } from '@/lib/feedbackData';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const navigate = useNavigate();
  const recentFeedbacks = mockFeedbacks.slice(0, 4);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral dos feedbacks da empresa</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={42} change="+8 esta semana" changeType="positive" icon={MessageSquare} delay={0} />
        <StatCard title="Em Andamento" value={12} change="3 novos hoje" changeType="neutral" icon={Clock} delay={0.1} />
        <StatCard title="Críticos" value={5} change="-2 vs semana passada" changeType="positive" icon={AlertTriangle} delay={0.2} />
        <StatCard title="Resolvidos" value={25} change="Taxa de 59%" changeType="positive" icon={CheckCircle2} delay={0.3} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Feedbacks Recentes</h2>
            <button
              onClick={() => navigate('/feedbacks')}
              className="text-sm text-primary hover:underline"
            >
              Ver todos
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {recentFeedbacks.map((fb, i) => (
              <FeedbackCard
                key={fb.id}
                feedback={fb}
                index={i}
                onClick={() => navigate(`/feedbacks/${fb.id}`)}
              />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card rounded-xl p-5 space-y-4"
        >
          <h2 className="text-lg font-semibold">Atividade Recente</h2>
          <div className="space-y-3">
            {[
              { text: 'Maria Silva comentou em "Melhorar tempo de resposta"', time: '2h atrás' },
              { text: 'Carlos Mendes criou feedback sobre 2FA', time: '4h atrás' },
              { text: 'Feedback "Fluxo de aprovação" marcado como resolvido', time: '1 dia atrás' },
              { text: 'Pedro Santos votou em "Dashboard em tempo real"', time: '1 dia atrás' },
              { text: 'Ana Oliveira criou feedback sobre onboarding', time: '2 dias atrás' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-foreground">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="glass-card rounded-xl p-5"
      >
        <h2 className="text-lg font-semibold mb-4">Distribuição por Categoria</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Produto', count: 8, pct: 19 },
            { label: 'Atendimento', count: 12, pct: 29 },
            { label: 'Processo', count: 6, pct: 14 },
            { label: 'Tecnologia', count: 10, pct: 24 },
            { label: 'RH', count: 4, pct: 10 },
            { label: 'Outro', count: 2, pct: 5 },
          ].map((cat) => (
            <div key={cat.label} className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xl font-bold">{cat.count}</p>
              <p className="text-xs text-muted-foreground mt-1">{cat.label}</p>
              <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${cat.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
