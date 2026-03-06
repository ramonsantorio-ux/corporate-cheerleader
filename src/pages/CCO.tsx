import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Plus, Search, Edit, Trash2, Loader2, Download, Upload, Truck, Wrench,
  BarChart3, Clock, AlertTriangle, CheckCircle2, FileText, FileSpreadsheet, ClipboardList
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, ReferenceLine
} from 'recharts';

// ===== TYPES =====
interface FleetItem {
  id: string; equipamento: string; placa: string; local: string;
  operador_turno_a: string; operador_turno_b: string; categoria: string; tipo: string;
  created_at: string; updated_at: string;
}
interface MaintenanceItem {
  id: string; data: string; placa: string; tipo_equipamento: string; motorista: string;
  letra: string; area: string; servico: string; tipo_manutencao: string;
  inicio: string | null; liberacao: string | null; horas_perdidas: string;
  observacao: string; status: string; created_at: string;
}
interface ThirdPartyItem {
  id: string; os: string; data: string; status: string; dono: string;
  tipo_equipamento: string; tag: string; atendimento: string; desvio: string;
  justificativa: string; df_percent: number | null;
  hora_prog_inicio: string; hora_prog_final: string; total_hora_prog: number | null;
  hora_real_inicio: string; hora_real_final: string; total_hora_real: number | null;
  aderencia: number | null; created_at: string;
}

