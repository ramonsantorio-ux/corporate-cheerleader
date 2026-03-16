import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Loader2, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Meeting {
  id: string; employee_id: string; manager_name: string; meeting_date: string;
  notes: string; action_items: string; status: string; created_at: string;
  employee_name?: string;
}

interface Func { id: string; nome: string; }

export default function Reunioes() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [funcionarios, setFuncionarios] = useState<Func[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: '', meeting_date: '', notes: '', action_items: '' });
  const [period, setPeriod] = useState<PeriodRange>(getPortoPeriod(0));

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [mRes, fRes] = await Promise.all([
      supabase.from('meetings').select('*').order('meeting_date', { ascending: false }),
      supabase.from('funcionarios').select('id, nome').order('nome'),
    ]);
    const funcs = (fRes.data || []) as Func[];
    setFuncionarios(funcs);
    const nameMap = Object.fromEntries(funcs.map(f => [f.id, f.nome]));
    setMeetings((mRes.data || []).map((m: any) => ({ ...m, employee_name: nameMap[m.employee_id] || 'Desconhecido' })));
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.employee_id || !form.meeting_date) { toast.error('Preencha funcionário e data'); return; }
    const { error } = await supabase.from('meetings').insert({
      employee_id: form.employee_id,
      manager_name: user?.user_metadata?.full_name || user?.email || 'Gestor',
      meeting_date: form.meeting_date,
      notes: form.notes,
      action_items: form.action_items,
    });
    if (error) { toast.error('Erro ao criar reunião'); return; }
    setDialogOpen(false);
    setForm({ employee_id: '', meeting_date: '', notes: '', action_items: '' });
    toast.success('Reunião agendada!');
    fetchAll();
  }

  async function toggleStatus(id: string, current: string) {
    const newStatus = current === 'completed' ? 'scheduled' : 'completed';
    await supabase.from('meetings').update({ status: newStatus }).eq('id', id);
    fetchAll();
  }

  async function deleteMeeting(id: string) {
    await supabase.from('meetings').delete().eq('id', id);
    toast.success('Reunião removida');
    fetchAll();
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reuniões 1:1</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhamento individual dos funcionários</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nova Reunião</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Agendar Reunião 1:1</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Funcionário</Label>
                <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={form.meeting_date} onChange={e => setForm({ ...form, meeting_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Pauta / Anotações</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="O que será discutido..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Ações combinadas</Label>
                <Textarea value={form.action_items} onChange={e => setForm({ ...form, action_items: e.target.value })} placeholder="Itens de ação..." rows={2} />
              </div>
              <Button className="w-full" onClick={handleCreate}>Agendar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma reunião registrada</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {meetings.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${m.status === 'completed' ? 'bg-success/10' : 'bg-primary/10'}`}>
                {m.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Clock className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{m.employee_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(m.meeting_date).toLocaleDateString('pt-BR')} · {m.manager_name}</p>
                {m.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{m.notes}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => toggleStatus(m.id, m.status)}>
                  {m.status === 'completed' ? 'Reabrir' : 'Concluir'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMeeting(m.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
