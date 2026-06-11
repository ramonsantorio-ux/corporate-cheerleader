import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, ReferenceLine } from 'recharts';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, TrendingDown, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// --- Dados Fixos (Mock Jan-Mai) ---

const METAS_DATA = {
  Janeiro: {
    atingido: 54.3,
    gap: 45.75,
    counts: { acima: 2, aceitavel: 2, abaixo: 2 },
    metas: [
      { setor: 'Porto', meta: 'Aderência à Programação', ref: 40.0, alc: 20.0, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Atendimento Eventuais (%)', ref: 25.0, alc: 19.0, status: 'Acima do Esperado' },
      { setor: 'Porto', meta: 'Atendimento Programação Preventivas (%)', ref: 10.0, alc: 2.0, status: 'Abaixo do Esperado' },
      { setor: 'Porto', meta: 'Custo Manutenção', ref: 10.0, alc: 7.25, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Eventos c/ ou s/ perda', ref: 10.0, alc: 6.0, status: 'Acima do Esperado' },
      { setor: 'Porto', meta: 'Turnover', ref: 5.0, alc: 0.0, status: 'Muito Abaixo do Esperado' }
    ]
  },
  Fevereiro: {
    atingido: 44.3,
    gap: 55.67,
    counts: { acima: 0, aceitavel: 3, abaixo: 3 },
    metas: [
      { setor: 'Porto', meta: 'Aderência à Programação', ref: 40.0, alc: 20.0, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Atendimento Eventuais (%)', ref: 25.0, alc: 11.85, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Atendimento Programação Preventivas (%)', ref: 10.0, alc: 2.0, status: 'Abaixo do Esperado' },
      { setor: 'Porto', meta: 'Custo Manutenção', ref: 10.0, alc: 8.48, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Eventos c/ ou s/ perda', ref: 10.0, alc: 2.0, status: 'Abaixo do Esperado' },
      { setor: 'Porto', meta: 'Turnover', ref: 5.0, alc: 0.0, status: 'Muito Abaixo do Esperado' }
    ]
  },
  Março: {
    atingido: 44.9,
    gap: 55.09,
    counts: { acima: 1, aceitavel: 2, abaixo: 3 },
    metas: [
      { setor: 'Porto', meta: 'Aderência à Programação', ref: 40.0, alc: 20.0, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Atendimento Eventuais (%)', ref: 25.0, alc: 15.9, status: 'Acima do Esperado' },
      { setor: 'Porto', meta: 'Atendimento Programação Preventivas (%)', ref: 10.0, alc: 2.0, status: 'Abaixo do Esperado' },
      { setor: 'Porto', meta: 'Custo Manutenção', ref: 10.0, alc: 6.01, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Eventos c/ ou s/ perda', ref: 10.0, alc: 1.0, status: 'Muito Abaixo do Esperado' },
      { setor: 'Porto', meta: 'Turnover', ref: 5.0, alc: 0.0, status: 'Muito Abaixo do Esperado' }
    ]
  },
  Abril: {
    atingido: 62.7,
    gap: 37.33,
    counts: { acima: 3, aceitavel: 2, abaixo: 2 },
    metas: [
      { setor: 'Porto', meta: 'Aderência à Programação', ref: 30.0, alc: 19.17, status: 'Acima do Esperado' },
      { setor: 'Porto', meta: 'Atendimento Eventuais (%)', ref: 20.0, alc: 16.0, status: 'Acima do Esperado' },
      { setor: 'Porto', meta: 'Atendimento Programação Preventivas (%)', ref: 5.0, alc: 1.0, status: 'Muito Abaixo do Esperado' },
      { setor: 'Porto', meta: 'Custo Manutenção', ref: 10.0, alc: 10.0, status: 'Muito Acima do Esperado' },
      { setor: 'Porto', meta: 'Eventos c/ ou s/ perda', ref: 10.0, alc: 4.0, status: 'Abaixo do Esperado' },
      { setor: 'Porto', meta: 'ISO 9001', ref: 20.0, alc: 10.0, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Turnover', ref: 5.0, alc: 2.5, status: 'Dentro Esperado (Aceitável)' }
    ]
  },
  Maio: {
    atingido: 71.3,
    gap: 28.75,
    counts: { acima: 4, aceitavel: 2, abaixo: 1 },
    metas: [
      { setor: 'Porto', meta: 'Aderência à Programação', ref: 30.0, alc: 18.33, status: 'Acima do Esperado' },
      { setor: 'Porto', meta: 'Atendimento Eventuais (%)', ref: 20.0, alc: 16.29, status: 'Muito Acima do Esperado' },
      { setor: 'Porto', meta: 'Atendimento Programação Preventivas (%)', ref: 5.0, alc: 2.54, status: 'Dentro Esperado (Aceitável)' },
      { setor: 'Porto', meta: 'Custo Manutenção', ref: 10.0, alc: 10.0, status: 'Muito Acima do Esperado' },
      { setor: 'Porto', meta: 'Eventos c/ ou s/ perda', ref: 10.0, alc: 2.0, status: 'Muito Abaixo do Esperado' },
      { setor: 'Porto', meta: 'ISO 9001', ref: 20.0, alc: 19.6, status: 'Muito Acima do Esperado' },
      { setor: 'Porto', meta: 'Turnover', ref: 5.0, alc: 2.5, status: 'Dentro Esperado (Aceitável)' }
    ]
  }
};

const meses = Object.keys(METAS_DATA);

// Dados consolidados para os gráficos de evolução
const evolutionData = meses.map(m => ({
  month: m,
  atingido: METAS_DATA[m as keyof typeof METAS_DATA].atingido,
  gap: METAS_DATA[m as keyof typeof METAS_DATA].gap,
}));

// Helpers de Estilização
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-lg shadow-xl text-xs">
        <p className="font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold" style={{ color: entry.color }}>
              {entry.value}%
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
  const [selectedMetric, setSelectedMetric] = useState<string>('Aderência à Programação');

  const data = METAS_DATA[selectedMonth as keyof typeof METAS_DATA];

  // Filtra histórico de uma métrica específica
  const metricEvolution = useMemo(() => {
    return meses.map(m => {
      const metasMes = METAS_DATA[m as keyof typeof METAS_DATA].metas;
      const found = metasMes.find(x => x.meta === selectedMetric);
      return {
        month: m,
        alcancado: found ? found.alc : 0,
        referencia: found ? found.ref : 0
      };
    });
  }, [selectedMetric]);

  const uniqueMetrics = useMemo(() => {
    const all = Object.values(METAS_DATA).flatMap(d => d.metas.map(m => m.meta));
    return Array.from(new Set(all));
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/20 p-4 rounded-xl border border-border">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Painel de METAS Mensais
          </h2>
          <p className="text-sm text-muted-foreground">Setor: Porto • {selectedMonth} de 2026</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm font-medium text-muted-foreground">Mês:</span>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px] font-semibold bg-background shadow-sm">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {meses.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scorecards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Atingido</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-5xl font-black text-primary">{data.atingido.toFixed(1).replace('.', ',')}%</p>
            </div>
            <div className="w-full bg-primary/20 h-2 mt-4 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${data.atingido}%` }} 
                transition={{ duration: 1, type: "spring" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-gradient-to-br from-destructive/10 to-destructive/5 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-destructive" />
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-destructive/80 uppercase tracking-wider">Gap</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-5xl font-black text-destructive">{data.gap.toFixed(2).replace('.', ',')}%</p>
            </div>
            <div className="w-full bg-destructive/20 h-2 mt-4 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${data.gap}%` }} 
                transition={{ duration: 1, type: "spring" }}
                className="h-full bg-destructive rounded-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6 flex flex-col justify-center h-full text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Referência</p>
            <p className="text-4xl font-black text-foreground">100,0%</p>
            <p className="text-xs text-muted-foreground mt-2">Métrica base do atingimento global</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Metas (The Core) */}
      <Card className="shadow-sm border-border overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Detalhamento das Metas ({selectedMonth})
              </CardTitle>
            </div>
            {/* Contadores da base da imagem transferidos para header para economia de espaço */}
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
                Acima do Esperado: <span className="font-bold ml-1 text-sm">{data.counts.acima}</span>
              </Badge>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1">
                Aceitável: <span className="font-bold ml-1 text-sm">{data.counts.aceitavel}</span>
              </Badge>
              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 px-3 py-1">
                Abaixo do Esperado: <span className="font-bold ml-1 text-sm">{data.counts.abaixo}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="w-[100px] font-bold">Setor</TableHead>
                <TableHead className="font-bold">Meta</TableHead>
                <TableHead className="text-center font-bold">Referência</TableHead>
                <TableHead className="w-[200px] text-center font-bold">Alcançado</TableHead>
                <TableHead className="text-right pr-6 font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.metas.map((m, idx) => {
                const fillPercentage = Math.min((m.alc / m.ref) * 100, 100) || 0;
                const isOver = m.alc > m.ref;
                
                return (
                  <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-xs text-muted-foreground">{m.setor}</TableCell>
                    <TableCell className="font-semibold text-sm">{m.meta}</TableCell>
                    <TableCell className="text-center font-medium text-muted-foreground bg-muted/10">
                      {m.ref.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold">{m.alc.toFixed(2)}%</span>
                          {isOver && <span className="text-[10px] text-primary font-bold">+{((m.alc/m.ref)*100 - 100).toFixed(0)}% ref</span>}
                        </div>
                        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${fillPercentage}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Seção de Evolução Gráfica */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Atingimento Global */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Evolução do Atingimento Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAtingido" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2, strokeDasharray: '5 5' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="atingido" name="Atingido" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAtingido)" activeDot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="gap" name="Gap" stroke="hsl(var(--destructive))" strokeWidth={2} fillOpacity={1} fill="url(#colorGap)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <strong>Projeção:</strong> Mantendo o ritmo de Maio ({evolutionData[4].atingido}%), a meta global tem tendência de crescimento de 12% para Junho.
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Evolução por Indicador */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Evolução por Indicador
              </CardTitle>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-[200px] h-8 text-xs font-semibold bg-background shadow-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueMetrics.map(m => (
                    <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricEvolution} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="alcancado" name="Alcançado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="referencia" name="Referência (Meta)" fill="hsl(var(--muted-foreground)/0.3)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
