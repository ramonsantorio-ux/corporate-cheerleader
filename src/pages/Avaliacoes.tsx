import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface Goal {
  id: string;
  cargo: string;
  descricao: string;
  peso: number;
  resultado: number | null;
  muito_abaixo: string;
  abaixo: string;
  dentro: string;
  acima: string;
  muito_acima: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--accent))'];

export default function Avaliacoes() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargos, setCargos] = useState<string[]>([]);
  const [selectedCargo, setSelectedCargo] = useState<string>('');

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    const { data } = await supabase.from('goals').select('*').order('peso', { ascending: false });
    if (data) {
      const typed = data as Goal[];
      setGoals(typed);
      const uniqueCargos = [...new Set(typed.map(g => g.cargo))];
      setCargos(uniqueCargos);
      if (uniqueCargos.length > 0 && !selectedCargo) setSelectedCargo(uniqueCargos[0]);
    }
    setLoading(false);
  }

  const filtered = goals.filter(g => g.cargo === selectedCargo);

  const pieData = filtered.map(g => ({ name: g.descricao, value: g.peso }));
  const barData = filtered.map(g => ({ name: g.descricao.length > 20 ? g.descricao.slice(0, 18) + '…' : g.descricao, Peso: g.peso }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Target className="w-6 h-6 text-primary" /> Gestão de Metas</h1>
          <p className="text-muted-foreground text-sm mt-1">Metas por cargo — Contrato Porto</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedCargo} onValueChange={setSelectedCargo}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
            <SelectContent>
              {cargos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhuma meta encontrada para este cargo.</div>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart - peso distribution */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card rounded-xl p-5">
              <h2 className="text-base font-semibold text-foreground mb-4">Distribuição de Pesos</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} label={({ name, value }) => `${value}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Bar chart */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-card rounded-xl p-5">
              <h2 className="text-base font-semibold text-foreground mb-4">Peso por Meta</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="Peso" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Goals table */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Detalhamento das Metas — {selectedCargo}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Peso</th>
                    <th className="text-center p-3 font-medium text-muted-foreground whitespace-nowrap">Muito Abaixo</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Abaixo</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Dentro</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Acima</th>
                    <th className="text-center p-3 font-medium text-muted-foreground whitespace-nowrap">Muito Acima</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((goal, i) => (
                    <tr key={goal.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-3 font-medium text-foreground">{goal.descricao}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-semibold rounded-full px-2.5 py-0.5 text-xs">{goal.peso}%</span>
                      </td>
                      <td className="p-3 text-center text-xs text-destructive">{goal.muito_abaixo}</td>
                      <td className="p-3 text-center text-xs text-destructive/70">{goal.abaixo}</td>
                      <td className="p-3 text-center text-xs text-foreground">{goal.dentro}</td>
                      <td className="p-3 text-center text-xs text-primary">{goal.acima}</td>
                      <td className="p-3 text-center text-xs text-primary font-medium">{goal.muito_acima}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/40 font-semibold">
                    <td className="p-3 text-foreground">TOTAL</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center bg-primary/20 text-primary font-bold rounded-full px-2.5 py-0.5 text-xs">
                        {filtered.reduce((s, g) => s + g.peso, 0)}%
                      </span>
                    </td>
                    <td colSpan={5}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
