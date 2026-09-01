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
    badgeStyle: 'bg-blue-100 text-blue-700 border-blue-200',
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
    badgeStyle: 'bg-blue-100 text-blue-700 border-blue-200',
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
    badgeStyle: 'bg-blue-100 text-blue-700 border-blue-200',
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
    badgeStyle: 'bg-blue-100 text-blue-700 border-blue-200',
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
    badgeStyle: 'bg-blue-100 text-blue-700 border-blue-200',
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
    badgeStyle: 'bg-amber-100 text-amber-800 border-amber-300',
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
    badgeStyle: 'bg-purple-100 text-purple-800 border-purple-300',
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
    badgeStyle: 'bg-teal-100 text-teal-800 border-teal-300',
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

export default function AutoAvaliacaoFit() {
  type Func = { id: string; nome: string; cargo: string; departamento?: string; foto_url?: string };
  type Cycle = { id: string; name: string };
  const [funcionarios, setFuncionarios] = useState<Func[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  
  const [selectedFunc, setSelectedFunc] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  
  const SCORE_COLUMNS = [
    { value: 1, label: 'Muito abaixo do esperado', short: 'Nota 1' },
    { value: 2, label: 'Abaixo do esperado', short: 'Nota 2' },
    { value: 3, label: 'Dentro do esperado', short: 'Nota 3' },
    { value: 4, label: 'Acima do esperado', short: 'Nota 4' },
    { value: 5, label: 'Muito acima do esperado', short: 'Nota 5' },
    { value: 0, label: 'Não Aplicável', short: 'N/A' },
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

  function isValidUUID(id?: string | null): boolean {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id.trim());
  }

  useEffect(() => {
    if (uidParam && isValidUUID(uidParam)) {
      setSelectedFunc(uidParam.trim());
    }
    if (cycleParam && isValidUUID(cycleParam)) {
      setSelectedCycle(cycleParam.trim());
    }
  }, [uidParam, cycleParam]);

  useEffect(() => {
    Promise.all([
      supabase.from('funcionarios').select('id, nome, cargo, departamento, foto_url').order('nome'),
      supabase.from('evaluation_cycles').select('id, name').order('start_date', { ascending: false })
    ]).then(([fRes, cRes]) => {
      if (fRes.data) {
        setFuncionarios(fRes.data as Func[]);
      }
      if (cRes.data) {
        const cycleList = cRes.data as Cycle[];
        setCycles(cycleList);
        // Fallback automatico para o primeiro ciclo valido se nao houver ou se for invalido
        if (cycleList.length > 0) {
          setSelectedCycle(prev => (isValidUUID(prev) ? prev : cycleList[0].id));
        }
      }
      setLoading(false);
    });
  }, []);

  const currentFunc = funcionarios.find(f => f.id === selectedFunc);
  const currentCycleObj = cycles.find(c => c.id === selectedCycle);

  const handleSubmit = async () => {
    if (!selectedFunc || !isValidUUID(selectedFunc)) {
      toast({ title: 'Selecione seu nome', description: 'Por favor, selecione seu nome na lista para identificar a avaliação.', variant: 'destructive' });
      return;
    }
    if (!selectedCycle || !isValidUUID(selectedCycle)) {
      toast({ title: 'Ciclo de avaliação não identificado', description: 'Selecione o ciclo de avaliação correspondente.', variant: 'destructive' });
      return;
    }
    if (Object.keys(scores).length < CRITERIA.length) {
      toast({ title: 'Responda todas as perguntas', description: `Você respondeu ${Object.keys(scores).length} de ${CRITERIA.length} perguntas.`, variant: 'destructive' });
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

      // Remove respostas anteriores da mesma autoavaliação para o ciclo atual se existirem
      await supabase
        .from('fit_cultural')
        .delete()
        .eq('employee_id', selectedFunc)
        .eq('cycle_id', selectedCycle)
        .eq('stage', 'autoavaliacao');

      const { error } = await supabase.from('fit_cultural').insert(inserts);
      
      if (error) {
        console.error("Erro Supabase:", error);
        throw error;
      }
      
      const validScores = Object.values(scores).filter(s => s > 0);
      if (validScores.length > 0) {
        try {
          const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
          const pct = Math.round((avg / 5) * 100);
          await supabase.from('funcionarios').update({ fit_cultural: pct }).eq('id', selectedFunc);
        } catch (updateErr) {
          console.warn("Aviso ao atualizar percentual resumido:", updateErr);
        }
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
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-2xl shadow-xl border border-border/50 max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Muito Obrigado!</h2>
          <p className="text-slate-600 text-sm mb-4">Sua autoavaliação de fit cultural foi registrada com sucesso e enviada ao seu gestor.</p>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-500 font-medium">
            Você já pode fechar esta aba ou janela.
          </div>
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
                          <td className="py-2 px-3 font-medium whitespace-nowrap">Muito abaixo do esperado (1)</td>
                          <td className="py-2 px-3">O comportamento esperado praticamente não é demonstrado, sendo necessária uma melhoria imediata.</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium whitespace-nowrap">Abaixo do esperado (2)</td>
                          <td className="py-2 px-3">O comportamento é apresentado apenas em algumas situações, porém ainda necessita de evolução.</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium whitespace-nowrap">Dentro do esperado (3)</td>
                          <td className="py-2 px-3">O colaborador atende às expectativas para a função, demonstrando o comportamento de forma consistente.</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium whitespace-nowrap">Acima do esperado (4)</td>
                          <td className="py-2 px-3">O comportamento é demonstrado com frequência, servindo como exemplo positivo para a equipe.</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium whitespace-nowrap">Muito acima do esperado (5)</td>
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
              <div className="text-center mb-6">
                <h1 className="text-3xl font-black tracking-tight text-primary bg-white/90 backdrop-blur inline-block px-8 py-2.5 rounded-full shadow-md border border-primary/10">
                  Autoavaliação Fit Cultural
                </h1>
              </div>

              {/* ═══ CARD DE IDENTIFICAÇÃO DO COLABORADOR NO TOPO ═══ */}
              {currentFunc ? (
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0 overflow-hidden">
                      {currentFunc.foto_url ? (
                        <img src={currentFunc.foto_url} alt={currentFunc.nome} className="w-full h-full object-cover" />
                      ) : (
                        currentFunc.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          Colaborador em Avaliação
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                        {currentFunc.nome}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                          {currentFunc.cargo}
                        </span>
                        {currentFunc.departamento && (
                          <span className="font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                            {currentFunc.departamento}
                          </span>
                        )}
                        {currentCycleObj && (
                          <span className="font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                            {currentCycleObj.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!uidParam && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFunc('')} className="text-xs text-slate-400 hover:text-slate-700">
                      Trocar nome
                    </Button>
                  )}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50 space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Quem é você?</Label>
                    <Select value={selectedFunc} onValueChange={setSelectedFunc}>
                      <SelectTrigger className="mt-1.5 h-12 bg-white text-slate-900 border-slate-200"><SelectValue placeholder="Selecione seu nome na lista..." /></SelectTrigger>
                      <SelectContent className="bg-white text-slate-900 border-slate-200">
                        {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome} - {f.cargo}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
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
              )}

        {selectedFunc && selectedCycle && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Header / Progresso */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Auto Avaliação</h4>
                  <p className="text-xs text-slate-500">O funcionário avalia a si mesmo</p>
                </div>
              </div>
              <div className="w-full sm:w-auto text-right">
                <div className="text-xs font-semibold text-slate-600 mb-1">
                  Progresso: {Object.keys(scores).length} de {CRITERIA.length} respondidos
                </div>
                <div className="w-full sm:w-48 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(Object.keys(scores).length / CRITERIA.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {CRITERIA_TOPICS.map((topic) => (
              <div key={topic.number} className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                {/* Cabeçalho do Tópico */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {topic.number}
                    </span>
                    <h3 className="font-bold text-slate-800 text-base">
                      {topic.number}. {topic.title}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${topic.badgeStyle}`}>
                    {topic.category}
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70">
                        <th className="text-left p-3 font-semibold text-slate-800 min-w-[280px]">Critério / Comportamento Observável</th>
                        {SCORE_COLUMNS.map(col => (
                          <th key={col.value} className="p-2 text-center font-semibold text-slate-800 min-w-[90px]">
                            <div className="text-xs leading-tight">{col.label}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{col.short}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topic.items.map((c, ci) => (
                        <tr key={c.label} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${ci % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                          <td className="p-3">
                            <span className="font-medium text-slate-800">{c.label}</span>
                            {c.desc && <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>}
                          </td>
                          {SCORE_COLUMNS.map(col => {
                            const isNA = col.value === 0;
                            const isSelected = scores[c.label] === col.value;
                            return (
                              <td key={col.value} className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => setScores(prev => ({ ...prev, [c.label]: col.value }))}
                                  className={`w-7 h-7 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${
                                    isSelected
                                      ? isNA
                                        ? 'border-amber-500 bg-amber-600 text-white shadow-md scale-110 font-bold'
                                        : 'border-primary bg-primary text-white shadow-md scale-110 font-bold'
                                      : 'border-slate-300 hover:border-primary/60 hover:bg-primary/10'
                                  }`}
                                  title={isNA ? 'Não Aplicável (Desconsidera da Média)' : `${col.label} ${col.short}`}
                                >
                                  {isSelected && (
                                    <span className="text-[10px]">{isNA ? 'N/A' : col.value}</span>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <Button 
              size="lg" 
              className="w-full h-14 text-lg rounded-xl mt-6 shadow-md" 
              disabled={submitting || Object.keys(scores).length < CRITERIA.length}
              onClick={handleSubmit}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {Object.keys(scores).length < CRITERIA.length 
                ? `Responda todas as perguntas (${Object.keys(scores).length}/${CRITERIA.length})` 
                : 'Enviar Autoavaliação'}
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
