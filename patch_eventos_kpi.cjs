const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'pages', 'Eventos.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update imports
const rechartsImportMatch = content.match(/import\s+{([^}]+)}\s+from\s+'recharts';/);
if (rechartsImportMatch) {
  const currentImports = rechartsImportMatch[1];
  if (!currentImports.includes('ScatterChart')) {
    const newImports = currentImports + ', ScatterChart, Scatter, ZAxis, RadialBarChart, RadialBar';
    content = content.replace(rechartsImportMatch[0], `import { ${newImports} } from 'recharts';`);
  }
}

// 2. Update useMemo body
// We'll replace the beginning of useMemo analytics to remove totalCusto and add punchGrid
const useMemoStartOld = `    const byHour: Record<string, number> = {};
    let totalCusto = 0;
    let medicalCount = 0;

    for (let h = 0; h < 24; h++) {
      byHour[h.toString().padStart(2, '0')] = 0;
    }`;

const useMemoStartNew = `    let medicalCount = 0;
    let daysWithoutAccident: number | 'N/A' = 'N/A';
    if (events.length > 0) {
      const lastEventDate = new Date(events[0].event_date);
      const today = new Date();
      daysWithoutAccident = Math.floor((today.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysWithoutAccident < 0) daysWithoutAccident = 0;
    }

    const dayMap: Record<string, number> = { 'domingo': 0, 'segunda-feira': 1, 'terça-feira': 2, 'quarta-feira': 3, 'quinta-feira': 4, 'sexta-feira': 5, 'sábado': 6 };
    const punchGrid: Record<number, Record<number, number>> = {};
    for(let i=0; i<7; i++) { punchGrid[i] = {}; for(let j=0; j<24; j++) punchGrid[i][j] = 0; }`;

content = content.replace(useMemoStartOld, useMemoStartNew);

// 3. Update events loop for PunchCard instead of byHour, and remove totalCusto
const loopHourOld = `      totalCusto += ev.custo || 0;

      // By Hour
      if (ev.event_time) {
        const hour = ev.event_time.split(':')[0];
        if (hour && !isNaN(parseInt(hour))) {
          byHour[hour] = (byHour[hour] || 0) + 1;
        }
      }`;

const loopHourNew = `      // Punch Card
      if (ev.day_of_week && ev.event_time) {
        const d = dayMap[ev.day_of_week.toLowerCase()];
        const h = parseInt(ev.event_time.split(':')[0]);
        if (d !== undefined && !isNaN(h)) {
          punchGrid[d][h] += 1;
        }
      }`;

content = content.replace(loopHourOld, loopHourNew);

// 4. Update the returns of useMemo
const useMemoReturnOld = `    const heatmapData = Object.entries(byHour).sort(([a], [b]) => a.localeCompare(b)).map(([hour, count]) => ({ hour, count }));
    const maxHourCount = Math.max(...heatmapData.map(d => d.count), 1);

    return { 
      monthTrend, topEquipment, topPeople, dayData, topLocations, yearData, 
      medicalCount, operationalCount, total: events.length,
      topTipos, topAgentes, topPartes, byGenero, byTurno, turnoData, totalCusto,
      byLetra, heatmapData, maxHourCount
    };`;

const useMemoReturnNew = `    const punchCardData: any[] = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (punchGrid[d][h] > 0) {
          punchCardData.push({ dayIndex: d, hourIndex: h, count: punchGrid[d][h] });
        }
      }
    }

    const radialLetraData = Object.entries(byLetra).map(([name, value], i) => ({
      name, value, fill: CHART_COLORS[i % CHART_COLORS.length]
    }));

    return { 
      monthTrend, topEquipment, topPeople, dayData, topLocations, yearData, 
      medicalCount, operationalCount, total: events.length,
      topTipos, topAgentes, topPartes, byGenero, byTurno, turnoData,
      byLetra, radialLetraData, punchCardData, daysWithoutAccident
    };`;

content = content.replace(useMemoReturnOld, useMemoReturnNew);

