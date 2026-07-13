import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const matrixBoxes = [
  // Top Row (Potencial Alto)
  { pot: 'Alto', des: 'Baixo', label: 'Enigma', desc: 'Alto potencial, mas desempenho atual baixo.', color: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30', activeColor: 'bg-orange-500/30 border-orange-500 ring-2 ring-orange-500' },
  { pot: 'Alto', des: 'Médio', label: 'Forte Desempenho', desc: 'Alto potencial e bom desempenho.', color: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30', activeColor: 'bg-emerald-500/30 border-emerald-500 ring-2 ring-emerald-500' },
  { pot: 'Alto', des: 'Alto', label: 'Estrela', desc: 'Talento excepcional.', color: 'bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-600/30', activeColor: 'bg-emerald-600/30 border-emerald-600 ring-2 ring-emerald-600' },
  // Middle Row (Potencial Médio)
  { pot: 'Médio', des: 'Baixo', label: 'Questionável', desc: 'Potencial médio, baixo desempenho.', color: 'bg-red-400/10 hover:bg-red-400/20 border-red-400/30', activeColor: 'bg-red-400/30 border-red-400 ring-2 ring-red-400' },
  { pot: 'Médio', des: 'Médio', label: 'Mantenedor', desc: 'Sólido e confiável.', color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30', activeColor: 'bg-blue-500/30 border-blue-500 ring-2 ring-blue-500' },
  { pot: 'Médio', des: 'Alto', label: 'Forte Desempenho', desc: 'Alto desempenho constante.', color: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30', activeColor: 'bg-emerald-500/30 border-emerald-500 ring-2 ring-emerald-500' },
  // Bottom Row (Potencial Baixo)
  { pot: 'Baixo', des: 'Baixo', label: 'Insuficiente', desc: 'Baixo em ambos.', color: 'bg-red-600/10 hover:bg-red-600/20 border-red-600/30', activeColor: 'bg-red-600/30 border-red-600 ring-2 ring-red-600' },
  { pot: 'Baixo', des: 'Médio', label: 'Eficaz', desc: 'Desempenho aceitável.', color: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30', activeColor: 'bg-orange-500/30 border-orange-500 ring-2 ring-orange-500' },
  { pot: 'Baixo', des: 'Alto', label: 'Especializado', desc: 'Excelente na função.', color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30', activeColor: 'bg-blue-500/30 border-blue-500 ring-2 ring-blue-500' },
];

export default function Sucessao() {
  const [employees, setEmployees] = useState<{ name: string, role: string, perf: string, pot: string }[]>([]);
  const [selectedBox, setSelectedBox] = useState<{ box: typeof matrixBoxes[0], emps: typeof employees } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('funcionarios').select('nome, cargo, nine_box_desempenho, nine_box_potencial');
      if (data) {
        // TODO: We can probably fetch eligible_roles from cycle, but here we just show all who have nine box set.
        const mapped = data
          .filter(e => e.nine_box_desempenho && e.nine_box_potencial)
          .map(e => ({
            name: e.nome,
            role: e.cargo,
            perf: e.nine_box_desempenho as string,
            pot: e.nine_box_potencial as string
          }));
        setEmployees(mapped);
      }
    }
    fetchData();
  }, []);

  const handleBoxClick = (box: typeof matrixBoxes[0], emps: typeof employees) => {
    setSelectedBox({ box, emps });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plano de Sucessão (Matriz 9-Box)</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Avaliação estratégica de talentos baseada em Desempenho e Potencial
          </p>
        </div>
      </div>

      <div className="flex justify-center mt-12">
        <div className="bg-background rounded-xl p-8 border border-border/50 shadow-sm relative inline-block">
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-muted-foreground tracking-widest">
            POTENCIAL
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-muted-foreground tracking-widest">
            DESEMPENHO (ENTREGA)
          </div>

          <div className="grid grid-cols-3 gap-3 relative min-w-[600px] lg:min-w-[800px]">
            {matrixBoxes.map((box) => {
              const emps = employees.filter(e => e.pot === box.pot && e.perf === box.des);
              return (
                <button
                  key={`${box.pot}-${box.des}`}
                  onClick={() => handleBoxClick(box, emps)}
                  className={`
                    flex flex-col items-center justify-center p-6 rounded-xl border transition-all text-center min-h-[140px] cursor-pointer hover:shadow-md
                    ${box.color}
                  `}
                >
                  <span className="font-bold text-lg text-foreground mb-2">{box.label}</span>
                  <span className="text-xs text-muted-foreground/80 leading-tight mb-3">{box.desc}</span>
                  <Badge variant="secondary" className="bg-background/80 text-foreground font-semibold">
                    {emps.length} {emps.length === 1 ? 'colaborador' : 'colaboradores'}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedBox} onOpenChange={(open) => !open && setSelectedBox(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedBox && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${selectedBox.box.color.split(' ')[0].replace('/10', '')}`} />
                  {selectedBox.box.label}
                </DialogTitle>
                <DialogDescription className="text-sm mt-2">
                  {selectedBox.box.desc}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Colaboradores neste quadro:</span>
                  <Badge variant="outline">{selectedBox.emps.length}</Badge>
                </h4>
                
                {selectedBox.emps.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded-lg text-center">Nenhum colaborador classificado neste quadro.</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {selectedBox.emps.map(emp => (
                      <div key={emp.name} className="flex flex-col bg-muted/50 p-3 rounded-lg border border-border/50">
                        <span className="font-medium text-sm">{emp.name}</span>
                        <span className="text-xs text-muted-foreground mt-1">{emp.role}</span>
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
