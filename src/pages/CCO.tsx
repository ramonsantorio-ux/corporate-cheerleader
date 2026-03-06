import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  Plus, Search, Edit, Trash2, Loader2, Download, Upload, Truck, Wrench,
  BarChart3, Clock, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

interface FleetItem {
  id: string;
  equipamento: string;
  placa: string;
  local: string;
  operador_turno_a: string;
  operador_turno_b: string;
  categoria: string;
  tipo: string;
  created_at: string;
  updated_at: string;
}

interface MaintenanceItem {
  id: string;
  data: string;
  placa: string;
  tipo_equipamento: string;
  motorista: string;
  letra: string;
  area: string;
  servico: string;
  tipo_manutencao: string;
  inicio: string | null;
  liberacao: string | null;
  horas_perdidas: string;
  observacao: string;
  status: string;
  created_at: string;
}

const CATEGORIAS = [
  { value: 'porto', label: 'Porto' },
  { value: 'porto_tpm', label: 'Porto - TPM' },
  { value: 'reserva', label: 'Reserva' },
];

const STATUS_MANUTENCAO = ['EM ANDAMENTO', 'FINALIZADO', 'PENDENTE'];
const TIPOS_MANUTENCAO = [
  'ELÉTRICA', 'MECÂNICA', 'ESTRUTURA', 'SOLDA', 'PNEU', 'FREIO', 'MOLA',
  'GERAL', 'HIDRÁULICA', 'PREVENTIVA', 'CHECK LIST', 'ATRASO', 'ABASTECIMENTO',
  'PNEU', 'OUTROS',
];

const CHART_COLORS = [
  'hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(210, 70%, 55%)',
  'hsl(150, 60%, 45%)', 'hsl(45, 90%, 55%)', 'hsl(280, 60%, 55%)',
  'hsl(330, 60%, 55%)', 'hsl(180, 50%, 45%)',
];

const emptyFleet: Omit<FleetItem, 'id' | 'created_at' | 'updated_at'> = {
  equipamento: '', placa: '', local: '', operador_turno_a: '', operador_turno_b: '',
  categoria: 'porto', tipo: 'operacional',
};

const emptyMaint: Omit<MaintenanceItem, 'id' | 'created_at'> = {
  data: new Date().toISOString().split('T')[0], placa: '', tipo_equipamento: '',
  motorista: '', letra: '', area: '', servico: '', tipo_manutencao: '',
  inicio: null, liberacao: null, horas_perdidas: '00:00:00', observacao: '', status: 'EM ANDAMENTO',
};

