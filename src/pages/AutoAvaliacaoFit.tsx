import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AutoAvaliacaoFit() {
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  
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
      supabase.from('evaluation_cycles').select('id, name').order('start_date', { ascending: false }),
      supabase.from('competencies').select('*').order('created_at')
    ]).then(([fRes, cRes, compRes]) => {
      if (fRes.data) setFuncionarios(fRes.data);
      if (cRes.data) setCycles(cRes.data);
      if (compRes.data) setCompetencies(compRes.data);
      setLoading(false);
    });
  }, []);

  const relevantCompetencies = selectedCycle 
    ? competencies.filter(c => !c.cycle_id || c.cycle_id === selectedCycle)
    : competencies;

  const handleSubmit = async () => {
    if (!selectedFunc || !selectedCycle) {
      toast({ title: 'Preencha seus dados', description: 'Selecione seu nome e o ciclo.', variant: 'destructive' });
      return;
    }
    if (Object.keys(scores).length < relevantCompetencies.length) {
      toast({ title: 'Responda todas as perguntas', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const inserts = relevantCompetencies.map(comp => ({
        employee_id: selectedFunc,
        criteria: comp.name,
        stage: 'autoavaliacao',
        score: scores[comp.id],
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-primary">Autoavaliação de Cultura</h1>
          <p className="text-muted-foreground mt-2">Como você enxerga a sua própria aderência aos valores da empresa neste ciclo?</p>
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
            {relevantCompetencies.length === 0 ? (
              <div className="text-center p-8 bg-white border border-border/50 rounded-2xl">
                <p>Nenhum critério definido para este ciclo.</p>
              </div>
            ) : (
              relevantCompetencies.map(c => (
                <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
                  <h4 className="font-bold text-lg text-foreground">{c.name}</h4>
                  {c.description && <p className="text-sm text-muted-foreground mt-1 mb-4">{c.description}</p>}
                  
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(note => (
                      <button
                        key={note}
                        onClick={() => setScores(prev => ({ ...prev, [c.id]: note }))}
                        className={`flex-1 py-3 text-lg font-bold rounded-xl border-2 transition-all ${scores[c.id] === note ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105' : 'bg-background hover:bg-muted border-border/50 text-foreground'}`}
                      >
                        {note}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium px-1">
                    <span>1 = Muito Baixo</span>
                    <span>5 = Muito Alto</span>
                  </div>
                </div>
              ))
            )}

            <Button 
              size="lg" 
              className="w-full h-14 text-lg rounded-xl mt-4" 
              disabled={submitting || Object.keys(scores).length < relevantCompetencies.length}
              onClick={handleSubmit}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {Object.keys(scores).length < relevantCompetencies.length ? 'Responda todas as perguntas' : 'Enviar Autoavaliação'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
