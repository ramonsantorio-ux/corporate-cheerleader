import React, { useState } from 'react';
import { ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ExpandableChartProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ExpandableChart({ title, description, children }: ExpandableChartProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div 
        className="relative group w-full h-full min-h-[250px] flex flex-col cursor-pointer rounded-xl transition-all duration-300 hover:bg-muted/10"
        onClickCapture={() => setOpen(true)}
        title="Clique para expandir o gráfico"
      >
        {/* Ícone de Lupa que aparece no hover suavemente (apenas visual) */}
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="p-2 bg-background/90 border border-border rounded-lg shadow-sm flex items-center justify-center">
            <ZoomIn className="w-4 h-4 text-primary" />
          </div>
        </div>
        
        {/* Gráfico Original */}
        <div className="flex-1 w-full h-full min-h-0 relative pointer-events-auto">
          {children}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
            {description ? (
              <DialogDescription className="text-base mt-2">{description}</DialogDescription>
            ) : (
              <DialogDescription className="text-base mt-2">Visualização ampliada do gráfico.</DialogDescription>
            )}
          </DialogHeader>
          <div className="flex-1 w-full h-full min-h-0 mt-6 relative">
             {/* Renderiza o mesmo gráfico, mas como o DialogContent é enorme, o ResponsiveContainer vai crescer! */}
             {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
