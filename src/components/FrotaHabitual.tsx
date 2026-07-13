import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
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
].sort((a, b) => b.equipamentos.length - a.equipamentos.length);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#8dd1e1', '#83a6ed'];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy - ((payload.name.split(' ').length - 1) * 11)} textAnchor="middle" fill={fill} className="text-base font-black uppercase">
        {payload.name.split(' ').map((word: string, i: number) => (
          <tspan x={cx} dy={i === 0 ? 0 : 22} key={i}>{word}</tspan>
        ))}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 15}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={2} />
      <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="font-bold text-sm">{`${value} unid.`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs font-semibold">
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

export function FrotaHabitual() {
  const [activeIndex, setActiveIndex] = useState(0);

  const totalEquipamentos = FROTA_PORTO.reduce((acc, curr) => acc + curr.equipamentos.length, 0);
  const tpmCount = FROTA_PORTO.reduce((acc, curr) => acc + curr.equipamentos.filter(e => e.includes('TPM')).length, 0);
  const mfeCount = FROTA_PORTO.reduce((acc, curr) => acc + curr.equipamentos.filter(e => e.includes('MFE')).length, 0);
  
  const tpmPerc = ((tpmCount / totalEquipamentos) * 100).toFixed(1);
  const mfePerc = ((mfeCount / totalEquipamentos) * 100).toFixed(1);

  const chartData = FROTA_PORTO.map((item, index) => ({
    name: item.grupo,
    value: item.equipamentos.length,
    percentage: ((item.equipamentos.length / totalEquipamentos) * 100).toFixed(1),
    color: COLORS[index % COLORS.length]
  }));

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <Card className="w-full h-full shadow-lg bg-white border-primary/10 overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-border/40 pb-6">
        <CardTitle className="text-3xl text-primary font-black">Frota Habitual do PORTO</CardTitle>
        <CardDescription className="text-base mt-2">
          Distribuição e relação dos <strong className="text-primary">{totalEquipamentos}</strong> equipamentos que compõem a frota.
        </CardDescription>
      </CardHeader>
      
      {/* NOVO PAINEL PREMIUM MFE VS TPM */}
      <div className="px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border-none shadow-sm flex relative overflow-hidden transition-all hover:shadow-md">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
             <CardContent className="p-6 w-full flex flex-col justify-center">
               <p className="text-sm font-bold uppercase tracking-wider text-indigo-700/80 mb-1">MFE - Minério de Ferro</p>
               <div className="flex justify-between items-end">
                  <p className="text-5xl font-black text-indigo-600">{mfeCount} <span className="text-xl font-bold text-indigo-600/50">unid.</span></p>
                  <p className="text-3xl font-black text-indigo-600/80">{mfePerc}%</p>
               </div>
               <div className="w-full bg-indigo-500/20 h-2.5 mt-5 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${mfePerc}%` }} />
               </div>
             </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-none shadow-sm flex relative overflow-hidden transition-all hover:shadow-md">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
             <CardContent className="p-6 w-full flex flex-col justify-center">
               <p className="text-sm font-bold uppercase tracking-wider text-emerald-700/80 mb-1">TPM - Carvão</p>
               <div className="flex justify-between items-end">
                  <p className="text-5xl font-black text-emerald-600">{tpmCount} <span className="text-xl font-bold text-emerald-600/50">unid.</span></p>
                  <p className="text-3xl font-black text-emerald-600/80">{tpmPerc}%</p>
               </div>
               <div className="w-full bg-emerald-500/20 h-2.5 mt-5 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${tpmPerc}%` }} />
               </div>
             </CardContent>
          </Card>
        </div>
      </div>

      <CardContent className="grid grid-cols-1 xl:grid-cols-2 gap-10 h-full p-8">
        {/* Gráfico Premium */}
        <div className="flex flex-col h-[500px] w-full items-center justify-center relative bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={110}
                outerRadius={160}
                paddingAngle={4}
                dataKey="value"
                onMouseEnter={onPieEnter}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))' }} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Sanfona Sincronizada com Cores */}
        <div className="overflow-y-auto pr-4 h-[500px] custom-scrollbar">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {chartData.map((grupo, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-xl px-5 py-2 bg-white shadow-sm hover:shadow-md transition-all duration-300" style={{ borderLeftColor: grupo.color, borderLeftWidth: '8px' }}>
                <AccordionTrigger className="text-left font-bold hover:no-underline py-4">
                  <div className="flex justify-between w-full items-center pr-4">
                    <span style={{ color: grupo.color }} className="text-lg uppercase tracking-wide">{grupo.name}</span>
                    <span className="font-black px-4 py-1.5 rounded-full text-sm" style={{ backgroundColor: `${grupo.color}15`, color: grupo.color }}>
                      {grupo.value} unid.
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="pl-2 space-y-3 mt-4 mb-2">
                    {FROTA_PORTO[index].equipamentos.map((equip, eqIndex) => (
                      <li key={eqIndex} className="text-sm font-semibold flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: grupo.color }}></div>
                        <span className="text-slate-700">{equip}</span>
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
