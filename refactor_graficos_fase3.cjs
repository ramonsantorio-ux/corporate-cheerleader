const fs = require('fs');
const path = 'src/pages/EvolucaoContrato.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Otimizar a aba Custos e Metas removendo as abas internas
const tabsCustosMetasRegex = /<Tabs defaultValue="visao_geral" className="w-full">[\s\S]*?\{\['impostos', 'folha', 'manutencao', 'combustivel', 'seguranca', 'materiais'\]\.map\(tab => \([\s\S]*?<\/TabsContent>\n\s*\)\)\}\n\s*<\/Tabs>/;

const newCustosMetasContent = `<div className="w-full flex flex-col gap-8">
              <div className="h-[350px] w-full bg-muted/10 rounded-xl p-4 border border-border/50">
                <h4 className="text-sm font-semibold mb-4 text-center">Visão Geral (Real vs Meta)</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={[
                    { category: 'Impostos', meta: lastMonth?.metaImpostos || 0, real: lastMonth?.impostosTotal || 0 },
                    { category: 'Folha', meta: lastMonth?.metaFolha || 0, real: lastMonth?.folhaTotal || 0 },
                    { category: 'Manutenção', meta: lastMonth?.metaManutencao || 0, real: lastMonth?.manutencaoTotal || 0 },
                    { category: 'Combustível', meta: lastMonth?.metaCombustivel || 0, real: lastMonth?.combustivelTotal || 0 },
                    { category: 'Segurança', meta: lastMonth?.metaSeguranca || 0, real: lastMonth?.uniformeTotal || 0 },
                    { category: 'Materiais', meta: lastMonth?.metaMateriais || 0, real: lastMonth?.escritorioTotal || 0 },
                  ]}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Radar name="Meta" dataKey="meta" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.2} />
                    <Radar name="Custo Real" dataKey="real" stroke="hsl(var(--destructive))" strokeWidth={2} fill="hsl(var(--destructive))" fillOpacity={0.4} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'impostos', label: 'Impostos', metaKey: 'metaImpostos', realKey: 'impostosTotal' },
                  { id: 'folha', label: 'Folha de Pagamento', metaKey: 'metaFolha', realKey: 'folhaTotal' },
                  { id: 'manutencao', label: 'Manutenção', metaKey: 'metaManutencao', realKey: 'manutencaoTotal' },
                  { id: 'combustivel', label: 'Combustível', metaKey: 'metaCombustivel', realKey: 'combustivelTotal' },
                  { id: 'seguranca', label: 'Segurança/Uniformes', metaKey: 'metaSeguranca', realKey: 'uniformeTotal' },
                  { id: 'materiais', label: 'Materiais/Escritório', metaKey: 'metaMateriais', realKey: 'escritorioTotal' },
                ].map(cat => {
                  const currentReal = lastMonth?.[cat.realKey as keyof typeof lastMonth] as number || 0;
                  const currentMeta = lastMonth?.[cat.metaKey as keyof typeof lastMonth] as number || 0;
                  const percentOver = currentMeta > 0 ? ((currentReal - currentMeta) / currentMeta) * 100 : 0;
                  const isOver = currentReal > currentMeta;
                  
                  return (
                    <div key={cat.id} className="border border-border/50 rounded-xl p-4 bg-card shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-sm">{cat.label}</h4>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xl font-bold tracking-tight">R$ {(currentReal/1000).toFixed(1)}k</span>
                            <span className="text-xs text-muted-foreground">/ R$ {(currentMeta/1000).toFixed(1)}k</span>
                          </div>
                        </div>
                        <div className={\`px-2 py-1 rounded-md text-xs font-bold \${isOver ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}\`}>
                          {isOver ? '+' : ''}{percentOver.toFixed(1)}%
                        </div>
                      </div>
                      <div className="h-[80px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={filteredChartData}>
                            <defs>
                              <linearGradient id={\`fill_\${cat.id}\`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isOver ? "hsl(var(--destructive))" : "hsl(var(--primary))"} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={isOver ? "hsl(var(--destructive))" : "hsl(var(--primary))"} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey={cat.realKey} stroke={isOver ? "hsl(var(--destructive))" : "hsl(var(--primary))"} fill={\`url(#fill_\${cat.id})\`} strokeWidth={2} />
                            <Line type="stepAfter" dataKey={cat.metaKey} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" dot={false} strokeWidth={1} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>`;

