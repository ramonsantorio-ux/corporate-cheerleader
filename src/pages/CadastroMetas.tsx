import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Target, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function CadastroMetas() {
  const [setor, setSetor] = useState('Busato');
  const [ano, setAno] = useState('2026');
  const [mes, setMes] = useState(MESES[new Date().getMonth()]);
  const [indicador, setIndicador] = useState('');
  const [referencia, setReferencia] = useState('');
  const [alcancado, setAlcancado] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indicador || !referencia || !alcancado) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('indicadores_metas')
        .insert({
          setor,
          ano: parseInt(ano),
          mes,
          indicador,
          referencia: parseFloat(referencia.replace(',', '.')),
          alcancado: parseFloat(alcancado.replace(',', '.'))
        });

      if (error) throw error;

      toast.success('Meta cadastrada com sucesso!');
      setIndicador('');
      setReferencia('');
      setAlcancado('');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Erro ao salvar meta:', error);
      toast.error('Erro ao salvar: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/gestao-performance">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lançamento de Metas</h1>
          <p className="text-muted-foreground">Cadastre os resultados mensais para os Dashboards de Metas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Novo Lançamento
          </CardTitle>
          <CardDescription>
            Insira os dados do indicador para atualizar os gráficos do dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select value={setor} onValueChange={setSetor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Busato">Busato</SelectItem>
                    <SelectItem value="Porto">Porto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ano</Label>
                <Select value={ano} onValueChange={setAno}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mês</Label>
                <Select value={mes} onValueChange={setMes}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
              
              <div className="space-y-2 md:col-span-1">
                <Label>Nome do Indicador</Label>
                <Input 
                  placeholder="Ex: Aderência à Programação" 
                  value={indicador}
                  onChange={(e) => setIndicador(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Meta (Referência)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="Ex: 30.00" 
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Resultado Alcançado</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="Ex: 18.33" 
                  value={alcancado}
                  onChange={(e) => setAlcancado(e.target.value)}
                />
              </div>

            </div>

            {/* Live Calculation Preview */}
            {(referencia && alcancado && parseFloat(referencia.replace(',', '.')) > 0) ? (
              <div className="p-4 mt-4 bg-muted/30 rounded-lg border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Pré-visualização do Cálculo</p>
                  <p className="text-xs text-muted-foreground">Isso é como o indicador aparecerá no Dashboard</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {((parseFloat(alcancado.replace(',', '.')) / parseFloat(referencia.replace(',', '.'))) * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">de Atingimento</p>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-6">
              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Salvando...' : 'Salvar Indicador'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
