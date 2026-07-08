import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, User, ChevronDown, ChevronRight, Briefcase, Info, RefreshCw, X, GripHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { DndContext, DragOverlay, useDraggable, useDroppable, pointerWithin, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  encarregado_id: string | null;
  foto_url: string | null;
}

interface TreeNode extends Funcionario {
  children: TreeNode[];
}

export default function Organograma() {
  const [loading, setLoading] = useState(true);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<Funcionario | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const buildTree = useCallback((data: Funcionario[]) => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    data.forEach(f => {
      map.set(f.id, { ...f, children: [] });
    });

    data.forEach(f => {
      const node = map.get(f.id)!;
      if (f.encarregado_id && map.has(f.encarregado_id)) {
        map.get(f.encarregado_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    setTree(roots);
  }, []);

  const fetchFuncionarios = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('funcionarios')
      .select('id, nome, cargo, departamento, encarregado_id, foto_url')
      .order('nome');

    if (error) {
      toast.error('Erro ao buscar funcionários');
      setLoading(false);
      return;
    }

    setFuncionarios(data || []);
    buildTree(data || []);
    setLoading(false);
  }, [buildTree]);

  useEffect(() => {
    fetchFuncionarios();
  }, [fetchFuncionarios]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const draggedId = active.id as string;
    const targetId = over.id as string;

    // Check cycles
    const map = new Map<string, TreeNode>();
    funcionarios.forEach(f => map.set(f.id, { ...f, children: [] }));
    funcionarios.forEach(f => {
      if (f.encarregado_id && map.has(f.encarregado_id)) map.get(f.encarregado_id)!.children.push(map.get(f.id)!);
    });

    const checkCycle = (nodeId: string, searchId: string): boolean => {
      if (nodeId === searchId) return true;
      const node = map.get(nodeId);
      if (!node) return false;
      return node.children.some(child => checkCycle(child.id, searchId));
    };

    if (checkCycle(draggedId, targetId)) {
      toast.error('Movimento inválido: cria um ciclo hierárquico.');
      return;
    }

    toast.info('Atualizando hierarquia...', { id: 'update-org' });
    const { error } = await supabase
      .from('funcionarios')
      .update({ encarregado_id: targetId })
      .eq('id', draggedId);

    if (error) {
      toast.error('Erro ao atualizar gestor.', { id: 'update-org' });
    } else {
      toast.success('Hierarquia atualizada com sucesso!', { id: 'update-org' });
      const newFuncs = funcionarios.map(f => f.id === draggedId ? { ...f, encarregado_id: targetId } : f);
      setFuncionarios(newFuncs);
      buildTree(newFuncs);
    }
  };

  const handleRemoveGestor = async (id: string) => {
    toast.info('Removendo gestor...', { id: 'remove-gestor' });
    const { error } = await supabase
      .from('funcionarios')
      .update({ encarregado_id: null })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar.', { id: 'remove-gestor' });
    } else {
      toast.success('Gestor removido.', { id: 'remove-gestor' });
      const newFuncs = funcionarios.map(f => f.id === id ? { ...f, encarregado_id: null } : f);
      setFuncionarios(newFuncs);
      buildTree(newFuncs);
      if (selectedNode?.id === id) {
        setSelectedNode({ ...selectedNode, encarregado_id: null });
      }
    }
  };

  const OrgNode = ({ node, isRoot = false }: { node: TreeNode, isRoot?: boolean }) => {
    const [expanded, setExpanded] = useState(true);
    
    // Draggable
    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
      id: node.id,
      data: node,
    });
    
    // Droppable
    const { isOver, setNodeRef: setDropRef } = useDroppable({
      id: node.id,
      data: node,
    });

    const style = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0.3 : 1,
      zIndex: isDragging ? 50 : 10,
    };

    return (
      <div className="flex flex-col items-center">
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10"
        >
          {/* O ref do Droppable fica em volta do card */}
          <div ref={setDropRef}>
            {/* O ref do Draggable e os estilos de arrastar */}
            <div
              ref={setDragRef}
              style={style}
              className={`relative flex items-center gap-3 p-3 rounded-xl border ${isOver ? 'border-primary bg-primary/10 scale-105 shadow-md' : 'border-border bg-card shadow-sm hover:shadow-md'} transition-all w-64 cursor-pointer`}
              onClick={() => setSelectedNode(node)}
            >
              {/* Drag Handle explicitly separated for clarity */}
              <div 
                {...attributes} 
                {...listeners} 
                className="absolute -left-3 top-1/2 -translate-y-1/2 p-1.5 bg-muted rounded-full border shadow-sm cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground hover:bg-accent transition-opacity z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <GripHorizontal className="h-4 w-4" />
              </div>

              {/* Node Content */}
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border ml-2">
                {node.foto_url ? (
                  <img src={node.foto_url} alt={node.nome} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold truncate text-foreground">{node.nome}</h4>
                <p className="text-xs text-muted-foreground truncate">{node.cargo}</p>
              </div>
              
              {node.children.length > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground shrink-0 z-20 relative"
                >
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Children */}
        <AnimatePresence>
          {expanded && node.children.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col items-center overflow-hidden"
            >
              <div className="w-px h-6 bg-border"></div>
              <div className="flex gap-4 relative pt-4">
                {node.children.length > 1 && (
                  <div className="absolute top-0 left-[50%] right-[50%] h-px bg-border w-[calc(100%-4rem)] -translate-x-1/2"></div>
                )}
                {node.children.map((child) => (
                  <div key={child.id} className="flex flex-col items-center relative">
                    <div className="absolute top-0 w-px h-4 bg-border -translate-y-full"></div>
                    <OrgNode node={child} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const activeNodeData = funcionarios.find(f => f.id === activeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organograma Interativo</h1>
          <p className="text-muted-foreground mt-1">Visualize e edite a hierarquia da empresa. Use a alça lateral (6 pontinhos) de um funcionário para arrastá-lo sobre outro gestor.</p>
        </div>
        <Button variant="outline" onClick={fetchFuncionarios}><RefreshCw className="mr-2 h-4 w-4" /> Atualizar</Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <Card className="flex-1 overflow-auto min-h-[600px] w-full bg-muted/30 border-dashed">
          <CardContent className="p-8">
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
              <div className="min-w-max flex justify-center pb-20 pt-10">
                {tree.length > 0 ? (
                  <div className="flex gap-12">
                    {tree.map(root => (
                      <OrgNode key={root.id} node={root} isRoot />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground mt-20">Nenhum funcionário encontrado.</div>
                )}
              </div>
              
              {/* Ghost overlay during drag */}
              <DragOverlay dropAnimation={null}>
                {activeNodeData ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/50 bg-background/80 backdrop-blur-sm shadow-xl w-64 opacity-80 cursor-grabbing ml-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                      {activeNodeData.foto_url ? (
                        <img src={activeNodeData.foto_url} alt={activeNodeData.nome} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate text-foreground">{activeNodeData.nome}</h4>
                      <p className="text-xs text-muted-foreground truncate">{activeNodeData.cargo}</p>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>

        {/* Side Panel Details */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full lg:w-80 shrink-0"
            >
              <Card className="sticky top-6">
                <CardHeader className="pb-4 relative">
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden mx-auto border-2 border-border mb-4">
                    {selectedNode.foto_url ? (
                      <img src={selectedNode.foto_url} alt={selectedNode.nome} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <CardTitle className="text-center">{selectedNode.nome}</CardTitle>
                  <div className="flex justify-center mt-2"><Badge variant="secondary">{selectedNode.cargo}</Badge></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1 mb-1"><Briefcase className="h-3 w-3"/> Departamento</Label>
                    <p className="text-sm font-medium">{selectedNode.departamento || 'Não informado'}</p>
                  </div>
                  
                  {selectedNode.encarregado_id && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1 mb-1"><User className="h-3 w-3"/> Responde a</Label>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-primary">
                          {funcionarios.find(f => f.id === selectedNode.encarregado_id)?.nome || 'Desconhecido'}
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveGestor(selectedNode.id)} className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10">Remover</Button>
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/50 p-3 rounded-lg mt-4 text-xs text-muted-foreground flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>Para alterar o gestor, use a alça de arrastar (6 pontinhos) ao lado do card desta pessoa no organograma e solte sobre o card do novo gestor.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
