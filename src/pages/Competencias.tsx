import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Competency {
  id: string;
  name: string;
  description: string | null;
  cycle_id: string | null;
  created_at: string;
}

interface Cycle {
  id: string;
  name: string;
}

export default function Competencias() {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCycle, setFilterCycle] = useState<string>('all');
  const [form, setForm] = useState({ name: '', description: '', cycle_id: '' });
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([fetchCompetencies(), fetchCycles()]);
  }, []);

  async function fetchCompetencies() {
    const { data } = await supabase.from('competencies').select('*').order('created_at', { ascending: false });
    if (data) setCompetencies(data as Competency[]);
    setLoading(false);
  }

  async function fetchCycles() {
    const { data } = await supabase.from('evaluation_cycles').select('id, name');
    if (data) setCycles(data as Cycle[]);
  }

  async function createCompetency() {
    if (!form.name) {
      toast({ title: 'Informe o nome da competência', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('competencies').insert([{
      name: form.name,
      description: form.description || null,
      cycle_id: form.cycle_id || null,
    }]);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Competência criada!' });
      setDialogOpen(false);
      setForm({ name: '', description: '', cycle_id: '' });
      fetchCompetencies();
    }
  }

  async function deleteCompetency(id: string) {
    await supabase.from('competencies').delete().eq('id', id);
    fetchCompetencies();
  }

  const filtered = filterCycle === 'all'
    ? competencies
    : competencies.filter(c => c.cycle_id === filterCycle);

  const cycleName = (id: string | null) => cycles.find(c => c.id === id)?.name || 'Geral';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Competências</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie competências personalizáveis por ciclo</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nova Competência</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Competência</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Liderança" /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descreva a competência" /></div>
              <div>
                <Label>Ciclo (opcional)</Label>
                <Select value={form.cycle_id} onValueChange={v => setForm({ ...form, cycle_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Geral (todos os ciclos)" /></SelectTrigger>
                  <SelectContent>{cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={createCompetency} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground">Filtrar por ciclo:</Label>
        <Select value={filterCycle} onValueChange={setFilterCycle}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhuma competência encontrada.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((comp, i) => (
            <motion.div key={comp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="glass-card rounded-xl p-4 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">{comp.name}</h3>
                {comp.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{comp.description}</p>}
                <span className="text-xs text-muted-foreground mt-1 inline-block">Ciclo: {cycleName(comp.cycle_id)}</span>
              </div>
              <button onClick={() => deleteCompetency(comp.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
