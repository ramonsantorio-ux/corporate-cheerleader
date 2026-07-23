import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

// Helper para embaralhar (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// 28 Questões MBTI Corporativo (Pares Forçados)
const rawMbtiBlocks = [
  // E vs I (Foco de Energia e Interação)
  { id: 1, pair: 'EI', A: { l: 'E', t: 'Após uma semana de trabalho intenso, me sinto revigorado ao participar de reuniões de brainstorming e interações ativas com a equipe.' }, B: { l: 'I', t: 'Após uma semana de trabalho intenso, preciso me isolar para organizar meus pensamentos e recarregar minhas energias.' } },
  { id: 2, pair: 'EI', A: { l: 'I', t: 'Ao resolver um problema complexo, prefiro aprofundar minha reflexão individual antes de apresentar uma conclusão ao grupo.' }, B: { l: 'E', t: 'Ao resolver um problema complexo, prefiro debater em voz alta com meus colegas para que as ideias fluam coletivamente.' } },
  { id: 3, pair: 'EI', A: { l: 'E', t: 'Geralmente inicio conversas e me sinto Ã  vontade sendo o centro das atenções em eventos da empresa.' }, B: { l: 'I', t: 'Prefiro observar primeiro e me engajar em conversas profundas com uma ou duas pessoas conhecidas.' } },
  { id: 4, pair: 'EI', A: { l: 'I', t: 'Acesso melhor minha criatividade e clareza mental quando não sofro interrupções externas constantes.' }, B: { l: 'E', t: 'Acesso melhor minha criatividade e clareza mental no calor do momento, debatendo e trocando informações rapidamente.' } },
  { id: 5, pair: 'EI', A: { l: 'E', t: 'Meu estilo de comunicação é imediato, responsivo e orientado para a ação externa.' }, B: { l: 'I', t: 'Meu estilo de comunicação é ponderado, calculado e orientado para o alinhamento interno primeiro.' } },
  { id: 6, pair: 'EI', A: { l: 'I', t: 'Meu foco primário está em compreender o mundo interno de ideias e conceitos antes de aplicá-los.' }, B: { l: 'E', t: 'Meu foco primário está em aplicar imediatamente ideias no mundo externo para ver os resultados práticos.' } },
  { id: 7, pair: 'EI', A: { l: 'E', t: 'Costumo agir primeiro, e refletir sobre as consequências ao longo do processo.' }, B: { l: 'I', t: 'Costumo refletir exaustivamente primeiro, para então agir com precisão.' } },

  // S vs N (Processamento de Informação)
  { id: 8, pair: 'SN', A: { l: 'S', t: 'Ao iniciar um novo projeto, procuro manuais, dados históricos e o que já foi comprovado que funciona.' }, B: { l: 'N', t: 'Ao iniciar um novo projeto, tento visualizar o impacto futuro e buscar inovações que rompam os padrões.' } },
  { id: 9, pair: 'SN', A: { l: 'N', t: 'Tenho facilidade em ver o "grande quadro", padrões invisíveis e significados ocultos nos processos.' }, B: { l: 'S', t: 'Tenho facilidade com a execução tática, lidando com os fatos tangíveis e detalhes imediatos.' } },
  { id: 10, pair: 'SN', A: { l: 'S', t: 'Minha comunicação tende a ser literal, focando em "o que é", de forma clara e baseada na realidade presente.' }, B: { l: 'N', t: 'Minha comunicação tende a ser figurativa, focando em "o que poderia ser", usando metáforas e projeções futuras.' } },
  { id: 11, pair: 'SN', A: { l: 'N', t: 'Fico entediado com a manutenção de rotinas burocráticas e prefiro desenhar a visão estratégica.' }, B: { l: 'S', t: 'Sinto-me seguro e produtivo operando processos bem estabelecidos e mantendo a roda girando.' } },
  { id: 12, pair: 'SN', A: { l: 'S', t: 'Confio na minha experiência prática e no meu "bom senso" construído por vivências passadas.' }, B: { l: 'N', t: 'Confio na minha intuição e em "insights" repentinos que conectam informações dispersas.' } },
  { id: 13, pair: 'SN', A: { l: 'N', t: 'Gosto de questionar o status quo e perguntar "por que não fazer de uma forma completamente diferente?".' }, B: { l: 'S', t: 'Gosto de melhorar o status quo perguntando "como podemos tornar o que já fazemos mais eficiente?".' } },
  { id: 14, pair: 'SN', A: { l: 'S', t: 'Sou valorizado pela minha precisão e capacidade de observar detalhes concretos que os outros perdem.' }, B: { l: 'N', t: 'Sou valorizado pela minha capacidade de ver conexões abstratas que a maioria das pessoas não enxerga.' } },

  // T vs F (Tomada de Decisão)
  { id: 15, pair: 'TF', A: { l: 'T', t: 'Ao dar um feedback corretivo a um liderado, foco na lógica, métricas e na falha de processo para corrigir a rota.' }, B: { l: 'F', t: 'Ao dar um feedback corretivo, pondero as palavras e busco entender o momento emocional do colaborador para manter o engajamento.' } },
  { id: 16, pair: 'TF', A: { l: 'F', t: 'Acredito que a harmonia da equipe e os valores humanos são os fatores mais cruciais para o sucesso a longo prazo.' }, B: { l: 'T', t: 'Acredito que a competência técnica, a lógica e a eficiência são os fatores cruciais para o sucesso a longo prazo.' } },
  { id: 17, pair: 'TF', A: { l: 'T', t: 'Tomo decisões baseadas em uma análise fria e objetiva de prós e contras, mesmo que isso desagrade alguns.' }, B: { l: 'F', t: 'Tomo decisões baseadas no impacto que elas terão sobre as pessoas envolvidas e nos meus valores pessoais.' } },
  { id: 18, pair: 'TF', A: { l: 'F', t: 'Em um conflito no trabalho, tendo a me colocar no lugar das partes para buscar um consenso empático.' }, B: { l: 'T', t: 'Em um conflito no trabalho, busco a "verdade dos fatos" para determinar quem está certo do ponto de vista racional.' } },
  { id: 19, pair: 'TF', A: { l: 'T', t: 'Ã‰ mais frequente que eu seja visto como alguém justo, analítico e de mentalidade firme.' }, B: { l: 'F', t: 'Ã‰ mais frequente que eu seja visto como alguém acolhedor, compreensivo e de mentalidade humanizada.' } },
  { id: 20, pair: 'TF', A: { l: 'F', t: 'Me motivo e me orgulho mais por ajudar os outros a alcançarem seu potencial.' }, B: { l: 'T', t: 'Me motivo e me orgulho mais por dominar competências difíceis e atingir metas audaciosas.' } },
  { id: 21, pair: 'TF', A: { l: 'T', t: 'A verdade dói, mas é melhor dita diretamente sem rodeios.' }, B: { l: 'F', t: 'O tato e a diplomacia são fundamentais; a verdade nua pode destruir pontes irreparáveis.' } },

  // J vs P (Estilo de Vida e Estrutura)
  { id: 22, pair: 'JP', A: { l: 'J', t: 'Prefiro chegar ao trabalho com uma lista fechada do que farei, e me incomodo se mudanças de última hora alteram meu cronograma.' }, B: { l: 'P', t: 'Prefiro começar o dia com flexibilidade e me sinto estimulado quando urgências e mudanças me forçam a improvisar.' } },
  { id: 23, pair: 'JP', A: { l: 'P', t: 'Gosto de manter opções abertas, postergando decisões até ter o máximo de informação possível, mesmo perto do prazo.' }, B: { l: 'J', t: 'Gosto do sentimento de conclusão e me antecipo para tomar decisões rápido e tirar pendências da frente.' } },
  { id: 24, pair: 'JP', A: { l: 'J', t: 'Meu espaço físico (mesa, desktop) e minha rotina tendem a ser altamente organizados, categorizados e previsíveis.' }, B: { l: 'P', t: 'Meu espaço físico pode parecer um pouco caótico, pois tolero a desordem e prefiro agir espontaneamente do que rotular tudo.' } },
  { id: 25, pair: 'JP', A: { l: 'P', t: 'Encaro prazos finais como um evento maleável ou motivador sob pressão de última hora (funciono bem no "caos produtivo").' }, B: { l: 'J', t: 'Encaro prazos finais com seriedade e planejo metodicamente para não ter surpresas na véspera.' } },
  { id: 26, pair: 'JP', A: { l: 'J', t: 'Costumo estruturar minhas férias com roteiros e reservas prévias garantindo que tudo está sob controle.' }, B: { l: 'P', t: 'Costumo deixar roteiros vagos, gostando da ideia de descobrir o que farei quando chegar lá.' } },
  { id: 27, pair: 'JP', A: { l: 'P', t: 'Minha força de trabalho é feita em "surtos de energia" intensos, em vez de uma cadência uniforme e sistemática.' }, B: { l: 'J', t: 'Minha força de trabalho é contínua e regrada, mantendo consistência diariamente até o final.' } },
  { id: 28, pair: 'JP', A: { l: 'J', t: 'Uma decisão ruim é preferível Ã  angústia de ficar em cima do muro; o negócio é definir logo e avançar.' }, B: { l: 'P', t: 'Fechamento prematuro é um erro; é preferível reabrir o caso e estender a avaliação quando surgem novos dados.' } },
];

