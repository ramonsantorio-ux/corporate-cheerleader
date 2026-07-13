import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, ReferenceLine, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LabelList } from 'recharts';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, TrendingDown, ArrowUpRight, ArrowDownRight, Trophy, AlertOctagon, CalendarCheck, CalendarX, Download } from 'lucide-react';
import { ExpandableChart } from '@/components/ui/ExpandableChart';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Edit2, Save, X, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';


const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];




// Helpers
const getStatusColor = (status: string) => {
  if (status.includes('Muito Acima')) return 'bg-blue-500 text-white border-blue-600 shadow-blue-500/20';
  if (status.includes('Acima')) return 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20';
  if (status.includes('Dentro Esperado') || status.includes('Aceitável')) return 'bg-amber-400 text-amber-950 border-amber-500 shadow-amber-400/20';
  if (status.includes('Muito Abaixo')) return 'bg-rose-600 text-white border-rose-700 shadow-rose-600/20';
  if (status.includes('Abaixo')) return 'bg-rose-400 text-white border-rose-500 shadow-rose-400/20';
  return 'bg-slate-200 text-slate-800 border-slate-300';
};

const getStatusIcon = (status: string) => {
  if (status.includes('Muito Acima')) return <ArrowUpRight className="w-3.5 h-3.5 mr-1" />;
  if (status.includes('Acima')) return <TrendingUp className="w-3.5 h-3.5 mr-1" />;
  if (status.includes('Dentro Esperado') || status.includes('Aceitável')) return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
  if (status.includes('Muito Abaixo')) return <ArrowDownRight className="w-3.5 h-3.5 mr-1" />;
  if (status.includes('Abaixo')) return <TrendingDown className="w-3.5 h-3.5 mr-1" />;
  return <Target className="w-3.5 h-3.5 mr-1" />;
};

