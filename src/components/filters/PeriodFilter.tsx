import { useState, useMemo } from 'react';
import { CalendarDays, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface PeriodRange {
  start: string;
  end: string;
  label: string;
}

function getPortoPeriod(monthsOffset = 0): PeriodRange {
  const now = new Date();
  const day = now.getDate();
  let refMonth: number, refYear: number;
  if (day >= 21) {
    refMonth = now.getMonth() + monthsOffset;
    refYear = now.getFullYear();
  } else {
    refMonth = now.getMonth() - 1 + monthsOffset;
    refYear = now.getFullYear();
  }
  const start = new Date(refYear, refMonth, 21);
  const end = new Date(refYear, refMonth + 1, 20);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label: `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`,
  };
}

function getMonthPeriod(monthsOffset = 0): PeriodRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthsOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + monthsOffset + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label: start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
  };
}

const PRESETS = [
  { value: 'porto_atual', label: 'Porto Atual (21–20)' },
  { value: 'porto_anterior', label: 'Porto Anterior (21–20)' },
  { value: 'mes_atual', label: 'Mês Atual' },
  { value: 'mes_anterior', label: 'Mês Anterior' },
  { value: 'ultimos_90', label: 'Últimos 90 dias' },
  { value: 'ano_atual', label: 'Ano Atual' },
  { value: 'personalizado', label: 'Personalizado' },
];

function resolvePreset(preset: string): PeriodRange {
  const now = new Date();
  switch (preset) {
    case 'porto_atual': return getPortoPeriod(0);
    case 'porto_anterior': return getPortoPeriod(-1);
    case 'mes_atual': return getMonthPeriod(0);
    case 'mes_anterior': return getMonthPeriod(-1);
    case 'ultimos_90': {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], label: 'Últimos 90 dias' };
    }
    case 'ano_atual': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], label: `Ano ${now.getFullYear()}` };
    }
    default: return getPortoPeriod(0);
  }
}

interface PeriodFilterProps {
  value: PeriodRange;
  onChange: (range: PeriodRange) => void;
  className?: string;
}

export default function PeriodFilter({ value, onChange, className = '' }: PeriodFilterProps) {
  const [preset, setPreset] = useState('porto_atual');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  function handlePresetChange(val: string) {
    setPreset(val);
    if (val !== 'personalizado') {
      onChange(resolvePreset(val));
    }
  }

  function applyCustom() {
    if (customStart && customEnd) {
      onChange({
        start: customStart,
        end: customEnd,
        label: `${new Date(customStart + 'T00:00:00').toLocaleDateString('pt-BR')} — ${new Date(customEnd + 'T00:00:00').toLocaleDateString('pt-BR')}`,
      });
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="w-3.5 h-3.5" />
        <span className="font-medium">Período:</span>
      </div>
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="h-8 w-52 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map(p => (
            <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === 'personalizado' && (
        <div className="flex items-center gap-1.5">
          <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="h-8 text-xs w-36" />
          <span className="text-xs text-muted-foreground">até</span>
          <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="h-8 text-xs w-36" />
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={applyCustom}>Aplicar</Button>
        </div>
      )}

      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground">
        <CalendarDays className="w-3.5 h-3.5" />
        <span>{value.label}</span>
      </div>
    </div>
  );
}

export { getPortoPeriod, getMonthPeriod, resolvePreset };