export default function CCO() {
  const [tab, setTab] = useState('frota');
  // Fleet state
  const [fleet, setFleet] = useState<FleetItem[]>([]);
  const [fleetSearch, setFleetSearch] = useState('');
  const [fleetLoading, setFleetLoading] = useState(true);
  const [fleetDialogOpen, setFleetDialogOpen] = useState(false);
  const [editFleet, setEditFleet] = useState<FleetItem | null>(null);
  const [fleetForm, setFleetForm] = useState(emptyFleet);
  const [deleteFleetId, setDeleteFleetId] = useState<string | null>(null);

  // Maintenance state
  const [maint, setMaint] = useState<MaintenanceItem[]>([]);
  const [maintSearch, setMaintSearch] = useState('');
  const [maintLoading, setMaintLoading] = useState(true);
  const [maintDialogOpen, setMaintDialogOpen] = useState(false);
  const [editMaint, setEditMaint] = useState<MaintenanceItem | null>(null);
  const [maintForm, setMaintForm] = useState(emptyMaint);
  const [deleteMaintId, setDeleteMaintId] = useState<string | null>(null);
  const [maintFilter, setMaintFilter] = useState('todos');

  const importFleetRef = useRef<HTMLInputElement>(null);
  const importMaintRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchFleet(); fetchMaint(); }, []);

  // --- FLEET CRUD ---
  async function fetchFleet() {
    setFleetLoading(true);
    const { data } = await supabase.from('cco_fleet').select('*').order('created_at', { ascending: false });
    setFleet((data || []) as FleetItem[]);
    setFleetLoading(false);
  }

  async function saveFleet() {
    if (!fleetForm.equipamento) { toast.error('Equipamento é obrigatório'); return; }
    if (editFleet) {
      const { error } = await supabase.from('cco_fleet').update({ ...fleetForm, updated_at: new Date().toISOString() }).eq('id', editFleet.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Equipamento atualizado!');
    } else {
      const { error } = await supabase.from('cco_fleet').insert(fleetForm);
      if (error) { toast.error('Erro ao cadastrar'); return; }
      toast.success('Equipamento cadastrado!');
    }
    setFleetDialogOpen(false); setEditFleet(null); setFleetForm(emptyFleet); fetchFleet();
  }

  async function deleteFleet() {
    if (!deleteFleetId) return;
    await supabase.from('cco_fleet').delete().eq('id', deleteFleetId);
    setDeleteFleetId(null); toast.success('Removido!'); fetchFleet();
  }

  function openEditFleet(item: FleetItem) {
    setEditFleet(item);
    setFleetForm({
      equipamento: item.equipamento, placa: item.placa, local: item.local,
      operador_turno_a: item.operador_turno_a, operador_turno_b: item.operador_turno_b,
      categoria: item.categoria, tipo: item.tipo,
    });
    setFleetDialogOpen(true);
  }

  // --- MAINTENANCE CRUD ---
  async function fetchMaint() {
    setMaintLoading(true);
    const { data } = await supabase.from('cco_maintenance').select('*').order('data', { ascending: false });
    setMaint((data || []) as MaintenanceItem[]);
    setMaintLoading(false);
  }

  async function saveMaint() {
    if (!maintForm.tipo_equipamento || !maintForm.placa) { toast.error('Equipamento e Placa são obrigatórios'); return; }
    if (editMaint) {
      const { error } = await supabase.from('cco_maintenance').update(maintForm).eq('id', editMaint.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Registro atualizado!');
    } else {
      const { error } = await supabase.from('cco_maintenance').insert(maintForm);
      if (error) { toast.error('Erro ao cadastrar'); return; }
      toast.success('Registro cadastrado!');
    }
    setMaintDialogOpen(false); setEditMaint(null); setMaintForm(emptyMaint); fetchMaint();
  }

  async function deleteMaint() {
    if (!deleteMaintId) return;
    await supabase.from('cco_maintenance').delete().eq('id', deleteMaintId);
    setDeleteMaintId(null); toast.success('Removido!'); fetchMaint();
  }

  function openEditMaint(item: MaintenanceItem) {
    setEditMaint(item);
    setMaintForm({
      data: item.data, placa: item.placa, tipo_equipamento: item.tipo_equipamento,
      motorista: item.motorista, letra: item.letra, area: item.area, servico: item.servico,
      tipo_manutencao: item.tipo_manutencao, inicio: item.inicio, liberacao: item.liberacao,
      horas_perdidas: item.horas_perdidas, observacao: item.observacao, status: item.status,
    });
    setMaintDialogOpen(true);
  }

  // --- IMPORT ---
  async function handleImportFleet(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
      const records = rows.map(r => ({
        equipamento: String(r['Equipamento'] || '').trim(),
        placa: String(r['Placa'] || r['Placa - A'] || '').trim(),
        local: String(r['Local'] || '').trim(),
        operador_turno_a: String(r['TURNO A'] || r['Operador Turno A'] || '').trim(),
        operador_turno_b: String(r['TURNO B'] || r['Operador Turno B'] || '').trim(),
        categoria: 'porto', tipo: 'operacional',
      })).filter(r => r.equipamento);
      if (records.length === 0) { toast.error('Nenhum registro válido'); return; }
      const { error } = await supabase.from('cco_fleet').insert(records);
      if (error) toast.error('Erro: ' + error.message);
      else { toast.success(`${records.length} equipamentos importados!`); fetchFleet(); }
    } catch { toast.error('Erro ao ler arquivo'); }
    if (importFleetRef.current) importFleetRef.current.value = '';
  }

  async function handleImportMaint(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
      const records = rows.map(r => ({
        data: String(r['DATA'] || r['Data'] || '').trim() || new Date().toISOString().split('T')[0],
        placa: String(r['PLACA'] || r['Placa'] || '').trim(),
        tipo_equipamento: String(r['TIPO DE EQUIPAMENTO'] || r['Tipo Equipamento'] || '').trim(),
        motorista: String(r['MOTORISTA'] || r['Motorista'] || '').trim(),
        letra: String(r['LETRA'] || r['Letra'] || '').trim(),
        area: String(r['ÁREA'] || r['Area'] || '').trim(),
        servico: String(r['SERVIÇO'] || r['Servico'] || '').trim(),
        tipo_manutencao: String(r['TIPO DE MANUTENÇÃO'] || r['Tipo Manutenção'] || '').trim(),
        horas_perdidas: String(r['HORAS PERDIDAS'] || r['Horas Perdidas'] || '00:00:00').trim(),
        observacao: String(r['OBSERVAÇÃO'] || r['Observação'] || '').trim(),
        status: String(r['STATUS'] || r['Status'] || 'EM ANDAMENTO').trim(),
      })).filter(r => r.tipo_equipamento || r.placa);
      if (records.length === 0) { toast.error('Nenhum registro válido'); return; }
      const { error } = await supabase.from('cco_maintenance').insert(records);
      if (error) toast.error('Erro: ' + error.message);
      else { toast.success(`${records.length} registros importados!`); fetchMaint(); }
    } catch { toast.error('Erro ao ler arquivo'); }
    if (importMaintRef.current) importMaintRef.current.value = '';
  }

  // --- FILTERS ---
  const filteredFleet = fleet.filter(f =>
    f.equipamento.toLowerCase().includes(fleetSearch.toLowerCase()) ||
    f.placa.toLowerCase().includes(fleetSearch.toLowerCase()) ||
    f.operador_turno_a.toLowerCase().includes(fleetSearch.toLowerCase()) ||
    f.operador_turno_b.toLowerCase().includes(fleetSearch.toLowerCase())
  );

  const filteredMaint = maint.filter(m => {
    const matchSearch = m.tipo_equipamento.toLowerCase().includes(maintSearch.toLowerCase()) ||
      m.placa.toLowerCase().includes(maintSearch.toLowerCase()) ||
      m.motorista.toLowerCase().includes(maintSearch.toLowerCase());
    const matchFilter = maintFilter === 'todos' || m.status === maintFilter;
    return matchSearch && matchFilter;
  });

  // --- CHART DATA ---
  const maintByType: Record<string, number> = {};
  const maintByEquip: Record<string, number> = {};
  const maintByArea: Record<string, number> = {};
  const maintByStatus: Record<string, number> = {};
  const maintByMonth: Record<string, number> = {};
  const maintByLetra: Record<string, number> = {};

  maint.forEach(m => {
    maintByType[m.tipo_manutencao || 'Outros'] = (maintByType[m.tipo_manutencao || 'Outros'] || 0) + 1;
    const eqShort = m.tipo_equipamento.split(' ').slice(0, 3).join(' ');
    maintByEquip[eqShort] = (maintByEquip[eqShort] || 0) + 1;
    maintByArea[m.area || 'N/A'] = (maintByArea[m.area || 'N/A'] || 0) + 1;
    maintByStatus[m.status] = (maintByStatus[m.status] || 0) + 1;
    if (m.data) {
      const month = m.data.substring(0, 7);
      maintByMonth[month] = (maintByMonth[month] || 0) + 1;
    }
    if (m.letra) maintByLetra[m.letra] = (maintByLetra[m.letra] || 0) + 1;
  });

  const chartMaintType = Object.entries(maintByType).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  const chartMaintEquip = Object.entries(maintByEquip).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  const chartMaintArea = Object.entries(maintByArea).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const chartMaintStatus = Object.entries(maintByStatus).map(([name, value]) => ({ name, value }));
  const chartMaintMonth = Object.entries(maintByMonth).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
  const chartMaintLetra = Object.entries(maintByLetra).map(([name, value]) => ({ name: `Letra ${name}`, value }));

  const totalMaint = maint.length;
  const finalizados = maint.filter(m => m.status === 'FINALIZADO').length;
  const emAndamento = maint.filter(m => m.status === 'EM ANDAMENTO').length;
  const pendentes = maint.filter(m => m.status === 'PENDENTE').length;

  // Fleet form dialog
  const FleetFormDialog = () => (
    <Dialog open={fleetDialogOpen} onOpenChange={(open) => { setFleetDialogOpen(open); if (!open) { setEditFleet(null); setFleetForm(emptyFleet); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editFleet ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1"><Label>Equipamento *</Label><Input value={fleetForm.equipamento} onChange={e => setFleetForm({ ...fleetForm, equipamento: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Placa</Label><Input value={fleetForm.placa} onChange={e => setFleetForm({ ...fleetForm, placa: e.target.value })} /></div>
            <div className="space-y-1"><Label>Local</Label><Input value={fleetForm.local} onChange={e => setFleetForm({ ...fleetForm, local: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Operador Turno A</Label><Input value={fleetForm.operador_turno_a} onChange={e => setFleetForm({ ...fleetForm, operador_turno_a: e.target.value })} /></div>
            <div className="space-y-1"><Label>Operador Turno B</Label><Input value={fleetForm.operador_turno_b} onChange={e => setFleetForm({ ...fleetForm, operador_turno_b: e.target.value })} /></div>
          </div>
          <div className="space-y-1">
            <Label>Categoria</Label>
            <Select value={fleetForm.categoria} onValueChange={v => setFleetForm({ ...fleetForm, categoria: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={saveFleet} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Maintenance form dialog
  const MaintFormDialog = () => (
    <Dialog open={maintDialogOpen} onOpenChange={(open) => { setMaintDialogOpen(open); if (!open) { setEditMaint(null); setMaintForm(emptyMaint); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMaint ? 'Editar Registro' : 'Novo Registro de Manutenção'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Data</Label><Input type="date" value={maintForm.data} onChange={e => setMaintForm({ ...maintForm, data: e.target.value })} /></div>
            <div className="space-y-1"><Label>Placa *</Label><Input value={maintForm.placa} onChange={e => setMaintForm({ ...maintForm, placa: e.target.value })} /></div>
          </div>
          <div className="space-y-1"><Label>Tipo Equipamento *</Label><Input value={maintForm.tipo_equipamento} onChange={e => setMaintForm({ ...maintForm, tipo_equipamento: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Motorista</Label><Input value={maintForm.motorista} onChange={e => setMaintForm({ ...maintForm, motorista: e.target.value })} /></div>
            <div className="space-y-1"><Label>Letra</Label><Input value={maintForm.letra} onChange={e => setMaintForm({ ...maintForm, letra: e.target.value })} placeholder="A ou B" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Área</Label><Input value={maintForm.area} onChange={e => setMaintForm({ ...maintForm, area: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Tipo de Manutenção</Label>
              <Select value={maintForm.tipo_manutencao} onValueChange={v => setMaintForm({ ...maintForm, tipo_manutencao: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {TIPOS_MANUTENCAO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1"><Label>Serviço / Descrição</Label><Input value={maintForm.servico} onChange={e => setMaintForm({ ...maintForm, servico: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1"><Label>Início</Label><Input type="time" value={maintForm.inicio || ''} onChange={e => setMaintForm({ ...maintForm, inicio: e.target.value || null })} /></div>
            <div className="space-y-1"><Label>Liberação</Label><Input type="time" value={maintForm.liberacao || ''} onChange={e => setMaintForm({ ...maintForm, liberacao: e.target.value || null })} /></div>
            <div className="space-y-1"><Label>Horas Perdidas</Label><Input value={maintForm.horas_perdidas} onChange={e => setMaintForm({ ...maintForm, horas_perdidas: e.target.value })} placeholder="00:00:00" /></div>
          </div>
          <div className="space-y-1"><Label>Observação</Label><Input value={maintForm.observacao} onChange={e => setMaintForm({ ...maintForm, observacao: e.target.value })} /></div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={maintForm.status} onValueChange={v => setMaintForm({ ...maintForm, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_MANUTENCAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={saveMaint} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Truck className="w-6 h-6 text-primary" /> CCO / Informações
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Controle de frota, manutenção e indicadores operacionais</p>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="frota"><Truck className="w-4 h-4 mr-1.5" />Frota</TabsTrigger>
          <TabsTrigger value="manutencao"><Wrench className="w-4 h-4 mr-1.5" />Manutenção</TabsTrigger>
          <TabsTrigger value="graficos"><BarChart3 className="w-4 h-4 mr-1.5" />Gráficos</TabsTrigger>
        </TabsList>

        {/* === FROTA TAB === */}
        <TabsContent value="frota" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar equipamento, placa, operador..." value={fleetSearch} onChange={e => setFleetSearch(e.target.value)} />
            </div>
            <input ref={importFleetRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFleet} />
            <Button variant="outline" size="sm" onClick={() => importFleetRef.current?.click()}><Upload className="w-4 h-4 mr-1.5" />Importar</Button>
            <Button size="sm" onClick={() => { setEditFleet(null); setFleetForm(emptyFleet); setFleetDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1.5" />Novo Equipamento
            </Button>
          </div>

          {fleetLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Turno A</TableHead>
                    <TableHead>Turno B</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFleet.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum equipamento cadastrado</TableCell></TableRow>
                  ) : filteredFleet.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-sm">{item.equipamento}</TableCell>
                      <TableCell className="text-sm">{item.placa}</TableCell>
                      <TableCell className="text-sm">{item.local}</TableCell>
                      <TableCell className="text-sm">{item.operador_turno_a}</TableCell>
                      <TableCell className="text-sm">{item.operador_turno_b}</TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {CATEGORIAS.find(c => c.value === item.categoria)?.label || item.categoria}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditFleet(item)}><Edit className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteFleetId(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* === MANUTENÇÃO TAB === */}
        <TabsContent value="manutencao" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar equipamento, placa, motorista..." value={maintSearch} onChange={e => setMaintSearch(e.target.value)} />
            </div>
            <Select value={maintFilter} onValueChange={setMaintFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {STATUS_MANUTENCAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <input ref={importMaintRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportMaint} />
            <Button variant="outline" size="sm" onClick={() => importMaintRef.current?.click()}><Upload className="w-4 h-4 mr-1.5" />Importar</Button>
            <Button size="sm" onClick={() => { setEditMaint(null); setMaintForm(emptyMaint); setMaintDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1.5" />Novo Registro
            </Button>
          </div>

          {maintLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Letra</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Tipo Manut.</TableHead>
                    <TableHead>Horas Perd.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaint.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell></TableRow>
                  ) : filteredMaint.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm whitespace-nowrap">{item.data}</TableCell>
                      <TableCell className="text-sm font-medium">{item.placa}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{item.tipo_equipamento}</TableCell>
                      <TableCell className="text-sm">{item.motorista}</TableCell>
                      <TableCell className="text-sm">{item.letra}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{item.servico}</TableCell>
                      <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{item.tipo_manutencao}</span></TableCell>
                      <TableCell className="text-sm">{item.horas_perdidas}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.status === 'FINALIZADO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          item.status === 'EM ANDAMENTO' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>{item.status}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditMaint(item)}><Edit className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteMaintId(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* === GRÁFICOS TAB === */}
        <TabsContent value="graficos" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 text-center">
              <Wrench className="w-6 h-6 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{totalMaint}</p>
              <p className="text-xs text-muted-foreground">Total Registros</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto text-green-500 mb-1" />
              <p className="text-2xl font-bold">{finalizados}</p>
              <p className="text-xs text-muted-foreground">Finalizados</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
              <p className="text-2xl font-bold">{emAndamento}</p>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4 text-center">
              <AlertTriangle className="w-6 h-6 mx-auto text-destructive mb-1" />
              <p className="text-2xl font-bold">{pendentes}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Type */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Manutenções por Tipo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartMaintType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status Pie */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Status das Manutenções</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={chartMaintStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {chartMaintStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* By Equipment */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Top 10 Equipamentos com Mais Manutenções</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartMaintEquip}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="value" fill="hsl(210, 70%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By Area */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Manutenções por Área</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={chartMaintArea} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {chartMaintArea.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Timeline */}
            <div className="glass-card rounded-xl p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold mb-4">Evolução Mensal de Manutenções</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartMaintMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* By Letra */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Manutenções por Letra (Turno)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartMaintLetra}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="value" fill="hsl(150, 60%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Fleet summary */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Resumo da Frota</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{fleet.length}</p>
                  <p className="text-xs text-muted-foreground">Total Equipamentos</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">
                    {new Set(fleet.map(f => f.operador_turno_a).filter(Boolean).concat(fleet.map(f => f.operador_turno_b).filter(Boolean))).size}
                  </p>
                  <p className="text-xs text-muted-foreground">Operadores Ativos</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{fleet.filter(f => f.categoria === 'porto').length}</p>
                  <p className="text-xs text-muted-foreground">Porto</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{fleet.filter(f => f.categoria === 'reserva').length}</p>
                  <p className="text-xs text-muted-foreground">Reservas</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <FleetFormDialog />
      <MaintFormDialog />

      {/* Delete confirmations */}
      <AlertDialog open={!!deleteFleetId} onOpenChange={(open) => !open && setDeleteFleetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFleet}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteMaintId} onOpenChange={(open) => !open && setDeleteMaintId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro de manutenção?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteMaint}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
