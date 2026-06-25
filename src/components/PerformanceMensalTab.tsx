import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Upload, BarChart3, Trash2, Save, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, Line } from 'recharts';
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
  // Other fields exist but we only care about these here
  [key: string]: any;
}

interface PerformanceMensalTabProps {
  medicoes: Medicao[];
  setMedicoes: (val: Medicao[]) => void;
  timeRange: string;
}

export function PerformanceMensalTab({ medicoes, setMedicoes, timeRange }: PerformanceMensalTabProps) {
  const { toast } = useToast();
  const [selectedMesId, setSelectedMesId] = useState<string>(
    medicoes.length > 0 ? medicoes[medicoes.length - 1].id.toString() : ''
  );
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempDesvios, setTempDesvios] = useState<DesvioMensal[]>([]);
  const [novoDesvio, setNovoDesvio] = useState('');
  const [novaQtde, setNovaQtde] = useState('');

  // Filtra as medicoes baseadas no timeRange, se necessário, mas para o Seletor usamos todas
  const selectedMedicao = medicoes.find(m => m.id.toString() === selectedMesId);
  const desviosAtuais = selectedMedicao?.performanceMensal || [];

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
      toast({ title: 'Erro', description: 'A quantidade deve ser um número maior que zero.', variant: 'destructive' });
      return;
    }

    setTempDesvios([...tempDesvios, { desvio: novoDesvio.toUpperCase(), qtde: qtdeNum }]);
    setNovoDesvio('');
    setNovaQtde('');
  };

  const handleRemoveLinha = (index: number) => {
    setTempDesvios(tempDesvios.filter((_, i) => i !== index));
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        const importados: DesvioMensal[] = [];
        json.forEach((row) => {
          // Procura por chaves que pareçam com Desvio e Quantidade
          const desvioKey = Object.keys(row).find(k => k.toLowerCase().includes('desvio') || k.toLowerCase().includes('motivo'));
          const qtdeKey = Object.keys(row).find(k => k.toLowerCase().includes('qtde') || k.toLowerCase().includes('qtd') || k.toLowerCase().includes('ocorr'));

          if (desvioKey && qtdeKey && row[desvioKey]) {
            const qtdeNum = parseInt(row[qtdeKey]);
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
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // reset
  };

  const handleSave = async () => {
    if (!selectedMedicao) return;

    // Agrupa e soma desvios iguais
    const agrupados = tempDesvios.reduce((acc, curr) => {
      const idx = acc.findIndex(a => a.desvio === curr.desvio);
      if (idx >= 0) acc[idx].qtde += curr.qtde;
      else acc.push({ ...curr });
      return acc;
    }, [] as DesvioMensal[]);

    // Ordena do maior para o menor
    agrupados.sort((a, b) => b.qtde - a.qtde);

    const updatedMedicao = { ...selectedMedicao, performanceMensal: agrupados };
    
    // Atualiza supabase se existir _supabaseId
    if (updatedMedicao._supabaseId) {
      const { error } = await supabase.from('medicoes').update({ dados: updatedMedicao }).eq('id', updatedMedicao._supabaseId);
      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível salvar na nuvem.', variant: 'destructive' });
        return;
      }
    }

    // Atualiza estado local
    const novosMedicoes = medicoes.map(m => m.id.toString() === selectedMesId ? updatedMedicao : m);
    setMedicoes(novosMedicoes);
    
    // Atualiza localStorage por precaução
    localStorage.setItem('corporate_cheerleader_medicoes', JSON.stringify(novosMedicoes));
    
    setIsModalOpen(false);
    toast({ title: 'Sucesso', description: 'Desvios salvos e vinculados ao mês!' });
  };

  // Prepara dados do gráfico Pareto
  const chartData = useMemo(() => {
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

  const CustomTooltip = ({ active, payload, label }: any) => {
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

  return (
    <div className="space-y-6">
      {/* HEADER DE FILTRO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Desvios Operacionais</h3>
            <p className="text-sm text-muted-foreground">Análise de Pareto dos principais ofensores da performance</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={selectedMesId} onValueChange={setSelectedMesId}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Selecione o Mês" />
            </SelectTrigger>
            <SelectContent>
              {medicoes.slice().reverse().map(m => (
                <SelectItem key={m.id} value={m.id.toString()}>{m.mes}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleOpenModal} className="shadow-md bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Lançar Desvios
          </Button>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TABELA DE DADOS */}
          <Card className="lg:col-span-1 shadow-sm border-border overflow-hidden">
            <CardHeader className="bg-muted/10 border-b pb-4">
              <CardTitle className="text-base">Tabela de Ocorrências</CardTitle>
              <CardDescription>Detalhamento do mês {selectedMedicao?.mes}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 max-h-[450px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background/95 backdrop-blur z-10 shadow-sm">
                  <tr className="bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Desvio</th>
                    <th className="text-center px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Qtde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {chartData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 font-medium text-xs sm:text-sm">
                        {item.rank}. {item.desvio}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {item.qtde}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/20 font-bold">
                    <td className="px-4 py-3 text-right">TOTAL</td>
                    <td className="px-4 py-3 text-center text-primary">
                      {chartData.reduce((acc, curr) => acc + curr.qtde, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* GRÁFICO PARETO PREMIUM */}
          <Card className="lg:col-span-2 shadow-sm border-border">
            <CardHeader className="bg-muted/10 border-b pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                Curva de Pareto - {selectedMedicao?.mes}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 30, bottom: 60, left: 0 }}>
                    <defs>
                      <linearGradient id="colorDesvios" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="desvio" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10} 
                      interval={0} 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + '...' : val}
                    />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--warning))" fontSize={11} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Bar yAxisId="left" dataKey="qtde" name="Ocorrências" fill="url(#colorDesvios)" radius={[6, 6, 0, 0]} barSize={50}>
                      <LabelList dataKey="qtde" position="top" style={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 'bold' }} />
                    </Bar>
                    
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="percentual" 
                      name="Acumulado %" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))" }} 
                      activeDot={{ r: 6, fill: "hsl(var(--warning))" }} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-xl border border-border border-dashed">
          <FileSpreadsheet className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold mb-2">Nenhum dado lançado para {selectedMedicao?.mes}</h3>
          <p className="text-muted-foreground max-w-md mb-6">Comece lançando os desvios manualmente ou importando uma planilha do Excel com as colunas "Desvio" e "Qtde".</p>
          <Button onClick={handleOpenModal} size="lg" className="shadow-lg">
            <Plus className="w-5 h-5 mr-2" /> Começar Lançamentos
          </Button>
        </div>
      )}

      {/* DIALOG DE EDIÇÃO/LANÇAMENTO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-xl">Lançar Desvios - {selectedMedicao?.mes}</DialogTitle>
            <DialogDescription>Importe do Excel ou digite manualmente os ofensores deste mês.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Ação de Importar Excel */}
            <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm">
                <p className="font-bold flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-success" /> Importação Rápida</p>
                <p className="text-muted-foreground text-xs mt-1">A planilha precisa ter colunas chamadas "Desvio" e "Qtde".</p>
              </div>
              <div className="relative overflow-hidden inline-block group">
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 group-hover:border-primary transition-all">
                  <Upload className="w-4 h-4 mr-2" /> Escolher Planilha
                </Button>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleImportExcel} 
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" 
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">OU ADICIONE MANUALMENTE</span>
              <div className="h-px bg-border flex-1" />
            </div>

            {/* Form de Adição */}
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Motivo do Desvio</Label>
                <Input 
                  placeholder="Ex: MANUTENÇÃO CORRETIVA" 
                  value={novoDesvio}
                  onChange={(e) => setNovoDesvio(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLinha()}
                />
              </div>
              <div className="w-[120px] space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Ocorrências</Label>
                <Input 
                  type="number"
                  placeholder="Ex: 132" 
                  value={novaQtde}
                  onChange={(e) => setNovaQtde(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLinha()}
                />
              </div>
              <Button onClick={handleAddLinha} variant="secondary" className="px-3">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Tabela de Preview */}
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
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveLinha(idx)} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Nenhum desvio adicionado ainda.
                  </div>
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
