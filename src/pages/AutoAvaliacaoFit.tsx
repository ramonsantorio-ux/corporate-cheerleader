import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';
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

export default function AutoAvaliacaoFit() {
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  
  const [selectedFunc, setSelectedFunc] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

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

      await supabase.from('fit_cultural').insert(inserts);
      setSubmitted(true);
      toast({ title: 'Avaliação enviada com sucesso!' });
    } catch (e: any) {
      toast({ title: 'Erro ao enviar', description: e.message, variant: 'destructive' });
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
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-sm"></div>
      
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-primary">Autoavaliação Fit Cultural</h1>
          <p className="text-muted-foreground mt-2 font-medium">Como você enxerga a sua própria aderência aos valores da empresa neste ciclo?</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50 space-y-4">
          <div>
            <Label className="text-base font-semibold">Quem é você?</Label>
            <Select value={selectedFunc} onValueChange={setSelectedFunc}>
              <SelectTrigger className="mt-1.5 h-12"><SelectValue placeholder="Selecione seu nome na lista..." /></SelectTrigger>
              <SelectContent>
                {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome} - {f.cargo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-base font-semibold">Qual ciclo você está avaliando?</Label>
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger className="mt-1.5 h-12"><SelectValue placeholder="Selecione o semestre/ciclo..." /></SelectTrigger>
              <SelectContent>
                {cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-3 font-semibold text-foreground min-w-[280px]">Critério</th>
                        {[
                          { value: 1, label: 'Muito abaixo', short: '(1)' },
                          { value: 2, label: 'Abaixo', short: '(2)' },
                          { value: 3, label: 'Dentro do esperado', short: '(3)' },
                          { value: 4, label: 'Acima do esperado', short: '(4)' },
                          { value: 5, label: 'Muito acima do esperado', short: '(5)' },
                        ].map(col => (
                          <th key={col.value} className="p-2 text-center font-medium text-foreground min-w-[90px]">
                            <div className="text-xs leading-tight">{col.label}</div>
                            <div className="text-[10px] text-muted-foreground">{col.short}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CRITERIA.map((c, ci) => (
                        <tr key={c.label} className={`border-b border-border/50 ${ci % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                          <td className="p-3">
                            <span className="font-medium text-foreground">{c.label}</span>
                            {c.desc && <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>}
                          </td>
                          {[1,2,3,4,5].map(note => (
                            <td key={note} className="p-2 text-center">
                              <button
                                onClick={() => setScores(prev => ({ ...prev, [c.label]: note }))}
                                className={`w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${
                                  scores[c.label] === note
                                    ? 'border-primary bg-primary shadow-md scale-110'
                                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/10'
                                }`}
                                title={`Nota ${note}`}
                              >
                                {scores[c.label] === note && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
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
      </div>
    </div>
  );
}
