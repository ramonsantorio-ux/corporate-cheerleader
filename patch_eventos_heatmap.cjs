const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'pages', 'Eventos.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const s = (str) => str.replace(/\n/g, '\n');

// 1. Rename "Turno" options in the form
const oldSelectBlock = [
    '<SelectValue placeholder="Turno" />',
    '                    </SelectTrigger>',
    '                    <SelectContent>',
    '                      <SelectItem value="Manhã">Manhã</SelectItem>',
    '                      <SelectItem value="Tarde">Tarde</SelectItem>',
    '                      <SelectItem value="Noite">Noite</SelectItem>',
    '                    </SelectContent>'
].join('\n');

const newSelectBlock = [
    '<SelectValue placeholder="Letra" />',
    '                    </SelectTrigger>',
    '                    <SelectContent>',
    '                      <SelectItem value="A Dia">A Dia</SelectItem>',
    '                      <SelectItem value="A Noite">A Noite</SelectItem>',
    '                      <SelectItem value="B Dia">B Dia</SelectItem>',
    '                      <SelectItem value="B Noite">B Noite</SelectItem>',
    '                    </SelectContent>'
].join('\n');

if (content.includes(oldSelectBlock)) {
    content = content.replace(oldSelectBlock, newSelectBlock);
} else {
    // fuzzy fallback
    content = content.replace(/<SelectValue placeholder="Turno" \/>[\s\S]*?<SelectItem value="Noite">Noite<\/SelectItem>[\s\S]*?<\/SelectContent>/g, newSelectBlock);
}

content = content.replace(/<Label className="text-xs">Turno<\/Label>/g, '<Label className="text-xs">Letra</Label>');

// 2. Add Analytics logic for Letras and Hours
const analyticsStart = 'const byTurno: Record<string, number> = {};';
const analyticsReplace = [
    'const byLetra: Record<string, number> = { "A Dia": 0, "A Noite": 0, "B Dia": 0, "B Noite": 0 };',
    '    const byHour: Record<string, number> = {};'
].join('\n');
content = content.replace(analyticsStart, analyticsReplace);

const loopStart = 'let totalCusto = 0;';
const loopReplace = [
    'let totalCusto = 0;',
    '    for(let h=0; h<24; h++) byHour[h.toString().padStart(2, "0")] = 0;'
].join('\n');
content = content.replace(loopStart, loopReplace);

const loopBodyEnd = [
    'byDayOfWeek[dow] = (byDayOfWeek[dow] || 0) + 1;',
    '      }'
].join('\n');

const loopBodyReplace = [
    'byDayOfWeek[dow] = (byDayOfWeek[dow] || 0) + 1;',
    '      }',
    '      if (ev.shift) byLetra[ev.shift] = (byLetra[ev.shift] || 0) + 1;',
    '      if (ev.event_time) {',
    '        const hour = ev.event_time.split(":")[0];',
    '        if (hour && !isNaN(parseInt(hour))) byHour[hour] = (byHour[hour] || 0) + 1;',
    '      }'
].join('\n');
content = content.replace(loopBodyEnd, loopBodyReplace);

const returnBlockStart = 'return {';
const returnBlockReplace = [
    'const heatmapData = Object.entries(byHour)',
    '      .sort(([a], [b]) => a.localeCompare(b))',
    '      .map(([hour, count]) => ({ hour, count }));',
    '    const maxHourCount = Math.max(...heatmapData.map(d => d.count), 1);',
    '    return {'
].join('\n');
content = content.replace(returnBlockStart, returnBlockReplace);

const returnPropsStr = 'monthTrend, topEquipment, topPeople, dayData, totalEvents, medicalCount, tipoAcidenteData, agenteLesaoData, parteCorpoData, generoData, turnoData, totalCusto';
const returnPropsReplace = 'monthTrend, topEquipment, topPeople, dayData, totalEvents, medicalCount, tipoAcidenteData, agenteLesaoData, parteCorpoData, generoData, turnoData, totalCusto, byLetra, heatmapData, maxHourCount';
content = content.replace(returnPropsStr, returnPropsReplace);

// 3. Replace the UI Cards
const cardRegex = /<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 border-l-4 border-l-blue-500 flex flex-col justify-between">[\s\S]*?\{analytics\.turnoData\[2\]\?.value \|\| 0\}[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const newCards = [
    '<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 border-l-4 border-l-[#4472c4] flex flex-col justify-between">',
    '  <h3 className="text-xs font-semibold text-slate-500 mb-4 text-center">Eventos por Letra</h3>',
    '  <div className="flex justify-between px-2">',
    '    <div className="text-center"><p className="text-2xl font-bold text-[#4472c4]">{analytics.byLetra["A Dia"] || 0}</p><p className="text-[10px] text-slate-500">A Dia</p></div>',
    '    <div className="text-center"><p className="text-2xl font-bold text-[#eb7d5b]">{analytics.byLetra["A Noite"] || 0}</p><p className="text-[10px] text-slate-500">A Noite</p></div>',
    '    <div className="text-center"><p className="text-2xl font-bold text-slate-700">{analytics.byLetra["B Dia"] || 0}</p><p className="text-[10px] text-slate-500">B Dia</p></div>',
    '    <div className="text-center"><p className="text-2xl font-bold text-slate-500">{analytics.byLetra["B Noite"] || 0}</p><p className="text-[10px] text-slate-500">B Noite</p></div>',
    '  </div>',
    '</div>',
    '</div>', // Close the grid wrapper
    '<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">',
    '  <h3 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2 uppercase tracking-wider">',
    '    <TrendingUp className="w-4 h-4 text-[#eb7d5b]" /> Mapa de Calor: Horário dos Eventos',
    '  </h3>',
    '  <div className="flex gap-1 h-12 overflow-x-auto pb-2">',
    '    {analytics.heatmapData && analytics.heatmapData.map((data, i) => {',
    '      const intensity = data.count / analytics.maxHourCount;',
    '      const alpha = intensity === 0 ? 0.05 : 0.2 + (intensity * 0.8);',
    '      return (',
    '        <div key={i} className="flex flex-col flex-1 min-w-[20px] items-center gap-1 group relative">',
    '          <div className="w-full h-8 rounded-sm transition-all duration-300" style={{ backgroundColor: data.count > 0 ? "rgba(235, 125, 91, " + alpha + ")" : "#f1f5f9", border: data.count > 0 ? "1px solid rgba(235, 125, 91, " + (alpha + 0.2) + ")" : "1px solid #e2e8f0" }}></div>',
    '          <span className="text-[9px] text-slate-400 font-medium">{data.hour}h</span>',
    '          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">',
    '            {data.hour}h: {data.count} eventos',
    '          </div>',
    '        </div>',
    '      );',
    '    })}',
    '  </div>',
    '</div>'
].join('\n');

if (cardRegex.test(content)) {
    content = content.replace(cardRegex, newCards);
    fs.writeFileSync(filePath, content);
    console.log('Patch Eventos Heatmap aplicado com sucesso!');
} else {
    console.error('Regex de cards nao encontrou o padrao!');
}
