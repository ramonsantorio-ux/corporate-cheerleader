import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ExpandableChart } from '@/components/ui/ExpandableChart';
import { useNavigate } from 'react-router-dom';
import { Brain, User, BarChart2, Zap, ClipboardList, Award, Star, Plus, CheckCircle2, Search, Link, ExternalLink, TrendingUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiscReport, MbtiReport, BigFiveReport, discDescriptions } from '@/components/ExecutiveReports';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

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

const assessments = [
  {
    id: 'disc', label: 'DISC', icon: Brain,
    color: 'from-blue-600 to-indigo-600',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-400',
    questions: 30,
    desc: 'Mapeia Dominância, Influência, Estabilidade e Conformidade.',
    tags: ['Comportamental', '30 perguntas'],
  },
  {
    id: 'mbti', label: 'MBTI (16 Tipos)', icon: User,
    color: 'from-violet-600 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
    text: 'text-violet-700 dark:text-violet-400',
    questions: 20,
    desc: 'Classifica a personalidade em 16 tipos: ENTJ, INFP, etc.',
    tags: ['Personalidade', '20 perguntas'],
  },
  {
    id: 'bigfive', label: 'Big Five (OCEAN)', icon: BarChart2,
    color: 'from-emerald-600 to-teal-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-400',
    questions: 25,
    desc: 'Modelo mais validado cientificamente — Abertura, Conscienciosidade, Extroversão, Amabilidade e Neuroticismo.',
    tags: ['Científico', '25 questões', 'Escala 1–5'],
  }
];

