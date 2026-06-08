const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'pages', 'Eventos.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update EventRow interface
content = content.replace(
  'involved_name: string;',
  `involved_name: string;
  tipo_acidente?: string;
  agente_lesao?: string;
  parte_corpo?: string;
  genero_envolvido?: string;
  custo?: number;`
);

// 2. Update newEvent initial state
content = content.replace(
  "shift: '', supervisor: '', involved_name: '',",
  "shift: '', supervisor: '', involved_name: '', tipo_acidente: '', agente_lesao: '', parte_corpo: '', genero_envolvido: '', custo: 0,"
);
content = content.replace(
  "equipment: '', plate_tag: '', shift: '', supervisor: '', involved_name: '' });",
  "equipment: '', plate_tag: '', shift: '', supervisor: '', involved_name: '', tipo_acidente: '', agente_lesao: '', parte_corpo: '', genero_envolvido: '', custo: 0 });"
);

// 3. Update the editing event setup
content = content.replace(
  "involved_name: ev.involved_name }); setDialogOpen(true); }}>",
  "involved_name: ev.involved_name, tipo_acidente: ev.tipo_acidente || '', agente_lesao: ev.agente_lesao || '', parte_corpo: ev.parte_corpo || '', genero_envolvido: ev.genero_envolvido || '', custo: ev.custo || 0 }); setDialogOpen(true); }}>"
);

// 4. Add the new fields to the form
const formFields = `                <div className="space-y-2">
                  <Label>Tipo de Acidente</Label>
                  <Select value={newEvent.tipo_acidente} onValueChange={v => setNewEvent({ ...newEvent, tipo_acidente: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {['Acidente Típico', 'Acidente de Trajeto', 'Doença Ocupacional', 'Perda Material'].map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Agente da Lesão</Label>
                  <FastInput value={newEvent.agente_lesao} onValueChange={v => setNewEvent(p => ({ ...p, agente_lesao: v }))} placeholder="Ex: Piso Escorregadio, Máquina" />
                </div>
                <div className="space-y-2">
                  <Label>Parte do Corpo</Label>
                  <FastInput value={newEvent.parte_corpo} onValueChange={v => setNewEvent(p => ({ ...p, parte_corpo: v }))} placeholder="Ex: Mão Direita, Perna" />
                </div>
                <div className="space-y-2">
                  <Label>Gênero do Envolvido</Label>
                  <Select value={newEvent.genero_envolvido} onValueChange={v => setNewEvent({ ...newEvent, genero_envolvido: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>`;

content = content.replace(
  '<div className="space-y-2 md:col-span-2">\n                  <Label>Descrição do Evento *</Label>',
  `${formFields}\n                <div className="space-y-2 md:col-span-2">\n                  <Label>Descrição do Evento *</Label>`
);

// 5. Update Detail dialog to show new fields
const detailFields = `                <div><Label className="text-muted-foreground">Tipo</Label><p className="font-medium">{detailEvent.tipo_acidente || '—'}</p></div>
                <div><Label className="text-muted-foreground">Agente da Lesão</Label><p className="font-medium">{detailEvent.agente_lesao || '—'}</p></div>
                <div><Label className="text-muted-foreground">Parte do Corpo</Label><p className="font-medium">{detailEvent.parte_corpo || '—'}</p></div>
                <div><Label className="text-muted-foreground">Gênero</Label><p className="font-medium">{detailEvent.genero_envolvido || '—'}</p></div>`;

content = content.replace(
  "<div><Label className=\"text-muted-foreground\">Local</Label><p className=\"font-medium\">{detailEvent.location || '—'}</p></div>",
  `<div><Label className="text-muted-foreground">Local</Label><p className="font-medium">{detailEvent.location || '—'}</p></div>\n${detailFields}`
);

// 6. Update Analytics Logic
const analyticsSetup = `    const byMonth: Record<string, number> = {};
    const byEquipment: Record<string, number> = {};
    const byLocation: Record<string, number> = {};
    const byPerson: Record<string, number> = {};
    const byDayOfWeek: Record<string, number> = {};
    const byYear: Record<string, number> = {};
    // New SST metrics
    const byTipoAcidente: Record<string, number> = {};
    const byAgenteLesao: Record<string, number> = {};
    const byParteCorpo: Record<string, number> = {};
    const byGenero: Record<string, number> = {};
    const byTurno: Record<string, number> = {};
    let totalCusto = 0;
    let medicalCount = 0;`;

content = content.replace(
  /const byMonth[\s\S]*?let medicalCount = 0;/,
  analyticsSetup
);

