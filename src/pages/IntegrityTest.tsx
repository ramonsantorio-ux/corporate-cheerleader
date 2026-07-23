import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import loginBg from '@/assets/login-bg.jpg';

// 15 perguntas baseadas na Escala de Integridade e Honestidade-Humildade (HEXACO)
const integrityQuestions = [
  { id: 1, text: "Eu seguiria todas as regras da empresa mesmo se tivesse certeza de que ninguém me veria quebrando-as.", inverted: false },
  { id: 2, text: "A maioria das pessoas trapacearia em uma avaliação se soubessem que não seriam pegas.", inverted: true },
  { id: 3, text: "Se um colega de trabalho levar o crédito por uma ideia minha, eu resolveria o problema conversando com ele em vez de tentar prejudicá-lo depois.", inverted: false },
  { id: 4, text: "Pequenas mentiras no ambiente de trabalho são aceitáveis se isso ajudar a equipe a atingir uma meta importante.", inverted: true },
  { id: 5, text: "Eu devolveria um troco a mais que recebi no refeitório, mesmo que fosse um valor insignificante.", inverted: false },
  { id: 6, text: "As pessoas que afirmam que nunca mentiram no trabalho provavelmente estão mentindo.", inverted: true },
  { id: 7, text: "Eu me sentiria culpado em usar os recursos e equipamentos da empresa para fazer trabalhos particulares no meu tempo livre.", inverted: false },
  { id: 8, text: "Não há problema em exagerar um pouco no relatório de despesas se você trabalhou horas a mais que não foram pagas.", inverted: true },
  { id: 9, text: "Eu reportaria um erro grave que cometi ao meu gestor, mesmo sabendo que isso poderia atrasar a minha promoção.", inverted: false },
  { id: 10, text: "Se um colega estiver violando uma regra séria de segurança, eu fingiria que não vi para não causar confusão.", inverted: true },
  { id: 11, text: "Eu acredito que a honestidade deve vir antes do lucro, mesmo em tempos de crise para a empresa.", inverted: false },
  { id: 12, text: "Algumas regras corporativas são estúpidas e foram feitas para serem ignoradas por quem sabe o que está fazendo.", inverted: true },
  { id: 13, text: "Mantenho o sigilo de informações confidenciais mesmo quando converso com meus amigos mais próximos fora do trabalho.", inverted: false },
  { id: 14, text: "Se um cliente deixar algo valioso na minha mesa por acidente e ninguém souber, é o problema do cliente e não meu.", inverted: true },
  { id: 15, text: "Sempre assumo a responsabilidade por meus atrasos ou falhas em vez de culpar o trânsito ou a internet.", inverted: false },
];

