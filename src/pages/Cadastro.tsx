import { motion } from 'framer-motion';
import { Plus, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Funcionario {
  id: string;
  nome: string;
  email: string;
  departamento: string;
  cargo: string;
  dataAdmissao: string;
  feedbacksRecebidos: number;
  feedbacksResolvidos: number;
}

const departamentos = [
  'Contrato Porto', 'Contrato Usina', 'Frotas', 'Medição',
  'Segurança', 'CCO', 'CCM', 'Manutenção', 'RH', 'Financeiro',
];

const mockFuncionarios: Funcionario[] = [
  { id: '1', nome: 'Maria Silva', email: 'maria@empresa.com', departamento: 'CCO', cargo: 'Coordenadora', dataAdmissao: '2023-03-15', feedbacksRecebidos: 8, feedbacksResolvidos: 6 },
  { id: '2', nome: 'Carlos Mendes', email: 'carlos@empresa.com', departamento: 'Segurança', cargo: 'Analista', dataAdmissao: '2022-08-01', feedbacksRecebidos: 12, feedbacksResolvidos: 10 },
  { id: '3', nome: 'Ana Oliveira', email: 'ana@empresa.com', departamento: 'RH', cargo: 'Analista de RH', dataAdmissao: '2024-01-10', feedbacksRecebidos: 5, feedbacksResolvidos: 3 },
  { id: '4', nome: 'Pedro Santos', email: 'pedro@empresa.com', departamento: 'Contrato Porto', cargo: 'Supervisor', dataAdmissao: '2021-11-20', feedbacksRecebidos: 15, feedbacksResolvidos: 14 },
  { id: '5', nome: 'Juliana Costa', email: 'juliana@empresa.com', departamento: 'Frotas', cargo: 'Coordenadora de Frotas', dataAdmissao: '2023-06-05', feedbacksRecebidos: 7, feedbacksResolvidos: 4 },
];

export default function Cadastro() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('todos');

  const filtered = mockFuncionarios.filter((f) => {
    const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase()) || f.cargo.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'todos' || f.departamento === deptFilter;
    return matchSearch && matchDept;
  });

  const getPctResolvido = (f: Funcionario) =>
    f.feedbacksRecebidos > 0 ? Math.round((f.feedbacksResolvidos / f.feedbacksRecebidos) * 100) : 0;

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
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Funcionário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Funcionário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome completo</Label><Input placeholder="Nome do funcionário" /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" placeholder="email@empresa.com" /></div>
              <div className="space-y-2"><Label>Cargo</Label><Input placeholder="Cargo" /></div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {departamentos.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                  <p className="font-bold">{f.feedbacksRecebidos}</p>
                  <p className="text-xs text-muted-foreground">Recebidos</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{f.feedbacksResolvidos}</p>
                  <p className="text-xs text-muted-foreground">Resolvidos</p>
                </div>
                <div className="text-center">
                  <p className={`font-bold ${pct >= 70 ? 'text-green-500' : pct >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>{pct}%</p>
                  <p className="text-xs text-muted-foreground">Evolução</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
