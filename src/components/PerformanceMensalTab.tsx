import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Upload, BarChart3, Trash2, Save, FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { readExcelRows } from '@/lib/excel';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, Line, Legend, ReferenceLine } from 'recharts';
import { supabase } from '@/lib/supabase';

interface DesvioMensal {
  desvio: string;
  qtde: number;
}

interface Medicao {
  id: number;
  _supabaseId?: string;
  mes: string;
  performanceMensal?: DesvioMensal[];
  aderencia: number;
  [key: string]: string | number | undefined | DesvioMensal[];
}

interface PerformanceMensalTabProps {
  medicoes: Medicao[];
  setMedicoes: (val: Medicao[]) => void;
  timeRange: string;
  chartData?: Record<string, unknown>[];
}

export function PerformanceMensalTab({ medicoes, setMedicoes, timeRange, chartData = [] }: PerformanceMensalTabProps) {
  const { toast } = useToast();
  
  // Use the available chartData to populate the selector so we always have enriched data
  const [selectedMesId, setSelectedMesId] = useState<string>(
    chartData.length > 0 ? chartData[chartData.length - 1].id.toString() : ''
  );
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempDesvios, setTempDesvios] = useState<DesvioMensal[]>([]);
  const [novoDesvio, setNovoDesvio] = useState('');
  const [novaQtde, setNovaQtde] = useState('');

  // Find current and previous month in chartData to calculate MoM variations
  const currentMonthIdx = chartData.findIndex(m => m.id.toString() === selectedMesId);
  const selectedMedicao = currentMonthIdx >= 0 ? chartData[currentMonthIdx] : null;
  const previousMedicao = currentMonthIdx > 0 ? chartData[currentMonthIdx - 1] : null;
  
  const desviosAtuais = selectedMedicao?.performanceMensal || [];

  // KPI calculations
  const faturamento = selectedMedicao?.receitaTotal || 0;
  const faturamentoPrev = previousMedicao?.receitaTotal || 0;
  const faturamentoMoM = faturamentoPrev ? ((faturamento - faturamentoPrev) / faturamentoPrev) * 100 : 0;

  const lucro = selectedMedicao?.saldo || 0;
  const lucroPrev = previousMedicao?.saldo || 0;
  const lucroMoM = lucroPrev ? ((lucro - lucroPrev) / Math.abs(lucroPrev)) * 100 : 0;

  const margem = selectedMedicao?.margem || 0;
  const margemPrev = previousMedicao?.margem || 0;
  const margemMoM = margem - margemPrev; // Absolute difference for percentages

  const aderencia = selectedMedicao?.aderencia || 0;
  const aderenciaPrev = previousMedicao?.aderencia || 0;
  const aderenciaMoM = aderencia - aderenciaPrev;

  // Goals
  const META_SLA = 95;
  const META_MARGEM = 20;

  // Financial offenders calculation (Top 4)
  const ofensoresFinanceiros = useMemo(() => {
    if (!selectedMedicao) return [];
    
    const list = [
      { name: 'Glosas e Multas', value: selectedMedicao.perdas || 0, icon: AlertTriangle, color: 'text-destructive' },
      { name: 'Manutenção (Pneus/Peças/Serv.)', value: selectedMedicao.manutencaoTotal || 0, icon: DollarSign, color: 'text-warning' },
      { name: 'Horas Extras', value: selectedMedicao.horasExtras || 0, icon: TrendingUp, color: 'text-amber-500' },
      { name: 'Combustível', value: selectedMedicao.combustivelTotal || 0, icon: DollarSign, color: 'text-blue-500' }
    ];
    
    return list.sort((a, b) => b.value - a.value).filter(o => o.value > 0);
  }, [selectedMedicao]);

  // Formato BRL
  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Handlers for Pareto
  const handleOpenModal = () => {
    setTempDesvios([...desviosAtuais]);
    setIsModalOpen(true);
  };

  const handleAddLinha = () => {
    if (!novoDesvio.trim() || !novaQtde) {
      toast({ title: 'Erro', description: 'Preencha o motivo do desvio e a quantidade.', variant: 'destructive' });
      return;
    }
    const qtdeNum = parseInt(novaQtde);
    if (isNaN(qtdeNum) || qtdeNum <= 0) {
      toast({ title: 'Erro', description: 'A quantidade deve ser maior que zero.', variant: 'destructive' });
      return;
    }

    setTempDesvios([...tempDesvios, { desvio: novoDesvio.toUpperCase(), qtde: qtdeNum }]);
    setNovoDesvio('');
    setNovaQtde('');
  };

  const handleRemoveLinha = (index: number) => {
    setTempDesvios(tempDesvios.filter((_, i) => i !== index));
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const ab = await file.arrayBuffer();
      const json = await readExcelRows(ab);

      const importados: DesvioMensal[] = [];
      json.forEach((row) => {
        const desvioKey = Object.keys(row).find(k => k.toLowerCase().includes('desvio') || k.toLowerCase().includes('motivo'));
        const qtdeKey = Object.keys(row).find(k => k.toLowerCase().includes('qtde') || k.toLowerCase().includes('qtd') || k.toLowerCase().includes('ocorr'));

        if (desvioKey && qtdeKey && row[desvioKey]) {
          const qtdeNum = parseInt(String(row[qtdeKey]));
          if (!isNaN(qtdeNum)) {
            importados.push({
              desvio: String(row[desvioKey]).toUpperCase().trim(),
              qtde: qtdeNum
            });
          }
        }
      });

      if (importados.length > 0) {
        setTempDesvios([...tempDesvios, ...importados]);
        toast({ title: 'Sucesso', description: `${importados.length} desvios importados da planilha.` });
      } else {
        toast({ title: 'Aviso', description: 'Nenhum dado válido encontrado na planilha. Verifique se as colunas se chamam "Desvio" e "Qtde".', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Falha ao processar o arquivo Excel.', variant: 'destructive' });
    }
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!selectedMedicao) return;
    
    // Atualiza base de medições reais (não a chartData)
    const baseMedicao = medicoes.find(m => m.id === selectedMedicao.id);
    if (!baseMedicao) return;

    const agrupados = tempDesvios.reduce((acc, curr) => {
      const idx = acc.findIndex(a => a.desvio === curr.desvio);
      if (idx >= 0) acc[idx].qtde += curr.qtde;
      else acc.push({ ...curr });
      return acc;
    }, [] as DesvioMensal[]);

    agrupados.sort((a, b) => b.qtde - a.qtde);

    const updatedMedicao = { ...baseMedicao, performanceMensal: agrupados };
    
    if (updatedMedicao._supabaseId) {
      const { error } = await supabase.from('medicoes').update({ dados: updatedMedicao }).eq('id', updatedMedicao._supabaseId);
      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível salvar na nuvem.', variant: 'destructive' });
        return;
      }
    }

    const novosMedicoes = medicoes.map(m => m.id === baseMedicao.id ? updatedMedicao : m);
    setMedicoes(novosMedicoes);
    localStorage.setItem('corporate_cheerleader_medicoes', JSON.stringify(novosMedicoes));
    
    setIsModalOpen(false);
    toast({ title: 'Sucesso', description: 'Desvios salvos com sucesso!' });
  };

  const paretoData = useMemo(() => {
    let accumulated = 0;
    const total = desviosAtuais.reduce((acc, curr) => acc + curr.qtde, 0);
    
    return desviosAtuais.map((item, index) => {
      accumulated += item.qtde;
      const percentualAcumulado = total > 0 ? (accumulated / total) * 100 : 0;
      return {
        ...item,
        percentual: percentualAcumulado.toFixed(1),
        rank: index + 1
      };
    });
  }, [desviosAtuais]);

  const CustomParetoTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number | string }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border/50 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[200px]">
          <p className="font-black text-sm mb-3 border-b border-border/50 pb-2">{label}</p>
          <div className="flex items-center justify-between gap-4 text-sm mb-2">
            <span className="text-muted-foreground font-medium flex items-center gap-2">
               <div className="w-3 h-3 rounded-full shadow-sm bg-primary" /> Ocorrências
            </span>
            <span className="font-bold text-foreground">{payload[0].value}</span>
          </div>
          {payload[1] && (
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground font-medium flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full shadow-sm bg-warning" /> Acumulado
              </span>
              <span className="font-bold text-warning">{payload[1].value}%</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomTrendTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border/50 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[200px]">
          <p className="font-black text-sm mb-3 border-b border-border/50 pb-2">{label}</p>
          <div className="flex items-center justify-between gap-4 text-sm mb-2">
            <span className="text-muted-foreground font-medium flex items-center gap-2">
               <div className="w-3 h-3 rounded-full shadow-sm bg-primary" /> Faturamento
            </span>
            <span className="font-bold text-primary">{formatBRL(payload[0].value)}</span>
          </div>
          {payload[1] && (
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground font-medium flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full shadow-sm bg-success" /> Margem
              </span>
              <span className="font-bold text-success">{payload[1].value.toFixed(1)}%</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderMoMBadge = (val: number, isPercentDiff = false) => {
    if (val > 0) return <span className="flex items-center text-success text-xs font-bold bg-success/10 px-1.5 py-0.5 rounded"><ArrowUpRight className="w-3 h-3 mr-0.5"/>{isPercentDiff ? '+' : ''}{val.toFixed(1)}%</span>;
    if (val < 0) return <span className="flex items-center text-destructive text-xs font-bold bg-destructive/10 px-1.5 py-0.5 rounded"><ArrowDownRight className="w-3 h-3 mr-0.5"/>{val.toFixed(1)}%</span>;
    return <span className="flex items-center text-muted-foreground text-xs font-bold bg-muted/20 px-1.5 py-0.5 rounded"><Minus className="w-3 h-3 mr-0.5"/>0.0%</span>;
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-xl">
        <p className="text-muted-foreground">Nenhum dado financeiro disponível para exibição.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER & SELECTOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-muted/50 to-muted/10 p-5 rounded-xl border border-border/50 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Painel de Diretoria</h2>
          <p className="text-sm text-muted-foreground">Resumo executivo de performance, ofensores financeiros e metas</p>
        </div>
        <div className="w-full sm:w-[220px]">
          <Select value={selectedMesId} onValueChange={setSelectedMesId}>
            <SelectTrigger className="w-full bg-background border-primary/20 shadow-sm h-10">
              <SelectValue placeholder="Selecione o Mês" />
            </SelectTrigger>
            <SelectContent>
              {chartData.slice().reverse().map(m => (
                <SelectItem key={m.id} value={m.id.toString()}>{m.mes}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 1. RESUMO EXECUTIVO CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Faturamento Bruto</p>
              <div className="p-1.5 bg-primary/10 rounded-md"><DollarSign className="w-4 h-4 text-primary" /></div>
            </div>
            <h3 className="text-2xl font-black text-foreground truncate" title={formatBRL(faturamento)}>{formatBRL(faturamento)}</h3>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">vs mês anterior</p>
              {renderMoMBadge(faturamentoMoM)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lucro Líquido</p>
              <div className="p-1.5 bg-success/10 rounded-md"><TrendingUp className="w-4 h-4 text-success" /></div>
            </div>
            <h3 className={`text-2xl font-black truncate ${lucro >= 0 ? 'text-success' : 'text-destructive'}`} title={formatBRL(lucro)}>
              {formatBRL(lucro)}
            </h3>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">vs mês anterior</p>
              {renderMoMBadge(lucroMoM)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Margem Líquida</p>
              <div className="p-1.5 bg-warning/10 rounded-md"><BarChart3 className="w-4 h-4 text-warning" /></div>
            </div>
            <h3 className="text-2xl font-black text-foreground">{margem.toFixed(2)}%</h3>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">vs mês anterior</p>
              {renderMoMBadge(margemMoM, true)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aderência SLA</p>
              <div className="p-1.5 bg-primary/10 rounded-md"><Target className="w-4 h-4 text-primary" /></div>
            </div>
            <h3 className={`text-2xl font-black ${aderencia >= META_SLA ? 'text-success' : 'text-destructive'}`}>
              {aderencia.toFixed(2)}%
            </h3>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">vs mês anterior</p>
              {renderMoMBadge(aderenciaMoM, true)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. METAS ATINGIDAS */}
        <Card className="shadow-sm border-border flex flex-col">
          <CardHeader className="bg-muted/10 border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Status das Metas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col justify-center gap-6">
            
            <div className={`p-4 rounded-xl border transition-colors ${margem >= META_MARGEM ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold uppercase text-foreground">Margem de Lucro</span>
                {margem >= META_MARGEM ? (
                  <span className="bg-success text-white text-[10px] px-2 py-0.5 rounded-full font-bold">ATINGIDA</span>
                ) : (
                  <span className="bg-destructive text-white text-[10px] px-2 py-0.5 rounded-full font-bold">ABAIXO</span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <span className={`text-3xl font-black ${margem >= META_MARGEM ? 'text-success' : 'text-destructive'}`}>
                  {margem.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground font-medium pb-1">Meta: {META_MARGEM}%</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border transition-colors ${aderencia >= META_SLA ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold uppercase text-foreground">Aderência SLA</span>
                {aderencia >= META_SLA ? (
                  <span className="bg-success text-white text-[10px] px-2 py-0.5 rounded-full font-bold">ATINGIDA</span>
                ) : (
                  <span className="bg-destructive text-white text-[10px] px-2 py-0.5 rounded-full font-bold">ABAIXO</span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <span className={`text-3xl font-black ${aderencia >= META_SLA ? 'text-success' : 'text-destructive'}`}>
                  {aderencia.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground font-medium pb-1">Meta: {META_SLA}%</span>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* 3. TENDÊNCIA DE MARGENS */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="bg-muted/10 border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Evolução de Margem vs Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={10} minTickGap={15} />
                  <YAxis yAxisId="left" tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val}%`} stroke="hsl(var(--success))" fontSize={11} domain={[0, 'auto']} />
                  <Tooltip content={<CustomTrendTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  
                  <Bar yAxisId="left" dataKey="receitaTotal" name="Faturamento" fill="url(#colorFaturamento)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line yAxisId="right" type="monotone" dataKey="margem" name="Margem (%)" stroke="hsl(var(--success))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))" }} activeDot={{ r: 6 }} />
                  <ReferenceLine yAxisId="right" y={META_MARGEM} stroke="hsl(var(--success))" strokeDasharray="3 3" strokeOpacity={0.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 4. TOP OFENSORES FINANCEIROS (Automático) */}
        <Card className="shadow-sm border-border overflow-hidden">
          <CardHeader className="bg-muted/10 border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Ofensores Financeiros (Custos Variáveis)
            </CardTitle>
            <CardDescription>Impacto financeiro automático do mês: {selectedMedicao?.mes}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {ofensoresFinanceiros.length > 0 ? (
              <div className="divide-y divide-border">
                {ofensoresFinanceiros.map((ofensor, idx) => {
                  const Icon = ofensor.icon;
                  const pctReceita = faturamento > 0 ? (ofensor.value / faturamento) * 100 : 0;
                  return (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-muted ${ofensor.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{ofensor.name}</p>
                          <p className="text-xs text-muted-foreground font-medium">Equivale a {pctReceita.toFixed(1)}% do faturamento</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-foreground">{formatBRL(ofensor.value)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhum custo variável significativo ou perda registrada.
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. PARETO DE OCORRÊNCIAS OPERACIONAIS (Manual) */}
        <Card className="shadow-sm border-border overflow-hidden flex flex-col">
          <CardHeader className="bg-muted/10 border-b pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" /> Ocorrências Operacionais (Pareto)
              </CardTitle>
              <CardDescription>Detalhamento manual de eventos de {selectedMedicao?.mes}</CardDescription>
            </div>
            <Button size="sm" onClick={handleOpenModal} variant="outline" className="h-8 shadow-sm">
              <Plus className="w-3.5 h-3.5 mr-1" /> Editar
            </Button>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            {paretoData.length > 0 ? (
              <div className="h-[250px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={paretoData} margin={{ top: 10, right: 30, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="desvio" stroke="hsl(var(--muted-foreground))" fontSize={9} interval={0} angle={-25} textAnchor="end" height={60} tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--warning))" fontSize={10} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                    <Tooltip content={<CustomParetoTooltip />} />
                    <Bar yAxisId="left" dataKey="qtde" name="Ocorrências" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Line yAxisId="right" type="monotone" dataKey="percentual" name="Acumulado %" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center bg-muted/20 rounded-lg border border-dashed border-border">
                <FileSpreadsheet className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium mb-1">Nenhum dado lançado</p>
                <p className="text-xs text-muted-foreground max-w-[200px] mb-4">Adicione ocorrências para gerar a Curva de Pareto.</p>
                <Button onClick={handleOpenModal} size="sm" variant="secondary">Adicionar Dados</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DIALOG DE LANÇAMENTO (Mantido intacto) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-xl">Lançar Desvios - {selectedMedicao?.mes}</DialogTitle>
            <DialogDescription>Importe do Excel ou digite manualmente os ofensores deste mês.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm">
                <p className="font-bold flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-success" /> Importação Rápida</p>
                <p className="text-muted-foreground text-xs mt-1">A planilha precisa ter colunas chamadas "Desvio" e "Qtde".</p>
              </div>
              <div className="relative overflow-hidden inline-block group">
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 group-hover:border-primary transition-all">
                  <Upload className="w-4 h-4 mr-2" /> Escolher Planilha
                </Button>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">OU ADICIONE MANUALMENTE</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Motivo do Desvio</Label>
                <Input placeholder="Ex: MANUTENÇÃO CORRETIVA" value={novoDesvio} onChange={(e) => setNovoDesvio(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddLinha()} />
              </div>
              <div className="w-[120px] space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Ocorrências</Label>
                <Input type="number" placeholder="Ex: 132" value={novaQtde} onChange={(e) => setNovaQtde(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddLinha()} />
              </div>
              <Button onClick={handleAddLinha} variant="secondary" className="px-3"><Plus className="w-4 h-4" /></Button>
            </div>

            <div className="border border-border rounded-xl overflow-hidden mt-4">
              <div className="bg-muted px-4 py-2 text-xs font-bold uppercase text-muted-foreground border-b border-border flex justify-between">
                <span>Itens Prontos para Salvar ({tempDesvios.length})</span>
                <span className="text-primary">{tempDesvios.reduce((a,c) => a + c.qtde, 0)} ocorrências totais</span>
              </div>
              <div className="max-h-[250px] overflow-y-auto">
                {tempDesvios.length > 0 ? (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border/50">
                      {tempDesvios.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="px-4 py-2">{item.desvio}</td>
                          <td className="px-4 py-2 text-center font-bold w-[100px]">{item.qtde}</td>
                          <td className="px-4 py-2 text-right w-[60px]">
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveLinha(idx)} className="h-7 w-7 text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">Nenhum desvio adicionado ainda.</div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-success hover:bg-success/90 text-white min-w-[120px]">
                <Save className="w-4 h-4 mr-2" /> Salvar Tudo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
