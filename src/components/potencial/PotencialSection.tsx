import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, Brain, TrendingUp, Shield, RotateCcw, ArrowRight, CheckCircle2, User, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface PotencialItem {
  label: string;
  desc: string;
}

export interface PotencialTopic {
  number: number;
  title: string;
  category: 'AGILIDADE & COGNIÇÃO' | 'ESCALABILIDADE' | 'DRIVE & RESILIÊNCIA' | 'VISÃO ESTRATÉGICA' | 'LIDERANÇA & INFLUÊNCIA';
  badgeStyle: string;
  items: PotencialItem[];
}

export const POTENCIAL_TOPICS: PotencialTopic[] = [
  {
    number: 1,
    title: 'Agilidade de Aprendizado e Raciocínio Crítico',
    category: 'AGILIDADE & COGNIÇÃO',
    badgeStyle: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
    items: [
      {
        label: 'Velocidade de absorção e domínio de novas áreas',
        desc: 'Aprende novos processos, ferramentas e regras de negócio muito mais rápido que a média. Transita do zero à autonomia em tempo recorde.',
      },
      {
        label: 'Raciocínio por Primeiros Princípios e quebra de dogmas',
        desc: 'Questiona o "sempre foi feito assim". Desmonta problemas complexos até os fundamentos e reconstrói soluções mais simples e eficientes.',
      },
      {
        label: 'Capacidade de adaptação a mudanças bruscas',
        desc: 'Não resiste ao desconforto de novas diretrizes; adapta-se rapidamente quando o plano muda e encontra caminhos operacionais alternativos.',
      },
    ]
  },
  {
    number: 2,
    title: 'Elasticidade de Escopo e Capacidade de Escalar',
    category: 'ESCALABILIDADE',
    badgeStyle: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    items: [
      {
        label: 'Capacidade de absorver maior carga cognitiva e escopo',
        desc: 'Quando recebe projetos maiores ou demandas de maior complexidade, mantém alta precisão sem entrar em sobrecarga ou perder o controle.',
      },
      {
        label: 'Pensamento Sistêmico e Criação de Processos Escaláveis',
        desc: 'Não se limita a apagar incêndios individuais; constrói padrões, ferramentas e automações para garantir que o problema nunca mais ocorra.',
      },
      {
        label: 'Prontidão para o Próximo Nível (Atuação além do cargo)',
        desc: 'Já demonstra postura, maturidade decisória e visão correspondentes ao nível hierárquico acima do seu cargo atual.',
      },
    ]
  },
  {
    number: 3,
    title: 'Drive, Senso de Urgência e Resiliência',
    category: 'DRIVE & RESILIÊNCIA',
    badgeStyle: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    items: [
      {
        label: 'Bias for Action (Obsessão por Execução e Velocidade)',
        desc: 'Prefere agir e calibrar no caminho a ficar paralisado planejando. Elimina gargalos com autonomia sem depender de aprovações banais.',
      },
      {
        label: 'Resiliência sob Pressão Extrema e Ambiguidade',
        desc: 'Em momentos de crise, pressão ou falta de clareza, mantém a lucidez emocional, foca na solução e transmite estabilidade para a equipe.',
      },
      {
        label: 'Inconformismo Positivo e Autoexigência',
        desc: 'Nunca se acomoda na zona de conforto; busca constantemente metas mais agressivas e busca superar os próprios recordes operacionais.',
      },
    ]
  },
  {
    number: 4,
    title: 'Visão de Negócio e Raciocínio Estratégico',
    category: 'VISÃO ESTRATÉGICA',
    badgeStyle: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    items: [
      {
        label: 'Conexão entre a operação diária e o resultado financeiro',
        desc: 'Compreende exatamente como sua atuação e a de sua área afetam custos, margens, clientes e o crescimento sustentável da empresa.',
      },
      {
        label: 'Antecipação de Riscos e Pensamento de 2ª Ordem',
        desc: 'Consegue prever problemas operacionais, gargalos ou riscos de segurança semanas antes que aconteçam, agindo preventivamente.',
      },
      {
        label: 'Tomada de decisão pragmática baseada em dados',
        desc: 'Decide com base em números e fatos tangíveis, não em achismos ou conveniências pessoais, priorizando o que gera mais valor ao negócio.',
      },
    ]
  },
  {
    number: 5,
    title: 'Multiplicação de Pessoas e Liderança Emergente',
    category: 'LIDERANÇA & INFLUÊNCIA',
    badgeStyle: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    items: [
      {
        label: 'Liderança por Influência (Sem necessidade de crachá)',
        desc: 'Mobiliza colegas, engaja diferentes setores e destrava projetos pela sua credibilidade, clareza e autoridade técnica/moral.',
      },
      {
        label: 'Magnetismo de Talentos e Elevação da Barra',
        desc: 'As pessoas mais talentosas gostam de trabalhar junto com ele. Não tolera mediocridade e eleva o padrão de exigência do time ao seu redor.',
      },
      {
        label: 'Comunicação Radicalmente Clara e Construtiva',
        desc: 'Comunica ideias complexas com extrema síntese e clareza; não esconde problemas, fala a verdade de forma madura e propositiva.',
      },
    ]
  },
];

