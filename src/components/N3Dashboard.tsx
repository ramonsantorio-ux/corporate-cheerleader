import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Download, Plus, Save, Activity, Target, ShieldAlert, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface N3Data {
  id?: string;
  nome_email: string;
  periodo: string;
  total_verificacoes: number;
  total_treinamentos: number;
  total_assistencia: number;
  verificacoes_nc: number;
  perguntas_nc: number;
}

const DEFAULT_NAMES = [
  'CRISTALLY NETTO',
  'GABRIELE MONTARROYOS',
  'NAIARA SANTOS',
  'THIAGO GOMES'
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

  useEffect(() => {
    fetchData();
  }, [periodo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: allData, error } = await supabase
        .from('ssma_n3')
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
      DEFAULT_NAMES.map(name => ({
        nome_email: name,
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
    if (field === 'nome_email') {
      newData[index] = { ...newData[index], [field]: value };
    } else {
      newData[index] = { ...newData[index], [field]: Number(value) || 0 };
    }
    setData(newData);
  };

  const handleAddRow = () => {
    setData([...data, {
      nome_email: '',
      periodo,
      total_verificacoes: 0,
      total_treinamentos: 0,
      total_assistencia: 0,
      verificacoes_nc: 0,
      perguntas_nc: 0
    }]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('ssma_n3').delete().eq('periodo', periodo);
      
      const { error } = await supabase.from('ssma_n3').insert(
        data.map(d => ({
          nome_email: d.nome_email || 'SEM NOME',
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
              <SelectItem value="2026-06">Junho 2026</SelectItem>
              <SelectItem value="2026-05">Maio 2026</SelectItem>
              <SelectItem value="2026-04">Abril 2026</SelectItem>
              <SelectItem value="2026-03">Março 2026</SelectItem>
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
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
            <Save className="w-4 h-4" /> {saving ? 'Postando...' : 'Postar Lançamentos do Mês'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/10 border-blue-200/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900/70 dark:text-blue-300">Total Verificações</p>
              <h3 className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{kpis.totais.verificacoes}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-200/50 dark:bg-blue-800/50 flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/10 border-indigo-200/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-900/70 dark:text-indigo-300">Total Treinamentos</p>
              <h3 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">{kpis.totais.treinamentos}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-200/50 dark:bg-indigo-800/50 flex items-center justify-center">
              <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/10 border-rose-200/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-900/70 dark:text-rose-300">Não Conformidades</p>
              <h3 className="text-3xl font-bold text-rose-900 dark:text-rose-100 mt-1">{kpis.totais.ncs}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-200/50 dark:bg-rose-800/50 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/10 border-amber-200/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-900/70 dark:text-amber-300">Taxa de NC Global</p>
              <h3 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-1">{kpis.pctNc}%</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-200/50 dark:bg-amber-800/50 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
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
                      <TableHead className="min-w-[200px]">NOME-EMAIL</TableHead>
                      <TableHead>T. VERIFICAÇÕES</TableHead>
                      <TableHead>T. TREINAMENTOS</TableHead>
                      <TableHead>T. ASSISTÊNCIA</TableHead>
                      <TableHead>VERIFICAÇÕES NC</TableHead>
                      <TableHead>% NC</TableHead>
                      <TableHead>PERGUNTAS NC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, idx) => {
                      const pctNC = row.total_verificacoes > 0 
                        ? ((row.verificacoes_nc / row.total_verificacoes) * 100).toFixed(0) 
                        : 0;
                      
                      return (
                        <TableRow key={idx}>
                          <TableCell className="p-2">
                            <Input 
                              value={row.nome_email} 
                              onChange={(e) => handleChange(idx, 'nome_email', e.target.value)}
                              className="h-8 font-medium"
                              placeholder="Nome do colaborador"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" min="0" 
                              value={row.total_verificacoes || ''} 
                              onChange={(e) => handleChange(idx, 'total_verificacoes', e.target.value)}
                              className="h-8 text-center"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" min="0" 
                              value={row.total_treinamentos || ''} 
                              onChange={(e) => handleChange(idx, 'total_treinamentos', e.target.value)}
                              className="h-8 text-center"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" min="0" 
                              value={row.total_assistencia || ''} 
                              onChange={(e) => handleChange(idx, 'total_assistencia', e.target.value)}
                              className="h-8 text-center"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" min="0" 
                              value={row.verificacoes_nc || ''} 
                              onChange={(e) => handleChange(idx, 'verificacoes_nc', e.target.value)}
                              className="h-8 text-center text-rose-600 font-semibold"
                            />
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <span className={`font-bold ${Number(pctNC) > 20 ? 'text-rose-600' : 'text-slate-600 dark:text-slate-300'}`}>
                              {pctNC}%
                            </span>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" min="0" 
                              value={row.perguntas_nc || ''} 
                              onChange={(e) => handleChange(idx, 'perguntas_nc', e.target.value)}
                              className="h-8 text-center text-rose-600"
                            />
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
                  <LineChart data={evolutionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey="periodo" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <RechartsTooltip cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="Total Verificações" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Total Treinamentos" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
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
