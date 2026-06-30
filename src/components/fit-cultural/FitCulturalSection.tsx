import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, User, UserCheck, MessageSquare, Shield, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';

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
}

export default function FitCulturalSection({ employeeId, employeeName, cycleId }: Props) {
  const { isAdmin, permissions, user } = useAuth();
  const [scores, setScores] = useState<FitScore[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchScores();
    checkIfClosed();
  }, [employeeId, cycleId]);

  async function checkIfClosed() {
    if (!cycleId) {
      setIsClosed(false);
      return;
    }
    const { data } = await supabase
      .from('fit_cultural_closures')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('cycle_id', cycleId)
      .maybeSingle();
    setIsClosed(!!data);
  }

  async function fetchScores() {
    let query = supabase
      .from('fit_cultural')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
      
    if (cycleId) {
      query = query.eq('cycle_id', cycleId);
    }

    const { data } = await query;
    if (data) setScores(data as unknown as FitScore[]);
    setLoading(false);
  }

  function getScore(criteria: string, stage: string): number | null {
    const found = scores.find(s => s.criteria === criteria && s.stage === stage);
    return found?.score ?? null;
  }

  async function setScore(criteria: string, stage: string, score: number) {
    const existing = scores.find(s => s.criteria === criteria && s.stage === stage);

    let result;
    if (existing) {
      result = await supabase
        .from('fit_cultural')
        .update({ score, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      result = await supabase
        .from('fit_cultural')
        .insert([{ employee_id: employeeId, criteria, stage, score, cycle_id: cycleId || null }]);
    }

    if (result.error) {
      console.error('Erro ao salvar nota de fit cultural:', result.error);
      toast({ title: 'Erro ao salvar', description: result.error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Nota salva!' });
    fetchScores();
  }

  async function clearScore(criteria: string, stage: string) {
    const existing = scores.find(s => s.criteria === criteria && s.stage === stage);
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
    fetchScores();
  }

  function getStageAvg(stage: string): string {
    const stageScores = scores.filter(s => s.stage === stage && s.score != null);
    if (stageScores.length === 0) return '—';
    const avg = stageScores.reduce((sum, s) => sum + (s.score ?? 0), 0) / stageScores.length;
    return avg.toFixed(1);
  }

  async function handleClose() {
    if (!cycleId || !user) return;
    setClosing(true);
    const { error } = await supabase
      .from('fit_cultural_closures')
      .insert([{ employee_id: employeeId, cycle_id: cycleId, closed_by: user.id }]);
    
    if (error) {
      toast({ title: 'Erro ao encerrar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Avaliação encerrada com sucesso!' });
      setIsClosed(true);
    }
    setClosing(false);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando FIT Cultural...</p>;

  const canClose = isAdmin || permissions['colaboradores']?.can_edit;

  const SCORE_COLUMNS = [
    { value: 1, label: 'Muito abaixo', short: '(1)' },
    { value: 2, label: 'Abaixo', short: '(2)' },
    { value: 3, label: 'Dentro do esperado', short: '(3)' },
    { value: 4, label: 'Acima do esperado', short: '(4)' },
    { value: 5, label: 'Muito acima do esperado', short: '(5)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" /> FIT Cultural — {employeeName}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Avaliação de competências comportamentais em 4 etapas</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isClosed && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 p-4 rounded-xl flex items-center justify-center gap-2">
            <Shield className="w-5 h-5" />
            <p className="font-semibold text-sm">Esta avaliação foi encerrada e não pode mais ser alterada.</p>
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

        {canClose && !isClosed && cycleId && (
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
