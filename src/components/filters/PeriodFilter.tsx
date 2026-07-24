/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface PeriodRange {
  start: string;
  end: string;
  label: string;
}

function makeLabel(start: string, end: string): string {
  if (!start || !end) return '';
  return `${new Date(start + 'T00:00:00').toLocaleDateString('pt-BR')} — ${new Date(end + 'T00:00:00').toLocaleDateString('pt-BR')}`;
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
  const s = start.toISOString().split('T')[0];
  const e = end.toISOString().split('T')[0];
  return { start: s, end: e, label: makeLabel(s, e) };
}

function getMonthPeriod(monthsOffset = 0): PeriodRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthsOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + monthsOffset + 1, 0);
  const s = start.toISOString().split('T')[0];
  const e = end.toISOString().split('T')[0];
  return { start: s, end: e, label: makeLabel(s, e) };
}

const PRESETS = [
  { value: 'porto_atual', label: 'Porto Atual (21–20)' },
  { value: 'porto_anterior', label: 'Porto Anterior (21–20)' },
  { value: 'mes_atual', label: 'Mês Atual' },
  { value: 'mes_anterior', label: 'Mês Anterior' },
  { value: 'ultimos_90', label: 'Últimos 90 dias' },
  { value: 'ano_atual', label: 'Ano Atual' },
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
      const s = start.toISOString().split('T')[0];
      const e = end.toISOString().split('T')[0];
      return { start: s, end: e, label: makeLabel(s, e) };
    }
    case 'ano_atual': {
      const s = `${now.getFullYear()}-01-01`;
      const e = `${now.getFullYear()}-12-31`;
      return { start: s, end: e, label: makeLabel(s, e) };
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
  const [startDate, setStartDate] = useState(value.start);
  const [endDate, setEndDate] = useState(value.end);

  // Sync when parent changes (e.g. preset selection)
  useEffect(() => {
    setStartDate(value.start);
    setEndDate(value.end);
  }, [value.start, value.end]);

  function handlePresetChange(val: string) {
    const range = resolvePreset(val);
    setStartDate(range.start);
    setEndDate(range.end);
    onChange(range);
  }

  function handleStartChange(newStart: string) {
    setStartDate(newStart);
    if (newStart && endDate) {
      onChange({ start: newStart, end: endDate, label: makeLabel(newStart, endDate) });
    }
  }

  function handleEndChange(newEnd: string) {
    setEndDate(newEnd);
    if (startDate && newEnd) {
      onChange({ start: startDate, end: newEnd, label: makeLabel(startDate, newEnd) });
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="w-3.5 h-3.5" />
        <span className="font-medium">Período:</span>
      </div>

      <Select onValueChange={handlePresetChange}>
        <SelectTrigger className="h-9 w-48 text-xs">
          <SelectValue placeholder="Atalho rápido" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map(p => (
            <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={startDate}
          onChange={e => handleStartChange(e.target.value)}
          className="h-9 text-xs w-[150px]"
        />
        <span className="text-xs text-muted-foreground font-medium">até</span>
        <Input
          type="date"
          value={endDate}
          onChange={e => handleEndChange(e.target.value)}
          className="h-9 text-xs w-[150px]"
        />
      </div>
    </div>
  );
}

export { getPortoPeriod, getMonthPeriod, resolvePreset };
