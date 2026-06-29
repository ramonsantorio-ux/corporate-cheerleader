import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Trash2, TrendingUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { FastInput } from '@/components/ui/fast-input';
import { Label } from '@/components/ui/label';
import { FastTextarea } from '@/components/ui/fast-textarea';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

interface Competency {
  id: string;
  name: string;
  description: string | null;
  cycle_id: string | null;
  created_at: string;
}

interface Cycle {
  id: string;
  name: string;
}

interface Funcionario {
  id: string; nome: string; cargo: string;
}

interface Evaluation {
  id: string; cycle_id: string; evaluated_name: string; status: string; completed_at: string | null;
}

interface EvaluationCycle {
  id: string; end_date: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Competencias() {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [evalCycles, setEvalCycles] = useState<EvaluationCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [evalStep, setEvalStep] = useState(1);
  const [evalForm, setEvalForm] = useState({ employee_id: '', cycle_id: '' });
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [expandedCargo, setExpandedCargo] = useState<string | null>(null);
  const { toast } = useToast();

  const standardCriteria = [
    { id: 'c1', name: 'Alinhamento aos Valores', description: 'Atua de acordo com os princípios e valores da empresa.' },
    { id: 'c2', name: 'Trabalho em Equipe', description: 'Colabora de forma construtiva e respeitosa com os colegas.' },
    { id: 'c3', name: 'Comunicação', description: 'Comunica-se de forma clara, objetiva e transparente.' },
    { id: 'c4', name: 'Foco em Resultados', description: 'Demonstra dedicação e entrega resultados com qualidade.' },
    { id: 'c5', name: 'Adaptabilidade e Inovação', description: 'Lida bem com mudanças e propõe melhorias.' },
  ];
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetchCompetencies(),
      fetchCycles(),
      supabase.from('funcionarios').select('id, nome, cargo').then(({ data }) => { if (data) setFuncionarios(data as Funcionario[]); }),
      supabase.from('evaluations').select('id, cycle_id, evaluated_name, status, completed_at').then(({ data }) => { if (data) setEvaluations(data as Evaluation[]); }),
      supabase.from('evaluation_cycles').select('id, end_date').then(({ data }) => { if (data) setEvalCycles(data as EvaluationCycle[]); }),
    ]);
  }, []);

  async function fetchCompetencies() {
    const { data } = await supabase.from('competencies').select('*').order('created_at', { ascending: false });
    if (data) setCompetencies(data as Competency[]);
    setLoading(false);
  }

  async function fetchCycles() {
    const { data } = await supabase.from('evaluation_cycles').select('id, name');
    if (data) setCycles(data as Cycle[]);
  }

  const cargoStats = useMemo(() => {
    // Normalize cargo: remove trailing Roman numerals/levels and unify gender variants (Técnica/Técnico)
    const normalizeCargo = (cargo: string) => {
      let normalized = cargo.replace(/\s+(I{1,3}|IV|V|VI{0,3}|[0-9]+)\s*$/i, '').trim();
      normalized = normalized.replace(/\bTécnica\b/gi, 'Técnico');
      return normalized;
    };

    const cargos: Record<string, { cargo: string; total: number; realizados: number; noPrazo: number; pendentes: number; pendenteNomes: { id: string; nome: string }[] }> = {};
    funcionarios.forEach(f => {
      const cargoKey = normalizeCargo(f.cargo);
      if (!cargos[cargoKey]) cargos[cargoKey] = { cargo: cargoKey, total: 0, realizados: 0, noPrazo: 0, pendentes: 0, pendenteNomes: [] };
      cargos[cargoKey].total++;
      const empEvals = evaluations.filter(e => e.evaluated_name.toLowerCase() === f.nome.toLowerCase());
      if (empEvals.length === 0) {
        cargos[cargoKey].pendentes++;
        cargos[cargoKey].pendenteNomes.push({ id: f.id, nome: f.nome });
      } else {
        const completed = empEvals.filter(e => e.status === 'completed');
        if (completed.length > 0) {
          cargos[cargoKey].realizados++;
          const latestCompleted = completed[completed.length - 1];
          const cycle = evalCycles.find(c => c.id === latestCompleted.cycle_id);
          if (cycle && latestCompleted.completed_at && new Date(latestCompleted.completed_at) <= new Date(cycle.end_date)) {
            cargos[cargoKey].noPrazo++;
          }
        } else {
          cargos[cargoKey].pendentes++;
          cargos[cargoKey].pendenteNomes.push({ id: f.id, nome: f.nome });
        }
      }
    });
    return Object.values(cargos).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [funcionarios, evaluations, evalCycles]);

  const chartData = cargoStats.map(c => ({
    cargo: c.cargo.length > 18 ? c.cargo.slice(0, 16) + '…' : c.cargo,
    Realizados: c.realizados,
    'No Prazo': c.noPrazo,
    Pendentes: c.pendentes,
  }));

  async function createCompetency() {
    if (!form.name) {
      toast({ title: 'Informe o nome da competência', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('competencies').insert([{
      name: form.name,
      description: form.description || null,
      cycle_id: form.cycle_id || null,
    }]);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Competência criada!' });
      setDialogOpen(false);
      setForm({ name: '', description: '', cycle_id: '' });
      fetchCompetencies();
    }
  }

  async function submitEvaluation() {
    if (!evalForm.employee_id) return toast({ title: 'Selecione um colaborador', variant: 'destructive' });
    if (!evalForm.cycle_id) return toast({ title: 'Selecione um ciclo', variant: 'destructive' });
    
    // Validar se todas as notas foram dadas
    for (const c of standardCriteria) {
      if (!evalScores[c.id]) {
         return toast({ title: 'Por favor, avalie todas as competências.', variant: 'destructive' });
      }
    }

    const inserts = standardCriteria.map(c => ({
      employee_id: evalForm.employee_id,
      criteria: c.name,
      score: evalScores[c.id],
      stage: evalForm.cycle_id
    }));

    const { error } = await supabase.from('fit_cultural').insert(inserts);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      const avg = Math.round(Object.values(evalScores).reduce((a,b)=>a+b,0) / standardCriteria.length);
      await supabase.from('funcionarios').update({ fit_cultural: avg }).eq('id', evalForm.employee_id);
      
      toast({ title: 'Avaliação de Fit Cultural concluída com sucesso!' });
      setEvalDialogOpen(false);
      setEvalStep(1);
      setEvalForm({ employee_id: '', cycle_id: '' });
      setEvalScores({});
      
      const { data } = await supabase.from('evaluations').select('id, cycle_id, evaluated_name, status, completed_at');
      if (data) setEvaluations(data as Evaluation[]);
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fit Cultural</h1>
          <p className="text-muted-foreground text-sm mt-1">Avalie de forma simples e rápida o fit cultural da equipe</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setEvalDialogOpen(true)}>
            <Target className="w-4 h-4 mr-2" /> Avaliar Colaborador
          </Button>

          <Dialog open={evalDialogOpen} onOpenChange={open => { setEvalDialogOpen(open); if(!open){ setEvalStep(1); setEvalScores({}); setEvalForm({ employee_id: '', cycle_id: '' }); } }}>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Avaliação de Fit Cultural</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                {evalStep === 1 ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Colaborador</Label>
                      <Select value={evalForm.employee_id} onValueChange={v => setEvalForm({ ...evalForm, employee_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione quem será avaliado..." /></SelectTrigger>
                        <SelectContent>{funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome} - {f.cargo}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Ciclo de Avaliação</Label>
                      <Select value={evalForm.cycle_id} onValueChange={v => setEvalForm({ ...evalForm, cycle_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione o ciclo..." /></SelectTrigger>
                        <SelectContent>{cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    
                    <Button onClick={() => {
                      if(!evalForm.employee_id || !evalForm.cycle_id) return toast({ title: 'Preencha os campos', variant: 'destructive' });
                      setEvalStep(2);
                    }} className="w-full mt-4">Iniciar Questionário</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground mb-4">Avalie a aderência do colaborador para cada critério da nossa cultura (1 = Muito Baixa, 5 = Muito Alta).</p>
                    <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-2">
                      {standardCriteria.map(c => (
                        <div key={c.id} className="p-4 bg-muted/30 border border-border/50 rounded-lg">
                          <h4 className="font-semibold text-foreground text-sm">{c.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 mb-3">{c.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {[1,2,3,4,5].map(note => (
                              <button
                                key={note}
                                onClick={() => setEvalScores(prev => ({ ...prev, [c.id]: note }))}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md border transition-colors ${evalScores[c.id] === note ? 'bg-primary text-primary-foreground border-primary scale-105 shadow-sm' : 'bg-background hover:bg-muted border-border/50 text-foreground'}`}
                              >
                                {note}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-2 border-t border-border/50">
                      <Button variant="outline" onClick={() => setEvalStep(1)} className="flex-1">Voltar</Button>
                      <Button onClick={submitEvaluation} className="flex-1">Concluir Avaliação</Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Avaliações por Cargo Chart */}
      {cargoStats.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="corporate-section">
          <div className="corporate-section-header">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Avaliações por Cargo</h2>
            </div>
            <span className="text-xs text-muted-foreground">{cargoStats.length} cargos</span>
          </div>
          <div className="corporate-section-body">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="cargo" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Bar dataKey="Realizados" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="No Prazo" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Pendentes" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Pendentes expandable list */}
            {cargoStats.some(c => c.pendentes > 0) && (
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Colaboradores Pendentes</p>
                <div className="space-y-1">
                  {cargoStats.filter(c => c.pendentes > 0).map(c => (
                    <div key={c.cargo} className="rounded-lg border border-border overflow-hidden">
                      <button onClick={() => setExpandedCargo(expandedCargo === c.cargo ? null : c.cargo)}
                        className="w-full flex items-center justify-between text-left px-4 py-2.5 hover:bg-muted/30 transition-colors">
                        <span className="text-sm font-medium text-foreground">{c.cargo}</span>
                        <div className="flex items-center gap-2">
                          <span className="corporate-badge bg-destructive/10 text-destructive">{c.pendentes}</span>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedCargo === c.cargo ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {expandedCargo === c.cargo && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          className="border-t border-border bg-muted/20 px-4 py-2 space-y-1">
                          {c.pendenteNomes.map(emp => (
                            <button key={emp.id} onClick={() => navigate(`/funcionario/${emp.id}?tab=fit-cultural`)}
                              className="block text-sm text-primary hover:underline cursor-pointer py-0.5 text-left">
                              • {emp.nome}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}


    </div>
  );
}
