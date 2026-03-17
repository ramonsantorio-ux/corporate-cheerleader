import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Plus, Calendar, TrendingUp, List, ClipboardList } from 'lucide-react';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FastInput } from '@/components/ui/fast-input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Cell } from 'recharts';

// Lazy sub-pages
import Avaliacoes from './Avaliacoes';
import Competencias from './Competencias';
import Feedbacks from './Feedbacks';
import PDIPage from './PDI';

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
  const [period, setPeriod] = useState<PeriodRange>(getPortoPeriod(0));
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'ciclos';

  function handleTabChange(value: string) {
    setSearchParams({ tab: value }, { replace: true });
  }

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
    const cargos: Record<string, { cargo: string; total: number; realizados: number; noPrazo: number; pendentes: number }> = {};
    funcionarios.forEach(f => {
      if (!cargos[f.cargo]) cargos[f.cargo] = { cargo: f.cargo, total: 0, realizados: 0, noPrazo: 0, pendentes: 0 };
      cargos[f.cargo].total++;
      const empEvals = evaluations.filter(e => e.evaluated_name.toLowerCase() === f.nome.toLowerCase());
      if (empEvals.length === 0) { cargos[f.cargo].pendentes++; }
      else {
        const completed = empEvals.filter(e => e.status === 'completed');
        if (completed.length > 0) {
          cargos[f.cargo].realizados++;
          const latest = completed[completed.length - 1];
          const cycle = cycles.find(c => c.id === latest.cycle_id);
          if (cycle && latest.completed_at && new Date(latest.completed_at) <= new Date(cycle.end_date)) cargos[f.cargo].noPrazo++;
        } else { cargos[f.cargo].pendentes++; }
      }
    });
    return Object.values(cargos).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [funcionarios, evaluations, cycles]);

  const totalRealizados = cargoStats.reduce((a, c) => a + c.realizados, 0);
  const totalPendentes = cargoStats.reduce((a, c) => a + c.pendentes, 0);
  const totalNoPrazo = cargoStats.reduce((a, c) => a + c.noPrazo, 0);

  const statusColor: Record<string, string> = { active: 'bg-success/10 text-success', draft: 'bg-warning/10 text-warning', closed: 'bg-muted text-muted-foreground' };
  const statusLabel: Record<string, string> = { active: 'Ativo', draft: 'Rascunho', closed: 'Encerrado' };

  const tabs = [
    { value: 'ciclos', label: 'Ciclos', icon: Calendar },
    { value: 'metas', label: 'Gestão de Metas', icon: TrendingUp },
    { value: 'fit-cultural', label: 'Fit Cultural', icon: Target },
    { value: 'feedbacks', label: 'Feedbacks', icon: List },
    { value: 'pdi', label: 'PDI', icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Gestão de Pessoas</p>
          <h1 className="text-2xl font-bold text-foreground">Avaliações</h1>
        </div>
        {activeTab === 'ciclos' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo Ciclo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Ciclo de Avaliação</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Nome do Ciclo</Label><FastInput value={newCycle.name} onValueChange={v => setNewCycle({ ...newCycle, name: v })} placeholder="Ex: Avaliação Trimestral Q1 2026" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Início</Label><Input type="date" value={newCycle.start_date} onChange={e => setNewCycle({ ...newCycle, start_date: e.target.value })} /></div>
                  <div><Label>Fim</Label><Input type="date" value={newCycle.end_date} onChange={e => setNewCycle({ ...newCycle, end_date: e.target.value })} /></div>
                </div>
                <p className="text-xs text-muted-foreground">Tipos: Trimestral (2x ao semestre) e Anual</p>
                <Button onClick={createCycle} className="w-full">Criar Ciclo</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50 p-1 h-auto">
          {tabs.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap px-3 py-2">
              <t.icon className="w-4 h-4" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══ CICLOS ═══ */}
        <TabsContent value="ciclos" className="space-y-6 mt-4">
          <PeriodFilter value={period} onChange={setPeriod} />

          {/* KPIs */}
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

          {/* Cycles list */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="corporate-section">
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
        </TabsContent>

        {/* ═══ GESTÃO DE METAS ═══ */}
        <TabsContent value="metas" className="mt-4">
          <Avaliacoes />
        </TabsContent>

        {/* ═══ FIT CULTURAL ═══ */}
        <TabsContent value="fit-cultural" className="mt-4">
          <Competencias />
        </TabsContent>

        {/* ═══ FEEDBACKS ═══ */}
        <TabsContent value="feedbacks" className="mt-4">
          <Feedbacks />
        </TabsContent>

        {/* ═══ PDI ═══ */}
        <TabsContent value="pdi" className="mt-4">
          <PDIPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
