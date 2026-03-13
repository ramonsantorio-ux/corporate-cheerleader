import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart, Download, FileText, FileSpreadsheet, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { setorLabels, FeedbackSetor } from '@/lib/feedbackData';

interface FeedbackRow {
  id: string; titulo: string; autor: string; setor: string; status: string;
  prioridade: string; gestor: string; criado_em: string;
  pontos_positivos?: string; pontos_melhoria?: string; observacoes?: string; descricao?: string;
}

interface FuncionarioRow {
  id: string; nome: string; cargo: string; departamento: string; turno: string; letra: string;
  email: string; escolaridade: string; data_admissao: string;
}

export default function Relatorios() {
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioRow[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  useEffect(() => {
    supabase.from('feedbacks').select('*').order('criado_em', { ascending: false }).then(({ data }) => {
      if (data) setFeedbacks(data as FeedbackRow[]);
    });
    supabase.from('funcionarios').select('id, nome, cargo, departamento, turno, letra, email, escolaridade, data_admissao').order('nome').then(({ data }) => {
      if (data) setFuncionarios(data as FuncionarioRow[]);
    });
  }, []);

  const total = feedbacks.length;
  const resolvidos = feedbacks.filter(f => f.status === 'resolvido').length;
  const taxaResolucao = total > 0 ? Math.round((resolvidos / total) * 100) : 0;

  const deptCounts: Record<string, number> = {};
  feedbacks.forEach(f => { deptCounts[f.setor] = (deptCounts[f.setor] || 0) + 1; });
  const departamentos = Object.entries(deptCounts).map(([key, count]) => ({
    dept: setorLabels[key as FeedbackSetor] || key, count, pct: total > 0 ? Math.round((count / total) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  const monthCounts: Record<string, number> = {};
  feedbacks.forEach(f => { const d = new Date(f.criado_em); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; monthCounts[key] = (monthCounts[key] || 0) + 1; });
  const monthlyData = Object.entries(monthCounts).sort().slice(-6).map(([key, count]) => {
    const [, m] = key.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return { mes: months[parseInt(m) - 1], total: count };
  });
  const maxVal = Math.max(...monthlyData.map(d => d.total), 1);

  const gestorCounts: Record<string, number> = {};
  feedbacks.forEach(f => { const g = f.gestor || 'Sem gestor'; gestorCounts[g] = (gestorCounts[g] || 0) + 1; });
  const gestorData = Object.entries(gestorCounts).map(([nome, count]) => ({ nome, count })).sort((a, b) => b.count - a.count);

  const metrics = [
    { label: 'Total de Feedbacks', value: total.toString() },
    { label: 'Taxa de resolução', value: `${taxaResolucao}%` },
    { label: 'Feedbacks resolvidos', value: resolvidos.toString() },
    { label: 'Pendentes', value: (total - resolvidos).toString() },
  ];

  async function exportPDF() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('Relatório de Feedbacks - Gestão Porto', 14, 22);
    doc.setFontSize(10); doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    doc.setFontSize(13); doc.text('Métricas', 14, 42);
    autoTable(doc, { startY: 46, head: [['Métrica', 'Valor']], body: metrics.map(m => [m.label, m.value]) });
    doc.setFontSize(13); doc.text('Departamentos', 14, (doc as any).lastAutoTable.finalY + 12);
    autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 16, head: [['Departamento', 'Qtd', '%']], body: departamentos.map(d => [d.dept, d.count.toString(), `${d.pct}%`]) });
    doc.setFontSize(13); doc.text('Detalhamento', 14, (doc as any).lastAutoTable.finalY + 12);
    autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 16, head: [['Título', 'Funcionário', 'Gestor', 'Setor', 'Status', 'Data']], body: feedbacks.map(f => [f.titulo, f.autor, f.gestor || '-', setorLabels[f.setor as FeedbackSetor] || f.setor, f.status, new Date(f.criado_em).toLocaleDateString('pt-BR')]), styles: { fontSize: 7 } });
    doc.save('relatorio-feedbacks.pdf');
  }

  async function exportExcel() {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metrics.map(m => ({ Métrica: m.label, Valor: m.value }))), 'Métricas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(departamentos.map(d => ({ Departamento: d.dept, Feedbacks: d.count, Percentual: `${d.pct}%` }))), 'Departamentos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(feedbacks.map(f => ({ Título: f.titulo, Funcionário: f.autor, Gestor: f.gestor || '-', Setor: setorLabels[f.setor as FeedbackSetor] || f.setor, Status: f.status, Data: new Date(f.criado_em).toLocaleDateString('pt-BR') }))), 'Detalhamento');
    XLSX.writeFile(wb, 'relatorio-feedbacks.xlsx');
  }

  async function exportEmployeePDF() {
    if (!selectedEmployee) return;
    const emp = funcionarios.find(f => f.id === selectedEmployee);
    if (!emp) return;

    const empFeedbacks = feedbacks.filter(f => f.autor?.toLowerCase() === emp.nome.toLowerCase());

    // Fetch fit cultural and goals
    const [fitRes, goalsRes] = await Promise.all([
      supabase.from('fit_cultural').select('criteria, stage, score').eq('employee_id', emp.id),
      supabase.from('goals').select('*').eq('cargo', emp.cargo),
    ]);

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();

    doc.setFontSize(18); doc.text(`Ficha Completa - ${emp.nome}`, 14, 22);
    doc.setFontSize(10); doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    // Info pessoal
    doc.setFontSize(13); doc.text('Informações Pessoais', 14, 42);
    const turnoLabels: Record<string, string> = { dia_a: 'Dia A', dia_b: 'Dia B', noite_a: 'Noite A', noite_b: 'Noite B', adm: 'ADM' };
    autoTable(doc, { startY: 46, head: [['Campo', 'Valor']], body: [
      ['Nome', emp.nome], ['Cargo', emp.cargo], ['Departamento', emp.departamento],
      ['E-mail', emp.email || '-'], ['Turno', turnoLabels[emp.turno] || emp.turno || '-'],
      ['Letra', emp.letra || '-'], ['Escolaridade', emp.escolaridade || '-'],
      ['Admissão', emp.data_admissao ? new Date(emp.data_admissao).toLocaleDateString('pt-BR') : '-'],
    ]});

    // Feedbacks
    let y = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(13); doc.text(`Feedbacks (${empFeedbacks.length})`, 14, y);
    if (empFeedbacks.length > 0) {
      autoTable(doc, { startY: y + 4, head: [['Título', 'Status', 'Prioridade', 'Gestor', 'Data']], body: empFeedbacks.map(f => [f.titulo, f.status, f.prioridade, f.gestor || '-', new Date(f.criado_em).toLocaleDateString('pt-BR')]), styles: { fontSize: 8 } });
      y = (doc as any).lastAutoTable.finalY + 12;
    } else { y += 10; }

    // Fit Cultural
    const fitData = fitRes.data || [];
    doc.setFontSize(13); doc.text('Fit Cultural', 14, y);
    if (fitData.length > 0) {
      autoTable(doc, { startY: y + 4, head: [['Critério', 'Etapa', 'Nota']], body: (fitData as any[]).filter(s => s.score != null).map(s => [s.criteria, s.stage, String(s.score)]), styles: { fontSize: 8 } });
      y = (doc as any).lastAutoTable.finalY + 12;
    } else { y += 10; }

    // Metas
    const goalsData = goalsRes.data || [];
    doc.setFontSize(13); doc.text(`Metas - ${emp.cargo}`, 14, y);
    if (goalsData.length > 0) {
      autoTable(doc, { startY: y + 4, head: [['Descrição', 'Peso', 'Resultado']], body: (goalsData as any[]).map(g => [g.descricao, `${g.peso}%`, g.resultado != null ? String(g.resultado) : '-']), styles: { fontSize: 8 } });
    }

    doc.save(`ficha-${emp.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">Análise e métricas dos feedbacks</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Exportar Geral</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportPDF}><FileText className="w-4 h-4 mr-2" />PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={exportExcel}><FileSpreadsheet className="w-4 h-4 mr-2" />Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Employee PDF export */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <User className="w-5 h-5 text-primary flex-shrink-0" />
        <span className="text-sm font-medium">Ficha completa por funcionário:</span>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
          <SelectContent>{funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome} - {f.cargo}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" onClick={exportEmployeePDF} disabled={!selectedEmployee}><Download className="w-4 h-4 mr-2" />Baixar PDF</Button>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6"><BarChart3 className="w-5 h-5 text-primary" /><h2 className="font-semibold">Feedbacks por Mês</h2></div>
          {monthlyData.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados ainda.</p> : (
            <div className="flex items-end gap-3 h-48">{monthlyData.map((d, i) => (
              <div key={d.mes} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium">{d.total}</span>
                <motion.div initial={{ height: 0 }} animate={{ height: `${(d.total / maxVal) * 100}%` }} transition={{ duration: 0.5, delay: i * 0.1 }} className="w-full bg-primary rounded-t-md min-h-[4px]" />
                <span className="text-xs text-muted-foreground">{d.mes}</span>
              </div>
            ))}</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6"><TrendingUp className="w-5 h-5 text-primary" /><h2 className="font-semibold">Métricas Chave</h2></div>
          <div className="space-y-4">{metrics.map(metric => (
            <div key={metric.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm">{metric.label}</span><span className="font-semibold text-sm">{metric.value}</span>
            </div>
          ))}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6"><PieChart className="w-5 h-5 text-primary" /><h2 className="font-semibold">Por Gestor</h2></div>
          <div className="space-y-3">{gestorData.map(g => (
            <div key={g.nome} className="flex items-center gap-4">
              <span className="text-sm w-40 shrink-0 truncate">{g.nome}</span>
              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${total > 0 ? (g.count / total) * 100 : 0}%` }} transition={{ duration: 0.6 }} className="h-full bg-primary rounded-full" /></div>
              <span className="text-sm font-medium w-8 text-right">{g.count}</span>
            </div>
          ))}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6"><PieChart className="w-5 h-5 text-primary" /><h2 className="font-semibold">Top Departamentos</h2></div>
          <div className="space-y-3">{departamentos.map(d => (
            <div key={d.dept} className="flex items-center gap-4">
              <span className="text-sm w-40 shrink-0">{d.dept}</span>
              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${d.pct}%` }} transition={{ duration: 0.6 }} className="h-full bg-primary rounded-full" /></div>
              <span className="text-sm font-medium w-8 text-right">{d.count}</span>
            </div>
          ))}</div>
        </motion.div>
      </div>
    </div>
  );
}
