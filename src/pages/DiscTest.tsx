import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle2, ArrowLeft, Send, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import loginBg from '@/assets/login-bg.jpg';

// Helper para embaralhar os blocos e as palavras (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// 28 Grupos de Adjetivos Cleaver / Ipsativo
const rawBlocks = [
  { id: 1, words: [{ l: 'C', w: 'Exato' }, { l: 'D', w: 'Competitivo' }, { l: 'S', w: 'Calmo' }, { l: 'I', w: 'Otimista' }] },
  { id: 2, words: [{ l: 'D', w: 'Decidido' }, { l: 'C', w: 'Lógico' }, { l: 'I', w: 'Sociável' }, { l: 'S', w: 'Amável' }] },
  { id: 3, words: [{ l: 'I', w: 'Extrovertido' }, { l: 'D', w: 'Audacioso' }, { l: 'C', w: 'Preciso' }, { l: 'S', w: 'Leal' }] },
  { id: 4, words: [{ l: 'S', w: 'Paciente' }, { l: 'I', w: 'Persuasivo' }, { l: 'D', w: 'Agressivo' }, { l: 'C', w: 'Cauteloso' }] },
  { id: 5, words: [{ l: 'C', w: 'Cuidadoso' }, { l: 'D', w: 'Pioneiro' }, { l: 'I', w: 'Animado' }, { l: 'S', w: 'Cooperativo' }] },
  { id: 6, words: [{ l: 'D', w: 'Poderoso' }, { l: 'S', w: 'Tolerante' }, { l: 'C', w: 'Convencional' }, { l: 'I', w: 'Inspirador' }] },
  { id: 7, words: [{ l: 'I', w: 'Entusiasmado' }, { l: 'C', w: 'Sistemático' }, { l: 'D', w: 'Direto' }, { l: 'S', w: 'Tranquilo' }] },
  { id: 8, words: [{ l: 'C', w: 'Analítico' }, { l: 'S', w: 'Compreensivo' }, { l: 'I', w: 'Expressivo' }, { l: 'D', w: 'Desafiador' }] },
  { id: 9, words: [{ l: 'S', w: 'Passivo' }, { l: 'D', w: 'Conquistador' }, { l: 'I', w: 'Alegre' }, { l: 'C', w: 'Perfeccionista' }] },
  { id: 10, words: [{ l: 'D', w: 'Firme' }, { l: 'C', w: 'Meticuloso' }, { l: 'I', w: 'Comunicativo' }, { l: 'S', w: 'Mediador' }] },
  { id: 11, words: [{ l: 'C', w: 'Rigoroso' }, { l: 'I', w: 'Simpático' }, { l: 'S', w: 'Estável' }, { l: 'D', w: 'Autoritário' }] },
  { id: 12, words: [{ l: 'I', w: 'Carismático' }, { l: 'D', w: 'Prático' }, { l: 'C', w: 'Exigente' }, { l: 'S', w: 'Sincero' }] },
  { id: 13, words: [{ l: 'D', w: 'Valente' }, { l: 'S', w: 'Suave' }, { l: 'I', w: 'Charmoso' }, { l: 'C', w: 'Disciplinado' }] },
  { id: 14, words: [{ l: 'S', w: 'Acolhedor' }, { l: 'C', w: 'Investigador' }, { l: 'D', w: 'Enérgico' }, { l: 'I', w: 'Influente' }] },
  { id: 15, words: [{ l: 'C', w: 'Diplomático' }, { l: 'I', w: 'Bem-humorado' }, { l: 'D', w: 'Destemido' }, { l: 'S', w: 'Harmonioso' }] },
  { id: 16, words: [{ l: 'I', w: 'Sociável' }, { l: 'C', w: 'Ponderado' }, { l: 'S', w: 'Sustentador' }, { l: 'D', w: 'Impetuoso' }] },
  { id: 17, words: [{ l: 'D', w: 'Líder nato' }, { l: 'S', w: 'Equilibrado' }, { l: 'C', w: 'Detalhe-orientado' }, { l: 'I', w: 'Extrovertido' }] },
  { id: 18, words: [{ l: 'S', w: 'Consistente' }, { l: 'D', w: 'Resoluto' }, { l: 'I', w: 'Convincente' }, { l: 'C', w: 'Metódico' }] },
  { id: 19, words: [{ l: 'C', w: 'Introspectivo' }, { l: 'I', w: 'Verbal' }, { l: 'D', w: 'Impaciente' }, { l: 'S', w: 'Adaptável' }] },
  { id: 20, words: [{ l: 'I', w: 'Popular' }, { l: 'D', w: 'Inflexível' }, { l: 'S', w: 'Submisso' }, { l: 'C', w: 'Lógico' }] },
  { id: 21, words: [{ l: 'D', w: 'Competitivo' }, { l: 'C', w: 'Reflexivo' }, { l: 'S', w: 'Sereno' }, { l: 'I', w: 'Espontâneo' }] },
  { id: 22, words: [{ l: 'S', w: 'Confiável' }, { l: 'I', w: 'Motivador' }, { l: 'C', w: 'Específico' }, { l: 'D', w: 'Vigoroso' }] },
  { id: 23, words: [{ l: 'C', w: 'Crítico' }, { l: 'D', w: 'Focado' }, { l: 'I', w: 'Popular' }, { l: 'S', w: 'Gentil' }] },
  { id: 24, words: [{ l: 'I', w: 'Efusivo' }, { l: 'S', w: 'Amigável' }, { l: 'D', w: 'Destemido' }, { l: 'C', w: 'Moderado' }] },
  { id: 25, words: [{ l: 'D', w: 'Impulsor' }, { l: 'C', w: 'Conservador' }, { l: 'S', w: 'Apoiador' }, { l: 'I', w: 'Engajador' }] },
  { id: 26, words: [{ l: 'S', w: 'Dócil' }, { l: 'I', w: 'Brincalhão' }, { l: 'C', w: 'Rígido' }, { l: 'D', w: 'Independente' }] },
  { id: 27, words: [{ l: 'C', w: 'Calculista' }, { l: 'D', w: 'Rápido' }, { l: 'S', w: 'Ponderado' }, { l: 'I', w: 'Otimista' }] },
  { id: 28, words: [{ l: 'I', w: 'Visionário' }, { l: 'C', w: 'Realista' }, { l: 'D', w: 'Decisivo' }, { l: 'S', w: 'Constante' }] }
];

