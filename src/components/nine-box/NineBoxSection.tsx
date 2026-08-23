import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Target, TrendingUp, CheckCircle2, History, Plus, ShieldAlert, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  employeeId: string;
  initialDesempenho: string | null;
  initialPotencial: string | null;
  cargo: string;
  onUpdate: () => void;
}

const matrixBoxes = [
  // Top Row (Potencial Alto)
  { pot: 'Alto', des: 'Baixo', label: 'Enigma', desc: 'Alto potencial, mas desempenho atual baixo.', color: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30', activeColor: 'bg-orange-500/30 border-orange-500 ring-2 ring-orange-500' },
  { pot: 'Alto', des: 'Médio', label: 'Forte Desempenho', desc: 'Alto potencial e bom desempenho.', color: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30', activeColor: 'bg-emerald-500/30 border-emerald-500 ring-2 ring-emerald-500' },
  { pot: 'Alto', des: 'Alto', label: 'Estrela', desc: 'Talento excepcional.', color: 'bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-600/30', activeColor: 'bg-emerald-600/30 border-emerald-600 ring-2 ring-emerald-600' },
  // Middle Row (Potencial Médio)
  { pot: 'Médio', des: 'Baixo', label: 'Questionável', desc: 'Potencial médio, baixo desempenho.', color: 'bg-red-400/10 hover:bg-red-400/20 border-red-400/30', activeColor: 'bg-red-400/30 border-red-400 ring-2 ring-red-400' },
  { pot: 'Médio', des: 'Médio', label: 'Mantenedor', desc: 'Sólido e confiável.', color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30', activeColor: 'bg-blue-500/30 border-blue-500 ring-2 ring-blue-500' },
  { pot: 'Médio', des: 'Alto', label: 'Forte Desempenho', desc: 'Alto desempenho constante.', color: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30', activeColor: 'bg-emerald-500/30 border-emerald-500 ring-2 ring-emerald-500' },
  // Bottom Row (Potencial Baixo)
  { pot: 'Baixo', des: 'Baixo', label: 'Insuficiente', desc: 'Baixo em ambos.', color: 'bg-red-600/10 hover:bg-red-600/20 border-red-600/30', activeColor: 'bg-red-600/30 border-red-600 ring-2 ring-red-600' },
  { pot: 'Baixo', des: 'Médio', label: 'Eficaz', desc: 'Desempenho aceitável.', color: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30', activeColor: 'bg-orange-500/30 border-orange-500 ring-2 ring-orange-500' },
  { pot: 'Baixo', des: 'Alto', label: 'Especializado', desc: 'Excelente na função.', color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30', activeColor: 'bg-blue-500/30 border-blue-500 ring-2 ring-blue-500' },
];

export default function NineBoxSection({ employeeId, initialDesempenho, initialPotencial, cargo, onUpdate }: Props) {
  const { toast } = useToast();
  const [desempenho, setDesempenho] = useState<string>('');
  const [potencial, setPotencial] = useState<string>('');
  const [observacao, setObservacao] = useState('');
  const [cycle, setCycle] = useState<string>('');
  type DbCycle = { id: string; name: string; created_at: string };
  type HistoricoEntry = { id: string; employee_id: string; cycle: string; performance: string; potential: string; confianca?: string; observacao?: string; created_at: string };
  const [dbCycles, setDbCycles] = useState<DbCycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<HistoricoEntry[]>([]);
  const [viewMode, setViewMode] = useState<'nova' | 'historico'>('nova');

  const fetchCycles = useCallback(async () => {
    const { data } = await supabase.from('evaluation_cycles').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setDbCycles(data);
      setCycle(data[0].name);
    } else {
      setCycle('Ciclo Padrão');
    }
  }, []);

  const fetchHistorico = useCallback(async () => {
    const { data, error } = await supabase
      .from('nine_box_historico')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setHistorico(data);
      if (data.length > 0 && desempenho === '') {
        setViewMode('historico');
      }
    }
  }, [employeeId, desempenho]);

  const [suggestedDes, setSuggestedDes] = useState<string | null>(null);
  const [suggestedPot, setSuggestedPot] = useState<string | null>(null);
  const [desScoreAvg, setDesScoreAvg] = useState<string | null>(null);
  const [potScoreAvg, setPotScoreAvg] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!employeeId) return;
    const { data } = await supabase.from('fit_cultural').select('criteria, stage, score').eq('employee_id', employeeId);
    if (data && data.length > 0) {
      // 1. Desempenho (Fit Cultural) - stages not starting with potencial_
      const fitScores = data.filter(d => !d.stage?.startsWith('potencial_') && d.score != null);
      if (fitScores.length > 0) {
        const avg = fitScores.reduce((a, b) => a + (b.score || 0), 0) / fitScores.length;
        setDesScoreAvg(avg.toFixed(2));
        setSuggestedDes(avg >= 3.8 ? 'Alto' : avg >= 2.8 ? 'Médio' : 'Baixo');
      }

      // 2. Potencial - stages starting with potencial_
      const potScores = data.filter(d => d.stage?.startsWith('potencial_') && d.score != null);
      if (potScores.length > 0) {
        const avg = potScores.reduce((a, b) => a + (b.score || 0), 0) / potScores.length;
        setPotScoreAvg(avg.toFixed(2));
        setSuggestedPot(avg >= 3.8 ? 'Alto' : avg >= 2.8 ? 'Médio' : 'Baixo');
      }
    }
  }, [employeeId]);

  useEffect(() => {
    fetchCycles();
    fetchHistorico();
    fetchSuggestions();
  }, [employeeId, fetchCycles, fetchHistorico, fetchSuggestions]);

  async function handleSave() {
    if (!desempenho || !potencial) {
      toast({ title: 'Atenção', description: 'Selecione um quadro na matriz antes de salvar.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    
    // 1. Salvar no histórico
    const { error: histError } = await supabase
      .from('nine_box_historico')
      .insert({
        employee_id: employeeId,
        desempenho,
        potencial,
        cycle,
        observacao
      });

    if (histError) {
      setLoading(false);
      toast({ title: 'Erro ao salvar histórico', description: histError.message, variant: 'destructive' });
      return;
    }

    // 2. Atualizar perfil principal
    const { error: funcError } = await supabase
      .from('funcionarios')
      .update({
        nine_box_desempenho: desempenho,
        nine_box_potencial: potencial
      })
      .eq('id', employeeId);

    setLoading(false);
    if (funcError) {
      toast({ title: 'Erro ao atualizar perfil', description: funcError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Avaliação Salva', description: 'O Nine Box foi registrado com sucesso.' });
      setDesempenho('');
      setPotencial('');
      setObservacao('');
      fetchHistorico();
      setViewMode('historico');
      onUpdate();
    }
  }


  // Cargos que NÃO são elegíveis para avaliação 9-Box (operacionais sem gestão)
  const CARGOS_INELEGIVEIS_9BOX = [
    'Motorista', 'Operador', 'Auxiliar', 'Ajudante', 'Servente',
    'Lavador', 'Borracheiro', 'Lubrificador', 'Eletricista',
    'Mecânico', 'Soldador', 'Almoxarife', 'Vigilante', 'Porteiro',
  ];

  const eligibleRolesArray = ['Analistas', 'Supervisores', 'Coordenadores', 'Gerentes', 'Encarregados'];

  const isElegivel = !CARGOS_INELEGIVEIS_9BOX.some(
    prefix => cargo?.toLowerCase().includes(prefix.toLowerCase())
  );

  if (!isElegivel) {
    const defaultRolesText = "Analistas, Supervisores, Coordenadores e Gerentes";
    const allowedRolesText = eligibleRolesArray.length > 0 ? eligibleRolesArray.join(', ') : defaultRolesText;
    
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center h-full bg-muted/10 rounded-xl border border-dashed border-border/50">
        <Target className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">O cargo <strong>{cargo}</strong> não é elegível para avaliação 9-Box neste ciclo.</p>
        <p className="text-xs text-muted-foreground mt-1">(Apenas {allowedRolesText})</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-500" />
          <div>
            <h3 className="font-semibold text-lg text-foreground">Avaliações 9-Box</h3>
            <p className="text-sm text-muted-foreground">Acompanhe o desempenho e potencial.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {viewMode === 'historico' && (
            <Button variant="outline" size="sm" onClick={() => setViewMode('nova')} className="gap-2">
              <Plus className="w-4 h-4" /> Nova Avaliação
            </Button>
          )}
          {historico.length > 0 && viewMode === 'nova' && (
            <Button variant="outline" size="sm" onClick={() => setViewMode('historico')} className="gap-2">
              <History className="w-4 h-4" /> Ver Histórico
            </Button>
          )}
        </div>
      </div>

      <div>
        {/* Smart Recommendation Banner */}
        {(suggestedDes || suggestedPot) && viewMode === 'nova' && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Recomendação Automática das Avaliações
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {suggestedDes ? <>Fit Cultural (Desempenho): <strong className="text-foreground">{suggestedDes} ({desScoreAvg}/5)</strong></> : 'Fit Cultural: Pendente'}
                  {' • '}
                  {suggestedPot ? <>Potencial: <strong className="text-foreground">{suggestedPot} ({potScoreAvg}/5)</strong></> : 'Potencial: Pendente'}
                </p>
              </div>
            </div>
            {suggestedDes && suggestedPot && (
              <Button
                size="sm"
                onClick={() => { setDesempenho(suggestedDes); setPotencial(suggestedPot); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 shadow-sm shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Aplicar {suggestedDes} x {suggestedPot}
              </Button>
            )}
          </div>
        )}

        {viewMode === 'nova' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Box Selector */}
            <div className="bg-background rounded-xl p-6 border border-border/50 shadow-sm relative">
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-muted-foreground tracking-widest">
                POTENCIAL
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-muted-foreground tracking-widest">
                DESEMPENHO (ENTREGA)
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 relative">
                {matrixBoxes.map((box) => {
                  const isSelected = potencial === box.pot && desempenho === box.des;
                  const shouldBlur = true;
                  
                  return (
                    <button
                      key={`${box.pot}-${box.des}`}
                      onClick={() => { setPotencial(box.pot); setDesempenho(box.des); }}
                      className={`
                        flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border transition-all text-center min-h-[100px] relative overflow-hidden
                        ${isSelected ? box.activeColor : box.color}
                      `}
                    >
                      <div className={`flex flex-col items-center justify-center transition-all duration-500 ${shouldBlur ? 'blur-[5px] opacity-60 select-none' : ''}`}>
                        <span className="font-bold text-xs sm:text-sm text-foreground mb-1">{box.label}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground/80 leading-tight hidden sm:block">{box.desc}</span>
                      </div>
                      
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[1px]">
                          <CheckCircle2 className="w-8 h-8 text-primary shadow-sm rounded-full bg-background/50" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Potencial</p>
                  <p className="font-bold text-lg">{potencial || '—'}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Desempenho</p>
                  <p className="font-bold text-lg">{desempenho || '—'}</p>
                </div>
              </div>

              <div className="space-y-4 bg-background p-5 rounded-xl border border-border/50 shadow-sm">
                <div className="space-y-2">
                  <Label>Ciclo de Avaliação</Label>
                  <Select value={cycle} onValueChange={setCycle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {dbCycles.length > 0 ? (
                        dbCycles.map(c => (
                          <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="Ciclo Padrão">Ciclo Padrão</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observações / Justificativas</Label>
                  <Textarea 
                    placeholder="Detalhe o motivo desta avaliação, metas alcançadas ou gargalos de potencial..."
                    className="min-h-[120px] resize-none"
                    value={observacao}
                    onChange={e => setObservacao(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleSave} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Avaliação Nine Box'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {historico.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20 border-dashed">
                Nenhuma avaliação registrada ainda.
              </div>
            ) : (
              <>
                <div className="bg-background rounded-xl p-6 border border-border/50 shadow-sm relative lg:w-[70%] mx-auto">
                  <div className="text-center mb-6">
                    <h4 className="font-bold text-lg text-foreground">Resultado Atual</h4>
                    <p className="text-sm text-muted-foreground">Ciclo: {historico[0].cycle}</p>
                  </div>
                  <div className="absolute -left-6 top-[60%] -translate-y-1/2 -rotate-90 text-xs font-bold text-muted-foreground tracking-widest">
                    POTENCIAL
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-muted-foreground tracking-widest">
                    DESEMPENHO (ENTREGA)
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3 relative">
                    {matrixBoxes.map((box) => {
                      const isSelected = historico[0].potencial === box.pot && historico[0].desempenho === box.des;
                      const shouldBlur = !isSelected;
                      
                      return (
                        <div
                          key={`hist-${box.pot}-${box.des}`}
                          className={`
                            flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border transition-all text-center min-h-[100px] relative overflow-hidden
                            ${isSelected ? box.activeColor + ' shadow-md scale-[1.02] z-10' : box.color + ' opacity-50 grayscale'}
                          `}
                        >
                          <div className={`flex flex-col items-center justify-center transition-all duration-500 ${shouldBlur ? 'blur-[5px] opacity-60 select-none' : ''}`}>
                            <span className="font-bold text-xs sm:text-sm text-foreground mb-1">{box.label}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground/80 leading-tight hidden sm:block">{box.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-muted-foreground" />
                    Histórico Completo
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {historico.map((av) => (
                      <div key={av.id} className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">{av.cycle}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(av.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <div className="bg-muted p-2 rounded-lg flex-1 text-center">
                            <span className="block text-[10px] uppercase text-muted-foreground font-semibold">Potencial</span>
                            <span className="font-medium text-sm">{av.potencial}</span>
                          </div>
                          <div className="bg-muted p-2 rounded-lg flex-1 text-center">
                            <span className="block text-[10px] uppercase text-muted-foreground font-semibold">Desempenho</span>
                            <span className="font-medium text-sm">{av.desempenho}</span>
                          </div>
                        </div>

                        {av.observacao && (
                          <div className="text-sm bg-muted/50 p-3 rounded-lg text-muted-foreground border border-border/50">
                            <strong className="block text-xs mb-1 text-foreground">Observação / Justificativa:</strong>
                            {av.observacao}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
