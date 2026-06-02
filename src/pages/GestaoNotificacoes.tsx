import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FileWarning, Plus, Trash2, Pencil, Calendar, MapPin, Target, AlertTriangle } from "lucide-react";

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

export const getMonthForNotification = (dataStr?: string) => {
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
  const [notificacoes, setNotificacoes] = useState<NotificacaoGlobal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
      const updated = notificacoes.map(n => n.id === editingId ? { ...formData, id: editingId } as NotificacaoGlobal : n);
      saveToStorage(updated);
    } else {
      const newNotif = { ...formData, id: Date.now().toString() } as NotificacaoGlobal;
      saveToStorage([...notificacoes, newNotif]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta ocorrência?')) {
      saveToStorage(notificacoes.filter(n => n.id !== id));
    }
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ dataStr: '', local: '', motivo: '', solicitante: '', tipo: 'Notificação', planoDeAcao: 'Pendente', valorOriginal: 0 });
    setIsModalOpen(true);
  };

  const openEdit = (n: NotificacaoGlobal) => {
    setEditingId(n.id);
    setFormData(n);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Notificações e Multas</h1>
          <p className="text-muted-foreground mt-1">Gestão centralizada de ocorrências contratuais.</p>
        </div>
        <Button onClick={openNew} className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          <Plus className="w-4 h-4 mr-2" />
          Nova Ocorrência
        </Button>
      </div>

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
                {notificacoes.map((n) => {
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
                        <Button variant="ghost" size="icon" onClick={() => openEdit(n)} className="h-8 w-8 text-muted-foreground hover:text-primary"><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(n.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {notificacoes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma ocorrência registrada.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
