import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DEPARTAMENTOS } from "@/lib/departments";
import { Building2, TrendingUp, History, Sparkles, UserCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface EmployeeNineBox {
  id: string;
  name: string;
  role: string;
  departamento: string;
  perf: string;
  pot: string;
  history: { cycle: string; desempenho: string; potencial: string; created_at: string }[];
}

export default function Sucessao() {
  const { userDepartment, effectiveDepartment, isDepartmentLocked } = useAuth();
  const [deptFilter, setDeptFilter] = useState<string>('todos');

  useEffect(() => {
    if (isDepartmentLocked && userDepartment) {
      setDeptFilter(userDepartment);
    } else if (effectiveDepartment) {
      setDeptFilter(effectiveDepartment);
    }
  }, [isDepartmentLocked, userDepartment, effectiveDepartment]);

  const [employees, setEmployees] = useState<EmployeeNineBox[]>([]);
  const [selectedBox, setSelectedBox] = useState<{ box: typeof matrixBoxes[0], emps: EmployeeNineBox[] } | null>(null);

  const activeDept = (isDepartmentLocked && userDepartment) ? userDepartment : deptFilter;

  useEffect(() => {
    async function fetchData() {
      const { data: funcData } = await supabase.from('funcionarios').select('id, nome, cargo, departamento, nine_box_desempenho, nine_box_potencial');
      const { data: histData } = await supabase.from('nine_box_historico').select('id, employee_id, cycle, desempenho, potencial, created_at').order('created_at', { ascending: false });

      if (funcData) {
        const raw = funcData
          .filter(e => e.nine_box_desempenho && e.nine_box_potencial)
          .map(e => {
            const empHist = (histData || []).filter(h => h.employee_id === e.id);
            return {
              id: e.id,
              name: e.nome,
              role: e.cargo || '—',
              departamento: e.departamento || '—',
              perf: e.nine_box_desempenho as string,
              pot: e.nine_box_potencial as string,
              history: empHist
            };
          });

        const filtered = activeDept === 'todos' ? raw : raw.filter(e => e.departamento === activeDept);
        setEmployees(filtered);
      }
    }
    fetchData();
  }, [deptFilter, isDepartmentLocked, userDepartment]);

  const handleBoxClick = (box: typeof matrixBoxes[0], emps: EmployeeNineBox[]) => {
    setSelectedBox({ box, emps });
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Matriz Nine Box & Trajetória da Equipe</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Mapeamento estratégico de talentos e evolução contínua da equipe
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDepartmentLocked && userDepartment ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary font-semibold text-xs rounded-lg whitespace-nowrap">
              <Building2 className="w-4 h-4" />
              <span>{userDepartment}</span>
            </div>
          ) : (
            <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v)}>
              <SelectTrigger className="w-44 h-9 text-xs">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Departamentos</SelectItem>
                {DEPARTAMENTOS.map(d => (
                  <SelectItem key={d} value={d}>🏢 {d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Matriz Nine Box Grid */}
      <div className="flex justify-center mt-6">
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

      {/* 📈 SEÇÃO DE EVOLUÇÃO E TRAJETÓRIA DOS COLABORADORES */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Evolução & Histórico da Equipe no Nine Box</h3>
              <p className="text-xs text-muted-foreground">Linha do tempo de movimentação e performance dos membros do time</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">
            {employees.length} Integrantes Avaliados
          </Badge>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-lg">
            Nenhum colaborador com avaliação Nine Box encontrada para o filtro selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="p-4 rounded-xl border border-border/80 bg-muted/20 hover:border-primary/40 transition-all space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-primary" />
                      {emp.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{emp.role} • {emp.departamento}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-xs">
                    {emp.perf} / {emp.pot}
                  </Badge>
                </div>

                {/* Histórico / Trajetória */}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                    <History className="w-3 h-3" /> Trajetória por Ciclo ({emp.history.length} registro(s)):
                  </p>
                  {emp.history.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">Avaliação recente registrada.</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {emp.history.map((h, i) => (
                        <div key={h.created_at + i} className="flex items-center gap-1 text-xs bg-background px-2.5 py-1 rounded-md border border-border/60">
                          <span className="font-semibold text-foreground">{h.cycle}:</span>
                          <span className="text-muted-foreground">{h.desempenho}/{h.potencial}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes dos Colaboradores por Quadro */}
      <Dialog open={!!selectedBox} onOpenChange={(open) => !open && setSelectedBox(null)}>
        <DialogContent className="sm:max-w-[480px]">
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
                      <div key={emp.id} className="flex flex-col bg-muted/50 p-3 rounded-lg border border-border/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-foreground">{emp.name}</span>
                          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                            {emp.history.length} ciclo(s)
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{emp.role} • {emp.departamento}</span>
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
