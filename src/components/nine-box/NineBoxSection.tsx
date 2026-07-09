import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp, CheckCircle2, History, Plus } from 'lucide-react';
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

// function generateCycles() {
//   const currentYear = new Date().getFullYear();
//   return [
//     `S1 ${currentYear}`,
//     `S2 ${currentYear}`,
//     `S1 ${currentYear + 1}`,
//     `S2 ${currentYear + 1}`,
//   ];
// }

export default function NineBoxSection({ employeeId, initialDesempenho, initialPotencial, cargo, onUpdate }: Props) {
  const { toast } = useToast();
  const [desempenho, setDesempenho] = useState<string>('');
  const [potencial, setPotencial] = useState<string>('');
  const [observacao, setObservacao] = useState('');
  const [cycle, setCycle] = useState<string>('');
  const [dbCycles, setDbCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'nova' | 'historico'>('nova');

  useEffect(() => {
    fetchCycles();
    fetchHistorico();
  }, [employeeId]);

  async function fetchCycles() {
    const { data } = await supabase.from('evaluation_cycles').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setDbCycles(data);
      setCycle(data[0].name);
    } else {
      setCycle('Ciclo Padrão');
    }
  }

  // Lógica de elegibilidade dinâmica baseada no ciclo selecionado
  const selectedDbCycle = dbCycles.find(c => c.name === cycle);
  const eligibleRolesArray = selectedDbCycle?.eligible_roles || [];
  
  const isElegivel = eligibleRolesArray.length > 0 
    ? eligibleRolesArray.some((c: string) => cargo.toLowerCase().includes(c.toLowerCase()))
    : ['analista', 'supervisor', 'coordenador', 'gerente'].some(c => cargo.toLowerCase().includes(c));

  async function fetchHistorico() {
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
  }

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
            <h3 className="font-semibold text-lg text-foreground">Nine Box (Desempenho x Potencial)</h3>
            <p className="text-sm text-muted-foreground">Acompanhe a evolução semestral do colaborador na matriz.</p>
          </div>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg border">
          <button
            onClick={() => setViewMode('historico')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'historico' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <History className="w-4 h-4" /> Histórico
          </button>
          <button
            onClick={() => setViewMode('nova')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'nova' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Plus className="w-4 h-4" /> Nova Avaliação
          </button>
        </div>
      </div>

      {viewMode === 'historico' && (
        <div className="space-y-4">
          {historico.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20 border-dashed">
              Nenhuma avaliação registrada ainda.
            </div>
          ) : (
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
          )}
        </div>
      )}

      {viewMode === 'nova' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex gap-6 items-end">
            <div className="space-y-2 w-48">
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
            <div className="flex-1 space-y-2">
              <Label>Observações / Justificativas</Label>
              <Textarea 
                placeholder="Descreva o que motivou a escolha neste quadrante..." 
                value={observacao} 
                onChange={(e) => setObservacao(e.target.value)}
                className="resize-none h-[40px] focus:h-[80px] transition-all"
              />
            </div>
            <Button onClick={handleSave} disabled={loading || !desempenho || !potencial} className="shrink-0 gap-2 h-10">
              <TrendingUp className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Salvar Avaliação'}
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center pt-4 border-t">
            {/* Y-Axis Label */}
            <div className="hidden md:flex relative w-16 h-[360px]">
              <div className="absolute top-1/2 left-0 -translate-y-1/2 -rotate-90 text-sm font-bold tracking-wider text-muted-foreground whitespace-nowrap origin-center">
                POTENCIAL (FUTURO)
              </div>
              <div className="absolute top-0 right-2 h-full flex flex-col justify-between text-xs text-muted-foreground font-medium uppercase text-right py-6">
                <span>Alto</span>
                <span>Médio</span>
                <span>Baixo</span>
              </div>
            </div>

            {/* The Grid */}
            <div className="w-full max-w-[600px]">
              <div className="grid grid-cols-3 gap-3 h-[360px]">
                {matrixBoxes.map((box, idx) => {
                  const isSelected = box.pot === potencial && box.des === desempenho;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setDesempenho(box.des);
                        setPotencial(box.pot);
                      }}
                      className={`
                        relative p-3 rounded-xl border flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-200 shadow-sm
                        ${isSelected ? box.activeColor : box.color}
                        ${!isSelected && desempenho !== '' ? 'opacity-50 hover:opacity-100' : 'opacity-100'}
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-5 h-5 text-foreground drop-shadow-md" />
                        </div>
                      )}
                      <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                        {box.label}
                      </span>
                      <span className={`text-[10px] leading-tight ${isSelected ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                        {box.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* X-Axis Label */}
              <div className="mt-4 text-center">
                <div className="flex justify-between px-10 text-xs text-muted-foreground font-medium uppercase mb-2">
                  <span>Baixo</span>
                  <span>Médio</span>
                  <span>Alto</span>
                </div>
                <div className="text-sm font-bold tracking-wider text-muted-foreground">
                  DESEMPENHO (ATUAL)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