export default function IntegrityTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  type Employee = { id: string; nome: string; cargo: string };
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(id || '');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    supabase.from('funcionarios').select('id, nome, cargo').order('nome')
      .then(({ data }) => {
        if (data) setEmployees(data);
      });
  }, []);

  const handleSelect = (questionId: number, score: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }));
  };

  const calculateScore = () => {
    let totalScore = 0;
    
    integrityQuestions.forEach(q => {
      const answer = answers[q.id];
      if (answer) {
        // Se a pergunta for invertida, a pontuação inverte (1 vira 5, 5 vira 1)
        const finalScore = q.inverted ? (6 - answer) : answer;
        totalScore += finalScore;
      }
    });

    // Pontuação máxima: 75 (15 * 5). Min: 15.
    const percentage = Math.round((totalScore / 75) * 100);
    
    let level = 'Médio';
    if (percentage >= 80) level = 'Alto';
    else if (percentage < 60) level = 'Baixo';

    return {
      totalScore,
      percentage,
      level,
      rawAnswers: answers
    };
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < integrityQuestions.length) {
      toast({ title: 'Atenção', description: 'Por favor, responda todas as perguntas antes de finalizar.', variant: 'destructive' });
      return;
    }
    if (!selectedEmpId) {
      toast({ title: 'Atenção', description: 'Selecione um funcionário para salvar o teste.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const result = calculateScore();
    
    try {
      const { error } = await supabase.from('assessment_results').insert({
        user_id: selectedEmpId,
        type: 'integrity',
        result_data: result
      });
      if (error) {
        console.error(error);
        localStorage.setItem(`integrity_${selectedEmpId}`, JSON.stringify(result));
      }
    } catch (e) {
      console.error(e);
      localStorage.setItem(`integrity_${selectedEmpId}`, JSON.stringify(result));
    }
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-2xl shadow-sm border border-border/50 max-w-md w-full">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Muito Obrigado!</h2>
          <p className="text-muted-foreground mb-6">Sua avaliação de Integridade e Confiabilidade foi registrada com sucesso.</p>
          <Button onClick={() => navigate('/assessments')} variant="outline" className="w-full">Voltar para Central</Button>
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
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
          <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => navigate('/assessments')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">Teste de Integridade e Confiança</span>
          </div>
        </div>

        {!agreed ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-border/50">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-800">Instruções da Avaliação</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Este teste foi desenhado para entender a sua perspectiva sobre ética e integridade no ambiente de trabalho. 
                Não existem respostas absolutamente certas ou erradas, pois buscamos entender o seu perfil moral e como você reage a dilemas cotidianos.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex gap-4">
                  <Shield className="w-6 h-6 text-blue-500 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Seja Autêntico</h3>
                    <p className="text-sm text-slate-600">Responda o que você realmente pensa, e não o que acha que a empresa quer ouvir. A autenticidade é o fator mais importante aqui.</p>
                  </div>
                </div>
              </div>

              {!id && (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Identifique-se (Seu Nome):</label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                  >
                    <option value="">Selecione quem você é...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.nome} - {e.cargo}</option>
                    ))}
                  </select>
                </div>
              )}

              <Button onClick={() => {
                if (!selectedEmpId) toast({title: "Identificação", description: "Selecione seu nome primeiro.", variant: 'destructive'});
                else setAgreed(true);
              }} className="w-full" size="lg">
                Compreendi e quero iniciar o teste
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6 pb-20">
            {integrityQuestions.map((q, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.05 }}
                key={q.id} 
                className="bg-white rounded-xl shadow-sm border border-border/50 p-6"
              >
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-medium text-slate-800 mb-4">{q.text}</p>
                    
                    <div className="grid grid-cols-5 gap-2 mt-4">
                      <button onClick={() => handleSelect(q.id, 1)} className={`py-3 px-2 rounded-lg text-sm font-medium transition-colors border ${answers[q.id] === 1 ? 'bg-red-500 text-white border-red-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}>Discordo<br/>Totalmente</button>
                      <button onClick={() => handleSelect(q.id, 2)} className={`py-3 px-2 rounded-lg text-sm font-medium transition-colors border ${answers[q.id] === 2 ? 'bg-orange-400 text-white border-orange-500' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}>Discordo</button>
                      <button onClick={() => handleSelect(q.id, 3)} className={`py-3 px-2 rounded-lg text-sm font-medium transition-colors border ${answers[q.id] === 3 ? 'bg-yellow-400 text-white border-yellow-500' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}>Neutro</button>
                      <button onClick={() => handleSelect(q.id, 4)} className={`py-3 px-2 rounded-lg text-sm font-medium transition-colors border ${answers[q.id] === 4 ? 'bg-blue-400 text-white border-blue-500' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}>Concordo</button>
                      <button onClick={() => handleSelect(q.id, 5)} className={`py-3 px-2 rounded-lg text-sm font-medium transition-colors border ${answers[q.id] === 5 ? 'bg-green-500 text-white border-green-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}>Concordo<br/>Totalmente</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="sticky bottom-4 z-20 flex justify-end">
              <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="shadow-2xl shadow-blue-500/20 px-8">
                {isSubmitting ? 'Salvando...' : 'Finalizar Teste e Ver Resultado'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
