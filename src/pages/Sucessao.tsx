import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const mockEmployees = [
  { name: "JoÃ£o", role: "Dev", perf: "Alto", pot: "Alto", box: "top-right" },
  { name: "Maria", role: "Design", perf: "MÃ©dio", pot: "Alto", box: "top-center" },
  { name: "Carlos", role: "QA", perf: "Baixo", pot: "Baixo", box: "bottom-left" },
  { name: "Ana", role: "PM", perf: "Alto", pot: "MÃ©dio", box: "center-right" },
  { name: "Pedro", role: "Dev", perf: "Alto", pot: "Baixo", box: "bottom-right" },
];

const boxLabels: Record<string, { title: string, desc: string }> = {
  "0-0": { title: "Enigma (Question Mark)", desc: "Baixo Desempenho / Alto Potencial. Requer treinamento e alinhamento de expectativas." },
  "1-0": { title: "Estrela em AscensÃ£o", desc: "MÃ©dio Desempenho / Alto Potencial. Alto potencial de crescimento, focar em mentoria." },
  "2-0": { title: "Top Talent (Estrela)", desc: "Alto Desempenho / Alto Potencial. Prontos para promoÃ§Ã£o, foco em retenÃ§Ã£o." },
  "0-1": { title: "Profissional Inconsistente", desc: "Baixo Desempenho / MÃ©dio Potencial. Necessita de plano de melhoria e acompanhamento." },
  "1-1": { title: "Profissional Chave (Key Player)", desc: "MÃ©dio Desempenho / MÃ©dio Potencial. Base da equipe, focar em engajamento contÃ­nuo." },
  "2-1": { title: "Forte Desempenho", desc: "Alto Desempenho / MÃ©dio Potencial. Entregam muito resultado, manter motivados." },
  "0-2": { title: "Risco (Underperformer)", desc: "Baixo Desempenho / Baixo Potencial. Requer aÃ§Ã£o corretiva imediata ou desligamento." },
  "1-2": { title: "Profissional Efetivo", desc: "MÃ©dio Desempenho / Baixo Potencial. Boas entregas dentro do esperado, sem grande ambiÃ§Ã£o atual." },
  "2-2": { title: "Especialista (ConfiÃ¡vel)", desc: "Alto Desempenho / Baixo Potencial. Excelentes na funÃ§Ã£o atual, Ã³timos tÃ©cnicos." },
};

export default function Sucessao() {
  const [selectedBox, setSelectedBox] = useState<{ x: number, y: number, emps: typeof mockEmployees } | null>(null);

  const getBoxStyle = (x: number, y: number) => {
    // x: 0=Baixo, 1=MÃ©dio, 2=Alto (Desempenho)
    // y: 0=Alto, 1=MÃ©dio, 2=Baixo (Potencial)
    if (x === 2 && y === 0) return "bg-green-500/20 border-green-500/50 hover:bg-green-500/30"; // Alto Potencial / Alto Desempenho (Star)
    if (x === 0 && y === 2) return "bg-red-500/20 border-red-500/50 hover:bg-red-500/30"; // Baixo/Baixo
    if (x === 2 && y === 2) return "bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30"; // Alto Desempenho / Baixo Pot (Profi ConfiÃ¡vel)
    if (x === 0 && y === 0) return "bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30"; // Alto Pot / Baixo Desemp (Enigma)
    return "bg-card border-border hover:bg-accent/50";
  };

  const mapToXY = (pot: string, perf: string) => {
    const x = perf === "Alto" ? 2 : perf === "MÃ©dio" ? 1 : 0;
    const y = pot === "Alto" ? 0 : pot === "MÃ©dio" ? 1 : 2;
    return { x, y };
  };

  const handleBoxClick = (x: number, y: number, emps: typeof mockEmployees) => {
    setSelectedBox({ x, y, emps });
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Plano de SucessÃ£o (Matriz 9-Box)</h1>
        <p className="text-muted-foreground mt-2">
          AvaliaÃ§Ã£o estratÃ©gica de talentos baseada em Desempenho (Eixo X) e Potencial (Eixo Y). Clique nos quadros para ver detalhes.
        </p>
      </div>

      <div className="relative mt-12 bg-muted/10 p-4 rounded-xl border border-border inline-block min-w-full lg:min-w-0 overflow-x-auto">
        <div className="absolute -left-6 md:-left-8 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-semibold text-muted-foreground uppercase tracking-widest hidden md:block">
          Potencial
        </div>
        <div className="absolute left-1/2 -bottom-6 md:-bottom-8 -translate-x-1/2 text-sm font-semibold text-muted-foreground uppercase tracking-widest hidden md:block">
          Desempenho
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-4 min-w-[600px] md:min-w-[800px] lg:min-w-[900px] pb-8 md:pb-0">
          {[0, 1, 2].map(y => (
            [0, 1, 2].map(x => {
              const emps = mockEmployees.filter(e => mapToXY(e.pot, e.perf).x === x && mapToXY(e.pot, e.perf).y === y);
              const label = boxLabels[`${x}-${y}`];
              return (
                <Card 
                  key={`${x}-${y}`} 
                  className={`h-32 md:h-48 border-2 transition-all cursor-pointer ${getBoxStyle(x, y)}`}
                  onClick={() => handleBoxClick(x, y, emps)}
                >
                  <CardContent className="p-3 md:p-4 h-full flex flex-col">
                    <span className="text-[10px] md:text-xs font-bold opacity-50 mb-2 truncate" title={label.title}>{label.title}</span>
                    <div className="flex flex-wrap gap-1 md:gap-2 overflow-y-auto">
                      {emps.map(e => (
                        <Badge key={e.name} variant="outline" className="bg-background text-[10px] md:text-xs py-0 md:py-0.5">{e.name}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ))}
        </div>
      </div>

      <Dialog open={!!selectedBox} onOpenChange={(open) => !open && setSelectedBox(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedBox && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {boxLabels[`${selectedBox.x}-${selectedBox.y}`]?.title}
                </DialogTitle>
                <DialogDescription className="text-sm mt-2">
                  {boxLabels[`${selectedBox.x}-${selectedBox.y}`]?.desc}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">Colaboradores neste quadro ({selectedBox.emps.length}):</h4>
                {selectedBox.emps.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhum colaborador classificado neste quadro.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedBox.emps.map(emp => (
                      <div key={emp.name} className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                        <span className="font-medium text-sm">{emp.name}</span>
                        <Badge variant="secondary" className="text-xs">{emp.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
