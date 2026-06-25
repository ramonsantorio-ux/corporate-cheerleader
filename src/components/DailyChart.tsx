import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ReferenceLine, Area } from 'recharts';
import { FileSpreadsheet } from "lucide-react";

interface DailyChartProps {
  data: { dia: string; aderencia: number }[];
  title: string;
  icon: React.ReactNode;
  mes: string;
  emptyStateMessage: string;
  colorName?: string; // ex: 'success', 'primary', 'destructive'
  onClick?: () => void;
}

export function DailyChart({ data, title, icon, mes, emptyStateMessage, colorName = 'success', onClick }: DailyChartProps) {
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const aderencia = payload[0].value;
      const isAbaixo = aderencia < 95;
      return (
        <div className="bg-background/95 border border-border/50 p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="font-bold text-sm mb-1">{label}</p>
          <p className={`font-bold text-lg flex items-center gap-2 ${isAbaixo ? 'text-destructive' : 'text-' + colorName}`}>
            <span className={`w-2 h-2 rounded-full ${isAbaixo ? 'bg-destructive' : 'bg-' + colorName}`} />
            {aderencia.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const gradientId = `color-${title.replace(/\s+/g, '')}`;

  // Helper function to order days correctly: from 21 of previous month to 20 of current month
  // Assuming 'dia' comes as "21/mai", "01/jun" etc.
  const orderedData = [...data].sort((a, b) => {
    // If we just want them sorted by the order they appear, we can leave as is,
    // but to be safe, if we need to sort 21 to 20:
    // It's usually easier to trust the Excel order, but let's try to keep the original order.
    return 0; 
  });

  return (
    <Card className="shadow-sm border-border transition-all duration-300 hover:shadow-lg hover:border-primary/50 relative" onClick={onClick}>
      <CardHeader className={onClick ? "cursor-pointer" : ""}>
        <CardTitle className="text-xl flex items-center gap-2">
          {icon} {title}
        </CardTitle>
        <CardDescription>Acompanhamento do mês de {mes || 'selecionado'}</CardDescription>
      </CardHeader>
      
      <CardContent className={onClick ? "cursor-pointer" : ""}>
        <div className="h-[350px] w-full mt-4">
          {orderedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={orderedData} margin={{ top: 30, right: 30, bottom: 5, left: -15 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`hsl(var(--${colorName}))`} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={`hsl(var(--${colorName}))`} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={10} angle={-45} textAnchor="end" height={60} />
                <YAxis domain={['auto', 'auto']} stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                
                <ReferenceLine y={95} stroke="hsl(var(--warning))" strokeDasharray="5 5" label={{ position: 'top', value: 'Meta (95%)', fill: 'hsl(var(--warning))', fontSize: 11, fontWeight: 'bold' }} />
                
                <Area type="monotone" dataKey="aderencia" fill={`url(#${gradientId})`} stroke="none" />
                <Line 
                  type="monotone" 
                  dataKey="aderencia" 
                  name="Aderência (%)" 
                  stroke={`hsl(var(--${colorName}))`} 
                  strokeWidth={3} 
                  dot={(props: any) => {
                    const { cx, cy, value, key } = props;
                    return (
                      <circle 
                        key={key} 
                        cx={cx} 
                        cy={cy} 
                        r={4} 
                        stroke={value >= 95 ? `hsl(var(--${colorName}))` : "hsl(var(--destructive))"} 
                        strokeWidth={2} 
                        fill="hsl(var(--background))" 
                      />
                    );
                  }} 
                  activeDot={{ r: 6, fill: `hsl(var(--${colorName}))` }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/5">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{emptyStateMessage}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
