import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FeedbackCard from '@/components/feedback/FeedbackCard';
import { mockFeedbacks, FeedbackStatus, FeedbackPriority, statusLabels, priorityLabels } from '@/lib/feedbackData';

export default function Feedbacks() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'todos'>('todos');
  const [priorityFilter, setPriorityFilter] = useState<FeedbackPriority | 'todos'>('todos');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = mockFeedbacks.filter((fb) => {
    const matchSearch = fb.titulo.toLowerCase().includes(search.toLowerCase()) ||
      fb.descricao.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todos' || fb.status === statusFilter;
    const matchPriority = priorityFilter === 'todos' || fb.prioridade === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">Feedbacks</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie todos os feedbacks recebidos</p>
      </motion.div>

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
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Filter className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum feedback encontrado com os filtros aplicados.</p>
        </div>
      )}
    </div>
  );
}
