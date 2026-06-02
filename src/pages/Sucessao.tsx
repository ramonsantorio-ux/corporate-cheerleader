import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockEmployees = [
  { name: "João", role: "Dev", perf: "Alto", pot: "Alto", box: "top-right" },
  { name: "Maria", role: "Design", perf: "Médio", pot: "Alto", box: "top-center" },
  { name: "Carlos", role: "QA", perf: "Baixo", pot: "Baixo", box: "bottom-left" },
  { name: "Ana", role: "PM", perf: "Alto", pot: "Médio", box: "center-right" },
  { name: "Pedro", role: "Dev", perf: "Alto", pot: "Baixo", box: "bottom-right" },
];

export default function Sucessao() {
  const getBoxStyle = (x: number, y: number) => {
    // x: 0=Baixo, 1=Médio, 2=Alto (Desempenho)
    // y: 0=Alto, 1=Médio, 2=Baixo (Potencial)
    if (x === 2 && y === 0) return "bg-green-500/20 border-green-500/50"; // Alto Potencial / Alto Desempenho (Star)
    if (x === 0 && y === 2) return "bg-red-500/20 border-red-500/50"; // Baixo/Baixo
    if (x === 2 && y === 2) return "bg-blue-500/20 border-blue-500/50"; // Alto Desempenho / Baixo Pot (Profi Confiável)
    if (x === 0 && y === 0) return "bg-yellow-500/20 border-yellow-500/50"; // Alto Pot / Baixo Desemp (Enigma)
    return "bg-card border-border";
  };

  const mapToXY = (pot: string, perf: string) => {
    const x = perf === "Alto" ? 2 : perf === "Médio" ? 1 : 0;
    const y = pot === "Alto" ? 0 : pot === "Médio" ? 1 : 2;
    return { x, y };
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Plano de Sucessão (Matriz 9-Box)</h1>
        <p className="text-muted-foreground mt-2">
          Avaliação estratégica de talentos baseada em Desempenho (Eixo X) e Potencial (Eixo Y).
        </p>
      </div>

      <div className="relative mt-12 bg-muted/10 p-4 rounded-xl border border-border inline-block min-w-full lg:min-w-0">
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Potencial
        </div>
        <div className="absolute left-1/2 -bottom-8 -translate-x-1/2 text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Desempenho
        </div>

        <div className="grid grid-cols-3 gap-4 min-w-[700px] lg:min-w-[900px]">
          {/* Row 0: Alto Potencial */}
          {[0, 1, 2].map(x => {
            const y = 0;
            const emps = mockEmployees.filter(e => mapToXY(e.pot, e.perf).x === x && mapToXY(e.pot, e.perf).y === y);
            return (
              <Card key={`${x}-${y}`} className={`h-48 border-2 ${getBoxStyle(x, y)}`}>
                <CardContent className="p-4 flex flex-wrap gap-2">
                  {emps.map(e => (
                    <Badge key={e.name} variant="outline" className="bg-background">{e.name}</Badge>
                  ))}
                </CardContent>
              </Card>
            )
          })}
          {/* Row 1: Médio Potencial */}
          {[0, 1, 2].map(x => {
            const y = 1;
            const emps = mockEmployees.filter(e => mapToXY(e.pot, e.perf).x === x && mapToXY(e.pot, e.perf).y === y);
            return (
              <Card key={`${x}-${y}`} className={`h-48 border-2 ${getBoxStyle(x, y)}`}>
                <CardContent className="p-4 flex flex-wrap gap-2">
                  {emps.map(e => (
                    <Badge key={e.name} variant="outline" className="bg-background">{e.name}</Badge>
                  ))}
                </CardContent>
              </Card>
            )
          })}
          {/* Row 2: Baixo Potencial */}
          {[0, 1, 2].map(x => {
            const y = 2;
            const emps = mockEmployees.filter(e => mapToXY(e.pot, e.perf).x === x && mapToXY(e.pot, e.perf).y === y);
            return (
              <Card key={`${x}-${y}`} className={`h-48 border-2 ${getBoxStyle(x, y)}`}>
                <CardContent className="p-4 flex flex-wrap gap-2">
                  {emps.map(e => (
                    <Badge key={e.name} variant="outline" className="bg-background">{e.name}</Badge>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  );
}
