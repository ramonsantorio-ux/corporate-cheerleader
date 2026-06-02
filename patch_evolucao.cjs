const fs = require('fs');
let c = fs.readFileSync('src/pages/EvolucaoContrato.tsx', 'utf8');

if (!c.includes('@/components/ui/dialog')) {
  c = c.replace('import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";', 'import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";\nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";');
}

c = c.replace('const [medicoes, setMedicoes] = useState<Medicao[]>(() => {', 'const [expandedChart, setExpandedChart] = useState<string | null>(null);\n  const [medicoes, setMedicoes] = useState<Medicao[]>(() => {');

// Interativity on cards
c = c.replace('<Card className="shadow-sm border-border lg:col-span-2">', '<Card className="shadow-sm border-border lg:col-span-2 transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:scale-[1.01] cursor-pointer" onClick={() => setExpandedChart(\'sla\')}>');
c = c.replace('<Card className="shadow-sm border-border transition-all duration-300 hover:shadow-md hover:border-primary/20">', '<Card className="shadow-sm border-border transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:scale-[1.01] cursor-pointer" onClick={() => setExpandedChart(\'resumo\')}>');
c = c.replace('<Card className="shadow-sm border-border transition-all duration-300 hover:shadow-md hover:border-primary/20">', '<Card className="shadow-sm border-border transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:scale-[1.01] cursor-pointer" onClick={() => setExpandedChart(\'rentabilidade\')}>');
c = c.replace('<Card className="shadow-sm border-border transition-all duration-300 hover:shadow-md hover:border-primary/20">', '<Card className="shadow-sm border-border transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:scale-[1.01] cursor-pointer" onClick={() => setExpandedChart(\'ofensores\')}>');

const metasSection = `
      {/* ACOMPANHAMENTO DE METAS */}
      {medicoes.length > 0 && (
        <Card className="shadow-sm border-border overflow-hidden mb-6 transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:scale-[1.01] cursor-pointer" onClick={() => setExpandedChart('metas')}>
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              Acompanhamento de Metas
            </h3>
          </div>
          <CardContent className="p-4">
            <Tabs defaultValue="impostos" className="w-full">
              <TabsList className="grid grid-cols-3 sm:grid-cols-6 mb-4 h-auto">
                <TabsTrigger value="impostos" className="py-2">Impostos</TabsTrigger>
                <TabsTrigger value="folha" className="py-2">Folha</TabsTrigger>
                <TabsTrigger value="manutencao" className="py-2">Manutenção</TabsTrigger>
                <TabsTrigger value="combustivel" className="py-2">Combustível</TabsTrigger>
                <TabsTrigger value="seguranca" className="py-2">Segurança</TabsTrigger>
                <TabsTrigger value="materiais" className="py-2">Materiais</TabsTrigger>
              </TabsList>

              {['impostos', 'folha', 'manutencao', 'combustivel', 'seguranca', 'materiais'].map(tab => (
                <TabsContent key={tab} value={tab}>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => \`R$ \${(val/1000).toFixed(0)}k\`} />
                        <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                        <Legend />
                        <Bar dataKey={tab === 'impostos' ? 'impostosTotal' : tab === 'folha' ? 'folhaTotal' : tab === 'manutencao' ? 'manutencaoTotal' : tab === 'combustivel' ? 'combustivelTotal' : tab === 'seguranca' ? 'uniformeTotal' : 'escritorioTotal'} name="Custo Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Line type="monotone" dataKey={tab === 'impostos' ? 'metaImpostos' : tab === 'folha' ? 'metaFolha' : tab === 'manutencao' ? 'metaManutencao' : tab === 'combustivel' ? 'metaCombustivel' : tab === 'seguranca' ? 'metaSeguranca' : 'metaMateriais'} name="Meta" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* DATA TABLE */}
`;

c = c.replace('{/* DATA TABLE */}', metasSection);

