import React from 'react';
import { getHierarchyLevel, getHierarchyName } from '@/lib/hierarchy';
import { Crown, Briefcase, Building, Target, Shield, Cog, FileSpreadsheet, ClipboardList, Wrench } from 'lucide-react';

interface HierarchyBadgeProps {
  cargo?: string | null;
  className?: string;
  showLevelNumber?: boolean;
}

const HIERARCHY_CONFIG: Record<number, { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string }> = {
  1: { icon: Crown, bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/30' },
  2: { icon: Briefcase, bg: 'bg-blue-600/10 dark:bg-blue-600/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-600/30' },
  3: { icon: Building, bg: 'bg-indigo-600/10 dark:bg-indigo-600/20', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-600/30' },
  4: { icon: Target, bg: 'bg-violet-600/10 dark:bg-violet-600/20', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-600/30' },
  5: { icon: Shield, bg: 'bg-emerald-600/10 dark:bg-emerald-600/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-600/30' },
  6: { icon: Cog, bg: 'bg-cyan-600/10 dark:bg-cyan-600/20', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-600/30' },
  7: { icon: FileSpreadsheet, bg: 'bg-teal-600/10 dark:bg-teal-600/20', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-600/30' },
  8: { icon: ClipboardList, bg: 'bg-slate-600/10 dark:bg-slate-600/20', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-600/30' },
  9: { icon: Wrench, bg: 'bg-zinc-600/10 dark:bg-zinc-600/20', text: 'text-zinc-700 dark:text-zinc-400', border: 'border-zinc-600/30' },
};

export const HierarchyBadge: React.FC<HierarchyBadgeProps> = ({ cargo, className = '', showLevelNumber = true }) => {
  const level = getHierarchyLevel(cargo);
  const name = getHierarchyName(cargo);
  const config = HIERARCHY_CONFIG[level] || HIERARCHY_CONFIG[9];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{showLevelNumber ? `Nível ${level}: ${name}` : name}</span>
    </span>
  );
};
