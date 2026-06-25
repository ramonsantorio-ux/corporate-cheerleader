import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ReferenceLine, Area, LabelList } from 'recharts';
import { FileSpreadsheet } from "lucide-react";

interface DailyChartProps {
  data: { dia: string; aderencia: number }[];
  title: string;
  icon: React.ReactNode;
  mes: string;
  emptyStateMessage: string;
}

export function DailyChart({ data, title, icon, mes, emptyStateMessage }: DailyChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const aderencia = payload[0].value;
      const isAbaixo = aderencia < 95;
      return (
        <div className="bg-background/95 border border-border/50 p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="font-bold text-sm mb-1">{label}</p>
          <p className={`font-bold text-lg flex items-center gap-2 ${isAbaixo ? 'text-destructive' : 'text-primary'}`}>
            <span className={`w-2 h-2 rounded-full ${isAbaixo ? 'bg-destructive' : 'bg-primary'}`} />
            {aderencia.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const gradientId = `color-${title.replace(/[^a-zA-Z0-9]/g, '')}`;
  const orderedData = [...data]; // Assuming the order is correct from import

  const renderChart = (height: number, isExpandedView: boolean) => (
    <div style={{ height: `${height}px`, width: '100%', marginTop: '16px' }}>
      {orderedData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={orderedData} margin={{ top: isExpandedView ? 30 : 30, right: 30, bottom: isExpandedView ? 30 : 5, left: -15 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={isExpandedView ? 12 : 11} tickMargin={isExpandedView ? 15 : 10} angle={-45} textAnchor="end" height={60} />
            <YAxis domain={['auto', 'auto']} stroke="hsl(var(--muted-foreground))" fontSize={isExpandedView ? 12 : 11} tickFormatter={(val) => `${val}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: isExpandedView ? '13px' : '11px', paddingTop: isExpandedView ? '20px' : '10px' }} />
            
            <ReferenceLine y={95} stroke="hsl(var(--warning))" strokeDasharray="5 5" label={{ position: 'top', value: 'Meta (95%)', fill: 'hsl(var(--warning))', fontSize: isExpandedView ? 13 : 11, fontWeight: 'bold' }} />
            
            <Area type="monotone" dataKey="aderencia" fill={`url(#${gradientId})`} stroke="none" legendType="none" />
            <Line 
              type="monotone" 
              dataKey="aderencia" 
              name="Aderência (%)" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3} 
              dot={(props: any) => {
                const { cx, cy, value, key } = props;
                return (
                  <circle 
                    key={key} 
                    cx={cx} 
                    cy={cy} 
                    r={isExpandedView ? 5 : 4} 
                    stroke={value >= 95 ? "hsl(var(--primary))" : "hsl(var(--destructive))"} 
                    strokeWidth={2} 
                    fill="hsl(var(--background))" 
                  />
                );
              }} 
              activeDot={{ r: isExpandedView ? 8 : 6, fill: "hsl(var(--primary))" }} 
            >
              {/* This ensures the values are always visible above the dots */}
              <LabelList dataKey="aderencia" position="top" offset={12} formatter={(val: number) => val === 100 ? '100' : val.toFixed(1)} style={{ fontSize: isExpandedView ? '12px' : '10px', fontWeight: 'bold', fill: 'hsl(var(--foreground))' }} />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/5">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{emptyStateMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card className="shadow-sm border-border transition-all duration-300 hover:shadow-lg hover:border-primary/50 relative cursor-pointer" onClick={() => setIsExpanded(true)}>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            {icon} {title}
          </CardTitle>
          <CardDescription>Acompanhamento do mês de {mes || 'selecionado'}</CardDescription>
        </CardHeader>
        
        <CardContent>
          {renderChart(350, false)}
        </CardContent>
      </Card>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {icon} {title}
            </DialogTitle>
            <DialogDescription>Visualização ampliada do gráfico selecionado.</DialogDescription>
          </DialogHeader>
          <div className="h-[70vh] w-full mt-4">
            {renderChart(window.innerHeight * 0.65, true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
