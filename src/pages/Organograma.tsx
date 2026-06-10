import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { UserCircle2, Loader2, Settings2, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
}

interface OrgNode {
  id: string;
  name: string;
  role: string;
  children?: OrgNode[];
}

interface HierarchyLevel {
  id: string;
  title: string;
  keywords: string;
}

const DEFAULT_HIERARCHY: HierarchyLevel[] = [
  { id: '1', title: 'Gerente de Contratos', keywords: 'gerente' },
  { id: '2', title: 'Coordenador', keywords: 'coordenador' },
  { id: '3', title: 'Supervisor de Campo', keywords: 'supervisor' },
  { id: '4', title: 'Encarregados e Téc. Segurança', keywords: 'encarregado, tecnico, técnico' }
];

function OrgCard({ node }: { node: OrgNode }) {
  return (
    <div className="flex flex-col items-center">
      <Card className="w-48 mb-6 shadow-md border-primary/20 bg-card z-10">
        <CardContent className="p-4 flex flex-col items-center gap-2">
          <UserCircle2 className="w-10 h-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-semibold text-sm leading-tight">{node.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{node.role}</p>
          </div>
        </CardContent>
      </Card>

      {node.children && node.children.length > 0 && (
        <div className="relative flex justify-center mt-2">
          {/* Vertical line connecting parent to horizontal line */}
          <div className="absolute -top-8 left-1/2 w-px h-8 bg-border" />
          
          {/* Horizontal line connecting children */}
          {node.children.length > 1 && (
            <div className="absolute -top-4 left-[10%] right-[10%] h-px bg-border" />
          )}

          <div className="flex gap-4 pt-4">
            {node.children.map((child, idx) => (
              <div key={idx} className="relative flex flex-col items-center">
                {/* Vertical line connecting horizontal line to child */}
                <div className="absolute -top-4 left-1/2 w-px h-4 bg-border" />
                <OrgCard node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Organograma() {
  const [roots, setRoots] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [levels, setLevels] = useState<HierarchyLevel[]>([]);
  const [funcs, setFuncs] = useState<Funcionario[]>([]);

  // Carregar ou inicializar níveis
  useEffect(() => {
    const saved = localStorage.getItem('organograma_hierarchy');
    if (saved) {
      setLevels(JSON.parse(saved));
    } else {
      setLevels(DEFAULT_HIERARCHY);
    }
  }, []);

  // Buscar dados
  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from('funcionarios').select('id, nome, cargo');
      if (error || !data) {
        setLoading(false);
        return;
      }
      setFuncs(data as Funcionario[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Construir a árvore toda vez que funcs ou levels mudarem
  useEffect(() => {
    if (funcs.length === 0 || levels.length === 0) return;

    let currentChildrenNodes: OrgNode[] = [];

    // Iterar de baixo para cima na hierarquia
    for (let i = levels.length - 1; i >= 0; i--) {
      const level = levels[i];
      const keys = level.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
      
      const employeesInLevel = funcs.filter(f => keys.some(k => f.cargo.toLowerCase().includes(k)));
      
      let nodesForLevel: OrgNode[] = [];
      
      if (employeesInLevel.length > 0) {
        nodesForLevel = employeesInLevel.map(e => ({
          id: e.id,
          name: e.nome,
          role: e.cargo,
          children: currentChildrenNodes
        }));
      } else {
        nodesForLevel = [{
          id: `vaga-${level.id}`,
          name: 'Vaga em Aberto',
          role: level.title,
          children: currentChildrenNodes
        }];
      }
      
      currentChildrenNodes = nodesForLevel;
    }

    setRoots(currentChildrenNodes);
  }, [funcs, levels]);

  // Edição
  const moveLevel = (index: number, direction: -1 | 1) => {
    const newLevels = [...levels];
    if (index + direction < 0 || index + direction >= newLevels.length) return;
    const temp = newLevels[index];
    newLevels[index] = newLevels[index + direction];
    newLevels[index + direction] = temp;
    setLevels(newLevels);
  };

  const addLevel = () => {
    setLevels([...levels, { id: Date.now().toString(), title: 'Novo Nível', keywords: '' }]);
  };

  const removeLevel = (index: number) => {
    setLevels(levels.filter((_, i) => i !== index));
  };

  const updateLevel = (index: number, field: keyof HierarchyLevel, value: string) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setLevels(newLevels);
  };

  const saveLevels = () => {
    localStorage.setItem('organograma_hierarchy', JSON.stringify(levels));
    setIsDialogOpen(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Organograma</h1>
          <p className="text-muted-foreground mt-2">
            Estrutura hierárquica baseada nos cargos cadastrados.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Editar Estrutura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Editar Estrutura do Organograma</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Defina os níveis da hierarquia (do cargo mais alto ao mais baixo). O sistema agrupará os funcionários cujos cargos contenham as palavras-chave informadas.
            </p>
            
            <ScrollArea className="flex-1 -mx-6 px-6 overflow-y-auto">
              <div className="space-y-4 py-4">
                {levels.map((level, i) => (
                  <div key={level.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-xl border border-border items-start sm:items-end">
                    <div className="flex-1 space-y-1 w-full">
                      <Label className="text-xs">Título do Nível (ex: Coordenador)</Label>
                      <Input value={level.title} onChange={e => updateLevel(i, 'title', e.target.value)} placeholder="Título..." />
                    </div>
                    <div className="flex-1 space-y-1 w-full">
                      <Label className="text-xs">Palavras-chave do Cargo (separadas por vírgula)</Label>
                      <Input value={level.keywords} onChange={e => updateLevel(i, 'keywords', e.target.value)} placeholder="ex: encarregado, tecnico..." />
                    </div>
                    <div className="flex gap-1 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                      <Button variant="ghost" size="icon" onClick={() => moveLevel(i, -1)} disabled={i === 0}>
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => moveLevel(i, 1)} disabled={i === levels.length - 1}>
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeLevel(i)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="flex items-center justify-between pt-4 border-t mt-auto">
              <Button variant="secondary" onClick={addLevel} className="gap-2">
                <Plus className="w-4 h-4" /> Adicionar Nível
              </Button>
              <Button onClick={saveLevels}>Salvar Estrutura</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full overflow-x-auto pb-10 flex justify-center bg-muted/30 p-8 rounded-xl border border-border min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            Carregando estrutura...
          </div>
        ) : roots.length > 0 ? (
          <div className="min-w-max pt-4 flex gap-12">
            {roots.map((root, idx) => (
              <div key={idx} className="relative flex flex-col items-center">
                <OrgCard node={root} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum dado encontrado.</p>
        )}
      </div>
    </div>
  );
}
