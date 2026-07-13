import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ExpandableChart } from '@/components/ui/ExpandableChart';
import { Target, Users, Plus, Calendar, TrendingUp, List, ClipboardList, Brain, Activity, AlertTriangle, Trash2 } from 'lucide-react';
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

import Competencias from './Competencias';
import Feedbacks from './Feedbacks';
import PDIPage from './PDI';
import Sucessao from './Sucessao';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

interface EvaluationCycle {
  id: string; name: string; start_date: string; end_date: string; status: string; created_at: string;
}

interface Funcionario {
  id: string; nome: string; cargo: string; departamento: string;
  nine_box_desempenho?: string; nine_box_potencial?: string;
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
  const [newCycle, setNewCycle] = useState<{name: string, start_date: string, end_date: string, eligible_roles: string[]}>({ name: '', start_date: '', end_date: '', eligible_roles: [] });
  const [period, setPeriod] = useState<PeriodRange>(getPortoPeriod(0));
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const uniqueRoles = useMemo(() => {
    const roles = funcionarios.map(f => f.cargo?.trim()).filter(Boolean);
    return Array.from(new Set(roles)).sort();
  }, [funcionarios]);

  const activeTab = searchParams.get('tab') || 'visao-geral';

  function handleTabChange(value: string) {
    setSearchParams({ tab: value }, { replace: true });
  }