// 5. Replace Custo Total and Letras card with the new KPI cards
const jsxCardsOld = `      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Custo Total</p>
              <p className="text-xl font-bold text-foreground mt-1">R$ {analytics.totalCusto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#4472c4]">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium text-center mb-2">Eventos por Letra</p>
            <div className="flex justify-around items-center">
              <div className="text-center"><p className="text-lg font-bold text-[#4472c4]">{analytics.byLetra?.['A Dia'] || 0}</p><p className="text-[10px] text-muted-foreground">A Dia</p></div>
              <div className="text-center"><p className="text-lg font-bold text-[#eb7d5b]">{analytics.byLetra?.['A Noite'] || 0}</p><p className="text-[10px] text-muted-foreground">A Noite</p></div>
              <div className="text-center"><p className="text-lg font-bold text-slate-700">{analytics.byLetra?.['B Dia'] || 0}</p><p className="text-[10px] text-muted-foreground">B Dia</p></div>
              <div className="text-center"><p className="text-lg font-bold text-slate-500">{analytics.byLetra?.['B Noite'] || 0}</p><p className="text-[10px] text-muted-foreground">B Noite</p></div>
            </div>
          </CardContent>
        </Card>
      </div>`;

const jsxCardsNew = `      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="p-6 flex flex-col justify-center items-center text-center h-full">
            <p className="text-sm text-emerald-700 font-semibold mb-2 uppercase tracking-wider">Status de Segurança</p>
            <p className="text-5xl font-black text-emerald-600 mb-2">{analytics.daysWithoutAccident}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase">Dias sem Ocorrências</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-[#4472c4] lg:col-span-2">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-sm font-semibold mb-4">Eventos por Letra</p>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  innerRadius="30%" 
                  outerRadius="100%" 
                  data={analytics.radialLetraData} 
                  startAngle={180} 
                  endAngle={0}
                >
                  <RadialBar background clockWise={true} dataKey="value" />
                  <Legend iconSize={10} width={120} height={140} layout="vertical" verticalAlign="middle" wrapperStyle={{ top: 0, right: 0, lineHeight: '24px' }} formatter={(val, entry: any) => <span className="text-xs text-muted-foreground">{val} ({entry.payload.value})</span>} />
                  <Tooltip content={<CustomTooltip />} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>`;

content = content.replace(jsxCardsOld, jsxCardsNew);

// 6. Replace Heatmap with Punch Card
const heatmapJSXOld = `      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#eb7d5b]" /> Mapa de Calor: Horário dos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 overflow-x-auto pb-2">
              {analytics.heatmapData?.map((data: any, i: number) => {
                const intensity = data.count / (analytics.maxHourCount || 1);
                const alpha = intensity === 0 ? 0.05 : 0.2 + (intensity * 0.8);
                return (
                  <div key={i} className="flex flex-col flex-1 min-w-[20px] items-center gap-1 group relative">
                    <div 
                      className="w-full h-8 rounded-sm transition-all duration-300" 
                      style={{ 
                        backgroundColor: data.count > 0 ? \`rgba(235, 125, 91, \${alpha})\` : '#f1f5f9',
                        border: data.count > 0 ? \`1px solid rgba(235, 125, 91, \${alpha + 0.2})\` : '1px solid #e2e8f0'
                      }}
                    />
                    <span className="text-[9px] text-slate-400 font-medium">{data.hour}h</span>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {data.hour}h: {data.count} eventos
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>`;

const heatmapJSXNew = `      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#eb7d5b]" /> Mapa de Frequência (Dias vs Horários)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    dataKey="hourIndex" 
                    name="Horário" 
                    domain={[0, 23]} 
                    tickFormatter={(tick) => \`\${tick}h\`} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="dayIndex" 
                    name="Dia" 
                    domain={[0, 6]} 
                    tickFormatter={(tick) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][tick]} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <ZAxis type="number" dataKey="count" range={[50, 400]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const dayName = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][data.dayIndex];
                        return (
                          <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
                            <p className="font-semibold mb-1">{dayName} às {data.hourIndex}h</p>
                            <p className="text-emerald-400 font-bold">{data.count} evento(s)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Frequência" data={analytics.punchCardData} fill="#eb7d5b" fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>`;

content = content.replace(heatmapJSXOld, heatmapJSXNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch successfully applied!');
