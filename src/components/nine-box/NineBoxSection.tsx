import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, CheckCircle2 } from 'lucide-react';

interface Props {
  employeeId: string;
  initialDesempenho: string | null;
  initialPotencial: string | null;
  cargo: string;
  onUpdate: () => void;
}

const matrixBoxes = [
  // Top Row (Potencial Alto)
  { pot: 'Alto', des: 'Baixo', label: 'Enigma', desc: 'Alto potencial, mas desempenho atual baixo. Precisa de direcionamento.', color: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30', activeColor: 'bg-orange-500/30 border-orange-500 ring-2 ring-orange-500' },
  { pot: 'Alto', des: 'Médio', label: 'Forte Desempenho', desc: 'Alto potencial e bom desempenho. Pronto para crescer.', color: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30', activeColor: 'bg-emerald-500/30 border-emerald-500 ring-2 ring-emerald-500' },
  { pot: 'Alto', des: 'Alto', label: 'Estrela (Alto Potencial)', desc: 'Talento excepcional. Pronto para novos desafios e liderança.', color: 'bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-600/30', activeColor: 'bg-emerald-600/30 border-emerald-600 ring-2 ring-emerald-600' },
  // Middle Row (Potencial Médio)
  { pot: 'Médio', des: 'Baixo', label: 'Questionável', desc: 'Potencial médio, mas baixo desempenho. Avaliar fit ou necessidade de PDI.', color: 'bg-red-400/10 hover:bg-red-400/20 border-red-400/30', activeColor: 'bg-red-400/30 border-red-400 ring-2 ring-red-400' },
  { pot: 'Médio', des: 'Médio', label: 'Mantenedor (Chave)', desc: 'Sólido e confiável. Essencial para o dia a dia da operação.', color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30', activeColor: 'bg-blue-500/30 border-blue-500 ring-2 ring-blue-500' },
  { pot: 'Médio', des: 'Alto', label: 'Forte Desempenho', desc: 'Alto desempenho constante. Ótimo exemplo para a equipe.', color: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30', activeColor: 'bg-emerald-500/30 border-emerald-500 ring-2 ring-emerald-500' },
  // Bottom Row (Potencial Baixo)
  { pot: 'Baixo', des: 'Baixo', label: 'Insuficiente', desc: 'Baixo em ambos. Necessita ação corretiva imediata ou desligamento.', color: 'bg-red-600/10 hover:bg-red-600/20 border-red-600/30', activeColor: 'bg-red-600/30 border-red-600 ring-2 ring-red-600' },
  { pot: 'Baixo', des: 'Médio', label: 'Eficaz', desc: 'Desempenho aceitável, mas sem expectativa de crescimento acentuado.', color: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30', activeColor: 'bg-orange-500/30 border-orange-500 ring-2 ring-orange-500' },
  { pot: 'Baixo', des: 'Alto', label: 'Profissional Especializado', desc: 'Excelente na função atual, mas atingiu o limite de ascensão.', color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30', activeColor: 'bg-blue-500/30 border-blue-500 ring-2 ring-blue-500' },
];

export default function NineBoxSection({ employeeId, initialDesempenho, initialPotencial, cargo, onUpdate }: Props) {
  const { toast } = useToast();
  const [desempenho, setDesempenho] = useState<string>(initialDesempenho || '');
  const [potencial, setPotencial] = useState<string>(initialPotencial || '');
  const [loading, setLoading] = useState(false);

  const isElegivel = ['analista', 'supervisor', 'coordenador', 'gerente'].some(c => cargo.toLowerCase().includes(c));

  async function handleSave() {
    if (!desempenho || !potencial) {
      toast({ title: 'Atenção', description: 'Selecione um quadro na matriz antes de salvar.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('funcionarios')
      .update({
        nine_box_desempenho: desempenho,
        nine_box_potencial: potencial
      })
      .eq('id', employeeId);

    setLoading(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Salvo com sucesso', description: 'A matriz 9-box foi atualizada.' });
      onUpdate();
    }
  }

  if (!isElegivel) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center h-full bg-muted/10 rounded-xl border border-dashed border-border/50">
        <Target className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">O cargo <strong>{cargo}</strong> não é elegível para avaliação 9-Box neste ciclo.</p>
        <p className="text-xs text-muted-foreground mt-1">(Apenas Analistas, Supervisores, Coordenadores e Gerentes)</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-500" />
          <div>
            <h3 className="font-semibold text-lg text-foreground">Matriz 9-Box Interativa</h3>
            <p className="text-sm text-muted-foreground">Clique no quadrante correspondente para avaliar o colaborador.</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading} className="gap-2 shadow-sm">
          <TrendingUp className="w-4 h-4" />
          {loading ? 'Salvando...' : 'Salvar Avaliação'}
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center">
        {/* Y-Axis Label */}
        <div className="hidden md:flex flex-col justify-center items-center h-[400px]">
          <div className="rotate-[-90deg] text-sm font-bold tracking-wider text-muted-foreground whitespace-nowrap mb-8">
            POTENCIAL (FUTURO)
          </div>
          <div className="flex flex-col justify-between h-[300px] text-xs text-muted-foreground font-medium uppercase text-right mr-2 mt-4">
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
  );
}
