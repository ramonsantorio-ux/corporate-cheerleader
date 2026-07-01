import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExpandableChart } from '@/components/ui/ExpandableChart';
import { useNavigate } from 'react-router-dom';
import { Brain, User, BarChart2, Zap, ClipboardList, Award, Star, Plus, CheckCircle2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiscReport, MbtiReport, BigFiveReport, discDescriptions } from '@/components/ExecutiveReports';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Link, ExternalLink } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [search, setSearch] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

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

      const { data: assessments } = await supabase.from('assessment_results').select('user_id, type, result_data').catch(() => ({ data: [] }));
      
      const enriched = (employeesList || []).map(f => {
        const userAss = assessments?.filter(a => a.user_id === f.id) || [];
        
        let mockDisc = null;
        let mockMbti = null;
        let mockBigFive = null;
        
        if (f.id === 'mock-1') {
           mockDisc = { dominant: { letter: 'D' }, D: 85, I: 40, S: 15, C: 60 };
           mockMbti = { type: 'ENTJ', desc: { title: 'Comandante', traits: ['Decisivo', 'Estratégico', 'Ambicioso'], desc: 'Líderes natos com visão estratégica e alto poder de execução.' } };
           mockBigFive = { O: 85, C: 75, E: 90, A: 40, N: 30 };
        }

        return {
          ...f,
          disc: userAss.find(a => a.type === 'disc')?.result_data || tryParse(`disc_${f.id}`) || mockDisc,
          mbti: userAss.find(a => a.type === 'mbti')?.result_data || tryParse(`mbti_${f.id}`) || mockMbti,
          bigfive: userAss.find(a => a.type === 'bigfive')?.result_data || tryParse(`bigfive_${f.id}`) || mockBigFive,
        };
      });
      setEmployees(enriched);
    }
    fetchData();
  }, []);

  function tryParse(key: string) {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; }
  }

  const filtered = employees.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));

  const totalTests = (f: any) => [f.disc, f.mbti, f.bigfive].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2"><ClipboardList className="w-6 h-6 text-primary" />Central de Assessments</h1>
          <p>Mapeamento comportamental e de competências da sua equipe.</p>
        </div>
        
        <Button variant="outline" className="bg-white hover:bg-slate-50 text-slate-700 font-medium border-slate-200 shadow-sm" onClick={() => setLinkDialogOpen(true)}>
          <Link className="w-4 h-4 mr-2" /> Gerar Link Colaborador
        </Button>
      </div>
      <Tabs defaultValue="assessments" className="w-full mt-6">
        <TabsList className="w-full justify-start h-auto flex-wrap p-1.5 bg-muted/30 rounded-xl mb-6 border border-border">
          <TabsTrigger value="assessments" className="px-5 py-2.5 text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Assessments Disponíveis</TabsTrigger>
          <TabsTrigger value="equipe" className="px-5 py-2.5 text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Mapeamento da Equipe</TabsTrigger>
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
                const done = totalTests(f);
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
                      { key: 'disc', val: f.disc?.dominant?.letter, fullData: f.disc },
                      { key: 'mbti', val: f.mbti?.type, fullData: f.mbti },
                      { key: 'bigfive', val: f.bigfive ? '✓' : null, fullData: f.bigfive },
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
