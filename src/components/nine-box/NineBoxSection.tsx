import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Target, TrendingUp } from 'lucide-react';

interface Props {
  employeeId: string;
  initialDesempenho: string | null;
  initialPotencial: string | null;
  cargo: string;
  onUpdate: () => void;
}

export default function NineBoxSection({ employeeId, initialDesempenho, initialPotencial, cargo, onUpdate }: Props) {
  const { toast } = useToast();
  const [desempenho, setDesempenho] = useState<string>(initialDesempenho || 'Médio');
  const [potencial, setPotencial] = useState<string>(initialPotencial || 'Médio');
  const [loading, setLoading] = useState(false);

  const isElegivel = ['analista', 'supervisor', 'coordenador', 'gerente'].some(c => cargo.toLowerCase().includes(c));

  async function handleSave() {
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-foreground">Avaliação Matriz 9-Box</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Desempenho (Eixo X)</Label>
          <Select value={desempenho} onValueChange={setDesempenho}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o desempenho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Baixo">Baixo (Não atende)</SelectItem>
              <SelectItem value="Médio">Médio (Atende)</SelectItem>
              <SelectItem value="Alto">Alto (Supera)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Histórico de resultados e metas.</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Potencial (Eixo Y)</Label>
          <Select value={potencial} onValueChange={setPotencial}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o potencial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Baixo">Baixo (Limitado)</SelectItem>
              <SelectItem value="Médio">Médio (Em desenvolvimento)</SelectItem>
              <SelectItem value="Alto">Alto (Pronto para promoção)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Capacidade de assumir novas complexidades.</p>
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          <TrendingUp className="w-4 h-4" />
          {loading ? 'Salvando...' : 'Salvar Avaliação'}
        </Button>
      </div>
    </div>
  );
}
