import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LabelList, PieChart, Pie, Line, ComposedChart } from 'recharts';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, ArrowUpRight, Trophy, AlertOctagon, Download, CheckSquare, Shield, Activity, GraduationCap, Users } from 'lucide-react';
import { ExpandableChart } from '@/components/ui/ExpandableChart';
import html2canvas from 'html2canvas';

// --- Mock Data ---
const MOCK_DATA = {
  Janeiro: {
    aderencia: 92,
    n3: { realizados: 128, meta: 145 }, // 4 tec*30 + 1 sup*15 + 1 prep*10
    racs: { rac02: 12, rac03: 8, rac04: 15 },
    interdicoes: 0,
    treinamentos: [
      { letra: 'A Dia', realizados: 45 },
      { letra: 'A Noite', realizados: 38 },
      { letra: 'B Dia', realizados: 42 },
      { letra: 'B Noite', realizados: 35 }
    ],
    nact: { aberto: 2, andamento: 5, fechado: 18 },
    cinco_s: 95,
    kaizen: 2,
    planejamento_seguro: 100,
    programa_tutor: 15
  },
  Fevereiro: {
    aderencia: 88,
    n3: { realizados: 140, meta: 145 },
    racs: { rac02: 15, rac03: 10, rac04: 18 },
    interdicoes: 1,
    treinamentos: [
      { letra: 'A Dia', realizados: 50 },
      { letra: 'A Noite', realizados: 45 },
      { letra: 'B Dia', realizados: 48 },
      { letra: 'B Noite', realizados: 40 }
    ],
    nact: { aberto: 1, andamento: 3, fechado: 22 },
    cinco_s: 92,
    kaizen: 1,
    planejamento_seguro: 95,
    programa_tutor: 12
  },
  Março: {
    aderencia: 95,
    n3: { realizados: 150, meta: 145 },
    racs: { rac02: 18, rac03: 12, rac04: 20 },
    interdicoes: 0,
    treinamentos: [
      { letra: 'A Dia', realizados: 55 },
      { letra: 'A Noite', realizados: 48 },
      { letra: 'B Dia', realizados: 52 },
      { letra: 'B Noite', realizados: 45 }
    ],
    nact: { aberto: 0, andamento: 4, fechado: 25 },
    cinco_s: 98,
    kaizen: 3,
    planejamento_seguro: 100,
    programa_tutor: 18
  },
  Abril: {
    aderencia: 90,
    n3: { realizados: 135, meta: 145 },
    racs: { rac02: 14, rac03: 9, rac04: 16 },
    interdicoes: 0,
    treinamentos: [
      { letra: 'A Dia', realizados: 48 },
      { letra: 'A Noite', realizados: 42 },
      { letra: 'B Dia', realizados: 45 },
      { letra: 'B Noite', realizados: 38 }
    ],
    nact: { aberto: 3, andamento: 6, fechado: 20 },
    cinco_s: 94,
    kaizen: 2,
    planejamento_seguro: 98,
    programa_tutor: 14
  },
  Maio: {
    aderencia: 98,
    n3: { realizados: 160, meta: 145 },
    racs: { rac02: 20, rac03: 15, rac04: 25 },
    interdicoes: 0,
    treinamentos: [
      { letra: 'A Dia', realizados: 60 },
      { letra: 'A Noite', realizados: 55 },
      { letra: 'B Dia', realizados: 58 },
      { letra: 'B Noite', realizados: 50 }
    ],
    nact: { aberto: 1, andamento: 2, fechado: 30 },
    cinco_s: 100,
    kaizen: 4,
    planejamento_seguro: 100,
    programa_tutor: 20
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">
            {entry.value} {entry.name.includes('%') || entry.name === 'Aderência' || entry.name === '5S' || entry.name === 'Planejamento Seguro' ? '%' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function MetasPorto() {
  const [selectedMonth, setSelectedMonth] = useState('Maio');
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const months = Object.keys(MOCK_DATA);
  const currentData = MOCK_DATA[selectedMonth as keyof typeof MOCK_DATA];

  // NACT data
  const nactData = [
    { name: 'Aberto', value: currentData.nact.aberto, fill: 'hsl(var(--destructive))' },
    { name: 'Em Andamento', value: currentData.nact.andamento, fill: 'hsl(var(--warning))' },
    { name: 'Fechado', value: currentData.nact.fechado, fill: 'hsl(var(--success))' }
  ];

  // RAC Data
  const racData = [
    { name: 'RAC 02', inspecoes: currentData.racs.rac02 },
    { name: 'RAC 03', inspecoes: currentData.racs.rac03 },
    { name: 'RAC 04', inspecoes: currentData.racs.rac04 }
  ];

  // Radar chart (Visão Geral)
  const radarData = [
    { subject: 'Aderência (%)', A: currentData.aderencia, fullMark: 100 },
    { subject: 'N3 (%)', A: Math.min(100, Math.round((currentData.n3.realizados / currentData.n3.meta) * 100)), fullMark: 100 },
    { subject: '5S (%)', A: currentData.cinco_s, fullMark: 100 },
    { subject: 'Plan. Seguro (%)', A: currentData.planejamento_seguro, fullMark: 100 },
    { subject: 'NACT Fechado (%)', A: Math.round((currentData.nact.fechado / (currentData.nact.aberto + currentData.nact.andamento + currentData.nact.fechado)) * 100), fullMark: 100 }
  ];

  // N3 History
  const n3History = months.map(m => ({
    month: m.substring(0, 3),
    realizado: MOCK_DATA[m as keyof typeof MOCK_DATA].n3.realizados,
    meta: MOCK_DATA[m as keyof typeof MOCK_DATA].n3.meta
  }));

  const handleExport = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const link = document.createElement('a');
      link.download = `Metas_Porto_${selectedMonth}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Erro na exportação', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getPercentageColor = (val: number) => {
    if (val >= 95) return 'text-success';
    if (val >= 85) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm mt-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Metas Contrato Porto
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Acompanhamento dos KPIs específicos do contrato em {selectedMonth}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI CARDS TOP */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Aderência */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Aderência
          </p>
          <div className="mt-3 flex items-end justify-between">
            <h3 className={`text-3xl font-black ${getPercentageColor(currentData.aderencia)}`}>{currentData.aderencia}%</h3>
          </div>
          <div className="mt-2 w-full bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${currentData.aderencia}%` }} /></div>
        </motion.div>

        {/* N3 por Funcionário */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" /> Meta N3 (SSO)
          </p>
          <div className="mt-3 flex items-end justify-between">
            <h3 className="text-3xl font-black text-foreground">{currentData.n3.realizados}</h3>
            <span className="text-xs text-muted-foreground font-medium mb-1">/ {currentData.n3.meta} req.</span>
          </div>
          <div className="mt-2 w-full bg-muted rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${currentData.n3.realizados >= currentData.n3.meta ? 'bg-success' : 'bg-warning'}`} style={{ width: `${Math.min(100, (currentData.n3.realizados / currentData.n3.meta) * 100)}%` }} />
          </div>
        </motion.div>

        {/* 5S */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" /> 5S da Sala
          </p>
          <div className="mt-3 flex items-end justify-between">
            <h3 className={`text-3xl font-black ${getPercentageColor(currentData.cinco_s)}`}>{currentData.cinco_s}%</h3>
          </div>
          <div className="mt-2 w-full bg-muted rounded-full h-1.5"><div className="bg-success h-1.5 rounded-full" style={{ width: `${currentData.cinco_s}%` }} /></div>
        </motion.div>

        {/* Planejamento Seguro */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Plan. Seguro
          </p>
          <div className="mt-3 flex items-end justify-between">
            <h3 className={`text-3xl font-black ${getPercentageColor(currentData.planejamento_seguro)}`}>{currentData.planejamento_seguro}%</h3>
          </div>
          <div className="mt-2 w-full bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${currentData.planejamento_seguro}%` }} /></div>
        </motion.div>

        {/* Interdições */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" /> Interdições
          </p>
          <div className="mt-3 flex items-end justify-between">
            <h3 className={`text-3xl font-black ${currentData.interdicoes > 0 ? 'text-destructive' : 'text-success'}`}>{currentData.interdicoes}</h3>
            {currentData.interdicoes === 0 && <CheckCircle2 className="w-5 h-5 text-success mb-1" />}
          </div>
        </motion.div>
      </div>

      {/* MAIN CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Histórico N3 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Evolução da Meta N3 (SSO)
            </CardTitle>
            <CardDescription className="text-xs">Acompanhamento mês a mês dos preenchimentos N3.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ExpandableChart title="Histórico N3">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={n3History} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={8} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="realizado" name="Realizados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      <LabelList dataKey="realizado" position="top" style={{ fill: 'hsl(var(--foreground))', fontSize: '11px', fontWeight: 'bold' }} />
                    </Bar>
                    <Line type="monotone" dataKey="meta" name="Meta (145)" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>

        {/* Visão Radar (Equilíbrio do Contrato) */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Equilíbrio Operacional Porto
            </CardTitle>
            <CardDescription className="text-xs">Performance das principais frentes do contrato (%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar name="Performance" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Treinamentos por Letra */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" /> Treinamentos por Letra (Turno)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentData.treinamentos} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis dataKey="letra" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="realizados" name="Treinamentos Realizados" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={30}>
                    <LabelList dataKey="realizados" position="right" style={{ fill: 'hsl(var(--foreground))', fontSize: '11px', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Inspeções por RAC */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Inspeções por RAC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={racData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={8} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="inspecoes" name="Inspeções" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList dataKey="inspecoes" position="top" style={{ fill: 'hsl(var(--foreground))', fontSize: '11px', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* NACT Pendências */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> NACT Pendências
            </CardTitle>
            <CardDescription className="text-xs">Status atual das não conformidades NACT.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center">
            <div className="w-1/2 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={nactData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                    {nactData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {nactData.map(item => (
                <div key={item.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-bold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Outras Entregas (Kaizen & Tutor) */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" /> Outras Entregas
            </CardTitle>
            <CardDescription className="text-xs">Projetos especiais e melhoria contínua no mês.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Kaizen (Melhoria Contínua)</p>
                    <p className="text-xs text-muted-foreground">Implantações sugeridas no mês</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-primary">{currentData.kaizen}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg text-success">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Programa Tutor</p>
                    <p className="text-xs text-muted-foreground">Colaboradores acompanhados no mês</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-success">{currentData.programa_tutor}</div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
