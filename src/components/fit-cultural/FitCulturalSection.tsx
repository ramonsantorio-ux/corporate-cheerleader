import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, User, UserCheck, MessageSquare, Shield, RotateCcw, ArrowRight, Lock, Link2, Copy, CheckCircle2, AlertCircle, Unlock, Check, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

export interface CriterionItem {
  label: string;
  desc: string;
}

export interface CriteriaTopic {
  number: number;
  title: string;
  category: 'UNIVERSAL' | 'SEGURANÇA DO TRABALHO' | 'LIDERANÇA / SUPERVISÃO' | 'MEIO AMBIENTE / SUSTENTABILIDADE' | 'GESTÃO DA QUALIDADE';
  badgeStyle: string;
  items: CriterionItem[];
}

export const CRITERIA_TOPICS: CriteriaTopic[] = [
  {
    number: 1,
    title: 'Preocupação com a Empresa como um Todo',
    category: 'UNIVERSAL',
    badgeStyle: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    items: [
      {
        label: 'Demonstra senso de dono nas suas responsabilidades',
        desc: 'Age como se a empresa fosse sua, vai além do mínimo exigido',
      },
      {
        label: 'Demonstra preocupação com a performance de outras áreas e coopera com pares e colegas de equipe',
        desc: 'Ajuda outros setores sem ser solicitado quando necessário, entende o impacto do seu trabalho no resultado geral da empresa',
      },
      {
        label: 'Propõe soluções alinhadas com os propósitos da empresa',
        desc: 'Ao identificar o problema, avalia os investimentos e retornos da empresa e traz soluções. Não apenas aponta problemas, mas sugere melhorias',
      },
    ]
  },
  {
    number: 2,
    title: 'Postura Voltada ao Desenvolvimento da Equipe',
    category: 'UNIVERSAL',
    badgeStyle: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    items: [
      {
        label: 'Compartilha conhecimento com a equipe espontaneamente e realiza feedbacks construtivos aos colegas',
        desc: 'Repassa aprendizados, técnicas e boas práticas sem ser solicitado. Aponta pontos de melhoria de forma respeitosa e objetiva',
      },
      {
        label: 'Estimula o crescimento dos colegas e apoia novos colaboradores na integração',
        desc: 'Incentiva a participação, autonomia e desenvolvimento dos pares. Contribui no aprendizado da equipe',
      },
    ]
  },
  {
    number: 3,
    title: 'Ambiente de Trabalho Saudável e Inclusivo',
    category: 'UNIVERSAL',
    badgeStyle: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    items: [
      {
        label: 'Mantém comunicação respeitosa com todos e respeita as diferenças (gênero, etnia, cultura, religião)',
        desc: 'Usa linguagem adequada, tom respeitoso e ouve o outro. Não pratica e não compactua com discriminação de qualquer natureza',
      },
      {
        label: 'Pratica diálogo aberto e transparente',
        desc: 'Expõe opiniões com clareza, sem fofoca ou duplicidade',
      },
      {
        label: 'Resolve conflitos de forma construtiva',
        desc: 'Busca entendimento, não agrava situações de tensão',
      },
    ]
  },
  {
    number: 4,
    title: 'Uso Racional dos Recursos e Princípios Éticos',
    category: 'UNIVERSAL',
    badgeStyle: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    items: [
      {
        label: 'Cuida dos patrimônios e equipamentos da empresa, evitando desperdício de materiais e insumos',
        desc: 'Utiliza apenas o necessário e cuida dos recursos disponíveis. Zeloso com ferramentas, veículos, instalações e sistemas',
      },
      {
        label: 'Age com honestidade, ética e transparência',
        desc: 'Não omite informações relevantes, age de forma íntegra',
      },
      {
        label: 'Desenvolve ferramentas, campanhas, redução de custos e inovações para a empresa',
        desc: 'Propõe e implementa iniciativas que geram valor e otimização de recursos para a organização',
      },
    ]
  },
  {
    number: 5,
    title: 'Alinhamento com os 4 C\'s e Desenvolvimento Contínuo',
    category: 'UNIVERSAL',
    badgeStyle: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    items: [
      {
        label: 'Está disponível em caso de necessidade ou eventualidade da empresa',
        desc: 'Demonstra flexibilidade e comprometimento quando a empresa precisa',
      },
      {
        label: 'Entrega as demandas no prazo combinado',
        desc: 'Cumpre prazos e avisa quando há risco de não entregar',
      },
      {
        label: 'Assume responsabilidade pelos próprios erros',
        desc: 'Não terceiriza a culpa, assume falhas e busca corrigir e aprender',
      },
      {
        label: 'Busca capacitações e treinamentos voluntariamente',
        desc: 'Realiza cursos, seminários e especializações por iniciativa própria',
      },
      {
        label: 'Possui postura e respeito com os demais',
        desc: 'Alinhado com as diretrizes e cultura da empresa',
      },
    ]
  },
  {
    number: 6,
    title: 'Saúde, Segurança e Meio Ambiente',
    category: 'SEGURANÇA DO TRABALHO',
    badgeStyle: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    items: [
      {
        label: 'Usa corretamente os EPIs obrigatórios',
        desc: 'Utiliza os equipamentos de proteção sem precisar ser cobrado',
      },
      {
        label: 'Reporta condições e atos inseguros imediatamente',
        desc: 'Não ignora situações de risco, comunica ao responsável',
      },
      {
        label: 'Conhece e segue os procedimentos relacionados à SSMA',
        desc: 'Sabe como agir em casos de acidente, incêndio ou evacuação',
      },
      {
        label: 'Mantém a área de trabalho limpa e organizada (5S)',
        desc: 'Pratica a organização como hábito, não como obrigação pontual',
      },
      {
        label: 'Estimula e propõe práticas de segurança no dia a dia junto às equipes',
        desc: 'Lidera pelo exemplo, incentiva a segurança nos outros',
      },
      {
        label: 'Considera o impacto ambiental nas suas decisões e demonstra atitude proativa na preservação ambiental',
        desc: 'Vai além do exigido, sugere práticas sustentáveis. Avalia as consequências ambientais nas escolhas operacionais',
      },
    ]
  },
  {
    number: 7,
    title: 'Gestão de Pessoas',
    category: 'LIDERANÇA / SUPERVISÃO',
    badgeStyle: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    items: [
      {
        label: 'Planeja e distribui atividades de forma equilibrada, acompanhando a execução e oferecendo suporte à equipe',
        desc: 'Organiza a equipe com critérios justos e estratégicos. Está presente e acessível durante a operação',
      },
      {
        label: 'Gerencia conflitos na equipe de forma construtiva',
        desc: 'Media situações de tensão com equilíbrio e justiça',
      },
      {
        label: 'Desenvolve ativamente os colaboradores sob sua liderança',
        desc: 'Investe no crescimento técnico e comportamental da equipe',
      },
      {
        label: 'Toma decisões com base em dados e evidências',
        desc: 'Não decide por impulso; busca informações antes de agir',
      },
      {
        label: 'Reconhece e valoriza as boas práticas da equipe',
        desc: 'Celebra conquistas e dá crédito a quem merece',
      },
      {
        label: 'Mantém a equipe motivada mesmo em períodos de desafios',
        desc: 'Conduz a equipe com energia positiva em momentos críticos',
      },
    ]
  },
  {
    number: 8,
    title: 'Gestão da Qualidade',
    category: 'GESTÃO DA QUALIDADE',
    badgeStyle: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
    items: [
      {
        label: 'Participa ativamente das reuniões de ISO quando solicitado',
        desc: 'Engaja-se nas reuniões do sistema de gestão da qualidade, contribuindo com informações e sugestões',
      },
      {
        label: 'Cumpre com os prazos das entregas solicitadas',
        desc: 'Planeja e organiza suas atividades para atender aos prazos estabelecidos, comunicando antecipadamente eventuais riscos',
      },
      {
        label: 'Realiza as entregas com qualidade',
        desc: 'Executa suas tarefas com atenção, precisão e cuidado, garantindo que o resultado atenda aos padrões esperados',
      },
      {
        label: 'Respeita procedimentos e entende a importância da padronização',
        desc: 'Segue os procedimentos estabelecidos e reconhece que a padronização é fundamental para a consistência e melhoria contínua dos processos',
      },
    ]
  }
];

