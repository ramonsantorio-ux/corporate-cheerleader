import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Users, ClipboardList, Plus, Calendar, ChevronRight, TrendingUp, ChevronDown, ArrowUpRight } from 'lucide-react';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Cell } from 'recharts';

interface EvaluationCycle {
  id: string; name: string; start_date: string; end_date: string; status: string; created_at: string;
}

interface Funcionario {
  id: string; nome: string; cargo: string; departamento: string;
}

interface Evaluation {
  id: string; cycle_id: string; evaluated_name: string; status: string; completed_at: string | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Desempenho() {
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCycle, setNewCycle] = useState({ name: '', start_date: '', end_date: '' });
  const [expandedCargo, setExpandedCargo] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodRange>(getPortoPeriod(0));
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

  const cargoStats = useMemo(() => {
    const cargos: Record<string, { cargo: string; total: number; realizados: number; noPrazo: number; pendentes: number; pendenteNomes: string[] }> = {};
    funcionarios.forEach(f => {
      if (!cargos[f.cargo]) cargos[f.cargo] = { cargo: f.cargo, total: 0, realizados: 0, noPrazo: 0, pendentes: 0, pendenteNomes: [] };
      cargos[f.cargo].total++;
      const empEvals = evaluations.filter(e => e.evaluated_name.toLowerCase() === f.nome.toLowerCase());
      if (empEvals.length === 0) {
        cargos[f.cargo].pendentes++;
        cargos[f.cargo].pendenteNomes.push(f.nome);
      } else {
        const completed = empEvals.filter(e => e.status === 'completed');
        if (completed.length > 0) {
          cargos[f.cargo].realizados++;
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
    cargo: c.cargo.length > 18 ? c.cargo.slice(0, 16) + '…' : c.cargo,
    Realizados: c.realizados,
    'No Prazo': c.noPrazo,
    Pendentes: c.pendentes,
  }));

  const totalRealizados = cargoStats.reduce((a, c) => a + c.realizados, 0);
  const totalPendentes = cargoStats.reduce((a, c) => a + c.pendentes, 0);
  const totalNoPrazo = cargoStats.reduce((a, c) => a + c.noPrazo, 0);

  const statusColor: Record<string, string> = { active: 'bg-success/10 text-success', draft: 'bg-warning/10 text-warning', closed: 'bg-muted text-muted-foreground' };
  const statusLabel: Record<string, string> = { active: 'Ativo', draft: 'Rascunho', closed: 'Encerrado' };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Gestão de Pessoas</p>
          <h1 className="text-2xl font-bold text-foreground">Desempenho</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo Ciclo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Ciclo de Avaliação</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Nome do Ciclo</Label><Input value={newCycle.name} onChange={e => setNewCycle({ ...newCycle, name: e.target.value })} placeholder="Ex: Avaliação Trimestral Q1 2026" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Início</Label><Input type="date" value={newCycle.start_date} onChange={e => setNewCycle({ ...newCycle, start_date: e.target.value })} /></div>
                <div><Label>Fim</Label><Input type="date" value={newCycle.end_date} onChange={e => setNewCycle({ ...newCycle, end_date: e.target.value })} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Tipos: Trimestral (2x ao semestre) e Anual</p>
              <Button onClick={createCycle} className="w-full">Criar Ciclo</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <PeriodFilter value={period} onChange={setPeriod} />

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="corporate-kpi corporate-kpi-accent">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Realizados</p>
          <p className="text-3xl font-bold text-foreground mt-1">{totalRealizados}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="corporate-kpi">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">No Prazo</p>
          <p className="text-3xl font-bold text-foreground mt-1">{totalNoPrazo}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="corporate-kpi corporate-kpi-danger">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pendentes</p>
          <p className="text-3xl font-bold text-foreground mt-1">{totalPendentes}</p>
        </motion.div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, label: 'Gestão de Metas', desc: 'Metas individuais e por departamento', to: '/desempenho/avaliacoes' },
          { icon: Target, label: 'Fit Cultural', desc: 'Competências e fit cultural', to: '/desempenho/competencias' },
          { icon: Users, label: 'PDI', desc: 'Planos de desenvolvimento', to: '/desempenho/pdi' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            onClick={() => navigate(item.to)}
            className="bg-card border border-border rounded-lg p-4 cursor-pointer group hover:shadow-md transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground">{item.label}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </motion.div>
        ))}
      </div>



      {/* Cycles */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="corporate-section">
        <div className="corporate-section-header">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Ciclos de Avaliação</h2>
          </div>
          <span className="text-xs text-muted-foreground">{cycles.length} ciclos</span>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-6 text-muted-foreground text-sm">Carregando...</div>
          ) : cycles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Nenhum ciclo criado.</div>
          ) : (
            cycles.map((cycle, i) => (
              <motion.div key={cycle.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="px-6 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                <div>
                  <h3 className="font-medium text-sm text-foreground">{cycle.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(cycle.start_date).toLocaleDateString('pt-BR')} → {new Date(cycle.end_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className={`corporate-badge ${statusColor[cycle.status] || 'bg-muted text-muted-foreground'}`}>
                  {statusLabel[cycle.status] || cycle.status}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