const analyticsLoop = `      // By month
      const ym = ev.event_date.slice(0, 7);
      byMonth[ym] = (byMonth[ym] || 0) + 1;

      // New SST metrics processing
      if (ev.tipo_acidente) byTipoAcidente[ev.tipo_acidente] = (byTipoAcidente[ev.tipo_acidente] || 0) + 1;
      if (ev.agente_lesao) byAgenteLesao[ev.agente_lesao] = (byAgenteLesao[ev.agente_lesao] || 0) + 1;
      if (ev.parte_corpo) byParteCorpo[ev.parte_corpo] = (byParteCorpo[ev.parte_corpo] || 0) + 1;
      if (ev.genero_envolvido) byGenero[ev.genero_envolvido] = (byGenero[ev.genero_envolvido] || 0) + 1;
      if (ev.shift) {
        const t = ev.shift.toLowerCase();
        if (t.includes('manha') || t.includes('manhã') || t.includes('1')) byTurno['Manhã'] = (byTurno['Manhã'] || 0) + 1;
        else if (t.includes('tarde') || t.includes('2')) byTurno['Tarde'] = (byTurno['Tarde'] || 0) + 1;
        else if (t.includes('noite') || t.includes('3')) byTurno['Noite'] = (byTurno['Noite'] || 0) + 1;
        else byTurno['Outro'] = (byTurno['Outro'] || 0) + 1;
      }
      if (ev.custo) totalCusto += Number(ev.custo);`;

content = content.replace(
  "// By month\n      const ym = ev.event_date.slice(0, 7);\n      byMonth[ym] = (byMonth[ym] || 0) + 1;",
  analyticsLoop
);

const analyticsReturn = `    const topTipos = Object.entries(byTipoAcidente).map(([name, value]) => ({ name, value }));
    const topAgentes = Object.entries(byAgenteLesao).sort(([,a], [,b]) => b - a).slice(0, 6).map(([name, value]) => ({ name, value }));
    const topPartes = Object.entries(byParteCorpo).sort(([,a], [,b]) => b - a).slice(0, 6).map(([name, value]) => ({ name, value }));

    const operationalCount = events.length - medicalCount;

    return { 
      monthTrend, topEquipment, topPeople, dayData, topLocations, yearData, 
      medicalCount, operationalCount, total: events.length,
      topTipos, topAgentes, topPartes, byGenero, byTurno, totalCusto
    };`;

content = content.replace(
  /const operationalCount = events\.length - medicalCount;[\s\S]*?return \{ monthTrend.*?total: events\.length \};/,
  analyticsReturn
);

// 7. Add new charts to the UI
const sstCharts = `      {/* Indicadores SST Adicionais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Custo Total</p>
              <p className="text-xl font-bold text-foreground mt-1">R$ {analytics.totalCusto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium text-center">Gênero Atingido</p>
            <div className="flex justify-around items-center mt-2">
              <div className="text-center"><p className="text-lg font-bold text-blue-600">{analytics.byGenero['Masculino'] || 0}</p><p className="text-[10px]">Masc</p></div>
              <div className="text-center"><p className="text-lg font-bold text-pink-600">{analytics.byGenero['Feminino'] || 0}</p><p className="text-[10px]">Fem</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 md:col-span-2">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium text-center mb-2">Turnos com Mais Eventos</p>
            <div className="flex justify-around items-center">
              <div className="text-center"><p className="text-lg font-bold text-orange-500">{analytics.byTurno['Manhã'] || 0}</p><p className="text-[10px]">Manhã</p></div>
              <div className="text-center"><p className="text-lg font-bold text-yellow-500">{analytics.byTurno['Tarde'] || 0}</p><p className="text-[10px]">Tarde</p></div>
              <div className="text-center"><p className="text-lg font-bold text-slate-500">{analytics.byTurno['Noite'] || 0}</p><p className="text-[10px]">Noite</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Tipos de Acidentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ExpandableChart title="Tipos de Acidentes">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.topTipos} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" label={false}>
                      {analytics.topTipos.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Agentes da Lesão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ExpandableChart title="Top Agentes da Lesão">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topAgentes} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Qtd" fill="hsl(180, 45%, 40%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Partes do Corpo Atingidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ExpandableChart title="Partes do Corpo Atingidas">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topPartes} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Qtd" fill="hsl(270, 60%, 55%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>
      </div>`;

content = content.replace(
  '{/* Top reincidentes */}',
  `${sstCharts}\n\n      {/* Top reincidentes */}`
);

fs.writeFileSync(filePath, content);
console.log('Eventos.tsx atualizado com sucesso!');
