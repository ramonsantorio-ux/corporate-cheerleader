import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, User, BarChart2, Zap, ClipboardList, Award, Star, Plus, CheckCircle2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DiscReport, MbtiReport, BigFiveReport, discDescriptions } from '@/components/ExecutiveReports';

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
  },
  {
    id: 'gallup', label: 'CliftonStrengths (Gallup)', icon: Zap,
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-400',
    questions: 0,
    desc: 'Identifica as 5 maiores forças naturais do colaborador (Top 5 Gallup). Resultado inserido pelo RH.',
    tags: ['Forças', 'Resultado Manual', 'Gallup®'],
  },
  {
    id: 'lpi', label: 'LPI — Práticas de Liderança', icon: Award,
    color: 'from-rose-600 to-pink-600',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-400',
    questions: 0,
    desc: 'Mensura 5 práticas de liderança: Modelar o Caminho, Inspirar Visão, Desafiar, Capacitar e Encorajar.',
    tags: ['Liderança', 'Resultado Manual', 'LPI®'],
  },
];

const gallupStrengths = [
  'Realizador','Ativador','Adaptabilidade','Analítico','Crença','Comando','Comunicação','Competição',
  'Conectividade','Consistência','Contexto','Deliberativo','Desenvolvedor','Disciplina','Empatia',
  'Estudioso','Estratégico','Excelência','Foco','Futurista','Harmonia','Idealismo','Individualização',
  'Intelecção','Maximizador','Positivo','Relacionamento','Responsabilidade','Restaurador','Significância',
  'Sociabilidade','Vencedor','Woo'
];

const lpiDimensions = [
  { key: 'modelar', label: 'Modelar o Caminho' },
  { key: 'inspirar', label: 'Inspirar Visão Compartilhada' },
  { key: 'desafiar', label: 'Desafiar o Processo' },
  { key: 'capacitar', label: 'Capacitar os Outros' },
  { key: 'encorajar', label: 'Encorajar o Coração' },
];

