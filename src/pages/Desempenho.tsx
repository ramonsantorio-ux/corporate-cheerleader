import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Users, ClipboardList, Plus, Calendar, ChevronRight, TrendingUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

interface EvaluationCycle {
  id: string; name: string; start_date: string; end_date: string; status: string; created_at: string;
}

interface Funcionario {
  id: string; nome: string; cargo: string; departamento: string;
}

interface Evaluation {
  id: string; cycle_id: string; evaluated_name: string; status: string; completed_at: string | null;
}

export default function Desempenho() {
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCycle, setNewCycle] = useState({ name: '', start_date: '', end_date: '' });
  const [expandedCargo, setExpandedCargo] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      supabase.from('evaluation_cycles').select('*').order('created_at', { ascending: false }),
      supabase.from('funcionarios').select('id, nome, cargo, departamento'),
      supabase.from('evaluations').select('id, cycle_id, evaluated_name, status, completed_at'),
    ]).then(([cyclesRes, funcRes, evalRes]) => {
      if (cyclesRes.data) setCycles(cyclesRes.data as EvaluationCycle[]);
      if (funcRes.data) setFuncionarios(funcRes.data as Funcionario[]);
      if (evalRes.data) setEvaluations(evalRes.data as Evaluation[]);
      setLoading(false);
    });
  }, []);

  async function createCycle() {
    if (!newCycle.name || !newCycle.start_date || !newCycle.end_date) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' }); return;
    }
    const { error } = await supabase.from('evaluation_cycles').insert([{ name: newCycle.name, start_date: newCycle.start_date, end_date: newCycle.end_date }]);
    if (error) { toast({ title: 'Erro ao criar ciclo', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Ciclo criado com sucesso!' }); setNewCycle({ name: '', start_date: '', end_date: '' }); setDialogOpen(false);
      const { data } = await supabase.from('evaluation_cycles').select('*').order('created_at', { ascending: false });
      if (data) setCycles(data as EvaluationCycle[]);
    }
  }

  // Group employees by cargo for chart
  const cargoStats = useMemo(() => {
    const cargos: Record<string, { cargo: string; total: number; realizados: number; noPrazo: number; pendentes: number; pendenteNomes: string[] }> = {};
    funcionarios.forEach(f => {
      if (!cargos[f.cargo]) cargos[f.cargo] = { cargo: f.cargo, total: 0, realizados: 0, noPrazo: 0, pendentes: 0, pendenteNomes: [] };
      cargos[f.cargo].total++;

      // Check if this employee has evaluations
      const empEvals = evaluations.filter(e => e.evaluated_name.toLowerCase() === f.nome.toLowerCase());
      if (empEvals.length === 0) {
        cargos[f.cargo].pendentes++;
        cargos[f.cargo].pendenteNomes.push(f.nome);
      } else {
        const completed = empEvals.filter(e => e.status === 'completed');
        if (completed.length > 0) {
          cargos[f.cargo].realizados++;
          // Check if completed within cycle deadline
          const latestCompleted = completed[completed.length - 1];
          const cycle = cycles.find(c => c.id === latestCompleted.cycle_id);
          if (cycle && latestCompleted.completed_at && new Date(latestCompleted.completed_at) <= new Date(cycle.end_date)) {
            cargos[f.cargo].noPrazo++;
          }
        } else {
          cargos[f.cargo].pendentes++;
          cargos[f.cargo].pendenteNomes.push(f.nome);
        }
      }
    });
    return Object.values(cargos).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [funcionarios, evaluations, cycles]);

  const chartData = cargoStats.map(c => ({
    cargo: c.cargo.length > 15 ? c.cargo.slice(0, 13) + '…' : c.cargo,
    Realizados: c.realizados,
    'No Prazo': c.noPrazo,
    Pendentes: c.pendentes,
  }));

  const statusColor: Record<string, string> = { active: 'bg-green-100 text-green-700', draft: 'bg-yellow-100 text-yellow-700', closed: 'bg-muted text-muted-foreground' };
  const statusLabel: Record<string, string> = { active: 'Ativo', draft: 'Rascunho', closed: 'Encerrado' };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Desempenho</h1>
          <p className="text-muted-foreground text-sm mt-1">Avaliações trimestrais, semestrais e anuais</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Novo Ciclo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Ciclo de Avaliação</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Nome do Ciclo</Label><Input value={newCycle.name} onChange={e => setNewCycle({ ...newCycle, name: e.target.value })} placeholder="Ex: Avaliação Trimestral Q1 2026" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Início</Label><Input type="date" value={newCycle.start_date} onChange={e => setNewCycle({ ...newCycle, start_date: e.target.value })} /></div>
                <div><Label>Fim</Label><Input type="date" value={newCycle.end_date} onChange={e => setNewCycle({ ...newCycle, end_date: e.target.value })} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Tipos de avaliação: Trimestral (2x ao semestre) e Anual</p>
              <Button onClick={createCycle} className="w-full">Criar Ciclo</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Quick access cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, label: 'Gestão de Metas', desc: 'Metas individuais e por departamento', to: '/desempenho/avaliacoes' },
          { icon: Target, label: 'Fit Cultural', desc: 'Gerenciar competências e fit cultural', to: '/desempenho/competencias' },
          { icon: Users, label: 'PDI', desc: 'Planos de desenvolvimento', to: '/desempenho/pdi' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            onClick={() => navigate(item.to)} className="stat-card cursor-pointer group flex items-center gap-4 hover:border-primary/30">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><item.icon className="w-6 h-6 text-primary" /></div>
            <div className="flex-1"><h3 className="font-semibold text-foreground">{item.label}</h3><p className="text-sm text-muted-foreground">{item.desc}</p></div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.div>
        ))}
      </div>

      {/* Chart by cargo */}
      {cargoStats.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Avaliações por Cargo</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="cargo" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Realizados" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="No Prazo" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pendentes" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Pendentes por cargo */}
          <div className="mt-4 space-y-2">
            {cargoStats.filter(c => c.pendentes > 0).map(c => (
              <div key={c.cargo}>
                <button onClick={() => setExpandedCargo(expandedCargo === c.cargo ? null : c.cargo)} className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-muted/50">
                  <span className="text-sm font-medium">{c.cargo} — <span className="text-destructive">{c.pendentes} pendente(s)</span></span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedCargo === c.cargo ? 'rotate-180' : ''}`} />
                </button>
                {expandedCargo === c.cargo && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="ml-4 pl-3 border-l-2 border-destructive/20 space-y-1 py-1">
                    {c.pendenteNomes.map(nome => (
                      <p key={nome} className="text-sm text-muted-foreground">• {nome}</p>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cycles list */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><Calendar className="w-5 h-5" /> Ciclos de Avaliação</h2>
        {loading ? <div className="text-muted-foreground text-sm">Carregando...</div> : cycles.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground"><p>Nenhum ciclo criado ainda.</p></div>
        ) : (
          <div className="space-y-2">{cycles.map((cycle, i) => (
            <motion.div key={cycle.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div><h3 className="font-medium text-foreground">{cycle.name}</h3><p className="text-sm text-muted-foreground">{cycle.start_date} → {cycle.end_date}</p></div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[cycle.status] || ''}`}>{statusLabel[cycle.status] || cycle.status}</span>
            </motion.div>
          ))}</div>
        )}
      </div>
    </div>
  );
}
