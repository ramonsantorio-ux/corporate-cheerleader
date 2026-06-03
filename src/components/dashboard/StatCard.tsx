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
  const borderClass = changeType === 'positive'
    ? 'border-l-success bg-success/5'
    : changeType === 'negative'
      ? 'border-l-destructive bg-destructive/5'
      : 'border-l-primary';

  const titleColorClass = changeType === 'positive'
    ? 'text-success'
    : changeType === 'negative'
      ? 'text-destructive'
      : 'text-muted-foreground';

  const valueColorClass = changeType === 'positive'
    ? 'text-success'
    : changeType === 'negative'
      ? 'text-destructive'
      : 'text-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`glass-card rounded-xl p-4 border-l-4 flex flex-col justify-between ${borderClass} min-h-[90px]`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${titleColorClass}`}>
          <Icon className="w-3.5 h-3.5" /> {title}
        </p>
      </div>
      <div className="flex items-end justify-between">
        <h3 className={`text-2xl font-black tracking-tight ${valueColorClass}`}>{value}</h3>
        {change && (
          <span className="text-[10px] font-semibold text-muted-foreground max-w-[50%] text-right leading-tight">
            {change}
          </span>
        )}
      </div>
    </motion.div>
  );
}
