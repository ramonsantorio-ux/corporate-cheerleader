import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Users, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  foto_url: string;
  email: string;
}

const departamentos = [
  'Contrato Porto', 'Contrato Usina', 'Frotas', 'Medição',
  'Segurança', 'CCO', 'CCM', 'Manutenção', 'RH', 'Financeiro',
];

export default function Colaboradores() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('todos');
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('funcionarios')
      .select('id, nome, cargo, departamento, foto_url, email')
      .order('nome')
      .then(({ data }) => {
        if (data) setFuncionarios(data as Funcionario[]);
        setLoading(false);
      });
  }, []);

  const filtered = funcionarios.filter((f) => {
    const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase()) || f.cargo.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'todos' || f.departamento === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Colaboradores</h1>
        <p className="text-muted-foreground text-sm mt-1">Lista de funcionários cadastrados</p>
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
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum colaborador encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all"
              onClick={() => navigate(`/funcionario/${f.id}`)}
            >
              {f.foto_url ? (
                <img src={f.foto_url} alt={f.nome} className="w-10 h-10 rounded-full object-cover border-2 border-primary/20" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-sm">{f.nome.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{f.nome}</p>
                <p className="text-xs text-muted-foreground">{f.cargo} · {f.departamento}</p>
              </div>
              <Button variant="ghost" size="icon" title="Ver perfil">
                <Eye className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
