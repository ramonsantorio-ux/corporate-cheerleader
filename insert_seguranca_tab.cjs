const fs = require('fs');

let code = fs.readFileSync('src/pages/EvolucaoContrato.tsx', 'utf8');

// 1. Insert TabsTrigger
const triggerRegex = /(<TabsTrigger value="dre"[\s\S]*?<\/TabsTrigger>)/;
if (triggerRegex.test(code)) {
    code = code.replace(triggerRegex, `$1\n              <TabsTrigger value="seguranca_rac" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><ShieldAlert className="w-4 h-4 mr-2" />Segurança (SSMA / RACs)</TabsTrigger>`);
    console.log("Trigger inserted");
} else {
    console.log("Failed to insert trigger");
}

// 2. Insert TabsContent
// We know `TabsContent value="dre"` exists. We can insert the new content right before the final `</Tabs>` of the dashboard.
// The structure is `</TabsContent>\n        </Tabs>\n      )}` or something similar.
// Let's find `<TabsContent value="dre"` and its matching `</TabsContent>`.

const segurancaContent = `
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
`;

const tabsEndRegex = /(<\/TabsContent>\s*<\/Tabs>\s*)(?:<Sheet|{?\/\*\s*DIÁLOGO DE DETALHES)/;
// Let's replace the last </TabsContent> before </Tabs> in the dashboardContent memo.
// Or easier: insert after `</TabsContent>` of `dre`.
const parts = code.split('</Tabs>');
// The first `</Tabs>` might be inside `custos_metas` inner tabs!
// We can use a unique marker. `</Tabs>` followed by `        <Sheet open={detalhesMedicao !== null}`
const sheetRegex = /(<\/TabsContent>\s*<\/Tabs>\s*)(<Sheet open={detalhesMedicao !== null})/
if (sheetRegex.test(code)) {
    code = code.replace(sheetRegex, segurancaContent + `\n$1$2`);
    console.log("Content inserted before Sheet");
} else {
    // try fallback
    const fallbackRegex = /(<\/TabsContent>\s*)(<\/Tabs>\s*<Sheet open={detalhesMedicao !== null})/;
    if (fallbackRegex.test(code)) {
        code = code.replace(fallbackRegex, segurancaContent + `\n$1$2`);
        console.log("Content inserted before Sheet (fallback)");
    } else {
        // try another approach
        // Look for the end of `dashboardContent`
        const endOfTabs = /(<\/Tabs>\s*}\)\(\)}\s*<\/div>\s*<\/div>)?\s*(<\/div>\s*\)\s*<\/SheetContent>\s*<\/Sheet>\s*<\/>\s*\), \[)/;
        if (endOfTabs.test(code)) {
            console.log("Found end of tabs area by dashboardContent end");
        } else {
            console.log("Failed to find insertion point");
        }
    }
}

fs.writeFileSync('src/pages/EvolucaoContrato.tsx', code, 'utf8');
