import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Expand } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ExpandableChartProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function ExpandableChart({ title, description, children }: ExpandableChartProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <Card className="relative group overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-800/50 shadow-xl">
        <CardHeader className="pr-12">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background"
            onClick={() => setExpanded(true)}
          >
            <Expand className="w-4 h-4 text-slate-500" />
          </Button>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-[90vw] w-[1200px] h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="flex-1 w-full h-full min-h-0 pt-4">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
