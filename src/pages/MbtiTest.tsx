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

// 28 QuestÃµes MBTI Corporativo (Pares ForÃ§ados)
const rawMbtiBlocks = [
  // E vs I (Foco de Energia e InteraÃ§Ã£o)
  { id: 1, pair: 'EI', A: { l: 'E', t: 'ApÃ³s uma semana de trabalho intenso, me sinto revigorado ao participar de reuniÃµes de brainstorming e interaÃ§Ãµes ativas com a equipe.' }, B: { l: 'I', t: 'ApÃ³s uma semana de trabalho intenso, preciso me isolar para organizar meus pensamentos e recarregar minhas energias.' } },
  { id: 2, pair: 'EI', A: { l: 'I', t: 'Ao resolver um problema complexo, prefiro aprofundar minha reflexÃ£o individual antes de apresentar uma conclusÃ£o ao grupo.' }, B: { l: 'E', t: 'Ao resolver um problema complexo, prefiro debater em voz alta com meus colegas para que as ideias fluam coletivamente.' } },
  { id: 3, pair: 'EI', A: { l: 'E', t: 'Geralmente inicio conversas e me sinto Ã  vontade sendo o centro das atenÃ§Ãµes em eventos da empresa.' }, B: { l: 'I', t: 'Prefiro observar primeiro e me engajar em conversas profundas com uma ou duas pessoas conhecidas.' } },
  { id: 4, pair: 'EI', A: { l: 'I', t: 'Acesso melhor minha criatividade e clareza mental quando nÃ£o sofro interrupÃ§Ãµes externas constantes.' }, B: { l: 'E', t: 'Acesso melhor minha criatividade e clareza mental no calor do momento, debatendo e trocando informaÃ§Ãµes rapidamente.' } },
  { id: 5, pair: 'EI', A: { l: 'E', t: 'Meu estilo de comunicaÃ§Ã£o Ã© imediato, responsivo e orientado para a aÃ§Ã£o externa.' }, B: { l: 'I', t: 'Meu estilo de comunicaÃ§Ã£o Ã© ponderado, calculado e orientado para o alinhamento interno primeiro.' } },
  { id: 6, pair: 'EI', A: { l: 'I', t: 'Meu foco primÃ¡rio estÃ¡ em compreender o mundo interno de ideias e conceitos antes de aplicÃ¡-los.' }, B: { l: 'E', t: 'Meu foco primÃ¡rio estÃ¡ em aplicar imediatamente ideias no mundo externo para ver os resultados prÃ¡ticos.' } },
  { id: 7, pair: 'EI', A: { l: 'E', t: 'Costumo agir primeiro, e refletir sobre as consequÃªncias ao longo do processo.' }, B: { l: 'I', t: 'Costumo refletir exaustivamente primeiro, para entÃ£o agir com precisÃ£o.' } },

  // S vs N (Processamento de InformaÃ§Ã£o)
  { id: 8, pair: 'SN', A: { l: 'S', t: 'Ao iniciar um novo projeto, procuro manuais, dados histÃ³ricos e o que jÃ¡ foi comprovado que funciona.' }, B: { l: 'N', t: 'Ao iniciar um novo projeto, tento visualizar o impacto futuro e buscar inovaÃ§Ãµes que rompam os padrÃµes.' } },
  { id: 9, pair: 'SN', A: { l: 'N', t: 'Tenho facilidade em ver o "grande quadro", padrÃµes invisÃ­veis e significados ocultos nos processos.' }, B: { l: 'S', t: 'Tenho facilidade com a execuÃ§Ã£o tÃ¡tica, lidando com os fatos tangÃ­veis e detalhes imediatos.' } },
  { id: 10, pair: 'SN', A: { l: 'S', t: 'Minha comunicaÃ§Ã£o tende a ser literal, focando em "o que Ã©", de forma clara e baseada na realidade presente.' }, B: { l: 'N', t: 'Minha comunicaÃ§Ã£o tende a ser figurativa, focando em "o que poderia ser", usando metÃ¡foras e projeÃ§Ãµes futuras.' } },
  { id: 11, pair: 'SN', A: { l: 'N', t: 'Fico entediado com a manutenÃ§Ã£o de rotinas burocrÃ¡ticas e prefiro desenhar a visÃ£o estratÃ©gica.' }, B: { l: 'S', t: 'Sinto-me seguro e produtivo operando processos bem estabelecidos e mantendo a roda girando.' } },
  { id: 12, pair: 'SN', A: { l: 'S', t: 'Confio na minha experiÃªncia prÃ¡tica e no meu "bom senso" construÃ­do por vivÃªncias passadas.' }, B: { l: 'N', t: 'Confio na minha intuiÃ§Ã£o e em "insights" repentinos que conectam informaÃ§Ãµes dispersas.' } },
  { id: 13, pair: 'SN', A: { l: 'N', t: 'Gosto de questionar o status quo e perguntar "por que nÃ£o fazer de uma forma completamente diferente?".' }, B: { l: 'S', t: 'Gosto de melhorar o status quo perguntando "como podemos tornar o que jÃ¡ fazemos mais eficiente?".' } },
  { id: 14, pair: 'SN', A: { l: 'S', t: 'Sou valorizado pela minha precisÃ£o e capacidade de observar detalhes concretos que os outros perdem.' }, B: { l: 'N', t: 'Sou valorizado pela minha capacidade de ver conexÃµes abstratas que a maioria das pessoas nÃ£o enxerga.' } },

  // T vs F (Tomada de DecisÃ£o)
  { id: 15, pair: 'TF', A: { l: 'T', t: 'Ao dar um feedback corretivo a um liderado, foco na lÃ³gica, mÃ©tricas e na falha de processo para corrigir a rota.' }, B: { l: 'F', t: 'Ao dar um feedback corretivo, pondero as palavras e busco entender o momento emocional do colaborador para manter o engajamento.' } },
  { id: 16, pair: 'TF', A: { l: 'F', t: 'Acredito que a harmonia da equipe e os valores humanos sÃ£o os fatores mais cruciais para o sucesso a longo prazo.' }, B: { l: 'T', t: 'Acredito que a competÃªncia tÃ©cnica, a lÃ³gica e a eficiÃªncia sÃ£o os fatores cruciais para o sucesso a longo prazo.' } },
  { id: 17, pair: 'TF', A: { l: 'T', t: 'Tomo decisÃµes baseadas em uma anÃ¡lise fria e objetiva de prÃ³s e contras, mesmo que isso desagrade alguns.' }, B: { l: 'F', t: 'Tomo decisÃµes baseadas no impacto que elas terÃ£o sobre as pessoas envolvidas e nos meus valores pessoais.' } },
  { id: 18, pair: 'TF', A: { l: 'F', t: 'Em um conflito no trabalho, tendo a me colocar no lugar das partes para buscar um consenso empÃ¡tico.' }, B: { l: 'T', t: 'Em um conflito no trabalho, busco a "verdade dos fatos" para determinar quem estÃ¡ certo do ponto de vista racional.' } },
  { id: 19, pair: 'TF', A: { l: 'T', t: 'Ã‰ mais frequente que eu seja visto como alguÃ©m justo, analÃ­tico e de mentalidade firme.' }, B: { l: 'F', t: 'Ã‰ mais frequente que eu seja visto como alguÃ©m acolhedor, compreensivo e de mentalidade humanizada.' } },
  { id: 20, pair: 'TF', A: { l: 'F', t: 'Me motivo e me orgulho mais por ajudar os outros a alcanÃ§arem seu potencial.' }, B: { l: 'T', t: 'Me motivo e me orgulho mais por dominar competÃªncias difÃ­ceis e atingir metas audaciosas.' } },
  { id: 21, pair: 'TF', A: { l: 'T', t: 'A verdade dÃ³i, mas Ã© melhor dita diretamente sem rodeios.' }, B: { l: 'F', t: 'O tato e a diplomacia sÃ£o fundamentais; a verdade nua pode destruir pontes irreparÃ¡veis.' } },

  // J vs P (Estilo de Vida e Estrutura)
  { id: 22, pair: 'JP', A: { l: 'J', t: 'Prefiro chegar ao trabalho com uma lista fechada do que farei, e me incomodo se mudanÃ§as de Ãºltima hora alteram meu cronograma.' }, B: { l: 'P', t: 'Prefiro comeÃ§ar o dia com flexibilidade e me sinto estimulado quando urgÃªncias e mudanÃ§as me forÃ§am a improvisar.' } },
  { id: 23, pair: 'JP', A: { l: 'P', t: 'Gosto de manter opÃ§Ãµes abertas, postergando decisÃµes atÃ© ter o mÃ¡ximo de informaÃ§Ã£o possÃ­vel, mesmo perto do prazo.' }, B: { l: 'J', t: 'Gosto do sentimento de conclusÃ£o e me antecipo para tomar decisÃµes rÃ¡pido e tirar pendÃªncias da frente.' } },
  { id: 24, pair: 'JP', A: { l: 'J', t: 'Meu espaÃ§o fÃ­sico (mesa, desktop) e minha rotina tendem a ser altamente organizados, categorizados e previsÃ­veis.' }, B: { l: 'P', t: 'Meu espaÃ§o fÃ­sico pode parecer um pouco caÃ³tico, pois tolero a desordem e prefiro agir espontaneamente do que rotular tudo.' } },
  { id: 25, pair: 'JP', A: { l: 'P', t: 'Encaro prazos finais como um evento maleÃ¡vel ou motivador sob pressÃ£o de Ãºltima hora (funciono bem no "caos produtivo").' }, B: { l: 'J', t: 'Encaro prazos finais com seriedade e planejo metodicamente para nÃ£o ter surpresas na vÃ©spera.' } },
  { id: 26, pair: 'JP', A: { l: 'J', t: 'Costumo estruturar minhas fÃ©rias com roteiros e reservas prÃ©vias garantindo que tudo estÃ¡ sob controle.' }, B: { l: 'P', t: 'Costumo deixar roteiros vagos, gostando da ideia de descobrir o que farei quando chegar lÃ¡.' } },
  { id: 27, pair: 'JP', A: { l: 'P', t: 'Minha forÃ§a de trabalho Ã© feita em "surtos de energia" intensos, em vez de uma cadÃªncia uniforme e sistemÃ¡tica.' }, B: { l: 'J', t: 'Minha forÃ§a de trabalho Ã© contÃ­nua e regrada, mantendo consistÃªncia diariamente atÃ© o final.' } },
  { id: 28, pair: 'JP', A: { l: 'J', t: 'Uma decisÃ£o ruim Ã© preferÃ­vel Ã  angÃºstia de ficar em cima do muro; o negÃ³cio Ã© definir logo e avanÃ§ar.' }, B: { l: 'P', t: 'Fechamento prematuro Ã© um erro; Ã© preferÃ­vel reabrir o caso e estender a avaliaÃ§Ã£o quando surgem novos dados.' } },
];

