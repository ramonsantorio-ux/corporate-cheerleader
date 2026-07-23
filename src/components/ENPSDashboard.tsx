import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Smile, Meh, Frown, Users, MessageSquare } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

export function ENPSDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    promoters: 0,
    passives: 0,
    detractors: 0,
    total: 0,
    score: 0
  });
  type EnpsComment = { id: string; score: number; comment?: string; created_at: string };
  const [comments, setComments] = useState<EnpsComment[]>([]);

  useEffect(() => {
    fetchENPSData();
  }, []);

  async function fetchENPSData() {
    setLoading(true);
    
    // Fetch all responses for active surveys
    const { data: surveys } = await supabase.from("climate_surveys").select("id").eq("status", "active");
    if (surveys && surveys.length > 0) {
      const surveyIds = surveys.map(s => s.id);
      
      const { data: responses } = await supabase
        .from("climate_responses")
        .select("*")
        .in("survey_id", surveyIds)
        .order("created_at", { ascending: false });

      if (responses) {
        let pro = 0, pas = 0, det = 0;
        const validComments = [];

        responses.forEach(r => {
          if (r.score >= 9) pro++;
          else if (r.score >= 7) pas++;
          else det++;

          if (r.comment && r.comment.trim().length > 0) {
            validComments.push({
              id: r.id,
              score: r.score,
              text: r.comment,
              date: new Date(r.created_at).toLocaleDateString("pt-BR")
            });
          }
        });

        const total = pro + pas + det;
        const score = total > 0 ? Math.round(((pro / total) - (det / total)) * 100) : 0;

        setMetrics({ promoters: pro, passives: pas, detractors: det, total, score });
        setComments(validComments.slice(0, 10)); // keep last 10 comments
      }
    }
    
    setLoading(false);
  }

  const pieData = [
    { name: 'Promotores', value: metrics.promoters, color: '#22c55e' },
    { name: 'Neutros', value: metrics.passives, color: '#eab308' },
    { name: 'Detratores', value: metrics.detractors, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-500";
    if (score >= 50) return "text-emerald-500";
    if (score >= 10) return "text-yellow-500";
    if (score >= -10) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return "Zona de Excelência";
    if (score >= 50) return "Zona de Qualidade";
    if (score >= 10) return "Zona de Aperfeiçoamento";
    return "Zona Crítica";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-sm flex flex-col justify-center text-center p-6 border-t-4 border-t-primary relative overflow-hidden">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Score eNPS Atual</p>
          <div className={`text-7xl font-black ${getScoreColor(metrics.score)}`}>
            {metrics.score > 0 ? `+${metrics.score}` : metrics.score}
          </div>
          <p className="mt-4 font-medium text-foreground">{getScoreLabel(metrics.score)}</p>
          <div className="absolute opacity-5 -right-4 -bottom-4">
            <Smile className="w-48 h-48" />
          </div>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Distribuição de Colaboradores</CardTitle>
            <CardDescription>Total de {metrics.total} respostas recebidas na pesquisa ativa.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center">
            <div className="w-1/2 h-[200px]">
              {metrics.total > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados suficientes</div>
              )}
            </div>
            <div className="w-1/2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600"><Smile className="w-5 h-5"/> Promotores (9-10)</div>
                <div className="font-bold text-lg">{metrics.promoters}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-600"><Meh className="w-5 h-5"/> Neutros (7-8)</div>
                <div className="font-bold text-lg">{metrics.passives}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600"><Frown className="w-5 h-5"/> Detratores (0-6)</div>
                <div className="font-bold text-lg">{metrics.detractors}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Feedback Aberto Recente</CardTitle>
          <CardDescription>Comentários deixados de forma anônima pelos colaboradores.</CardDescription>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum comentário recebido recentemente.</div>
          ) : (
            <div className="space-y-4">
              {comments.map(c => (
                <div key={c.id} className="p-4 rounded-lg bg-muted/30 border flex gap-4 items-start">
                  <div className={`mt-1 rounded-full p-2 ${
                    c.score >= 9 ? 'bg-green-100 text-green-600' :
                    c.score >= 7 ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {c.score >= 9 ? <Smile className="w-5 h-5"/> : c.score >= 7 ? <Meh className="w-5 h-5"/> : <Frown className="w-5 h-5"/>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">Colaborador Anônimo</span>
                      <span className="text-xs text-muted-foreground">{c.date}</span>
                    </div>
                    <p className="text-sm text-foreground/80 italic">"{c.text}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