content = content.replace(tabsCustosMetasRegex, newCustosMetasContent);


// 2. Aderencia vs Margem: Rounded Bars and Drop shadow on line
const aderenciaMargemOld = /<Bar yAxisId="left" dataKey="aderencia" name="Aderência SLA" fill="url\(#colorSla\)" radius=\{\[6, 6, 0, 0\]\} \/>\s*<Line yAxisId="right" type="monotone" dataKey="margem" name="Margem \(%\)" stroke="hsl\(var\(--blue-500\)\)" strokeWidth=\{3\} dot=\{\{ r: 4, strokeWidth: 2 \}\} activeDot=\{\{ r: 6 \}\} \/>/;
const aderenciaMargemNew = `<Bar yAxisId="left" dataKey="aderencia" name="Aderência SLA" fill="url(#colorSla)" radius={[8, 8, 0, 0]} barSize={40} />
                    <Line yAxisId="right" type="monotone" dataKey="margem" name="Margem (%)" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 5, strokeWidth: 2, fill: "hsl(var(--background))" }} activeDot={{ r: 8, fill: "hsl(var(--primary))" }} style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))' }} connectNulls />`;
content = content.replace(aderenciaMargemOld, aderenciaMargemNew);


// 3. Analise de Rentabilidade: Eixo Duplo para separar Glosas (milhares) do Lucro (Milhões)
// Find the exact YAxis inside the Analise de Rentabilidade chart.
// It is the ComposedChart that has "R$${val/1000}k"
const rentabilidadeChartOld = /<YAxis tickFormatter=\{\(val\) => `R\$\$\{val\/1000\}k`\} stroke="hsl\(var\(--muted-foreground\)\)" fontSize=\{12\} \/>\s*<Tooltip content=\{<CustomTooltip \/>\} \/>\s*<Legend wrapperStyle=\{\{ fontSize: '12px', paddingTop: '10px' \}\} \/>\s*<Bar stackId="a" dataKey="perdas" name="Glosas\/Multas" fill="hsl\(var\(--destructive\)\)" barSize=\{30\} \/>\s*<Bar stackId="a" dataKey="horasExtras" name="Horas Extras" fill="hsl\(var\(--warning\)\)" radius=\{\[6, 6, 0, 0\]\} \/>\s*<Area type="monotone" dataKey="saldo" name="Lucro Líquido Real" fill="url\(#colorSaldo\)" stroke="hsl\(var\(--success\)\)" strokeWidth=\{3\} \/>/;

const rentabilidadeChartNew = `<YAxis yAxisId="left" tickFormatter={(val) => \`R\$\{(val/1000).toFixed(0)\}k\`} stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 'auto']} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => \`R\$\{(val/1000).toFixed(0)\}k\`} stroke="hsl(var(--destructive))" fontSize={12} domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="saldo" name="Lucro Líquido Real" fill="url(#colorSaldo)" stroke="hsl(var(--success))" strokeWidth={3} />
                    <Bar yAxisId="right" stackId="a" dataKey="perdas" name="Glosas/Multas" fill="hsl(var(--destructive))" barSize={35} radius={[0, 0, 0, 0]} />
                    <Bar yAxisId="right" stackId="a" dataKey="horasExtras" name="Horas Extras" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />`;
content = content.replace(rentabilidadeChartOld, rentabilidadeChartNew);

// Fix the dialog version as well
content = content.replace(rentabilidadeChartOld, rentabilidadeChartNew);