// We need a helper function to render the charts safely so we don't duplicate JSX manually
const dialogBlock = `
      {/* DIALOG GERAL DE GRÁFICOS */}
      <Dialog open={expandedChart !== null} onOpenChange={(open) => !open && setExpandedChart(null)}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {expandedChart === 'sla' && 'Evolução da Aderência (SLA)'}
              {expandedChart === 'resumo' && 'Aderência vs Margem'}
              {expandedChart === 'rentabilidade' && 'Análise de Rentabilidade'}
              {expandedChart === 'ofensores' && 'Mapa de Ofensores (Acumulado)'}
              {expandedChart === 'metas' && 'Acompanhamento de Metas'}
            </DialogTitle>
            <DialogDescription>Visualização ampliada do gráfico selecionado.</DialogDescription>
          </DialogHeader>
          <div className="h-[70vh] w-full mt-4">
            
            {expandedChart === 'sla' && (
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="colorSlaAreaBig" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
                    <YAxis domain={['auto', 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => \`\${val}%\`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <ReferenceLine y={95} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ position: 'top', value: 'Meta SLA (95%)', fill: 'hsl(var(--warning))', fontSize: 11, fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="aderencia" name="Aderência SLA (%)" fill="url(#colorSlaAreaBig)" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 5, fill: "hsl(var(--background))", strokeWidth: 2 }} activeDot={{ r: 7, fill: "hsl(var(--primary))" }}>
                      <LabelList dataKey="aderencia" position="top" offset={10} formatter={(val) => \`\${val}%\`} style={{ fontSize: '11px', fontWeight: 'bold', fill: 'hsl(var(--primary))' }} />
                    </Area>
                  </ComposedChart>
                </ResponsiveContainer>
            )}

            {expandedChart === 'resumo' && (
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData.slice(-6)} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="colorSlaBig" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
                    <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" fontSize={12} domain={[80, 100]} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--blue-500))" fontSize={12} domain={[0, 100]} tickFormatter={(val) => \`\${val}%\`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar yAxisId="left" dataKey="aderencia" name="Aderência SLA" fill="url(#colorSlaBig)" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="margem" name="Margem (%)" stroke="hsl(var(--blue-500))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
            )}

            {expandedChart === 'rentabilidade' && (
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData.slice(-6)} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="colorSaldoBig" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
                    <YAxis tickFormatter={(val) => \`R$\${val/1000}k\`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar stackId="a" dataKey="perdas" name="Glosas/Multas" fill="hsl(var(--destructive))" barSize={30} />
                    <Bar stackId="a" dataKey="horasExtras" name="Horas Extras" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                    <Area type="monotone" dataKey="saldo" name="Lucro Líquido Real" fill="url(#colorSaldoBig)" stroke="hsl(var(--success))" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
            )}

            {expandedChart === 'ofensores' && (
              <div className="w-full h-full">
                {ofensoresData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ofensoresData} cx="50%" cy="50%" innerRadius={120} outerRadius={180} paddingAngle={2} dataKey="value">
                        {ofensoresData.map((entry, index) => (
                          <Cell key={\`cell-\${index}\`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '14px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem ofensores financeiros registrados.</div>
                )}
              </div>
            )}

            {expandedChart === 'metas' && (
              <Tabs defaultValue="impostos" className="w-full h-full flex flex-col">
                <TabsList className="grid grid-cols-3 sm:grid-cols-6 mb-4 h-auto shrink-0">
                  <TabsTrigger value="impostos" className="py-2">Impostos</TabsTrigger>
                  <TabsTrigger value="folha" className="py-2">Folha</TabsTrigger>
                  <TabsTrigger value="manutencao" className="py-2">Manutenção</TabsTrigger>
                  <TabsTrigger value="combustivel" className="py-2">Combustível</TabsTrigger>
                  <TabsTrigger value="seguranca" className="py-2">Segurança</TabsTrigger>
                  <TabsTrigger value="materiais" className="py-2">Materiais</TabsTrigger>
                </TabsList>
                {['impostos', 'folha', 'manutencao', 'combustivel', 'seguranca', 'materiais'].map(tab => (
                  <TabsContent key={tab} value={tab} className="flex-1 mt-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => \`R$ \${(val/1000).toFixed(0)}k\`} />
                        <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                        <Legend />
                        <Bar dataKey={tab === 'impostos' ? 'impostosTotal' : tab === 'folha' ? 'folhaTotal' : tab === 'manutencao' ? 'manutencaoTotal' : tab === 'combustivel' ? 'combustivelTotal' : tab === 'seguranca' ? 'uniformeTotal' : 'escritorioTotal'} name="Custo Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Line type="monotone" dataKey={tab === 'impostos' ? 'metaImpostos' : tab === 'folha' ? 'metaFolha' : tab === 'manutencao' ? 'metaManutencao' : tab === 'combustivel' ? 'metaCombustivel' : tab === 'seguranca' ? 'metaSeguranca' : 'metaMateriais'} name="Meta" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>
`;

c = c.replace('{dashboardContent}\n\n\n    </div>', '{dashboardContent}\n\n' + dialogBlock + '    </div>');

fs.writeFileSync('src/pages/EvolucaoContrato.tsx', c);
