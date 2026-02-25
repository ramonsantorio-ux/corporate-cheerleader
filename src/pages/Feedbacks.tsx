import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, Bell, AlertCircle, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FeedbackCard from '@/components/feedback/FeedbackCard';
import { Feedback, FeedbackStatus, FeedbackPriority, FeedbackSetor, statusLabels, priorityLabels, setorLabels } from '@/lib/feedbackData';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const departamentos = Object.entries(setorLabels) as [FeedbackSetor, string][];

function getDaysSince(dateStr: string) {
  const now = new Date();
  const created = new Date(dateStr);
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

function getAlertType(fb: Feedback): 'quinzenal' | 'mensal' | null {
  if (fb.status === 'resolvido' || fb.status === 'arquivado') return null;
  const days = getDaysSince(fb.criadoEm);
  if (days >= 30) return 'mensal';
  if (days >= 15) return 'quinzenal';
  return null;
}

export default function Feedbacks() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'todos'>('todos');
  const [priorityFilter, setPriorityFilter] = useState<FeedbackPriority | 'todos'>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);
  const [selectedDept, setSelectedDept] = useState<FeedbackSetor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  async function fetchFeedbacks() {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('criado_em', { ascending: false });

    if (data) {
      setFeedbacks(data.map(row => ({
        id: row.id,
        titulo: row.titulo,
        descricao: row.descricao,
        setor: row.setor as FeedbackSetor,
        prioridade: row.prioridade as FeedbackPriority,
        status: row.status as FeedbackStatus,
        autor: row.autor,
        departamento: row.departamento,
        criadoEm: new Date(row.criado_em).toISOString().split('T')[0],
        atualizadoEm: new Date(row.atualizado_em).toISOString().split('T')[0],
        votos: row.votos,
        comentarios: row.comentarios,
      })));
    }
  }

  const filtered = feedbacks.filter((fb) => {
    const matchSearch = fb.titulo.toLowerCase().includes(search.toLowerCase()) ||
      fb.descricao.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todos' || fb.status === statusFilter;
    const matchPriority = priorityFilter === 'todos' || fb.prioridade === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const alertFeedbacks = useMemo(() =>
    feedbacks.filter(fb => getAlertType(fb) !== null), [feedbacks]
  );

  const deptStats = useMemo(() => {
    return departamentos.map(([key, label]) => {
      const deptFbs = feedbacks.filter(fb => fb.setor === key);
      const resolved = deptFbs.filter(fb => fb.status === 'resolvido').length;
      const pending = deptFbs.filter(fb => fb.status !== 'resolvido' && fb.status !== 'arquivado').length;
      return { key, label, total: deptFbs.length, resolved, pending };
    }).filter(d => d.total > 0);
  }, [feedbacks]);

  const selectedDeptPeople = useMemo(() => {
    if (!selectedDept) return [];
    const peopleFbs = feedbacks.filter(fb => fb.setor === selectedDept);
    const byAuthor: Record<string, { nome: string; total: number; resolvidos: number }> = {};
    peopleFbs.forEach(fb => {
      if (!byAuthor[fb.autor]) byAuthor[fb.autor] = { nome: fb.autor, total: 0, resolvidos: 0 };
      byAuthor[fb.autor].total++;
      if (fb.status === 'resolvido') byAuthor[fb.autor].resolvidos++;
    });
    return Object.values(byAuthor);
  }, [selectedDept, feedbacks]);

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from('feedbacks').delete().eq('id', deleteId);
    if (error) {
      toast.error('Erro ao excluir feedback.');
      return;
    }
    setFeedbacks(feedbacks.filter(fb => fb.id !== deleteId));
    setDeleteId(null);
    toast.success('Feedback excluído!');
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Feedbacks</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie todos os feedbacks recebidos</p>
      </motion.div>

      {/* Alert banner */}
      {alertFeedbacks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl border-l-4 border-l-warning"
        >
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-5 h-5 text-warning" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                  {alertFeedbacks.length}
                </span>
              </div>
              <span className="text-sm font-semibold">
                {alertFeedbacks.length} alerta(s) pendente(s)
              </span>
            </div>
            {showAlerts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {showAlerts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2">
                  {alertFeedbacks.map(fb => {
                    const alertType = getAlertType(fb)!;
                    const days = getDaysSince(fb.criadoEm);
                    return (
                      <div
                        key={fb.id}
                        onClick={() => navigate(`/feedbacks/${fb.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      >
                        <AlertCircle className={`w-4 h-4 flex-shrink-0 ${alertType === 'mensal' ? 'text-destructive' : 'text-warning'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{fb.titulo}</p>
                          <p className="text-xs text-muted-foreground">{fb.autor} · {setorLabels[fb.setor]}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          alertType === 'mensal'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {days} dias · {alertType === 'mensal' ? 'Mensal' : 'Quinzenal'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar feedbacks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm hover:bg-muted transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card rounded-xl p-4 flex flex-wrap gap-4"
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | 'todos')}
              className="bg-muted border-none rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="todos">Todos</option>
              {(Object.entries(statusLabels) as [FeedbackStatus, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Prioridade</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as FeedbackPriority | 'todos')}
              className="bg-muted border-none rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="todos">Todas</option>
              {(Object.entries(priorityLabels) as [FeedbackPriority, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </motion.div>
      )}

      <p className="text-sm text-muted-foreground">{filtered.length} feedback(s) encontrado(s)</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((fb, i) => (
          <FeedbackCard
            key={fb.id}
            feedback={fb}
            index={i}
            onClick={() => navigate(`/feedbacks/${fb.id}`)}
            onDelete={() => setDeleteId(fb.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Filter className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum feedback encontrado com os filtros aplicados.</p>
        </div>
      )}

      {/* Department tracking chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-6"
      >
        <h2 className="font-semibold text-lg mb-4">Acompanhamento por Departamento</h2>
        <div className="space-y-3">
          {deptStats.map(dept => {
            const maxTotal = Math.max(...deptStats.map(d => d.total), 1);
            const isSelected = selectedDept === dept.key;
            return (
              <div key={dept.key}>
                <button
                  onClick={() => setSelectedDept(isSelected ? null : dept.key)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm w-32 shrink-0 font-medium">{dept.label}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden flex">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(dept.resolved / maxTotal) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-success"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(dept.pending / maxTotal) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-warning"
                      />
                    </div>
                    <span className="text-xs w-16 text-right text-muted-foreground">
                      {dept.resolved}✓ {dept.pending}⏳
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-32 pl-3 mt-2 space-y-2 border-l-2 border-primary/20">
                        {selectedDeptPeople.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">Sem pessoas neste departamento</p>
                        ) : (
                          selectedDeptPeople.map(person => (
                            <div key={person.nome} className="flex items-center gap-3 py-1.5">
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm flex-1">{person.nome}</span>
                              <span className="text-xs text-muted-foreground">{person.resolvidos}/{person.total} resolvidos</span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-success" /> Realizados</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-warning" /> Pendentes</div>
        </div>
      </motion.div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O feedback será removido permanentemente.
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
