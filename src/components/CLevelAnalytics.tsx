import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldAlert, Users, TrendingDown, TrendingUp, AlertOctagon, HeartPulse, BrainCircuit } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { motion } from 'framer-motion';
import { ExpandableChart } from '@/components/ui/ExpandableChart';

interface CLevelAnalyticsProps {
  funcionarios: any[];
  feedbacks: any[];
  attendance: any[];
  warnings: any[];
}

export default function CLevelAnalytics({ funcionarios, feedbacks, attendance, warnings }: CLevelAnalyticsProps) {
  
  // 1. Cálculos C-Level (Financeiro & Risco)
  const stats = useMemo(() => {
    try {
      const totalAtestados = (attendance || []).filter(o => o?.status === 'Atestado').length;
      const custoAtestados = totalAtestados * 250; 
      const numFaltas = (attendance || []).filter(o => o?.status && String(o.status).includes('Falta')).length;
      const advertencias = (warnings || []).length;
      
      const resolucaoFeedback = (feedbacks || []).length > 0 
        ? Math.round(((feedbacks || []).filter(f => f?.status === 'Resolvido').length / (feedbacks || []).length) * 100) 
        : 0;

      return { totalAtestados, custoAtestados, numFaltas, advertencias, resolucaoFeedback };
    } catch (e) {
      console.error("CLevelAnalytics Stats Error:", e);
      return { totalAtestados: 0, custoAtestados: 0, numFaltas: 0, advertencias: 0, resolucaoFeedback: 0 };
    }
  }, [attendance, warnings, feedbacks]);

  // 2. People Analytics (Cruzamento Setores x Problemas)
  const deptRisk = useMemo(() => {
    try {
      const map: Record<string, { faltas: number, ads: number, feedbacksNeg: number }> = {};
      
      (attendance || []).forEach(o => {
        const func = (funcionarios || []).find(f => f?.id === o?.employee_id);
        if (!func) return;
        const dept = func.departamento || 'Outro';
        if (!map[dept]) map[dept] = { faltas: 0, ads: 0, feedbacksNeg: 0 };
        if (o?.status && String(o.status).includes('Falta')) map[dept].faltas++;
      });

      (warnings || []).forEach(w => {
        const func = (funcionarios || []).find(f => f?.id === w?.employee_id);
        if (!func) return;
        const dept = func.departamento || 'Outro';
        if (!map[dept]) map[dept] = { faltas: 0, ads: 0, feedbacksNeg: 0 };
        map[dept].ads++;
      });

      (feedbacks || []).forEach(f => {
        const dept = f?.setor || 'Outro';
        if (!map[dept]) map[dept] = { faltas: 0, ads: 0, feedbacksNeg: 0 };
        if (f?.prioridade === 'Crítica') map[dept].feedbacksNeg++;
      });

      return Object.keys(map).map(dept => ({
        subject: dept.substring(0, 10),
        Faltas: map[dept].faltas,
        Advertências: map[dept].ads,
        Feedbacks_Críticos: map[dept].feedbacksNeg,
        TotalRisk: map[dept].faltas + map[dept].ads + map[dept].feedbacksNeg
      })).sort((a, b) => b.TotalRisk - a.TotalRisk).slice(0, 6); 
    } catch (e) {
      console.error("CLevelAnalytics DeptRisk Error:", e);
      return [];
    }
  }, [attendance, warnings, feedbacks, funcionarios]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* SEÇÃO 1: C-LEVEL VITALS */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <HeartPulse className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-bold tracking-tight">Sinais Vitais (C-Level)</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-destructive shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Risco Trabalhista</p>
                  <h3 className="text-2xl font-black text-foreground mt-1">{stats.advertencias}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Advertências formais</p>
                </div>
                <AlertOctagon className="w-8 h-8 text-destructive/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Custo de Absenteísmo</p>
                  <h3 className="text-2xl font-black text-warning mt-1">R$ {stats.custoAtestados.toLocaleString('pt-BR')}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Est. baseada em {stats.totalAtestados} dias</p>
                </div>
                <TrendingDown className="w-8 h-8 text-warning/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Faltas no Período</p>
                  <h3 className="text-2xl font-black text-primary mt-1">{stats.numFaltas}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Impacto operacional direto</p>
                </div>
                <Users className="w-8 h-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 shadow-sm ${stats.resolucaoFeedback > 70 ? 'border-l-success' : 'border-l-warning'}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Saúde da Liderança</p>
                  <h3 className={`text-2xl font-black mt-1 ${stats.resolucaoFeedback > 70 ? 'text-success' : 'text-warning'}`}>{stats.resolucaoFeedback}%</h3>
                  <p className="text-xs text-muted-foreground mt-1">Resolução de Feedbacks</p>
                </div>
                <ShieldAlert className="w-8 h-8 text-muted/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SEÇÃO 2: PEOPLE ANALYTICS */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">People Analytics & Correlações</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Radar Chart: Risco por Departamento */}
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
              <CardTitle className="text-sm">Mapa de Calor (Risco Operacional por Setor)</CardTitle>
              <CardDescription className="text-xs">Correlação de faltas, advertências e atritos</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pt-4 flex items-center justify-center">
              {deptRisk.length > 0 ? (
                <ExpandableChart title="Visualização Ampliada">
<ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={deptRisk}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} />
                    <Radar name="Total de Risco" dataKey="TotalRisk" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
</ExpandableChart>
              ) : (
                <p className="text-muted-foreground text-sm">Sem dados suficientes para correlação.</p>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart: Detalhamento de Faltas e Advertencias */}
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
              <CardTitle className="text-sm">Atrito Setorial Detalhado</CardTitle>
              <CardDescription className="text-xs">Onde estão os gargalos de RH na operação?</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              {deptRisk.length > 0 ? (
                <ExpandableChart title="Visualização Ampliada">
<ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptRisk} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#333" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="subject" type="category" tick={{ fill: '#888', fontSize: 11 }} width={80} />
                    <Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="Faltas" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Advertências" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Feedbacks_Críticos" stackId="a" fill="#eab308" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
</ExpandableChart>
              ) : (
                 <div className="h-full flex items-center justify-center"><p className="text-muted-foreground text-sm">Sem dados no período.</p></div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
