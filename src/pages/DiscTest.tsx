import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, ArrowLeft, Send, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

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
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Questionário DISC</h1>
          <p className="text-muted-foreground">Responda com base no seu comportamento natural.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 border-l-4 border-l-primary">
        <label className="text-sm font-semibold mb-2 block">Funcionário Avaliado:</label>
        <select 
          className="w-full bg-background border border-input rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
          value={selectedEmpId}
          onChange={(e) => setSelectedEmpId(e.target.value)}
          disabled={!!id}
        >
          <option value="" disabled>Selecione quem está realizando o teste...</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.nome} - {e.cargo}</option>
          ))}
        </select>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl flex gap-3 text-sm font-medium">
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
              className={`rounded-2xl overflow-hidden transition-all duration-300 ${isCurrent ? 'shadow-lg border-2 border-primary/50 bg-card' : 'shadow-sm border border-border/50 bg-muted/20 opacity-70'}`}
            >
              <div className="bg-muted/50 p-3 px-6 border-b border-border/50 flex justify-between items-center">
                <span className="font-bold text-sm text-foreground/70">Questão {index + 1} de 28</span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              
              <div className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="py-3 px-6 text-left font-semibold w-1/2">Característica</th>
                      <th className="py-3 px-2 text-center font-bold text-primary w-1/4">MAIS</th>
                      <th className="py-3 px-2 text-center font-bold text-destructive w-1/4">MENOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.words.map((wordObj) => {
                      const isMais = answers[block.id]?.mais === wordObj.l;
                      const isMenos = answers[block.id]?.menos === wordObj.l;

                      return (
                        <tr key={wordObj.w} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="py-4 px-6 font-medium text-foreground/90">{wordObj.w}</td>
                          <td className="py-4 px-2 text-center cursor-pointer" onClick={() => handleSelect(block.id, 'mais', wordObj.l)}>
                            <div className={`w-6 h-6 mx-auto rounded-full border-2 flex items-center justify-center transition-all ${isMais ? 'border-primary bg-primary' : 'border-muted-foreground/30 hover:border-primary/50'}`}>
                              {isMais && <div className="w-2.5 h-2.5 bg-background rounded-full" />}
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center cursor-pointer" onClick={() => handleSelect(block.id, 'menos', wordObj.l)}>
                            <div className={`w-6 h-6 mx-auto rounded-full border-2 flex items-center justify-center transition-all ${isMenos ? 'border-destructive bg-destructive' : 'border-muted-foreground/30 hover:border-destructive/50'}`}>
                              {isMenos && <div className="w-2.5 h-2.5 bg-background rounded-full" />}
                            </div>
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

      <div className="glass-card rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between sticky bottom-6 shadow-2xl bg-card/95 backdrop-blur z-10 border-t-4 border-t-primary gap-4">
        <div className="text-sm font-bold text-foreground">
          Progresso: <span className="text-primary">{completedCount}</span> de 28
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || completedCount < 28 || !selectedEmpId}
          size="lg"
          className="w-full sm:w-auto font-bold px-8 shadow-lg shadow-primary/20"
        >
          {isSubmitting ? 'Gerando Laudo Ipsativo...' : (
            <>Finalizar Avaliação DISC <Send className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