// 4. Mapa de Ofensores: Donut Chart Premium
const ofensoresPieOld = /<Pie\s*data=\{ofensoresData\}\s*cx="50%"\s*cy="50%"\s*innerRadius=\{80\}\s*outerRadius="80%"\s*paddingAngle=\{2\}\s*dataKey="value"\s*>\s*\{ofensoresData\.map\(\(entry, index\) => \(\s*<Cell key=\{\`cell-\$\{index\}\`\} fill=\{entry\.color\} \/>\s*\)\)\}\s*<\/Pie>/;

const ofensoresPieNew = `<Pie
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
                          value="Total Perdas" 
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
                      </Pie>`;

content = content.replace(ofensoresPieOld, ofensoresPieNew);
// Fix the dialog version as well
content = content.replace(ofensoresPieOld, ofensoresPieNew);

// Also we need to make sure the PieChart doesn't crash if Label is missing. Let's add Label to imports.
const importRechartsRegex = /import \{ (.*?) \} from 'recharts';/;
const importRechartsMatch = content.match(importRechartsRegex);
if (importRechartsMatch && !importRechartsMatch[1].includes('Label')) {
  content = content.replace(importRechartsRegex, `import { ${importRechartsMatch[1]}, Label } from 'recharts';`);
}


// 5. Update Mock Data in useEffect to ensure it generates realistic values for the categories
const mockDataRegex = /impostosTotal: \(baseCost \* 0\.15\) \+ \(Math\.random\(\) \* 10000\),/g;
const mockDataReplacement = `metaImpostos: baseCost * 0.16,
          metaFolha: baseCost * 0.40,
          metaManutencao: baseCost * 0.05,
          metaCombustivel: baseCost * 0.08,
          metaSeguranca: baseCost * 0.05,
          metaMateriais: baseCost * 0.05,
          impostosTotal: (baseCost * 0.15) + (Math.random() * 50000 - 10000),`;
content = content.replace(mockDataRegex, mockDataReplacement);

const mockDataFolhaRegex = /folhaTotal: \(baseCost \* 0\.4\) \+ \(Math\.random\(\) \* 50000\),/g;
const mockDataFolhaReplacement = `folhaTotal: (baseCost * 0.4) + (Math.random() * 80000 - 20000),`;
content = content.replace(mockDataFolhaRegex, mockDataFolhaReplacement);

const mockDataManutencaoRegex = /manutencaoTotal: \(baseCost \* 0\.05\) \+ \(Math\.random\(\) \* 20000\),/g;
const mockDataManutencaoReplacement = `manutencaoTotal: (baseCost * 0.05) + (Math.random() * 30000 - 5000),`;
content = content.replace(mockDataManutencaoRegex, mockDataManutencaoReplacement);

const mockDataCombustivelRegex = /combustivelTotal: \(baseCost \* 0\.08\) \+ \(Math\.random\(\) \* 30000\),/g;
const mockDataCombustivelReplacement = `combustivelTotal: (baseCost * 0.08) + (Math.random() * 40000 - 5000),`;
content = content.replace(mockDataCombustivelRegex, mockDataCombustivelReplacement);

const mockDataSegurancaRegex = /uniformeTotal: \(baseCost \* 0\.05\) \+ \(Math\.random\(\) \* 10000\),/g;
const mockDataSegurancaReplacement = `uniformeTotal: (baseCost * 0.05) + (Math.random() * 15000 - 2000),`;
content = content.replace(mockDataSegurancaRegex, mockDataSegurancaReplacement);

const mockDataMateriaisRegex = /escritorioTotal: \(baseCost \* 0\.05\) \+ \(Math\.random\(\) \* 5000\),/g;
const mockDataMateriaisReplacement = `escritorioTotal: (baseCost * 0.05) + (Math.random() * 10000 - 1000),`;
content = content.replace(mockDataMateriaisRegex, mockDataMateriaisReplacement);

const mockOfensoresRegex = /multasTotal: Math\.floor\(Math\.random\(\) \* 5000\),/g;
const mockOfensoresReplacement = `multasTotal: Math.floor(Math.random() * 15000),
          glosasTotal: Math.floor(Math.random() * 25000),`;
content = content.replace(mockOfensoresRegex, mockOfensoresReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log('Script Phase 3 finalized');
