import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, User, UserCheck, MessageSquare, Shield, RotateCcw, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FitScore {
  id: string;
  employee_id: string;
  criteria: string;
  stage: string;
  score: number | null;
  cycle_id: string | null;
  created_at: string;
  updated_at: string;
}

const CRITERIA = [
  {
    label: 'Preocupação com a empresa como um todo',
    desc: 'Pratico senso de dono, se preocupa com a performance de outros setores, coopera com seus pares e colegas de equipe',
  },
  {
    label: 'Postura voltada ao desenvolvimento da equipe',
    desc: 'Estimula o crescimento da equipe, realiza feedbacks',
  },
  {
    label: 'Proporciona um ambiente de trabalho saudável',
    desc: 'Pratica um diálogo aberto, transparente e respeitador',
  },
  {
    label: 'Proporciona um ambiente de trabalho inclusivo',
    desc: 'Sem discriminação de qualquer natureza',
  },
  {
    label: 'Possui atitudes/práticas alinhadas as questões voltadas a saúde, segurança e meio ambiente',
    desc: 'Demonstra no dia a dia a preocupação com temos voltados a saúde, segurança e meio ambiente',
  },
  {
    label: 'Utiliza de forma racional os recursos da empresa',
    desc: 'Tem preocupação com desperdícios de qualquer que seja a natureza',
  },
  {
    label: 'Atua com princípios éticos',
    desc: 'Não compactua com corrupção, uso indevido de recursos da empresa, apropriação indevida de qualquer natureza',
  },
  {
    label: 'Atua de forma alinhada com os 4 C\'s da empresa',
    desc: 'Disciplina com horário, com as demandas, com os valores, com os compromissos assumidos',
  },
  {
    label: 'Desenvolvimento pessoal/profissional',
    desc: 'Realiza cursos, seminários e especializações pessoais/profissionais',
  },
  {
    label: 'Busca do desenvolvimento do negócio de forma sustentável',
    desc: 'Atitudes voltadas ao bem estar geral incluindo a comunidade, parceiros e sociedade em geral',
  },
];

const STAGES = [
  { key: 'autoavaliacao', label: 'Auto Avaliação', icon: User, description: 'O funcionário avalia a si mesmo' },
  { key: 'gestor', label: 'Avaliação do Gestor', icon: UserCheck, description: 'O gestor avalia o funcionário' },
  { key: 'calibracao', label: 'Calibração', icon: MessageSquare, description: 'Avaliação com feedback' },
  { key: 'validacao', label: 'Validação', icon: Shield, description: 'Comitê define a nota final' },
];

interface Props {
  employeeId: string;
  employeeName: string;
  cycleId?: string;
  onCloseTab?: () => void;
}

