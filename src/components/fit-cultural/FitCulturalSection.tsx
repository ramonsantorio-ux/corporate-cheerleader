import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, User, UserCheck, MessageSquare, Shield, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface FitScore {
  id: string;
  employee_id: string;
  criteria: string;
  stage: string;
  score: number | null;
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
    label: 'Atua de forma alinhada com os 3 C\'s da empresa',
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
}

export default function FitCulturalSection({ employeeId, employeeName }: Props) {
  const [scores, setScores] = useState<FitScore[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchScores();
  }, [employeeId]);

  async function fetchScores() {
    const { data } = await supabase
      .from('fit_cultural')
      .select('*')
      .eq('employee_id', employeeId);
    if (data) setScores(data as unknown as FitScore[]);
    setLoading(false);
  }

  function getScore(criteria: string, stage: string): number | null {
    const found = scores.find(s => s.criteria === criteria && s.stage === stage);
    return found?.score ?? null;
  }

  async function setScore(criteria: string, stage: string, score: number) {
    const existing = scores.find(s => s.criteria === criteria && s.stage === stage);

    if (existing) {
      await supabase
        .from('fit_cultural')
        .update({ score, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('fit_cultural')
        .insert([{ employee_id: employeeId, criteria, stage, score }]);
    }

    toast({ title: 'Nota salva!' });
    fetchScores();
  }

  async function clearScore(criteria: string, stage: string) {
    const existing = scores.find(s => s.criteria === criteria && s.stage === stage);
    if (!existing) return;

    await supabase
      .from('fit_cultural')
      .delete()
      .eq('id', existing.id);

    toast({ title: 'Nota removida!' });
    fetchScores();
  }

  function getStageAvg(stage: string): string {
    const stageScores = scores.filter(s => s.stage === stage && s.score != null);
    if (stageScores.length === 0) return '—';
    const avg = stageScores.reduce((sum, s) => sum + (s.score ?? 0), 0) / stageScores.length;
    return avg.toFixed(1);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando FIT Cultural...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" /> FIT Cultural — {employeeName}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Avaliação de competências comportamentais em 4 etapas</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {STAGES.map((stage, si) => (
          <motion.div
            key={stage.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.08 }}
            className="glass-card rounded-xl overflow-hidden"
          >
            <div className="p-4 border-b border-border bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <stage.icon className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{stage.label}</h4>
                  <p className="text-xs text-muted-foreground">{stage.description}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-primary">{getStageAvg(stage.key)}</span>
                <p className="text-[10px] text-muted-foreground">Média</p>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {CRITERIA.map(criteria => {
                const currentScore = getScore(criteria.label, stage.key);
                return (
                  <div key={criteria.label} className="space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{criteria.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{criteria.desc}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setScore(criteria.label, stage.key, n)}
                            className="transition-all"
                            title={`Nota ${n}`}
                          >
                            <Star
                              className={`w-5 h-5 transition-colors ${
                                currentScore != null && n <= currentScore
                                  ? 'text-primary fill-primary'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          </button>
                        ))}
                        {currentScore != null && (
                          <button
                            onClick={() => clearScore(criteria.label, stage.key)}
                            className="ml-1 p-0.5 rounded hover:bg-muted transition-colors"
                            title="Limpar nota"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