// ===== CONSTANTS =====
const CATEGORIAS = [
  { value: 'porto', label: 'Porto' },
  { value: 'porto_tpm', label: 'Porto - TPM' },
  { value: 'reserva', label: 'Reserva' },
];
const STATUS_MANUTENCAO = ['EM ANDAMENTO', 'FINALIZADO', 'PENDENTE'];
const TIPOS_MANUTENCAO = [
  'ELÉTRICA', 'MECÂNICA', 'ESTRUTURA', 'SOLDA', 'PNEU', 'FREIO', 'MOLA',
  'GERAL', 'HIDRÁULICA', 'PREVENTIVA', 'CHECK LIST', 'ATRASO', 'ABASTECIMENTO', 'OUTROS',
];
const DONOS = ['BUSATO', 'CORRETA AMBIENTAL', 'AMBIPAR', 'HF'];
const STATUS_TERCEIRO = ['Finalizada', 'Em Andamento', 'Pendente'];
const CHART_COLORS = [
  'hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(210, 70%, 55%)',
  'hsl(150, 60%, 45%)', 'hsl(45, 90%, 55%)', 'hsl(280, 60%, 55%)',
  'hsl(330, 60%, 55%)', 'hsl(180, 50%, 45%)', 'hsl(30, 80%, 50%)', 'hsl(0, 70%, 50%)',
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
const emptyThirdParty: Omit<ThirdPartyItem, 'id' | 'created_at'> = {
  os: '', data: new Date().toISOString().split('T')[0], status: 'Finalizada', dono: 'BUSATO',
  tipo_equipamento: '', tag: '', atendimento: 'Sim', desvio: '', justificativa: '',
  df_percent: null, hora_prog_inicio: '', hora_prog_final: '', total_hora_prog: null,
  hora_real_inicio: '', hora_real_final: '', total_hora_real: null, aderencia: null,
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

  // Third party state
  const [thirdParty, setThirdParty] = useState<ThirdPartyItem[]>([]);
  const [tpSearch, setTpSearch] = useState('');
  const [tpLoading, setTpLoading] = useState(true);
  const [tpDialogOpen, setTpDialogOpen] = useState(false);
  const [editTp, setEditTp] = useState<ThirdPartyItem | null>(null);
  const [tpForm, setTpForm] = useState(emptyThirdParty);
  const [deleteTpId, setDeleteTpId] = useState<string | null>(null);
  const [tpDonoFilter, setTpDonoFilter] = useState('todos');

  const importFleetRef = useRef<HTMLInputElement>(null);
  const importMaintRef = useRef<HTMLInputElement>(null);
  const importTpRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchFleet(); fetchMaint(); fetchThirdParty(); }, []);

  // ===== FLEET CRUD =====
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
    setFleetForm({ equipamento: item.equipamento, placa: item.placa, local: item.local, operador_turno_a: item.operador_turno_a, operador_turno_b: item.operador_turno_b, categoria: item.categoria, tipo: item.tipo });
    setFleetDialogOpen(true);
  }

  // ===== MAINTENANCE CRUD =====
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
    setMaintForm({ data: item.data, placa: item.placa, tipo_equipamento: item.tipo_equipamento, motorista: item.motorista, letra: item.letra, area: item.area, servico: item.servico, tipo_manutencao: item.tipo_manutencao, inicio: item.inicio, liberacao: item.liberacao, horas_perdidas: item.horas_perdidas, observacao: item.observacao, status: item.status });
    setMaintDialogOpen(true);
  }

  // ===== THIRD PARTY CRUD =====
  async function fetchThirdParty() {
    setTpLoading(true);
    const { data } = await supabase.from('cco_third_party').select('*').order('data', { ascending: false });
    setThirdParty((data || []) as ThirdPartyItem[]);
    setTpLoading(false);
  }
  async function saveThirdParty() {
    if (!tpForm.os && !tpForm.tag) { toast.error('OS ou TAG é obrigatório'); return; }
    if (editTp) {
      const { error } = await supabase.from('cco_third_party').update(tpForm).eq('id', editTp.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Registro atualizado!');
    } else {
      const { error } = await supabase.from('cco_third_party').insert(tpForm);
      if (error) { toast.error('Erro ao cadastrar'); return; }
      toast.success('Registro cadastrado!');
    }
    setTpDialogOpen(false); setEditTp(null); setTpForm(emptyThirdParty); fetchThirdParty();
  }
  async function deleteThirdParty() {
    if (!deleteTpId) return;
    await supabase.from('cco_third_party').delete().eq('id', deleteTpId);
    setDeleteTpId(null); toast.success('Removido!'); fetchThirdParty();
  }
  function openEditTp(item: ThirdPartyItem) {
    setEditTp(item);
    setTpForm({ os: item.os, data: item.data, status: item.status, dono: item.dono, tipo_equipamento: item.tipo_equipamento, tag: item.tag, atendimento: item.atendimento, desvio: item.desvio, justificativa: item.justificativa, df_percent: item.df_percent, hora_prog_inicio: item.hora_prog_inicio, hora_prog_final: item.hora_prog_final, total_hora_prog: item.total_hora_prog, hora_real_inicio: item.hora_real_inicio, hora_real_final: item.hora_real_final, total_hora_real: item.total_hora_real, aderencia: item.aderencia });
    setTpDialogOpen(true);
  }

  // ===== IMPORT =====
  async function handleImportFleet(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const ab = await file.arrayBuffer(); const wb = XLSX.read(ab); const ws = wb.Sheets[wb.SheetNames[0]];
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
      const ab = await file.arrayBuffer(); const wb = XLSX.read(ab); const ws = wb.Sheets[wb.SheetNames[0]];
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
  async function handleImportTp(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const ab = await file.arrayBuffer(); const wb = XLSX.read(ab); const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
      const records = rows.map(r => ({
        os: String(r['OS'] || '').trim(),
        data: String(r['Data Prog.'] || r['Data'] || '').trim() || new Date().toISOString().split('T')[0],
        status: String(r['Status'] || 'Finalizada').trim(),
        dono: String(r['Dono'] || 'BUSATO').trim(),
        tipo_equipamento: String(r['Tipo Equipamento'] || '').trim(),
        tag: String(r['TAG'] || '').trim(),
        atendimento: String(r['Atendimento'] || 'Sim').trim(),
        desvio: String(r['Desvio'] || '').trim(),
        justificativa: String(r['Justificativa'] || '').trim(),
        df_percent: r['% DF'] ? parseFloat(String(r['% DF']).replace('%', '').replace(',', '.')) : null,
        hora_prog_inicio: String(r['H.I Prog.'] || '').trim(),
        hora_prog_final: String(r['H.F Prog.'] || '').trim(),
        total_hora_prog: r['Total H. Prog'] ? parseFloat(String(r['Total H. Prog']).replace(',', '.')) : null,
        hora_real_inicio: String(r['H. I. Real'] || '').trim(),
        hora_real_final: String(r['H. F Real'] || '').trim(),
        total_hora_real: r['Total. H Real'] ? parseFloat(String(r['Total. H Real']).replace(',', '.')) : null,
        aderencia: r['% Aderência'] ? parseFloat(String(r['% Aderência']).replace('%', '').replace(',', '.')) : null,
      })).filter(r => r.os || r.tag);
      if (records.length === 0) { toast.error('Nenhum registro válido'); return; }
      const { error } = await supabase.from('cco_third_party').insert(records);
      if (error) toast.error('Erro: ' + error.message);
      else { toast.success(`${records.length} registros importados!`); fetchThirdParty(); }
    } catch { toast.error('Erro ao ler arquivo'); }
    if (importTpRef.current) importTpRef.current.value = '';
  }

  // ===== DOWNLOAD =====
  function downloadExcel(sheetName: string, data: Record<string, any>[]) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
  function downloadPDF(title: string, headers: string[], rows: string[][]) {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16); doc.text(title, 14, 18);
    doc.setFontSize(9); doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 25);
    autoTable(doc, { head: [headers], body: rows, startY: 30, styles: { fontSize: 7 }, headStyles: { fillColor: [0, 102, 102] } });
    doc.save(`${title}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  function exportFleet(format: 'xlsx' | 'pdf') {
    const data = fleet.map(f => ({ Equipamento: f.equipamento, Placa: f.placa, Local: f.local, 'Turno A': f.operador_turno_a, 'Turno B': f.operador_turno_b, Categoria: f.categoria }));
    if (format === 'xlsx') downloadExcel('Frota', data);
    else downloadPDF('Controle de Frota', ['Equipamento', 'Placa', 'Local', 'Turno A', 'Turno B', 'Categoria'], data.map(d => [d.Equipamento, d.Placa, d.Local, d['Turno A'], d['Turno B'], d.Categoria]));
  }
  function exportMaint(format: 'xlsx' | 'pdf') {
    const data = maint.map(m => ({ Data: m.data, Placa: m.placa, 'Tipo Equipamento': m.tipo_equipamento, Motorista: m.motorista, Letra: m.letra, Área: m.area, Serviço: m.servico, 'Tipo Manutenção': m.tipo_manutencao, Início: m.inicio || '', Liberação: m.liberacao || '', 'Horas Perdidas': m.horas_perdidas, Status: m.status }));
    if (format === 'xlsx') downloadExcel('Manutencao', data);
    else downloadPDF('Controle de Manutenção', Object.keys(data[0] || {}), data.map(d => Object.values(d)));
  }
  function exportThirdParty(format: 'xlsx' | 'pdf') {
    const data = thirdParty.map(t => ({ OS: t.os, Data: t.data, Status: t.status, Dono: t.dono, 'Tipo Equipamento': t.tipo_equipamento, TAG: t.tag, Atendimento: t.atendimento, Desvio: t.desvio, Justificativa: t.justificativa, '% DF': t.df_percent != null ? `${t.df_percent}%` : '', 'H.I Prog': t.hora_prog_inicio, 'H.F Prog': t.hora_prog_final, 'Total H.Prog': t.total_hora_prog ?? '', 'H.I Real': t.hora_real_inicio, 'H.F Real': t.hora_real_final, 'Total H.Real': t.total_hora_real ?? '', '% Aderência': t.aderencia != null ? `${t.aderencia}%` : '' }));
    if (format === 'xlsx') downloadExcel('Equipamentos_Terceiros', data);
    else downloadPDF('Equipamentos Terceiros', Object.keys(data[0] || {}), data.map(d => Object.values(d).map(String)));
  }

  const DownloadBtn = ({ onExport }: { onExport: (f: 'xlsx' | 'pdf') => void }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1.5" />Download</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onExport('xlsx')}><FileSpreadsheet className="w-4 h-4 mr-2" />Excel (.xlsx)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('pdf')}><FileText className="w-4 h-4 mr-2" />PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ===== FILTERS =====
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
  const filteredTp = thirdParty.filter(t => {
    const matchSearch = t.os.toLowerCase().includes(tpSearch.toLowerCase()) ||
      t.tag.toLowerCase().includes(tpSearch.toLowerCase()) ||
      t.tipo_equipamento.toLowerCase().includes(tpSearch.toLowerCase()) ||
      t.dono.toLowerCase().includes(tpSearch.toLowerCase());
    const matchDono = tpDonoFilter === 'todos' || t.dono === tpDonoFilter;
    return matchSearch && matchDono;
  });

  // Fleet groups
  const fleetPorto = filteredFleet.filter(f => f.categoria === 'porto');
  const fleetTpm = filteredFleet.filter(f => f.categoria === 'porto_tpm');
  const fleetReserva = filteredFleet.filter(f => f.categoria === 'reserva');

  // ===== MAINT CHART DATA =====
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
    if (m.data) { const month = m.data.substring(0, 7); maintByMonth[month] = (maintByMonth[month] || 0) + 1; }
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

  function parseHMS(hms: string): number {
    if (!hms) return 0; const parts = hms.split(':').map(Number);
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  function formatHMS(totalSec: number): string {
    const h = Math.floor(totalSec / 3600); const m = Math.floor((totalSec % 3600) / 60); const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  const totalHorasPerdidas = filteredMaint.reduce((sum, m) => sum + parseHMS(m.horas_perdidas), 0);
  const totalEquipamentos = fleet.filter(f => f.categoria !== 'reserva').length;
  const totalHorasDisp = totalEquipamentos * 10 * 3600;
  const aderencia = totalHorasDisp > 0 ? ((totalHorasDisp - totalHorasPerdidas) / totalHorasDisp * 100) : 100;

  // ===== THIRD PARTY CHART DATA =====
  // DF by company
  const tpByDono: Record<string, { total: number; atendidas: number }> = {};
  thirdParty.forEach(t => {
    if (!tpByDono[t.dono]) tpByDono[t.dono] = { total: 0, atendidas: 0 };
    tpByDono[t.dono].total++;
    if (t.atendimento === 'Sim') tpByDono[t.dono].atendidas++;
  });
  const chartDfByDono = Object.entries(tpByDono).map(([name, v]) => ({ name, df: v.total > 0 ? +(v.atendidas / v.total * 100).toFixed(1) : 0, total: v.total }));

  // DF by equipment type
  const tpByEquip: Record<string, { total: number; atendidas: number }> = {};
  thirdParty.forEach(t => {
    const eq = t.tipo_equipamento || 'N/A';
    if (!tpByEquip[eq]) tpByEquip[eq] = { total: 0, atendidas: 0 };
    tpByEquip[eq].total++;
    if (t.atendimento === 'Sim') tpByEquip[eq].atendidas++;
  });
  const chartDfByEquip = Object.entries(tpByEquip).map(([name, v]) => ({ name, df: v.total > 0 ? +(v.atendidas / v.total * 100).toFixed(1) : 0, total: v.total })).sort((a, b) => a.df - b.df);

  // Attendance status
  const atendidas = thirdParty.filter(t => t.atendimento === 'Sim').length;
  const naoAtendidas = thirdParty.filter(t => t.atendimento === 'Não').length;
  const chartAtendimento = [
    { name: 'OS Atendida', value: atendidas },
    { name: 'Não Atendimento', value: naoAtendidas },
  ];

  // Loss reasons
  const tpByDesvio: Record<string, number> = {};
  thirdParty.filter(t => t.desvio).forEach(t => { tpByDesvio[t.desvio] = (tpByDesvio[t.desvio] || 0) + 1; });
  const chartDesvios = Object.entries(tpByDesvio).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // DF by month
  const tpByMonth: Record<string, { total: number; atendidas: number }> = {};
  thirdParty.forEach(t => {
    const month = t.data.substring(0, 7);
    if (!tpByMonth[month]) tpByMonth[month] = { total: 0, atendidas: 0 };
    tpByMonth[month].total++;
    if (t.atendimento === 'Sim') tpByMonth[month].atendidas++;
  });
  const chartDfByMonth = Object.entries(tpByMonth).map(([name, v]) => ({ name, df: v.total > 0 ? +(v.atendidas / v.total * 100).toFixed(1) : 0 })).sort((a, b) => a.name.localeCompare(b.name));

  // Measurement summary by TAG
  const tpByTag: Record<string, { prog: number; real: number }> = {};
  thirdParty.filter(t => t.total_hora_prog != null).forEach(t => {
    if (!tpByTag[t.tag]) tpByTag[t.tag] = { prog: 0, real: 0 };
    tpByTag[t.tag].prog += t.total_hora_prog || 0;
    tpByTag[t.tag].real += t.total_hora_real || 0;
  });
  const measurementSummary = Object.entries(tpByTag).map(([tag, v]) => ({ tag, prog: +v.prog.toFixed(2), real: +v.real.toFixed(2), aderencia: v.prog > 0 ? +(v.real / v.prog * 100).toFixed(2) : 0 })).sort((a, b) => a.aderencia - b.aderencia);
  const totalProg = measurementSummary.reduce((s, m) => s + m.prog, 0);
  const totalReal = measurementSummary.reduce((s, m) => s + m.real, 0);
  const totalAderenciaCalc = totalProg > 0 ? +(totalReal / totalProg * 100).toFixed(2) : 0;

  // ===== TOOLTIP STYLE =====
  const tooltipStyle = { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 };

  // ===== FORM DIALOGS =====
  const FleetFormDialog = () => (
    <Dialog open={fleetDialogOpen} onOpenChange={(open) => { setFleetDialogOpen(open); if (!open) { setEditFleet(null); setFleetForm(emptyFleet); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editFleet ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle></DialogHeader>
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
              <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={saveFleet} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const MaintFormDialog = () => (
    <Dialog open={maintDialogOpen} onOpenChange={(open) => { setMaintDialogOpen(open); if (!open) { setEditMaint(null); setMaintForm(emptyMaint); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editMaint ? 'Editar Registro' : 'Novo Registro de Manutenção'}</DialogTitle></DialogHeader>
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
                <SelectContent>{TIPOS_MANUTENCAO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
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
              <SelectContent>{STATUS_MANUTENCAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={saveMaint} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const TpFormDialog = () => (
    <Dialog open={tpDialogOpen} onOpenChange={(open) => { setTpDialogOpen(open); if (!open) { setEditTp(null); setTpForm(emptyThirdParty); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editTp ? 'Editar Registro' : 'Novo Registro - Equipamento Terceiro'}</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>OS</Label><Input value={tpForm.os} onChange={e => setTpForm({ ...tpForm, os: e.target.value })} /></div>
            <div className="space-y-1"><Label>Data</Label><Input type="date" value={tpForm.data} onChange={e => setTpForm({ ...tpForm, data: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Dono (Empresa)</Label>
              <Select value={tpForm.dono} onValueChange={v => setTpForm({ ...tpForm, dono: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DONOS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={tpForm.status} onValueChange={v => setTpForm({ ...tpForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_TERCEIRO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1"><Label>Tipo Equipamento</Label><Input value={tpForm.tipo_equipamento} onChange={e => setTpForm({ ...tpForm, tipo_equipamento: e.target.value })} /></div>
          <div className="space-y-1"><Label>TAG (Identificador)</Label><Input value={tpForm.tag} onChange={e => setTpForm({ ...tpForm, tag: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Atendimento</Label>
              <Select value={tpForm.atendimento} onValueChange={v => setTpForm({ ...tpForm, atendimento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>% DF</Label><Input type="number" step="0.01" value={tpForm.df_percent ?? ''} onChange={e => setTpForm({ ...tpForm, df_percent: e.target.value ? parseFloat(e.target.value) : null })} /></div>
          </div>
          <div className="space-y-1"><Label>Desvio</Label><Input value={tpForm.desvio} onChange={e => setTpForm({ ...tpForm, desvio: e.target.value })} /></div>
          <div className="space-y-1"><Label>Justificativa</Label><Textarea value={tpForm.justificativa} onChange={e => setTpForm({ ...tpForm, justificativa: e.target.value })} /></div>
          <p className="text-xs font-semibold text-muted-foreground pt-2">Dados para Medição</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1"><Label>H.I Programado</Label><Input value={tpForm.hora_prog_inicio} onChange={e => setTpForm({ ...tpForm, hora_prog_inicio: e.target.value })} placeholder="00:00:00" /></div>
            <div className="space-y-1"><Label>H.F Programado</Label><Input value={tpForm.hora_prog_final} onChange={e => setTpForm({ ...tpForm, hora_prog_final: e.target.value })} placeholder="00:00:00" /></div>
            <div className="space-y-1"><Label>Total H. Prog</Label><Input type="number" step="0.01" value={tpForm.total_hora_prog ?? ''} onChange={e => setTpForm({ ...tpForm, total_hora_prog: e.target.value ? parseFloat(e.target.value) : null })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1"><Label>H.I Real</Label><Input value={tpForm.hora_real_inicio} onChange={e => setTpForm({ ...tpForm, hora_real_inicio: e.target.value })} placeholder="00:00:00" /></div>
            <div className="space-y-1"><Label>H.F Real</Label><Input value={tpForm.hora_real_final} onChange={e => setTpForm({ ...tpForm, hora_real_final: e.target.value })} placeholder="00:00:00" /></div>
            <div className="space-y-1"><Label>Total H. Real</Label><Input type="number" step="0.01" value={tpForm.total_hora_real ?? ''} onChange={e => setTpForm({ ...tpForm, total_hora_real: e.target.value ? parseFloat(e.target.value) : null })} /></div>
          </div>
          <div className="space-y-1"><Label>% Aderência</Label><Input type="number" step="0.01" value={tpForm.aderencia ?? ''} onChange={e => setTpForm({ ...tpForm, aderencia: e.target.value ? parseFloat(e.target.value) : null })} /></div>
          <Button onClick={saveThirdParty} className="w-full">Salvar</Button>
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
        <p className="text-muted-foreground text-sm mt-1">Controle de frota, manutenção, equipamentos terceiros e indicadores operacionais</p>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="frota"><Truck className="w-4 h-4 mr-1" />Frota</TabsTrigger>
          <TabsTrigger value="manutencao"><Wrench className="w-4 h-4 mr-1" />Manutenção</TabsTrigger>
          <TabsTrigger value="terceiros"><ClipboardList className="w-4 h-4 mr-1" />Terceiros</TabsTrigger>
          <TabsTrigger value="medicao"><FileText className="w-4 h-4 mr-1" />Medição</TabsTrigger>
          <TabsTrigger value="graficos"><BarChart3 className="w-4 h-4 mr-1" />Gráficos</TabsTrigger>
        </TabsList>

        {/* ===== FROTA TAB ===== */}
        <TabsContent value="frota" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar equipamento, placa, operador..." value={fleetSearch} onChange={e => setFleetSearch(e.target.value)} />
            </div>
            <input ref={importFleetRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFleet} />
            <DownloadBtn onExport={exportFleet} />
            <Button variant="outline" size="sm" onClick={() => importFleetRef.current?.click()}><Upload className="w-4 h-4 mr-1.5" />Importar</Button>
            <Button size="sm" onClick={() => { setEditFleet(null); setFleetForm(emptyFleet); setFleetDialogOpen(true); }}><Plus className="w-4 h-4 mr-1.5" />Novo</Button>
          </div>
          {fleetLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-6">
              {[
                { title: 'TURNO - PORTO', data: fleetPorto, color: 'bg-primary/10 text-primary' },
                { title: 'TURNO - PORTO - TPM', data: fleetTpm, color: 'bg-chart-2/20 text-foreground' },
                { title: 'RESERVAS', data: fleetReserva, color: 'bg-destructive/10 text-destructive' },
              ].filter(g => g.data.length > 0).map(group => (
                <div key={group.title} className="glass-card rounded-xl overflow-hidden">
                  <div className={`px-4 py-2 font-bold text-sm ${group.color} border-b border-border`}>{group.title} ({group.data.length})</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipamento</TableHead><TableHead>Placa</TableHead><TableHead>Local</TableHead>
                        <TableHead>Turno A</TableHead><TableHead>Turno B</TableHead><TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.data.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-sm">{item.equipamento}</TableCell>
                          <TableCell className="text-sm font-mono">{item.placa}</TableCell>
                          <TableCell className="text-sm">{item.local}</TableCell>
                          <TableCell className="text-sm"><span className={item.operador_turno_a.includes('NOVATO') ? 'font-bold' : ''}>{item.operador_turno_a}</span></TableCell>
                          <TableCell className="text-sm">
                            <span className={
                              item.operador_turno_b.includes('EXTRA') ? 'px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs' :
                              item.operador_turno_b.includes('férias') || item.operador_turno_b.includes('FÉRIAS') ? 'px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs' :
                              item.operador_turno_b.includes('NOVATO') ? 'font-bold' : ''
                            }>{item.operador_turno_b}</span>
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
              ))}
              <div className="glass-card rounded-xl p-4">
                <h4 className="text-sm font-semibold mb-2">LEGENDA</h4>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-300" /> FÉRIAS</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-400" /> EXTRA</span>
                  <span className="flex items-center gap-1.5"><span className="font-bold">NEGRITO</span> NOVOS</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive" /> ALUGADO</span>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== MANUTENÇÃO TAB ===== */}
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
            <DownloadBtn onExport={exportMaint} />
            <Button variant="outline" size="sm" onClick={() => importMaintRef.current?.click()}><Upload className="w-4 h-4 mr-1.5" />Importar</Button>
            <Button size="sm" onClick={() => { setEditMaint(null); setMaintForm(emptyMaint); setMaintDialogOpen(true); }}><Plus className="w-4 h-4 mr-1.5" />Novo</Button>
          </div>
          {maintLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-destructive/10 text-destructive font-bold text-sm border-b border-border">EM MANUTENÇÃO ({filteredMaint.length})</div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead><TableHead>Placa</TableHead><TableHead>Tipo Equipamento</TableHead>
                        <TableHead>Motorista</TableHead><TableHead>Letra</TableHead><TableHead>Área</TableHead>
                        <TableHead>Serviço</TableHead><TableHead>Tipo Manut.</TableHead><TableHead>Início</TableHead>
                        <TableHead>Liberação</TableHead><TableHead>Horas Perd.</TableHead><TableHead>Status</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMaint.length === 0 ? (
                        <TableRow><TableCell colSpan={13} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell></TableRow>
                      ) : filteredMaint.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm whitespace-nowrap">{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-sm font-mono font-medium">{item.placa}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{item.tipo_equipamento}</TableCell>
                          <TableCell className="text-sm">{item.motorista}</TableCell>
                          <TableCell className="text-sm text-center font-medium">{item.letra}</TableCell>
                          <TableCell className="text-sm">{item.area}</TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">{item.servico}</TableCell>
                          <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{item.tipo_manutencao}</span></TableCell>
                          <TableCell className="text-sm">
                            <span className={item.inicio ? 'px-1.5 py-0.5 rounded bg-destructive/20 text-destructive text-xs font-medium' : ''}>{item.inicio || '—'}</span>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className={item.liberacao ? 'px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium' : ''}>{item.liberacao || '—'}</span>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{item.horas_perdidas}</TableCell>
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
              </div>
              <div className="glass-card rounded-xl p-5 border-l-4 border-primary">
                <h4 className="text-sm font-bold mb-4 text-primary">RESUMO DO PERÍODO</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">TOTAL HORAS PERDIDAS</p><p className="text-lg font-bold">{formatHMS(totalHorasPerdidas)}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">TOTAL DE EQUIPAMENTOS</p><p className="text-lg font-bold">{totalEquipamentos}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">TOTAL REGISTROS</p><p className="text-lg font-bold">{filteredMaint.length}</p></div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground">ADERÊNCIA</p>
                    <p className={`text-2xl font-bold ${aderencia >= 95 ? 'text-green-600 dark:text-green-400' : aderencia >= 90 ? 'text-yellow-600 dark:text-yellow-400' : 'text-destructive'}`}>{aderencia.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ===== TERCEIROS TAB ===== */}
        <TabsContent value="terceiros" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar OS, TAG, equipamento, empresa..." value={tpSearch} onChange={e => setTpSearch(e.target.value)} />
            </div>
            <Select value={tpDonoFilter} onValueChange={setTpDonoFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Empresas</SelectItem>
                {DONOS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <input ref={importTpRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportTp} />
            <DownloadBtn onExport={exportThirdParty} />
            <Button variant="outline" size="sm" onClick={() => importTpRef.current?.click()}><Upload className="w-4 h-4 mr-1.5" />Importar</Button>
            <Button size="sm" onClick={() => { setEditTp(null); setTpForm(emptyThirdParty); setTpDialogOpen(true); }}><Plus className="w-4 h-4 mr-1.5" />Novo</Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{thirdParty.length}</p>
              <p className="text-xs text-muted-foreground">Total OS</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{atendidas}</p>
              <p className="text-xs text-muted-foreground">OS Atendidas</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{naoAtendidas}</p>
              <p className="text-xs text-muted-foreground">Não Atendidas</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center border border-primary/20">
              <p className={`text-2xl font-bold ${thirdParty.length > 0 ? (atendidas / thirdParty.length * 100 >= 95 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600') : ''}`}>
                {thirdParty.length > 0 ? (atendidas / thirdParty.length * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">DF Geral</p>
            </div>
          </div>

          {tpLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-primary/10 text-primary font-bold text-sm border-b border-border">
                DETALHAMENTO - DEMANDAS ({filteredTp.length})
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OS</TableHead><TableHead>Data</TableHead><TableHead>Dono</TableHead>
                      <TableHead>Tipo Equipamento</TableHead><TableHead>% DF</TableHead>
                      <TableHead>Atendimento</TableHead><TableHead>Desvio</TableHead>
                      <TableHead>Justificativa</TableHead><TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTp.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum registro</TableCell></TableRow>
                    ) : filteredTp.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm font-mono font-medium">{item.os}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-sm">{item.dono}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{item.tipo_equipamento}</TableCell>
                        <TableCell className="text-sm">
                          <span className={`font-medium ${item.df_percent != null && item.df_percent === 0 ? 'text-destructive' : item.df_percent != null && item.df_percent >= 95 ? 'text-green-600 dark:text-green-400' : ''}`}>
                            {item.df_percent != null ? `${item.df_percent.toFixed(2)}%` : '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.atendimento === 'Sim' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {item.atendimento}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">{item.desvio || '—'}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{item.justificativa || '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTp(item)}><Edit className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTpId(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== MEDIÇÃO TAB ===== */}
        <TabsContent value="medicao" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h3 className="text-lg font-semibold">Dados Para Medição</h3>
            <DownloadBtn onExport={exportThirdParty} />
          </div>

          {/* Summary by TAG */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-primary/10 text-primary font-bold text-sm border-b border-border">RESUMO POR TAG</div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TAG</TableHead><TableHead className="text-right">Hora Programado</TableHead>
                    <TableHead className="text-right">Hora Realizado</TableHead><TableHead className="text-right">% Aderência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {measurementSummary.map(m => (
                    <TableRow key={m.tag}>
                      <TableCell className="text-sm">{m.tag}</TableCell>
                      <TableCell className="text-sm text-right">{m.prog.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-right">{m.real.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-medium ${m.aderencia >= 95 ? 'text-green-600 dark:text-green-400' : m.aderencia >= 85 ? 'text-yellow-600' : 'text-destructive'}`}>
                          {m.aderencia.toFixed(2)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 border-primary font-bold">
                    <TableCell className="text-sm font-bold">Total</TableCell>
                    <TableCell className="text-sm text-right font-bold">{totalProg.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-right font-bold">{totalReal.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-bold ${totalAderenciaCalc >= 95 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600'}`}>
                        {totalAderenciaCalc.toFixed(2)}%
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Detailed OS table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-muted/50 font-bold text-sm border-b border-border">DETALHAMENTO POR OS</div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>OS</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead>
                    <TableHead>TAG</TableHead><TableHead>Atendimento</TableHead>
                    <TableHead>H.I Prog</TableHead><TableHead>H.F Prog</TableHead><TableHead>Total H.Prog</TableHead>
                    <TableHead>H.I Real</TableHead><TableHead>H.F Real</TableHead><TableHead>Total H.Real</TableHead>
                    <TableHead>% Aderência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {thirdParty.filter(t => t.total_hora_prog != null).map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm font-mono">{item.os}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{item.status}</span></TableCell>
                      <TableCell className="text-xs max-w-[250px] truncate">{item.tag}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.atendimento === 'Sim' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {item.atendimento}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{item.hora_prog_inicio || '—'}</TableCell>
                      <TableCell className="text-sm">{item.hora_prog_final || '—'}</TableCell>
                      <TableCell className="text-sm font-medium">{item.total_hora_prog?.toFixed(2) ?? '—'}</TableCell>
                      <TableCell className="text-sm">{item.hora_real_inicio || '—'}</TableCell>
                      <TableCell className="text-sm">{item.hora_real_final || '—'}</TableCell>
                      <TableCell className="text-sm font-medium">{item.total_hora_real?.toFixed(2) ?? '—'}</TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${(item.aderencia ?? 0) >= 95 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600'}`}>
                          {item.aderencia != null ? `${item.aderencia.toFixed(2)}%` : '—'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Adherence chart */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">Aderência por TAG</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={measurementSummary} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <YAxis dataKey="tag" type="category" width={200} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                <ReferenceLine x={95} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'Meta 95%', position: 'top', fontSize: 10 }} />
                <Bar dataKey="aderencia" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* ===== GRÁFICOS TAB ===== */}
        <TabsContent value="graficos" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 text-center">
              <Wrench className="w-6 h-6 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{totalMaint}</p><p className="text-xs text-muted-foreground">Total Manutenções</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{finalizados}</p><p className="text-xs text-muted-foreground">Finalizados</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 mx-auto text-yellow-500 mb-1" /><p className="text-2xl font-bold">{emAndamento}</p><p className="text-xs text-muted-foreground">Em Andamento</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4 text-center">
              <AlertTriangle className="w-6 h-6 mx-auto text-destructive mb-1" /><p className="text-2xl font-bold">{pendentes}</p><p className="text-xs text-muted-foreground">Pendentes</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maint by Type */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Manutenções por Tipo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartMaintType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
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
                  </Pie><Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* DF by Company - Third Party */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">DF por Empresa (Terceiros)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartDfByDono}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                  <ReferenceLine y={95} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'Meta', fontSize: 10 }} />
                  <Bar dataKey="df" fill="hsl(150, 60%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Attendance Status */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Status de Atendimento</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={chartAtendimento} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                    <Cell fill="hsl(var(--primary))" /><Cell fill="hsl(var(--destructive))" />
                  </Pie><Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* DF by Equipment Type */}
            <div className="glass-card rounded-xl p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold mb-4">DF por Tipo de Equipamento</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartDfByEquip}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={100} /><YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                  <ReferenceLine y={95} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'Meta 95%', fontSize: 10 }} />
                  <Bar dataKey="df" fill="hsl(210, 70%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Loss Reasons */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Motivos de Perda da DF</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartDesvios}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={80} /><YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* DF Monthly */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">DF por Período (Mensal)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartDfByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                  <ReferenceLine y={95} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="df" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Maint timeline */}
            <div className="glass-card rounded-xl p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold mb-4">Evolução Mensal de Manutenções</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartMaintMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* By Letra */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Manutenções por Turno</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartMaintLetra}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" fill="hsl(150, 60%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Fleet summary */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Resumo da Frota</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-primary">{fleet.length}</p><p className="text-xs text-muted-foreground">Total Equipamentos</p></div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{new Set(fleet.map(f => f.operador_turno_a).filter(Boolean).concat(fleet.map(f => f.operador_turno_b).filter(Boolean))).size}</p>
                  <p className="text-xs text-muted-foreground">Operadores Ativos</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-primary">{fleet.filter(f => f.categoria === 'porto').length}</p><p className="text-xs text-muted-foreground">Porto</p></div>
                <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-primary">{fleet.filter(f => f.categoria === 'reserva').length}</p><p className="text-xs text-muted-foreground">Reservas</p></div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <FleetFormDialog />
      <MaintFormDialog />
      <TpFormDialog />

      {/* Delete confirmations */}
      <AlertDialog open={!!deleteFleetId} onOpenChange={(open) => !open && setDeleteFleetId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir equipamento?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={deleteFleet}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteMaintId} onOpenChange={(open) => !open && setDeleteMaintId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir registro de manutenção?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={deleteMaint}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteTpId} onOpenChange={(open) => !open && setDeleteTpId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir registro de equipamento terceiro?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={deleteThirdParty}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
