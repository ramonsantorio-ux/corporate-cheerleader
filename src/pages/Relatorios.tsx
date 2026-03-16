import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
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
  const [period, setPeriod] = useState<PeriodRange>(getPortoPeriod(0));

  useEffect(() => {
    supabase.from('feedbacks').select('*').order('criado_em', { ascending: false }).then(({ data }) => {
      if (data) setFeedbacks(data as FeedbackRow[]);
    });
    supabase.from('funcionarios').select('id, nome, cargo, departamento, turno, letra, email, escolaridade, data_admissao').order('nome').then(({ data }) => {
      if (data) setFuncionarios(data as FuncionarioRow[]);
    });
  }, []);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const d = new Date(f.criado_em).toISOString().split('T')[0];
      return d >= period.start && d <= period.end;
    });
  }, [feedbacks, period]);

  const total = filteredFeedbacks.length;
  const resolvidos = filteredFeedbacks.filter(f => f.status === 'resolvido').length;
  const taxaResolucao = total > 0 ? Math.round((resolvidos / total) * 100) : 0;

  const deptCounts: Record<string, number> = {};
  filteredFeedbacks.forEach(f => { deptCounts[f.setor] = (deptCounts[f.setor] || 0) + 1; });
  const departamentos = Object.entries(deptCounts).map(([key, count]) => ({
    dept: setorLabels[key as FeedbackSetor] || key, count, pct: total > 0 ? Math.round((count / total) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  const monthCounts: Record<string, number> = {};
  filteredFeedbacks.forEach(f => { const d = new Date(f.criado_em); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; monthCounts[key] = (monthCounts[key] || 0) + 1; });
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

    const [fitRes, goalsRes] = await Promise.all([
      supabase.from('fit_cultural').select('criteria, stage, score').eq('employee_id', emp.id),
      supabase.from('goals').select('*').eq('cargo', emp.cargo),
    ]);

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const brand: [number, number, number] = [0, 120, 150];
    const brandLight: [number, number, number] = [230, 245, 248];
    const dark: [number, number, number] = [30, 40, 50];
    const gray: [number, number, number] = [120, 130, 140];
    const now = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const turnoLabels: Record<string, string> = { dia_a: 'Dia A', dia_b: 'Dia B', noite_a: 'Noite A', noite_b: 'Noite B', adm: 'Administrativo' };
    let pageNum = 1;

    function addHeader() {
      doc.setFillColor(brand[0], brand[1], brand[2]);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setFillColor(0, 90, 115);
      doc.rect(0, 28, pageW, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('GESTÃO PORTO', 14, 14);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('SISTEMA INTEGRADO DE GESTÃO DE PESSOAS', 14, 21);
      doc.setFontSize(9);
      doc.text(`Emitido em: ${now}`, pageW - 14, 14, { align: 'right' });
      doc.text('DOCUMENTO CONFIDENCIAL', pageW - 14, 21, { align: 'right' });
    }

    function addFooter() {
      doc.setDrawColor(brand[0], brand[1], brand[2]);
      doc.setLineWidth(0.5);
      doc.line(14, pageH - 16, pageW - 14, pageH - 16);
      doc.setFontSize(7);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFont('helvetica', 'normal');
      doc.text('Gestão Porto — Documento gerado automaticamente pelo sistema. Proibida a reprodução sem autorização.', 14, pageH - 10);
      doc.text(`Página ${pageNum}`, pageW - 14, pageH - 10, { align: 'right' });
    }

    function sectionTitle(title: string, y: number) {
      doc.setFillColor(brandLight[0], brandLight[1], brandLight[2]);
      doc.roundedRect(14, y - 5, pageW - 28, 9, 1, 1, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(brand[0], brand[1], brand[2]);
      doc.text(title.toUpperCase(), 18, y + 1);
      return y + 10;
    }

    function checkPage(y: number, needed: number) {
      if (y + needed > pageH - 25) {
        addFooter();
        doc.addPage();
        pageNum++;
        addHeader();
        return 40;
      }
      return y;
    }

    // --- Page 1 ---
    addHeader();

    // Title block
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, 36, pageW - 28, 22, 2, 2, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text('FICHA COMPLETA DO COLABORADOR', 18, 47);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text(`Matrícula: ${emp.id.substring(0, 8).toUpperCase()}`, 18, 54);

    // Personal info section
    let y = sectionTitle('Dados Cadastrais', 70);
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3, textColor: dark },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, textColor: brand } },
      body: [
        ['Nome Completo', emp.nome],
        ['Cargo', emp.cargo],
        ['Departamento', emp.departamento],
        ['E-mail', emp.email || '—'],
        ['Turno', turnoLabels[emp.turno] || emp.turno || '—'],
        ['Letra', emp.letra || '—'],
        ['Escolaridade', emp.escolaridade || '—'],
        ['Data de Admissão', emp.data_admissao ? new Date(emp.data_admissao).toLocaleDateString('pt-BR') : '—'],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 14;

    // Feedbacks section
    y = checkPage(y, 30);
    y = sectionTitle(`Histórico de Feedbacks (${empFeedbacks.length})`, y);
    if (empFeedbacks.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: brand, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        head: [['Título', 'Status', 'Prioridade', 'Gestor', 'Data']],
        body: empFeedbacks.map(f => [
          f.titulo,
          f.status.charAt(0).toUpperCase() + f.status.slice(1),
          f.prioridade.charAt(0).toUpperCase() + f.prioridade.slice(1),
          f.gestor || '—',
          new Date(f.criado_em).toLocaleDateString('pt-BR'),
        ]),
      });
      y = (doc as any).lastAutoTable.finalY + 14;

      // Detail per feedback
      for (const fb of empFeedbacks) {
        y = checkPage(y, 40);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(dark[0], dark[1], dark[2]);
        doc.text(`▸ ${fb.titulo}`, 18, y);
        y += 5;
        const details: string[][] = [];
        if (fb.descricao) details.push(['Descrição', fb.descricao]);
        if (fb.pontos_positivos) details.push(['Pontos Positivos', fb.pontos_positivos]);
        if (fb.pontos_melhoria) details.push(['Pontos de Melhoria', fb.pontos_melhoria]);
        if (fb.observacoes) details.push(['Observações', fb.observacoes]);
        if (details.length > 0) {
          autoTable(doc, {
            startY: y,
            margin: { left: 20, right: 14 },
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 2, textColor: dark },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: gray } },
            body: details,
          });
          y = (doc as any).lastAutoTable.finalY + 8;
        }
      }
    } else {
      doc.setFontSize(9);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text('Nenhum feedback registrado.', 18, y + 2);
      y += 14;
    }

    // Fit Cultural section
    const fitData = fitRes.data || [];
    y = checkPage(y, 30);
    y = sectionTitle('Avaliação FIT Cultural', y);
    const fitScored = (fitData as any[]).filter(s => s.score != null);
    if (fitScored.length > 0) {
      const stageLabels: Record<string, string> = { autoavaliacao: 'Autoavaliação', gestor: 'Gestor', calibracao: 'Calibração', validacao: 'Validação' };
      autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: brand, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        head: [['Critério', 'Etapa', 'Nota']],
        body: fitScored.map(s => [s.criteria, stageLabels[s.stage] || s.stage, String(s.score)]),
      });
      const avg = fitScored.reduce((a: number, b: any) => a + b.score, 0) / fitScored.length;
      y = (doc as any).lastAutoTable.finalY + 4;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(brand[0], brand[1], brand[2]);
      doc.text(`Média FIT Cultural: ${avg.toFixed(1)} / 5.0`, 18, y + 2);
      y += 14;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text('Nenhuma avaliação FIT Cultural registrada.', 18, y + 2);
      y += 14;
    }

    // Goals section
    const goalsData = goalsRes.data || [];
    y = checkPage(y, 30);
    y = sectionTitle(`Metas — ${emp.cargo}`, y);
    if (goalsData.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: brand, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        head: [['Descrição', 'Peso (%)', 'Resultado', 'Status']],
        body: (goalsData as any[]).map(g => {
          let status = '—';
          if (g.resultado != null) {
            if (g.resultado >= 100) status = '✓ Atingida';
            else if (g.resultado >= 80) status = '◐ Parcial';
            else status = '✗ Abaixo';
          }
          return [g.descricao, `${g.peso}%`, g.resultado != null ? `${g.resultado}%` : '—', status];
        }),
      });
      y = (doc as any).lastAutoTable.finalY + 14;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text('Nenhuma meta definida para este cargo.', 18, y + 2);
      y += 14;
    }

    // Signature area
    y = checkPage(y, 40);
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, y + 20, 90, y + 20);
    doc.line(pageW - 90, y + 20, pageW - 14, y + 20);
    doc.setFontSize(8);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura do Colaborador', 52, y + 26, { align: 'center' });
    doc.text('Assinatura do Gestor', pageW - 52, y + 26, { align: 'center' });

    addFooter();
    doc.save(`ficha-${emp.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Analytics</p>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
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

      <PeriodFilter value={period} onChange={setPeriod} />

      {/* Employee PDF export */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="corporate-section">
        <div className="px-6 py-4 flex flex-col sm:flex-row items-center gap-3">
          <User className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">Ficha completa por funcionário:</span>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
            <SelectContent>{funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome} — {f.cargo}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" onClick={exportEmployeePDF} disabled={!selectedEmployee}><Download className="w-4 h-4 mr-2" />Baixar PDF</Button>
        </div>
      </motion.div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`corporate-kpi ${i === 0 ? '' : i === 1 ? 'corporate-kpi-accent' : i === 2 ? 'corporate-kpi-accent' : 'corporate-kpi-warning'}`}>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{m.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="corporate-section">
          <div className="corporate-section-header">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Feedbacks por Mês</h2>
            </div>
            <span className="text-xs text-muted-foreground">Últimos 6 meses</span>
          </div>
          <div className="corporate-section-body">
            {monthlyData.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
              <div className="flex items-end gap-4 h-48">
                {monthlyData.map((d, i) => (
                  <div key={d.mes} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{d.total}</span>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${(d.total / maxVal) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.08 }}
                      className="w-full bg-primary rounded-sm min-h-[4px]" />
                    <span className="text-xs text-muted-foreground font-medium">{d.mes}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Gestor Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="corporate-section">
          <div className="corporate-section-header">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Por Gestor</h2>
            </div>
            <span className="text-xs text-muted-foreground">{gestorData.length} gestores</span>
          </div>
          <div className="corporate-section-body space-y-3">
            {gestorData.map((g, i) => (
              <div key={g.nome} className="flex items-center gap-4">
                <span className="text-sm text-foreground w-40 shrink-0 truncate font-medium">{g.nome}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${total > 0 ? (g.count / total) * 100 : 0}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }} className="h-full bg-primary rounded-full" />
                </div>
                <span className="text-xs font-semibold text-foreground w-8 text-right">{g.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Department Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="corporate-section lg:col-span-2">
          <div className="corporate-section-header">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Distribuição por Departamento</h2>
            </div>
          </div>
          <div className="corporate-section-body">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {departamentos.map((d, i) => (
                <motion.div key={d.dept} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 + i * 0.03 }}
                  className="text-center p-4 rounded-lg border border-border bg-muted/20">
                  <p className="text-2xl font-bold text-foreground">{d.count}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{d.dept}</p>
                  <div className="w-full h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${d.pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{d.pct}%</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
