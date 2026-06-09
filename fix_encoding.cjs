const fs = require('fs');

let oldCode = fs.readFileSync('src/pages/EvolucaoContrato.tsx', 'utf8'); 

oldCode = oldCode.replace(
  /import \{ (.*?) \} from 'recharts';/,
  "import { $1, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';"
);

oldCode = oldCode.replace(
  /import \{ (.*?) \} from "lucide-react";/,
  "import { $1, ShieldAlert } from \"lucide-react\";"
);

const radarDataString = `
  const radarRACData = [
    { subject: 'RAC 01 (Altura)', A: lastMonth?.rac1 || 0, fullMark: 100 },
    { subject: 'RAC 02 (Veículos Leves)', A: lastMonth?.rac2 || 0, fullMark: 100 },
    { subject: 'RAC 03 (Equipamentos Móveis)', A: lastMonth?.rac3 || 0, fullMark: 100 },
    { subject: 'RAC 04 (Bloqueio de Energia)', A: lastMonth?.rac4 || 0, fullMark: 100 },
    { subject: 'RAC 05 (Içamento)', A: 90 + Math.random()*10, fullMark: 100 },
  ];
`;

oldCode = oldCode.replace(
  /const dashboardContent = useMemo\(\(\) => \(/,
  `${radarDataString}\n  const dashboardContent = useMemo(() => (`
);

const racDataGeneration = `
      // SSMA (RACs) - Conformidade de Treinamento e Inspeção
      const rac1 = 80 + Math.random() * 20; // Altura
      const rac2 = 90 + Math.random() * 10; // Veículos Leves
      const rac3 = 85 + Math.random() * 15; // Equipamentos Móveis
      const rac4 = 95 + Math.random() * 5;  // Bloqueio Energia
`;

oldCode = oldCode.replace(
  /const perdas = sumDescontos \+ sumMultas;/,
  `${racDataGeneration}\n      const perdas = sumDescontos + sumMultas;`
);

oldCode = oldCode.replace(
  /margem: parseFloat\(margem\.toFixed\(1\)\),/,
  `margem: parseFloat(margem.toFixed(1)),\n        rac1: Number(rac1.toFixed(1)),\n        rac2: Number(rac2.toFixed(1)),\n        rac3: Number(rac3.toFixed(1)),\n        rac4: Number(rac4.toFixed(1)),`
);

const tabsListRegex = /<TabsList className="grid w-full grid-cols-3 mb-6">([\s\S]*?)<\/TabsList>/;
const tabsListReplacement = `<TabsList className="grid w-full grid-cols-4 mb-6">
$1
            <TabsTrigger value="treinamentos">Treinamentos (SSMA)</TabsTrigger>
          </TabsList>`;
oldCode = oldCode.replace(tabsListRegex, tabsListReplacement);

const treinamentosTabContent = `
        <TabsContent value="treinamentos" className="space-y-6 mt-6">
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">Conformidade de Treinamentos (SSMA / RACs)</CardTitle>
              <CardDescription>Adesão da equipe aos Requisitos de Atividades Críticas vigentes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full mt-4">
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
        </TabsContent>
`;

oldCode = oldCode.replace(
  /<\/TabsContent>\s*<\/Tabs>\s*<\/div>\s*\)/,
  `</TabsContent>\n${treinamentosTabContent}\n      </Tabs>\n    </div>\n  )`
);

oldCode = oldCode.replace(
  /], \[filteredChartData, lastMonth, prevMonth, timeRange, activeTab, selectedMonthDRE]\);/,
  `], [filteredChartData, lastMonth, prevMonth, timeRange, activeTab, selectedMonthDRE, radarRACData]);`
);

// Fix potential typo "Equip. Móveis" to "Equipamentos Móveis" in RACs if any was left
oldCode = oldCode.replace(/Equip\. Móveis/g, 'Equipamentos Móveis');

fs.writeFileSync('src/pages/EvolucaoContrato.tsx', oldCode, 'utf8');
console.log('Script de correção aplicado com sucesso!');
