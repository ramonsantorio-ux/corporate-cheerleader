import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Target, TrendingUp, CheckCircle2, History, Plus, ShieldAlert } from 'lucide-react';
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

const matrixBoxesTrust = [
  // Top Row (Desempenho Alto)
  { des: 'Alto', conf: 'Baixa', label: 'Tóxico', desc: 'Alta entrega, destrói a cultura.', color: 'bg-red-600/10 hover:bg-red-600/20 border-red-600/30', activeColor: 'bg-red-600/30 border-red-600 ring-2 ring-red-600' },
  { des: 'Alto', conf: 'Média', label: 'Alto Impacto', desc: 'Forte executor operacional.', color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30', activeColor: 'bg-blue-500/30 border-blue-500 ring-2 ring-blue-500' },
  { des: 'Alto', conf: 'Alta', label: 'Estrela (Ideal)', desc: 'A base da equipe de elite.', color: 'bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-600/30', activeColor: 'bg-emerald-600/30 border-emerald-600 ring-2 ring-emerald-600' },
  // Middle Row (Desempenho Médio)
  { des: 'Médio', conf: 'Baixa', label: 'Manipulador', desc: 'Bate metas às custas do time.', color: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30', activeColor: 'bg-orange-500/30 border-orange-500 ring-2 ring-orange-500' },
  { des: 'Médio', conf: 'Média', label: 'Estável', desc: 'Sólido e confiável no dia a dia.', color: 'bg-blue-400/10 hover:bg-blue-400/20 border-blue-400/30', activeColor: 'bg-blue-400/30 border-blue-400 ring-2 ring-blue-400' },
  { des: 'Médio', conf: 'Alta', label: 'Líder Natural', desc: 'Cria ambiente seguro. Investir!', color: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30', activeColor: 'bg-emerald-500/30 border-emerald-500 ring-2 ring-emerald-500' },
  // Bottom Row (Desempenho Baixo)
  { des: 'Baixo', conf: 'Baixa', label: 'Incompetente', desc: 'Baixa entrega e quebra confiança.', color: 'bg-red-700/10 hover:bg-red-700/20 border-red-700/30', activeColor: 'bg-red-700/30 border-red-700 ring-2 ring-red-700' },
  { des: 'Baixo', conf: 'Média', label: 'Ineficaz', desc: 'Esforçado mas sem resultados.', color: 'bg-orange-400/10 hover:bg-orange-400/20 border-orange-400/30', activeColor: 'bg-orange-400/30 border-orange-400 ring-2 ring-orange-400' },
  { des: 'Baixo', conf: 'Alta', label: 'Leal c/ Dificuldades', desc: 'Treinar e realocar. Muito leal.', color: 'bg-emerald-400/10 hover:bg-emerald-400/20 border-emerald-400/30', activeColor: 'bg-emerald-400/30 border-emerald-400 ring-2 ring-emerald-400' },
];

export default function NineBoxSection({ employeeId, initialDesempenho, initialPotencial, cargo, onUpdate }: Props) {
  const { toast } = useToast();
  const [desempenho, setDesempenho] = useState<string>('');
  const [potencial, setPotencial] = useState<string>('');
  const [confianca, setConfianca] = useState<string>('');
  const [observacao, setObservacao] = useState('');
  const [activeTab, setActiveTab] = useState('tradicional');
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

  useEffect(() => {
    fetchCycles();
    fetchHistorico();
  }, [employeeId, fetchCycles, fetchHistorico]);

  async function handleSave() {
    if (activeTab === 'tradicional' && (!desempenho || !potencial)) {
      toast({ title: 'Atenção', description: 'Selecione um quadro na matriz antes de salvar.', variant: 'destructive' });
      return;
    }
    if (activeTab === 'trust' && (!desempenho || !confianca)) {
      toast({ title: 'Atenção', description: 'Selecione um quadro na matriz de confiança antes de salvar.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    
    if (activeTab === 'tradicional') {
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
        toast({ title: 'Avaliação Salva', description: 'O Nine Box Tradicional foi registrado com sucesso.' });
        setDesempenho('');
        setPotencial('');
        setObservacao('');
        fetchHistorico();
        setViewMode('historico');
        onUpdate();
      }
    } else {
      // Trust Matrix - Salvar no Supabase (trust_matrix_historico) ou LocalStorage se falhar
      const trustData = {
        employee_id: employeeId,
        desempenho,
        confianca,
        cycle,
        observacao,
        created_at: new Date().toISOString()
      };
      
      try {
        const { error } = await supabase.from('trust_matrix_historico').insert(trustData);
        if (error) {
          console.error(error);
          const history = JSON.parse(localStorage.getItem(`trust_history_${employeeId}`) || '[]');
          history.push(trustData);
          localStorage.setItem(`trust_history_${employeeId}`, JSON.stringify(history));
          toast({ title: 'Salvo Localmente', description: 'O banco de dados de confiança ainda não foi criado. Salvo localmente.', variant: 'default' });
        } else {
          toast({ title: 'Avaliação Salva', description: 'Matriz de Confiança registrada com sucesso.' });
        }
      } catch (e) {
        const history = JSON.parse(localStorage.getItem(`trust_history_${employeeId}`) || '[]');
        history.push(trustData);
        localStorage.setItem(`trust_history_${employeeId}`, JSON.stringify(history));
        toast({ title: 'Salvo Localmente', description: 'Matriz de Confiança salva no dispositivo.', variant: 'default' });
      }

      setLoading(false);
      setDesempenho('');
      setConfianca('');
      setObservacao('');
    }
  }

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
            <p className="text-sm text-muted-foreground">Acompanhe o desempenho, potencial e confiança.</p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tradicional">Nine Box (Tradicional)</TabsTrigger>
          <TabsTrigger value="trust" className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Nine Box (Trust)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tradicional">
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
                    // Em Nova Avaliação, TODAS as caixas ficam embaçadas para evitar viés.
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
        </TabsContent>

        <TabsContent value="trust">
          {viewMode === 'nova' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-4">
              {/* Box Selector - Trust Matrix */}
              <div className="bg-background rounded-xl p-6 border border-border/50 shadow-sm relative">
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-muted-foreground tracking-widest">
                  DESEMPENHO
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-muted-foreground tracking-widest">
                  CONFIANÇA (TRUST)
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 relative">
                  {matrixBoxesTrust.map((box) => {
                    const isSelected = confianca === box.conf && desempenho === box.des;
                    const shouldBlur = true;

                    return (
                      <button
                        key={`trust-${box.des}-${box.conf}`}
                        onClick={() => { setConfianca(box.conf); setDesempenho(box.des); }}
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

              {/* Form - Trust Matrix */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Desempenho</p>
                    <p className="font-bold text-lg">{desempenho || '—'}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Confiança</p>
                    <p className="font-bold text-lg">{confianca || '—'}</p>
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
                    <Label>Feedback sobre Confiança (Lealdade, Ética)</Label>
                    <Textarea 
                      placeholder="Descreva observações de caráter, fit cultural, lealdade e confiabilidade..."
                      className="min-h-[120px] resize-none"
                      value={observacao}
                      onChange={e => setObservacao(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleSave} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Matriz de Confiança'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl text-sm font-medium mt-4">
              O Histórico da Matriz de Confiança estará disponível em breve no seu perfil de usuário (requer atualização do banco de dados).
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
