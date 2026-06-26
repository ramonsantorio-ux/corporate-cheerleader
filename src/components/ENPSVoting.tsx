import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Smile, Meh, Frown, MessageSquare } from "lucide-react";
import { FastTextarea } from "@/components/ui/fast-textarea";

export function ENPSVoting() {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveSurvey();
  }, []);

  async function fetchActiveSurvey() {
    const { data } = await supabase.from("climate_surveys").select("*").eq("status", "active").limit(1);
    if (data && data.length > 0) {
      setSurveyId(data[0].id);
    } else {
      // Create a default survey if none exists for demo purposes
      const { data: newSurvey } = await supabase
        .from("climate_surveys")
        .insert([{ title: "Pesquisa de Clima Contínua", status: "active" }])
        .select();
      if (newSurvey && newSurvey.length > 0) {
        setSurveyId(newSurvey[0].id);
      }
    }
  }

  async function submitVote() {
    if (score === null || !surveyId) return;
    setLoading(true);
    
    // In a real app we'd get the actual user ID. We use a mock ID for demo if not logged in.
    const mockEmployeeId = "00000000-0000-0000-0000-000000000000"; 
    
    // Fetch a real employee to use as reference if available
    const { data: employees } = await supabase.from("funcionarios").select("id").limit(1);
    const employeeId = employees && employees.length > 0 ? employees[0].id : mockEmployeeId;

    const { error } = await supabase.from("climate_responses").insert([{
      survey_id: surveyId,
      employee_id: employeeId,
      score: score,
      comment: comment || null
    }]);

    setLoading(false);
    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Voto registrado!", description: "Obrigado por ajudar a melhorar nosso ambiente." });
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <Smile className="w-12 h-12 text-primary mb-2" />
          <h3 className="font-bold text-lg">Obrigado pelo seu feedback!</h3>
          <p className="text-sm text-muted-foreground">Sua resposta é muito importante para nós.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-t-4 border-t-blue-500 relative overflow-hidden group">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Termômetro de Clima (eNPS)</CardTitle>
        <CardDescription>Em uma escala de 0 a 10, qual a probabilidade de você recomendar nossa empresa como um bom lugar para se trabalhar?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center py-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              onClick={() => setScore(num)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-sm sm:text-base transition-all
                ${score === num 
                  ? num >= 9 ? 'bg-green-500 text-white scale-110 shadow-md' 
                  : num >= 7 ? 'bg-yellow-500 text-white scale-110 shadow-md' 
                  : 'bg-red-500 text-white scale-110 shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105'
                }`}
            >
              {num}
            </button>
          ))}
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground px-2">
          <div className="flex flex-col items-center gap-1 text-red-500/80"><Frown className="w-4 h-4"/> Pouco provável</div>
          <div className="flex flex-col items-center gap-1 text-yellow-500/80"><Meh className="w-4 h-4"/> Neutro</div>
          <div className="flex flex-col items-center gap-1 text-green-500/80"><Smile className="w-4 h-4"/> Muito provável</div>
        </div>

        {score !== null && (
          <div className="pt-4 space-y-3 animate-fade-in">
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                O que motivou a sua nota? (Opcional)
              </label>
              <FastTextarea 
                placeholder="Seu comentário é anônimo..." 
                className="resize-none h-20"
                value={comment}
                onValueChange={setComment}
              />
            </div>
            <Button onClick={submitVote} disabled={loading} className="w-full">
              {loading ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