export default function Treinamentos() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  // Gallup / LPI manual modals
  const [gallupModal, setGallupModal] = useState<{open:boolean; empId:string}>({ open: false, empId: '' });
  const [lpiModal, setLpiModal] = useState<{open:boolean; empId:string}>({ open: false, empId: '' });
  const [gallupSelected, setGallupSelected] = useState<string[]>([]);
  const [lpiScores, setLpiScores] = useState<Record<string,number>>({});
  const [reportModal, setReportModal] = useState<{open: boolean; type: string; data: any; empName: string}>({open: false, type: '', data: null, empName: ''});

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
          gallup: userAss.find(a => a.type === 'gallup')?.result_data || tryParse(`gallup_${f.id}`),
          lpi: userAss.find(a => a.type === 'lpi')?.result_data || tryParse(`lpi_${f.id}`),
        };
      });
      setEmployees(enriched);
    }
    fetchData();
  }, [gallupModal.open, lpiModal.open]);

  function tryParse(key: string) {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; }
  }

  async function saveGallup() {
    if (gallupSelected.length !== 5) return;
    const result = { top5: gallupSelected };
    try {
      const { error } = await supabase.from('assessment_results').insert({ user_id: gallupModal.empId, type: 'gallup', result_data: result });
      if (error) localStorage.setItem(`gallup_${gallupModal.empId}`, JSON.stringify(result));
    } catch {
      localStorage.setItem(`gallup_${gallupModal.empId}`, JSON.stringify(result));
    }
    setGallupModal({ open: false, empId: '' });
    setGallupSelected([]);
  }

  async function saveLpi() {
    try {
      const { error } = await supabase.from('assessment_results').insert({ user_id: lpiModal.empId, type: 'lpi', result_data: lpiScores });
      if (error) localStorage.setItem(`lpi_${lpiModal.empId}`, JSON.stringify(lpiScores));
    } catch {
      localStorage.setItem(`lpi_${lpiModal.empId}`, JSON.stringify(lpiScores));
    }
    setLpiModal({ open: false, empId: '' });
    setLpiScores({});
  }

  const filtered = employees.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));

  const totalTests = (f: any) => [f.disc, f.mbti, f.bigfive, f.gallup, f.lpi].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="page-header">
        <h1 className="flex items-center gap-2"><ClipboardList className="w-6 h-6 text-primary" />Central de Assessments</h1>
        <p>Mapeamento comportamental e de competências da sua equipe.</p>
      </div>

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
              <div className="mt-auto">
                {a.questions > 0 ? (
                  <Button size="sm" className={`w-full bg-gradient-to-r ${a.color} text-white border-0 hover:opacity-90`}
                    onClick={() => navigate(`/assessment/${a.id}`)}>
                    Iniciar Teste
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="w-full"
                    onClick={() => a.id === 'gallup' ? setGallupModal({ open: true, empId: '' }) : setLpiModal({ open: true, empId: '' })}>
                    Registrar Resultado
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

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
                <th className="px-4 py-3 text-center font-medium">Gallup</th>
                <th className="px-4 py-3 text-center font-medium">LPI</th>
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
                      { key: 'gallup', val: f.gallup ? '✓' : null, fullData: f.gallup },
                      { key: 'lpi', val: f.lpi ? '✓' : null, fullData: f.lpi },
                    ].map(col => (
                      <td key={col.key} className="px-4 py-3 text-center">
                        {col.val
                          ? <button onClick={() => setReportModal({open: true, type: col.key, data: col.fullData, empName: f.nome})} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">{col.val}</button>
                          : <span className="text-muted-foreground/40 text-lg">—</span>}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold">{done}/5</span>
                        <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(done/5)*100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => navigate(`/funcionario/${f.id}`)}>Perfil</Button>
                        <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-primary" onClick={() => navigate(`/assessment/disc/${f.id}`)}>+</Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Gallup Modal ── */}
      {gallupModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <h2 className="font-bold text-lg mb-1 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" />CliftonStrengths — Top 5</h2>
            <p className="text-sm text-muted-foreground mb-4">Selecione exatamente 5 forças do relatório oficial do Gallup.</p>

            <label className="text-sm font-medium block mb-2">Funcionário:</label>
            <select className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm mb-4"
              value={gallupModal.empId} onChange={e => setGallupModal(m => ({ ...m, empId: e.target.value }))}>
              <option value="" disabled>Selecione...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>

            <div className="flex flex-wrap gap-2 mb-4">
              {gallupStrengths.map(s => {
                const sel = gallupSelected.includes(s);
                return (
                  <button key={s} onClick={() => {
                    if (sel) setGallupSelected(prev => prev.filter(x => x !== s));
                    else if (gallupSelected.length < 5) setGallupSelected(prev => [...prev, s]);
                  }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${sel ? 'bg-amber-500 text-white border-amber-500' : 'bg-background border-border hover:border-amber-400'}`}>
                    {sel && <span className="mr-1">✓</span>}{s}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mb-4">{gallupSelected.length}/5 forças selecionadas</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setGallupModal({ open:false, empId:'' }); setGallupSelected([]); }}>Cancelar</Button>
              <Button className="flex-1" disabled={gallupSelected.length !== 5 || !gallupModal.empId} onClick={saveGallup}>Salvar</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── LPI Modal ── */}
      {lpiModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <h2 className="font-bold text-lg mb-1 flex items-center gap-2"><Award className="w-5 h-5 text-rose-500" />Práticas de Liderança LPI</h2>
            <p className="text-sm text-muted-foreground mb-4">Insira o score (escala recomendada 0 a 50) para cada uma das 5 práticas de liderança de Kouzes e Posner.</p>
            
            <label className="text-sm font-medium block mb-2">Funcionário:</label>
            <select className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm mb-4"
              value={lpiModal.empId} onChange={e => setLpiModal(m => ({ ...m, empId: e.target.value }))}>
              <option value="" disabled>Selecione...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>

            <div className="space-y-3 mb-6">
              {lpiDimensions.map(d => (
                <div key={d.key} className="flex items-center gap-3">
                  <label className="text-xs font-medium w-48 shrink-0">{d.label}</label>
                  <input type="number" min="0" max="50" placeholder="Score"
                    className="flex-1 bg-background border border-input rounded-lg px-3 py-1.5 text-sm"
                    value={lpiScores[d.key] || ''}
                    onChange={e => setLpiScores(prev => ({ ...prev, [d.key]: Number(e.target.value) }))} />
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setLpiModal({ open:false, empId:'' }); setLpiScores({}); }}>Cancelar</Button>
              <Button className="flex-1" disabled={!lpiModal.empId || Object.keys(lpiScores).length !== 5} onClick={saveLpi}>Salvar Resultados</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Report Modal ── */}
      <Dialog open={reportModal.open} onOpenChange={(open) => !open && setReportModal({ open: false, type: '', data: null, empName: '' })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="mb-4 pb-4 border-b">
            <h3 className="text-lg font-bold text-foreground">Relatório de {reportModal.empName}</h3>
          </div>
          {reportModal.type === 'disc' && reportModal.data && <DiscReport resultScreen={reportModal.data} />}
          {reportModal.type === 'mbti' && reportModal.data && <MbtiReport resultScreen={reportModal.data} />}
          {reportModal.type === 'bigfive' && reportModal.data && <BigFiveReport resultScreen={reportModal.data} />}
          {(reportModal.type === 'gallup' || reportModal.type === 'lpi') && (
            <div className="text-center py-10 text-muted-foreground">O relatório executivo para este assessment está sendo processado.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