type AnswersState = Record<number, { mais?: string; menos?: string }>;

export default function DiscTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(id || '');
  const [answers, setAnswers] = useState<AnswersState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [acceptedGuide, setAcceptedGuide] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Embaralha blocos e palavras (Randomização Dupla)
  const randomizedBlocks = useMemo(() => {
    const shuffledQ = shuffleArray(rawBlocks);
    return shuffledQ.map(q => ({
      ...q,
      words: shuffleArray(q.words)
    }));
  }, []);

  useEffect(() => {
    supabase.from('funcionarios').select('id, nome, cargo').order('nome')
      .then(({ data }) => {
        if (data) setEmployees(data);
      });
  }, []);

  const handleSelect = (blockId: number, type: 'mais' | 'menos', letter: string) => {
    setAnswers(prev => {
      const currentBlock = prev[blockId] || {};
      const newBlock = { ...currentBlock };

      // Regra: Uma mesma palavra não pode ser MAIS e MENOS ao mesmo tempo.
      if (type === 'mais') {
        newBlock.mais = letter;
        if (newBlock.menos === letter) newBlock.menos = undefined;
      } else {
        newBlock.menos = letter;
        if (newBlock.mais === letter) newBlock.mais = undefined;
      }

      return { ...prev, [blockId]: newBlock };
    });
  };

  const isBlockComplete = (blockId: number) => {
    return answers[blockId]?.mais && answers[blockId]?.menos;
  };

  const completedCount = Object.values(answers).filter(a => a.mais && a.menos).length;
  const currentBlockIndex = completedCount < 28 ? completedCount : 27;

  const calculateResult = () => {
    const counts = { D: { mais: 0, menos: 0 }, I: { mais: 0, menos: 0 }, S: { mais: 0, menos: 0 }, C: { mais: 0, menos: 0 } };
    
    Object.values(answers).forEach(ans => {
      if (ans.mais) counts[ans.mais as 'D'|'I'|'S'|'C'].mais++;
      if (ans.menos) counts[ans.menos as 'D'|'I'|'S'|'C'].menos++;
    });

    const diffs = {
      D: counts.D.mais - counts.D.menos,
      I: counts.I.mais - counts.I.menos,
      S: counts.S.mais - counts.S.menos,
      C: counts.C.mais - counts.C.menos,
    };

    // O máximo teórico de diferença para um fator é +28 e o mínimo é -28
    const normalize = (val: number) => Math.max(0, Math.min(100, Math.round(((val + 28) / 56) * 100)));

    const result = {
      D: normalize(diffs.D),
      I: normalize(diffs.I),
      S: normalize(diffs.S),
      C: normalize(diffs.C),
      rawDiffs: diffs, // Enviado para os Sliders no ExecutiveReports!
      counts: counts,
      dominant: [
        { letter: 'D', val: diffs.D, title: 'Dominante' },
        { letter: 'I', val: diffs.I, title: 'Influente' },
        { letter: 'S', val: diffs.S, title: 'Estável' },
        { letter: 'C', val: diffs.C, title: 'Conforme' }
      ].sort((a, b) => b.val - a.val)[0]
    };
    return result;
  };

  const handleSubmit = async () => {
    if (completedCount < 28) {
      toast({ title: 'Atenção', description: 'Responda as categorias MAIS e MENOS de todos os 28 blocos.', variant: 'destructive' });
      return;
    }
    if (!selectedEmpId) {
      toast({ title: 'Atenção', description: 'Selecione um funcionário para salvar o teste.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const result = calculateResult();
    
    try {
      const { error } = await supabase.from('assessment_results').insert({
        user_id: selectedEmpId,
        type: 'disc',
        result_data: result
      });
      if (error) {
        console.error(error);
        localStorage.setItem(`disc_${selectedEmpId}`, JSON.stringify(result));
      }
    } catch (e) {
      console.error(e);
      localStorage.setItem(`disc_${selectedEmpId}`, JSON.stringify(result));
    }
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-2xl shadow-sm border border-border/50 max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Muito Obrigado!</h2>
          <p className="text-muted-foreground mb-6">Sua avaliação DISC foi registrada com sucesso e já está vinculada ao seu perfil.</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">Voltar</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-12 px-4 sm:px-6 relative"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        colorScheme: 'light'
      }}
    >
      <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-sm"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {!acceptedGuide ? (
            <motion.div 
              key="guide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-border/50 max-w-3xl mx-auto"
            >
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary mb-6 text-center">ANÁLISE DISC<br/><span className="text-2xl font-bold text-slate-700">Guia de Avaliação</span></h1>
              
              <div className="prose prose-slate max-w-none space-y-6 text-slate-600 text-sm sm:text-base h-[50vh] overflow-y-auto pr-4 mb-8 custom-scrollbar">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">O que é a Análise DISC?</h3>
                  <p>A Análise DISC é uma ferramenta de avaliação comportamental utilizada para identificar as tendências naturais de comportamento de cada colaborador no ambiente de trabalho.</p>
                  <p className="mt-2">Seu principal objetivo é promover o autoconhecimento, melhorar a comunicação entre as equipes, fortalecer o relacionamento interpessoal e apoiar o desenvolvimento profissional.</p>
                  <p className="mt-2">A metodologia DISC considera que cada pessoa possui características comportamentais predominantes, representadas por quatro fatores:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 font-semibold text-slate-700">
                    <li><strong className="text-blue-600">D</strong> – Dominância</li>
                    <li><strong className="text-yellow-500">I</strong> – Influência</li>
                    <li><strong className="text-green-600">S</strong> – Estabilidade</li>
                    <li><strong className="text-red-500">C</strong> – Conformidade (ou Cautela)</li>
                  </ul>
                  <p className="mt-2 font-medium">É importante destacar que não existe perfil melhor ou pior. Todos possuem pontos fortes e oportunidades de desenvolvimento, sendo cada perfil importante para diferentes atividades e desafios dentro da organização.</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Como funciona?</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>A avaliação será aplicada conforme programação da empresa.</li>
                    <li>O colaborador responderá a um questionário composto por situações e preferências comportamentais.</li>
                    <li>Ao final, o sistema identificará a predominância dos fatores comportamentais DISC.</li>
                    <li>O resultado será utilizado exclusivamente para apoiar ações de desenvolvimento, comunicação, liderança e formação de equipes.</li>
                    <li>A avaliação não possui caráter eliminatório ou punitivo, nem substitui avaliações de desempenho técnico.</li>
                  </ul>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Os quatro perfis comportamentais</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-blue-600">D – Dominância</h4>
                      <p className="text-sm mb-1">Pessoas com predominância em Dominância costumam ser orientadas para desafios, resultados e tomada de decisão.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-2">
                        <div>
                          <strong className="text-slate-700">Características comuns:</strong>
                          <ul className="list-disc pl-5 mt-1 text-slate-600">
                            <li>Objetividade</li>
                            <li>Rapidez nas decisões</li>
                            <li>Foco em resultados</li>
                            <li>Competitividade</li>
                            <li>Iniciativa</li>
                            <li>Facilidade para resolver problemas</li>
                          </ul>
                        </div>
                        <div>
                          <strong className="text-slate-700">Pontos de atenção:</strong>
                          <ul className="list-disc pl-5 mt-1 text-slate-600">
                            <li>Pode demonstrar impaciência.</li>
                            <li>Pode ser excessivamente direto na comunicação.</li>
                            <li>Pode assumir riscos sem avaliar todos os detalhes.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <h4 className="font-bold text-yellow-500">I – Influência</h4>
                      <p className="text-sm mb-1">Pessoas com predominância em Influência possuem facilidade para se comunicar, motivar pessoas e criar relacionamentos.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-2">
                        <div>
                          <strong className="text-slate-700">Características comuns:</strong>
                          <ul className="list-disc pl-5 mt-1 text-slate-600">
                            <li>Comunicação</li>
                            <li>Entusiasmo</li>
                            <li>Otimismo</li>
                            <li>Facilidade para trabalhar em equipe</li>
                            <li>Persuasão</li>
                            <li>Criatividade</li>
                          </ul>
                        </div>
                        <div>
                          <strong className="text-slate-700">Pontos de atenção:</strong>
                          <ul className="list-disc pl-5 mt-1 text-slate-600">
                            <li>Pode perder o foco em detalhes.</li>
                            <li>Pode ter dificuldade com atividades muito repetitivas.</li>
                            <li>Pode agir por impulso em algumas situações.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <h4 className="font-bold text-green-600">S – Estabilidade</h4>
                      <p className="text-sm mb-1">Pessoas com predominância em Estabilidade valorizam a cooperação, a organização e a construção de relacionamentos duradouros.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-2">
                        <div>
                          <strong className="text-slate-700">Características comuns:</strong>
                          <ul className="list-disc pl-5 mt-1 text-slate-600">
                            <li>Paciência</li>
                            <li>Colaboração</li>
                            <li>Comprometimento</li>
                            <li>Escuta ativa</li>
                            <li>Constância</li>
                            <li>Confiabilidade</li>
                          </ul>
                        </div>
                        <div>
                          <strong className="text-slate-700">Pontos de atenção:</strong>
                          <ul className="list-disc pl-5 mt-1 text-slate-600">
                            <li>Pode apresentar resistência a mudanças.</li>
                            <li>Pode evitar conflitos mesmo quando necessários.</li>
                            <li>Pode demorar mais para tomar decisões.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <h4 className="font-bold text-red-500">C – Conformidade</h4>
                      <p className="text-sm mb-1">Pessoas com predominância em Conformidade tendem a ser analíticas, organizadas e orientadas pela qualidade.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-2">
                        <div>
                          <strong className="text-slate-700">Características comuns:</strong>
                          <ul className="list-disc pl-5 mt-1 text-slate-600">
                            <li>Organização</li>
                            <li>Planejamento</li>
                            <li>Atenção aos detalhes</li>
                            <li>Precisão</li>
                            <li>Cumprimento de normas</li>
                            <li>Qualidade nas entregas</li>
                          </ul>
                        </div>
                        <div>
                          <strong className="text-slate-700">Pontos de atenção:</strong>
                          <ul className="list-disc pl-5 mt-1 text-slate-600">
                            <li>Pode ser excessivamente crítico.</li>
                            <li>Pode buscar perfeição antes de concluir atividades.</li>
                            <li>Pode ter dificuldade com mudanças rápidas ou pouco planejadas.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Exemplo de Resultado</h3>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                    <p className="font-bold text-slate-800 mb-2">Perfil predominante: Influência (I)</p>
                    <p className="font-semibold text-slate-700">O que isso significa?</p>
                    <p className="text-sm mt-1">Você demonstra facilidade para se comunicar, criar relacionamentos e motivar pessoas. Costuma trabalhar bem em equipe, gosta de ambientes colaborativos e tende a influenciar positivamente aqueles que estão ao seu redor.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                      <div>
                        <strong className="text-xs uppercase text-slate-500">Seus principais pontos fortes</strong>
                        <ul className="list-disc pl-5 mt-1 text-sm text-slate-700">
                          <li>Comunicação clara</li>
                          <li>Facilidade para trabalhar em equipe</li>
                          <li>Motivação das pessoas</li>
                          <li>Otimismo</li>
                          <li>Boa capacidade de relacionamento</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-xs uppercase text-slate-500">Oportunidades de desenvolvimento</strong>
                        <ul className="list-disc pl-5 mt-1 text-sm text-slate-700">
                          <li>Planejar melhor antes de agir.</li>
                          <li>Manter atenção aos detalhes.</li>
                          <li>Melhorar a organização das atividades.</li>
                          <li>Desenvolver maior disciplina no acompanhamento das tarefas.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Como interpretar o resultado?</h3>
                  <p>O relatório DISC demonstra quais características comportamentais aparecem com maior intensidade no seu perfil.</p>
                  <p className="mt-2">Isso não significa que você possua apenas um único perfil. Todas as pessoas apresentam características dos quatro fatores (D, I, S e C), porém algumas tendem a ser mais predominantes do que outras.</p>
                  <p className="mt-2">O objetivo da avaliação é ampliar o autoconhecimento, identificar pontos fortes e apoiar o desenvolvimento profissional.</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Benefícios da Análise DISC</h3>
                  <p className="mb-2">A utilização da metodologia DISC permite:</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-disc pl-5 text-slate-700">
                    <li>Melhor autoconhecimento;</li>
                    <li>Desenvolvimento profissional;</li>
                    <li>Comunicação mais eficiente;</li>
                    <li>Fortalecimento do trabalho em equipe;</li>
                    <li>Desenvolvimento de lideranças;</li>
                    <li>Melhor distribuição de atividades conforme o perfil comportamental;</li>
                    <li>Redução de conflitos interpessoais;</li>
                    <li>Melhoria do clima organizacional.</li>
                  </ul>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-primary-foreground">
                  <h3 className="text-lg font-bold text-primary mb-2">Atenção ao responder</h3>
                  <p className="text-slate-700 font-medium mb-2">Responda ao questionário considerando a forma como você normalmente age, e não como acredita que deveria agir.</p>
                  <p className="text-slate-700 font-bold mb-2">Não existem respostas certas ou erradas.</p>
                  <p className="text-slate-700 mb-2">O resultado será mais útil quanto mais sinceras forem suas respostas.</p>
                  <p className="text-slate-700 font-medium">Lembre-se: o objetivo da Análise DISC é apoiar seu desenvolvimento profissional, fortalecer o trabalho em equipe e contribuir para um ambiente de trabalho cada vez mais colaborativo, produtivo e alinhado aos valores da empresa.</p>
                </div>
              </div>

              <div className="border-t border-border pt-6 space-y-6">
                <div className="flex items-start space-x-3 bg-muted/50 p-4 rounded-lg cursor-pointer transition-colors hover:bg-muted" onClick={() => setAgreed(!agreed)}>
                  <Checkbox 
                    id="terms" 
                    checked={agreed}
                    onCheckedChange={(c) => setAgreed(c as boolean)}
                    className="mt-1 h-5 w-5"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="terms" className="text-sm font-medium leading-tight cursor-pointer">
                      Li e compreendo as orientações acima
                    </label>
                    <p className="text-xs text-muted-foreground">Confirmo que entendi como a avaliação funciona e os critérios que serão analisados.</p>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg rounded-xl"
                  disabled={!agreed}
                  onClick={() => setAcceptedGuide(true)}
                >
                  Prosseguir para o Questionário <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black tracking-tight text-primary bg-white/80 backdrop-blur inline-block px-6 py-2 rounded-full shadow-sm">Avaliação DISC</h1>
                <p className="text-slate-700 mt-2">Responda com base no seu comportamento natural.</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl flex gap-3 text-sm font-medium bg-white/90">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>Atenção: Em cada questão, escolha a palavra que <strong>MAIS</strong> te define e a palavra que <strong>MENOS</strong> te define. O teste avançará automaticamente para o próximo bloco após as duas seleções.</p>
              </div>

              <div className="space-y-8">
                {randomizedBlocks.map((block, index) => {
                  // Exibir apenas blocos já completados ou o bloco atual (Focus Mode)
                  if (index > currentBlockIndex) return null;
                  
                  const isCurrent = index === currentBlockIndex;
                  const isDone = isBlockComplete(block.id);

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={block.id} 
                      className={`bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden transition-all duration-300 ${isCurrent ? 'ring-2 ring-primary/50' : 'opacity-80'}`}
                    >
                      <div className="p-4 border-b border-border bg-primary/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-primary" />
                          <div>
                            <h4 className="font-semibold text-foreground text-sm">Questão {index + 1} de 28</h4>
                            <p className="text-xs text-muted-foreground">Escolha o que mais e menos te define</p>
                          </div>
                        </div>
                        {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 !bg-slate-100">
                              <th className="text-left p-3 font-semibold !text-slate-900 w-1/2">Característica</th>
                              <th className="p-3 text-center font-bold text-primary w-1/4">MAIS</th>
                              <th className="p-3 text-center font-bold text-destructive w-1/4">MENOS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {block.words.map((wordObj, wordIndex) => {
                              const isMais = answers[block.id]?.mais === wordObj.l;
                              const isMenos = answers[block.id]?.menos === wordObj.l;

                              return (
                                <tr key={wordObj.w} className={`border-b border-slate-200 ${wordIndex % 2 === 0 ? '!bg-white' : '!bg-slate-50'}`}>
                                  <td className="p-3">
                                    <span className="font-medium !text-slate-900">{wordObj.w}</span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={() => handleSelect(block.id, 'mais', wordObj.l)}
                                      className={`w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${
                                        isMais
                                          ? 'border-primary bg-primary shadow-md scale-110'
                                          : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/10'
                                      }`}
                                    >
                                      {isMais && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                    </button>
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={() => handleSelect(block.id, 'menos', wordObj.l)}
                                      className={`w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${
                                        isMenos
                                          ? 'border-destructive bg-destructive shadow-md scale-110'
                                          : 'border-muted-foreground/30 hover:border-destructive/50 hover:bg-destructive/10'
                                      }`}
                                    >
                                      {isMenos && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="bg-white rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-sm border border-border/50 gap-4">
                <div className="text-sm font-bold text-slate-800">
                  Progresso: <span className="text-primary">{completedCount}</span> de 28
                </div>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || completedCount < 28 || !selectedEmpId}
                  size="lg"
                  className="w-full sm:w-auto text-base rounded-xl"
                >
                  {isSubmitting ? 'Gerando Laudo Ipsativo...' : (
                    <>Finalizar Avaliação DISC <Send className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