  useEffect(() => {
    Promise.all([
      supabase.from('evaluation_cycles').select('*').order('created_at', { ascending: false }),
      supabase.from('funcionarios').select('id, nome, cargo, departamento, nine_box_desempenho, nine_box_potencial'),
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
    const { error } = await supabase.from('evaluation_cycles').insert([{ 
      name: newCycle.name, 
      start_date: newCycle.start_date, 
      end_date: newCycle.end_date,
      eligible_roles: newCycle.eligible_roles
    }]);
    if (error) { toast({ title: 'Erro ao criar ciclo', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Ciclo criado com sucesso!' }); setNewCycle({ name: '', start_date: '', end_date: '', eligible_roles: [] }); setDialogOpen(false);
      const { data } = await supabase.from('evaluation_cycles').select('*').order('created_at', { ascending: false });
      if (data) setCycles(data as EvaluationCycle[]);
    }
  }

  async function deleteCycle(cycleId: string) {
    if (!confirm('Tem certeza que deseja excluir este ciclo? Todas as avaliações de Fit Cultural, Succession 9Box e PDIs vinculadas a ele serão apagadas permanentemente.')) return;
    
    await supabase.from('fit_cultural').delete().eq('stage', cycleId);
    await supabase.from('nine_box_historico').delete().eq('cycle', cycleId);
    await supabase.from('evaluations').delete().eq('cycle_id', cycleId);
    await supabase.from('pdis').delete().eq('cycle_id', cycleId);

    const { error } = await supabase.from('evaluation_cycles').delete().eq('id', cycleId);
    
    if (error) {
      toast({ title: 'Erro ao excluir ciclo', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ciclo excluído com sucesso!' });
      const { data } = await supabase.from('evaluation_cycles').select('*').order('created_at', { ascending: false });
      if (data) setCycles(data as EvaluationCycle[]);
    }
  }

  const cargoStats = useMemo(() => {
    const cargos: Record<string, { cargo: string; total: number; realizados: number; noPrazo: number; pendentes: number }> = {};
    funcionarios.forEach(f => {
      const cargoName = f.cargo || 'Sem Cargo';
      if (!cargos[cargoName]) cargos[cargoName] = { cargo: cargoName, total: 0, realizados: 0, noPrazo: 0, pendentes: 0 };
      cargos[cargoName].total++;
      
      const funcName = (f.nome || '').toLowerCase();
      const empEvals = evaluations.filter(e => (e.evaluated_name || '').toLowerCase() === funcName);
      
      if (empEvals.length === 0) { cargos[cargoName].pendentes++; }
      else {
        const completed = empEvals.filter(e => e.status === 'completed');
        if (completed.length > 0) {
          cargos[cargoName].realizados++;
          const latest = completed[completed.length - 1];
          const cycle = cycles.find(c => c.id === latest.cycle_id);
          if (cycle && latest.completed_at && new Date(latest.completed_at) <= new Date(cycle.end_date)) cargos[cargoName].noPrazo++;
        } else { cargos[cargoName].pendentes++; }
      }
    });
    return Object.values(cargos).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [funcionarios, evaluations, cycles]);

  const talentosRisco = funcionarios.filter(t => t.nine_box_desempenho === 'Baixo' && t.nine_box_potencial === 'Baixo');
  const topTalentos = funcionarios.filter(t => t.nine_box_desempenho === 'Alto' && t.nine_box_potencial === 'Alto');

  const totalRealizados = cargoStats.reduce((a, c) => a + c.realizados, 0);
  const totalPendentes = cargoStats.reduce((a, c) => a + c.pendentes, 0);
  const totalNoPrazo = cargoStats.reduce((a, c) => a + c.noPrazo, 0);

  const statusColor: Record<string, string> = { active: 'bg-success/10 text-success', draft: 'bg-warning/10 text-warning', closed: 'bg-muted text-muted-foreground' };
  const statusLabel: Record<string, string> = { active: 'Ativo', draft: 'Rascunho', closed: 'Encerrado' };

  const tabs = [
    { value: 'visao-geral', label: 'Visão da Equipe', icon: Activity },
    { value: 'ciclos', label: 'Ciclos & Avaliações', icon: Calendar },
    { value: 'feedbacks', label: 'Feedback Contínuo', icon: List },
    { value: 'fit-cultural', label: 'Fit Cultural', icon: Target },
    { value: 'pdi', label: 'PDI', icon: ClipboardList },
    { value: 'sucessao', label: 'Sucessão & 9Box', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Liderança & Gestão</p>
          <h1 className="text-2xl font-bold text-foreground">Painel do Gestor</h1>
        </div>

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

        {/* ═══ VISÃO GERAL ═══ */}
        <TabsContent value="visao-geral" className="space-y-6 mt-4">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Visão da Equipe</h1>
              <p className="text-muted-foreground text-sm mt-1">Panorama geral de talentos, sucessão e riscos do seu time</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" /> Total da Equipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{funcionarios.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Colaboradores ativos sob sua gestão</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Risco de Turnover
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{talentosRisco.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Classificados como Enigma/Risco (9-Box)</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" /> Top Talents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{topTalentos.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Prontos para promoção</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Colaboradores em Foco (Risco)</CardTitle>
                <CardDescription>Membros da equipe que precisam de acompanhamento próximo.</CardDescription>
              </CardHeader>
              <CardContent>
                {talentosRisco.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">Nenhum colaborador em área de risco no 9-Box.</div>
                ) : (
                  <div className="space-y-4">
                    {talentosRisco.map(t => (
                      <div key={t.id} className="flex justify-between items-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        <div>
                          <p className="font-semibold text-sm">{t.nome}</p>
                          <p className="text-xs text-muted-foreground">{t.cargo}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-background border px-2 py-1 rounded-md text-red-600 font-medium">Baixo Desempenho</span>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 hover:bg-red-50 text-red-600" onClick={() => { setSearchParams({ tab: 'pdi' }); }}>
                            <Plus className="w-3 h-3 mr-1" /> Criar PDI
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Destaques (Prontos para Sucessão)</CardTitle>
                <CardDescription>Membros com alto desempenho e alto potencial.</CardDescription>
              </CardHeader>
              <CardContent>
                {topTalentos.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">Ainda sem avaliações de Top Talent.</div>
                ) : (
                  <div className="space-y-4">
                    {topTalentos.map(t => (
                      <div key={t.id} className="flex justify-between items-center bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                        <div>
                          <p className="font-semibold text-sm">{t.nome}</p>
                          <p className="text-xs text-muted-foreground">{t.cargo}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-background border px-2 py-1 rounded-md text-green-600 font-medium">Promoção/Sucessão</span>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-green-200 hover:bg-green-50 text-green-600" onClick={() => { setSearchParams({ tab: 'pdi' }); }}>
                            <Plus className="w-3 h-3 mr-1" /> Criar PDI
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ CICLOS ═══ */}
        <TabsContent value="ciclos" className="space-y-6 mt-4">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ciclos de Avaliação</h1>
              <p className="text-muted-foreground text-sm mt-1">Gerenciamento de períodos de avaliação</p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"><Plus className="w-4 h-4 mr-2" />Novo Ciclo</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Criar Ciclo de Avaliação</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div><Label>Nome do Ciclo</Label><FastInput value={newCycle.name} onValueChange={v => setNewCycle({ ...newCycle, name: v })} placeholder="Ex: Avaliação Trimestral Q1 2026" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Início</Label><Input type="date" value={newCycle.start_date} onChange={e => setNewCycle({ ...newCycle, start_date: e.target.value })} /></div>
                      <div><Label>Fim</Label><Input type="date" value={newCycle.end_date} onChange={e => setNewCycle({ ...newCycle, end_date: e.target.value })} /></div>
                    </div>
                    <div>
                      <Label className="mb-3 block">Cargos Elegíveis para 9-Box</Label>
                      <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-1">
                        {uniqueRoles.length > 0 ? uniqueRoles.map(role => {
                          const isSelected = newCycle.eligible_roles.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => {
                                setNewCycle(prev => ({
                                  ...prev,
                                  eligible_roles: isSelected
                                    ? prev.eligible_roles.filter(r => r !== role)
                                    : [...prev.eligible_roles, role]
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                isSelected 
                                  ? 'bg-primary text-primary-foreground border-primary' 
                                  : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                              }`}
                            >
                              {role}
                            </button>
                          );
                        }) : (
                          <p className="text-xs text-muted-foreground">Nenhum cargo encontrado na base de colaboradores.</p>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">Clique nos cargos para selecionar quais participarão do 9-Box neste ciclo.</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Tipos: Trimestral (2x ao semestre) e Anual</p>
                    <Button onClick={createCycle} className="w-full">Criar Ciclo</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
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
                        {cycle.start_date ? new Date(cycle.start_date).toLocaleDateString('pt-BR') : 'N/A'} → {cycle.end_date ? new Date(cycle.end_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`corporate-badge ${statusColor[cycle.status] || 'bg-muted text-muted-foreground'}`}>
                        {statusLabel[cycle.status] || cycle.status}
                      </span>
                      <button 
                        onClick={() => deleteCycle(cycle.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Excluir Ciclo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* ═══ FIT CULTURAL ═══ */}
        <TabsContent value="fit-cultural" className="mt-4">
          <Competencias />
        </TabsContent>

        {/* ═══ FEEDBACKS ═══ */}
        <TabsContent value="feedbacks" className="mt-4">
          <Feedbacks />
        </TabsContent>

        {/* ═══ SUCESSAO ═══ */}
        <TabsContent value="sucessao" className="mt-4">
          <Sucessao />
        </TabsContent>

        {/* ═══ PDI ═══ */}
        <TabsContent value="pdi" className="mt-4">
          <PDIPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
