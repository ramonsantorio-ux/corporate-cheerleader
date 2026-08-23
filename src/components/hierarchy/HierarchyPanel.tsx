import React from 'react';
import { HIERARQUIA_NIVEIS } from '@/lib/hierarchy';
import { HierarchyBadge } from './HierarchyBadge';
import { ShieldCheck, Eye, FileSpreadsheet, Layers } from 'lucide-react';

export const HierarchyPanel: React.FC = () => {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Layers className="w-5 h-5 text-primary" /> Matriz de Hierarquia Corporativa & Acesso a Testes
          </h3>
          <p className="text-xs text-muted-foreground">
            Definição de níveis de gestão para aplicação, acompanhamento e visualização dos testes psicométricos e relatórios executivos.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
          <ShieldCheck className="w-4 h-4" /> 9 Níveis Corporativos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {HIERARQUIA_NIVEIS.map((h) => {
          const isManager = h.level <= 6;
          const dummyCargo = h.name;
          return (
            <div key={h.level} className="p-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors space-y-2.5">
              <div className="flex items-center justify-between">
                <HierarchyBadge cargo={dummyCargo} />
                <span className="text-[11px] font-mono text-muted-foreground">Nível #{h.level}</span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {h.description}
              </p>

              <div className="pt-2 border-t border-border/50 flex flex-wrap gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                  <Eye className="w-3 h-3" /> Visualiza: {isManager ? `Nível ${h.level} ao 9` : 'Individual'}
                </span>
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded">
                  <FileSpreadsheet className="w-3 h-3" /> Aplica: {isManager ? 'Liberado' : 'Sob Solicitação'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
