import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Download, Plus, Save, Activity, Target, ShieldAlert, BarChart3, Trash, Copy, GripVertical, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { readExcelRows, writeExcelFile } from '@/lib/excel';
import ExpandableChart from './ExpandableChart';
import { BarChart, Bar, LineChart, Line, AreaChart, ReferenceLine, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend, LabelList } from 'recharts';

interface N3Data {
  id?: string;
  nome_email: string;
  cargo?: string;
  letra?: string;
  periodo: string;
  total_verificacoes: number;
  total_treinamentos: number;
  total_assistencia: number;
  verificacoes_nc: number;
  verificacoes_s1?: number;
  verificacoes_s2?: number;
  verificacoes_s3?: number;
  verificacoes_s4?: number;
  verificacoes_nc_s1?: number;
  verificacoes_nc_s2?: number;
  verificacoes_nc_s3?: number;
  verificacoes_nc_s4?: number;
  perguntas_nc?: number;
}

const DEFAULT_NAMES = [
  { nome: 'CRISTALLY NETTO', letra: 'A Noite' },
  { nome: 'GABRIELE MONTARROYOS', letra: 'A Dia' },
  { nome: 'NAIARA SANTOS', letra: 'B Dia' },
  { nome: 'THIAGO GOMES', letra: 'B Noite' }
];

interface FuncItem { id: string; nome: string; cargo?: string; letra?: string; }
interface SortableRowProps {
  row: N3Data;
  idx: number;
  handleChange: (index: number, field: keyof N3Data, value: string) => void;
  handleRemoveRow: (idx: number) => void;
  badgeClass: string;
  pctNC: number;
  inputStyle: string;
  funcionariosList?: FuncItem[];
}

