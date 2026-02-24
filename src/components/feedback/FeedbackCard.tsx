import { motion } from 'framer-motion';
import { ThumbsUp, MessageSquare } from 'lucide-react';
import { Feedback, categoryLabels } from '@/lib/feedbackData';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

interface FeedbackCardProps {
  feedback: Feedback;
  index: number;
  onClick?: () => void;
}

export default function FeedbackCard({ feedback, index, onClick }: FeedbackCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="glass-card rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2">
          {feedback.titulo}
        </h3>
        <PriorityBadge priority={feedback.prioridade} />
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{feedback.descricao}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge status={feedback.status} />
          <span className="text-xs text-muted-foreground">{categoryLabels[feedback.categoria]}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" /> {feedback.votos}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> {feedback.comentarios}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">{feedback.autor} · {feedback.departamento}</span>
        <span className="text-xs text-muted-foreground">{feedback.criadoEm}</span>
      </div>
    </motion.div>
  );
}
