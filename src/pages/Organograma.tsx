import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { UserCircle2, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

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
            <div className="absolute -top-4 left-1/4 right-1/4 h-px bg-border" />
          )}

          <div className="flex gap-8 pt-4">
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
  const [tree, setTree] = useState<OrgNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrg() {
      const { data, error } = await supabase.from('funcionarios').select('id, nome, cargo');
      if (error || !data) {
        setLoading(false);
        return;
      }
      
      const funcs = data as Funcionario[];
      
      const isRole = (f: Funcionario, rolePart: string) => f.cargo.toLowerCase().includes(rolePart.toLowerCase());
      
      const gerentes = funcs.filter(f => isRole(f, 'gerente operacional'));
      const supervisores = funcs.filter(f => isRole(f, 'supervisor de campo'));
      const encarregados = funcs.filter(f => isRole(f, 'encarregado') || isRole(f, 'ténico de segurança') || isRole(f, 'tecnico de seguranca'));

      const encarregadosNodes = encarregados.length > 0 
        ? encarregados.map(e => ({ id: e.id, name: e.nome, role: e.cargo, children: [] }))
        : [{ id: 'vaga-enc', name: 'Vaga em Aberto', role: 'Encarregado / Téc. Segurança', children: [] }];

      const supervisoresNodes = supervisores.length > 0
        ? supervisores.map(s => ({ id: s.id, name: s.nome, role: s.cargo, children: encarregadosNodes }))
        : [{ id: 'vaga-sup', name: 'Vaga em Aberto', role: 'Supervisor de Campo', children: encarregadosNodes }];

      const rootNode: OrgNode = gerentes.length > 0
        ? { id: gerentes[0].id, name: gerentes[0].nome, role: gerentes[0].cargo, children: supervisoresNodes }
        : { id: 'vaga-ger', name: 'Vaga em Aberto', role: 'Gerente Operacional', children: supervisoresNodes };

      setTree(rootNode);
      setLoading(false);
    }
    loadOrg();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Organograma</h1>
        <p className="text-muted-foreground mt-2">
          Estrutura hierárquica baseada nos cargos cadastrados na base de dados.
        </p>
      </div>

      <div className="w-full overflow-x-auto pb-10 flex justify-center bg-muted/30 p-8 rounded-xl border border-border min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            Carregando estrutura...
          </div>
        ) : tree ? (
          <div className="min-w-max pt-4">
            <OrgCard node={tree} />
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum dado encontrado.</p>
        )}
      </div>
    </div>
  );
}