function SortableRow({ row, idx, handleChange, handleRemoveRow, badgeClass, pctNC, inputStyle, funcionariosList = [] }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id || `row-${idx}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative' as const, zIndex: 50, backgroundColor: 'var(--background)' } : {}),
  };

  const calculatedTotalVerif = (Number(row.verificacoes_s1) || 0) + (Number(row.verificacoes_s2) || 0) + (Number(row.verificacoes_s3) || 0) + (Number(row.verificacoes_s4) || 0);
  const totalVerifDisplay = (row.verificacoes_s1 !== undefined || row.verificacoes_s2 !== undefined || row.verificacoes_s3 !== undefined || row.verificacoes_s4 !== undefined)
    ? calculatedTotalVerif
    : (Number(row.total_verificacoes) || 0);

  const calculatedTotalNC = (Number(row.verificacoes_nc_s1) || 0) + (Number(row.verificacoes_nc_s2) || 0) + (Number(row.verificacoes_nc_s3) || 0) + (Number(row.verificacoes_nc_s4) || 0);
  const totalNCDisplay = (row.verificacoes_nc_s1 !== undefined || row.verificacoes_nc_s2 !== undefined || row.verificacoes_nc_s3 !== undefined || row.verificacoes_nc_s4 !== undefined)
    ? calculatedTotalNC
    : (Number(row.verificacoes_nc) || 0);

  return (
    <TableRow ref={setNodeRef} style={style} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-border/50 ${isDragging ? 'shadow-lg opacity-90' : ''}`}>
      <TableCell className="p-1.5 w-8 text-center">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hover:bg-slate-200 dark:hover:bg-slate-800 p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors inline-flex touch-none">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </TableCell>
      <TableCell className="p-1.5 min-w-[170px]">
        <select
          value={row.nome_email}
          onChange={(e) => handleChange(idx, 'nome_email', e.target.value)}
          className={`flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${inputStyle}`}
        >
          <option value="">Selecione o colaborador...</option>
          {funcionariosList.map((f: FuncItem) => (
            <option key={f.id} value={f.nome}>{f.nome}</option>
          ))}
          {!funcionariosList.find((f: FuncItem) => f.nome === row.nome_email) && row.nome_email && (
            <option value={row.nome_email}>{row.nome_email}</option>
          )}
        </select>
      </TableCell>
      <TableCell className="p-1.5">
        <Input 
          value={row.cargo || ''} 
          onChange={(e) => handleChange(idx, 'cargo', e.target.value)}
          className={`${inputStyle} h-8 text-xs`}
          placeholder="Cargo"
        />
      </TableCell>
      <TableCell className="p-1.5">
        <Input 
          value={row.letra || ''} 
          onChange={(e) => handleChange(idx, 'letra', e.target.value)}
          className={`${inputStyle} h-8 text-xs w-20 text-center font-semibold text-slate-700 dark:text-slate-300`}
          placeholder="Letra"
        />
      </TableCell>

      {/* ── VERIFICAÇÕES POR SEMANA (S1, S2, S3, S4, TOTAL) ── */}
      <TableCell className="p-1 bg-blue-50/20 dark:bg-blue-950/10">
        <Input 
          type="number" min="0" 
          value={row.verificacoes_s1 ?? ''} 
          onChange={(e) => handleChange(idx, 'verificacoes_s1', e.target.value)}
          className={`${inputStyle} h-8 text-xs w-12 text-center`}
          placeholder="0"
        />
      </TableCell>
      <TableCell className="p-1 bg-blue-50/20 dark:bg-blue-950/10">
        <Input 
          type="number" min="0" 
          value={row.verificacoes_s2 ?? ''} 
          onChange={(e) => handleChange(idx, 'verificacoes_s2', e.target.value)}
          className={`${inputStyle} h-8 text-xs w-12 text-center`}
          placeholder="0"
        />
      </TableCell>
      <TableCell className="p-1 bg-blue-50/20 dark:bg-blue-950/10">
        <Input 
          type="number" min="0" 
          value={row.verificacoes_s3 ?? ''} 
          onChange={(e) => handleChange(idx, 'verificacoes_s3', e.target.value)}
          className={`${inputStyle} h-8 text-xs w-12 text-center`}
          placeholder="0"
        />
      </TableCell>
      <TableCell className="p-1 bg-blue-50/20 dark:bg-blue-950/10">
        <Input 
          type="number" min="0" 
          value={row.verificacoes_s4 ?? ''} 
          onChange={(e) => handleChange(idx, 'verificacoes_s4', e.target.value)}
          className={`${inputStyle} h-8 text-xs w-12 text-center`}
          placeholder="0"
        />
      </TableCell>
      <TableCell className="p-1 text-center bg-blue-50/40 dark:bg-blue-950/20">
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-black text-blue-700 dark:text-blue-300 font-mono">
          {totalVerifDisplay}
        </span>
      </TableCell>

      {/* ── TREINAMENTOS & ASSISTÊNCIA ── */}
      <TableCell className="p-1.5">
        <Input 
          type="number" min="0" 
          value={row.total_treinamentos || ''} 
          onChange={(e) => handleChange(idx, 'total_treinamentos', e.target.value)}
          className={`${inputStyle} h-8 text-xs w-16 text-center`}
        />
      </TableCell>
      <TableCell className="p-1.5">
        <Input 
          type="number" min="0" 
          value={row.total_assistencia || ''} 
          onChange={(e) => handleChange(idx, 'total_assistencia', e.target.value)}
          className={`${inputStyle} h-8 text-xs w-16 text-center`}
        />
      </TableCell>

      {/* ── VERIFICAÇÕES NC POR SEMANA (S1, S2, S3, S4, TOTAL) ── */}
      <TableCell className="p-1 bg-rose-50/20 dark:bg-rose-950/10">
        <Input 
          type="number" min="0" 
          value={row.verificacoes_nc_s1 ?? ''} 
          onChange={(e) => handleChange(idx, 'verificacoes_nc_s1', e.target.value)}
          className={`${inputStyle} h-8 text-xs w-12 text-center text-rose-600 dark:text-rose-400 font-semibold`}
          placeholder="0"
        />
      </TableCell>
      <TableCell className="p-1 bg-rose-50/20 dark:bg-rose-950/10">
        <Input 
          type="number" min="0" 
          value={row.verificacoes_nc_s2 ?? ''} 
          onChange={(e) => handleChange(idx, 'verificacoes_nc_s2', e.target.value)}
          className={`${inputStyle} h-8 text-xs w-12 text-center text-rose-600 dark:text-rose-400 font-semibold`}
          placeholder="0"
        />
      </TableCell>
      <TableCell className="p-1 bg-rose-50/20 dark:bg-rose-950/10">
        <Input 
          type="number" min="0" 
          value={row.verificacoes_nc_s3 ?? ''} 
          onChange={(e) => handleChange(idx, 'verificacoes_nc_s3', e.target.value)}
          className={`${inputStyle} h-8 text-xs w-12 text-center text-rose-600 dark:text-rose-400 font-semibold`}
          placeholder="0"
        />
      </TableCell>
      <TableCell className="p-1 bg-rose-50/20 dark:bg-rose-950/10">
        <Input 
          type="number" min="0" 
          value={row.verificacoes_nc_s4 ?? ''} 
          onChange={(e) => handleChange(idx, 'verificacoes_nc_s4', e.target.value)}
          className={`${inputStyle} h-8 text-xs w-12 text-center text-rose-600 dark:text-rose-400 font-semibold`}
          placeholder="0"
        />
      </TableCell>
      <TableCell className="p-1 text-center bg-rose-50/40 dark:bg-rose-950/20">
        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold ${badgeClass}`}>
          {totalNCDisplay}
        </span>
      </TableCell>

      {/* ── % NC & AÇÕES ── */}
      <TableCell className="p-1.5 text-center">
        <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-extrabold ${badgeClass}`}>
          {pctNC}%
        </div>
      </TableCell>
      <TableCell className="p-1 text-center">
        <Button variant="ghost" size="icon" onClick={() => handleRemoveRow(idx)} className="h-7 w-7 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors">
          <Trash className="w-3.5 h-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface N3DashboardProps {
  globalPeriod?: { start: string; end: string; label: string; };
}

