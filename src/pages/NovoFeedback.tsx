import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setorLabels, priorityLabels, FeedbackSetor, FeedbackPriority } from '@/lib/feedbackData';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function NovoFeedback() {
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<string[]>([]);
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    setor: 'contrato_porto' as FeedbackSetor,
    prioridade: 'media' as FeedbackPriority,
    departamento: '',
    funcionario: '',
    pontos_positivos: '',
    pontos_melhoria: '',
  });

  useEffect(() => {
    supabase.from('funcionarios').select('nome').then(({ data }) => {
      if (data) setFuncionarios(data.map(f => f.nome));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descricao.trim() || !form.funcionario) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    const { error } = await supabase.from('feedbacks').insert({
      titulo: form.titulo,
      descricao: form.descricao,
      setor: form.setor,
      prioridade: form.prioridade,
      autor: form.funcionario,
      departamento: form.departamento,
      pontos_positivos: form.pontos_positivos,
      pontos_melhoria: form.pontos_melhoria,
      observacoes: form.departamento,
    });

    if (error) {
      toast.error('Erro ao enviar feedback.');
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

        <div>
          <label className={labelClass}>Pontos Positivos</label>
          <textarea
            placeholder="Destaque os pontos positivos..."
            value={form.pontos_positivos}
            onChange={(e) => setForm({ ...form, pontos_positivos: e.target.value })}
            className={`${inputClass} min-h-[80px] resize-none`}
            maxLength={1000}
          />
        </div>

        <div>
          <label className={labelClass}>Pontos de Melhoria</label>
          <textarea
            placeholder="Indique os pontos de melhoria..."
            value={form.pontos_melhoria}
            onChange={(e) => setForm({ ...form, pontos_melhoria: e.target.value })}
            className={`${inputClass} min-h-[80px] resize-none`}
            maxLength={1000}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Departamento</label>
            <select
              value={form.setor}
              onChange={(e) => setForm({ ...form, setor: e.target.value as FeedbackSetor })}
              className={inputClass}
            >
              {(Object.entries(setorLabels) as [FeedbackSetor, string][]).map(([k, v]) => (
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
          <label className={labelClass}>Observações</label>
          <textarea
            placeholder="Observações adicionais..."
            value={form.departamento}
            onChange={(e) => setForm({ ...form, departamento: e.target.value })}
            className={`${inputClass} min-h-[80px] resize-none`}
            maxLength={500}
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
