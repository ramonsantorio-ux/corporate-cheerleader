import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

const monthlyData = [
  { mes: 'Set', total: 18 },
  { mes: 'Out', total: 24 },
  { mes: 'Nov', total: 31 },
  { mes: 'Dez', total: 22 },
  { mes: 'Jan', total: 28 },
  { mes: 'Fev', total: 42 },
];

const maxVal = Math.max(...monthlyData.map(d => d.total));

export default function Relatorios() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-1">Análise e métricas dos feedbacks</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Feedbacks por Mês</h2>
          </div>
          <div className="flex items-end gap-3 h-48">
            {monthlyData.map((d, i) => (
              <div key={d.mes} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium">{d.total}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.total / maxVal) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="w-full bg-primary rounded-t-md min-h-[4px]"
                />
                <span className="text-xs text-muted-foreground">{d.mes}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Métricas Chave</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Tempo médio de resolução', value: '4.2 dias', trend: '-12%' },
              { label: 'Taxa de resolução', value: '59%', trend: '+8%' },
              { label: 'Satisfação média', value: '4.1/5', trend: '+0.3' },
              { label: 'Feedbacks por colaborador', value: '1.8', trend: '+0.4' },
            ].map((metric) => (
              <div key={metric.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{metric.value}</span>
                  <span className="text-xs text-success font-medium">{metric.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Top Departamentos</h2>
          </div>
          <div className="space-y-3">
            {[
              { dept: 'Customer Success', count: 14, pct: 33 },
              { dept: 'Produto', count: 10, pct: 24 },
              { dept: 'Segurança', count: 8, pct: 19 },
              { dept: 'Vendas', count: 6, pct: 14 },
              { dept: 'RH', count: 4, pct: 10 },
            ].map((d) => (
              <div key={d.dept} className="flex items-center gap-4">
                <span className="text-sm w-40 shrink-0">{d.dept}</span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${d.pct}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
