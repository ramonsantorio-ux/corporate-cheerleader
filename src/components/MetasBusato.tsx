import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, ReferenceLine, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LabelList } from 'recharts';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, TrendingDown, ArrowUpRight, ArrowDownRight, Trophy, AlertOctagon, CalendarCheck, CalendarX, Download } from 'lucide-react';
import { ExpandableChart } from '@/components/ui/ExpandableChart';
import html2canvas from 'html2canvas';

// --- Dados Fixos (Mock Jan-Mai) ---
const METAS_DATA = {
  Janeiro: {
    atingido: 54.3, gap: 45.75, counts: { acima: 2, aceitavel: 2, abaixo: 2 },
    metas: [
      { setor: 'Porto', meta: 'Aderência à Programação', ref: 40.0, alc: 20.0, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Atendimento Eventuais (%)', ref: 25.0, alc: 19.0, status: 'Acima do Esperado' },
      { setor: 'Porto', meta: 'Atendimento Prog. Prev. (%)', ref: 10.0, alc: 2.0, status: 'Abaixo do Esperado' },
      { setor: 'Porto', meta: 'Custo Manutenção', ref: 10.0, alc: 7.25, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Eventos c/ ou s/ perda', ref: 10.0, alc: 6.0, status: 'Acima do Esperado' },
      { setor: 'Porto', meta: 'Turnover', ref: 5.0, alc: 0.0, status: 'Muito Abaixo do Esperado' }
    ]
  },
  Fevereiro: {
    atingido: 44.3, gap: 55.67, counts: { acima: 0, aceitavel: 3, abaixo: 3 },
    metas: [
      { setor: 'Porto', meta: 'Aderência à Programação', ref: 40.0, alc: 20.0, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Atendimento Eventuais (%)', ref: 25.0, alc: 11.85, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Atendimento Prog. Prev. (%)', ref: 10.0, alc: 2.0, status: 'Abaixo do Esperado' },
      { setor: 'Porto', meta: 'Custo Manutenção', ref: 10.0, alc: 8.48, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Eventos c/ ou s/ perda', ref: 10.0, alc: 2.0, status: 'Abaixo do Esperado' },
      { setor: 'Porto', meta: 'Turnover', ref: 5.0, alc: 0.0, status: 'Muito Abaixo do Esperado' }
    ]
  },
  Março: {
    atingido: 44.9, gap: 55.09, counts: { acima: 1, aceitavel: 2, abaixo: 3 },
    metas: [
      { setor: 'Porto', meta: 'Aderência à Programação', ref: 40.0, alc: 20.0, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Atendimento Eventuais (%)', ref: 25.0, alc: 15.9, status: 'Acima do Esperado' },
      { setor: 'Porto', meta: 'Atendimento Prog. Prev. (%)', ref: 10.0, alc: 2.0, status: 'Abaixo do Esperado' },
      { setor: 'Porto', meta: 'Custo Manutenção', ref: 10.0, alc: 6.01, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Eventos c/ ou s/ perda', ref: 10.0, alc: 1.0, status: 'Muito Abaixo do Esperado' },
      { setor: 'Porto', meta: 'Turnover', ref: 5.0, alc: 0.0, status: 'Muito Abaixo do Esperado' }
    ]
  },
  Abril: {
    atingido: 62.7, gap: 37.33, counts: { acima: 3, aceitavel: 2, abaixo: 2 },
    metas: [
      { setor: 'Porto', meta: 'Aderência à Programação', ref: 30.0, alc: 19.17, status: 'Acima do Esperado' },
      { setor: 'Porto', meta: 'Atendimento Eventuais (%)', ref: 20.0, alc: 16.0, status: 'Acima do Esperado' },
      { setor: 'Porto', meta: 'Atendimento Prog. Prev. (%)', ref: 5.0, alc: 1.0, status: 'Muito Abaixo do Esperado' },
      { setor: 'Porto', meta: 'Custo Manutenção', ref: 10.0, alc: 10.0, status: 'Muito Acima do Esperado' },
      { setor: 'Porto', meta: 'Eventos c/ ou s/ perda', ref: 10.0, alc: 4.0, status: 'Abaixo do Esperado' },
      { setor: 'Porto', meta: 'ISO 9001', ref: 20.0, alc: 10.0, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Turnover', ref: 5.0, alc: 2.5, status: 'Dentro Esperado (Aceitável)' }
    ]
  },
  Maio: {
    atingido: 71.3, gap: 28.75, counts: { acima: 4, aceitavel: 2, abaixo: 1 },
    metas: [
      { setor: 'Porto', meta: 'Aderência à Programação', ref: 30.0, alc: 18.33, status: 'Acima do Esperado' },
      { setor: 'Porto', meta: 'Atendimento Eventuais (%)', ref: 20.0, alc: 16.29, status: 'Muito Acima do Esperado' },
      { setor: 'Porto', meta: 'Atendimento Prog. Prev. (%)', ref: 5.0, alc: 2.54, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Custo Manutenção', ref: 10.0, alc: 10.0, status: 'Muito Acima do Esperado' },
      { setor: 'Porto', meta: 'Eventos c/ ou s/ perda', ref: 10.0, alc: 2.0, status: 'Muito Abaixo do Esperado' },
      { setor: 'Porto', meta: 'ISO 9001', ref: 20.0, alc: 19.6, status: 'Muito Acima do Esperado' },
      { setor: 'Porto', meta: 'Turnover', ref: 5.0, alc: 2.5, status: 'Dentro Esperado (Aceitável)' }
    ]
  }
};

const meses = Object.keys(METAS_DATA);

const evolutionData = meses.map(m => ({
  month: m,
  atingido: METAS_DATA[m as keyof typeof METAS_DATA].atingido,
  gap: METAS_DATA[m as keyof typeof METAS_DATA].gap,
}));

// Helpers
const getStatusColor = (status: string) => {
  if (status.includes('Muito Acima')) return 'bg-blue-500 text-white border-blue-600 shadow-blue-500/20';
  if (status.includes('Acima')) return 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20';
  if (status.includes('Dentro Esperado') || status.includes('Aceitável')) return 'bg-amber-400 text-amber-950 border-amber-500 shadow-amber-400/20';
  if (status.includes('Muito Abaixo')) return 'bg-rose-600 text-white border-rose-700 shadow-rose-600/20';
  if (status.includes('Abaixo')) return 'bg-rose-400 text-white border-rose-500 shadow-rose-400/20';
  return 'bg-slate-200 text-slate-800 border-slate-300';
};

const getStatusIcon = (status: string) => {
  if (status.includes('Muito Acima')) return <ArrowUpRight className="w-3.5 h-3.5 mr-1" />;
  if (status.includes('Acima')) return <TrendingUp className="w-3.5 h-3.5 mr-1" />;
  if (status.includes('Dentro Esperado') || status.includes('Aceitável')) return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
  if (status.includes('Muito Abaixo')) return <ArrowDownRight className="w-3.5 h-3.5 mr-1" />;
  if (status.includes('Abaixo')) return <TrendingDown className="w-3.5 h-3.5 mr-1" />;
  return <Target className="w-3.5 h-3.5 mr-1" />;
};

const getRowColor = (status: string) => {
  if (status.includes('Abaixo')) return 'bg-rose-50/30 hover:bg-rose-50/60 dark:bg-rose-950/10 dark:hover:bg-rose-950/20';
  if (status.includes('Acima')) return 'bg-emerald-50/30 hover:bg-emerald-50/60 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20';
  return 'hover:bg-muted/50';
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-lg shadow-xl text-xs z-50">
        <p className="font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold" style={{ color: entry.color || entry.fill }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function MetasBusato() {
  const [selectedMonth, setSelectedMonth] = useState<string>('Maio');
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Metas_Busato_${selectedMonth}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    } finally {
      setIsExporting(false);
    }
  };
  
  const data = METAS_DATA[selectedMonth as keyof typeof METAS_DATA];
  const batidas = data.counts.acima + data.counts.aceitavel;
  const perdidas = data.counts.abaixo;
  const totalMetas = batidas + perdidas;

  // Radar Data: Normalizamos Alcançado vs Referência (Ref = 100%)
  const radarData = useMemo(() => {
    return data.metas.map(m => {
      const reachedPct = Math.min((m.alc / m.ref) * 100, 150); // cap at 150% for visualization
      return {
        subject: m.meta.replace(/ \(\%\)/g, '').substring(0, 15) + '...',
        fullSubject: m.meta,
        Atingido: reachedPct,
        Referencia: 100,
        originalAlc: m.alc,
        originalRef: m.ref
      };
    });
  }, [data]);

  // Ofensores/Impulsionadores Data
  const varianceData = useMemo(() => {
    return data.metas.map(m => {
      const variance = m.alc - m.ref; // Absoluto de gap/ganho em relação a ref
      return {
        name: m.meta.replace(/ \(\%\)/g, '').substring(0, 12) + '...',
        fullName: m.meta,
        variance: variance,
        isPositive: variance >= 0
      };
    }).sort((a, b) => b.variance - a.variance);
  }, [data]);

  return (
    <div className="space-y-6 bg-background rounded-xl" ref={dashboardRef}>
      
      {/* 1. Timeline Semafórica do Ano */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider">Evolução 2026</h2>
            <p className="text-xs text-muted-foreground">Desempenho Geral por Mês</p>
          </div>
        </div>
        
        <div className="flex flex-1 justify-end items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {meses.map(m => {
              const atingido = METAS_DATA[m as keyof typeof METAS_DATA].atingido;
              const isGood = atingido >= 60; // Arbitrary threshold for visual
              const isSelected = selectedMonth === m;
              return (
                <button 
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`flex flex-col items-center min-w-[60px] p-2 rounded-lg transition-all border ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent hover:bg-muted'}`}
                >
                  <span className={`text-[10px] font-bold uppercase mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>{m.substring(0, 3)}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isGood ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-rose-500/10 border-rose-500 text-rose-600'}`}>
                    {isGood ? <CalendarCheck className="w-4 h-4" /> : <CalendarX className="w-4 h-4" />}
                  </div>
                  <span className="text-[9px] font-bold mt-1 text-foreground">{atingido.toFixed(0)}%</span>
                </button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} data-html2canvas-ignore className="hidden sm:flex shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar PNG'}
          </Button>
        </div>
      </div>

      {/* 2. Placares Gigantes de Win/Loss e Resumo Global */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Painel Global */}
        <Card className="md:col-span-4 border-none bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-primary/80 uppercase tracking-wider mb-2">Atingimento Global ({selectedMonth})</p>
            <div className="flex items-baseline gap-2">
              <p className="text-6xl font-black text-primary">{data.atingido.toFixed(1).replace('.', ',')}%</p>
            </div>
            <div className="w-full bg-primary/20 h-2.5 mt-6 rounded-full overflow-hidden">
              <motion.div 
                key={selectedMonth}
                initial={{ width: 0 }} 
                animate={{ width: `${data.atingido}%` }} 
                transition={{ duration: 1, type: "spring" }}
                className="h-full bg-primary rounded-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full skew-x-[-20deg] animate-[shimmer_2s_infinite]" />
              </motion.div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-3 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Gap restante de {data.gap.toFixed(1).replace('.', ',')}% para os 100% ideais
            </p>
          </CardContent>
        </Card>

        {/* Win Card */}
        <Card className="md:col-span-4 border-none bg-emerald-50 dark:bg-emerald-950/20 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute -right-6 -top-6 text-emerald-500/10">
            <Trophy className="w-32 h-32" />
          </div>
          <CardContent className="p-6 relative z-10 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
              <Trophy className="w-5 h-5" />
              <p className="text-sm font-bold uppercase tracking-wider">Metas Batidas</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400">{batidas}</p>
              <p className="text-xl font-bold text-emerald-600/50 dark:text-emerald-400/50">/ {totalMetas}</p>
            </div>
            <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70 mt-4">
              Métricas acima do esperado ou aceitáveis.
            </p>
          </CardContent>
        </Card>

        {/* Loss Card */}
        <Card className="md:col-span-4 border-none bg-rose-50 dark:bg-rose-950/20 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute -right-6 -top-6 text-rose-500/10">
            <AlertOctagon className="w-32 h-32" />
          </div>
          <CardContent className="p-6 relative z-10 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
              <AlertOctagon className="w-5 h-5" />
              <p className="text-sm font-bold uppercase tracking-wider">Metas Perdidas</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-black text-rose-600 dark:text-rose-400">{perdidas}</p>
              <p className="text-xl font-bold text-rose-600/50 dark:text-rose-400/50">/ {totalMetas}</p>
            </div>
            <p className="text-xs font-medium text-rose-600/70 dark:text-rose-400/70 mt-4">
              Métricas que exigem plano de ação imediato.
            </p>
          </CardContent>
        </Card>

      </div>

      {/* 3. Tabela de Metas vs Radar Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Tabela */}
        <Card className="xl:col-span-2 shadow-sm border-border flex flex-col">
          <ExpandableChart title={`Detalhamento de ${selectedMonth}`}>
            <div className="p-0 flex-1 overflow-auto rounded-md bg-card">
              <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="font-bold">Métrica</TableHead>
                  <TableHead className="text-center font-bold">Ref.</TableHead>
                  <TableHead className="w-[180px] text-center font-bold">Alcançado</TableHead>
                  <TableHead className="text-right pr-6 font-bold">Diagnóstico</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {data.metas.map((m, idx) => {
                    const fillPercentage = Math.min((m.alc / m.ref) * 100, 100) || 0;
                    const isOver = m.alc > m.ref;
                    
                    return (
                      <motion.tr 
                        key={m.meta + selectedMonth}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`transition-colors border-b border-border last:border-0 ${getRowColor(m.status)}`}
                      >
                        <TableCell>
                          <p className="font-semibold text-sm">{m.meta}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{m.setor}</p>
                        </TableCell>
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {m.ref.toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold">{m.alc.toFixed(2)}%</span>
                              {isOver && <span className="text-[10px] text-primary font-bold">+{((m.alc/m.ref)*100 - 100).toFixed(0)}%</span>}
                            </div>
                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden relative">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${fillPercentage}%` }}
                                transition={{ duration: 0.8, delay: 0.2 + (idx * 0.1) }}
                                className={`h-full rounded-full ${m.status.includes('Abaixo') ? 'bg-destructive' : 'bg-primary'}`}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Badge className={`shadow-sm border ${getStatusColor(m.status)}`}>
                            {getStatusIcon(m.status)}
                            {m.status}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
              </Table>
            </div>
          </ExpandableChart>
        </Card>

        {/* Radar Chart (Ideia A) */}
        <Card className="xl:col-span-1 shadow-sm border-border flex flex-col">
          <ExpandableChart title="Radar de Equilíbrio">
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-card rounded-md">
              <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar name="Alcançado (%)" dataKey="Atingido" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                  <Radar name="Referência (100%)" dataKey="Referencia" stroke="hsl(var(--destructive))" fill="none" strokeDasharray="3 3" strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-center text-muted-foreground mt-4 leading-relaxed">
              O polígono verde (Alcançado) deve idealmente cobrir a linha tracejada vermelha (Referência 100%). O que encolhe para dentro é gap.
            </p>
            </div>
          </ExpandableChart>
        </Card>

      </div>

      {/* 4. Gráficos Analíticos de Base */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Atingimento Global Timeline */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Evolução do Atingimento Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ExpandableChart title="Evolução do Atingimento Global">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAtingido" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2, strokeDasharray: '5 5' }} />
                    <Area type="monotone" dataKey="atingido" name="Atingido" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAtingido)" activeDot={{ r: 6 }}>
                      <LabelList dataKey="atingido" position="top" style={{ fontSize: '11px', fontWeight: 'bold', fill: 'hsl(var(--primary))' }} formatter={(val: number) => val.toFixed(0) + '%'} offset={10} />
                    </Area>
                    <ReferenceLine y={100} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Meta (100%)', fill: 'hsl(var(--destructive))', fontSize: 10 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Impulsionadores vs Ofensores (Variância) */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Ofensores e Impulsionadores ({selectedMonth})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] mt-2">
              <ExpandableChart title={`Ofensores e Impulsionadores (${selectedMonth})`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={varianceData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.2} strokeWidth={2} />
                    <Bar dataKey="variance" name="Variação Absoluta vs Meta">
                      <LabelList dataKey="variance" position="top" style={{ fontSize: '11px', fontWeight: 'bold' }} formatter={(val: number) => val > 0 ? '+' + val.toFixed(1) : val.toFixed(1)} />
                      {varianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isPositive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Barras para cima ajudaram a bater a meta. Barras para baixo puxaram o resultado global para trás.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
