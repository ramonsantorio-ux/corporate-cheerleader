import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Plus, Search, Pencil, Filter, TrendingUp, TrendingDown, Calendar, Truck, MapPin, User, ChevronDown, ChevronUp, Trash2, Eye, Download, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FastInput } from '@/components/ui/fast-input';
import { FastTextarea } from '@/components/ui/fast-textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import PeriodFilter, { getMonthPeriod } from '@/components/filters/PeriodFilter';
import type { PeriodRange } from '@/components/filters/PeriodFilter';
import { toast } from 'sonner';
import {  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend , ScatterChart, Scatter, ZAxis, RadialBarChart, RadialBar, LabelList } from 'recharts';
import * as XLSX from 'xlsx';
import { ExpandableChart } from '@/components/ui/ExpandableChart';

interface EventRow {
  id: string;
  event_date: string;
  event_time: string;
  day_of_week: string;
  description: string;
  location: string;
  contract: string;
  equipment: string;
  plate_tag: string;
  shift: string;
  supervisor: string;
  involved_name: string;
  tipo_acidente?: string;
  agente_lesao?: string;
  parte_corpo?: string;
  genero_envolvido?: string;
  custo?: number;
  cid?: string;
  atestado?: boolean;
  afastamento?: boolean;
  danos_materiais?: boolean;
  created_at: string;
}