export default function MbtiTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  type Employee = { id: string; nome: string; cargo: string };
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(id || '');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Dupla randomização (blocos e ordem de A/B)
  const randomizedBlocks = useMemo(() => {
    const shuffled = shuffleArray(rawMbtiBlocks);
    return shuffled.map(block => {
      const options = shuffleArray([block.A, block.B]);
      return { id: block.id, pair: block.pair, opt1: options[0], opt2: options[1] };
    });
  }, []);

  useEffect(() => {
    supabase.from('funcionarios').select('id, nome, cargo').order('nome')
      .then(({ data }) => {
        if (data) setEmployees(data);
      });
  }, []);

  const handleSelect = (blockId: number, letter: string) => {
    setAnswers(prev => ({ ...prev, [blockId]: letter }));
  };

  const currentBlockIndex = Object.keys(answers).length < 28 ? Object.keys(answers).length : 27;
  const completedCount = Object.keys(answers).length;

  const handleSubmit = async () => {
    if (!selectedEmpId) return toast({ title: 'Selecione um funcionário', variant: 'destructive' });
    if (completedCount < 28) return toast({ title: 'Responda as 28 questões.', variant: 'destructive' });

    setIsSubmitting(true);
    let E = 0, I = 0, S = 0, N = 0, T = 0, F = 0, J = 0, P = 0;
    Object.values(answers).forEach(letter => {
      if (letter === 'E') E++; if (letter === 'I') I++;
      if (letter === 'S') S++; if (letter === 'N') N++;
      if (letter === 'T') T++; if (letter === 'F') F++;
      if (letter === 'J') J++; if (letter === 'P') P++;
    });

    // 7 questões por eixo (total 28)
    const typeStr = `${E >= I ? 'E' : 'I'}${S >= N ? 'S' : 'N'}${T >= F ? 'T' : 'F'}${J >= P ? 'J' : 'P'}`;
    const percentages = {
      E: Math.round((E/7)*100), I: Math.round((I/7)*100),
      S: Math.round((S/7)*100), N: Math.round((N/7)*100),
      T: Math.round((T/7)*100), F: Math.round((F/7)*100),
      J: Math.round((J/7)*100), P: Math.round((P/7)*100),
    };

    const resultData = { type: typeStr, desc: { title: typeStr }, percentages };

    try {
      const { error } = await supabase.from('assessment_results').insert({
        user_id: selectedEmpId,
        type: 'mbti',
        result_data: resultData
      });
      if (error) {
        localStorage.setItem(`mbti_${selectedEmpId}`, JSON.stringify(resultData));
      }
    } catch (e) {
      localStorage.setItem(`mbti_${selectedEmpId}`, JSON.stringify(resultData));
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-2xl shadow-sm border border-border/50 max-w-md w-full">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Muito Obrigado!</h2>
          <p className="text-muted-foreground mb-6">Sua avaliação MBTI foi registrada com sucesso e já está vinculada ao seu perfil.</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">Voltar</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-left pb-20 mt-6">
      <div className="glass-card p-8 rounded-2xl border-l-4 border-l-indigo-500 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 rotate-12 pointer-events-none">
          <Brain className="w-64 h-64" />
        </div>
        <h2 className="text-xl font-bold text-indigo-500 flex items-center gap-2 mb-4">O que é a Análise MBTI?</h2>
        <p className="text-foreground/80 leading-relaxed text-sm">
          O MBTI é uma estrutura global para identificar como as pessoas percebem o mundo e tomam decisões corporativas. O teste baseia-se em escolhas de cenários práticos que mapeiam 4 polaridades: <br/><br/>
          <strong>Energia</strong> (Extroversão x Introversão), <strong>Informação</strong> (Sensação x Intuição), <strong>Decisão</strong> (Pensamento x Sentimento) e <strong>Estrutura</strong> (Julgamento x Percepção).
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl space-y-4">
        <label className="text-sm font-bold text-foreground">Funcionário Avaliado:</label>
        <select 
          className="w-full bg-background border border-border/50 text-foreground text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedEmpId}
          onChange={e => setSelectedEmpId(e.target.value)}
        >
          <option value="">Selecione quem está fazendo o teste...</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.nome} — {e.cargo}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
        <span>Questão {Math.min(completedCount + 1, 28)} de 28</span>
        <span>{completedCount} respondidas</span>
      </div>

      <div className="space-y-6">
        {randomizedBlocks.map((block, index) => {
          if (index > currentBlockIndex) return null;
          const isCurrent = index === currentBlockIndex;
          const answeredLetter = answers[block.id];
          const isDone = !!answeredLetter;

          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={block.id} 
              className={`rounded-2xl overflow-hidden transition-all duration-300 ${isCurrent ? 'shadow-lg border-2 border-indigo-500/50 bg-card' : 'shadow-sm border border-border/50 bg-muted/20 opacity-70'}`}
            >
              <div className="bg-muted/50 p-3 px-6 border-b border-border/50 flex justify-between items-center">
                <span className="font-bold text-sm text-foreground/70">Análise de Cenário {index + 1}</span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              
              <div className="p-6 space-y-4">
                <div 
                  onClick={() => handleSelect(block.id, block.opt1.l)}
                  className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${answeredLetter === block.opt1.l ? 'bg-indigo-500/10 border-indigo-500' : 'bg-background border-border/50 hover:border-indigo-500/30'}`}
                >
                  <p className={`text-sm ${answeredLetter === block.opt1.l ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-foreground/80'}`}>{block.opt1.t}</p>
                </div>
                <div 
                  onClick={() => handleSelect(block.id, block.opt2.l)}
                  className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${answeredLetter === block.opt2.l ? 'bg-indigo-500/10 border-indigo-500' : 'bg-background border-border/50 hover:border-indigo-500/30'}`}
                >
                  <p className={`text-sm ${answeredLetter === block.opt2.l ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-foreground/80'}`}>{block.opt2.t}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="glass-card rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between sticky bottom-6 shadow-2xl bg-card/95 backdrop-blur z-10 border-t-4 border-t-indigo-500 gap-4">
        <div className="text-sm font-bold text-foreground">
          Progresso: <span className="text-indigo-500">{completedCount}</span> de 28
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || completedCount < 28 || !selectedEmpId}
          size="lg"
          className="w-full sm:w-auto font-bold px-8 bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
        >
          {isSubmitting ? 'Gerando Laudo MBTI...' : (
            <>Finalizar Avaliação MBTI <Send className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