const getRowColor = (status: string) => {
  if (status.includes('Abaixo')) return 'bg-rose-50/30 hover:bg-rose-50/60 dark:bg-rose-950/10 dark:hover:bg-rose-950/20';
  if (status.includes('Acima')) return 'bg-emerald-50/30 hover:bg-emerald-50/60 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20';
  return 'hover:bg-muted/50';
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-lg shadow-xl text-xs z-50">
        <p className="font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold" style={{ color: entry.color || entry.fill }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function MetasPorto() {

  const [dbData, setDbData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, {meta: string, categoria: string, ref: string, alcBruto: string, alcPeso: string, status: string}>>({});
  const [editOrder, setEditOrder] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isEditingGlobal, setIsEditingGlobal] = useState(false);
  const [editGlobalScore, setEditGlobalScore] = useState("");
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);

  const handleAddMetric = async () => {
    const nome = window.prompt('Nome da nova métrica (ex: ISO 9001):');
    if (!nome) return;
    try {
      setIsSaving(true);
      const { error } = await supabase.from('indicadores_metas').insert({
        indicador: nome,
        setor: 'Porto',
        mes: selectedMonth,
        ano: selectedYear,
        referencia: 0,
        alcancado: 0
      });
      if (error) throw error;
      toast.success('Métrica adicionada com sucesso!');
      fetchMetas();
    } catch (err: any) {
      toast.error('Erro ao adicionar métrica: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMetric = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta métrica?')) return;
    try {
      setIsSaving(true);
      const { error } = await supabase.from('indicadores_metas').delete().eq('id', id);
      if (error) throw error;
      toast.success('Métrica excluída!');
      fetchMetas();
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  async function fetchMetas() {
    try {
      const { data, error } = await supabase
        .from('indicadores_metas')
        .select('*')
        .eq('setor', 'Porto')
        .eq('ano', selectedYear)
        .order('indicador', { ascending: true });
        
      if (error) throw error;
      setDbData(data || []);
    } catch (err) {
      console.error('Erro ao buscar metas:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleEditAll = () => {
    const values: Record<string, {meta: string, categoria: string, ref: string, alcBruto: string, alcPeso: string, status: string}> = {};
    const order: string[] = [];
    data.metas.forEach((m: any) => {
      values[m.id] = { meta: m.meta, categoria: m.categoria, ref: m.ref.toString(), alcBruto: m.alcBruto, alcPeso: m.alc.toString(), status: m.status };
      order.push(m.id);
    });
    setEditValues(values);
    setEditOrder(order);
    setIsEditing(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...editOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setEditOrder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === editOrder.length - 1) return;
    const newOrder = [...editOrder];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setEditOrder(newOrder);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updates = editOrder.filter(id => !id.startsWith('default-')).map((id, index) => ({
        id,
        indicador: `${editValues[id].meta}|${editValues[id].status}|${editValues[id].categoria}|${editValues[id].alcBruto}|${index}`,
        referencia: parseFloat(editValues[id].ref.replace(',', '.')),
        alcancado: parseFloat(editValues[id].alcPeso.replace(',', '.'))
      }));
      
      const inserts = editOrder.filter(id => id.startsWith('default-')).map((id, index) => ({
        indicador: `${editValues[id].meta}|${editValues[id].status}|${editValues[id].categoria}|${editValues[id].alcBruto}|${index}`,
        setor: 'Porto',
        mes: selectedMonth,
        ano: selectedYear,
        referencia: parseFloat(editValues[id].ref.replace(',', '.')),
        alcancado: parseFloat(editValues[id].alcPeso.replace(',', '.'))
      }));

      await Promise.all([
        ...updates.map(u => supabase.from('indicadores_metas').update({
          indicador: u.indicador,
          referencia: u.referencia,
          alcancado: u.alcancado
        }).eq('id', u.id)),
        ...(inserts.length > 0 ? [supabase.from('indicadores_metas').insert(inserts)] : [])
      ]);

      toast.success('Metas atualizadas!');
      setIsEditing(false);
      await fetchMetas();
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGlobalScore = async () => {
    setIsSavingGlobal(true);
    const scoreVal = parseFloat(editGlobalScore.replace(',', '.'));
    
    try {
      if (data.globalId) {
        await supabase.from('indicadores_metas').update({ alcancado: scoreVal }).eq('id', data.globalId);
      } else {
        await supabase.from('indicadores_metas').insert({
          indicador: '__ATINGIMENTO_GLOBAL__',
          setor: 'Porto',
          mes: selectedMonth,
          ano: selectedYear,
          referencia: 100,
          alcancado: scoreVal
        });
      }
      toast.success('Atingimento Global atualizado!');
      setIsEditingGlobal(false);
      await fetchMetas();
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  useEffect(() => { fetchMetas(); }, [selectedYear]);

  const METAS_DATA = useMemo(() => {
    const defaultMetasTemplate = [
      { meta: 'Aderência à Programação', categoria: 'Aderência', ref: 30, alcBruto: '', alc: 0, status: 'Dentro Esperado (Aceitável)', score: 90 },
      { meta: 'Eventos c/ ou s/ perda', categoria: 'Segurança', ref: 10, alcBruto: '', alc: 0, status: 'Dentro Esperado (Aceitável)', score: 90 },
      { meta: 'Custo Manutenção', categoria: 'Custo', ref: 10, alcBruto: '', alc: 0, status: 'Dentro Esperado (Aceitável)', score: 90 },
      { meta: 'Atendimento Eventuais (%)', categoria: 'Programação', ref: 20, alcBruto: '', alc: 0, status: 'Dentro Esperado (Aceitável)', score: 90 },
      { meta: 'Atendimento Programação Preventivas (%)', categoria: 'Manutenção', ref: 5, alcBruto: '', alc: 0, status: 'Dentro Esperado (Aceitável)', score: 90 },
      { meta: 'ISO 9001', categoria: 'Qualidade', ref: 20, alcBruto: '', alc: 0, status: 'Dentro Esperado (Aceitável)', score: 90 },
      { meta: 'Turnover', categoria: 'RH', ref: 5, alcBruto: '', alc: 0, status: 'Dentro Esperado (Aceitável)', score: 90 }
    ];

    const result: any = {};
    MESES.forEach(m => { 
      result[m] = { 
        atingido: 0, globalId: null, gap: 100, counts: { acima: 0, aceitavel: 0, abaixo: 0 }, 
        metas: defaultMetasTemplate.map((dm, idx) => ({ ...dm, id: `default-${m}-${idx}`, setor: 'Porto', ordem: idx })) 
      }; 
    });
    
    if (!dbData || dbData.length === 0) return result;

    const grouped = dbData.reduce((acc: any, row: any) => {
      if (!acc[row.mes]) acc[row.mes] = [];
      acc[row.mes].push(row);
      return acc;
    }, {});

    Object.keys(grouped).forEach(m => {
      const metasMes = grouped[m];
      const counts = { acima: 0, aceitavel: 0, abaixo: 0 };
      
      let globalScore = 0;
      let globalId = null;

      const metasFormatadas = metasMes.filter((row: any) => {
        if (row.indicador === '__ATINGIMENTO_GLOBAL__') {
          globalScore = row.alcancado || 0;
          globalId = row.id;
          return false;
        }
        return true;
      }).map((row: any) => {
        const rawInd = row.indicador || '';
        const parts = rawInd.split('|');
        const metaName = parts[0].trim();
        const ind = metaName.toLowerCase();
        const dbStatus = parts[1] ? parts[1].trim() : 'Dentro Esperado (Aceitável)';

        const rawCat = parts[2] ? parts[2].trim() : '';
        let guessedCategoria = (rawCat && isNaN(Number(rawCat))) ? rawCat : '';
        if (!guessedCategoria) {
          if (ind.includes('aderência')) guessedCategoria = 'Aderência';
          else if (ind.includes('eventuais')) guessedCategoria = 'Outros';
          else if (ind.includes('preventivas')) guessedCategoria = 'Manutenção';
          else if (ind.includes('eventos')) guessedCategoria = 'Segurança';
          else if (ind.includes('custo')) guessedCategoria = 'Custo';
          else if (ind.includes('turnover')) guessedCategoria = 'RH';
        }

        const dbAlcBruto = parts[3] ? parts[3].trim() : '';
        const dbOrdem = parts[4] ? parseInt(parts[4].trim(), 10) : 999;

        const alc = row.alcancado || 0;
        const ref = row.referencia || 1;
        
        let status = dbStatus;
        
        if (status === 'Muito Acima do Esperado' || status === 'Acima do Esperado') counts.acima++;
        else if (status === 'Dentro Esperado (Aceitável)') counts.aceitavel++;
        else counts.abaixo++;

        return {
          id: row.id, setor: row.setor,
          meta: metaName,
          categoria: guessedCategoria,
          ref: ref,
          alcBruto: dbAlcBruto,
          alc: alc,
          status: status,
          ordem: isNaN(dbOrdem) ? 999 : dbOrdem
        };
      });

      const METAS_ORDER = [
        'aderência',
        'eventos',
        'custo',
        'eventuais',
        'preventiva',
        'iso 9001',
        'turnover'
      ];

      metasFormatadas.sort((a: any, b: any) => {
        const indexA = METAS_ORDER.findIndex(m => a.meta.toLowerCase().includes(m));
        const indexB = METAS_ORDER.findIndex(m => b.meta.toLowerCase().includes(m));
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        if (a.ordem !== b.ordem) return a.ordem - b.ordem;
        return a.meta.localeCompare(b.meta);
      });

      result[m] = {
        atingido: globalScore,
        globalId: globalId,
        gap: 100 - globalScore,
        counts: counts,
        metas: metasFormatadas
      };
    });

    return result;
  }, [dbData]);

  const meses = MESES;

  const [selectedMonth, setSelectedMonth] = useState<string>('Maio');
    const dashboardRef = useRef<HTMLDivElement>(null);

  const data = METAS_DATA[selectedMonth as keyof typeof METAS_DATA];
  const batidas = data.counts.acima + data.counts.aceitavel;
  const perdidas = data.counts.abaixo;
  const totalMetas = batidas + perdidas;

  const { totalAderencia, monthsWithData } = useMemo(() => {
    return meses.reduce((acc, m) => {
      const atingido = METAS_DATA[m as keyof typeof METAS_DATA].atingido;
      if (atingido > 0) {
        acc.totalAderencia += atingido;
        acc.monthsWithData += 1;
      }
      return acc;
    }, { totalAderencia: 0, monthsWithData: 0 });
  }, [meses, METAS_DATA]);

  const aderenciaAnual = monthsWithData > 0 ? (totalAderencia / monthsWithData) : 0;

  // Radar Data: Normalizamos Alcançado vs Referência
  const radarData = useMemo(() => {
    return data.metas.map(m => {
      const reachedPct = m.ref === 0 ? (m.alc === 0 ? 100 : 0) : Math.min((m.alc / m.ref) * 100, 150);
      return {
        subject: m.meta.replace(/ \(\%\)/g, '').substring(0, 15) + '...',
        fullSubject: m.meta,
        Atingido: reachedPct,
        Referencia: 100,
        originalAlc: m.alc,
        originalRef: m.ref
      };
    });
  }, [data]);

  // Ofensores/Impulsionadores Data
  const varianceData = useMemo(() => {
    return data.metas.map(m => {
      let variance = 0;
      if (m.meta.includes('Interdições')) {
        // Special case for interdições (less is better, 100% means 0 interdições)
        variance = m.alc - m.ref;
      } else {
        variance = m.alc - m.ref; 
      }
      
      return {
        name: m.meta.replace(/ \(\%\)/g, '').substring(0, 12) + '...',
        fullName: m.meta,
        variance: variance,
        isPositive: variance >= 0
      };
    }).sort((a, b) => b.variance - a.variance);
  }, [data]);

  // Evolution Data for AreaChart
  const evolutionData = useMemo(() => {
    return meses.map(m => ({
      month: m.substring(0, 3),
      atingido: METAS_DATA[m as keyof typeof METAS_DATA].atingido,
      meta: 100
    }));
  }, [meses, METAS_DATA]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse flex flex-col items-center gap-2"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div><div>Carregando metas do banco de dados...</div></div>;
  }
  
  return (
    <div className="space-y-6 bg-background rounded-xl mt-4" ref={dashboardRef}>
      {/* 1. Timeline Semafórica do Ano */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider">Evolução 2026 - Porto</h2>
            <p className="text-xs text-muted-foreground">Desempenho Geral por Mês</p>
          </div>
        </div>
        
        <div className="flex flex-1 justify-end items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {meses.map(m => {
              const atingido = METAS_DATA[m as keyof typeof METAS_DATA].atingido;
              const isGood = atingido >= 70; // Threshold para metas porto
              const isSelected = selectedMonth === m;
              return (
                <button 
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`flex flex-col items-center min-w-[60px] p-2 rounded-lg transition-all border ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent hover:bg-muted'}`}
                >
                  <span className={`text-[10px] font-bold uppercase mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>{m.substring(0, 3)}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isGood ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-rose-500/10 border-rose-500 text-rose-600'}`}>
                    {isGood ? <CalendarCheck className="w-4 h-4" /> : <CalendarX className="w-4 h-4" />}
                  </div>
                  <span className="text-[9px] font-bold mt-1 text-foreground">{atingido.toFixed(0)}%</span>
                </button>
              );
            })}
          </div>
          
        </div>
      </div>

      {/* 2. Placares Gigantes de Win/Loss e Resumo Global */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        <Card className="md:col-span-3 border-none bg-gradient-to-br from-indigo-500/10 to-purple-500/10 shadow-sm relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
          <div className="absolute -right-4 -top-4 text-indigo-500/10">
            <Target className="w-24 h-24" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Consolidado Anual</p>
            </div>
            
            <div className="flex items-baseline gap-2">
              <p className="text-6xl font-black text-indigo-600 dark:text-indigo-400">{aderenciaAnual.toFixed(1).replace('.', ',')}%</p>
            </div>

            <div className="w-full bg-indigo-500/20 h-2.5 mt-6 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${Math.min(aderenciaAnual, 100)}%` }} 
                transition={{ duration: 1.5, type: "spring" }}
                className="h-full bg-indigo-500 rounded-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full skew-x-[-20deg] animate-[shimmer_2s_infinite]" />
              </motion.div>
            </div>
            <p className="text-xs font-medium text-indigo-600/70 dark:text-indigo-400/70 mt-3 flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Meta de 100% (Média YTD)
            </p>
          </CardContent>
        </Card>

        {/* Painel Global */}
        <Card className="md:col-span-3 border-none bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Consolidado Mensal ({selectedMonth})</p>
              {!isEditingGlobal ? (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10 -mt-1 -mr-1" onClick={() => { setEditGlobalScore(data.atingido.toString()); setIsEditingGlobal(true); }}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              ) : null}
            </div>
            
            {!isEditingGlobal ? (
              <div className="flex items-baseline gap-2">
                <p className="text-6xl font-black text-primary">{data.atingido.toFixed(1).replace('.', ',')}%</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <Input type="number" step="0.1" className="w-20 h-10 text-xl font-bold px-2" value={editGlobalScore} onChange={e => setEditGlobalScore(e.target.value)} autoFocus />
                <span className="text-xl font-bold text-primary">%</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 ml-2" onClick={() => setIsEditingGlobal(false)} disabled={isSavingGlobal}>
                  <X className="w-4 h-4" />
                </Button>
                <Button variant="default" size="icon" className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveGlobalScore} disabled={isSavingGlobal}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="w-full bg-primary/20 h-2.5 mt-6 rounded-full overflow-hidden">
              <motion.div 
                key={selectedMonth}
                initial={{ width: 0 }} 
                animate={{ width: `${data.atingido}%` }} 
                transition={{ duration: 1, type: "spring" }}
                className="h-full bg-primary rounded-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full skew-x-[-20deg] animate-[shimmer_2s_infinite]" />
              </motion.div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-3 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Gap restante de {data.gap.toFixed(1).replace('.', ',')}% para os 100% ideais
            </p>
          </CardContent>
        </Card>

        {/* Win Card */}
        <Card className="md:col-span-3 border-none bg-emerald-50 dark:bg-emerald-950/20 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute -right-6 -top-6 text-emerald-500/10">
            <Trophy className="w-32 h-32" />
          </div>
          <CardContent className="p-6 relative z-10 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
              <Trophy className="w-5 h-5" />
              <p className="text-sm font-bold uppercase tracking-wider">Metas Batidas</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400">{batidas}</p>
              <p className="text-xl font-bold text-emerald-600/50 dark:text-emerald-400/50">/ {totalMetas}</p>
            </div>
            <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70 mt-4">
              Métricas acima do esperado ou aceitáveis.
            </p>
          </CardContent>
        </Card>

        {/* Loss Card */}
        <Card className="md:col-span-3 border-none bg-rose-50 dark:bg-rose-950/20 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute -right-6 -top-6 text-rose-500/10">
            <AlertOctagon className="w-32 h-32" />
          </div>
          <CardContent className="p-6 relative z-10 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
              <AlertOctagon className="w-5 h-5" />
              <p className="text-sm font-bold uppercase tracking-wider">Metas Perdidas</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-black text-rose-600 dark:text-rose-400">{perdidas}</p>
              <p className="text-xl font-bold text-rose-600/50 dark:text-rose-400/50">/ {totalMetas}</p>
            </div>
            <p className="text-xs font-medium text-rose-600/70 dark:text-rose-400/70 mt-4">
              Métricas que exigem plano de ação imediato.
            </p>
          </CardContent>
        </Card>

      </div>

      {/* 3. Tabela de Metas */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card className="shadow-sm border-border flex flex-col">
          <ExpandableChart title={`Detalhamento de ${selectedMonth}`}>
            <div className="p-0 flex-1 overflow-auto rounded-md bg-card">
              <Table className="min-w-[1100px]">
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="w-[300px] font-bold">META</TableHead>
                  <TableHead className="w-[120px] text-center font-bold">CATEGORIA</TableHead>
                  <TableHead className="w-[120px] text-center font-bold">REFERÊNCIA</TableHead>
                  <TableHead className="w-[120px] text-center font-bold">ALCANÇADO</TableHead>
                  <TableHead className="w-[200px] text-center font-bold">ALCANÇADO EM PESO</TableHead>
                  <TableHead className="w-[240px] text-right pr-6 font-bold">
                  {!isEditing ? (
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={handleEditAll} className="h-8">
                        <Edit2 className="w-4 h-4 mr-2" /> Lançar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={handleAddMetric} disabled={isSaving} className="h-8 text-primary border-primary hover:bg-primary/10">
                        <Plus className="w-4 h-4 mr-1" /> Adicionar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving} className="text-rose-600 h-8">
                        <X className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                      <Button variant="default" size="sm" onClick={handleSaveAll} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 h-8">
                        <Save className="w-4 h-4 mr-1" /> Salvar
                      </Button>
                    </div>
                  )}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {(isEditing ? editOrder.map(id => data.metas.find(m => m.id === id)).filter(Boolean) : data.metas).map((m: any, idx) => {
                    const fillPercentage = Math.min(m.score, 100) || 0;
                    const isCusto = m.meta?.toLowerCase().includes('custo');
                    return (
                      <motion.tr 
                        key={m.id + selectedMonth}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`transition-colors border-b border-border last:border-0 group ${getRowColor(m.status)}`}
                      >
                        {isEditing && editValues[m.id] ? (
                          <>
                            <TableCell>
                              <Input type="text" className="w-full text-sm font-semibold h-8" value={editValues[m.id].meta} onChange={e => setEditValues({...editValues, [m.id]: {...editValues[m.id], meta: e.target.value}})} />
                              <p className="text-[10px] text-muted-foreground uppercase">{m.setor}</p>
                            </TableCell>
                            <TableCell className="text-center">
                              <Input type="text" className="w-24 mx-auto text-center h-8 text-xs" value={editValues[m.id].categoria} onChange={e => setEditValues({...editValues, [m.id]: {...editValues[m.id], categoria: e.target.value}})} placeholder="Ex: RH" />
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="relative w-24 mx-auto">
                                <Input type="number" step="0.01" className="w-full text-center h-8 text-xs pr-5" value={editValues[m.id].ref} onChange={e => setEditValues({...editValues, [m.id]: {...editValues[m.id], ref: e.target.value}})} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {isCusto ? (
                                <div className="relative w-28 mx-auto">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">R$</span>
                                  <Input type="text" className="w-full text-center h-8 text-xs pl-6" value={editValues[m.id].alcBruto} onChange={e => setEditValues({...editValues, [m.id]: {...editValues[m.id], alcBruto: e.target.value}})} placeholder="0,00" />
                                </div>
                              ) : (
                                <div className="relative w-24 mx-auto">
                                  <Input type="text" className="w-full text-center h-8 text-xs pr-5" value={editValues[m.id].alcBruto} onChange={e => setEditValues({...editValues, [m.id]: {...editValues[m.id], alcBruto: e.target.value}})} placeholder="Ex: 96" />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">%</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="relative w-24 mx-auto">
                                <Input type="number" step="0.01" className="w-full text-center h-8 text-xs pr-5" value={editValues[m.id].alcPeso} onChange={e => setEditValues({...editValues, [m.id]: {...editValues[m.id], alcPeso: e.target.value}})} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-2 items-center">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => handleMoveUp(idx)} disabled={idx === 0}>
                                  <ChevronUp className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => handleMoveDown(idx)} disabled={idx === editOrder.length - 1}>
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => handleDeleteMetric(m.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Select value={editValues[m.id].status} onValueChange={(val) => setEditValues({...editValues, [m.id]: {...editValues[m.id], status: val}})}>
                                  <SelectTrigger className={`h-8 w-[240px] border shadow-sm ${getStatusColor(editValues[m.id].status)}`}>
                                    <SelectValue placeholder="Selecione o Status..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Muito Acima do Esperado">Muito Acima do Esperado</SelectItem>
                                    <SelectItem value="Acima do Esperado">Acima do Esperado</SelectItem>
                                    <SelectItem value="Dentro Esperado (Aceitável)">Dentro Esperado (Aceitável)</SelectItem>
                                    <SelectItem value="Abaixo do Esperado">Abaixo do Esperado</SelectItem>
                                    <SelectItem value="Muito Abaixo do Esperado">Muito Abaixo do Esperado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>
                              <p className="font-semibold text-sm">{m.meta}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{m.setor}</p>
                            </TableCell>
                            <TableCell className="text-center font-medium text-muted-foreground">
                              {m.categoria}
                            </TableCell>
                            <TableCell className="text-center font-medium text-muted-foreground">
                              {m.ref.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {m.alcBruto ? (
                                isCusto ? (
                                  m.alcBruto.toString().includes('R$') ? m.alcBruto : `R$ ${m.alcBruto}`
                                ) : (
                                  m.alcBruto.toString().includes('%') ? m.alcBruto : `${m.alcBruto}%`
                                )
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold">{m.alc.toFixed(2)}%</span>
                                </div>
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden relative">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${fillPercentage}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${m.status.includes('Abaixo') ? 'bg-destructive' : 'bg-primary'}`} />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6 relative group">
                              <div className="flex items-center justify-end gap-2">
                                <Badge className={`shadow-sm border ${getStatusColor(m.status)}`}>
                                  {getStatusIcon(m.status)}
                                  {m.status}
                                </Badge>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
              </Table>
            </div>
          </ExpandableChart>
        </Card>
      </div>

      {/* 4. Evolução */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Evolução do Atingimento Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ExpandableChart title="Evolução do Atingimento Global">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAtingido" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2, strokeDasharray: '5 5' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="atingido" name="Aderência" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAtingido)" activeDot={{ r: 6 }}>
                      <LabelList dataKey="atingido" position="top" style={{ fontSize: '11px', fontWeight: 'bold', fill: 'hsl(var(--primary))' }} formatter={(val: number) => val.toFixed(0) + '%'} offset={10} />
                    </Area>
                    <Area type="monotone" dataKey="meta" name="Meta" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="3 3" fill="none" activeDot={false} />
                    <ReferenceLine y={100} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Radar e Ofensores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Radar Chart */}
        <Card className="shadow-sm border-border flex flex-col">
          <ExpandableChart title="Radar de Equilíbrio">
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-card rounded-md">
              <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar name="Alcançado (%)" dataKey="Atingido" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                  <Radar name="Referência (100%)" dataKey="Referencia" stroke="hsl(var(--destructive))" fill="none" strokeDasharray="3 3" strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-center text-muted-foreground mt-4 leading-relaxed">
              O polígono verde (Alcançado) deve idealmente cobrir a linha tracejada vermelha (Referência 100%). O que encolhe para dentro é gap.
            </p>
            </div>
          </ExpandableChart>
        </Card>

        {/* Gráfico 2: Impulsionadores vs Ofensores (Variância) */}
        <Card className="shadow-sm border-border flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Ofensores e Impulsionadores ({selectedMonth})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] mt-2">
              <ExpandableChart title={`Ofensores e Impulsionadores (${selectedMonth})`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={varianceData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.2} strokeWidth={2} />
                    <Bar dataKey="variance" name="Variação Absoluta vs Meta">
                      <LabelList dataKey="variance" position="top" style={{ fontSize: '11px', fontWeight: 'bold' }} formatter={(val: number) => val > 0 ? '+' + val.toFixed(1) : val.toFixed(1)} />
                      {varianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isPositive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Barras para cima ajudaram a bater a meta. Barras para baixo puxaram o resultado global para trás.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
