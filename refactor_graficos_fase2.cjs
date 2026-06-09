const fs = require('fs');
const path = 'src/pages/EvolucaoContrato.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add recharts elements
const rechartsOld = /import \{ ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, ReferenceLine, LabelList, PieChart, Pie, Cell \} from 'recharts';/;
const rechartsNew = "import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, ReferenceLine, LabelList, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';";
content = content.replace(rechartsOld, rechartsNew);

// 2. Add timeRange state
const stateOld = /const \[hiddenCards, setHiddenCards\] = useState<Record<string, boolean>>\(\{\}\);/;
const stateNew = `const [hiddenCards, setHiddenCards] = useState<Record<string, boolean>>({});
  const [timeRange, setTimeRange] = useState('6');
  const [activeTab, setActiveTab] = useState('visao_executiva');`;
content = content.replace(stateOld, stateNew);

// 3. Add filteredChartData after chartData definition
const chartDataEnd = /\}, \[medicoes, notificacoesGlobais\]\);/;
const filteredChartDataStr = `}, [medicoes, notificacoesGlobais]);

  const filteredChartData = useMemo(() => {
    if (timeRange === 'all') return chartData;
    const limit = parseInt(timeRange);
    return chartData.slice(-limit);
  }, [chartData, timeRange]);`;
content = content.replace(chartDataEnd, filteredChartDataStr);

// 4. Update the CustomTooltip
const oldTooltipRegex = /const CustomTooltip = \(\{ active, payload, label \}: any\) => \{[\s\S]*?return null;\n  \};/;

const newTooltip = `const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/80 border border-border/50 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[220px]">
          <p className="font-black text-sm mb-3 border-b border-border/50 pb-2">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => {
              let diffPercent = null;
              const currentMonthIndex = chartData.findIndex((d: any) => d.mes === label);
              if (currentMonthIndex > 0) {
                const prevMonth = chartData[currentMonthIndex - 1];
                const prevValue = prevMonth[entry.dataKey];
                if (prevValue && entry.value) {
                  diffPercent = ((entry.value - prevValue) / Math.abs(prevValue)) * 100;
                }
              }

              const isPercentage = entry.name.includes('Margem') || entry.name.includes('Aderência');
              const isNotificacao = entry.name.includes('Notificações');
              const formattedValue = isPercentage ? \`\${entry.value}%\` : (isNotificacao ? entry.value : formatCurrency(entry.value));

              return (
              <div key={index} className="flex flex-col gap-1 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground font-medium">{entry.name}</span>
                  </div>
                  <span className="font-bold text-foreground">
                    {formattedValue}
                  </span>
                </div>
                {diffPercent !== null && (
                  <div className="flex items-center justify-end text-[10px] font-medium">
                    <span className={diffPercent > 0 ? (entry.name.includes('Glosa') || entry.name.includes('Custo') ? 'text-destructive' : 'text-success') : (entry.name.includes('Glosa') || entry.name.includes('Custo') ? 'text-success' : 'text-destructive')}>
                      {diffPercent > 0 ? '▲' : '▼'} {Math.abs(diffPercent).toFixed(1)}% vs anterior
                    </span>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>
      );
    }
    return null;
  };`;
content = content.replace(oldTooltipRegex, newTooltip);

// 5. Replace data={chartData} with data={filteredChartData} globally 
content = content.replace(/data=\{chartData\}/g, 'data={filteredChartData}');
content = content.replace(/data=\{chartData\.slice\(-6\)\}/g, 'data={filteredChartData}');

// 6. Update TabsList header to include Select
const oldTabsRegex = /<Tabs defaultValue="visao_executiva" className="w-full mt-6 space-y-6">/;
content = content.replace(oldTabsRegex, '<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6 space-y-6">');

const oldTabsListRegex = /<TabsList className="bg-muted\/50 p-1 rounded-xl inline-flex w-full overflow-x-auto justify-start sm:justify-center border border-border\/50">[\s\S]*?<\/TabsList>/;
const newTabsList = `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            <TabsList className="bg-muted/50 p-1 rounded-xl inline-flex w-full sm:w-auto overflow-x-auto justify-start sm:justify-center border border-border/50">
              <TabsTrigger value="visao_executiva" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><Target className="w-4 h-4 mr-2" />Visão Executiva</TabsTrigger>
              <TabsTrigger value="custos_metas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><TrendingDown className="w-4 h-4 mr-2" />Custos e Metas</TabsTrigger>
              <TabsTrigger value="dre" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><DollarSign className="w-4 h-4 mr-2" />DRE Detalhada</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap hidden sm:block">Período:</span>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background border-border/50 shadow-sm rounded-xl h-10">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="3">Últimos 3 meses</SelectItem>
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Últimos 12 meses</SelectItem>
                  <SelectItem value="all">Todo o período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>`;
content = content.replace(oldTabsListRegex, newTabsList);

fs.writeFileSync(path, content, 'utf8');
console.log('Script concluded!');
