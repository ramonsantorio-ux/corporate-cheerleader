import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Plus, Loader2, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Absence {
  id: string; employee_id: string; type: string; start_date: string; end_date: string;
  reason: string; status: string; created_at: string; employee_name?: string;
}

interface Func { id: string; nome: string; }

const typeLabels: Record<string, string> = {
  ferias: 'Férias', licenca: 'Licença', falta: 'Falta justificada', falta_injust: 'Falta injustificada', atestado: 'Atestado médico',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado',
};

export default function Ausencias() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [funcionarios, setFuncionarios] = useState<Func[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: '', type: 'ferias', start_date: '', end_date: '', reason: '' });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [aRes, fRes] = await Promise.all([
      supabase.from('absences').select('*').order('start_date', { ascending: false }),
      supabase.from('funcionarios').select('id, nome').order('nome'),
    ]);
    const funcs = (fRes.data || []) as Func[];
    setFuncionarios(funcs);
    const nameMap = Object.fromEntries(funcs.map(f => [f.id, f.nome]));
    setAbsences((aRes.data || []).map((a: any) => ({ ...a, employee_name: nameMap[a.employee_id] || 'Desconhecido' })));
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.employee_id || !form.start_date || !form.end_date) { toast.error('Preencha os campos obrigatórios'); return; }
    const { error } = await supabase.from('absences').insert({
      employee_id: form.employee_id, type: form.type, start_date: form.start_date,
      end_date: form.end_date, reason: form.reason,
    });
    if (error) { toast.error('Erro ao registrar ausência'); return; }
    setDialogOpen(false);
    setForm({ employee_id: '', type: 'ferias', start_date: '', end_date: '', reason: '' });
    toast.success('Ausência registrada!');
    fetchAll();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('absences').update({ status }).eq('id', id);
    toast.success(`Status atualizado para ${statusLabels[status]}`);
    fetchAll();
  }

  async function deleteAbsence(id: string) {
    await supabase.from('absences').delete().eq('id', id);
    toast.success('Registro removido');
    fetchAll();
  }

  const statusColor = (s: string) => s === 'approved' ? 'bg-success/10 text-success' : s === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Controle de Ausências</h1>
          <p className="text-muted-foreground text-sm mt-1">Férias, licenças e faltas dos funcionários</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Registrar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Ausência</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Funcionário</Label>
                <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Início</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Fim</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Motivo</Label><Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2} /></div>
              <Button className="w-full" onClick={handleCreate}>Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : absences.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma ausência registrada</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {absences.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{a.employee_name}</p>
                <p className="text-xs text-muted-foreground">
                  {typeLabels[a.type] || a.type} · {new Date(a.start_date).toLocaleDateString('pt-BR')} a {new Date(a.end_date).toLocaleDateString('pt-BR')}
                </p>
                {a.reason && <p className="text-xs text-muted-foreground mt-1 truncate">{a.reason}</p>}
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor(a.status)}`}>
                {statusLabels[a.status] || a.status}
              </span>
              <div className="flex items-center gap-1">
                {a.status === 'pending' && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => updateStatus(a.id, 'approved')} title="Aprovar"><Check className="w-4 h-4 text-success" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => updateStatus(a.id, 'rejected')} title="Rejeitar"><X className="w-4 h-4 text-destructive" /></Button>
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={() => deleteAbsence(a.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
