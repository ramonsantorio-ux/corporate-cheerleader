import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const FROTA_PORTO = [
  { grupo: 'CAMINHÃO BASCULANTE 16TON', equipamentos: ['BASCULANTE 16TON - TPM - 01', 'BASCULANTE 16TON - TPM - 02'] },
  { grupo: 'CAMINHÃO BASCULANTE 6M³', equipamentos: ['BASCULANTE 6M³ - MFE - 01'] },
  { grupo: 'CAMINHÃO BROOK', equipamentos: ['BROOK - MFE - 01', 'BROOK - TPM - 01'] },
  { grupo: 'CAMINHÃO PIPA ASPERSÃO', equipamentos: ['PIPA ASPERSÃO - MFE - 01', 'PIPA ASPERSÃO - MFE - 02', 'PIPA ASPERSÃO - MFE - 03', 'PIPA ASPERSÃO - MFE - 04', 'PIPA ASPERSÃO - MFE - 05', 'PIPA ASPERSÃO - TPM - 01', 'PIPA ASPERSÃO - TPM - 02', 'PIPA ASPERSÃO - TPM - 03'] },
  { grupo: 'CAMINHÃO PIPA ASPERSÃO VIAS', equipamentos: ['PIPA ASPERSÃO VIAS - MFE - 01', 'PIPA ASPERSÃO VIAS - MFE - 02'] },
  { grupo: 'CAMINHÃO PIPA LIMPEZA', equipamentos: ['PIPA LIMPEZA - MFE - 01', 'PIPA LIMPEZA - MFE - 02', 'PIPA LIMPEZA - TPM - 01', 'PIPA LIMPEZA - TPM - 03'] },
  { grupo: 'MINI CARREGADEIRA 226B REMOTA', equipamentos: ['CARR. 226B REMOTA - MFE - 01'] },
  { grupo: 'MINI CARREGADEIRA S70 REMOTA', equipamentos: ['CARR. S70 REMOTA - MFE - 01', 'CARR. S70 REMOTA - TPM - 01'] },
  { grupo: 'MINI CARREGADEIRA 226B', equipamentos: ['CARREGADEIRA 226B - MFE - 01', 'CARREGADEIRA 226B - MFE - 02', 'CARREGADEIRA 226B - MFE - 03', 'CARREGADEIRA 226B - MFE - 04', 'CARREGADEIRA 226B - TPM - 01', 'CARREGADEIRA 226B - TPM - 02', 'CARREGADEIRA 226B - TPM - 03'] },
  { grupo: 'MINI ESCAVADEIRA 303.5', equipamentos: ['MINI ESCAVADEIRA 303.5 - MFE - 01', 'MINI ESCAVADEIRA 303.5 - MFE - 02'] },
  { grupo: 'RETROESCAVADEIRA 416D', equipamentos: ['416D - MFE - 01', '416D - MFE - 02', '416D - MFE - 03', '416D - TPM - 01'] }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#8dd1e1', '#83a6ed'];

export function FrotaHabitual() {
  const totalEquipamentos = FROTA_PORTO.reduce((acc, curr) => acc + curr.equipamentos.length, 0);

  const chartData = FROTA_PORTO.map((item, index) => ({
    name: item.grupo,
    value: item.equipamentos.length,
    percentage: ((item.equipamentos.length / totalEquipamentos) * 100).toFixed(1),
    color: COLORS[index % COLORS.length]
  })).sort((a, b) => b.value - a.value); // Sort by largest group first

  return (
    <Card className="w-full h-full shadow-md bg-white">
      <CardHeader>
        <CardTitle>Frota Habitual do PORTO</CardTitle>
        <CardDescription>
          Distribuição e relação dos {totalEquipamentos} equipamentos que compõem a frota.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Gráfico */}
        <div className="flex flex-col h-[400px] w-full items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={130}
                paddingAngle={2}
                dataKey="value"
                label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = 25 + innerRadius + (outerRadius - innerRadius);
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  const percent = chartData[index].percentage;
                  if (parseFloat(percent) < 3) return null; // Hide small labels
                  return (
                    <text x={x} y={y} fill={chartData[index].color} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                      {percent}%
                    </text>
                  );
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [`${value} un. (${props.payload.percentage}%)`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Sanfona */}
        <div className="overflow-y-auto pr-2 bg-slate-50 p-4 rounded-md border" style={{ maxHeight: '400px' }}>
          <Accordion type="single" collapsible className="w-full">
            {FROTA_PORTO.map((grupo, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-bold text-sm hover:no-underline">
                  <div className="flex justify-between w-full pr-4">
                    <span>{grupo.grupo}</span>
                    <span className="text-muted-foreground font-normal">
                      ({grupo.equipamentos.length})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="pl-6 list-disc space-y-1 mt-2">
                    {grupo.equipamentos.map((equip, eqIndex) => (
                      <li key={eqIndex} className="text-sm text-gray-700">
                        {equip}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}
