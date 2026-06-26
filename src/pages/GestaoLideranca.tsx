import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, AlertTriangle, TrendingUp, Target, BrainCircuit, Activity } from "lucide-react";

export default function GestaoLideranca() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    fetchTeamData();
  }, []);

  async function fetchTeamData() {
    setLoading(true);
    // Para fins de demonstração do painel, vamos buscar todos os funcionários, mas na vida real seria .eq('encarregado_id', user.id)
    const { data } = await supabase.from('funcionarios').select('*');
    if (data) {
      setTeam(data);
    }
    setLoading(false);
  }

  const faltasCriticas = team.filter(t => t.feedbacks_recebidos > 5); // Apenas mock para a interface
  const talentosRisco = team.filter(t => t.nine_box_desempenho === 'Baixo' && t.nine_box_potencial === 'Baixo');
  const topTalentos = team.filter(t => t.nine_box_desempenho === 'Alto' && t.nine_box_potencial === 'Alto');

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-primary" />
          Painel da Liderança
        </h1>
        <p className="text-muted-foreground">
          Visão estratégica da sua equipe, indicadores de risco, sucessão e PDI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> Total da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Colaboradores ativos sob sua gestão</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Risco de Turnover (9-Box)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{talentosRisco.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Classificados como Enigma/Risco</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" /> Top Talents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{topTalentos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Prontos para promoção</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="visao-geral" className="flex items-center gap-2"><Activity className="w-4 h-4" /> Visão da Equipe</TabsTrigger>
          <TabsTrigger value="pdi" className="flex items-center gap-2"><Target className="w-4 h-4" /> PDI (Planos de Desenvolvimento)</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Colaboradores em Foco (Risco)</CardTitle>
                <CardDescription>Membros da equipe que precisam de acompanhamento próximo.</CardDescription>
              </CardHeader>
              <CardContent>
                {talentosRisco.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">Nenhum colaborador em área de risco no 9-Box.</div>
                ) : (
                  <div className="space-y-4">
                    {talentosRisco.map(t => (
                      <div key={t.id} className="flex justify-between items-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        <div>
                          <p className="font-semibold text-sm">{t.nome}</p>
                          <p className="text-xs text-muted-foreground">{t.cargo}</p>
                        </div>
                        <span className="text-xs bg-background border px-2 py-1 rounded-md">Desempenho Baixo</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Destaques (Prontos para Sucessão)</CardTitle>
                <CardDescription>Membros com alto desempenho e alto potencial.</CardDescription>
              </CardHeader>
              <CardContent>
                {topTalentos.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">Ainda sem avaliações de Top Talent.</div>
                ) : (
                  <div className="space-y-4">
                    {topTalentos.map(t => (
                      <div key={t.id} className="flex justify-between items-center bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                        <div>
                          <p className="font-semibold text-sm">{t.nome}</p>
                          <p className="text-xs text-muted-foreground">{t.cargo}</p>
                        </div>
                        <span className="text-xs bg-background border px-2 py-1 rounded-md text-green-600 font-medium">Promoção/Sucessão</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pdi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Planos de Desenvolvimento Individual (PDI)</CardTitle>
              <CardDescription>Crie e acompanhe as metas de evolução da sua equipe.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <Target className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-bold text-lg text-foreground mb-2">Módulo PDI Ativo</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Aqui o gestor poderá cadastrar objetivos de desenvolvimento técnico ou comportamental (soft skills) para cada liderado, com prazos e status.
                </p>
                {/* Aqui seria incluída a interface completa do PDI num passo futuro */}
                <div className="mt-6 bg-background px-4 py-2 rounded-full border text-sm font-medium text-primary shadow-sm">
                  Em implantação nas próximas atualizações
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
