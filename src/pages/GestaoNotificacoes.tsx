/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FileWarning, Plus, Trash2, Pencil, Calendar, MapPin, Target, AlertTriangle, ShieldAlert, CheckCircle2, Search, SlidersHorizontal, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import PeriodFilter, { getMonthPeriod } from '@/components/filters/PeriodFilter';
import type { PeriodRange } from '@/components/filters/PeriodFilter';
import ExpandableChart from '@/components/ExpandableChart';
import { usePermissions } from '@/hooks/usePermissions';

export interface NotificacaoGlobal {
  id: string;
  dataStr: string; // DD/MM/YYYY
  local: string;
  motivo: string;
  solicitante: string;
  tipo: 'Notificação' | 'Multa';
  planoDeAcao: 'OK' | 'N/A' | 'Pendente';
  valorOriginal?: number;
}

export const seedNotificacoes: NotificacaoGlobal[] = [
  { id: '1', dataStr: '20/08/2025', local: 'Minério', motivo: 'Notificação não atendimento serviços', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '2', dataStr: '20/08/2025', local: 'Minério', motivo: 'Notificação irreguladirade no uso de terceiros', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '3', dataStr: '10/09/2025', local: 'Minério', motivo: 'Descumprimento de procedimento', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '4', dataStr: '10/09/2025', local: 'Minério', motivo: 'Irregularidade Programa Tutor', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '5', dataStr: '12/09/2025', local: 'Minério', motivo: 'Falta de Auxiliar de Pipa', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '6', dataStr: '14/10/2025', local: 'Minério', motivo: 'Programa tutor Outubro', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '7', dataStr: '24/10/2025', local: 'Minério', motivo: 'Notificação Mobilização', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '8', dataStr: '29/10/2025', local: 'Minério', motivo: 'Notificação QQP', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '9', dataStr: '25/11/2025', local: 'Minério', motivo: 'Notificação Local Proibido', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '10', dataStr: '09/01/2026', local: 'Minério', motivo: 'Notificação Contratual Retenção de Pagamento', solicitante: '', tipo: 'Notificação', planoDeAcao: 'N/A' },
  { id: '11', dataStr: '30/01/2026', local: 'Minério', motivo: 'Falta de Procedimento Correto', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '12', dataStr: '06/02/2026', local: 'Minério', motivo: 'Não Conformidado no Planejamento OS', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '13', dataStr: '10/02/2026', local: 'Minério', motivo: 'Notificação Não Comunicação de avaria do enclausuramento', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '14', dataStr: '20/02/2026', local: 'Minério', motivo: 'Notificação Hora Extra Mensal Excedida', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '15', dataStr: '22/04/2026', local: 'Minério', motivo: 'Notificação Falta de Equipamento', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '16', dataStr: '08/05/2026', local: 'Minério', motivo: 'Notificação Trabalhista Busato', solicitante: '', tipo: 'Notificação', planoDeAcao: 'N/A' },
  { id: '17', dataStr: '14/05/2026', local: 'Minério', motivo: 'Notificação Falta de Procedimento correto - Passagem de Nivel', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
  { id: '18', dataStr: '18/05/2026', local: 'Minério', motivo: 'Notificação Local Proibido', solicitante: '', tipo: 'Notificação', planoDeAcao: 'OK' },
];

const getMonthForNotification = (dataStr?: string) => {
  if (!dataStr) return null;
  const parts = dataStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);

  if (day > 20) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${meses[month - 1]}/${year}`;
};

const GestaoNotificacoes = () => {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [notificacoes, setNotificacoes] = useState<NotificacaoGlobal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filtros Avançados
  const [filterType, setFilterType] = useState<string>('all'); // all, notificacao, multa
  const [filterAction, setFilterAction] = useState<string>('all'); // all, pendente, ok
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<PeriodRange>({
    start: `${new Date().getFullYear()}-01-01`,
    end: `${new Date().getFullYear()}-12-31`,
    label: `Ano de ${new Date().getFullYear()}`
  });

  const [formData, setFormData] = useState<Partial<NotificacaoGlobal>>({
    dataStr: '', local: '', motivo: '', solicitante: '', tipo: 'Notificação', planoDeAcao: 'Pendente', valorOriginal: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem('corporate_cheerleader_notificacoes_globais');
    if (saved) {
      setNotificacoes(JSON.parse(saved));
    } else {
      setNotificacoes(seedNotificacoes);
      localStorage.setItem('corporate_cheerleader_notificacoes_globais', JSON.stringify(seedNotificacoes));
    }
  }, []);

  const saveToStorage = (data: NotificacaoGlobal[]) => {
    setNotificacoes(data);
    localStorage.setItem('corporate_cheerleader_notificacoes_globais', JSON.stringify(data));
  };

  const handleSave = () => {
    if (!formData.dataStr || !formData.motivo) return;

    if (editingId) {
      if (!canEdit('notificacoes')) return;
      const updated = notificacoes.map(n => n.id === editingId ? { ...formData, id: editingId } as NotificacaoGlobal : n);
      saveToStorage(updated);
    } else {
      if (!canCreate('notificacoes')) return;
      const newNotif = { ...formData, id: Date.now().toString() } as NotificacaoGlobal;
      saveToStorage([...notificacoes, newNotif]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete('notificacoes')) {
      alert('Você não tem permissão para excluir notificações.');
      return;
    }
    if (confirm('Tem certeza que deseja excluir esta ocorrência?')) {
      saveToStorage(notificacoes.filter(n => n.id !== id));
    }
  };

  const openNew = () => {
    if (!canCreate('notificacoes')) {
      alert('Você não tem permissão para criar notificações.');
      return;
    }
    setEditingId(null);
    setFormData({ dataStr: '', local: '', motivo: '', solicitante: '', tipo: 'Notificação', planoDeAcao: 'Pendente', valorOriginal: 0 });
    setIsModalOpen(true);
  };

  const openEdit = (n: NotificacaoGlobal) => {
    if (!canEdit('notificacoes')) {
      alert('Você não tem permissão para editar notificações.');
      return;
    }
    setEditingId(n.id);
    setFormData(n);
    setIsModalOpen(true);
  };

  // --- Lógicas do Dashboard (KPIs e Gráficos) ---
  const filteredData = React.useMemo(() => {
    return notificacoes.filter(n => {
      const matchType = filterType === 'all' ? true : filterType === 'multa' ? n.tipo === 'Multa' : n.tipo === 'Notificação';
      const matchAction = filterAction === 'all' ? true : filterAction === 'pendente' ? n.planoDeAcao === 'Pendente' : n.planoDeAcao === 'OK';
      const matchSearch = n.motivo.toLowerCase().includes(searchQuery.toLowerCase()) || n.local.toLowerCase().includes(searchQuery.toLowerCase());
      const parts = n.dataStr.split('/');
      let matchDate = true;
      if (parts.length === 3) {
        const nDate = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        matchDate = nDate >= period.start && nDate <= period.end;
      }
      return matchType && matchAction && matchSearch && matchDate;
    });
  }, [notificacoes, filterType, filterAction, searchQuery, period]);

  const kpis = React.useMemo(() => {
    const totalExposicao = filteredData.filter(n => n.tipo === 'Multa').reduce((acc, curr) => acc + (curr.valorOriginal || 0), 0);
    const pendentes = filteredData.filter(n => n.planoDeAcao === 'Pendente').length;
    const ok = filteredData.filter(n => n.planoDeAcao === 'OK').length;
    const taxaResolucao = (ok + pendentes) === 0 ? 0 : Math.round((ok / (ok + pendentes)) * 100);
    return { totalExposicao, pendentes, taxaResolucao, total: filteredData.length };
  }, [filteredData]);

  const chartDataLocais = React.useMemo(() => {
    const locs: Record<string, number> = {};
    filteredData.forEach(n => {
      locs[n.local] = (locs[n.local] || 0) + 1;
    });
    return Object.entries(locs).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
  }, [filteredData]);

  const chartDataEvolucao = React.useMemo(() => {
    const evol: Record<string, { name: string; Multas: number; Notificacoes: number }> = {};
    filteredData.forEach(n => {
      const m = getMonthForNotification(n.dataStr) || 'Inválido';
      if (!evol[m]) evol[m] = { name: m, Multas: 0, Notificacoes: 0 };
      if (n.tipo === 'Multa') evol[m].Multas += 1;
      else evol[m].Notificacoes += 1;
    });
    // Sorting by parsing month could be complex, assuming order of appearance for simplicity or simple string sort
    return Object.values(evol);
  }, [filteredData]);

  const chartDataStatus = React.useMemo(() => {
    const s = { OK: 0, Pendente: 0, 'N/A': 0 };
    filteredData.forEach(n => s[n.planoDeAcao] += 1);
    return [
      { name: 'Resolvidos (OK)', value: s.OK, fill: 'hsl(var(--success))' },
      { name: 'Pendentes', value: s.Pendente, fill: 'hsl(var(--warning))' },
      { name: 'Não se Aplica', value: s['N/A'], fill: 'hsl(var(--muted-foreground))' }
    ].filter(i => i.value > 0);
  }, [filteredData]);

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Notificações e Multas</h1>
          <p className="text-muted-foreground mt-1">Gestão centralizada de ocorrências contratuais.</p>
        </div>
        {canCreate('notificacoes') && (
          <Button onClick={openNew} className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-4 h-4 mr-2" />
            Nova Ocorrência
          </Button>
        )}
      </div>

      {/* Control Bar Inovadora */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
        <PeriodFilter value={period} onChange={setPeriod} className="sm:w-auto shrink-0" />
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border/50">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por motivo ou local..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={(v: string) => setFilterType(v)}>
            <SelectTrigger className="w-[140px] h-9 bg-background border-slate-200">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="notificacao">Notificações</SelectItem>
              <SelectItem value="multa">Multas</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterAction} onValueChange={(v: string) => setFilterAction(v)}>
            <SelectTrigger className="w-[140px] h-9 bg-background border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap p-1.5 bg-muted/30 rounded-xl mb-6 border border-border">
          <TabsTrigger value="dashboard" className="px-5 py-2.5 text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"><PieChartIcon className="w-4 h-4 mr-2"/> Dashboard Analítico</TabsTrigger>
          <TabsTrigger value="registros" className="px-5 py-2.5 text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"><FileWarning className="w-4 h-4 mr-2"/> Histórico de Registros</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 outline-none">
          {/* KPI Cards Nível Executivo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm border-l-4 border-l-destructive">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Exposição Financeira (Multas)</p>
                    <h3 className="text-3xl font-black mt-2 text-destructive">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.totalExposicao)}
                    </h3>
                  </div>
                  <div className="p-3 bg-destructive/10 rounded-full"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-l-4 border-l-warning">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Planos Pendentes (SLAs)</p>
                    <h3 className="text-3xl font-black mt-2">{kpis.pendentes}</h3>
                  </div>
                  <div className="p-3 bg-warning/10 rounded-full"><Target className="w-5 h-5 text-warning" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-l-4 border-l-success">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Resolução</p>
                    <h3 className="text-3xl font-black mt-2 text-success">{kpis.taxaResolucao}%</h3>
                  </div>
                  <div className="p-3 bg-success/10 rounded-full"><CheckCircle2 className="w-5 h-5 text-success" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Core Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpandableChart title="Volume de Ocorrências no Tempo" description="Histórico de multas e notificações">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataEvolucao} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorNotif" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMulta" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="Notificacoes" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorNotif)">
                      <LabelList dataKey="Notificacoes" position="top" fill="hsl(var(--primary))" fontSize={11} fontWeight="bold" />
                    </Area>
                    <Area type="monotone" dataKey="Multas" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorMulta)">
                      <LabelList dataKey="Multas" position="bottom" fill="hsl(var(--destructive))" fontSize={11} fontWeight="bold" />
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ExpandableChart>

            <ExpandableChart title="Top Locais Ofensores" description="Frequência por localidade">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataLocais} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{fontSize: 12}} />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                    <Tooltip />
                    <Bar dataKey="value" name="Ocorrências" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                      <LabelList dataKey="value" position="right" fill="hsl(var(--primary))" fontSize={11} fontWeight="bold" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ExpandableChart>

            <ExpandableChart title="Status dos Planos de Ação" description="Distribuição de SLA">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartDataStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                      {chartDataStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ExpandableChart>
          </div>
        </TabsContent>

        <TabsContent value="registros" className="space-y-6 outline-none">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-warning" />
            Histórico Global
          </CardTitle>
          <CardDescription>
            Todas as ocorrências registradas. Elas serão vinculadas automaticamente às medições do mês correspondente (ciclo 21 a 20).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="w-24">Data</TableHead>
                  <TableHead>Mês (Vínculo)</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Plano de Ação</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((n) => {
                  const mesVinculo = getMonthForNotification(n.dataStr);
                  return (
                    <TableRow key={n.id} className="hover:bg-muted/10">
                      <TableCell className="font-medium whitespace-nowrap">{n.dataStr}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {mesVinculo || 'Inválido'}
                        </Badge>
                      </TableCell>
                      <TableCell>{n.local}</TableCell>
                      <TableCell className="max-w-xs truncate" title={n.motivo}>{n.motivo}</TableCell>
                      <TableCell>{n.solicitante}</TableCell>
                      <TableCell>
                        <Badge variant={n.tipo === 'Multa' ? 'destructive' : 'default'} className={n.tipo === 'Notificação' ? 'bg-amber-500 hover:bg-amber-600' : ''}>
                          {n.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={n.planoDeAcao === 'OK' ? 'border-success text-success' : n.planoDeAcao === 'Pendente' ? 'border-warning text-warning' : 'text-muted-foreground'}>
                          {n.planoDeAcao}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {canEdit('notificacoes') && (
                          <Button variant="ghost" size="icon" onClick={() => openEdit(n)} className="h-8 w-8 text-muted-foreground hover:text-primary"><Pencil className="w-4 h-4" /></Button>
                        )}
                        {canDelete('notificacoes') && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(n.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma ocorrência registrada para os filtros selecionados.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Ocorrência' : 'Nova Ocorrência'}</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da ocorrência. O sistema calculará automaticamente em qual medição (Mês/Ano) ela entrará.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
            <div className="space-y-2">
              <Label>Data <span className="text-destructive">*</span></Label>
              <Input placeholder="DD/MM/AAAA" value={formData.dataStr} onChange={e => setFormData({ ...formData, dataStr: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Local</Label>
              <Input placeholder="Ex: Minério" value={formData.local} onChange={e => setFormData({ ...formData, local: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Solicitante</Label>
              <Input placeholder="Nome" value={formData.solicitante} onChange={e => setFormData({ ...formData, solicitante: e.target.value })} />
            </div>
            
            <div className="space-y-2 col-span-2 md:col-span-3">
              <Label>Motivo <span className="text-destructive">*</span></Label>
              <Input placeholder="Descrição da ocorrência..." value={formData.motivo} onChange={e => setFormData({ ...formData, motivo: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(v: 'Notificação' | 'Multa') => setFormData({ ...formData, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Notificação">Notificação</SelectItem>
                  <SelectItem value="Multa">Multa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Plano de Ação</Label>
              <Select value={formData.planoDeAcao} onValueChange={(v: 'OK' | 'N/A' | 'Pendente') => setFormData({ ...formData, planoDeAcao: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OK">OK</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="N/A">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipo === 'Multa' && (
              <div className="space-y-2">
                <Label>Valor Original</Label>
                <Input type="number" placeholder="0.00" value={formData.valorOriginal || ''} onChange={e => setFormData({ ...formData, valorOriginal: parseFloat(e.target.value) })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestaoNotificacoes;