export const CRITERIA = CRITERIA_TOPICS.flatMap(t => t.items);

const STAGES = [
  { key: 'autoavaliacao', label: 'Auto Avaliação', icon: User, description: 'O funcionário avalia a si mesmo' },
  { key: 'gestor', label: 'Avaliação do Gestor', icon: UserCheck, description: 'O gestor avalia o funcionário' },
  { key: 'calibracao', label: 'Calibração', icon: MessageSquare, description: 'Avaliação com feedback' },
  { key: 'validacao', label: 'Validação', icon: Shield, description: 'Comitê define a nota final' },
];

const SCORE_COLUMNS = [
  { value: 1, label: 'Muito abaixo do esperado', short: 'Nota 1' },
  { value: 2, label: 'Abaixo do esperado', short: 'Nota 2' },
  { value: 3, label: 'Dentro do esperado', short: 'Nota 3' },
  { value: 4, label: 'Acima do esperado', short: 'Nota 4' },
  { value: 5, label: 'Muito acima do esperado', short: 'Nota 5' },
  { value: 0, label: 'Não Aplicável', short: 'N/A' },
];

interface Props {
  employeeId: string;
  employeeName: string;
  cycleId?: string;
  canViewValidation?: boolean;
  onCloseTab?: () => void;
}

export default function FitCulturalSection({ employeeId, employeeName, cycleId: initialCycleId, canViewValidation = true, onCloseTab }: Props) {
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

  const checkIfClosed = useCallback(async (cid: string) => {
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
  }, [employeeId]);

  const fetchData = useCallback(async () => {
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
  }, [employeeId]);

  useEffect(() => {
    fetchData();
  }, [employeeId, fetchData]);

  useEffect(() => {
    if (activeCycleId) {
      checkIfClosed(activeCycleId);
    }
  }, [activeCycleId, employeeId, checkIfClosed]);

  const currentCycleScores = useMemo(() => {
    return allScores.filter(s => s.cycle_id === activeCycleId);
  }, [allScores, activeCycleId]);

  // Status de conclusão e bloqueio por etapa
  const isGestorCompleted = useMemo(() => {
    return currentCycleScores.some(s => s.criteria === '__STAGE_COMPLETED__' && s.stage === 'gestor' && s.score === 1);
  }, [currentCycleScores]);

  const gestorCompletedAt = useMemo(() => {
    return currentCycleScores.find(s => s.criteria === '__STAGE_COMPLETED__' && s.stage === 'gestor' && s.score === 1)?.updated_at;
  }, [currentCycleScores]);

  const isCalibracaoCompleted = useMemo(() => {
    return currentCycleScores.some(s => s.criteria === '__STAGE_COMPLETED__' && s.stage === 'calibracao' && s.score === 1);
  }, [currentCycleScores]);

  const calibracaoCompletedAt = useMemo(() => {
    return currentCycleScores.find(s => s.criteria === '__STAGE_COMPLETED__' && s.stage === 'calibracao' && s.score === 1)?.updated_at;
  }, [currentCycleScores]);

  const totalCriteriaCount = CRITERIA.length;

  const answeredAutoCount = useMemo(() => {
    return CRITERIA.filter(c => getScore(c.label, 'autoavaliacao') !== null).length;
  }, [currentCycleScores]);

  const answeredGestorCount = useMemo(() => {
    return CRITERIA.filter(c => getScore(c.label, 'gestor') !== null).length;
  }, [currentCycleScores]);

  const answeredCalibracaoCount = useMemo(() => {
    return CRITERIA.filter(c => getScore(c.label, 'calibracao') !== null).length;
  }, [currentCycleScores]);

  const [submittingStage, setSubmittingStage] = useState<'gestor' | 'calibracao' | null>(null);
  const [confirmLockDialog, setConfirmLockDialog] = useState<{ open: boolean; stage: 'gestor' | 'calibracao' | null }>({
    open: false,
    stage: null,
  });
  const [reopenDialog, setReopenDialog] = useState<{ open: boolean; stage: 'gestor' | 'calibracao' | null }>({
    open: false,
    stage: null,
  });

  const canReopen = isAdmin || permissions['colaboradores']?.can_edit;

  function isStageEditable(stageKey: string): boolean {
    if (isClosed) return false;
    if (stageKey === 'autoavaliacao') return false;
    if (stageKey === 'gestor') return !isGestorCompleted;
    if (stageKey === 'calibracao') return isGestorCompleted && !isCalibracaoCompleted;
    if (stageKey === 'validacao') return isCalibracaoCompleted;
    return false;
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  async function handleLockStage(stage: 'gestor' | 'calibracao') {
    if (!activeCycleId) {
      toast({ title: 'Selecione um ciclo primeiro', variant: 'destructive' });
      return;
    }
    setSubmittingStage(stage);

    const existing = currentCycleScores.find(s => s.criteria === '__STAGE_COMPLETED__' && s.stage === stage);
    let error;
    if (existing) {
      const res = await supabase
        .from('fit_cultural')
        .update({ score: 1, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      error = res.error;
    } else {
      const res = await supabase
        .from('fit_cultural')
        .insert([{
          employee_id: employeeId,
          cycle_id: activeCycleId,
          stage: stage,
          criteria: '__STAGE_COMPLETED__',
          score: 1,
        }]);
      error = res.error;
    }

    setSubmittingStage(null);
    setConfirmLockDialog({ open: false, stage: null });

    if (error) {
      toast({ title: 'Erro ao bloquear etapa', description: error.message, variant: 'destructive' });
      return;
    }

    toast({
      title: stage === 'gestor' ? 'Avaliação do Gestor lançada e bloqueada!' : 'Calibração finalizada e bloqueada!',
      description: stage === 'gestor'
        ? 'As notas foram salvas com segurança. A etapa de Calibração foi liberada.'
        : 'As notas calibradas foram consolidadas e a Validação Final foi liberada.'
    });
    await fetchData();
  }

  async function handleReopenStage(stage: 'gestor' | 'calibracao') {
    if (!activeCycleId) return;
    setSubmittingStage(stage);

    const existing = currentCycleScores.find(s => s.criteria === '__STAGE_COMPLETED__' && s.stage === stage);
    if (existing) {
      const { error } = await supabase
        .from('fit_cultural')
        .delete()
        .eq('id', existing.id);

      if (error) {
        toast({ title: 'Erro ao reabrir etapa', description: error.message, variant: 'destructive' });
        setSubmittingStage(null);
        return;
      }
    }

    setSubmittingStage(null);
    setReopenDialog({ open: false, stage: null });
    toast({
      title: stage === 'gestor' ? 'Avaliação do Gestor reaberta' : 'Calibração reaberta',
      description: 'A etapa agora pode ser editada novamente pelo responsável.'
    });
    await fetchData();
  }

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

    // Se a mesma nota ou N/A for clicado novamente, desmarca o item
    if (existing && existing.score === score) {
      await clearScore(criteria, stage);
      return;
    }

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

    toast({ title: score === 0 ? 'Marcado como N/A (Desconsiderado da média)' : 'Nota salva!' });
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

  // Média de um tópico específico em uma etapa (retorna number | null)
  // Filtra APENAS notas válidas > 0, re-normalizando itens marcados como N/A (score = 0)
  function getTopicAvgNum(topic: CriteriaTopic, stage: string): number | null {
    const labels = topic.items.map(i => i.label);
    const validScores = currentCycleScores.filter(
      s => s.stage === stage && s.score != null && s.score > 0 && labels.includes(s.criteria)
    );
    if (validScores.length === 0) return null;
    return validScores.reduce((sum, s) => sum + (s.score ?? 0), 0) / validScores.length;
  }

  // Média por tópico formatada para exibir no header
  function getTopicAvg(topic: CriteriaTopic, stage: string): string {
    const avg = getTopicAvgNum(topic, stage);
    return avg !== null ? avg.toFixed(1) : '—';
  }

  // Média geral da etapa = média das médias dos tópicos (peso igual para cada tópico)
  // Somente tópicos com pelo menos 1 nota respondida entram no cálculo
  function getStageAvg(stage: string): string {
    const topicAvgs = CRITERIA_TOPICS
      .map(topic => getTopicAvgNum(topic, stage))
      .filter((avg): avg is number => avg !== null);

    if (topicAvgs.length === 0) return '—';
    const stageAvg = topicAvgs.reduce((sum, avg) => sum + avg, 0) / topicAvgs.length;
    return stageAvg.toFixed(1);
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
        const cycleScores = allScores.filter(s => s.cycle_id === cycle.id && s.criteria !== '__STAGE_COMPLETED__' && s.score != null && s.score > 0);
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
         if (score.score == null || score.score <= 0 || !score.cycle_id || score.criteria === '__STAGE_COMPLETED__') return;
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

  if (loading) return <p className="text-sm text-muted-foreground">Carregando FIT Cultural...</p>;

  function copyAutoAvaliacaoLink() {
    if (!activeCycleId) {
      toast({ title: 'Selecione um ciclo primeiro', variant: 'destructive' });
      return;
    }
    const link = `${window.location.origin}/autoavaliacao-fit-cultural?uid=${employeeId}&cycle=${activeCycleId}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link de Autoavaliação Copiado!', description: 'Envie este link direto para o colaborador no WhatsApp.' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" /> FIT Cultural — {employeeName}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Avaliação de competências comportamentais em 4 etapas</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={copyAutoAvaliacaoLink}
            className="bg-white hover:bg-primary/5 text-primary border-primary/30 shadow-2xs text-xs font-semibold flex items-center gap-1.5"
            title="Copiar link individual para o colaborador responder no celular"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Copiar Link de Autoavaliação</span>
          </Button>

          <div className="w-full sm:w-56">
            <Select value={activeCycleId} onValueChange={setActiveCycleId}>
              <SelectTrigger className="w-full bg-white border-border/50">
                <SelectValue placeholder="Selecione o período..." />
              </SelectTrigger>
              <SelectContent>
                {cycles.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          {STAGES.map((stage, si) => {
            if (stage.key === 'validacao' && !canViewValidation) {
              return (
                <AccordionItem key={stage.key} value={stage.key} className="glass-card rounded-xl border-none overflow-hidden opacity-95">
                  <div className="p-4 flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                          4. Validação
                        </h4>
                        <p className="text-xs text-muted-foreground font-normal">A nota final de Validação é acessível exclusivamente ao seu Gestor Imediato e Comitê de Avaliação.</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5 shrink-0">
                      <Lock className="w-3.5 h-3.5" /> Restrito ao Gestor
                    </span>
                  </div>
                </AccordionItem>
              );
            }

            const isEditable = isStageEditable(stage.key);

            return (
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
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-foreground text-sm">{stage.label}</h4>
                        {/* Status Badges no Cabeçalho */}
                        {stage.key === 'autoavaliacao' && (
                          answeredAutoCount > 0 ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-2 flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Respondida ({answeredAutoCount}/{totalCriteriaCount})
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] py-0 px-2 font-medium">
                              Pendente de Resposta
                            </Badge>
                          )
                        )}
                        {stage.key === 'gestor' && (
                          isGestorCompleted ? (
                            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] py-0 px-2 flex items-center gap-1 font-medium">
                              <Lock className="w-3 h-3" /> Lançada & Bloqueada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[10px] py-0 px-2 font-medium">
                              Em Andamento ({answeredGestorCount}/{totalCriteriaCount})
                            </Badge>
                          )
                        )}
                        {stage.key === 'calibracao' && (
                          isCalibracaoCompleted ? (
                            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] py-0 px-2 flex items-center gap-1 font-medium">
                              <Lock className="w-3 h-3" /> Calibração Bloqueada
                            </Badge>
                          ) : !isGestorCompleted ? (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px] py-0 px-2 flex items-center gap-1 font-medium">
                              <Lock className="w-3 h-3" /> Aguardando Gestor
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] py-0 px-2 font-medium">
                              Em Calibração ({answeredCalibracaoCount}/{totalCriteriaCount})
                            </Badge>
                          )
                        )}
                        {stage.key === 'validacao' && (
                          isClosed ? (
                            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] py-0 px-2 flex items-center gap-1 font-medium">
                              <Shield className="w-3 h-3" /> Validada & Encerrada
                            </Badge>
                          ) : !isCalibracaoCompleted ? (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px] py-0 px-2 flex items-center gap-1 font-medium">
                              <Lock className="w-3 h-3" /> Aguardando Calibração
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] py-0 px-2 font-medium">
                              Liberada para Validação
                            </Badge>
                          )
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">{stage.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-lg font-bold text-primary">{getStageAvg(stage.key)}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Média</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 border-t border-border space-y-6">
                {/* Banners Informativos e de Controle por Etapa */}
                {stage.key === 'gestor' && (
                  isGestorCompleted ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-sm">Avaliação do Gestor Lançada e Bloqueada</h5>
                          <p className="text-xs text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                            Lançada {gestorCompletedAt ? `em ${formatDate(gestorCompletedAt)}` : ''}. As notas foram travadas e a etapa de Calibração foi liberada.
                          </p>
                        </div>
                      </div>
                      {canReopen && !isClosed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReopenDialog({ open: true, stage: 'gestor' })}
                          className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/20 text-xs shrink-0"
                          title="Permite que administradores reabram a avaliação para ajustes"
                        >
                          <Unlock className="w-3.5 h-3.5 mr-1.5" /> Reabrir Avaliação
                        </Button>
                      )}
                    </div>
                  ) : !isClosed ? (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <p className="text-xs text-blue-900 dark:text-blue-200">
                          Atribua as notas de 1 a 5 (ou N/A) para cada critério. Ao terminar, clique em <strong>Lançar e Bloquear Avaliação do Gestor</strong> abaixo para travar as notas e liberar a Calibração.
                        </p>
                      </div>
                      <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 shrink-0">
                        {answeredGestorCount} de {totalCriteriaCount} avaliados
                      </div>
                    </div>
                  ) : null
                )}

                {stage.key === 'calibracao' && (
                  !isGestorCompleted ? (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 p-4 rounded-xl flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm">Etapa Bloqueada — Aguardando Avaliação do Gestor</h5>
                        <p className="text-xs text-amber-700/80 dark:text-amber-400 mt-0.5">
                          A Calibração só pode ser preenchida após o Gestor Imediato concluir e lançar a avaliação dele.
                        </p>
                      </div>
                    </div>
                  ) : isCalibracaoCompleted ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-sm">Calibração Concluída e Bloqueada</h5>
                          <p className="text-xs text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                            Finalizada {calibracaoCompletedAt ? `em ${formatDate(calibracaoCompletedAt)}` : ''}. As notas alinhadas foram travadas e a Validação Final está liberada.
                          </p>
                        </div>
                      </div>
                      {canReopen && !isClosed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReopenDialog({ open: true, stage: 'calibracao' })}
                          className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/20 text-xs shrink-0"
                        >
                          <Unlock className="w-3.5 h-3.5 mr-1.5" /> Reabrir Calibração
                        </Button>
                      )}
                    </div>
                  ) : !isClosed ? (
                    <div className="bg-purple-500/10 border border-purple-500/20 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <p className="text-xs text-purple-900 dark:text-purple-200">
                          Realize o alinhamento de notas com feedback. Ao finalizar, clique em <strong>Finalizar e Bloquear Calibração</strong> abaixo para liberar a Validação Final.
                        </p>
                      </div>
                      <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 shrink-0">
                        {answeredCalibracaoCount} de {totalCriteriaCount} calibrados
                      </div>
                    </div>
                  ) : null
                )}

                {stage.key === 'validacao' && !isCalibracaoCompleted && !isClosed && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 p-4 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm">Etapa Bloqueada — Aguardando Conclusão da Calibração</h5>
                      <p className="text-xs text-amber-700/80 dark:text-amber-400 mt-0.5">
                        A Validação Final do Comitê só poderá ser lançada e encerrada após a etapa de Calibração ser finalizada e bloqueada.
                      </p>
                    </div>
                  </div>
                )}

                {CRITERIA_TOPICS.map((topic) => (
                  <div key={topic.number} className="glass-card rounded-xl border border-border/60 overflow-hidden">
                    {/* Header do Tópico */}
                    <div className="p-3 border-b border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">
                          {topic.number}
                        </span>
                        <h4 className="font-bold text-foreground text-sm">
                          {topic.number}. {topic.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Média do tópico */}
                        {(() => {
                          const avg = getTopicAvg(topic, stage.key);
                          return avg !== '—' ? (
                            <div className="flex flex-col items-center bg-primary/10 border border-primary/20 rounded-lg px-3 py-1">
                              <span className="text-sm font-bold text-primary leading-none">{avg}</span>
                              <span className="text-[9px] text-primary/70 font-medium mt-0.5">média</span>
                            </div>
                          ) : null;
                        })()}
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${topic.badgeStyle}`}>
                          {topic.category}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/20">
                            <th className="text-left p-3 font-semibold text-foreground min-w-[280px]">Critério / Comportamento Observável</th>
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
                          {topic.items.map((criteria, ci) => {
                            const currentScore = getScore(criteria.label, stage.key);
                            return (
                              <tr key={criteria.label} className={`border-b border-border/50 ${ci % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                                <td className="p-3">
                                  <span className="font-medium text-foreground">{criteria.label}</span>
                                  <p className="text-xs text-muted-foreground mt-0.5">{criteria.desc}</p>
                                </td>
                                {SCORE_COLUMNS.map(col => {
                                  const isNA = col.value === 0;
                                  const isSelected = currentScore === col.value;
                                  return (
                                    <td key={col.value} className="p-2 text-center">
                                      <button
                                        disabled={!isEditable}
                                        onClick={() => setScore(criteria.label, stage.key, col.value)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all mx-auto flex items-center justify-center ${
                                          isSelected
                                            ? isNA 
                                              ? 'border-amber-500 bg-amber-600 text-white scale-110 shadow-md font-bold'
                                              : 'border-primary bg-primary text-primary-foreground scale-110 shadow-md'
                                            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/10'
                                        } ${!isEditable ? 'opacity-70 cursor-not-allowed hover:bg-transparent hover:border-muted-foreground/30' : ''}`}
                                        title={!isEditable ? (isClosed ? 'Avaliação encerrada' : 'Etapa bloqueada para edição') : (isNA ? 'Não Aplicável (Desconsidera da Média)' : `${col.label} ${col.short}`)}
                                      >
                                        {isSelected && (
                                          <span className="text-[10px] font-bold">{isNA ? 'N/A' : col.value}</span>
                                        )}
                                      </button>
                                    </td>
                                  );
                                })}
                                <td className="p-2 text-center">
                                  {currentScore != null && isEditable && (
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
                  </div>
                ))}

                {/* Barra de Ação para Lançar/Bloquear Etapa do Gestor */}
                {stage.key === 'gestor' && !isGestorCompleted && !isClosed && (
                  <div className="p-4 bg-muted/40 border border-primary/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 shadow-xs">
                    <div>
                      <h5 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" /> Finalizar e Travar Avaliação do Gestor
                      </h5>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Critérios preenchidos: <strong className="text-foreground">{answeredGestorCount}</strong> de {totalCriteriaCount}.
                        {answeredGestorCount < totalCriteriaCount && (
                          <span className="text-amber-600 dark:text-amber-400 ml-1 font-medium">
                            (Restam {totalCriteriaCount - answeredGestorCount} critérios sem nota)
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      onClick={() => setConfirmLockDialog({ open: true, stage: 'gestor' })}
                      disabled={answeredGestorCount === 0 || submittingStage === 'gestor'}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold shadow-sm w-full sm:w-auto"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Lançar e Bloquear Avaliação do Gestor
                    </Button>
                  </div>
                )}

                {/* Barra de Ação para Lançar/Bloquear Etapa de Calibração */}
                {stage.key === 'calibracao' && isGestorCompleted && !isCalibracaoCompleted && !isClosed && (
                  <div className="p-4 bg-muted/40 border border-purple-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 shadow-xs">
                    <div>
                      <h5 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Lock className="w-4 h-4 text-purple-600" /> Finalizar e Travar Calibração
                      </h5>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Critérios calibrados: <strong className="text-foreground">{answeredCalibracaoCount}</strong> de {totalCriteriaCount}.
                        {answeredCalibracaoCount < totalCriteriaCount && (
                          <span className="text-amber-600 dark:text-amber-400 ml-1 font-medium">
                            (Restam {totalCriteriaCount - answeredCalibracaoCount} critérios)
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      onClick={() => setConfirmLockDialog({ open: true, stage: 'calibracao' })}
                      disabled={answeredCalibracaoCount === 0 || submittingStage === 'calibracao'}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold shadow-sm w-full sm:w-auto"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Finalizar e Bloquear Calibração
                    </Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
            );
          })}
        </Accordion>

        {/* Modal de Confirmação de Lançamento / Bloqueio */}
        <AlertDialog open={confirmLockDialog.open} onOpenChange={(open) => !open && setConfirmLockDialog({ open: false, stage: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                {confirmLockDialog.stage === 'gestor'
                  ? 'Confirmar Lançamento da Avaliação do Gestor'
                  : 'Confirmar Conclusão da Calibração'}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 pt-2 text-left">
                {confirmLockDialog.stage === 'gestor' ? (
                  <>
                    <p>
                      Tem certeza que deseja lançar e travar a Avaliação do Gestor de <strong>{employeeName}</strong>?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Após o lançamento, você <strong>não poderá mais alterar as notas</strong> atribuídas. Essa ação garante a integridade dos dados e liberará a etapa de <strong>Calibração</strong> para o alinhamento com feedback.
                    </p>
                    {answeredGestorCount < totalCriteriaCount && (
                      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 p-3 rounded-lg text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Atenção: ainda existem {totalCriteriaCount - answeredGestorCount} critérios sem nota atribuída.</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p>
                      Tem certeza que deseja finalizar a Calibração de <strong>{employeeName}</strong>?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      As notas alinhadas com feedback serão consolidadas e bloqueadas. Essa ação liberará a etapa de <strong>Validação Final</strong> pelo comitê.
                    </p>
                    {answeredCalibracaoCount < totalCriteriaCount && (
                      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 p-3 rounded-lg text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Atenção: ainda existem {totalCriteriaCount - answeredCalibracaoCount} critérios sem nota calibrada.</span>
                      </div>
                    )}
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submittingStage !== null}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (confirmLockDialog.stage) {
                    handleLockStage(confirmLockDialog.stage);
                  }
                }}
                disabled={submittingStage !== null}
                className={confirmLockDialog.stage === 'calibracao' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}
              >
                {submittingStage ? 'Gravando...' : 'Confirmar e Bloquear'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Confirmação para Reabrir Etapa (Admin) */}
        <AlertDialog open={reopenDialog.open} onOpenChange={(open) => !open && setReopenDialog({ open: false, stage: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Unlock className="w-5 h-5 text-amber-600" />
                Reabrir Etapa para Edição
              </AlertDialogTitle>
              <AlertDialogDescription className="pt-2 text-left space-y-2">
                <p>
                  Tem certeza que deseja reabrir a {reopenDialog.stage === 'gestor' ? 'Avaliação do Gestor' : 'Calibração'} de <strong>{employeeName}</strong>?
                </p>
                <p className="text-xs text-muted-foreground">
                  Os campos serão destravados para permitir novas alterações nas notas.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submittingStage !== null}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (reopenDialog.stage) {
                    handleReopenStage(reopenDialog.stage);
                  }
                }}
                disabled={submittingStage !== null}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {submittingStage ? 'Reabrindo...' : 'Reabrir para Edição'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
