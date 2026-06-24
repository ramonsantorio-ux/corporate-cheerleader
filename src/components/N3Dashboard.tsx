import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Download, Plus, Save, Activity, Target, ShieldAlert, BarChart3, Trash } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface N3Data {
  id?: string;
  nome_email: string;
  letra?: string;
  periodo: string;
  total_verificacoes: number;
  total_treinamentos: number;
  total_assistencia: number;
  verificacoes_nc: number;
  perguntas_nc: number;
}

const DEFAULT_NAMES = [
  { nome: 'CRISTALLY NETTO', letra: 'A Noite' },
  { nome: 'GABRIELE MONTARROYOS', letra: 'A Dia' },
  { nome: 'NAIARA SANTOS', letra: 'B Dia' },
  { nome: 'THIAGO GOMES', letra: 'B Noite' }
];

export default function N3Dashboard() {
  const [data, setData] = useState<N3Data[]>([]);
  const [historicalData, setHistoricalData] = useState<N3Data[]>([]);
  const [periodo, setPeriodo] = useState<string>(
    new Date().toISOString().substring(0, 7) // Formato "YYYY-MM"
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState(false);

  const handleClearMonth = async () => {
    if (!confirm(`Tem certeza que deseja apagar todos os lançamentos do período ${periodo}?`)) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('n3_lancamentos').delete().eq('periodo', periodo);
      if (error) throw error;
      toast.success('Dados apagados com sucesso!');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao apagar dados');
    } finally {
      setDeleting(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, [periodo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: allData, error } = await supabase
        .from('n3_lancamentos')
        .select('*')
        .order('periodo', { ascending: true });

      if (error) {
        console.error('Tabela n3 não existe ou erro ao buscar. Iniciando com dados locais.');
        initMockData();
      } else {
        setHistoricalData(allData || []);
        
        // Filter for current period
        const currentPeriodData = (allData || []).filter(d => d.periodo === periodo);
        if (currentPeriodData.length > 0) {
          setData(currentPeriodData.sort((a,b) => a.nome_email.localeCompare(b.nome_email)));
        } else {
          initMockData();
        }
      }
    } catch (e) {
      initMockData();
    }
    setLoading(false);
  };

  const initMockData = () => {
    setData(
      DEFAULT_NAMES.map(colab => ({
        nome_email: colab.nome,
        letra: colab.letra,
        periodo,
        total_verificacoes: 0,
        total_treinamentos: 0,
        total_assistencia: 0,
        verificacoes_nc: 0,
        perguntas_nc: 0
      }))
    );
  };

  const handleChange = (index: number, field: keyof N3Data, value: string) => {
    const newData = [...data];
    if (field === 'nome_email' || field === 'letra') {
      newData[index] = { ...newData[index], [field]: value };
    } else {
      newData[index] = { ...newData[index], [field]: Number(value) || 0 };
    }
    setData(newData);
  };

  const handleAddRow = () => {
    setData([...data, {
      nome_email: '',
      letra: '',
      periodo,
      total_verificacoes: 0,
      total_treinamentos: 0,
      total_assistencia: 0,
      verificacoes_nc: 0,
      perguntas_nc: 0
    }]);
  };

  const handleRemoveRow = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('n3_lancamentos').delete().eq('periodo', periodo);
      
      const { error } = await supabase.from('n3_lancamentos').insert(
        data.map(d => ({
          nome_email: d.nome_email || 'SEM NOME',
          letra: d.letra || '',
          periodo: d.periodo,
          total_verificacoes: d.total_verificacoes,
          total_treinamentos: d.total_treinamentos,
          total_assistencia: d.total_assistencia,
          verificacoes_nc: d.verificacoes_nc,
          perguntas_nc: d.perguntas_nc
        }))
      );

      if (error) throw error;
      toast.success('Dados salvos com sucesso!');
      fetchData(); 
    } catch (err: any) {
      toast.error('Ocorreu um erro ao salvar: ' + err.message);
    }
    setSaving(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        const importedData: N3Data[] = rawData.map((row: any) => ({
          nome_email: row['NOME-EMAIL'] || row['Nome'] || '',
          letra: row['LETRA'] || row['Letra'] || '',
          periodo: periodo,
          total_verificacoes: Number(row['TOTAL VERIFICAÇÕES'] || row['Total Verificações'] || 0),
          total_treinamentos: Number(row['TOTAL TREINAMENTOS'] || row['Total Treinamentos'] || 0),
          total_assistencia: Number(row['TOTAL ASSISTÊNCIA'] || row['Total Assistência'] || 0),
          verificacoes_nc: Number(row['VERIFICAÇÕES NÃO CONFORMES'] || row['Verificações NC'] || 0),
          perguntas_nc: Number(row['PERGUNTAS COM NÃO CONFORMIDADES'] || row['Perguntas NC'] || 0),
        }));

        if (importedData.length > 0) {
          setData(importedData);
          toast.success('Planilha importada! Clique em Salvar na Nuvem para persistir.');
        } else {
          toast.error('Planilha vazia ou formato inválido.');
        }
      } catch (err) {
        toast.error('Erro ao ler a planilha.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'NOME-EMAIL': 'CRISTALLY NETTO',
        'LETRA': 'A Noite',
        'TOTAL VERIFICAÇÕES': 1,
        'TOTAL TREINAMENTOS': 1,
        'TOTAL ASSISTÊNCIA': 0,
        'VERIFICAÇÕES NÃO CONFORMES': 1,
        'PERGUNTAS COM NÃO CONFORMIDADES': 1
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'N3_Template');
    XLSX.writeFile(wb, 'Modelo_Importacao_N3.xlsx');
  };

  const kpis = useMemo(() => {
    const totais = {
      verificacoes: 0,
      treinamentos: 0,
      ncs: 0,
      perguntasNc: 0
    };

    data.forEach(d => {
      totais.verificacoes += d.total_verificacoes;
      totais.treinamentos += d.total_treinamentos;
      totais.ncs += d.verificacoes_nc;
      totais.perguntasNc += d.perguntas_nc;
    });

    const pctNc = totais.verificacoes > 0 ? ((totais.ncs / totais.verificacoes) * 100).toFixed(1) : '0.0';

    return { totais, pctNc };
  }, [data]);

  const chartData = useMemo(() => {
    return data.map(d => ({
      name: d.nome_email.split(' ')[0] || 'Novo',
      Verificações: d.total_verificacoes,
      Treinamentos: d.total_treinamentos,
      'Não Conformes': d.verificacoes_nc
    })).filter(d => d.Verificações > 0 || d.Treinamentos > 0);
  }, [data]);

  const evolutionChartData = useMemo(() => {
    const grouped = historicalData.reduce((acc, curr) => {
      if (!acc[curr.periodo]) {
        acc[curr.periodo] = { periodo: curr.periodo, 'Total Verificações': 0, 'Total Treinamentos': 0, 'Não Conformes': 0 };
      }
      acc[curr.periodo]['Total Verificações'] += curr.total_verificacoes;
      acc[curr.periodo]['Total Treinamentos'] += curr.total_treinamentos;
      acc[curr.periodo]['Não Conformes'] += curr.verificacoes_nc;
      return acc;
    }, {} as Record<string, any>);
    return Object.values(grouped).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [historicalData]);

  const evolutionByPersonData = useMemo(() => {
    const grouped = historicalData.reduce((acc, curr) => {
      if (!acc[curr.periodo]) {
        acc[curr.periodo] = { periodo: curr.periodo };
      }
      const name = curr.nome_email.split(' ')[0] || 'Novo';
      if (!acc[curr.periodo][name]) acc[curr.periodo][name] = 0;
      acc[curr.periodo][name] += curr.total_verificacoes;
      return acc;
    }, {} as Record<string, any>);
    return Object.values(grouped).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [historicalData]);

  const uniqueNames = useMemo(() => {
    const names = new Set<string>();
    historicalData.forEach(d => names.add(d.nome_email.split(' ')[0] || 'Novo'));
    return Array.from(names);
  }, [historicalData]);
  
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Selecione o Mês" />
            </SelectTrigger>
            <SelectContent>
              {[
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
              ].map((m, i) => {
                const val = '2026-' + (i + 1).toString().padStart(2, '0');
                return <SelectItem key={val} value={val}>{m} 2026</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
            <Download className="w-4 h-4" /> Modelo Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="w-4 h-4" /> Importar
          </Button>
          
          <Button variant="destructive" size="sm" onClick={handleClearMonth} disabled={deleting} className="gap-2 rounded-full">
            <Trash className="w-4 h-4" /> {deleting ? 'Limpando...' : 'Limpar Mês'}
          </Button>
<Button onClick={handleSave} disabled={saving} size="sm" className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 border-0 rounded-full px-6 transition-all hover:scale-[1.02] ml-2">
            <Save className="w-4 h-4" /> {saving ? 'Postando...' : 'Postar Lançamentos do Mês'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-800/50 shadow-lg shadow-blue-500/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardContent className="p-5 flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Verificações</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{kpis.totais.verificacoes}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 flex items-center justify-center border border-blue-200/50 dark:border-blue-700/50 shadow-inner group-hover:rotate-6 transition-transform duration-300">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400 drop-shadow-sm" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-800/50 shadow-lg shadow-indigo-500/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardContent className="p-5 flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Treinamentos</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{kpis.totais.treinamentos}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-700/50 shadow-inner group-hover:rotate-6 transition-transform duration-300">
              <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400 drop-shadow-sm" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-800/50 shadow-lg shadow-rose-500/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardContent className="p-5 flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Não Conformidades</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{kpis.totais.ncs}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/50 dark:to-rose-800/30 flex items-center justify-center border border-rose-200/50 dark:border-rose-700/50 shadow-inner group-hover:rotate-6 transition-transform duration-300">
              <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 drop-shadow-sm" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-800/50 shadow-lg shadow-amber-500/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardContent className="p-5 flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Taxa de NC Global</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{kpis.pctNc}%</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 flex items-center justify-center border border-amber-200/50 dark:border-amber-700/50 shadow-inner group-hover:rotate-6 transition-transform duration-300">
              <BarChart3 className="w-6 h-6 text-amber-600 dark:text-amber-400 drop-shadow-sm" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Lançamentos N3</CardTitle>
                <CardDescription>Digite manualmente ou importe via planilha</CardDescription>
              </div>
              <Button onClick={handleAddRow} size="sm" variant="outline" className="gap-1">
                <Plus className="w-4 h-4" /> Adicionar Colaborador
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">NOME-EMAIL</TableHead>
                      <TableHead>LETRA</TableHead>
                      <TableHead>T. VERIFICAÇÕES</TableHead>
                      <TableHead>T. TREINAMENTOS</TableHead>
                      <TableHead>T. ASSISTÊNCIA</TableHead>
                      <TableHead>VERIFICAÇÕES NC</TableHead>
                      <TableHead>% NC</TableHead>
                      <TableHead>PERGUNTAS NC</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, idx) => {
                      const pctNC = row.total_verificacoes > 0 
                        ? ((row.verificacoes_nc / row.total_verificacoes) * 100).toFixed(0) 
                        : 0;
                      
                      const isCritical = Number(pctNC) > 20;
                      const isWarning = Number(pctNC) > 0 && Number(pctNC) <= 20;
                      const badgeClass = isCritical ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : isWarning ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
                      
                      const inputStyle = "h-9 font-medium bg-muted/30 border-transparent hover:border-border focus:bg-background focus:border-primary rounded-xl transition-all";
                      
                      return (
                        <TableRow key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-border/50">
                          <TableCell className="p-2">
                            <Input 
                              value={row.nome_email} 
                              onChange={(e) => handleChange(idx, 'nome_email', e.target.value)}
                              className={inputStyle}
                              placeholder="Nome do colaborador"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              value={row.letra || ''} 
                              onChange={(e) => handleChange(idx, 'letra', e.target.value)}
                              className={`${inputStyle} w-24 text-center font-semibold text-slate-700 dark:text-slate-300`}
                              placeholder="Letra"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" min="0" 
                              value={row.total_verificacoes || ''} 
                              onChange={(e) => handleChange(idx, 'total_verificacoes', e.target.value)}
                              className={`${inputStyle} text-center`}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" min="0" 
                              value={row.total_treinamentos || ''} 
                              onChange={(e) => handleChange(idx, 'total_treinamentos', e.target.value)}
                              className={`${inputStyle} text-center`}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" min="0" 
                              value={row.total_assistencia || ''} 
                              onChange={(e) => handleChange(idx, 'total_assistencia', e.target.value)}
                              className={`${inputStyle} text-center`}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" min="0" 
                              value={row.verificacoes_nc || ''} 
                              onChange={(e) => handleChange(idx, 'verificacoes_nc', e.target.value)}
                              className={`${inputStyle} text-center text-rose-600 font-bold`}
                            />
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                              {pctNC}%
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" min="0" 
                              value={row.perguntas_nc || ''} 
                              onChange={(e) => handleChange(idx, 'perguntas_nc', e.target.value)}
                              className={`${inputStyle} text-center text-rose-600`}
                            />
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveRow(idx)} className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors">
                              <Trash className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Engajamento por Colaborador</CardTitle>
            <CardDescription>Volume de entregas no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Verificações" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Treinamentos" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Não Conformes" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados para o gráfico
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Evolutivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução Geral do Contrato</CardTitle>
            <CardDescription>Crescimento de Verificações e Treinamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {evolutionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVerif" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTrein" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey="periodo" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <RechartsTooltip cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="Total Verificações" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVerif)" activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="Total Treinamentos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTrein)" activeDot={{ r: 6, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados históricos</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolução por Colaborador</CardTitle>
            <CardDescription>Total de Verificações ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {evolutionByPersonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionByPersonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey="periodo" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <RechartsTooltip cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    {uniqueNames.map((name, idx) => (
                      <Line key={name} type="monotone" dataKey={name} stroke={colors[idx % colors.length]} strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados históricos</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
