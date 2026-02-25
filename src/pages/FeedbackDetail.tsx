import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ThumbsUp, MessageSquare, Calendar, User, Building2 } from 'lucide-react';
import { setorLabels, FeedbackSetor } from '@/lib/feedbackData';
import StatusBadge from '@/components/feedback/StatusBadge';
import PriorityBadge from '@/components/feedback/PriorityBadge';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackRow {
  id: string;
  titulo: string;
  descricao: string;
  setor: string;
  prioridade: string;
  status: string;
  autor: string;
  departamento: string;
  pontos_positivos: string | null;
  pontos_melhoria: string | null;
  votos: number;
  comentarios: number;
  criado_em: string;
  atualizado_em: string;
}

export default function FeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<FeedbackRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('feedbacks').select('*').eq('id', id).single().then(({ data }) => {
      setFeedback(data as FeedbackRow | null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Carregando...</div>;
  }

  if (!feedback) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Feedback não encontrado.</p>
        <button onClick={() => navigate('/feedbacks')} className="text-primary text-sm mt-2 hover:underline">
          Voltar aos feedbacks
        </button>
      </div>
    );
  }

  const setor = feedback.setor as FeedbackSetor;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={feedback.status as any} />
          <PriorityBadge priority={feedback.prioridade as any} />
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {setorLabels[setor] || feedback.setor}
          </span>
        </div>

        <h1 className="text-xl font-bold">{feedback.titulo}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{feedback.descricao}</p>

        {feedback.pontos_positivos && (
          <div>
            <h3 className="text-sm font-semibold text-success mb-1">Pontos Positivos</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feedback.pontos_positivos}</p>
          </div>
        )}

        {feedback.pontos_melhoria && (
          <div>
            <h3 className="text-sm font-semibold text-warning mb-1">Pontos de Melhoria</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feedback.pontos_melhoria}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{feedback.autor}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span>{feedback.departamento}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{new Date(feedback.criado_em).toISOString().split('T')[0]}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ThumbsUp className="w-4 h-4 text-muted-foreground" />
            <span>{feedback.votos} votos</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-6"
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Comentários ({feedback.comentarios})
        </h2>
        <div className="space-y-4">
          {feedback.comentarios > 0 ? (
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">A</div>
                  <span className="text-sm font-medium">Admin</span>
                  <span className="text-xs text-muted-foreground">· 1 dia atrás</span>
                </div>
                <p className="text-sm text-muted-foreground">Estamos analisando essa questão. Em breve teremos uma atualização.</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <textarea
            placeholder="Adicionar um comentário..."
            className="w-full bg-muted rounded-lg p-3 text-sm outline-none resize-none placeholder:text-muted-foreground min-h-[80px]"
          />
          <button className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Comentar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