const STAGES = [
  { key: 'potencial_autoavaliacao', label: '1. Autoavaliação de Potencial', short: 'Auto', icon: User, description: 'Percepção do próprio colaborador sobre sua capacidade de aprendizado e crescimento futuro.' },
  { key: 'potencial_gestor', label: '2. Avaliação da Liderança', short: 'Líder', icon: UserCheck, description: 'Avaliação da liderança imediata sobre a elasticidade e teto de complexidade do colaborador.' },
  { key: 'potencial_calibracao', label: '3. Comitê de Calibração', short: 'Calibração', icon: Shield, description: 'Alinhamento colegiado entre diretoria e gestores para garantir régua padronizada.' },
  { key: 'potencial_validacao', label: '4. Validação Executiva (Consenso Final)', short: 'Consenso', icon: CheckCircle2, description: 'Nota definitiva validada que alimenta o eixo de Potencial do Nine Box.' },
];

const SCORE_COLUMNS = [
  { value: 1, label: 'Muito abaixo', short: '(1)' },
  { value: 2, label: 'Abaixo', short: '(2)' },
  { value: 3, label: 'Dentro do esperado', short: '(3)' },
  { value: 4, label: 'Acima do esperado', short: '(4)' },
  { value: 5, label: 'Muito acima (Top 5%)', short: '(5)' },
];

interface Props {
  employeeId: string;
  employeeName?: string;
  onCloseTab?: () => void;
  onUpdate?: () => void;
}

interface ScoreRecord {
  id: string;
  employee_id: string;
  criteria: string;
  stage: string;
  score: number | null;
  cycle_id: string | null;
}