export default function Treinamentos() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [assessmentsData, setAssessmentsData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [expandedCargo, setExpandedCargo] = useState<string | null>(null);

  const [reportModal, setReportModal] = useState<{open: boolean; type: string; data: any; empName: string}>({open: false, type: '', data: null, empName: ''});
  const { toast } = useToast();

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedLinkEmployee, setSelectedLinkEmployee] = useState('');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState('disc');

  const copyLink = (type: string, id: string = '') => {
    const url = id ? `${window.location.origin}/assessment/${type}/${id}` : `${window.location.origin}/assessment/${type}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado!', description: `Envie este link para o colaborador responder o teste.` });
  };

  useEffect(() => {
    async function fetchData() {
      const { data: emps, error } = await supabase.from('funcionarios').select('*').order('nome');
      
      let employeesList = emps;
      
      // Fallback para mock data se o banco estiver vazio
      if (!employeesList || employeesList.length === 0) {
        employeesList = [
          { id: 'mock-1', nome: 'Eduardo Silva', cargo: 'Analista Sênior', departamento: 'TI', foto_url: '' },
          { id: 'mock-2', nome: 'Ramon Leonard', cargo: 'Diretor', departamento: 'Diretoria', foto_url: '' },
          { id: 'mock-3', nome: 'Mariana Costa', cargo: 'Gerente de Projetos', departamento: 'Projetos', foto_url: '' }
        ];
      }

      if (error) {
        console.error("Erro ao buscar funcionários:", error);
      }

      const { data: assessments } = await supabase.from('assessment_results').select('user_id, type, result_data, created_at').catch(() => ({ data: [] }));
      setAssessmentsData(assessments || []);
      
      const enriched = (employeesList || []).map(f => {
        return {
          ...f,
        };
      });
      setEmployees(enriched);
    }
    fetchData();
  }, []);

  const isTestValid = (tests: any[], type: string, empId: string) => {
    // Para funcionar offline / mock, se for o mock-1
    if (empId === 'mock-1') return true;

    const test = tests.find(a => a.user_id === empId && a.type === type);
    if (!test) return false;
    if (!test.created_at) return true; // Se não tiver data, assumimos válido

    const testDate = new Date(test.created_at);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return testDate >= oneYearAgo;
  };

  const getTestData = (tests: any[], type: string, empId: string) => {
    if (empId === 'mock-1') {
      if (type === 'disc') return { dominant: { letter: 'D' }, D: 85, I: 40, S: 15, C: 60 };
      if (type === 'mbti') return { type: 'ENTJ', desc: { title: 'Comandante', traits: ['Decisivo', 'Estratégico', 'Ambicioso'], desc: 'Líderes natos com visão estratégica e alto poder de execução.' } };
      if (type === 'bigfive') return { O: 85, C: 75, E: 90, A: 40, N: 30 };
    }
    const valid = isTestValid(tests, type, empId);
    if (!valid) return null; // Só retorna os dados se estiver válido
    return tests.find(a => a.user_id === empId && a.type === type)?.result_data || tryParse(`${type}_${empId}`);
  };

  function tryParse(key: string) {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; }
  }

  const cargoStats = useMemo(() => {
    const normalizeCargo = (cargo: string) => {
      let normalized = (cargo || 'Sem Cargo').replace(/\s+(I{1,3}|IV|V|VI{0,3}|[0-9]+)\s*$/i, '').trim();
      normalized = normalized.replace(/\bTécnica\b/gi, 'Técnico');
      return normalized;
    };

    const cargos: Record<string, { cargo: string; total: number; realizados: number; pendentes: number; pendenteNomes: { id: string; nome: string }[] }> = {};
    employees.forEach(f => {
      const cargoKey = normalizeCargo(f.cargo);
      if (!cargos[cargoKey]) cargos[cargoKey] = { cargo: cargoKey, total: 0, realizados: 0, pendentes: 0, pendenteNomes: [] };
      cargos[cargoKey].total++;
      
      const hasDisc = isTestValid(assessmentsData, 'disc', f.id);
      const hasMbti = isTestValid(assessmentsData, 'mbti', f.id);
      const hasBigFive = isTestValid(assessmentsData, 'bigfive', f.id);

      if (hasDisc && hasMbti && hasBigFive) {
        cargos[cargoKey].realizados++;
      } else {
        cargos[cargoKey].pendentes++;
        cargos[cargoKey].pendenteNomes.push({ id: f.id, nome: f.nome });
      }
    });
    return Object.values(cargos).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [employees, assessmentsData]);

  const chartData = cargoStats.map(c => ({
    cargo: c.cargo.length > 18 ? c.cargo.slice(0, 16) + '…' : c.cargo,
    Realizados: c.realizados,
    Pendentes: c.pendentes,
  }));

  const totalRealizados = cargoStats.reduce((a, c) => a + c.realizados, 0);
  const totalPendentes = cargoStats.reduce((a, c) => a + c.pendentes, 0);

  const filtered = employees.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header estilo Painel do Gestor */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Talentos & Comportamento</p>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" /> Central de Assessments
          </h1>
        </div>
        
        <Button variant="outline" onClick={() => setLinkDialogOpen(true)}>
          <Link className="w-4 h-4 mr-2" /> Gerar Link Colaborador
        </Button>
      </motion.div>

      <Tabs defaultValue="assessments" className="w-full mt-4">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50 p-1 h-auto mb-6">
          <TabsTrigger value="assessments" className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            Assessments Disponíveis
          </TabsTrigger>
          <TabsTrigger value="equipe" className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            Mapeamento da Equipe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessments" className="space-y-6 outline-none">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {assessments.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`kpi-card rounded-xl p-5 flex flex-col gap-4 ${a.border} border`} style={{ borderTopColor: undefined }}>
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl ${a.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${a.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground">{a.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{a.desc}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {a.tags.map(t => (
                  <span key={t} className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${a.bg} ${a.text} border ${a.border}`}>{t}</span>
                ))}
              </div>
              <div className="mt-auto flex gap-2">
                <Button size="sm" className={`flex-1 bg-gradient-to-r ${a.color} text-white border-0 hover:opacity-90`}
                  onClick={() => navigate(`/assessment/${a.id}`)}>
                  Iniciar Teste
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
      </TabsContent>

      <TabsContent value="equipe" className="space-y-6 outline-none">
        
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl text-sm font-medium">
          Atenção: Os testes (DISC, MBTI, Big Five) possuem validade de 12 meses. Colaboradores com testes vencidos entrarão como Pendentes.
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="corporate-kpi corporate-kpi-accent">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Realizados (12m)</p>
            <p className="text-3xl font-bold text-foreground mt-1">{totalRealizados}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="corporate-kpi corporate-kpi-danger">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pendentes / Vencidos</p>
            <p className="text-3xl font-bold text-foreground mt-1">{totalPendentes}</p>
          </motion.div>
        </div>

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
                              <button key={emp.id} onClick={() => navigate(`/funcionario/${emp.id}`)}
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

      {/* ── Employee Table ── */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold text-foreground">Mapeamento da Equipe</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar colaborador..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-background border border-input rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Colaborador</th>
                <th className="px-4 py-3 text-center font-medium">DISC</th>
                <th className="px-4 py-3 text-center font-medium">MBTI</th>
                <th className="px-4 py-3 text-center font-medium">Big Five</th>
                <th className="px-4 py-3 text-center font-medium">Completude</th>
                <th className="px-4 py-3 text-center font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((f, i) => {
                const discData = getTestData(assessmentsData, 'disc', f.id);
                const mbtiData = getTestData(assessmentsData, 'mbti', f.id);
                const bigfiveData = getTestData(assessmentsData, 'bigfive', f.id);
                const done = [discData, mbtiData, bigfiveData].filter(Boolean).length;
                
                return (
                  <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {f.foto_url
                          ? <img src={f.foto_url} className="w-8 h-8 rounded-full object-cover border border-border" />
                          : <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{f.nome.charAt(0)}</div>}
                        <div>
                          <p className="font-medium text-foreground">{f.nome}</p>
                          <p className="text-xs text-muted-foreground">{f.cargo}</p>
                        </div>
                      </div>
                    </td>
                    {[
                      { key: 'disc', val: discData?.dominant?.letter, fullData: discData },
                      { key: 'mbti', val: mbtiData?.type, fullData: mbtiData },
                      { key: 'bigfive', val: bigfiveData ? '✓' : null, fullData: bigfiveData },
                    ].map(col => (
                      <td key={col.key} className="px-4 py-3 text-center">
                        {col.val
                          ? <button onClick={() => setReportModal({open: true, type: col.key, data: col.fullData, empName: f.nome})} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">{col.val}</button>
                          : <span className="text-muted-foreground/40 text-lg">—</span>}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold">{done}/3</span>
                        <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(done/3)*100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center items-center">
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => navigate(`/funcionario/${f.id}`)}>Perfil</Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-primary" title="Gerar link para o colaborador">
                              <Link className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => copyLink('disc', f.id)}>Copiar Link DISC</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => copyLink('mbti', f.id)}>Copiar Link MBTI</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => copyLink('bigfive', f.id)}>Copiar Link Big Five</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </TabsContent>
      </Tabs>

      {/* ── Report Modal ── */}
      <Dialog open={reportModal.open} onOpenChange={(open) => !open && setReportModal({ open: false, type: '', data: null, empName: '' })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="mb-4 pb-4 border-b">
            <h3 className="text-lg font-bold text-foreground">Relatório de {reportModal.empName}</h3>
          </div>
          {reportModal.type === 'disc' && reportModal.data && <DiscReport resultScreen={reportModal.data} />}
          {reportModal.type === 'mbti' && reportModal.data && <MbtiReport resultScreen={reportModal.data} />}
          {reportModal.type === 'bigfive' && reportModal.data && <BigFiveReport resultScreen={reportModal.data} />}
        </DialogContent>
      </Dialog>

      {/* ── Link Generation Modal ── */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Gerar Link de Assessment</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1.5">
              Selecione o colaborador e o teste para gerar um link personalizado e único para ele responder.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecionar Teste</Label>
              <Select value={selectedAssessmentType} onValueChange={setSelectedAssessmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o teste..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disc">DISC</SelectItem>
                  <SelectItem value="mbti">MBTI (16 Tipos)</SelectItem>
                  <SelectItem value="bigfive">Big Five (OCEAN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Selecionar Colaborador</Label>
              <Select value={selectedLinkEmployee} onValueChange={setSelectedLinkEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha quem vai responder..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.nome} - {emp.cargo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLinkEmployee && selectedAssessmentType && (
              <div className="space-y-2">
                <Label>Link Personalizado</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    readOnly 
                    value={`${window.location.origin}/assessment/${selectedAssessmentType}/${selectedLinkEmployee}`}
                    className="bg-muted/50 font-mono text-xs"
                  />
                  <Button 
                    variant="outline"
                    title="Abrir em Nova Janela"
                    onClick={() => {
                      window.open(`${window.location.origin}/assessment/${selectedAssessmentType}/${selectedLinkEmployee}`, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/assessment/${selectedAssessmentType}/${selectedLinkEmployee}`);
                      toast({ title: 'Link copiado!', description: 'Envie este link para o colaborador.' });
                      setLinkDialogOpen(false);
                      setSelectedLinkEmployee('');
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
  );
}
