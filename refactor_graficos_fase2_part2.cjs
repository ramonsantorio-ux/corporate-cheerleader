const fs = require('fs');
const path = 'src/pages/EvolucaoContrato.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add selectedMonthDRE state
const stateOld = /const \[timeRange, setTimeRange\] = useState\('6'\);\n\s*const \[activeTab, setActiveTab\] = useState\('visao_executiva'\);/;
const stateNew = `const [timeRange, setTimeRange] = useState('6');
  const [activeTab, setActiveTab] = useState('visao_executiva');
  const [selectedMonthDRE, setSelectedMonthDRE] = useState<string | null>(null);`;
content = content.replace(stateOld, stateNew);

// 2. Add RadarChart to Custos e Metas
const metasTabsOld = /<Tabs defaultValue="impostos" className="w-full">\s*<TabsList className="grid grid-cols-3 sm:grid-cols-6 mb-8 h-auto">\s*<TabsTrigger value="impostos" className="py-2">Impostos<\/TabsTrigger>/;
const metasTabsNew = `<Tabs defaultValue="visao_geral" className="w-full">
              <TabsList className="grid grid-cols-4 sm:grid-cols-7 mb-8 h-auto">
                <TabsTrigger value="visao_geral" className="py-2">Visão Geral</TabsTrigger>
                <TabsTrigger value="impostos" className="py-2">Impostos</TabsTrigger>`;
content = content.replace(metasTabsOld, metasTabsNew);

const mapTabOld = /\{\['impostos', 'folha', 'manutencao', 'combustivel', 'seguranca', 'materiais'\]\.map\(tab => \(/;
const mapTabNew = `<TabsContent value="visao_geral" className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { category: 'Impostos', meta: lastMonth?.metaImpostos || 0, real: lastMonth?.impostosTotal || 0 },
                    { category: 'Folha', meta: lastMonth?.metaFolha || 0, real: lastMonth?.folhaTotal || 0 },
                    { category: 'Manutenção', meta: lastMonth?.metaManutencao || 0, real: lastMonth?.manutencaoTotal || 0 },
                    { category: 'Combustível', meta: lastMonth?.metaCombustivel || 0, real: lastMonth?.combustivelTotal || 0 },
                    { category: 'Segurança', meta: lastMonth?.metaSeguranca || 0, real: lastMonth?.uniformeTotal || 0 },
                    { category: 'Materiais', meta: lastMonth?.metaMateriais || 0, real: lastMonth?.escritorioTotal || 0 },
                  ]}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Radar name="Meta" dataKey="meta" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.2} />
                    <Radar name="Custo Real" dataKey="real" stroke="hsl(var(--destructive))" strokeWidth={2} fill="hsl(var(--destructive))" fillOpacity={0.4} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </TabsContent>
              {['impostos', 'folha', 'manutencao', 'combustivel', 'seguranca', 'materiais'].map(tab => (`;
content = content.replace(mapTabOld, mapTabNew);

// 3. Add Drill-down to Rentabilidade ComposedChart
// We need to find the specific ComposedChart for rentabilidade (the one with <Bar stackId="a" dataKey="perdas").
// We can just add onClick to it.
const rentabilidadeChartRegex = /<ComposedChart data=\{filteredChartData\} margin=\{\{ top: 20, right: 20, bottom: 5, left: 0 \}\}>/;
// Since there might be two (one for the main view and one for the dialog), we will replace globally.
content = content.replace(rentabilidadeChartRegex, `<ComposedChart data={filteredChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }} onClick={(e: any) => { if (e && e.activeLabel) { setSelectedMonthDRE(e.activeLabel); setActiveTab('dre'); } }} className="cursor-pointer">`);

// 4. Update the Data Table (DRE) to filter by selectedMonthDRE
const dreMapOld = /<tbody>\s*\{medicoes\.map\(\(m, index\) => \(/;
const dreMapNew = `<tbody>
                  {medicoes
                    .filter(m => !selectedMonthDRE || m.mes === selectedMonthDRE)
                    .map((m, index) => (`;
content = content.replace(dreMapOld, dreMapNew);

// 5. Add a "Limpar Filtro" button next to "Histórico Financeiro Detalhado" if selectedMonthDRE is active
const dreTitleOld = /<h3 className="font-bold text-lg flex items-center gap-2"><Calculator className="w-5 h-5 text-primary" \/> Histórico Financeiro Detalhado<\/h3>/;
const dreTitleNew = `<div className="flex items-center gap-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><Calculator className="w-5 h-5 text-primary" /> Histórico Financeiro Detalhado</h3>
              {selectedMonthDRE && (
                <button onClick={() => setSelectedMonthDRE(null)} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium hover:bg-primary/20 transition-colors">
                  Filtrado: {selectedMonthDRE} (Limpar ✕)
                </button>
              )}
            </div>`;
content = content.replace(dreTitleOld, dreTitleNew);

fs.writeFileSync(path, content, 'utf8');
console.log('Fase 2 Part 2 concluded!');
