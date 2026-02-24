import { FeedbackStatus, statusLabels, statusColors } from '@/lib/feedbackData';

export default function StatusBadge({ status }: { status: FeedbackStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
