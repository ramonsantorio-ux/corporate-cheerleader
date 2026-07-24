import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Trash2, TrendingUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { FastInput } from '@/components/ui/fast-input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FitCulturalSection from '@/components/fit-cultural/FitCulturalSection';
import { FastTextarea } from '@/components/ui/fast-textarea';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
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

interface TooltipEntry { name: string; value: number | string; color?: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string; }
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry) => (
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
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [evalCycles, setEvalCycles] = useState<EvaluationCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [evalStep, setEvalStep] = useState(1);
  const [evalForm, setEvalForm] = useState({ employee_id: '', cycle_id: '' });
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [filterCycle, setFilterCycle] = useState('all');
  const [fitCulturalAnswers, setFitCulturalAnswers] = useState<{employee_id: string, stage: string}[]>([]);
  
  // States para a avaliação inline de 4 etapas
  const [selectedEvalEmployee, setSelectedEvalEmployee] = useState<string | null>(null);
  const [selectedEvalCycle, setSelectedEvalCycle] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', cycle_id: '' });
  const [expandedCargo, setExpandedCargo] = useState<string | null>(null);
  const [expandedCargoRealizados, setExpandedCargoRealizados] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Link generation
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedLinkEmployee, setSelectedLinkEmployee] = useState('');
  const [selectedLinkCycle, setSelectedLinkCycle] = useState('');

  useEffect(() => {
    Promise.all([
      fetchCompetencies(),
      fetchCycles(),
      supabase.from('funcionarios').select('id, nome, cargo').then(({ data }) => { if (data) setFuncionarios(data as Funcionario[]); }),
      supabase.from('evaluations').select('id, cycle_id, evaluated_name, status, completed_at').then(({ data }) => { if (data) setEvaluations(data as Evaluation[]); }),
      supabase.from('evaluation_cycles').select('id, end_date').then(({ data }) => { if (data) setEvalCycles(data as EvaluationCycle[]); }),
      supabase.from('fit_cultural').select('employee_id, stage').then(({ data }) => { if (data) setFitCulturalAnswers(data as { employee_id: string; stage: string }[]); }),
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
    const normalizeCargo = (cargo: string) => {
      let normalized = cargo.replace(/\s+(I{1,3}|IV|V|VI{0,3}|[0-9]+)\s*$/i, '').trim();
      normalized = normalized.replace(/\bTécnica\b/gi, 'Técnico');
      return normalized;
    };

    const cargos: Record<string, { cargo: string; total: number; realizados: number; noPrazo: number; pendentes: number; pendenteNomes: { id: string; nome: string }[]; realizadoNomes: { id: string; nome: string; cycleId: string; cycleName: string }[] }> = {};
    funcionarios.forEach(f => {
      const cargoKey = normalizeCargo(f.cargo);
      if (!cargos[cargoKey]) cargos[cargoKey] = { cargo: cargoKey, total: 0, realizados: 0, noPrazo: 0, pendentes: 0, pendenteNomes: [], realizadoNomes: [] };
      cargos[cargoKey].total++;
      
      const empAnswers = fitCulturalAnswers.filter(fc => fc.employee_id === f.id && (filterCycle === 'all' || fc.stage === filterCycle));
      
      if (empAnswers.length === 0) {
        cargos[cargoKey].pendentes++;
        cargos[cargoKey].pendenteNomes.push({ id: f.id, nome: f.nome });
      } else {
        const answeredCycles = Array.from(new Set(empAnswers.map(a => a.stage)));
        answeredCycles.forEach(cycleId => {
          cargos[cargoKey].realizados++;
          cargos[cargoKey].realizadoNomes.push({ 
            id: f.id, 
            nome: f.nome, 
            cycleId, 
            cycleName: cycles.find(c => c.id === cycleId)?.name || 'Ciclo Geral' 
          });
          cargos[cargoKey].noPrazo++; 
        });
      }
    });
    return Object.values(cargos).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [funcionarios, fitCulturalAnswers, filterCycle, cycles]);

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

  async function deleteCompetency(id: string) {
    if (!canDelete('desempenho')) { toast({ title: 'Sem permissão para excluir', variant: 'destructive' }); return; }
    await supabase.from('competencies').delete().eq('id', id);
    fetchCompetencies();
  }

  async function deleteFitCulturalEmployee(employeeId: string, cycleId: string) {
    if (!canDelete('desempenho')) { toast({ title: 'Sem permissão para excluir', variant: 'destructive' }); return; }
    const { error } = await supabase.from('fit_cultural').delete().eq('employee_id', employeeId).eq('stage', cycleId);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Avaliação excluída com sucesso!' });
      const { data } = await supabase.from('fit_cultural').select('employee_id, stage');
      if (data) setFitCulturalAnswers(data as { employee_id: string; stage: string }[]);
    }
  }

  async function submitEvaluation() {
    if (!evalForm.employee_id) return toast({ title: 'Selecione um colaborador', variant: 'destructive' });
    if (!evalForm.cycle_id) return toast({ title: 'Selecione um ciclo', variant: 'destructive' });
    
    if (competencies.length === 0) {
      return toast({ title: 'Nenhum critério de Fit Cultural cadastrado.', variant: 'destructive' });
    }

    for (const c of competencies) {
      if (!evalScores[c.id]) {
         return toast({ title: 'Por favor, avalie todas as competências.', variant: 'destructive' });
      }
    }

    const inserts = competencies.map(c => ({
      employee_id: evalForm.employee_id,
      criteria: c.name,
      score: evalScores[c.id],
      stage: evalForm.cycle_id
    }));

    const { error } = await supabase.from('fit_cultural').insert(inserts);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      const avg = Math.round(Object.values(evalScores).reduce((a,b)=>a+b,0) / competencies.length);
      await supabase.from('funcionarios').update({ fit_cultural: avg }).eq('id', evalForm.employee_id);
      
      toast({ title: 'Avaliação de Fit Cultural concluída com sucesso!' });
      setEvalDialogOpen(false);
      setEvalStep(1);
      setEvalForm({ employee_id: '', cycle_id: '' });
      setEvalScores({});
    }
  }

  const filtered = filterCycle === 'all'
    ? competencies
    : competencies.filter(c => c.cycle_id === filterCycle);

  const cycleName = (id: string | null) => cycles.find(c => c.id === id)?.name || 'Geral';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fit Cultural</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie competências e avalie o fit cultural da equipe</p>
        </div>
        <div className="flex items-center gap-3">
          {!selectedEvalEmployee && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setLinkDialogOpen(true)}>
                Gerar Link Colaborador
              </Button>
              <Button variant="secondary" onClick={() => setEvalDialogOpen(true)} className="bg-primary/10 text-primary hover:bg-primary/20">
                <Target className="w-4 h-4 mr-2" /> Avaliar Colaborador
              </Button>
            </div>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"><Plus className="w-4 h-4 mr-2" /> Cadastrar Critério</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Critério de Fit Cultural</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Nome (Critério)</Label><FastInput value={form.name} onValueChange={v => setForm({ ...form, name: v })} placeholder="Ex: Liderança, Comunicação..." /></div>
                <div><Label>Descrição</Label><FastTextarea value={form.description} onValueChange={v => setForm({ ...form, description: v })} placeholder="O que significa essa competência na nossa cultura?" /></div>
                <div>
                  <Label>Ciclo (opcional)</Label>
                  <Select value={form.cycle_id} onValueChange={v => setForm({ ...form, cycle_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Geral (todos os ciclos)" /></SelectTrigger>
                    <SelectContent>{cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={createCompetency} className="w-full">Cadastrar Critério</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={evalDialogOpen} onOpenChange={open => { setEvalDialogOpen(open); if(!open){ setEvalStep(1); setEvalScores({}); } }}>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Questionário de Fit Cultural</DialogTitle></DialogHeader>
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
                      if(!evalForm.employee_id || !evalForm.cycle_id) return toast({ title: 'Preencha o colaborador e o ciclo', variant: 'destructive' });
                      setEvalDialogOpen(false);
                      setSelectedEvalEmployee(evalForm.employee_id);
                      setSelectedEvalCycle(evalForm.cycle_id);
                    }} className="w-full mt-4">Iniciar Avaliação de 4 Etapas</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground mb-4">Avalie a aderência do colaborador para cada critério da nossa cultura (1 = Muito Baixa, 5 = Muito Alta).</p>
                    <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-2">
                      {competencies.length === 0 ? (
                        <div className="text-center p-6 bg-muted/20 border border-dashed border-border rounded-lg">
                          <p className="text-sm font-medium text-foreground">Nenhum critério cadastrado.</p>
                          <p className="text-xs text-muted-foreground mt-1">Antes de avaliar o colaborador, você precisa clicar em <b>"+ Cadastrar Critério"</b> na tela anterior e registrar os pilares da cultura da empresa (ex: Liderança, Comunicação).</p>
                        </div>
                      ) : (
                        competencies.map(c => (
                          <div key={c.id} className="p-4 bg-muted/30 border border-border/50 rounded-lg">
                            <h4 className="font-semibold text-foreground text-sm">{c.name}</h4>
                            {c.description && <p className="text-xs text-muted-foreground mt-1 mb-3">{c.description}</p>}
                            <div className="flex items-center gap-2 mt-2">
                              {[1,2,3,4,5].map(note => (
                                <button
                                  key={note}
                                  onClick={() => setEvalScores(prev => ({ ...prev, [c.id]: note }))}
                                  className={`flex-1 py-1.5 text-sm font-medium rounded-md border transition-colors ${evalScores[c.id] === note ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border/50 text-foreground'}`}
                                >
                                  {note}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <DialogFooter>
                      <div className="flex gap-3 pt-2 border-t border-border/50 w-full">
                        <Button variant="outline" onClick={() => setEvalStep(1)} className="flex-1">Voltar</Button>
                        <Button onClick={submitEvaluation} className="flex-1">Concluir Avaliação</Button>
                      </div>
                    </DialogFooter>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Gerar Link de Autoavaliação</DialogTitle>
                <DialogDescription>
                  Selecione o colaborador para gerar um link personalizado e único para ele responder.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Selecionar Colaborador</Label>
                  <Select value={selectedLinkEmployee} onValueChange={setSelectedLinkEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha quem vai responder..." />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionarios.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedLinkEmployee && (
                  <div className="space-y-2 mt-4">
                    <Label>Ciclo de Avaliação</Label>
                    <Select value={selectedLinkCycle} onValueChange={setSelectedLinkCycle}>
                      <SelectTrigger>
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

                {selectedLinkEmployee && selectedLinkCycle && (
                  <div className="space-y-2 mt-4">
                    <Label>Link Personalizado</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        readOnly 
                        value={`${window.location.origin}/autoavaliacao-fit-cultural?uid=${selectedLinkEmployee}&cycle=${selectedLinkCycle}`}
                        className="bg-muted/50 font-mono text-xs"
                      />
                      <Button 
                        variant="secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/autoavaliacao-fit-cultural?uid=${selectedLinkEmployee}&cycle=${selectedLinkCycle}`);
                          toast({ title: 'Link copiado!', description: 'Envie este link para o colaborador.' });
                          setLinkDialogOpen(false);
                          setSelectedLinkEmployee('');
                          setSelectedLinkCycle('');
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {selectedEvalEmployee && selectedEvalCycle ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <Button variant="ghost" onClick={() => setSelectedEvalEmployee(null)} className="mb-4 text-muted-foreground hover:text-foreground">
            ← Voltar para listagem
          </Button>
          <FitCulturalSection 
            employeeId={selectedEvalEmployee} 
            employeeName={funcionarios.find(f => f.id === selectedEvalEmployee)?.nome || 'Colaborador'} 
            cycleId={selectedEvalCycle}
          />
        </motion.div>
      ) : (
        <>
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

              {/* Realizados expandable list */}
              {cargoStats.some(c => c.realizados > 0) && (
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Colaboradores Avaliados</p>
                  <div className="space-y-1">
                    {cargoStats.filter(c => c.realizados > 0).map(c => (
                      <div key={`realizados-${c.cargo}`} className="rounded-lg border border-border overflow-hidden">
                        <button onClick={() => setExpandedCargoRealizados(expandedCargoRealizados === c.cargo ? null : c.cargo)}
                          className="w-full flex items-center justify-between text-left px-4 py-2.5 hover:bg-muted/30 transition-colors">
                          <span className="text-sm font-medium text-foreground">{c.cargo}</span>
                          <div className="flex items-center gap-2">
                            <span className="corporate-badge bg-emerald-500/10 text-emerald-600">{c.realizados}</span>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedCargoRealizados === c.cargo ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        {expandedCargoRealizados === c.cargo && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            className="border-t border-border bg-muted/20 px-4 py-2 space-y-1">
                            {c.realizadoNomes.map((emp, idx) => (
                              <div key={`${emp.id}-${emp.cycleId}-${idx}`} className="flex items-center justify-between py-1 hover:bg-muted/30 px-2 -mx-2 rounded-md transition-colors">
                                <button onClick={() => navigate(`/funcionario/${emp.id}?tab=fit-cultural`)}
                                  className="text-sm text-primary hover:underline cursor-pointer text-left flex-1 flex flex-col">
                                  <span>• {emp.nome}</span>
                                  {filterCycle === 'all' && <span className="text-xs text-muted-foreground ml-3">Ciclo: {emp.cycleName}</span>}
                                </button>
                                {canDelete('desempenho') && (
                                  <button 
                                    onClick={() => deleteFitCulturalEmployee(emp.id, emp.cycleId)}
                                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                    title="Excluir Avaliação deste Colaborador neste Ciclo"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
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

      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground">Filtrar por ciclo:</Label>
        <Select value={filterCycle} onValueChange={setFilterCycle}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhuma competência encontrada.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((comp, i) => (
            <motion.div key={comp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="glass-card rounded-xl p-4 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">{comp.name}</h3>
                {comp.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{comp.description}</p>}
                <span className="text-xs text-muted-foreground mt-1 inline-block">Ciclo: {cycleName(comp.cycle_id)}</span>
              </div>
              {canDelete('desempenho') && (
                <button onClick={() => deleteCompetency(comp.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}
