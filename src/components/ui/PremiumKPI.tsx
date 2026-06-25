import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface PremiumKPIProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  iconColor?: string;
  trend?: number; // percentage
  trendLabel?: string;
  delay?: number;
  sparklineData?: any[];
  sparklineColor?: string;
  className?: string;
}

export function PremiumKPI({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  trendLabel,
  delay = 0,
  sparklineData,
  sparklineColor = 'hsl(var(--primary))',
  className,
}: PremiumKPIProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const isNumber = typeof value === 'number';

  // Animated Counter Effect
  useEffect(() => {
    if (!isNumber) return;
    
    const numericValue = value as number;
    let startTimestamp: number;
    const duration = 1500; // 1.5s animation

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(numericValue * easeProgress);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(numericValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, isNumber]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        "relative overflow-hidden rounded-2xl glass-card border border-white/20 dark:border-white/5 p-5 shadow-lg group transition-all duration-300 hover:shadow-2xl",
        className
      )}
    >
      {/* Background Sparkline (Optional) */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-16 opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`color-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sparklineColor} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={sparklineColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={sparklineColor} 
                fillOpacity={1} 
                fill={`url(#color-${title.replace(/\s+/g, '')})`} 
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-sm font-medium tracking-tight text-muted-foreground uppercase">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tighter text-foreground">
              {isNumber 
                ? Number.isInteger(value) 
                  ? Math.round(displayValue) 
                  : displayValue.toFixed(1)
                : value}
            </h3>
          </div>
          {(subtitle || trend !== undefined) && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              {trend !== undefined && (
                <span className={cn(
                  "font-semibold px-2 py-0.5 rounded-full text-xs",
                  trend > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : 
                  trend < 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : 
                  "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                )}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
              {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={cn(
            "p-3 rounded-xl transition-colors duration-300 bg-background/50 backdrop-blur-md shadow-sm group-hover:bg-background",
            iconColor
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
