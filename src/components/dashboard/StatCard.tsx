import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  delay?: number;
}

export default function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, delay = 0 }: StatCardProps) {
  const accentClass = changeType === 'positive'
    ? 'corporate-kpi-accent'
    : changeType === 'negative'
      ? 'corporate-kpi-danger'
      : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`corporate-kpi ${accentClass}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {change && (
            <p className={`text-xs font-medium mt-1 ${
              changeType === 'positive' ? 'text-success' : changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
}
