import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle2, Clock, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Evaluation {
  id: string;
  cycle_id: string;
  evaluator_name: string;
  evaluator_role: string;
  evaluated_name: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface Cycle {
  id: string;
  name: string;
}

const roleLabels: Record<string, string> = {
  self: 'Autoavaliação',
  manager: 'Gestor',
  peer: 'Par',
  subordinate: 'Subordinado',
};

export default function Avaliacoes() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ cycle_id: '', evaluator_name: '', evaluator_role: 'self', evaluated_name: '' });
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([fetchEvaluations(), fetchCycles()]);
  }, []);

  async function fetchEvaluations() {
    const { data } = await supabase.from('evaluations').select('*').order('created_at', { ascending: false });
    if (data) setEvaluations(data as Evaluation[]);
    setLoading(false);
  }

  async function fetchCycles() {
    const { data } = await supabase.from('evaluation_cycles').select('id, name');
    if (data) setCycles(data as Cycle[]);
  }

  async function createEvaluation() {
    if (!form.cycle_id || !form.evaluator_name || !form.evaluated_name) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('evaluations').insert([form]);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Avaliação criada!' });
      setDialogOpen(false);
      setForm({ cycle_id: '', evaluator_name: '', evaluator_role: 'self', evaluated_name: '' });
      fetchEvaluations();
    }
  }

  const filtered = evaluations.filter(e =>
    e.evaluator_name.toLowerCase().includes(search.toLowerCase()) ||
    e.evaluated_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Metas</h1>
          <p className="text-muted-foreground text-sm mt-1">Metas individuais e por departamento</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nova Avaliação</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Avaliação</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Ciclo</Label>
                <Select value={form.cycle_id} onValueChange={v => setForm({ ...form, cycle_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o ciclo" /></SelectTrigger>
                  <SelectContent>{cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Avaliador</Label><Input value={form.evaluator_name} onChange={e => setForm({ ...form, evaluator_name: e.target.value })} placeholder="Nome do avaliador" /></div>
              <div>
                <Label>Tipo de Avaliação</Label>
                <Select value={form.evaluator_role} onValueChange={v => setForm({ ...form, evaluator_role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Avaliado</Label><Input value={form.evaluated_name} onChange={e => setForm({ ...form, evaluated_name: e.target.value })} placeholder="Nome do avaliado" /></div>
              <Button onClick={createEvaluation} className="w-full">Criar Avaliação</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome..." className="pl-10" />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhuma avaliação encontrada.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ev, i) => (
            <motion.div key={ev.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="glass-card rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium text-foreground">{ev.evaluated_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Avaliador: {ev.evaluator_name} · <span className="capitalize">{roleLabels[ev.evaluator_role]}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {ev.status === 'completed' ? (
                  <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Concluída
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                    <Clock className="w-3.5 h-3.5" /> Pendente
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
