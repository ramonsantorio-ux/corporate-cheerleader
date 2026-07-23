import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Loader2, User, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { useSearchParams } from 'react-router-dom';
import loginBg from '@/assets/login-bg.jpg';

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

export default function AutoAvaliacaoFit() {
  type Func = { id: string; nome: string; cargo: string };
  type Cycle = { id: string; name: string };
  const [funcionarios, setFuncionarios] = useState<Func[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  
  const [selectedFunc, setSelectedFunc] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  
  const SCORE_COLUMNS = [
    { value: 1, label: 'Muito abaixo', short: '(1)' },
    { value: 2, label: 'Abaixo', short: '(2)' },
    { value: 3, label: 'Dentro do esperado', short: '(3)' },
    { value: 4, label: 'Acima do esperado', short: '(4)' },
    { value: 5, label: 'Muito acima do esperado', short: '(5)' },
  ];

  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [acceptedGuide, setAcceptedGuide] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const uidParam = searchParams.get('uid');
  const cycleParam = searchParams.get('cycle');

  useEffect(() => {
    if (uidParam) {
      setSelectedFunc(uidParam);
    }
    if (cycleParam) {
      setSelectedCycle(cycleParam);
    }
  }, [uidParam, cycleParam]);

  useEffect(() => {
    Promise.all([
      supabase.from('funcionarios').select('id, nome, cargo').order('nome'),
      supabase.from('evaluation_cycles').select('id, name').order('start_date', { ascending: false })
    ]).then(([fRes, cRes]) => {
      if (fRes.data) setFuncionarios(fRes.data);
      if (cRes.data) setCycles(cRes.data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async () => {
    if (!selectedFunc || !selectedCycle) {
      toast({ title: 'Preencha seus dados', description: 'Selecione seu nome e o ciclo.', variant: 'destructive' });
      return;
    }
    if (Object.keys(scores).length < CRITERIA.length) {
      toast({ title: 'Responda todas as perguntas', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const inserts = CRITERIA.map(comp => ({
        employee_id: selectedFunc,
        criteria: comp.label,
        stage: 'autoavaliacao',
        score: scores[comp.label],
        cycle_id: selectedCycle
      }));

      const { error } = await supabase.from('fit_cultural').insert(inserts);
      
      if (error) {
        console.error("Erro Supabase:", error);
        throw error;
      }
      
      setSubmitted(true);
      toast({ title: 'Avaliação enviada com sucesso!' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      console.error(e);
      toast({ title: 'Erro ao enviar', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-2xl shadow-sm border border-border/50 max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Muito Obrigado!</h2>
          <p className="text-muted-foreground mb-6">Sua autoavaliação de fit cultural foi registrada com sucesso e enviada ao seu gestor.</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">Fazer outra avaliação</Button>
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
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary mb-6 text-center">FIT CULTURAL<br/><span className="text-2xl font-bold text-slate-700">Guia de Avaliação</span></h1>
              
              <div className="prose prose-slate max-w-none space-y-6 text-slate-600 text-sm sm:text-base h-[50vh] overflow-y-auto pr-4 mb-8 custom-scrollbar">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">O que é o FIT Cultural?</h3>
                  <p>O FIT Cultural é uma avaliação comportamental que tem como objetivo verificar o quanto as atitudes e comportamentos dos colaboradores estão alinhados aos valores, princípios e à cultura da empresa.</p>
                  <p className="mt-2">Essa avaliação complementa a análise de desempenho técnico, contribuindo para o desenvolvimento profissional e para a construção de um ambiente de trabalho mais seguro, ético, colaborativo e produtivo.</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Como funciona?</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>A avaliação será realizada semestralmente.</li>
                    <li>Ela será aplicada pelo gestor direto do colaborador.</li>
                    <li>O questionário é composto por critérios relacionados ao comportamento, postura profissional e alinhamento com a cultura da empresa.</li>
                    <li>Para cada critério, deverá ser selecionada uma das cinco opções de avaliação.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">Escala de Avaliação</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="py-2 px-3 font-semibold text-slate-800 min-w-[120px]">Avaliação</th>
                          <th className="py-2 px-3 font-semibold text-slate-800">Significado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-2 px-3 font-medium whitespace-nowrap">Muito abaixo (1)</td>
                          <td className="py-2 px-3">O comportamento esperado praticamente não é demonstrado, sendo necessária uma melhoria imediata.</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium whitespace-nowrap">Abaixo (2)</td>
                          <td className="py-2 px-3">O comportamento é apresentado apenas em algumas situações, porém ainda necessita de evolução.</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium whitespace-nowrap">Dentro do esperado (3)</td>
                          <td className="py-2 px-3">O colaborador atende às expectativas para a função, demonstrando o comportamento de forma consistente.</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium whitespace-nowrap">Acima (4)</td>
                          <td className="py-2 px-3">O comportamento é demonstrado com frequência, servindo como exemplo positivo para a equipe.</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium whitespace-nowrap">Muito acima (5)</td>
                          <td className="py-2 px-3">O colaborador é uma referência no critério avaliado, superando constantemente as expectativas.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Exemplo de Avaliação</h3>
                  <p><strong>Critério:</strong> Atua com princípios éticos</p>
                  <p className="mb-3"><strong>Descrição:</strong> Não compactua com corrupção, uso indevido de recursos da empresa ou qualquer prática inadequada.</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li><strong>(1):</strong> Utiliza recursos da empresa de forma inadequada e apresenta comportamentos incompatíveis com os princípios éticos.</li>
                    <li><strong>(2):</strong> Demonstra algumas atitudes inadequadas ou necessita de orientação frequente sobre condutas éticas.</li>
                    <li><strong>(3):</strong> Cumpre as normas e age de forma ética em suas atividades diárias.</li>
                    <li><strong>(4):</strong> Além de agir corretamente, incentiva os colegas a seguirem as normas e boas práticas.</li>
                    <li><strong>(5):</strong> É referência em ética e integridade, influenciando positivamente toda a equipe.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Critérios Avaliados</h3>
                  <p className="mb-2">Durante o FIT Cultural serão avaliados os seguintes aspectos:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Preocupação com a empresa como um todo;</li>
                    <li>Postura voltada ao desenvolvimento da equipe;</li>
                    <li>Promoção de um ambiente de trabalho saudável e inclusivo;</li>
                    <li>Atitudes voltadas à saúde, segurança e meio ambiente;</li>
                    <li>Uso consciente dos recursos da empresa;</li>
                    <li>Atuação com princípios éticos;</li>
                    <li>Alinhamento aos 4 C's da empresa (ou equivalente);</li>
                    <li>Desenvolvimento pessoal e profissional;</li>
                    <li>Busca pelo desenvolvimento sustentável do negócio.</li>
                  </ul>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-primary-foreground">
                  <h3 className="text-lg font-bold text-primary mb-2">Atenção ao responder</h3>
                  <p className="text-slate-700 font-medium mb-2">A avaliação do FIT Cultural possui impacto no seu desenvolvimento profissional e tem como objetivo identificar pontos fortes e oportunidades de melhoria.</p>
                  <p className="text-slate-700 mb-2">Antes de responder, considere o seu comportamento durante todo o período avaliado e reflita sobre como suas atitudes contribuíram para a equipe, para a empresa e para a construção de um ambiente de trabalho seguro, respeitoso e colaborativo.</p>
                  <p className="text-slate-700 font-bold">Lembre-se: Esta é uma avaliação do seu comportamento e da forma como você aplica os valores da empresa no dia a dia. Responda com responsabilidade, honestidade e atenção a cada critério apresentado.</p>
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
                <h1 className="text-3xl font-black tracking-tight text-primary bg-white/80 backdrop-blur inline-block px-6 py-2 rounded-full shadow-sm">Autoavaliação Fit Cultural</h1>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50 space-y-4">
                {!uidParam && (
                  <div>
                    <Label className="text-base font-semibold">Quem é você?</Label>
            <Select value={selectedFunc} onValueChange={setSelectedFunc}>
              <SelectTrigger className="mt-1.5 h-12 bg-white text-slate-900 border-slate-200"><SelectValue placeholder="Selecione seu nome na lista..." /></SelectTrigger>
              <SelectContent className="bg-white text-slate-900 border-slate-200">
                {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome} - {f.cargo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
          
          {!cycleParam && (
            <div>
              <Label className="text-base font-semibold">Qual ciclo você está avaliando?</Label>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger className="mt-1.5 h-12 bg-white text-slate-900 border-slate-200"><SelectValue placeholder="Selecione o semestre/ciclo..." /></SelectTrigger>
                <SelectContent className="bg-white text-slate-900 border-slate-200">
                  {cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {selectedFunc && selectedCycle && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {CRITERIA.length === 0 ? (
              <div className="text-center p-8 bg-white border border-border/50 rounded-2xl">
                <p>Nenhum critério definido para este ciclo.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border bg-primary/5 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Auto Avaliação</h4>
                    <p className="text-xs text-muted-foreground">O funcionário avalia a si mesmo</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 !bg-slate-100">
                        <th className="text-left p-3 font-semibold !text-slate-900 min-w-[280px]">Critério</th>
                        {SCORE_COLUMNS.map(col => (
                          <th key={col.value} className="p-2 text-center font-medium !text-slate-900 min-w-[90px]">
                            <div className="text-xs leading-tight">{col.label}</div>
                            <div className="text-[10px] text-muted-foreground">{col.short}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CRITERIA.map((c, ci) => (
                        <tr key={c.label} className={`border-b border-slate-200 ${ci % 2 === 0 ? '!bg-white' : '!bg-slate-50'}`}>
                          <td className="p-3">
                            <span className="font-medium !text-slate-900">{c.label}</span>
                            {c.desc && <p className="text-xs !text-slate-500 mt-0.5">{c.desc}</p>}
                          </td>
                          {SCORE_COLUMNS.map(col => (
                            <td key={col.value} className="p-2 text-center">
                              <button
                                onClick={() => setScores(prev => ({ ...prev, [c.label]: col.value }))}
                                className={`w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${
                                  scores[c.label] === col.value
                                    ? 'border-primary bg-primary shadow-md scale-110'
                                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/10'
                                }`}
                                title={`${col.label} ${col.short}`}
                              >
                                {scores[c.label] === col.value && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Button 
              size="lg" 
              className="w-full h-14 text-lg rounded-xl mt-4" 
              disabled={submitting || Object.keys(scores).length < CRITERIA.length}
              onClick={handleSubmit}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {Object.keys(scores).length < CRITERIA.length ? 'Responda todas as perguntas' : 'Enviar Autoavaliação'}
            </Button>
          </motion.div>
        )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
