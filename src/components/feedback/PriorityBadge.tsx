import { FeedbackPriority, priorityLabels, priorityColors } from '@/lib/feedbackData';

export default function PriorityBadge({ priority }: { priority: FeedbackPriority }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[priority]}`}>
      {priorityLabels[priority]}
    </span>
  );
}