export default function MbtiTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(id || '');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dupla randomizaÃ§Ã£o (blocos e ordem de A/B)
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
    if (!selectedEmpId) return toast({ title: 'Selecione um funcionÃ¡rio', variant: 'destructive' });
    if (completedCount < 28) return toast({ title: 'Responda as 28 questÃµes.', variant: 'destructive' });

    setIsSubmitting(true);
    let E = 0, I = 0, S = 0, N = 0, T = 0, F = 0, J = 0, P = 0;
    Object.values(answers).forEach(letter => {
      if (letter === 'E') E++; if (letter === 'I') I++;
      if (letter === 'S') S++; if (letter === 'N') N++;
      if (letter === 'T') T++; if (letter === 'F') F++;
      if (letter === 'J') J++; if (letter === 'P') P++;
    });

    // 7 questÃµes por eixo (total 28)
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
      toast({ title: 'AvaliaÃ§Ã£o MBTI finalizada com sucesso!' });
      window.location.href = `/funcionario/${selectedEmpId}`;
    } catch (e) {
      localStorage.setItem(`mbti_${selectedEmpId}`, JSON.stringify(resultData));
      window.location.href = `/funcionario/${selectedEmpId}`;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-left pb-20 mt-6">
      <div className="glass-card p-8 rounded-2xl border-l-4 border-l-indigo-500 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 rotate-12 pointer-events-none">
          <Brain className="w-64 h-64" />
        </div>
        <h2 className="text-xl font-bold text-indigo-500 flex items-center gap-2 mb-4">O que Ã© a AnÃ¡lise MBTI?</h2>
        <p className="text-foreground/80 leading-relaxed text-sm">
          O MBTI Ã© uma estrutura global para identificar como as pessoas percebem o mundo e tomam decisÃµes corporativas. O teste baseia-se em escolhas de cenÃ¡rios prÃ¡ticos que mapeiam 4 polaridades: <br/><br/>
          <strong>Energia</strong> (ExtroversÃ£o x IntroversÃ£o), <strong>InformaÃ§Ã£o</strong> (SensaÃ§Ã£o x IntuiÃ§Ã£o), <strong>DecisÃ£o</strong> (Pensamento x Sentimento) e <strong>Estrutura</strong> (Julgamento x PercepÃ§Ã£o).
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl space-y-4">
        <label className="text-sm font-bold text-foreground">FuncionÃ¡rio Avaliado:</label>
        <select 
          className="w-full bg-background border border-border/50 text-foreground text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedEmpId}
          onChange={e => setSelectedEmpId(e.target.value)}
        >
          <option value="">Selecione quem estÃ¡ fazendo o teste...</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.nome} â€” {e.cargo}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
        <span>QuestÃ£o {Math.min(completedCount + 1, 28)} de 28</span>
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
                <span className="font-bold text-sm text-foreground/70">AnÃ¡lise de CenÃ¡rio {index + 1}</span>
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
            <>Finalizar AvaliaÃ§Ã£o MBTI <Send className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
