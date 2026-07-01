import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Users, Palette, Download, Moon, Sun, Eye, EyeOff, FileText, FileSpreadsheet } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { setorLabels, FeedbackSetor } from '@/lib/feedbackData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBusatoLogoBase64, drawBusatoHeader } from '@/lib/pdfLogo';

export default function Configuracoes() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [feedbackVisibility, setFeedbackVisibility] = useState('all');
  const [notifNewFeedback, setNotifNewFeedback] = useState(true);
  const [notifDeadline, setNotifDeadline] = useState(true);
  const [notifMeeting, setNotifMeeting] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    toast.success(`Tema alterado para ${theme === 'dark' ? 'claro' : 'escuro'}`);
  }

  async function exportCSV() {
    const { data } = await supabase.from('feedbacks').select('*').order('criado_em', { ascending: false });
    if (!data || data.length === 0) { toast.error('Nenhum dado para exportar'); return; }

    const headers = ['Título', 'Funcionário', 'Gestor', 'Setor', 'Status', 'Prioridade', 'Data'];
    const rows = data.map((f: any) => [
      f.titulo, f.autor, f.gestor || '-', setorLabels[f.setor as FeedbackSetor] || f.setor, f.status, f.prioridade, new Date(f.criado_em).toLocaleDateString('pt-BR'),
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'feedbacks.csv'; a.click();
    toast.success('CSV exportado!');
  }

  async function exportToPDF() {
    const { data } = await supabase.from('feedbacks').select('*').order('criado_em', { ascending: false });
    if (!data || data.length === 0) { toast.error('Nenhum dado para exportar'); return; }
    const doc = new jsPDF();
    const logoBase64 = await getBusatoLogoBase64();
    drawBusatoHeader(doc, logoBase64);
    autoTable(doc, {
      startY: 34,
      head: [['Título', 'Funcionário', 'Gestor', 'Setor', 'Status', 'Data']],
      body: data.map((f: any) => [f.titulo, f.autor, f.gestor || '-', setorLabels[f.setor as FeedbackSetor] || f.setor, f.status, new Date(f.criado_em).toLocaleDateString('pt-BR')]),
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 187] }
    });
    doc.save('Exportacao_Feedbacks.pdf');
    toast.success('Relatório PDF exportado!');
  }

  async function exportFuncionariosCSV() {
    const { data } = await supabase.from('funcionarios').select('*').order('nome');
    if (!data || data.length === 0) { toast.error('Nenhum funcionário'); return; }
    const headers = ['Nome', 'Cargo', 'Departamento', 'Email', 'Admissão', 'Feedbacks Recebidos', 'Feedbacks Resolvidos'];
    const rows = data.map((f: any) => [f.nome, f.cargo, f.departamento, f.email || '-', f.data_admissao, f.feedbacks_recebidos, f.feedbacks_resolvidos]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'funcionarios.csv'; a.click();
    toast.success('Funcionários exportados!');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie as preferências do sistema</p>
      </motion.div>

      <Tabs defaultValue="aparencia" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="aparencia" className="text-xs sm:text-sm"><Palette className="w-4 h-4 mr-1 hidden sm:inline" />Aparência</TabsTrigger>
          <TabsTrigger value="notificacoes" className="text-xs sm:text-sm"><Bell className="w-4 h-4 mr-1 hidden sm:inline" />Notificações</TabsTrigger>
          <TabsTrigger value="privacidade" className="text-xs sm:text-sm"><Shield className="w-4 h-4 mr-1 hidden sm:inline" />Privacidade</TabsTrigger>
          <TabsTrigger value="exportar" className="text-xs sm:text-sm"><Download className="w-4 h-4 mr-1 hidden sm:inline" />Exportar</TabsTrigger>
        </TabsList>

        {/* Aparência */}
        <TabsContent value="aparencia">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-1">Tema</h3>
              <p className="text-sm text-muted-foreground mb-4">Alterne entre modo claro e escuro</p>
              <div className="flex items-center gap-4">
                <Sun className="w-5 h-5 text-warning" />
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                <Moon className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground ml-2">{theme === 'dark' ? 'Modo escuro' : 'Modo claro'}</span>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notificacoes">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold mb-4">Preferências de Notificação</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Novo feedback criado</Label>
                    <p className="text-xs text-muted-foreground">Receber alerta quando um feedback for registrado</p>
                  </div>
                  <Switch checked={notifNewFeedback} onCheckedChange={v => { setNotifNewFeedback(v); toast.success('Preferência salva'); }} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Prazos de metas</Label>
                    <p className="text-xs text-muted-foreground">Alertar sobre metas próximas do vencimento</p>
                  </div>
                  <Switch checked={notifDeadline} onCheckedChange={v => { setNotifDeadline(v); toast.success('Preferência salva'); }} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Reuniões 1:1</Label>
                    <p className="text-xs text-muted-foreground">Lembrete de reuniões agendadas</p>
                  </div>
                  <Switch checked={notifMeeting} onCheckedChange={v => { setNotifMeeting(v); toast.success('Preferência salva'); }} />
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Privacidade */}
        <TabsContent value="privacidade">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold mb-1">Visibilidade de Feedbacks</h3>
              <p className="text-sm text-muted-foreground mb-4">Controle quem pode ver os feedbacks</p>
              <Select value={feedbackVisibility} onValueChange={v => { setFeedbackVisibility(v); toast.success('Visibilidade atualizada'); }}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2"><Eye className="w-4 h-4" />Visível para todos</div>
                  </SelectItem>
                  <SelectItem value="managers">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4" />Apenas gestores</div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2"><EyeOff className="w-4 h-4" />Apenas administradores</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </TabsContent>

        {/* Exportar Dados */}
        <TabsContent value="exportar">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold mb-1">Exportar Dados</h3>
              <p className="text-sm text-muted-foreground mb-4">Exporte feedbacks e funcionários em diferentes formatos</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Feedbacks (CSV)</p>
                    <p className="text-xs text-muted-foreground">Todos os feedbacks registrados</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportCSV}><FileSpreadsheet className="w-4 h-4 mr-2" />CSV</Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Feedbacks (PDF)</p>
                    <p className="text-xs text-muted-foreground">Relatório completo em PDF</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportToPDF}><FileText className="w-4 h-4 mr-2" />PDF</Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Funcionários (CSV)</p>
                    <p className="text-xs text-muted-foreground">Lista completa de funcionários</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportFuncionariosCSV}><FileSpreadsheet className="w-4 h-4 mr-2" />CSV</Button>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-5">
        <h2 className="font-semibold mb-1">Instalar no Celular</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Acesse o Gestão Porto diretamente do seu smartphone. Abra o menu do navegador e selecione "Adicionar Ã  tela inicial".
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
          <Download className="w-4 h-4 flex-shrink-0" />
          <span>iOS: Safari â†’ Compartilhar â†’ Tela de Início | Android: Chrome â†’ Menu â†’ Instalar app</span>
        </div>
      </motion.div>
    </div>
  );
}
