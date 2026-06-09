const fs = require('fs');
const path = 'src/pages/EvolucaoContrato.tsx';
let content = fs.readFileSync(path, 'utf8');

// The file is currently structured with generic financial data. We need to introduce the Industrial B2B metrics.
// We will replace the entire return block and the useMemo that generates the chartData.

const reactComponentRegex = /(const chartData = useMemo\(\(\) => \{[\s\S]*?)return \(\s*<div className="p-4 md:p-8/m;

const newImplementation = `const chartData = useMemo(() => {
    // Gerar últimos 12 meses para os dados do contrato industrial
    const data = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mes = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      // Aderência à programação (Meta VALE é 95%)
      const baseAderencia = 90 + Math.random() * 9; // Varia de 90 a 99
      const aderencia = Number(baseAderencia.toFixed(1));
      
      // Disponibilidade Física Equipamentos (MEV)
      const horasTotais = 7200; // Ex: 10 equipamentos operando 720h/mês
      const horasParadas = Math.floor(Math.random() * 800);
      const horasTrabalhadas = horasTotais - horasParadas;
      const disponibilidade = Number(((horasTrabalhadas / horasTotais) * 100).toFixed(1));

      // SSMA (RACs) - Conformidade de Treinamento e Inspeção
      const rac1 = 80 + Math.random() * 20; // Altura
      const rac2 = 90 + Math.random() * 10; // Veículos Leves
      const rac3 = 85 + Math.random() * 15; // Equipamentos Móveis
      const rac4 = 95 + Math.random() * 5;  // Bloqueio Energia
      const racMedia = Number(((rac1 + rac2 + rac3 + rac4) / 4).toFixed(1));

      // Glosas e Penalidades Financeiras
      const glosaAderencia = aderencia < 95 ? (95 - aderencia) * 1500 : 0;
      const glosaSSMA = Math.random() > 0.7 ? Math.random() * 5000 : 0; // Multas de segurança esporádicas
      const totalGlosas = Number((glosaAderencia + glosaSSMA).toFixed(2));

      data.push({
        mes,
        aderencia,
        metaAderencia: 95,
        disponibilidade,
        horasTrabalhadas,
        horasParadas,
        racMedia,
        rac1: Number(rac1.toFixed(1)),
        rac2: Number(rac2.toFixed(1)),
        rac3: Number(rac3.toFixed(1)),
        rac4: Number(rac4.toFixed(1)),
        totalGlosas,
        glosaAderencia,
        glosaSSMA
      });
    }
    return data;
  }, [timeRange]);

  const filteredChartData = useMemo(() => {
    if (timeRange === 'all') return chartData;
    const months = parseInt(timeRange);
    return chartData.slice(-months);
  }, [chartData, timeRange]);

  const lastMonth = filteredChartData[filteredChartData.length - 1];
  const prevMonth = filteredChartData[filteredChartData.length - 2] || lastMonth;

  const ofensoresData = useMemo(() => {
    const totalGlosaAderencia = filteredChartData.reduce((acc, curr) => acc + curr.glosaAderencia, 0);
    const totalGlosaSSMA = filteredChartData.reduce((acc, curr) => acc + curr.glosaSSMA, 0);
    const totalFaltaEfetivo = Math.random() * 15000 + 5000;
    const totalAvarias = Math.random() * 20000 + 10000;

    return [
      { name: 'Baixa Aderência (SLA < 95%)', value: totalGlosaAderencia, color: 'hsl(var(--destructive))' },
      { name: 'Infrações SSMA/RAC', value: totalGlosaSSMA, color: 'hsl(var(--warning))' },
      { name: 'Absenteísmo/Falta Efetivo', value: totalFaltaEfetivo, color: 'hsl(var(--orange-500))' },
      { name: 'Quebra de Equipamentos', value: totalAvarias, color: 'hsl(var(--muted-foreground))' },
    ].filter(item => item.value > 0);
  }, [filteredChartData]);

  const radarRACData = [
    { subject: 'RAC 01 (Altura)', A: lastMonth?.rac1 || 0, fullMark: 100 },
    { subject: 'RAC 02 (Veículos Leves)', A: lastMonth?.rac2 || 0, fullMark: 100 },
    { subject: 'RAC 03 (Equip. Móveis)', A: lastMonth?.rac3 || 0, fullMark: 100 },
    { subject: 'RAC 04 (Bloqueio Energia)', A: lastMonth?.rac4 || 0, fullMark: 100 },
    { subject: 'RAC 05 (Içamento)', A: 90 + Math.random()*10, fullMark: 100 },
  ];

  const getTrend = (current: number, prev: number, inverseGood = false) => {
    if (!current || !prev) return { icon: <Minus className="w-4 h-4 text-muted-foreground" />, color: 'text-muted-foreground', value: '0%' };
    const diff = ((current - prev) / prev) * 100;
    const isPositive = diff >= 0;
    const isGood = inverseGood ? !isPositive : isPositive;
    
    if (Math.abs(diff) < 0.1) return { icon: <Minus className="w-4 h-4 text-muted-foreground" />, color: 'text-muted-foreground', value: '0%' };
    
    return {
      icon: isPositive ? <ArrowUpRight className={\`w-4 h-4 \${isGood ? 'text-success' : 'text-destructive'}\`} /> : <ArrowDownRight className={\`w-4 h-4 \${isGood ? 'text-success' : 'text-destructive'}\`} />,
      color: isGood ? 'text-success' : 'text-destructive',
      value: \`\${Math.abs(diff).toFixed(1)}%\`
    };
  };

  const dashboardContent = useMemo(() => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão Operacional do Contrato</h2>
          <p className="text-muted-foreground">Monitoramento de SLAs, SSMA, Conformidade RAC e Equipamentos (MEV).</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-background border-border shadow-sm">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon"><Download className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon"><Share2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aderência à Programação</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastMonth?.aderencia}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getTrend(lastMonth?.aderencia, prevMonth?.aderencia).icon}
              <span className={\`text-xs \${getTrend(lastMonth?.aderencia, prevMonth?.aderencia).color} font-medium\`}>
                {getTrend(lastMonth?.aderencia, prevMonth?.aderencia).value}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
            </div>
            {lastMonth?.aderencia < 95 && (
              <div className="mt-2 text-[11px] bg-destructive/10 text-destructive px-2 py-1 rounded-md inline-block font-semibold">
                ⚠️ Abaixo da meta (95%)
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibilidade MEV</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastMonth?.disponibilidade}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getTrend(lastMonth?.disponibilidade, prevMonth?.disponibilidade).icon}
              <span className={\`text-xs \${getTrend(lastMonth?.disponibilidade, prevMonth?.disponibilidade).color} font-medium\`}>
                {getTrend(lastMonth?.disponibilidade, prevMonth?.disponibilidade).value}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              {lastMonth?.horasTrabalhadas}h operadas / {lastMonth?.horasParadas}h em manutenção
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conformidade RAC (SSMA)</CardTitle>
            <ShieldAlert className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastMonth?.racMedia}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getTrend(lastMonth?.racMedia, prevMonth?.racMedia).icon}
              <span className={\`text-xs \${getTrend(lastMonth?.racMedia, prevMonth?.racMedia).color} font-medium\`}>
                {getTrend(lastMonth?.racMedia, prevMonth?.racMedia).value}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
            </div>
            <div className="mt-2 flex gap-2">
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">0 Acidentes</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">0 Interdições</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penalidades / Glosas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {(lastMonth?.totalGlosas / 1000).toFixed(1)}k
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getTrend(lastMonth?.totalGlosas, prevMonth?.totalGlosas, true).icon}
              <span className={\`text-xs \${getTrend(lastMonth?.totalGlosas, prevMonth?.totalGlosas, true).color} font-medium\`}>
                {getTrend(lastMonth?.totalGlosas, prevMonth?.totalGlosas, true).value}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Aderência à Programação (SLA)</CardTitle>
            <CardDescription>Acompanhamento mensal da meta de aderência contratual (Mínimo de 95%).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorAderencia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
                  <YAxis domain={[80, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => \`\${val}%\`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <ReferenceLine y={95} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ position: 'top', value: 'Corte (95%)', fill: 'hsl(var(--destructive))', fontSize: 11, fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="aderencia" name="Aderência SLA" fill="url(#colorAderencia)" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 5, fill: "hsl(var(--background))", strokeWidth: 2 }} activeDot={{ r: 7, fill: "hsl(var(--primary))" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Conformidade de Treinamentos (SSMA / RACs)</CardTitle>
            <CardDescription>Adesão da equipe aos Requisitos de Atividades Críticas vigentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarRACData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Conformidade RAC" dataKey="A" stroke="hsl(var(--success))" strokeWidth={2} fill="hsl(var(--success))" fillOpacity={0.4} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Disponibilidade Física (MEV)</CardTitle>
            <CardDescription>Horas trabalhadas vs Horas em manutenção das Máquinas e Veículos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => \`\${val}h\`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="horasTrabalhadas" name="Horas Operando" stackId="a" fill="hsl(var(--blue-500))" barSize={35} />
                  <Bar dataKey="horasParadas" name="Horas Manutenção" stackId="a" fill="hsl(var(--orange-500))" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Mapa de Desvios (Glosas / Penalidades)</CardTitle>
            <CardDescription>Principais ofensores que geram glosas financeiras no contrato (Acumulado).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              {ofensoresData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ofensoresData}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {ofensoresData.map((entry, index) => (
                        <Cell key={\`cell-\${index}\`} fill={entry.color} />
                      ))}
                      <Label 
                        value="Total Ofensores" 
                        position="centerBottom" 
                        dy={-10} 
                        fill="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                      />
                      <Label 
                        value={\`R$ \${(ofensoresData.reduce((acc, curr) => acc + curr.value, 0) / 1000).toFixed(1)}k\`} 
                        position="centerTop" 
                        dy={15} 
                        fill="hsl(var(--foreground))" 
                        fontSize={22} 
                        fontWeight="bold" 
                      />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Sem ofensores financeiros registrados.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  ), [filteredChartData, lastMonth, prevMonth, timeRange, ofensoresData, radarRACData]);

  return (
    <div className="p-4 md:p-8`;

content = content.replace(reactComponentRegex, newImplementation);

// Also replace the Lucide icons import to include the new ones
const lucideRegex = /import \{ (.*?) \} from 'lucide-react';/;
const match = content.match(lucideRegex);
if (match) {
  const icons = match[1].split(',').map(i => i.trim());
  const newIcons = ['ShieldAlert', 'Truck', 'ArrowUpRight', 'ArrowDownRight'].filter(i => !icons.includes(i));
  if (newIcons.length > 0) {
    const importStr = "import { " + icons.join(', ') + ", " + newIcons.join(', ') + " } from 'lucide-react';";
    content = content.replace(lucideRegex, importStr);
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fase de industrialização do Dashboard completa!');
