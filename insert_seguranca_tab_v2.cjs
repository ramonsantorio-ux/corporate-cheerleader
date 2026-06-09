const fs = require('fs');

let code = fs.readFileSync('src/pages/EvolucaoContrato.tsx', 'utf8');

const triggerSearch = `              <TabsTrigger value="dre" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><DollarSign className="w-4 h-4 mr-2" />DRE Detalhada</TabsTrigger>\n            </TabsList>`;
const triggerReplace = `              <TabsTrigger value="dre" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><DollarSign className="w-4 h-4 mr-2" />DRE Detalhada</TabsTrigger>\n              <TabsTrigger value="seguranca_rac" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><ShieldAlert className="w-4 h-4 mr-2" />Segurança</TabsTrigger>\n            </TabsList>`;

if (code.includes(triggerSearch)) {
    code = code.replace(triggerSearch, triggerReplace);
    console.log('Trigger replaced successfully!');
} else {
    console.log('Could not find triggerSearch block');
}

const contentSearch = `      )}

                </TabsContent>
        </Tabs>
      ) : (`;

const contentReplace = `      )}

                </TabsContent>

          <TabsContent value="seguranca_rac" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 gap-6">
              <Card className="shadow-sm border-border">
                <CardHeader>
                  <CardTitle className="text-xl">Conformidade de Segurança (SSMA / RACs)</CardTitle>
                  <CardDescription>
                    Nível de aderência aos Requisitos de Atividades Críticas (RACs) do mês atual.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarRACData}>
                        <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Radar name="Aderência (%)" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                        <Tooltip />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : (`;

if (code.includes(contentSearch)) {
    code = code.replace(contentSearch, contentReplace);
    console.log('Content replaced successfully!');
} else {
    console.log('Could not find contentSearch block');
}

fs.writeFileSync('src/pages/EvolucaoContrato.tsx', code, 'utf8');
