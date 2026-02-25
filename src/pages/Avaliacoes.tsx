import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Filter, Pencil, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Goal {
  id: string;
  cargo: string;
  descricao: string;
  peso: number;
  resultado: number | null;
  muito_abaixo: string;
  abaixo: string;
  dentro: string;
  acima: string;
  muito_acima: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--accent))'];

const emptyForm = { descricao: '', peso: 0, resultado: '' as string, muito_abaixo: '', abaixo: '', dentro: '', acima: '', muito_acima: '' };

const MONTHS = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' }, { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' }, { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

export default function Avaliacoes() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargos, setCargos] = useState<string[]>([]);
  const [selectedCargo, setSelectedCargo] = useState<string>('');
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => { fetchGoals(); }, []);

  async function fetchGoals() {
    const { data } = await supabase.from('goals').select('*').order('peso', { ascending: false });
    if (data) {
      const typed = data as Goal[];
      setGoals(typed);
      const uniqueCargos = [...new Set(typed.map(g => g.cargo))];
      setCargos(uniqueCargos);
      if (uniqueCargos.length > 0 && !selectedCargo) setSelectedCargo(uniqueCargos[0]);
    }
    setLoading(false);
  }

  function openEdit(goal: Goal) {
    setEditGoal(goal);
    setForm({
      descricao: goal.descricao,
      peso: goal.peso,
      resultado: goal.resultado != null ? String(goal.resultado) : '',
      muito_abaixo: goal.muito_abaixo,
      abaixo: goal.abaixo,
      dentro: goal.dentro,
      acima: goal.acima,
      muito_acima: goal.muito_acima,
    });
    setDialogOpen(true);
  }

  function openNew() {
    setEditGoal(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  async function saveGoal() {
    if (!form.descricao || !form.peso) {
      toast({ title: 'Preencha descrição e peso', variant: 'destructive' });
      return;
    }
    if (editGoal) {
      const { error } = await supabase.from('goals').update({
        descricao: form.descricao,
        peso: form.peso,
        resultado: form.resultado !== '' ? Number(form.resultado) : null,
        muito_abaixo: form.muito_abaixo,
        abaixo: form.abaixo,
        dentro: form.dentro,
        acima: form.acima,
        muito_acima: form.muito_acima,
      }).eq('id', editGoal.id);
      if (error) { toast({ title: 'Erro ao salvar', variant: 'destructive' }); return; }
      toast({ title: 'Meta atualizada!' });
    } else {
      const { error } = await supabase.from('goals').insert([{
        cargo: selectedCargo,
        descricao: form.descricao,
        peso: form.peso,
        muito_abaixo: form.muito_abaixo,
        abaixo: form.abaixo,
        dentro: form.dentro,
        acima: form.acima,
        muito_acima: form.muito_acima,
      }]);
      if (error) { toast({ title: 'Erro ao criar', variant: 'destructive' }); return; }
      toast({ title: 'Meta criada!' });
    }
    setDialogOpen(false);
    fetchGoals();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await supabase.from('goals').delete().eq('id', deleteId);
    setDeleteId(null);
    toast({ title: 'Meta excluída' });
    fetchGoals();
  }

  const filtered = goals.filter(g => g.cargo === selectedCargo);
  const pieData = filtered.map(g => ({ name: g.descricao, value: g.peso }));
  const barData = filtered.map(g => ({ name: g.descricao.length > 20 ? g.descricao.slice(0, 18) + '…' : g.descricao, Peso: g.peso }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Target className="w-6 h-6 text-primary" /> Gestão de Metas</h1>
          <p className="text-muted-foreground text-sm mt-1">Metas por cargo — Contrato Porto</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nova Meta</Button>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos os meses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedCargo} onValueChange={setSelectedCargo}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
            <SelectContent>
              {cargos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhuma meta encontrada para este cargo.</div>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card rounded-xl p-5">
              <h2 className="text-base font-semibold text-foreground mb-4">Distribuição de Pesos</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} label={({ name, value }) => `${value}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-card rounded-xl p-5">
              <h2 className="text-base font-semibold text-foreground mb-4">Peso por Meta</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="Peso" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Goals table */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-primary/5">
              <h2 className="text-base font-bold text-foreground">{selectedCargo}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="text-left p-3 font-semibold text-foreground">Descrição</th>
                    <th className="text-center p-3 font-semibold text-foreground">Peso</th>
                    <th className="text-center p-3 font-semibold text-foreground">Resultado</th>
                    <th className="text-center p-3 font-semibold text-foreground whitespace-nowrap">Muito Abaixo do Esperado</th>
                    <th className="text-center p-3 font-semibold text-foreground whitespace-nowrap">Abaixo do Esperado</th>
                    <th className="text-center p-3 font-semibold text-foreground whitespace-nowrap">Dentro Esperado (Aceitável)</th>
                    <th className="text-center p-3 font-semibold text-foreground whitespace-nowrap">Acima do Esperado</th>
                    <th className="text-center p-3 font-semibold text-foreground whitespace-nowrap">Muito Acima do Esperado</th>
                    <th className="text-center p-3 font-semibold text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((goal, i) => (
                    <tr key={goal.id} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <td className="p-3 font-medium text-foreground">{goal.descricao}</td>
                      <td className="p-3 text-center font-semibold text-foreground">{goal.peso}%</td>
                      <td className="p-3 text-center text-muted-foreground">{goal.resultado != null ? goal.resultado : '—'}</td>
                      <td className="p-3 text-center text-xs text-destructive">{goal.muito_abaixo}</td>
                      <td className="p-3 text-center text-xs text-destructive/70">{goal.abaixo}</td>
                      <td className="p-3 text-center text-xs text-foreground">{goal.dentro}</td>
                      <td className="p-3 text-center text-xs text-primary">{goal.acima}</td>
                      <td className="p-3 text-center text-xs text-primary font-medium">{goal.muito_acima}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(goal)} className="p-1 text-muted-foreground hover:text-primary transition-colors" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(goal.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-bold">
                    <td className="p-3 text-foreground">TOTAL</td>
                    <td className="p-3 text-center text-foreground">{filtered.reduce((s, g) => s + g.peso, 0)}%</td>
                    <td colSpan={7}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label>Descrição</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Peso (%)</Label><Input type="number" value={form.peso} onChange={e => setForm({ ...form, peso: Number(e.target.value) })} /></div>
              <div><Label>Resultado</Label><Input type="number" value={form.resultado} onChange={e => setForm({ ...form, resultado: e.target.value })} placeholder="Ex: 85" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Muito Abaixo</Label><Input value={form.muito_abaixo} onChange={e => setForm({ ...form, muito_abaixo: e.target.value })} /></div>
              <div><Label>Abaixo</Label><Input value={form.abaixo} onChange={e => setForm({ ...form, abaixo: e.target.value })} /></div>
              <div><Label>Dentro</Label><Input value={form.dentro} onChange={e => setForm({ ...form, dentro: e.target.value })} /></div>
              <div><Label>Acima</Label><Input value={form.acima} onChange={e => setForm({ ...form, acima: e.target.value })} /></div>
              <div className="col-span-2"><Label>Muito Acima</Label><Input value={form.muito_acima} onChange={e => setForm({ ...form, muito_acima: e.target.value })} /></div>
            </div>
            <Button onClick={saveGoal} className="w-full">{editGoal ? 'Salvar' : 'Criar'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