export default function PotencialSection({ employeeId, employeeName = '', onCloseTab, onUpdate }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [cycles, setCycles] = useState<{ id: string; name: string }[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const [closing, setClosing] = useState(false);

  // Fetch cycles
  const fetchCycles = useCallback(async () => {
    const { data } = await supabase.from('evaluation_cycles').select('id, name').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setCycles(data);
      setSelectedCycleId(data[0].id);
    }
  }, []);

  const fetchScores = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);

    let query = supabase.from('fit_cultural').select('*').eq('employee_id', employeeId);
    if (selectedCycleId) {
      query = query.eq('cycle_id', selectedCycleId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching potencial scores:', error);
    } else {
      setScores((data as ScoreRecord[]) || []);
    }
    setLoading(false);
  }, [employeeId, selectedCycleId]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const getScore = (criteriaLabel: string, stageKey: string) => {
    const found = scores.find(s => s.criteria === criteriaLabel && s.stage === stageKey);
    return found?.score ?? null;
  };

  const setScore = async (criteriaLabel: string, stageKey: string, scoreVal: number) => {
    if (isClosed) return;

    // Optimistic UI update
    setScores(prev => {
      const existing = prev.find(s => s.criteria === criteriaLabel && s.stage === stageKey);
      if (existing) {
        return prev.map(s => (s.criteria === criteriaLabel && s.stage === stageKey ? { ...s, score: scoreVal } : s));
      }
      return [...prev, {
        id: Math.random().toString(36).substring(2, 9),
        employee_id: employeeId,
        criteria: criteriaLabel,
        stage: stageKey,
        score: scoreVal,
        cycle_id: selectedCycleId || null
      }];
    });

    try {
      const existing = scores.find(s => s.criteria === criteriaLabel && s.stage === stageKey);
      if (existing && existing.id && !existing.id.startsWith('mock_')) {
        await supabase.from('fit_cultural').update({ score: scoreVal, updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        const { data: inserted } = await supabase.from('fit_cultural').insert({
          employee_id: employeeId,
          criteria: criteriaLabel,
          stage: stageKey,
          score: scoreVal,
          cycle_id: selectedCycleId || null
        }).select().single();
        if (inserted) {
          setScores(prev => prev.map(s => (s.criteria === criteriaLabel && s.stage === stageKey ? inserted as ScoreRecord : s)));
        }
      }
    } catch (err) {
      console.error('Erro ao salvar nota de potencial:', err);
    }
  };

  const clearScore = async (criteriaLabel: string, stageKey: string) => {
    if (isClosed) return;
    const existing = scores.find(s => s.criteria === criteriaLabel && s.stage === stageKey);
    setScores(prev => prev.filter(s => !(s.criteria === criteriaLabel && s.stage === stageKey)));

    if (existing && existing.id && !existing.id.startsWith('mock_')) {
      await supabase.from('fit_cultural').delete().eq('id', existing.id);
    }
  };

  // Calculates stage average
  const getStageAvg = (stageKey: string) => {
    const stageScores = scores.filter(s => s.stage === stageKey && s.score != null);
    if (stageScores.length === 0) return '—';
    const sum = stageScores.reduce((a, b) => a + (b.score || 0), 0);
    return (sum / stageScores.length).toFixed(2);
  };

  // Overall Consensus / Best Stage Score
  const consensusAvg = useMemo(() => {
    const validacaoScores = scores.filter(s => s.stage === 'potencial_validacao' && s.score != null);
    if (validacaoScores.length > 0) {
      return (validacaoScores.reduce((a, b) => a + (b.score || 0), 0) / validacaoScores.length).toFixed(2);
    }
    const calibScores = scores.filter(s => s.stage === 'potencial_calibracao' && s.score != null);
    if (calibScores.length > 0) {
      return (calibScores.reduce((a, b) => a + (b.score || 0), 0) / calibScores.length).toFixed(2);
    }
    const gestorScores = scores.filter(s => s.stage === 'potencial_gestor' && s.score != null);
    if (gestorScores.length > 0) {
      return (gestorScores.reduce((a, b) => a + (b.score || 0), 0) / gestorScores.length).toFixed(2);
    }
    const autoScores = scores.filter(s => s.stage === 'potencial_autoavaliacao' && s.score != null);
    if (autoScores.length > 0) {
      return (autoScores.reduce((a, b) => a + (b.score || 0), 0) / autoScores.length).toFixed(2);
    }
    return '0.00';
  }, [scores]);

  const numConsensus = Number(consensusAvg);
  const potentialClassification = numConsensus >= 3.8 ? 'Alto' : numConsensus >= 2.8 ? 'Médio' : numConsensus > 0 ? 'Baixo' : 'Pendente';
  const potentialBadgeColor = potentialClassification === 'Alto'
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    : potentialClassification === 'Médio'
    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
    : potentialClassification === 'Baixo'
    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
    : 'bg-muted text-muted-foreground border-border';

  // Evolution chart data
  const chartData = useMemo(() => {
    return STAGES.map(s => {
      const avg = getStageAvg(s.key);
      return {
        etapa: s.short,
        nota: avg === '—' ? null : Number(avg),
      };
    });
  }, [scores]);

  // Sync with Nine Box
  const handleApplyToNineBox = async () => {
    if (potentialClassification === 'Pendente') {
      toast({ title: 'Atenção', description: 'Preencha a avaliação para calcular o potencial.', variant: 'destructive' });
      return;
    }
    try {
      await supabase.from('funcionarios').update({
        nine_box_potencial: potentialClassification
      }).eq('id', employeeId);

      toast({
        title: 'Potencial Atualizado no Nine Box!',
        description: `Classificação "${potentialClassification}" vinculada ao colaborador.`
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o perfil.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              Avaliação de Potencial
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
                Nine Box Vertical
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Mede velocidade de aprendizado, elasticidade de escopo, drive e prontidão para o futuro.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {cycles.length > 0 && (
            <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Ciclo" />
              </SelectTrigger>
              <SelectContent>
                {cycles.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {onCloseTab && (
            <Button variant="outline" size="sm" onClick={onCloseTab} className="text-xs h-9">
              Ir para o Nine Box <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards / Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score Consolidado */}
        <div className="glass-card rounded-2xl p-5 border border-border/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score de Potencial</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-foreground">{consensusAvg}</span>
              <span className="text-xs font-bold text-muted-foreground">/ 5.00</span>
            </div>
            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold border ${potentialBadgeColor}`}>
              Potencial {potentialClassification}
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-7 h-7" />
          </div>
        </div>

        {/* Sugestão Nine Box & Ação */}
        <div className="glass-card rounded-2xl p-5 border border-border/60 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Eixo Nine Box</p>
            <p className="text-xs text-muted-foreground mt-1">
              Classificação calculada para o eixo de Potencial:
            </p>
            <p className="text-sm font-bold text-foreground mt-1">
              {potentialClassification === 'Alto' ? '🚀 Alto (Sucessão / Hipercrescimento)' : potentialClassification === 'Médio' ? '📈 Médio (Cresce 1 nível em 1-2 anos)' : potentialClassification === 'Baixo' ? '⚓ Baixo (Especialista estável no cargo)' : 'Pendente de avaliação'}
            </p>
          </div>
          <Button onClick={handleApplyToNineBox} size="sm" className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Atualizar no Nine Box
          </Button>
        </div>

        {/* Gráfico de Evolução entre Etapas */}
        <div className="glass-card rounded-2xl p-4 border border-border/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Evolução por Etapa</p>
          <div className="h-[75px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="currentColor" className="opacity-10" vertical={false} />
                <XAxis dataKey="etapa" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis domain={[1, 5]} tickLine={false} axisLine={false} fontSize={10} ticks={[1, 3, 5]} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="nota" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Accordion de Etapas de Avaliação */}
      <Accordion type="single" collapsible defaultValue="potencial_gestor" className="w-full space-y-4">
        {STAGES.map((stage) => (
          <AccordionItem
            key={stage.key}
            value={stage.key}
            className="glass-card rounded-xl border border-border/60 overflow-hidden shadow-sm"
          >
            <AccordionTrigger className="p-4 hover:no-underline hover:bg-indigo-500/5 transition-colors">
              <div className="flex items-center justify-between w-full pr-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <stage.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{stage.label}</h4>
                    <p className="text-xs text-muted-foreground font-normal">{stage.description}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end shrink-0 pl-2">
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{getStageAvg(stage.key)}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Média</span>
                </div>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="p-4 border-t border-border space-y-6">
              {POTENCIAL_TOPICS.map((topic) => (
                <div key={topic.number} className="glass-card rounded-xl border border-border/60 overflow-hidden">
                  {/* Header do Tópico */}
                  <div className="p-3 border-b border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {topic.number}
                      </span>
                      <h4 className="font-bold text-foreground text-sm">
                        {topic.number}. {topic.title}
                      </h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${topic.badgeStyle}`}>
                      {topic.category}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="text-left p-3 font-semibold text-foreground min-w-[280px]">Critério / Comportamento Observável</th>
                          {SCORE_COLUMNS.map(col => (
                            <th key={col.value} className="p-2 text-center font-medium text-foreground min-w-[85px]">
                              <div className="text-xs font-semibold leading-tight">{col.label}</div>
                              <div className="text-[10px] text-muted-foreground">{col.short}</div>
                            </th>
                          ))}
                          <th className="p-2 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {topic.items.map((criteria, ci) => {
                          const currentScore = getScore(criteria.label, stage.key);
                          return (
                            <tr key={criteria.label} className={`border-b border-border/50 ${ci % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                              <td className="p-3">
                                <span className="font-bold text-foreground">{criteria.label}</span>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{criteria.desc}</p>
                              </td>
                              {SCORE_COLUMNS.map(col => (
                                <td key={col.value} className="p-2 text-center">
                                  <button
                                    onClick={() => setScore(criteria.label, stage.key, col.value)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all mx-auto flex items-center justify-center font-bold ${
                                      currentScore === col.value
                                        ? 'border-indigo-600 bg-indigo-600 text-white scale-110 shadow-md ring-2 ring-indigo-500/30'
                                        : 'border-muted-foreground/30 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-muted-foreground'
                                    }`}
                                    title={`${col.label} ${col.short}`}
                                  >
                                    <span className="text-xs">{col.value}</span>
                                  </button>
                                </td>
                              ))}
                              <td className="p-2 text-center">
                                {currentScore != null && (
                                  <button
                                    onClick={() => clearScore(criteria.label, stage.key)}
                                    className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                                    title="Limpar nota"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