export default function N3Dashboard({ globalPeriod }: N3DashboardProps) {
  const getMeta = (cargo?: string) => {
    if (!cargo) return 40;
    const c = cargo.toLowerCase();
    if (c.includes('técnico de segurança')) return 45;
    if (c.includes('supervisor de campo')) return 20;
    if (c.includes('gerente')) return 10;
    return 40;
  };
  const [data, setData] = useState<N3Data[]>([]);
  const [historicalData, setHistoricalData] = useState<N3Data[]>([]);
  const [cargoMapState, setCargoMapState] = useState<Record<string, string>>({});
  const [periodo, setPeriodo] = useState<string>((globalPeriod as unknown as string) || new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState(false);

  const handleClearMonth = async () => {
    if (!confirm(`Tem certeza que deseja apagar todos os lançamentos do período ${periodo}?`)) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('n3_lancamentos').delete().eq('periodo', periodo);
      if (error) throw error;
      toast.success('Dados apagados com sucesso!');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao apagar dados');
    } finally {
      setDeleting(false);
    }
  };

  const handleSortByNC = () => {
    const sorted = [...data].sort((a: N3Data, b: N3Data) => {
      const ncA = (Number(a.verificacoes_nc_s1) || 0) + (Number(a.verificacoes_nc_s2) || 0) + (Number(a.verificacoes_nc_s3) || 0) + (Number(a.verificacoes_nc_s4) || 0) || Number(a.verificacoes_nc || 0);
      const ncB = (Number(b.verificacoes_nc_s1) || 0) + (Number(b.verificacoes_nc_s2) || 0) + (Number(b.verificacoes_nc_s3) || 0) + (Number(b.verificacoes_nc_s4) || 0) || Number(b.verificacoes_nc || 0);
      const diff = ncB - ncA;
      return diff !== 0 ? diff : (a.nome_email || '').localeCompare(b.nome_email || '');
    });
    setData(sorted);
    toast.success('Lista atualizada pelo ranking de Verificações NC!');
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: { active: { id: string }; over: { id: string } | null }) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setData((items) => {
        const oldIndex = items.findIndex((i) => (i.id || '') === active.id);
        const newIndex = items.findIndex((i) => (i.id || '') === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  const [funcionariosList, setFuncionariosList] = useState<FuncItem[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: emps } = await supabase.from('funcionarios').select('id, nome, cargo, letra').order('nome');
      setFuncionariosList(emps || []);
      
      const cargoMap = (emps || []).reduce((acc: Record<string, string>, e: FuncItem) => {
        if (e.nome) acc[e.nome.toUpperCase().trim()] = e.cargo || '';
        return acc;
      }, {});
      setCargoMapState(cargoMap);

      const { data: allData, error } = await supabase
        .from('n3_lancamentos')
        .select('*')
        .order('periodo', { ascending: true });

      if (error) {
        console.error('Erro ou tabela n3 não existe. Inicializando dados locais.');
        initMockData(cargoMap);
      } else {
        const allDataWithCargo = (allData || []).map((d: N3Data & { cargo?: string; nome_email: string }) => ({
          ...d,
          cargo: d.cargo || cargoMap[(d.nome_email || '').toUpperCase().trim()] || ''
        }));

        setHistoricalData(allDataWithCargo);
        
        let currentPeriodData = [];
        if (periodo === 'all') {
          const aggregated = allDataWithCargo.reduce((acc: Record<string, N3Data>, curr: N3Data) => {
            const key = curr.nome_email;
            if (!acc[key]) {
              acc[key] = {
                ...curr,
                id: key,
                periodo: 'all',
                total_verificacoes: 0,
                total_treinamentos: 0,
                total_assistencia: 0,
                verificacoes_nc: 0,
                verificacoes_s1: 0,
                verificacoes_s2: 0,
                verificacoes_s3: 0,
                verificacoes_s4: 0,
                verificacoes_nc_s1: 0,
                verificacoes_nc_s2: 0,
                verificacoes_nc_s3: 0,
                verificacoes_nc_s4: 0,
                perguntas_nc: 0
              };
            }
            acc[key].total_verificacoes += Number(curr.total_verificacoes || 0);
            acc[key].total_treinamentos += Number(curr.total_treinamentos || 0);
            acc[key].total_assistencia += Number(curr.total_assistencia || 0);
            acc[key].verificacoes_nc += Number(curr.verificacoes_nc || 0);
            acc[key].verificacoes_s1 = (acc[key].verificacoes_s1 || 0) + Number(curr.verificacoes_s1 || 0);
            acc[key].verificacoes_s2 = (acc[key].verificacoes_s2 || 0) + Number(curr.verificacoes_s2 || 0);
            acc[key].verificacoes_s3 = (acc[key].verificacoes_s3 || 0) + Number(curr.verificacoes_s3 || 0);
            acc[key].verificacoes_s4 = (acc[key].verificacoes_s4 || 0) + Number(curr.verificacoes_s4 || 0);
            acc[key].verificacoes_nc_s1 = (acc[key].verificacoes_nc_s1 || 0) + Number(curr.verificacoes_nc_s1 || 0);
            acc[key].verificacoes_nc_s2 = (acc[key].verificacoes_nc_s2 || 0) + Number(curr.verificacoes_nc_s2 || 0);
            acc[key].verificacoes_nc_s3 = (acc[key].verificacoes_nc_s3 || 0) + Number(curr.verificacoes_nc_s3 || 0);
            acc[key].verificacoes_nc_s4 = (acc[key].verificacoes_nc_s4 || 0) + Number(curr.verificacoes_nc_s4 || 0);
            return acc;
          }, {});
          currentPeriodData = Object.values(aggregated);
        } else {
          currentPeriodData = allDataWithCargo.filter((d: N3Data) => d.periodo === periodo);
        }

        if (currentPeriodData.length > 0) {
          const sorted = currentPeriodData.sort((a: N3Data, b: N3Data) => {
            const ncA = (Number(a.verificacoes_nc_s1) || 0) + (Number(a.verificacoes_nc_s2) || 0) + (Number(a.verificacoes_nc_s3) || 0) + (Number(a.verificacoes_nc_s4) || 0) || Number(a.verificacoes_nc || 0);
            const ncB = (Number(b.verificacoes_nc_s1) || 0) + (Number(b.verificacoes_nc_s2) || 0) + (Number(b.verificacoes_nc_s3) || 0) + (Number(b.verificacoes_nc_s4) || 0) || Number(b.verificacoes_nc || 0);
            const diff = ncB - ncA;
            return diff !== 0 ? diff : (a.nome_email || '').localeCompare(b.nome_email || '');
          });
          setData(sorted.map((d: N3Data) => ({ ...d, id: (d as { id?: string }).id || Math.random().toString(36).substring(2, 9) })));
        } else {
          setData([]);
        }
      }
    } catch (e) {
      initMockData();
    }
    setLoading(false);
  };

  const initMockData = (cargoMap: Record<string, string> = {}) => {
    setData(
      DEFAULT_NAMES.map(colab => ({
        id: Math.random().toString(36).substring(2, 9),
        nome_email: colab.nome,
        cargo: cargoMap[colab.nome.toUpperCase().trim()] || '',
        letra: colab.letra,
        periodo,
        total_verificacoes: 0,
        total_treinamentos: 0,
        total_assistencia: 0,
        verificacoes_nc: 0,
        verificacoes_s1: 0,
        verificacoes_s2: 0,
        verificacoes_s3: 0,
        verificacoes_s4: 0,
        verificacoes_nc_s1: 0,
        verificacoes_nc_s2: 0,
        verificacoes_nc_s3: 0,
        verificacoes_nc_s4: 0
      }))
    );
  };

  const handleChange = (index: number, field: keyof N3Data, value: string) => {
    const newData = [...data];
    if (field === 'nome_email' || field === 'letra' || field === 'cargo') {
      newData[index] = { ...newData[index], [field]: value };
      
      if (field === 'nome_email') {
        const func = funcionariosList.find((f: FuncItem) => f.nome === value);
        if (func) {
          if (!newData[index].cargo && func.cargo) newData[index].cargo = func.cargo;
          if (!newData[index].letra && func.letra) newData[index].letra = func.letra;
        }
      }
    } else {
      const numVal = Number(value) || 0;
      newData[index] = { ...newData[index], [field]: numVal };

      // Recalculate totals if weekly fields updated
      if (['verificacoes_s1', 'verificacoes_s2', 'verificacoes_s3', 'verificacoes_s4'].includes(field)) {
        const row = newData[index];
        row.total_verificacoes = (Number(row.verificacoes_s1) || 0) + (Number(row.verificacoes_s2) || 0) + (Number(row.verificacoes_s3) || 0) + (Number(row.verificacoes_s4) || 0);
      }

      if (['verificacoes_nc_s1', 'verificacoes_nc_s2', 'verificacoes_nc_s3', 'verificacoes_nc_s4'].includes(field)) {
        const row = newData[index];
        row.verificacoes_nc = (Number(row.verificacoes_nc_s1) || 0) + (Number(row.verificacoes_nc_s2) || 0) + (Number(row.verificacoes_nc_s3) || 0) + (Number(row.verificacoes_nc_s4) || 0);
      }
    }
    setData(newData);
  };

  const handleAddRow = () => {
    setData([...data, {
      id: Math.random().toString(36).substring(2, 9),
      nome_email: '',
      letra: '',
      periodo,
      total_verificacoes: 0,
      total_treinamentos: 0,
      total_assistencia: 0,
      verificacoes_nc: 0,
      verificacoes_s1: 0,
      verificacoes_s2: 0,
      verificacoes_s3: 0,
      verificacoes_s4: 0,
      verificacoes_nc_s1: 0,
      verificacoes_nc_s2: 0,
      verificacoes_nc_s3: 0,
      verificacoes_nc_s4: 0
    }]);
  };

  const handleRemoveRow = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('n3_lancamentos').delete().eq('periodo', periodo);
      
      const insertPayload = data.map(d => {
        const totVerif = (d.verificacoes_s1 !== undefined || d.verificacoes_s2 !== undefined || d.verificacoes_s3 !== undefined || d.verificacoes_s4 !== undefined)
          ? ((Number(d.verificacoes_s1) || 0) + (Number(d.verificacoes_s2) || 0) + (Number(d.verificacoes_s3) || 0) + (Number(d.verificacoes_s4) || 0))
          : (Number(d.total_verificacoes) || 0);

        const totNC = (d.verificacoes_nc_s1 !== undefined || d.verificacoes_nc_s2 !== undefined || d.verificacoes_nc_s3 !== undefined || d.verificacoes_nc_s4 !== undefined)
          ? ((Number(d.verificacoes_nc_s1) || 0) + (Number(d.verificacoes_nc_s2) || 0) + (Number(d.verificacoes_nc_s3) || 0) + (Number(d.verificacoes_nc_s4) || 0))
          : (Number(d.verificacoes_nc) || 0);

        return {
          nome_email: d.nome_email || 'SEM NOME',
          letra: d.letra || '',
          periodo: d.periodo,
          total_verificacoes: totVerif,
          total_treinamentos: d.total_treinamentos || 0,
          total_assistencia: d.total_assistencia || 0,
          verificacoes_nc: totNC,
          verificacoes_s1: d.verificacoes_s1 || 0,
          verificacoes_s2: d.verificacoes_s2 || 0,
          verificacoes_s3: d.verificacoes_s3 || 0,
          verificacoes_s4: d.verificacoes_s4 || 0,
          verificacoes_nc_s1: d.verificacoes_nc_s1 || 0,
          verificacoes_nc_s2: d.verificacoes_nc_s2 || 0,
          verificacoes_nc_s3: d.verificacoes_nc_s3 || 0,
          verificacoes_nc_s4: d.verificacoes_nc_s4 || 0,
        };
      });

      const { error } = await supabase.from('n3_lancamentos').insert(insertPayload);

      if (error) throw error;
      toast.success('Dados salvos com sucesso!');
      fetchData(); 
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Ocorreu um erro ao salvar: ' + msg);
    }
    setSaving(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const ab = await file.arrayBuffer();
      const rawData = await readExcelRows(ab);

      const importedData: N3Data[] = rawData.map((row: Record<string, unknown>) => {
        const nome = (row['NOME-EMAIL'] || row['Nome'] || '') as string;
        const vs1 = Number(row['VERIF S1'] || row['S1 Verificacoes'] || row['S1'] || 0);
        const vs2 = Number(row['VERIF S2'] || row['S2 Verificacoes'] || row['S2'] || 0);
        const vs3 = Number(row['VERIF S3'] || row['S3 Verificacoes'] || row['S3'] || 0);
        const vs4 = Number(row['VERIF S4'] || row['S4 Verificacoes'] || row['S4'] || 0);

        const ncs1 = Number(row['NC S1'] || row['S1 NC'] || 0);
        const ncs2 = Number(row['NC S2'] || row['S2 NC'] || 0);
        const ncs3 = Number(row['NC S3'] || row['S3 NC'] || 0);
        const ncs4 = Number(row['NC S4'] || row['S4 NC'] || 0);

        const totVerif = (vs1 + vs2 + vs3 + vs4) || Number(row['TOTAL VERIFICAÇÕES'] || row['Total Verificações'] || 0);
        const totNC = (ncs1 + ncs2 + ncs3 + ncs4) || Number(row['VERIFICAÇÕES NÃO CONFORMES'] || row['Verificações NC'] || 0);

        return {
          nome_email: nome,
          cargo: (row['CARGO'] || row['Cargo'] || cargoMapState[nome.toUpperCase().trim()] || '') as string,
          letra: (row['LETRA'] || row['Letra'] || '') as string,
          periodo: periodo,
          total_verificacoes: totVerif,
          total_treinamentos: Number(row['TOTAL TREINAMENTOS'] || row['Total Treinamentos'] || 0),
          total_assistencia: Number(row['TOTAL ASSISTÊNCIA'] || row['Total Assistência'] || 0),
          verificacoes_nc: totNC,
          verificacoes_s1: vs1,
          verificacoes_s2: vs2,
          verificacoes_s3: vs3,
          verificacoes_s4: vs4,
          verificacoes_nc_s1: ncs1,
          verificacoes_nc_s2: ncs2,
          verificacoes_nc_s3: ncs3,
          verificacoes_nc_s4: ncs4,
        };
      });

      if (importedData.length > 0) {
        setData(importedData);
        toast.success('Planilha importada! Clique em Postar para salvar.');
      } else {
        toast.error('Planilha vazia ou formato inválido.');
      }
    } catch (err) {
      toast.error('Erro ao ler a planilha.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = async () => {
    const templateData = [
      {
        'NOME-EMAIL': 'CRISTALLY NETTO',
        'LETRA': 'A Noite',
        'VERIF S1': 1,
        'VERIF S2': 0,
        'VERIF S3': 0,
        'VERIF S4': 0,
        'TOTAL TREINAMENTOS': 1,
        'TOTAL ASSISTÊNCIA': 0,
        'NC S1': 1,
        'NC S2': 0,
        'NC S3': 0,
        'NC S4': 0,
      }
    ];
    await writeExcelFile(templateData as Record<string, unknown>[], 'Modelo_Importacao_N3_Semanal.xlsx', 'N3_Template');
  };

  const filteredHistoricalData = useMemo(() => {
    if (!globalPeriod) return historicalData;
    const startMonth = globalPeriod.start.substring(0, 7);
    const endMonth = globalPeriod.end.substring(0, 7);
    return historicalData.filter(curr => curr.periodo >= startMonth && curr.periodo <= endMonth);
  }, [historicalData, globalPeriod]);

  const kpis = useMemo(() => {
    const totais = {
      verificacoes: 0,
      treinamentos: 0,
      assistencia: 0,
      ncs: 0
    };

    filteredHistoricalData.forEach(d => {
      const totVerif = (Number(d.verificacoes_s1) || 0) + (Number(d.verificacoes_s2) || 0) + (Number(d.verificacoes_s3) || 0) + (Number(d.verificacoes_s4) || 0) || Number(d.total_verificacoes || 0);
      const totNc = (Number(d.verificacoes_nc_s1) || 0) + (Number(d.verificacoes_nc_s2) || 0) + (Number(d.verificacoes_nc_s3) || 0) + (Number(d.verificacoes_nc_s4) || 0) || Number(d.verificacoes_nc || 0);
      totais.verificacoes += totVerif;
      totais.treinamentos += Number(d.total_treinamentos || 0);
      totais.assistencia += Number(d.total_assistencia || 0);
      totais.ncs += totNc;
    });

    const pctNc = totais.verificacoes > 0 ? ((totais.ncs / totais.verificacoes) * 100).toFixed(1) : '0.0';

    return { totais, pctNc };
  }, [filteredHistoricalData]);

  const chartData = useMemo(() => {
    const aggregated = filteredHistoricalData.reduce((acc, curr) => {
      const name = curr.nome_email.split(' ')[0] || 'Novo';
      if (!acc[name]) {
        acc[name] = { name, Verificações: 0, Treinamentos: 0, 'Não Conformes': 0 };
      }
      const totVerif = (Number(curr.verificacoes_s1) || 0) + (Number(curr.verificacoes_s2) || 0) + (Number(curr.verificacoes_s3) || 0) + (Number(curr.verificacoes_s4) || 0) || Number(curr.total_verificacoes || 0);
      const totNc = (Number(curr.verificacoes_nc_s1) || 0) + (Number(curr.verificacoes_nc_s2) || 0) + (Number(curr.verificacoes_nc_s3) || 0) + (Number(curr.verificacoes_nc_s4) || 0) || Number(curr.verificacoes_nc || 0);

      acc[name].Verificações += totVerif;
      acc[name].Treinamentos += Number(curr.total_treinamentos || 0);
      acc[name]['Não Conformes'] += totNc;
      return acc;
    }, {} as Record<string, { name: string; Verificações: number; Treinamentos: number; 'Não Conformes': number }>);
    return Object.values(aggregated).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredHistoricalData]);

  const evolutionChartData = useMemo(() => {
    const grouped = filteredHistoricalData.reduce((acc, curr) => {
      if (!acc[curr.periodo]) {
        acc[curr.periodo] = { periodo: curr.periodo, 'Total Verificações': 0, 'Total Treinamentos': 0, 'Total Não Conformes': 0 };
      }
      const totVerif = (Number(curr.verificacoes_s1) || 0) + (Number(curr.verificacoes_s2) || 0) + (Number(curr.verificacoes_s3) || 0) + (Number(curr.verificacoes_s4) || 0) || Number(curr.total_verificacoes || 0);
      const totNc = (Number(curr.verificacoes_nc_s1) || 0) + (Number(curr.verificacoes_nc_s2) || 0) + (Number(curr.verificacoes_nc_s3) || 0) + (Number(curr.verificacoes_nc_s4) || 0) || Number(curr.verificacoes_nc || 0);

      (acc[curr.periodo]['Total Verificações'] as number) += totVerif;
      (acc[curr.periodo]['Total Treinamentos'] as number) += Number(curr.total_treinamentos || 0);
      (acc[curr.periodo]['Total Não Conformes'] as number) += totNc;
      return acc;
    }, {} as Record<string, Record<string, number | string>>);
    return Object.values(grouped).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [filteredHistoricalData]);

  const uniqueNames = useMemo(() => {
    const names = new Set<string>();
    filteredHistoricalData.forEach(d => names.add(d.nome_email.split(' ')[0] || 'Novo'));
    return Array.from(names).sort();
  }, [filteredHistoricalData]);

  const evolutionByPersonData = useMemo(() => {
    const grouped = filteredHistoricalData.reduce((acc, curr) => {
      if (!acc[curr.periodo]) {
        acc[curr.periodo] = { periodo: curr.periodo };
        uniqueNames.forEach(name => {
          acc[curr.periodo][name] = 0;
        });
      }
      const name = curr.nome_email.split(' ')[0] || 'Novo';
      const totNc = (Number(curr.verificacoes_nc_s1) || 0) + (Number(curr.verificacoes_nc_s2) || 0) + (Number(curr.verificacoes_nc_s3) || 0) + (Number(curr.verificacoes_nc_s4) || 0) || Number(curr.verificacoes_nc || 0);
      (acc[curr.periodo][name] as number) += totNc;
      return acc;
    }, {} as Record<string, Record<string, number | string>>);
    return Object.values(grouped).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [filteredHistoricalData, uniqueNames]);
  
  const colors = [
    '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#f97316', '#06b6d4', '#ef4444', '#84cc16'
  ];

  return (
    <div className="space-y-6">
      {/* KPIs Top Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-800/50 shadow-lg shadow-blue-500/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardContent className="p-5 flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Verificações</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{kpis.totais.verificacoes}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 flex items-center justify-center border border-blue-200/50 dark:border-blue-700/50 shadow-inner group-hover:rotate-6 transition-transform duration-300">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400 drop-shadow-sm" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-800/50 shadow-lg shadow-indigo-500/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardContent className="p-5 flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Treinamentos</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{kpis.totais.treinamentos}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-700/50 shadow-inner group-hover:rotate-6 transition-transform duration-300">
              <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400 drop-shadow-sm" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-800/50 shadow-lg shadow-rose-500/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardContent className="p-5 flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Não Conformidades</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{kpis.totais.ncs}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/50 dark:to-rose-800/30 flex items-center justify-center border border-rose-200/50 dark:border-rose-700/50 shadow-inner group-hover:rotate-6 transition-transform duration-300">
              <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 drop-shadow-sm" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-800/50 shadow-lg shadow-amber-500/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardContent className="p-5 flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Taxa de NC Global</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{kpis.pctNc}%</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 flex items-center justify-center border border-amber-200/50 dark:border-amber-700/50 shadow-inner group-hover:rotate-6 transition-transform duration-300">
              <BarChart3 className="w-6 h-6 text-amber-600 dark:text-amber-400 drop-shadow-sm" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-4 gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-xl">Lançamentos N3 - CRM</CardTitle>
                  <CardDescription>Controle semanal (S1, S2, S3, S4) por colaborador</CardDescription>
                </div>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger className="w-[160px] bg-background">
                    <SelectValue placeholder="Selecione o Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                    ].map((m, i) => {
                      const val = '2026-' + (i + 1).toString().padStart(2, '0');
                      return <SelectItem key={val} value={val}>{m} 2026</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm">
                      <MoreHorizontal className="w-4 h-4" /> Opções
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleDownloadTemplate} className="gap-2 text-xs cursor-pointer">
                      <Download className="w-4 h-4" /> Baixar Modelo Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2 text-xs cursor-pointer">
                      <Upload className="w-4 h-4" /> Importar Planilha
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSortByNC} className="gap-2 text-xs cursor-pointer">
                      <BarChart3 className="w-4 h-4" /> Ordenar por Maior NC
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleClearMonth} disabled={deleting} className="gap-2 text-xs text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer">
                      <Trash className="w-4 h-4" /> {deleting ? 'Limpando...' : 'Limpar Mês'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={handleAddRow} size="sm" variant="outline" className="gap-1 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm text-xs h-8">
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </Button>
                
                <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 border-0 rounded-lg transition-all hover:scale-[1.02] text-xs h-8 px-4">
                  <Save className="w-3.5 h-3.5" /> {saving ? 'Postando...' : 'Postar'}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-100/80 dark:bg-slate-900/80">
                      <TableRow className="border-b border-slate-200 dark:border-slate-800">
                        <TableHead rowSpan={2} className="w-8 p-1 text-center"></TableHead>
                        <TableHead rowSpan={2} className="min-w-[170px] p-2 font-bold text-slate-700 dark:text-slate-300">NOME</TableHead>
                        <TableHead rowSpan={2} className="p-2 font-bold text-slate-700 dark:text-slate-300">CARGO</TableHead>
                        <TableHead rowSpan={2} className="p-2 font-bold text-slate-700 dark:text-slate-300 text-center">LETRA</TableHead>
                        
                        {/* Grupo: VERIFICAÇÕES */}
                        <TableHead colSpan={5} className="p-1.5 text-center font-black text-blue-700 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-950/40 border-x border-blue-200 dark:border-blue-800/40 uppercase tracking-wider text-[11px]">
                          VERIFICAÇÕES POR SEMANA
                        </TableHead>

                        <TableHead rowSpan={2} className="p-2 font-bold text-slate-700 dark:text-slate-300 text-center">T. TREINAMENTOS</TableHead>
                        <TableHead rowSpan={2} className="p-2 font-bold text-slate-700 dark:text-slate-300 text-center">T. ASSISTÊNCIA</TableHead>

                        {/* Grupo: VERIFICAÇÕES NC */}
                        <TableHead colSpan={5} className="p-1.5 text-center font-black text-rose-700 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-950/40 border-x border-rose-200 dark:border-rose-800/40 uppercase tracking-wider text-[11px]">
                          VERIFICAÇÕES NC POR SEMANA
                        </TableHead>

                        <TableHead rowSpan={2} className="p-2 font-bold text-slate-700 dark:text-slate-300 text-center">% NC</TableHead>
                        <TableHead rowSpan={2} className="w-8 p-1 text-center"></TableHead>
                      </TableRow>

                      <TableRow className="border-b border-slate-200 dark:border-slate-800">
                        {/* Sub-colunas Verificações */}
                        <TableHead className="p-1 text-center font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20">S1</TableHead>
                        <TableHead className="p-1 text-center font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20">S2</TableHead>
                        <TableHead className="p-1 text-center font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20">S3</TableHead>
                        <TableHead className="p-1 text-center font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20">S4</TableHead>
                        <TableHead className="p-1 text-center font-black text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 border-r border-blue-200 dark:border-blue-800">TOTAL</TableHead>

                        {/* Sub-colunas Verificações NC */}
                        <TableHead className="p-1 text-center font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20">S1</TableHead>
                        <TableHead className="p-1 text-center font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20">S2</TableHead>
                        <TableHead className="p-1 text-center font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20">S3</TableHead>
                        <TableHead className="p-1 text-center font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20">S4</TableHead>
                        <TableHead className="p-1 text-center font-black text-rose-800 dark:text-rose-200 bg-rose-100 dark:bg-rose-900/40 border-r border-rose-200 dark:border-rose-800">TOTAL</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      <SortableContext items={data.map(d => d.id || '')} strategy={verticalListSortingStrategy}>
                        {data.map((row, idx) => {
                          const meta = getMeta(row.cargo);

                          const totVerif = (Number(row.verificacoes_s1) || 0) + (Number(row.verificacoes_s2) || 0) + (Number(row.verificacoes_s3) || 0) + (Number(row.verificacoes_s4) || 0) || Number(row.total_verificacoes || 0);
                          const totNC = (Number(row.verificacoes_nc_s1) || 0) + (Number(row.verificacoes_nc_s2) || 0) + (Number(row.verificacoes_nc_s3) || 0) + (Number(row.verificacoes_nc_s4) || 0) || Number(row.verificacoes_nc || 0);

                          const maxScore = meta * 2;
                          const validTot = Math.min(totVerif, meta);
                          const validNc = Math.min(totNC, meta);
                          const pctNC = Number((((validTot + validNc) / maxScore) * 100).toFixed(0));
                          
                          const isCritical = Number(pctNC) < 70;
                          const isWarning = Number(pctNC) >= 70 && Number(pctNC) < 100;
                          const badgeClass = isCritical ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : isWarning ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
                          
                          const inputStyle = "h-8 font-medium bg-muted/30 border-transparent hover:border-border focus:bg-background focus:border-primary rounded-lg transition-all text-xs";
                          
                          return (
                            <SortableRow 
                              key={row.id || `row-${idx}`} 
                              row={row} 
                              idx={idx} 
                              handleChange={handleChange} 
                              handleRemoveRow={handleRemoveRow} 
                              badgeClass={badgeClass} 
                              pctNC={pctNC} 
                              inputStyle={inputStyle} 
                              funcionariosList={funcionariosList}
                            />
                          );
                        })}
                      </SortableContext>

                      {/* ── ROW TOTAL GERAL NO RODAPÉ ── */}
                      {(() => {
                        if (data.length === 0) return null;

                        const totals = data.reduce((acc, curr) => {
                          const vs1 = Number(curr.verificacoes_s1) || 0;
                          const vs2 = Number(curr.verificacoes_s2) || 0;
                          const vs3 = Number(curr.verificacoes_s3) || 0;
                          const vs4 = Number(curr.verificacoes_s4) || 0;
                          const totV = (vs1 + vs2 + vs3 + vs4) || Number(curr.total_verificacoes || 0);

                          const ncs1 = Number(curr.verificacoes_nc_s1) || 0;
                          const ncs2 = Number(curr.verificacoes_nc_s2) || 0;
                          const ncs3 = Number(curr.verificacoes_nc_s3) || 0;
                          const ncs4 = Number(curr.verificacoes_nc_s4) || 0;
                          const totN = (ncs1 + ncs2 + ncs3 + ncs4) || Number(curr.verificacoes_nc || 0);

                          return {
                            vs1: acc.vs1 + vs1,
                            vs2: acc.vs2 + vs2,
                            vs3: acc.vs3 + vs3,
                            vs4: acc.vs4 + vs4,
                            totalVerif: acc.totalVerif + totV,

                            treinamentos: acc.treinamentos + Number(curr.total_treinamentos || 0),
                            assistencia: acc.assistencia + Number(curr.total_assistencia || 0),

                            ncs1: acc.ncs1 + ncs1,
                            ncs2: acc.ncs2 + ncs2,
                            ncs3: acc.ncs3 + ncs3,
                            ncs4: acc.ncs4 + ncs4,
                            totalNC: acc.totalNC + totN,
                          };
                        }, { vs1: 0, vs2: 0, vs3: 0, vs4: 0, totalVerif: 0, treinamentos: 0, assistencia: 0, ncs1: 0, ncs2: 0, ncs3: 0, ncs4: 0, totalNC: 0 });

                        const pctNcGlobal = totals.totalVerif > 0 ? ((totals.totalNC / totals.totalVerif) * 100).toFixed(1) : "0.0";
                        const totalsBadgeClass = Number(pctNcGlobal) < 50 ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : Number(pctNcGlobal) < 80 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
                        
                        return (
                          <TableRow className="bg-slate-100/90 dark:bg-slate-800/80 font-bold hover:bg-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                            <TableCell colSpan={4} className="text-right p-3 font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider text-xs">
                              TOTAL GERAL:
                            </TableCell>

                            {/* Totais Verificações por semana */}
                            <TableCell className="text-center p-2 font-mono text-blue-700 dark:text-blue-300 font-extrabold">{totals.vs1}</TableCell>
                            <TableCell className="text-center p-2 font-mono text-blue-700 dark:text-blue-300 font-extrabold">{totals.vs2}</TableCell>
                            <TableCell className="text-center p-2 font-mono text-blue-700 dark:text-blue-300 font-extrabold">{totals.vs3}</TableCell>
                            <TableCell className="text-center p-2 font-mono text-blue-700 dark:text-blue-300 font-extrabold">{totals.vs4}</TableCell>
                            <TableCell className="text-center p-2 font-mono bg-blue-200/50 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 font-black">
                              {totals.totalVerif}
                            </TableCell>

                            {/* Totais Treinamentos & Assistência */}
                            <TableCell className="text-center p-2 font-mono">{totals.treinamentos}</TableCell>
                            <TableCell className="text-center p-2 font-mono">{totals.assistencia}</TableCell>

                            {/* Totais NC por semana */}
                            <TableCell className="text-center p-2 font-mono text-rose-700 dark:text-rose-300 font-extrabold">{totals.ncs1}</TableCell>
                            <TableCell className="text-center p-2 font-mono text-rose-700 dark:text-rose-300 font-extrabold">{totals.ncs2}</TableCell>
                            <TableCell className="text-center p-2 font-mono text-rose-700 dark:text-rose-300 font-extrabold">{totals.ncs3}</TableCell>
                            <TableCell className="text-center p-2 font-mono text-rose-700 dark:text-rose-300 font-extrabold">{totals.ncs4}</TableCell>
                            <TableCell className="text-center p-2 font-mono bg-rose-200/50 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 font-black">
                              {totals.totalNC}
                            </TableCell>

                            {/* Total % NC */}
                            <TableCell className="text-center p-2">
                              <div className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-black ${totalsBadgeClass}`}>
                                {pctNcGlobal}%
                              </div>
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </DndContext>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <ExpandableChart title="Engajamento por Colaborador" description="Volume de entregas no período">
          <div className="h-[240px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Verificações" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Verificações" position="top" fill="hsl(var(--primary))" fontSize={11} fontWeight="bold" />
                  </Bar>
                  
                  <Bar dataKey="Não Conformes" fill="#ef4444" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Não Conformes" position="top" fill="#ef4444" fontSize={11} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Sem dados para o gráfico
              </div>
            )}
          </div>
        </ExpandableChart>

        <ExpandableChart title="Evolução Geral do Contrato" description="Crescimento de Verificações e Não Conformes">
          <div className="h-[240px] w-full">
            {evolutionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionChartData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVerif" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTrein" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="periodo" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <ReferenceLine y={140} ifOverflow="extendDomain" stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Meta N3 (140)', fill: '#ef4444', fontSize: 12, fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="Total Verificações" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVerif)">
                    <LabelList dataKey="Total Verificações" position="top" fill="#3b82f6" fontSize={11} fontWeight="bold" />
                  </Area>
                  <Area type="monotone" dataKey="Total Não Conformes" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorNC)">
                    <LabelList dataKey="Total Não Conformes" position="bottom" fill="#ef4444" fontSize={11} fontWeight="bold" />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados históricos</div>
            )}
          </div>
        </ExpandableChart>

        <ExpandableChart title="Evolução por Colaborador" description="Não Conformes ao longo do tempo">
          <div className="h-[240px] w-full">
            {evolutionByPersonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionByPersonData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="periodo" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <RechartsTooltip cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <ReferenceLine y={45} ifOverflow="extendDomain" stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Meta N3 (45)', fill: '#ef4444', fontSize: 12, fontWeight: 'bold' }} />
                  {uniqueNames.map((name, idx) => (
                    <Line key={name} type="monotone" dataKey={name} stroke={colors[idx % colors.length]} strokeWidth={2} dot={{ r: 4 }}>
                      <LabelList dataKey={name} position="top" fill={colors[idx % colors.length]} fontSize={11} fontWeight="bold" />
                    </Line>
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados históricos</div>
            )}
          </div>
        </ExpandableChart>
      </div>
    </div>
  );
}