export default function FitCulturalSection({ employeeId, employeeName, cycleId: initialCycleId, onCloseTab }: Props) {
  const { isAdmin, permissions, user } = useAuth();
  
  // States
  type Cycle = { id: string; name: string };
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [activeCycleId, setActiveCycleId] = useState<string>(initialCycleId || '');
  const [allScores, setAllScores] = useState<FitScore[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'semestral' | 'anual'>('semestral');
  
  const [isClosed, setIsClosed] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  useEffect(() => {
    if (activeCycleId) {
      checkIfClosed(activeCycleId);
    }
  }, [activeCycleId, employeeId]);

  async function checkIfClosed(cid: string) {
    if (!cid) {
      setIsClosed(false);
      return;
    }
    const { data } = await supabase
      .from('fit_cultural_closures')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('cycle_id', cid)
      .maybeSingle();
    setIsClosed(!!data);
  }

  async function fetchData() {
    // Busca ciclos
    const { data: cData } = await supabase.from('evaluation_cycles').select('*').order('start_date', { ascending: true });
    if (cData) {
      setCycles(cData);
      if (!activeCycleId) {
        const active = cData.find(c => c.is_active) || cData[cData.length - 1];
        if (active) setActiveCycleId(active.id);
      }
    }

    // Busca todas as notas deste funcionario
    const { data: sData } = await supabase
      .from('fit_cultural')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
      
    if (sData) setAllScores(sData as unknown as FitScore[]);
    setLoading(false);
  }

  const currentCycleScores = useMemo(() => {
    return allScores.filter(s => s.cycle_id === activeCycleId);
  }, [allScores, activeCycleId]);

  function getScore(criteria: string, stage: string): number | null {
    const found = currentCycleScores.find(s => s.criteria === criteria && s.stage === stage);
    return found?.score ?? null;
  }

  async function setScore(criteria: string, stage: string, score: number) {
    if (!activeCycleId) {
      toast({ title: 'Selecione um ciclo primeiro', variant: 'destructive' });
      return;
    }
    const existing = currentCycleScores.find(s => s.criteria === criteria && s.stage === stage);

    let result;
    if (existing) {
      result = await supabase
        .from('fit_cultural')
        .update({ score, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      result = await supabase
        .from('fit_cultural')
        .insert([{ employee_id: employeeId, criteria, stage, score, cycle_id: activeCycleId }]);
    }

    if (result.error) {
      console.error('Erro ao salvar nota de fit cultural:', result.error);
      toast({ title: 'Erro ao salvar', description: result.error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Nota salva!' });
    fetchData();
  }

  async function clearScore(criteria: string, stage: string) {
    const existing = currentCycleScores.find(s => s.criteria === criteria && s.stage === stage);
    if (!existing) return;

    const result = await supabase
      .from('fit_cultural')
      .delete()
      .eq('id', existing.id);

    if (result.error) {
      console.error('Erro ao remover nota de fit cultural:', result.error);
      toast({ title: 'Erro ao remover', description: result.error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Nota removida!' });
    fetchData();
  }

  function getStageAvg(stage: string): string {
    const stageScores = currentCycleScores.filter(s => s.stage === stage && s.score != null);
    if (stageScores.length === 0) return '—';
    const avg = stageScores.reduce((sum, s) => sum + (s.score ?? 0), 0) / stageScores.length;
    return avg.toFixed(1);
  }

  async function handleClose() {
    if (!activeCycleId || !user) return;
    setClosing(true);
    const { error } = await supabase
      .from('fit_cultural_closures')
      .insert([{ employee_id: employeeId, cycle_id: activeCycleId, closed_by: user.id }]);
    
    if (error) {
      toast({ title: 'Erro ao encerrar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Avaliação encerrada com sucesso!' });
      setIsClosed(true);
      if (onCloseTab) {
        onCloseTab();
      }
    }
    setClosing(false);
  }

  const canClose = isAdmin || permissions['colaboradores']?.can_edit;

  const chartData = useMemo(() => {
    if (cycles.length === 0 || allScores.length === 0) return [];
    
    if (chartPeriod === 'semestral') {
      return cycles.map(cycle => {
        const cycleScores = allScores.filter(s => s.cycle_id === cycle.id && s.score != null);
        let avg = 0;
        if (cycleScores.length > 0) {
           avg = cycleScores.reduce((sum, s) => sum + (s.score || 0), 0) / cycleScores.length;
        }
        return {
          name: cycle.name,
          media: Number(avg.toFixed(1))
        };
      }).filter(d => d.media > 0); // show only cycles that have scores
    } else {
      // Anual grouping
      const scoresByYear: Record<string, number[]> = {};
      
      allScores.forEach(score => {
         if (score.score == null || !score.cycle_id) return;
         const cycle = cycles.find(c => c.id === score.cycle_id);
         if (!cycle || !cycle.start_date) return;
         const year = new Date(cycle.start_date).getFullYear().toString();
         if (!scoresByYear[year]) scoresByYear[year] = [];
         scoresByYear[year].push(score.score);
      });

      return Object.keys(scoresByYear).sort().map(year => {
        const yearScores = scoresByYear[year];
        const avg = yearScores.reduce((sum, val) => sum + val, 0) / yearScores.length;
        return {
          name: year,
          media: Number(avg.toFixed(1))
        };
      });
    }
  }, [cycles, allScores, chartPeriod]);

  const SCORE_COLUMNS = [
    { value: 1, label: 'Muito abaixo', short: '(1)' },
    { value: 2, label: 'Abaixo', short: '(2)' },
    { value: 3, label: 'Dentro do esperado', short: '(3)' },
    { value: 4, label: 'Acima do esperado', short: '(4)' },
    { value: 5, label: 'Muito acima do esperado', short: '(5)' },
  ];

  if (loading) return <p className="text-sm text-muted-foreground">Carregando FIT Cultural...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" /> FIT Cultural — {employeeName}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Avaliação de competências comportamentais em 4 etapas</p>
        </div>
        
        <div className="w-full md:w-64">
          <Select value={activeCycleId} onValueChange={setActiveCycleId}>
            <SelectTrigger className="w-full bg-white border-border/50">
              <SelectValue placeholder="Selecione o período..." />
            </SelectTrigger>
            <SelectContent>
              {cycles.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {c.is_active ? '(Atual)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="glass-card p-4 rounded-xl border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-foreground">Evolução Histórica do Fit Cultural</h4>
            <div className="flex bg-muted/30 p-1 rounded-lg">
              <button 
                onClick={() => setChartPeriod('semestral')}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${chartPeriod === 'semestral' ? 'bg-white shadow-sm text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Por Ciclo
              </button>
              <button 
                onClick={() => setChartPeriod('anual')}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${chartPeriod === 'anual' ? 'bg-white shadow-sm text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Anual
              </button>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="media" name="Média Geral" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: '#2563eb' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {isClosed && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 shrink-0" />
              <p className="font-semibold text-sm">Esta avaliação foi encerrada e não pode mais ser alterada.</p>
            </div>
            
            {(() => {
              const currentCycleIndex = cycles.findIndex(c => c.id === activeCycleId);
              const nextCycle = currentCycleIndex !== -1 && currentCycleIndex < cycles.length - 1 ? cycles[currentCycleIndex + 1] : null;
              if (!nextCycle) return null;
              return (
                <Button 
                  variant="outline" 
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-700 shrink-0 w-full sm:w-auto"
                  onClick={() => setActiveCycleId(nextCycle.id)}
                >
                  Avaliar {nextCycle.name} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              );
            })()}
          </div>
        )}

        <Accordion type="single" collapsible className="w-full space-y-4">
          {STAGES.map((stage, si) => (
            <AccordionItem
              key={stage.key}
              value={stage.key}
              className="glass-card rounded-xl border-none overflow-hidden"
            >
              <AccordionTrigger className="p-4 hover:no-underline hover:bg-primary/5 transition-colors">
                <div className="flex items-center justify-between w-full pr-4 text-left">
                  <div className="flex items-center gap-3">
                    <stage.icon className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{stage.label}</h4>
                      <p className="text-xs text-muted-foreground font-normal">{stage.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-lg font-bold text-primary">{getStageAvg(stage.key)}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Média</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0 border-t border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-3 font-semibold text-foreground min-w-[280px]">Critério</th>
                        {SCORE_COLUMNS.map(col => (
                          <th key={col.value} className="p-2 text-center font-medium text-foreground min-w-[90px]">
                            <div className="text-xs leading-tight">{col.label}</div>
                            <div className="text-[10px] text-muted-foreground">{col.short}</div>
                          </th>
                        ))}
                        <th className="p-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {CRITERIA.map((criteria, ci) => {
                        const currentScore = getScore(criteria.label, stage.key);
                        return (
                          <tr key={criteria.label} className={`border-b border-border/50 ${ci % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                            <td className="p-3">
                              <span className="font-medium text-foreground">{criteria.label}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">{criteria.desc}</p>
                            </td>
                            {SCORE_COLUMNS.map(col => (
                              <td key={col.value} className="p-2 text-center">
                                <button
                                  disabled={stage.key === 'autoavaliacao' || isClosed}
                                  onClick={() => setScore(criteria.label, stage.key, col.value)}
                                  className={`w-8 h-8 rounded-full border-2 transition-all mx-auto flex items-center justify-center ${
                                    currentScore === col.value
                                      ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-md'
                                      : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/10'
                                  } ${stage.key === 'autoavaliacao' || isClosed ? 'opacity-70 cursor-not-allowed hover:bg-transparent hover:border-muted-foreground/30' : ''}`}
                                  title={`${col.label} ${col.short}`}
                                >
                                  {currentScore === col.value && (
                                    <span className="text-xs font-bold">{col.value}</span>
                                  )}
                                </button>
                              </td>
                            ))}
                            <td className="p-2 text-center">
                              {currentScore != null && stage.key !== 'autoavaliacao' && !isClosed && (
                                <button
                                  onClick={() => clearScore(criteria.label, stage.key)}
                                  className="p-1 rounded hover:bg-muted transition-colors"
                                  title="Limpar nota"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {canClose && !isClosed && activeCycleId && (
          <div className="mt-6 flex justify-end">
            <Button
              variant="destructive"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleClose}
              disabled={closing}
            >
              <Shield className="w-4 h-4 mr-2" />
              {closing ? 'Encerrando...' : 'Encerrar Fit Cultural (Bloquear)'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
