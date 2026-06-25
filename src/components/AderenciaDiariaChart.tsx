import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Upload, Trash2, Save, FileSpreadsheet, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ReferenceLine, Area } from 'recharts';
import { supabase } from '@/lib/supabase';

interface Medicao {
  id: number;
  _supabaseId?: string;
  mes: string;
  aderenciaDiaria?: { dia: string; aderencia: number }[];
  [key: string]: any;
}

interface AderenciaDiariaChartProps {
  medicoes: Medicao[];
  setMedicoes: (val: Medicao[]) => void;
  setExpandedChart: (chart: string) => void;
}

export function AderenciaDiariaChart({ medicoes, setMedicoes, setExpandedChart }: AderenciaDiariaChartProps) {
  const { toast } = useToast();
  const [selectedMesId, setSelectedMesId] = useState<string>(
    medicoes.length > 0 ? medicoes[medicoes.length - 1].id.toString() : ''
  );
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempDias, setTempDias] = useState<{ dia: string; aderencia: number }[]>([]);
  const [novoDia, setNovoDia] = useState('');
  const [novaAderencia, setNovaAderencia] = useState('');

  const selectedMedicao = medicoes.find(m => m.id.toString() === selectedMesId);
  const aderenciaAtual = selectedMedicao?.aderenciaDiaria || [];

  const handleOpenModal = () => {
    setTempDias([...aderenciaAtual]);
    setIsModalOpen(true);
  };

  const handleAddLinha = () => {
    if (!novoDia.trim() || !novaAderencia) {
      toast({ title: 'Erro', description: 'Preencha o dia e a aderência.', variant: 'destructive' });
      return;
    }
    const aderenciaNum = parseFloat(novaAderencia.replace(',', '.'));
    if (isNaN(aderenciaNum) || aderenciaNum < 0 || aderenciaNum > 100) {
      toast({ title: 'Erro', description: 'A aderência deve ser um número entre 0 e 100.', variant: 'destructive' });
      return;
    }

    setTempDias([...tempDias, { dia: novoDia.trim(), aderencia: aderenciaNum }]);
    setNovoDia('');
    setNovaAderencia('');
  };

  const handleRemoveLinha = (index: number) => {
    setTempDias(tempDias.filter((_, i) => i !== index));
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

        const importados: { dia: string; aderencia: number }[] = [];
        
        json.forEach((row) => {
          // Busca pelas chaves do Excel baseado no print do usuário
          const diaKey = Object.keys(row).find(k => k.toLowerCase().includes('data - d') || k.toLowerCase().includes('dia'));
          const mesKey = Object.keys(row).find(k => k.toLowerCase().includes('data - m') || k.toLowerCase().includes('mês') || k.toLowerCase().includes('mes'));
          const aderenciaKey = Object.keys(row).find(k => k.toLowerCase().includes('% df') || k.toLowerCase().includes('aderencia') || k.toLowerCase().includes('aderência'));

          if (diaKey && aderenciaKey) {
            let diaFormatado = String(row[diaKey]);
            if (mesKey && row[mesKey]) {
               // Formato: 21/mai
               const mesStr = String(row[mesKey]).substring(0, 3).toLowerCase();
               diaFormatado = `${diaFormatado.padStart(2, '0')}/${mesStr}`;
            }

            let aderenciaValor = row[aderenciaKey];
            let aderenciaNum = 0;
            
            // Tratamento caso venha como texto "97,16%" ou decimal 0.9716
            if (typeof aderenciaValor === 'string') {
              aderenciaValor = aderenciaValor.replace('%', '').replace(',', '.');
              aderenciaNum = parseFloat(aderenciaValor);
            } else if (typeof aderenciaValor === 'number') {
              // No excel, porcentagens muitas vezes vêm como decimais (ex: 97% = 0.97)
              if (aderenciaValor <= 1) {
                aderenciaNum = aderenciaValor * 100;
              } else {
                aderenciaNum = aderenciaValor;
              }
            }

            if (!isNaN(aderenciaNum)) {
              importados.push({
                dia: diaFormatado,
                aderencia: Number(aderenciaNum.toFixed(2))
              });
            }
          }
        });

        if (importados.length > 0) {
          // Remover duplicidades de dia substituindo o antigo pelo novo
          const map = new Map<string, { dia: string; aderencia: number }>();
          tempDias.forEach(item => map.set(item.dia, item));
          importados.forEach(item => map.set(item.dia, item));
          
          setTempDias(Array.from(map.values()));
          toast({ title: 'Sucesso', description: `${importados.length} dias importados da planilha.` });
        } else {
          toast({ title: 'Aviso', description: 'Não conseguimos encontrar as colunas "Data - D", "Data - M" e "% DF".', variant: 'destructive' });
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

    const updatedMedicao = { ...selectedMedicao, aderenciaDiaria: tempDias };
    
    if (updatedMedicao._supabaseId) {
      const { error } = await supabase.from('medicoes').update({ dados: updatedMedicao }).eq('id', updatedMedicao._supabaseId);
      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível salvar na nuvem.', variant: 'destructive' });
        return;
      }
    }

    const novosMedicoes = medicoes.map(m => m.id.toString() === selectedMesId ? updatedMedicao : m);
    setMedicoes(novosMedicoes);
    localStorage.setItem('corporate_cheerleader_medicoes', JSON.stringify(novosMedicoes));
    
    setIsModalOpen(false);
    toast({ title: 'Sucesso', description: 'Aderência diária atualizada!' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const aderencia = payload[0].value;
      const isAbaixo = aderencia < 95;
      return (
        <div className="bg-background/95 border border-border/50 p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="font-bold text-sm mb-1">{label}</p>
          <p className={`font-bold text-lg flex items-center gap-2 ${isAbaixo ? 'text-destructive' : 'text-success'}`}>
            <span className={`w-2 h-2 rounded-full ${isAbaixo ? 'bg-destructive' : 'bg-success'}`} />
            {aderencia.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-sm border-border transition-all duration-300 hover:shadow-lg hover:border-primary/50 relative">
      {/* Botões de Ação Dinâmicos sobre o CardHeader */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <Select value={selectedMesId} onValueChange={setSelectedMesId}>
          <SelectTrigger className="w-[140px] h-8 bg-background/50 backdrop-blur text-xs">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {medicoes.slice().reverse().map(m => (
              <SelectItem key={m.id} value={m.id.toString()}>{m.mes}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleOpenModal} size="sm" variant="outline" className="h-8 text-xs border-primary/20 hover:bg-primary/5 text-primary">
          <Upload className="w-3 h-3 mr-1" /> Importar Diário
        </Button>
      </div>

      <CardHeader onClick={() => setExpandedChart('diario')} className="cursor-pointer">
        <CardTitle className="text-xl flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-success" /> Evolução Aderência (Diário)
        </CardTitle>
        <CardDescription>Acompanhamento do mês de {selectedMedicao?.mes || 'selecionado'}</CardDescription>
      </CardHeader>
      
      <CardContent onClick={() => setExpandedChart('diario')} className="cursor-pointer">
        <div className="h-[350px] w-full mt-4">
          {aderenciaAtual.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={aderenciaAtual} margin={{ top: 30, right: 30, bottom: 5, left: -15 }}>
                <defs>
                  <linearGradient id="colorAderenciaDia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={10} angle={-45} textAnchor="end" height={60} />
                <YAxis domain={['auto', 'auto']} stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                
                <ReferenceLine y={95} stroke="hsl(var(--warning))" strokeDasharray="5 5" label={{ position: 'top', value: 'Meta (95%)', fill: 'hsl(var(--warning))', fontSize: 11, fontWeight: 'bold' }} />
                
                <Area type="monotone" dataKey="aderencia" fill="url(#colorAderenciaDia)" stroke="none" />
                <Line 
                  type="monotone" 
                  dataKey="aderencia" 
                  name="Aderência (%)" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={3} 
                  dot={(props: any) => {
                    const { cx, cy, value, key } = props;
                    return (
                      <circle 
                        key={key} 
                        cx={cx} 
                        cy={cy} 
                        r={4} 
                        stroke={value >= 95 ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                        strokeWidth={2} 
                        fill="hsl(var(--background))" 
                      />
                    );
                  }} 
                  activeDot={{ r: 6, fill: "hsl(var(--success))" }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/5">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhum dado diário lançado para {selectedMedicao?.mes}.</p>
              <Button onClick={(e) => { e.stopPropagation(); handleOpenModal(); }} variant="link" className="text-primary mt-2">
                Importar dados agora
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* MODAL DE IMPORTAÇÃO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-xl">Aderência Diária - {selectedMedicao?.mes}</DialogTitle>
            <DialogDescription>Importe a planilha do Excel (com as colunas "Data - M", "Data - D" e "% DF") ou preencha manualmente.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm">
                <p className="font-bold flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-success" /> Importação Inteligente</p>
                <p className="text-muted-foreground text-xs mt-1">Carregue a planilha contendo os dias e % DF do mês.</p>
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

            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Dia</Label>
                <Input 
                  placeholder="Ex: 21/mai" 
                  value={novoDia}
                  onChange={(e) => setNovoDia(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLinha()}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Aderência (%)</Label>
                <Input 
                  placeholder="Ex: 97.16" 
                  value={novaAderencia}
                  onChange={(e) => setNovaAderencia(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLinha()}
                />
              </div>
              <Button onClick={handleAddLinha} variant="secondary" className="px-3">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="border border-border rounded-xl overflow-hidden mt-4">
              <div className="bg-muted px-4 py-2 text-xs font-bold uppercase text-muted-foreground border-b border-border flex justify-between">
                <span>Dias Lançados ({tempDias.length})</span>
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {tempDias.length > 0 ? (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border/50">
                      {tempDias.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="px-4 py-2 font-medium">{item.dia}</td>
                          <td className={`px-4 py-2 font-bold ${item.aderencia >= 95 ? 'text-success' : 'text-destructive'}`}>
                            {item.aderencia.toFixed(2)}%
                          </td>
                          <td className="px-4 py-2 text-right">
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
                    Nenhum dia lançado ainda.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-success hover:bg-success/90 text-white min-w-[120px]">
                <Save className="w-4 h-4 mr-2" /> Salvar Gráfico
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