const CHART_COLORS = [
  'hsl(200, 80%, 38%)', 'hsl(155, 60%, 38%)', 'hsl(38, 90%, 50%)', 'hsl(0, 68%, 50%)',
  'hsl(270, 60%, 55%)', 'hsl(180, 45%, 40%)', 'hsl(330, 60%, 50%)', 'hsl(210, 75%, 50%)',
  'hsl(120, 40%, 45%)', 'hsl(45, 80%, 55%)',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Eventos() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [funcionarios, setFuncionarios] = useState<{ id: string; nome: string; cargo: string; departamento: string; foto_url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [period, setPeriod] = useState<PeriodRange>(() => ({
    start: '2024-01-01',
    end: new Date().toISOString().slice(0, 10),
    label: 'Todo o período',
  }));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventRow | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<EventRow | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    event_date: '', event_time: '', day_of_week: '', description: '',
    location: '', contract: 'PORTO', equipment: '', plate_tag: '',
    shift: '', supervisor: '', involved_name: '', tipo_acidente: '', agente_lesao: '', parte_corpo: '', genero_envolvido: '', custo: 0,
    cid: '', atestado: false, afastamento: false, danos_materiais: false,
  });

  // Employee filter
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; nome: string; cargo: string; departamento: string; foto_url: string } | null>(null);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);

  const filteredSearchEmps = useMemo(() => {
    if (!employeeSearch.trim()) return [];
    return funcionarios.filter(f => f.nome.toLowerCase().includes(employeeSearch.toLowerCase())).slice(0, 8);
  }, [employeeSearch, funcionarios]);

  useEffect(() => { fetchEvents(); }, [period]);

  async function fetchEvents() {
    setLoading(true);
    const [evtRes, fRes] = await Promise.all([
      supabase.from('events').select('*').gte('event_date', period.start).lte('event_date', period.end).order('event_date', { ascending: false }),
      supabase.from('funcionarios').select('id, nome, cargo, departamento, foto_url').order('nome'),
    ]);
    setEvents((evtRes.data as EventRow[]) || []);
    setFuncionarios((fRes.data || []) as any[]);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newEvent.event_date || !newEvent.description || !newEvent.involved_name) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const eventToSave = { ...newEvent };
    
    // Format event_time specifically for the database (HH:mm:ss or HH:mm)
    if (eventToSave.event_time) {
      const match = eventToSave.event_time.match(/\b(\d{2}:\d{2}(?::\d{2})?)\b/);
      if (match) {
        eventToSave.event_time = match[1];
      } else {
        // Fallback: truncate to prevent the huge string from crashing the insert/update
        eventToSave.event_time = eventToSave.event_time.substring(0, 8);
      }
    }

    let error;
    if (editingEvent) {
      const res = await supabase.from('events').update(eventToSave).eq('id', editingEvent.id);
      error = res.error;
    } else {
      const res = await supabase.from('events').insert(eventToSave);
      error = res.error;
    }

    if (error) { toast.error(`Erro ao salvar evento: ${error.message}`); return; }
    toast.success('Evento registrado!');
    setDialogOpen(false);
    setNewEvent({ event_date: '', event_time: '', day_of_week: '', description: '', location: '', contract: 'PORTO', equipment: '', plate_tag: '', shift: '', supervisor: '', involved_name: '', tipo_acidente: '', agente_lesao: '', parte_corpo: '', genero_envolvido: '', custo: 0, cid: '', atestado: false, afastamento: false, danos_materiais: false });
    fetchEvents();
  }

  async function confirmDelete() {
    if (!deleteEvent) return;
    await supabase.from('events').delete().eq('id', deleteEvent.id);
    toast.success('Evento removido');
    setDeleteEvent(null);
    fetchEvents();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
    
    const mapped = rows.map(r => {
      let dateVal = r['DATA'] || r['data'] || '';
      if (dateVal instanceof Date) {
        dateVal = dateVal.toISOString().slice(0, 10);
      } else if (typeof dateVal === 'string') {
        const parts = dateVal.match(/(\d+)\/(\d+)\/(\d+)/);
        if (parts) {
          let yr = parseInt(parts[3]);
          if (yr < 100) yr += 2000;
          dateVal = `${yr}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
      }
      
      return {
        event_date: dateVal,
        event_time: String(r['HORÁRIO'] || r['horario'] || ''),
        day_of_week: String(r['DIA DA SEMANA'] || r['dia_da_semana'] || ''),
        description: String(r['DESCRIÇÃO DO EVENTO'] || r['descricao'] || ''),
        location: String(r['LOCAL'] || r['local'] || ''),
        contract: String(r['CONTRATO'] || r['contrato'] || 'PORTO'),
        equipment: String(r['EQUIPAMENTO'] || r['equipamento'] || ''),
        plate_tag: String(r['PLACA/TAG'] || r['placa_tag'] || ''),
        shift: String(r['TURNO'] || r['turno'] || ''),
        supervisor: String(r['ENCARREGADO'] || r['encarregado'] || ''),
        involved_name: String(r['NOME DO ENVOLVIDO'] || r['nome_envolvido'] || ''),
        cid: String(r['CID'] || r['cid'] || ''),
        atestado: String(r['ATESTADO'] || r['atestado'] || '').trim().toLowerCase() === 'sim',
        afastamento: String(r['AFASTAMENTO'] || r['afastamento'] || '').trim().toLowerCase() === 'sim',
        danos_materiais: String(r['DANOS MATERIAIS'] || r['danos_materiais'] || r['danos materiais'] || '').trim().toLowerCase() === 'sim',
      };
    }).filter(r => r.event_date && r.description);

    if (!mapped.length) { toast.error('Nenhum dado válido encontrado'); return; }

    // Insert in batches of 50
    for (let i = 0; i < mapped.length; i += 50) {
      const batch = mapped.slice(i, i + 50);
      const { error } = await supabase.from('events').insert(batch);
      if (error) { toast.error(`Erro no lote ${i}: ${error.message}`); return; }
    }
    toast.success(`${mapped.length} eventos importados!`);
    fetchEvents();
    e.target.value = '';
  }

  function handleExport() {
    const exportData = filtered.map(ev => ({
      'DATA': ev.event_date,
      'HORÁRIO': ev.event_time,
      'DIA DA SEMANA': ev.day_of_week,
      'DESCRIÇÃO DO EVENTO': ev.description,
      'LOCAL': ev.location,
      'CONTRATO': ev.contract,
      'EQUIPAMENTO': ev.equipment,
      'PLACA/TAG': ev.plate_tag,
      'TURNO': ev.shift,
      'ENCARREGADO': ev.supervisor,
      'NOME DO ENVOLVIDO': ev.involved_name,
      'CID': ev.cid || '',
      'ATESTADO': ev.atestado ? 'Sim' : 'Não',
      'AFASTAMENTO': ev.afastamento ? 'Sim' : 'Não',
      'DANOS MATERIAIS': ev.danos_materiais ? 'Sim' : 'Não',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Eventos');
    XLSX.writeFile(wb, 'Eventos_Porto.xlsx');
  }

  // Unique equipment types for filter
  const equipmentTypes = useMemo(() => {
    const types = new Set(events.map(e => e.equipment).filter(Boolean).filter(e => e !== 'NA'));
    return Array.from(types).sort();
  }, [events]);

  // Filtered events
  const filtered = useMemo(() => {
    return events.filter(ev => {
      const q = search.toLowerCase();
      const matchSearch = !q || ev.description.toLowerCase().includes(q) ||
        ev.involved_name.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q) ||
        ev.equipment.toLowerCase().includes(q) ||
        ev.plate_tag.toLowerCase().includes(q);
      const matchEquip = equipmentFilter === 'all' || ev.equipment === equipmentFilter;
      const matchEmployee = !selectedEmployee || ev.involved_name.trim().toLowerCase() === selectedEmployee.nome.trim().toLowerCase();
      return matchSearch && matchEquip && matchEmployee;
    });
  }, [events, search, equipmentFilter, selectedEmployee]);

  // ========== ANALYTICS ==========
  const analytics = useMemo(() => {
        const byMonth: Record<string, number> = {};
    const byEquipment: Record<string, number> = {};
    const byLocation: Record<string, number> = {};
    const byPerson: Record<string, number> = {};
    const byDayOfWeek: Record<string, number> = {};
    const byYear: Record<string, number> = {};
    const byTipoAcidente: Record<string, number> = {};
    const byAgenteLesao: Record<string, number> = {};
    const byParteCorpo: Record<string, number> = {};
    const byGenero: Record<string, number> = {};
    const byTurno: Record<string, number> = {};
    const byLetra: Record<string, number> = {};
    const byCid: Record<string, number> = {};
    const byAtestado: Record<string, number> = {};
    let afastamentoCom = 0;
    let afastamentoSem = 0;
    let danosCom = 0;
    let danosSem = 0;
    let medicalCount = 0;

    let daysWithoutAccident: number | 'N/A' = 'N/A';
    const validPastDates = events
      .map(ev => new Date(ev.event_date))
      .filter(d => !isNaN(d.getTime()) && d.getTime() <= new Date().getTime())
      .sort((a, b) => b.getTime() - a.getTime());

    if (validPastDates.length > 0) {
      daysWithoutAccident = Math.floor((new Date().getTime() - validPastDates[0].getTime()) / (1000 * 60 * 60 * 24));
    } else if (events.length > 0) {
      daysWithoutAccident = 0;
    }

    const dayMap: Record<string, number> = { 'domingo': 0, 'segunda-feira': 1, 'terça-feira': 2, 'quarta-feira': 3, 'quinta-feira': 4, 'sexta-feira': 5, 'sábado': 6 };
    const hourlyGrid: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyGrid[h] = 0;

    for (const ev of events) {
      const ym = ev.event_date.slice(0, 7);
      byMonth[ym] = (byMonth[ym] || 0) + 1;
      const yr = ev.event_date.slice(0, 4);
      byYear[yr] = (byYear[yr] || 0) + 1;

      const equip = ev.equipment && ev.equipment !== 'NA' ? ev.equipment : 'N/A';
      byEquipment[equip] = (byEquipment[equip] || 0) + 1;

      if (ev.location) {
        const loc = ev.location.toUpperCase().includes('ATENDIMENTO MÉDICO') || ev.location.toUpperCase().includes('PROBLEMA PARTICULAR')
          ? 'ATENDIMENTO MÉDICO / PESSOAL' : ev.location.length > 30 ? ev.location.slice(0, 30) + '...' : ev.location;
        byLocation[loc] = (byLocation[loc] || 0) + 1;
      }

      if (ev.location?.toUpperCase().includes('ATENDIMENTO MÉDICO') || ev.location?.toUpperCase().includes('PROBLEMA PARTICULAR')) {
        medicalCount++;
      }

      if (ev.involved_name) {
        byPerson[ev.involved_name] = (byPerson[ev.involved_name] || 0) + 1;
      }

      if (ev.day_of_week) {
        const dow = ev.day_of_week.toLowerCase();
        byDayOfWeek[dow] = (byDayOfWeek[dow] || 0) + 1;
      }

      if (ev.shift) {
        const shift = ev.shift.trim().toLowerCase().replace(/\b[a-z]/g, char => char.toUpperCase()).replace('Adm', 'ADM');
        byLetra[shift] = (byLetra[shift] || 0) + 1;
      }

      if (ev.cid) byCid[ev.cid] = (byCid[ev.cid] || 0) + 1;
      if (ev.atestado && ev.involved_name) byAtestado[ev.involved_name] = (byAtestado[ev.involved_name] || 0) + 1;
      if (ev.afastamento) afastamentoCom++; else afastamentoSem++;
      if (ev.danos_materiais) danosCom++; else danosSem++;

      if (ev.tipo_acidente) byTipoAcidente[ev.tipo_acidente] = (byTipoAcidente[ev.tipo_acidente] || 0) + 1;
      if (ev.agente_lesao) byAgenteLesao[ev.agente_lesao] = (byAgenteLesao[ev.agente_lesao] || 0) + 1;
      if (ev.parte_corpo) byParteCorpo[ev.parte_corpo] = (byParteCorpo[ev.parte_corpo] || 0) + 1;

      if (ev.event_time) {
        const timeMatch = ev.event_time.match(/\b(\d{2}):(\d{2})(?::\d{2})?\b/);
        if (timeMatch) {
          const h = parseInt(timeMatch[1]);
          if (!isNaN(h)) {
            hourlyGrid[h] += 1;
          }
        }
      }
    }

    const monthTrend = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => {
      const [y, m] = month.split('-');
      const label = `${m}/${y.slice(2)}`;
      return { month: label, eventos: count };
    });

    const topEquipment = Object.entries(byEquipment)
      .sort(([, a], [, b]) => b - a).slice(0, 8)
      .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '...' : name, value }));

    const topPeople = Object.entries(byPerson)
      .sort(([, a], [, b]) => b - a).slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    const dayOfWeekOrder = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];
    const dayData = dayOfWeekOrder.map(d => ({
      day: d.replace('-feira', '').charAt(0).toUpperCase() + d.replace('-feira', '').slice(1),
      eventos: byDayOfWeek[d] || 0,
    }));

    const topLocations = Object.entries(byLocation)
      .sort(([, a], [, b]) => b - a).slice(0, 6)
      .map(([name, value]) => ({ name, value }));
    const yearData = Object.entries(byYear).sort(([a], [b]) => a.localeCompare(b)).map(([year, count]) => ({ year, eventos: count }));

    const topTipos = Object.entries(byTipoAcidente).map(([name, value]) => ({ name, value }));
    const topAgentes = Object.entries(byAgenteLesao).sort(([,a], [,b]) => b - a).slice(0, 6).map(([name, value]) => ({ name, value }));
    const topPartes = Object.entries(byParteCorpo).sort(([,a], [,b]) => b - a).slice(0, 6).map(([name, value]) => ({ name, value }));

    const operationalCount = events.length - medicalCount;
    const turnoData = Object.entries(byTurno || {}).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));

    const hourlyData = Object.entries(hourlyGrid).map(([hour, count]) => ({ hour: `${hour}h`, count }));

    const letraData = Object.entries(byLetra)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value], i) => ({
        name, value, fill: CHART_COLORS[i % CHART_COLORS.length]
      }));

    const topCids = Object.entries(byCid)
      .sort(([, a], [, b]) => b - a).slice(0, 5)
      .map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i % CHART_COLORS.length] }));

    const topAtestados = Object.entries(byAtestado)
      .sort(([, a], [, b]) => b - a).slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const afastamentoData = [
      { name: 'Eventos com Afastamento', value: afastamentoCom, fill: '#ef4444' },
      { name: 'Eventos sem Afastamento', value: afastamentoSem, fill: '#10b981' }
    ].filter(d => d.value > 0);

    const danosData = [
      { name: 'Eventos Materiais', value: danosCom, fill: '#f59e0b' },
      { name: 'Eventos Sem Perda', value: danosSem, fill: '#3b82f6' }
    ].filter(d => d.value > 0);

    return { 
      monthTrend, topEquipment, topPeople, dayData, topLocations, yearData, 
      medicalCount, operationalCount, total: events.length,
      topTipos, topAgentes, topPartes, byGenero, byTurno, turnoData,
      byLetra, letraData, hourlyData, daysWithoutAccident,
      topCids, topAtestados, afastamentoData, danosData
    };
  }, [events]);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const match = timeStr.match(/\b(\d{2}):(\d{2})(?::\d{2})?\b/);
    return match ? `${match[1]}h${match[2]}` : timeStr;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-warning" />
            Controle de Eventos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Registro e análise de ocorrências operacionais</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="cursor-pointer">
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            <Button variant="outline" size="sm" asChild><span><Upload className="w-4 h-4 mr-1" /> Importar</span></Button>
          </label>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Exportar</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Evento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingEvent ? "Editar Evento" : "Registrar Novo Evento"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input type="date" value={newEvent.event_date} onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <FastInput value={newEvent.event_time} onValueChange={v => setNewEvent(p => ({ ...p, event_time: v }))} placeholder="Ex: 14:30" />
                </div>
                <div className="space-y-2">
                  <Label>Dia da Semana</Label>
                  <Select value={newEvent.day_of_week} onValueChange={v => setNewEvent({ ...newEvent, day_of_week: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'].map(d => (
                        <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Local</Label>
                  <FastInput value={newEvent.location} onValueChange={v => setNewEvent(p => ({ ...p, location: v }))} placeholder="Ex: PÁTIO P" />
                </div>
                <div className="space-y-2">
                  <Label>Equipamento</Label>
                  <FastInput value={newEvent.equipment} onValueChange={v => setNewEvent(p => ({ ...p, equipment: v }))} placeholder="Ex: CAMINHÃO PIPA" />
                </div>
                <div className="space-y-2">
                  <Label>Placa/TAG</Label>
                  <FastInput value={newEvent.plate_tag} onValueChange={v => setNewEvent(p => ({ ...p, plate_tag: v }))} placeholder="Ex: QRD0980" />
                </div>
                <div className="space-y-2">
                  <Label>Turno</Label>
                  <FastInput value={newEvent.shift} onValueChange={v => setNewEvent(p => ({ ...p, shift: v }))} />
                </div>
                <div className="space-y-2">
                  <Label>Encarregado</Label>
                  <FastInput value={newEvent.supervisor} onValueChange={v => setNewEvent(p => ({ ...p, supervisor: v }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome do Envolvido *</Label>
                  <FastInput value={newEvent.involved_name} onValueChange={v => setNewEvent(p => ({ ...p, involved_name: v }))} placeholder="Nome completo" />
                </div>
                
                {/* Novos campos médicos e de severidade */}
                <div className="space-y-2">
                  <Label>CID (Opcional)</Label>
                  <FastInput value={newEvent.cid || ''} onValueChange={v => setNewEvent(p => ({ ...p, cid: v }))} placeholder="Ex: S60" />
                </div>
                <div className="flex items-center gap-2 mt-8">
                  <input type="checkbox" id="atestado" className="w-4 h-4 cursor-pointer" checked={newEvent.atestado} onChange={e => setNewEvent(p => ({ ...p, atestado: e.target.checked }))} />
                  <Label htmlFor="atestado" className="cursor-pointer">Gerou Atestado Médico</Label>
                </div>
                <div className="flex items-center gap-2 mt-8">
                  <input type="checkbox" id="afastamento" className="w-4 h-4 cursor-pointer" checked={newEvent.afastamento} onChange={e => setNewEvent(p => ({ ...p, afastamento: e.target.checked }))} />
                  <Label htmlFor="afastamento" className="cursor-pointer">Com Afastamento</Label>
                </div>
                <div className="flex items-center gap-2 mt-8">
                  <input type="checkbox" id="danos" className="w-4 h-4 cursor-pointer" checked={newEvent.danos_materiais} onChange={e => setNewEvent(p => ({ ...p, danos_materiais: e.target.checked }))} />
                  <Label htmlFor="danos" className="cursor-pointer">Danos Materiais</Label>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição do Evento *</Label>
                  <FastTextarea rows={4} value={newEvent.description} onValueChange={v => setNewEvent(p => ({ ...p, description: v }))} placeholder="Descreva o evento detalhadamente..." />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={handleCreate} className="w-full">Registrar Evento</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Period + Search + Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <PeriodFilter value={period} onChange={setPeriod} className="md:w-auto" />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por descrição, nome, local, equipamento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
          <SelectTrigger className="w-[200px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Equipamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Equipamentos</SelectItem>
            {equipmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Employee Filter */}
      <div className="relative w-full sm:w-72">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <User className="w-4 h-4 text-muted-foreground shrink-0" />
          {selectedEmployee ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedEmployee.foto_url ? (
                <img src={selectedEmployee.foto_url} className="w-6 h-6 rounded-full object-cover border border-border" alt="" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">{selectedEmployee.nome.charAt(0)}</div>
              )}
              <span className="text-sm font-medium truncate">{selectedEmployee.nome}</span>
              <button onClick={() => { setSelectedEmployee(null); setEmployeeSearch(''); }} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <input type="text" placeholder="Filtrar por funcionário..." value={employeeSearch}
              onChange={e => { setEmployeeSearch(e.target.value); setShowEmpDropdown(true); }}
              onFocus={() => setShowEmpDropdown(true)}
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
          )}
        </div>
        {showEmpDropdown && filteredSearchEmps.length > 0 && !selectedEmployee && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
            {filteredSearchEmps.map(f => (
              <button key={f.id} onClick={() => { setSelectedEmployee(f); setEmployeeSearch(''); setShowEmpDropdown(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left">
                {f.foto_url ? (
                  <img src={f.foto_url} className="w-7 h-7 rounded-full object-cover border border-border" alt="" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{f.nome.charAt(0)}</div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{f.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{f.cargo} · {f.departamento}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedEmployee && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 border-l-4 border-l-primary flex items-center gap-4">
          {selectedEmployee.foto_url ? (
            <img src={selectedEmployee.foto_url} className="w-10 h-10 rounded-full object-cover border-2 border-primary/30" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{selectedEmployee.nome.charAt(0)}</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">{selectedEmployee.nome}</p>
            <p className="text-sm text-muted-foreground">{selectedEmployee.cargo} · {selectedEmployee.departamento}</p>
          </div>
          <button onClick={() => navigate(`/funcionario/${selectedEmployee.id}`)} className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium shrink-0">
            <Eye className="w-3.5 h-3.5" /> Ver Perfil
          </button>
        </motion.div>
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total de Eventos</p>
            <p className="text-3xl font-bold text-foreground mt-1">{analytics.total}</p>
            <p className="text-xs text-muted-foreground mt-1">no período selecionado</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Eventos Operacionais</p>
            <p className="text-3xl font-bold text-foreground mt-1">{analytics.operationalCount}</p>
            <p className="text-xs text-warning mt-1">{analytics.total ? ((analytics.operationalCount / analytics.total) * 100).toFixed(0) : 0}% do total</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Atendimento Médico</p>
            <p className="text-3xl font-bold text-foreground mt-1">{analytics.medicalCount}</p>
            <p className="text-xs text-destructive mt-1">{analytics.total ? ((analytics.medicalCount / analytics.total) * 100).toFixed(0) : 0}% do total</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[hsl(var(--success))]">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Média Mensal</p>
            <p className="text-3xl font-bold text-foreground mt-1">
              {analytics.monthTrend.length ? (analytics.total / analytics.monthTrend.length).toFixed(1) : 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">eventos/mês</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ExpandableChart title="Visualização Ampliada">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthTrend}>
                    <defs>
                      <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(200, 80%, 38%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(200, 80%, 38%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="eventos" stroke="hsl(200, 80%, 38%)" fill="url(#eventGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>

        {/* Equipment distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" /> Por Tipo de Equipamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ExpandableChart title="Visualização Ampliada">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topEquipment} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={140} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Eventos" fill="hsl(200, 80%, 38%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Day of week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Por Dia da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ExpandableChart title="Visualização Ampliada">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="eventos" name="Eventos" radius={[4, 4, 0, 0]}>
                      {analytics.dayData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>

        {/* Year comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-primary" /> Comparativo Anual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ExpandableChart title="Visualização Ampliada">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.yearData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="eventos" name="Eventos" fill="hsl(38, 90%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>

        {/* Top locations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Principais Locais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ExpandableChart title="Visualização Ampliada">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.topLocations} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {analytics.topLocations.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} formatter={(value, entry, index) => `${value} (${analytics.topLocations[index].value})`} />
                  </PieChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores SST Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="p-6 flex flex-col justify-center items-center text-center h-full">
            <p className="text-sm text-emerald-700 font-semibold mb-2 uppercase tracking-wider">Status de Segurança</p>
            <p className="text-5xl font-black text-emerald-600 mb-2">{analytics.daysWithoutAccident}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase">Dias sem Ocorrências</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-[#4472c4] lg:col-span-2">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-sm font-semibold mb-4">Eventos por Letra</p>
            <div className="h-[220px] w-full">
              <ExpandableChart title="Eventos por Letra">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.letraData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="value" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />
                      {analytics.letraData?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#eb7d5b]" /> Horário dos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ExpandableChart title="Horário dos Eventos">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.hourlyData} margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="count" fill="#eb7d5b" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="count" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top reincidentes */}
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-[#3b82f6]" /> Colaboradores com Maior Reincidência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ExpandableChart title="Colaboradores com Maior Reincidência">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topPeople} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={150} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Eventos" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      <LabelList dataKey="value" position="right" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel Médico e Severidade */}
      <div className="mt-12 mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground border-b pb-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Saúde, Gravidade e Ocorrências Médicas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top CIDs (Doenças/Lesões)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {analytics.topCids.length > 0 ? (
                  <ExpandableChart title="Top CIDs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.topCids} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" vertical={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={50} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="hsl(0, 68%, 50%)" radius={[0, 4, 4, 0]}>
                          <LabelList dataKey="value" position="right" style={{ fontSize: '10px' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ExpandableChart>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Sem dados de CID</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Afastamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {analytics.afastamentoData.length > 0 ? (
                  <ExpandableChart title="Afastamentos">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.afastamentoData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="50%" outerRadius="80%">
                          {analytics.afastamentoData.map((d: any, i: number) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ExpandableChart>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Sem dados</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {analytics.danosData.length > 0 ? (
                  <ExpandableChart title="Eventos">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.danosData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="50%" outerRadius="80%">
                          {analytics.danosData.map((d: any, i: number) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ExpandableChart>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Sem dados</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top 10 Atestados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[200px] overflow-y-auto px-4 pb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 text-xs">Colaborador</TableHead>
                      <TableHead className="h-8 text-xs text-right">Qtd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topAtestados.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center text-xs text-muted-foreground py-6">Nenhum atestado registrado</TableCell></TableRow>
                    ) : (
                      analytics.topAtestados.map((a, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs py-2">{a.name}</TableCell>
                          <TableCell className="text-xs py-2 text-right font-medium">{a.count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Registro de Eventos ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Nenhum evento encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead className="w-[60px]">Hora</TableHead>
                    <TableHead>Envolvido</TableHead>
                    <TableHead className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        Equipamento
                        <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                          <SelectTrigger className="h-6 w-6 p-0 border-0 bg-transparent shadow-none focus:ring-0 [&>svg:not(:first-child)]:hidden">
                            <Filter className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {equipmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Placa</TableHead>
                    <TableHead className="hidden lg:table-cell">Local</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map((ev) => (
                    <>
                      <TableRow key={ev.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedRow(expandedRow === ev.id ? null : ev.id)}>
                        <TableCell className="text-xs font-medium">{new Date(ev.event_date + 'T12:00').toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-xs">{formatTime(ev.event_time)}</TableCell>
                        <TableCell className="text-xs font-medium">{ev.involved_name}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">
                          {ev.equipment && ev.equipment !== 'NA' ? (
                            <Badge variant="secondary" className="text-[10px]">{ev.equipment}</Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{ev.plate_tag || '—'}</TableCell>
                        <TableCell className="text-xs hidden lg:table-cell truncate max-w-[200px]" title={ev.location}>{ev.location || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setDetailEvent(ev); }}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); setEditingEvent(ev); setNewEvent({ event_date: ev.event_date.split('T')[0], event_time: (ev.event_time || '').match(/\b\d{2}:\d{2}\b/) ? (ev.event_time || '').match(/\b\d{2}:\d{2}\b/)![0] : (ev.event_time || '').substring(0, 5), day_of_week: ev.day_of_week, description: ev.description, location: ev.location, contract: ev.contract, equipment: ev.equipment, plate_tag: ev.plate_tag, shift: ev.shift, supervisor: ev.supervisor, involved_name: ev.involved_name, tipo_acidente: ev.tipo_acidente || '', agente_lesao: ev.agente_lesao || '', parte_corpo: ev.parte_corpo || '', genero_envolvido: ev.genero_envolvido || '', custo: ev.custo || 0, cid: ev.cid || '', atestado: ev.atestado || false, afastamento: ev.afastamento || false, danos_materiais: ev.danos_materiais || false }); setDialogOpen(true); }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteEvent(ev); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            {expandedRow === ev.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </TableCell>
                      </TableRow>
                      <AnimatePresence>
                        {expandedRow === ev.id && (
                          <TableRow key={`${ev.id}-expand`}>
                            <TableCell colSpan={7} className="bg-muted/30 p-4">
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                <p className="text-xs text-foreground leading-relaxed">{ev.description}</p>
                                <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-muted-foreground">
                                  {ev.day_of_week && <span>📅 {ev.day_of_week}</span>}
                                  {ev.supervisor && <span>👤 Enc.: {ev.supervisor}</span>}
                                  {ev.shift && <span>🔄 Turno: {ev.shift}</span>}
                                  {ev.contract && <span>📋 Contrato: {ev.contract}</span>}
                                </div>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </>
                  ))}
                </TableBody>
              </Table>
              {filtered.length > 100 && (
                <p className="text-xs text-center text-muted-foreground py-3">Exibindo 100 de {filtered.length} eventos. Use filtros para refinar.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!detailEvent} onOpenChange={(open) => !open && setDetailEvent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes do Evento</DialogTitle></DialogHeader>
          {detailEvent && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground">Data</Label><p className="font-medium">{new Date(detailEvent.event_date + 'T12:00').toLocaleDateString('pt-BR')}</p></div>
                <div><Label className="text-muted-foreground">Horário</Label><p className="font-medium">{detailEvent.event_time || '—'}</p></div>
                <div><Label className="text-muted-foreground">Envolvido</Label><p className="font-medium">{detailEvent.involved_name}</p></div>
                <div><Label className="text-muted-foreground">Equipamento</Label><p className="font-medium">{detailEvent.equipment || '—'}</p></div>
                <div><Label className="text-muted-foreground">Placa/TAG</Label><p className="font-medium">{detailEvent.plate_tag || '—'}</p></div>
                <div><Label className="text-muted-foreground">Local</Label><p className="font-medium">{detailEvent.location || '—'}</p></div>
                <div><Label className="text-muted-foreground">Tipo</Label><p className="font-medium">{detailEvent.tipo_acidente || '—'}</p></div>
                <div><Label className="text-muted-foreground">Agente da Lesão</Label><p className="font-medium">{detailEvent.agente_lesao || '—'}</p></div>
                <div><Label className="text-muted-foreground">Parte do Corpo</Label><p className="font-medium">{detailEvent.parte_corpo || '—'}</p></div>
                <div><Label className="text-muted-foreground">Gênero</Label><p className="font-medium">{detailEvent.genero_envolvido || '—'}</p></div>
                <div><Label className="text-muted-foreground">Turno</Label><p className="font-medium">{detailEvent.shift || '—'}</p></div>
                <div><Label className="text-muted-foreground">Encarregado</Label><p className="font-medium">{detailEvent.supervisor || '—'}</p></div>
              </div>
              <div>
                <Label className="text-muted-foreground">Descrição</Label>
                <p className="mt-1 text-foreground leading-relaxed bg-muted/50 rounded-lg p-3">{detailEvent.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteEvent} onOpenChange={(open) => !open && setDeleteEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Evento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este evento de "{deleteEvent?.involved_name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
