import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Users, ClipboardList, Plus, Calendar, ChevronRight, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface EvaluationCycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export default function Desempenho() {
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCycle, setNewCycle] = useState({ name: '', start_date: '', end_date: '' });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCycles();
  }, []);

  async function fetchCycles() {
    const { data, error } = await supabase
      .from('evaluation_cycles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setCycles(data as EvaluationCycle[]);
    setLoading(false);
  }

  async function createCycle() {
    if (!newCycle.name || !newCycle.start_date || !newCycle.end_date) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('evaluation_cycles').insert([{
      name: newCycle.name,
      start_date: newCycle.start_date,
      end_date: newCycle.end_date,
    }]);
    if (error) {
      toast({ title: 'Erro ao criar ciclo', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ciclo criado com sucesso!' });
      setNewCycle({ name: '', start_date: '', end_date: '' });
      setDialogOpen(false);
      fetchCycles();
    }
  }

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-muted text-muted-foreground',
  };

  const statusLabel: Record<string, string> = {
    active: 'Ativo',
    draft: 'Rascunho',
    closed: 'Encerrado',
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Desempenho</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão de metas, competências e PDI</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Novo Ciclo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Ciclo de Avaliação</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Nome do Ciclo</Label><Input value={newCycle.name} onChange={e => setNewCycle({ ...newCycle, name: e.target.value })} placeholder="Ex: Avaliação 2026.1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Início</Label><Input type="date" value={newCycle.start_date} onChange={e => setNewCycle({ ...newCycle, start_date: e.target.value })} /></div>
                <div><Label>Fim</Label><Input type="date" value={newCycle.end_date} onChange={e => setNewCycle({ ...newCycle, end_date: e.target.value })} /></div>
              </div>
              <Button onClick={createCycle} className="w-full">Criar Ciclo</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Quick access cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, label: 'Gestão de Metas', desc: 'Metas individuais e por departamento', to: '/desempenho/avaliacoes' },
          { icon: Target, label: 'Fit Cultural', desc: 'Gerenciar competências e fit cultural', to: '/desempenho/competencias' },
          { icon: Users, label: 'PDI', desc: 'Planos de desenvolvimento', to: '/desempenho/pdi' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            onClick={() => navigate(item.to)}
            className="stat-card cursor-pointer group flex items-center gap-4 hover:border-primary/30"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <item.icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{item.label}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.div>
        ))}
      </div>

      {/* Cycles list */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><Calendar className="w-5 h-5" /> Ciclos de Avaliação</h2>
        {loading ? (
          <div className="text-muted-foreground text-sm">Carregando...</div>
        ) : cycles.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
            <p>Nenhum ciclo criado ainda. Clique em "Novo Ciclo" para começar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cycles.map((cycle, i) => (
              <motion.div key={cycle.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium text-foreground">{cycle.name}</h3>
                  <p className="text-sm text-muted-foreground">{cycle.start_date} → {cycle.end_date}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[cycle.status] || ''}`}>
                  {statusLabel[cycle.status] || cycle.status}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
