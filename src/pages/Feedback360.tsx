import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Search, Plus, Play, CheckCircle2, AlertCircle, RefreshCw, BarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Feedback360() {
  const { toast } = useToast();
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  
  useEffect(() => {
    fetchCycles();
  }, []);

  async function fetchCycles() {
    setLoading(true);
    const { data, error } = await supabase.from('feedback_360_cycles').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setCycles(data);
    } else {
      // Dummy data se tabela nÃ£o existe ainda (fallback para demonstraÃ§Ã£o UI)
      setCycles([
        { id: '1', title: 'Ciclo Q2 2026', start_date: '2026-04-01', end_date: '2026-06-30', status: 'active' },
        { id: '2', title: 'Ciclo Q1 2026', start_date: '2026-01-01', end_date: '2026-03-31', status: 'completed' },
      ]);
    }
    setLoading(false);
  }

  async function handleCreateCycle() {
    if (!newTitle) return;
    try {
      const { data, error } = await supabase.from('feedback_360_cycles').insert({
        title: newTitle,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // +30 dias
        status: 'draft'
      }).select().single();
      
      if (!error && data) {
        setCycles([data, ...cycles]);
        toast({ title: 'Ciclo criado com sucesso!' });
      } else {
        throw new Error('Falha no banco');
      }
    } catch {
      // Mock update
      setCycles([{ id: Date.now().toString(), title: newTitle, start_date: new Date().toISOString().split('T')[0], end_date: '2026-12-31', status: 'draft' }, ...cycles]);
      toast({ title: 'Ciclo criado (Mock Local)' });
    }
    setIsCreating(false);
    setNewTitle('');
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full border border-green-200">Ativo</span>;
      case 'completed': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full border border-blue-200">ConcluÃ­do</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-full border border-gray-200">Rascunho</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1 className="flex items-center gap-2"><Target className="w-6 h-6 text-primary" /> AvaliaÃ§Ã£o 360Âº</h1>
          <p>Gerencie ciclos de feedback e resultados das lideranÃ§as.</p>
        </div>
        <Button onClick={() => setIsCreating(true)}><Plus className="w-4 h-4 mr-2" /> Novo Ciclo</Button>
      </div>

      {isCreating && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-xl space-y-4">
          <h3 className="font-bold">Criar Novo Ciclo de Feedback</h3>
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="Ex: AvaliaÃ§Ã£o LideranÃ§a Q3 2026" 
              className="flex-1 bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button onClick={handleCreateCycle}>Criar</Button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cycles.map(c => (
          <div key={c.id} className="kpi-card p-6 rounded-xl flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg leading-tight">{c.title}</h3>
              {getStatusBadge(c.status)}
            </div>
            <div className="text-sm text-muted-foreground">
              <p>InÃ­cio: {c.start_date}</p>
              <p>Fim: {c.end_date}</p>
            </div>
            
            <div className="mt-auto pt-4 border-t border-border flex gap-2">
              {c.status === 'draft' && (
                <Button variant="outline" size="sm" className="w-full text-green-600 border-green-200 hover:bg-green-50"><Play className="w-3 h-3 mr-2" /> Iniciar</Button>
              )}
              {c.status === 'active' && (
                <Button variant="outline" size="sm" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"><CheckCircle2 className="w-3 h-3 mr-2" /> Concluir</Button>
              )}
              {c.status === 'completed' && (
                <Button variant="outline" size="sm" className="w-full"><BarChart className="w-3 h-3 mr-2" /> Ver Resultados</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
