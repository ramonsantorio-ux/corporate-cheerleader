import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Loader2, User, ChevronRight, Check, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import loginBg from '@/assets/login-bg.jpg';
import { POTENCIAL_TOPICS } from '@/components/potencial/PotencialSection';

const SCORE_COLUMNS = [
  { value: 1, label: 'Muito abaixo', short: '(1)' },
  { value: 2, label: 'Abaixo', short: '(2)' },
  { value: 3, label: 'Dentro do esperado', short: '(3)' },
  { value: 4, label: 'Acima do esperado', short: '(4)' },
  { value: 5, label: 'Muito acima / Excepcional', short: '(5)' },
];

export default function AutoAvaliacaoPotencial() {
  const [searchParams] = useSearchParams();
  const preSelectedEmployeeId = searchParams.get('emp') || searchParams.get('employee_id');
  const preSelectedCycleId = searchParams.get('cycle') || searchParams.get('cycle_id');

  const [funcionarios, setFuncionarios] = useState<{ id: string; nome: string; cargo?: string }[]>([]);
  const [cycles, setCycles] = useState<{ id: string; name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>(preSelectedEmployeeId || '');
  const [selectedCycle, setSelectedCycle] = useState<string>(preSelectedCycleId || '');
  
  const [currentStep, setCurrentStep] = useState(0); // 0 = Seleção, 1..5 = Tópicos, 6 = Concluído
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('funcionarios').select('id, nome, cargo').order('nome').then(({ data }) => {
      if (data) setFuncionarios(data);
    });
    supabase.from('evaluation_cycles').select('id, name').order('created_at', { ascending: false }).then(({ data }) => {
      if (data && data.length > 0) {
        setCycles(data);
        if (!preSelectedCycleId) setSelectedCycle(data[0].id);
      }
    });
  }, [preSelectedCycleId]);

  const handleStart = () => {
    if (!selectedEmployee) {
      toast({ title: 'Atenção', description: 'Selecione o seu nome para iniciar.', variant: 'destructive' });
      return;
    }
    setCurrentStep(1);
  };

  const handleScoreChange = (criteriaLabel: string, scoreVal: number) => {
    setScores(prev => ({ ...prev, [criteriaLabel]: scoreVal }));
  };

  const currentTopic = POTENCIAL_TOPICS[currentStep - 1];

  const isCurrentTopicComplete = () => {
    if (!currentTopic) return false;
    return currentTopic.items.every(item => scores[item.label] != null);
  };

  const handleNext = () => {
    if (!isCurrentTopicComplete()) {
      toast({ title: 'Atenção', description: 'Responda a todos os critérios antes de avançar.', variant: 'destructive' });
      return;
    }
    if (currentStep < POTENCIAL_TOPICS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      setCurrentStep(0);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const inserts = Object.entries(scores).map(([criteria, score]) => ({
        employee_id: selectedEmployee,
        criteria,
        stage: 'potencial_autoavaliacao',
        score,
        cycle_id: selectedCycle || null,
      }));

      for (const ins of inserts) {
        const { data: existing } = await supabase
          .from('fit_cultural')
          .select('id')
          .eq('employee_id', selectedEmployee)
          .eq('criteria', ins.criteria)
          .eq('stage', 'potencial_autoavaliacao')
          .maybeSingle();

        if (existing) {
          await supabase.from('fit_cultural').update({ score: ins.score, updated_at: new Date().toISOString() }).eq('id', existing.id);
        } else {
          await supabase.from('fit_cultural').insert(ins);
        }
      }

      setSubmitted(true);
      setCurrentStep(POTENCIAL_TOPICS.length + 1);
      toast({ title: 'Autoavaliação de Potencial Concluída!', description: 'Suas respostas foram registradas com sucesso.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao enviar', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const selectedFuncionario = funcionarios.find(f => f.id === selectedEmployee);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-950 font-sans">
      {/* Background with blur and image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-indigo-950/40 backdrop-blur-sm" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-3xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
        
        {/* Step 0: Welcome / Employee Select */}
        {currentStep === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-1 shadow-inner">
                <Zap className="w-8 h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Autoavaliação de Potencial
              </h1>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Mapeamento de agilidade de aprendizado, elasticidade de escopo, resiliência e visão de futuro.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Identifique-se</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="h-11 bg-slate-800/80 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione o seu nome..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {funcionarios.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nome} {f.cargo ? `— (${f.cargo})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {cycles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ciclo de Avaliação</Label>
                  <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                    <SelectTrigger className="h-11 bg-slate-800/80 border-slate-700 text-white">
                      <SelectValue placeholder="Selecione o ciclo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cycles.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-900/50 space-y-2 text-xs text-indigo-300">
                <p className="font-bold flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-indigo-400" /> Como funciona:</p>
                <p className="text-slate-400">Você responderá a 5 blocos de critérios com notas de 1 (Muito abaixo) a 5 (Muito acima / Excepcional). Seja sincero e reflexivo sobre sua capacidade de crescimento e entrega futura.</p>
              </div>

              <Button onClick={handleStart} className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all">
                Iniciar Questionário de Potencial <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Steps 1..5: Topic Questions */}
        {currentStep >= 1 && currentStep <= POTENCIAL_TOPICS.length && currentTopic && (
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            
            {/* Header / Progress */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  Etapa {currentStep} de {POTENCIAL_TOPICS.length}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                  {currentTopic.number}. {currentTopic.title}
                </h2>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${currentTopic.badgeStyle}`}>
                {currentTopic.category}
              </span>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {currentTopic.items.map((item, idx) => {
                const currentScore = scores[item.label];
                return (
                  <div key={item.label} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{idx + 1}. {item.label}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                    </div>

                    {/* Scale Selector */}
                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-2">
                      {SCORE_COLUMNS.map(col => {
                        const isSelected = currentScore === col.value;
                        return (
                          <button
                            key={col.value}
                            type="button"
                            onClick={() => handleScoreChange(item.label, col.value)}
                            className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-[1.02] ring-2 ring-indigo-400/30'
                                : 'bg-slate-800 border-slate-700/80 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-750'
                            }`}
                          >
                            <span className="text-sm font-black">{col.value}</span>
                            <span className="text-[10px] leading-tight opacity-80 hidden sm:block mt-0.5">{col.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button variant="outline" onClick={handlePrev} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Voltar
              </Button>

              <Button
                onClick={handleNext}
                disabled={!isCurrentTopicComplete() || loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-md shadow-indigo-600/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : currentStep === POTENCIAL_TOPICS.length ? 'Finalizar e Enviar' : 'Próximo Bloco'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 6: Completed */}
        {submitted && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-white">Autoavaliação Registrada!</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Obrigado, <strong className="text-white">{selectedFuncionario?.nome}</strong>. Suas respostas foram salvas com sucesso e serão consideradas no comitê de calibração do Nine Box.
            </p>
            <div className="pt-4">
              <Button onClick={() => window.location.reload()} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Responder para outro colaborador
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
