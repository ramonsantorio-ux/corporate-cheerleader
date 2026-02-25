import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { setorLabels, FeedbackSetor } from '@/lib/feedbackData';

interface FeedbackRow {
  id: string;
  titulo: string;
  autor: string;
  setor: string;
  status: string;
  prioridade: string;
  gestor: string;
  criado_em: string;
}

export default function Relatorios() {
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);

  useEffect(() => {
    supabase.from('feedbacks').select('id, titulo, autor, setor, status, prioridade, gestor, criado_em').order('criado_em', { ascending: false }).then(({ data }) => {
      if (data) setFeedbacks(data as FeedbackRow[]);
    });
  }, []);

  const total = feedbacks.length;
  const resolvidos = feedbacks.filter(f => f.status === 'resolvido').length;
  const taxaResolucao = total > 0 ? Math.round((resolvidos / total) * 100) : 0;

  // Group by setor
  const deptCounts: Record<string, number> = {};
  feedbacks.forEach(f => { deptCounts[f.setor] = (deptCounts[f.setor] || 0) + 1; });
  const departamentos = Object.entries(deptCounts).map(([key, count]) => ({
    dept: setorLabels[key as FeedbackSetor] || key,
    count,
    pct: total > 0 ? Math.round((count / total) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  // Group by month
  const monthCounts: Record<string, number> = {};
  feedbacks.forEach(f => {
    const d = new Date(f.criado_em);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthCounts[key] = (monthCounts[key] || 0) + 1;
  });
  const monthlyData = Object.entries(monthCounts).sort().slice(-6).map(([key, count]) => {
    const [y, m] = key.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return { mes: months[parseInt(m) - 1], total: count };
  });
  const maxVal = Math.max(...monthlyData.map(d => d.total), 1);

  // Group by gestor
  const gestorCounts: Record<string, number> = {};
  feedbacks.forEach(f => {
    const g = f.gestor || 'Sem gestor';
    gestorCounts[g] = (gestorCounts[g] || 0) + 1;
  });
  const gestorData = Object.entries(gestorCounts).map(([nome, count]) => ({ nome, count })).sort((a, b) => b.count - a.count);

  const metrics = [
    { label: 'Total de Feedbacks', value: total.toString(), trend: '' },
    { label: 'Taxa de resolução', value: `${taxaResolucao}%`, trend: '' },
    { label: 'Feedbacks resolvidos', value: resolvidos.toString(), trend: '' },
    { label: 'Pendentes', value: (total - resolvidos).toString(), trend: '' },
  ];

  async function exportPDF() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Feedbacks - Gestão Porto', 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    doc.setFontSize(13);
    doc.text('Métricas', 14, 42);
    autoTable(doc, { startY: 46, head: [['Métrica', 'Valor']], body: metrics.map(m => [m.label, m.value]) });

    doc.setFontSize(13);
    doc.text('Departamentos', 14, (doc as any).lastAutoTable.finalY + 12);
    autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 16, head: [['Departamento', 'Qtd', '%']], body: departamentos.map(d => [d.dept, d.count.toString(), `${d.pct}%`]) });

    doc.setFontSize(13);
    doc.text('Por Gestor', 14, (doc as any).lastAutoTable.finalY + 12);
    autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 16, head: [['Gestor', 'Feedbacks']], body: gestorData.map(g => [g.nome, g.count.toString()]) });

    doc.setFontSize(13);
    doc.text('Detalhamento', 14, (doc as any).lastAutoTable.finalY + 12);
    autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 16, head: [['Título', 'Funcionário', 'Gestor', 'Setor', 'Status', 'Data']], body: feedbacks.map(f => [f.titulo, f.autor, f.gestor || '-', setorLabels[f.setor as FeedbackSetor] || f.setor, f.status, new Date(f.criado_em).toLocaleDateString('pt-BR')]), styles: { fontSize: 7 } });

    doc.save('relatorio-feedbacks.pdf');
  }

  async function exportExcel() {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const wsMetrics = XLSX.utils.json_to_sheet(metrics.map(m => ({ Métrica: m.label, Valor: m.value })));
    XLSX.utils.book_append_sheet(wb, wsMetrics, 'Métricas');
    const wsDepts = XLSX.utils.json_to_sheet(departamentos.map(d => ({ Departamento: d.dept, Feedbacks: d.count, Percentual: `${d.pct}%` })));
    XLSX.utils.book_append_sheet(wb, wsDepts, 'Departamentos');
    const wsGestor = XLSX.utils.json_to_sheet(gestorData.map(g => ({ Gestor: g.nome, Feedbacks: g.count })));
    XLSX.utils.book_append_sheet(wb, wsGestor, 'Por Gestor');
    const wsDetail = XLSX.utils.json_to_sheet(feedbacks.map(f => ({ Título: f.titulo, Funcionário: f.autor, Gestor: f.gestor || '-', Setor: setorLabels[f.setor as FeedbackSetor] || f.setor, Status: f.status, Data: new Date(f.criado_em).toLocaleDateString('pt-BR') })));
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalhamento');
    XLSX.writeFile(wb, 'relatorio-feedbacks.xlsx');
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">Análise e métricas dos feedbacks</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Exportar</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportPDF}><FileText className="w-4 h-4 mr-2" />Exportar PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={exportExcel}><FileSpreadsheet className="w-4 h-4 mr-2" />Exportar Excel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Feedbacks por Mês</h2>
          </div>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {monthlyData.map((d, i) => (
                <div key={d.mes} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium">{d.total}</span>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(d.total / maxVal) * 100}%` }} transition={{ duration: 0.5, delay: i * 0.1 }} className="w-full bg-primary rounded-t-md min-h-[4px]" />
                  <span className="text-xs text-muted-foreground">{d.mes}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Métricas Chave</h2>
          </div>
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm">{metric.label}</span>
                <span className="font-semibold text-sm">{metric.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Por Gestor</h2>
          </div>
          <div className="space-y-3">
            {gestorData.map((g) => (
              <div key={g.nome} className="flex items-center gap-4">
                <span className="text-sm w-40 shrink-0 truncate">{g.nome}</span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${total > 0 ? (g.count / total) * 100 : 0}%` }} transition={{ duration: 0.6 }} className="h-full bg-primary rounded-full" />
                </div>
                <span className="text-sm font-medium w-8 text-right">{g.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Top Departamentos</h2>
          </div>
          <div className="space-y-3">
            {departamentos.map((d) => (
              <div key={d.dept} className="flex items-center gap-4">
                <span className="text-sm w-40 shrink-0">{d.dept}</span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${d.pct}%` }} transition={{ duration: 0.6 }} className="h-full bg-primary rounded-full" />
                </div>
                <span className="text-sm font-medium w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
