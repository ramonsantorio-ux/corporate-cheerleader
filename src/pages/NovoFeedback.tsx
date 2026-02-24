import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { categoryLabels, priorityLabels, FeedbackCategory, FeedbackPriority } from '@/lib/feedbackData';
import { toast } from 'sonner';

export default function NovoFeedback() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: 'produto' as FeedbackCategory,
    prioridade: 'media' as FeedbackPriority,
    departamento: '',
    funcionario: '',
  });

  const funcionarios = [
    'Maria Silva',
    'Carlos Mendes',
    'Ana Oliveira',
    'Pedro Santos',
    'Juliana Costa',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descricao.trim() || !form.funcionario) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    toast.success('Feedback enviado com sucesso!');
    navigate('/feedbacks');
  };

  const inputClass = "w-full bg-muted rounded-lg px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-shadow";
  const labelClass = "text-sm font-medium mb-1.5 block";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Novo Feedback</h1>
        <p className="text-muted-foreground text-sm mt-1">Compartilhe sua sugestão, problema ou ideia</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="glass-card rounded-xl p-6 space-y-5"
      >
        <div>
          <label className={labelClass}>Título *</label>
          <input
            type="text"
            placeholder="Resumo breve do feedback"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className={inputClass}
            maxLength={100}
          />
        </div>

        <div>
          <label className={labelClass}>Funcionário *</label>
          <select
            value={form.funcionario}
            onChange={(e) => setForm({ ...form, funcionario: e.target.value })}
            className={inputClass}
          >
            <option value="">Selecione o funcionário</option>
            {funcionarios.map((nome) => (
              <option key={nome} value={nome}>{nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Descrição *</label>
          <textarea
            placeholder="Descreva em detalhes o feedback, incluindo contexto e impacto..."
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            className={`${inputClass} min-h-[120px] resize-none`}
            maxLength={1000}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Categoria</label>
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value as FeedbackCategory })}
              className={inputClass}
            >
              {(Object.entries(categoryLabels) as [FeedbackCategory, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Prioridade</label>
            <select
              value={form.prioridade}
              onChange={(e) => setForm({ ...form, prioridade: e.target.value as FeedbackPriority })}
              className={inputClass}
            >
              {(Object.entries(priorityLabels) as [FeedbackPriority, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Departamento</label>
          <input
            type="text"
            placeholder="Seu departamento"
            value={form.departamento}
            onChange={(e) => setForm({ ...form, departamento: e.target.value })}
            className={inputClass}
            maxLength={50}
          />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Send className="w-4 h-4" />
          Enviar Feedback
        </button>
      </motion.form>
    </div>
  );
}
