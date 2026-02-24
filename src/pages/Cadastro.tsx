import { motion } from 'framer-motion';
import { Plus, Search, Users, Edit, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Funcionario {
  id: string;
  nome: string;
  email: string;
  departamento: string;
  cargo: string;
  data_admissao: string;
  feedbacks_recebidos: number;
  feedbacks_resolvidos: number;
}

const departamentos = [
  'Contrato Porto', 'Contrato Usina', 'Frotas', 'Medição',
  'Segurança', 'CCO', 'CCM', 'Manutenção', 'RH', 'Financeiro',
];

export default function Cadastro() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('todos');
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ id: '', nome: '', email: '', cargo: '', departamento: '' });
  const [newData, setNewData] = useState({ nome: '', email: '', cargo: '', departamento: '' });

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  async function fetchFuncionarios() {
    setLoading(true);
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar funcionários');
      console.error(error);
    } else {
      setFuncionarios(data || []);
    }
    setLoading(false);
  }

  const filtered = funcionarios.filter((f) => {
    const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase()) || f.cargo.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'todos' || f.departamento === deptFilter;
    return matchSearch && matchDept;
  });

  const getPctResolvido = (f: Funcionario) =>
    f.feedbacks_recebidos > 0 ? Math.round((f.feedbacks_resolvidos / f.feedbacks_recebidos) * 100) : 0;

  async function handleCreate() {
    if (!newData.nome || !newData.cargo || !newData.departamento) {
      toast.error('Preencha todos os campos');
      return;
    }
    const { error } = await supabase.from('funcionarios').insert({
      nome: newData.nome,
      email: newData.email,
      cargo: newData.cargo,
      departamento: newData.departamento,
    });

    if (error) {
      toast.error('Erro ao cadastrar funcionário');
      console.error(error);
      return;
    }

    setNewData({ nome: '', email: '', cargo: '', departamento: '' });
    setCreateOpen(false);
    toast.success('Funcionário cadastrado!');
    fetchFuncionarios();
  }

  function openEdit(f: Funcionario) {
    setEditData({ id: f.id, nome: f.nome, email: f.email, cargo: f.cargo, departamento: f.departamento });
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editData.nome || !editData.cargo || !editData.departamento) {
      toast.error('Preencha todos os campos');
      return;
    }
    const { error } = await supabase.from('funcionarios').update({
      nome: editData.nome,
      email: editData.email,
      cargo: editData.cargo,
      departamento: editData.departamento,
    }).eq('id', editData.id);

    if (error) {
      toast.error('Erro ao atualizar funcionário');
      console.error(error);
      return;
    }

    setEditOpen(false);
    toast.success('Funcionário atualizado!');
    fetchFuncionarios();
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from('funcionarios').delete().eq('id', deleteId);

    if (error) {
      toast.error('Erro ao excluir funcionário');
      console.error(error);
      return;
    }

    setDeleteId(null);
    toast.success('Funcionário excluído!');
    fetchFuncionarios();
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold">Cadastro de Funcionários</h1>
        <p className="text-muted-foreground text-sm mt-1">Acompanhe a evolução e desempenho da equipe</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou cargo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {departamentos.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Funcionário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Funcionário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome completo</Label><Input value={newData.nome} onChange={e => setNewData({ ...newData, nome: e.target.value })} placeholder="Nome do funcionário" /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={newData.email} onChange={e => setNewData({ ...newData, email: e.target.value })} placeholder="email@empresa.com" /></div>
              <div className="space-y-2"><Label>Cargo</Label><Input value={newData.cargo} onChange={e => setNewData({ ...newData, cargo: e.target.value })} placeholder="Cargo" /></div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select value={newData.departamento} onValueChange={v => setNewData({ ...newData, departamento: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {departamentos.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleCreate}>Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum funcionário encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((f, i) => {
            const pct = getPctResolvido(f);
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{f.nome}</p>
                  <p className="text-xs text-muted-foreground">{f.cargo} · {f.departamento}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-bold">{f.feedbacks_recebidos}</p>
                    <p className="text-xs text-muted-foreground">Recebidos</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{f.feedbacks_resolvidos}</p>
                    <p className="text-xs text-muted-foreground">Resolvidos</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-bold ${pct >= 70 ? 'text-green-500' : pct >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>{pct}%</p>
                    <p className="text-xs text-muted-foreground">Evolução</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(f)} title="Editar">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(f.id)} title="Excluir" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Nome completo</Label><Input value={editData.nome} onChange={e => setEditData({ ...editData, nome: e.target.value })} /></div>
            <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Cargo</Label><Input value={editData.cargo} onChange={e => setEditData({ ...editData, cargo: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={editData.departamento} onValueChange={v => setEditData({ ...editData, departamento: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {departamentos.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleEdit}>Salvar Alterações</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O funcionário será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
