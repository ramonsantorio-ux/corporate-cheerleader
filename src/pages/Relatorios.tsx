import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const departamentos = [
  { dept: 'Contrato Porto', count: 14, pct: 22 },
  { dept: 'Contrato Usina', count: 12, pct: 19 },
  { dept: 'Frotas', count: 10, pct: 16 },
  { dept: 'Medição', count: 8, pct: 13 },
  { dept: 'Segurança', count: 6, pct: 10 },
  { dept: 'CCO', count: 5, pct: 8 },
  { dept: 'CCM', count: 3, pct: 5 },
  { dept: 'Manutenção', count: 2, pct: 3 },
  { dept: 'RH', count: 1, pct: 2 },
  { dept: 'Financeiro', count: 1, pct: 2 },
];

const monthlyData = [
  { mes: 'Set', total: 18 },
  { mes: 'Out', total: 24 },
  { mes: 'Nov', total: 31 },
  { mes: 'Dez', total: 22 },
  { mes: 'Jan', total: 28 },
  { mes: 'Fev', total: 42 },
];

const metrics = [
  { label: 'Tempo médio de resolução', value: '4.2 dias', trend: '-12%' },
  { label: 'Taxa de resolução', value: '59%', trend: '+8%' },
  { label: 'Satisfação média', value: '4.1/5', trend: '+0.3' },
  { label: 'Feedbacks por colaborador', value: '1.8', trend: '+0.4' },
];

const maxVal = Math.max(...monthlyData.map(d => d.total));

async function exportPDF() {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Relatório de Feedbacks', 14, 22);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

  // Metrics
  doc.setFontSize(13);
  doc.text('Métricas Chave', 14, 42);
  autoTable(doc, {
    startY: 46,
    head: [['Métrica', 'Valor', 'Tendência']],
    body: metrics.map(m => [m.label, m.value, m.trend]),
  });

  // Monthly
  doc.setFontSize(13);
  doc.text('Feedbacks por Mês', 14, (doc as any).lastAutoTable.finalY + 12);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 16,
    head: [['Mês', 'Total']],
    body: monthlyData.map(m => [m.mes, m.total.toString()]),
  });

  // Departments
  doc.setFontSize(13);
  doc.text('Departamentos', 14, (doc as any).lastAutoTable.finalY + 12);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 16,
    head: [['Departamento', 'Feedbacks', '%']],
    body: departamentos.map(d => [d.dept, d.count.toString(), `${d.pct}%`]),
  });

  doc.save('relatorio-feedbacks.pdf');
}

async function exportExcel() {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const wsMetrics = XLSX.utils.json_to_sheet(metrics.map(m => ({ Métrica: m.label, Valor: m.value, Tendência: m.trend })));
  XLSX.utils.book_append_sheet(wb, wsMetrics, 'Métricas');

  const wsMonthly = XLSX.utils.json_to_sheet(monthlyData.map(m => ({ Mês: m.mes, Total: m.total })));
  XLSX.utils.book_append_sheet(wb, wsMonthly, 'Por Mês');

  const wsDepts = XLSX.utils.json_to_sheet(departamentos.map(d => ({ Departamento: d.dept, Feedbacks: d.count, Percentual: `${d.pct}%` })));
  XLSX.utils.book_append_sheet(wb, wsDepts, 'Departamentos');

  XLSX.writeFile(wb, 'relatorio-feedbacks.xlsx');
}

export default function Relatorios() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">Análise e métricas dos feedbacks</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportPDF}>
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Feedbacks por Mês</h2>
          </div>
          <div className="flex items-end gap-3 h-48">
            {monthlyData.map((d, i) => (
              <div key={d.mes} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium">{d.total}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.total / maxVal) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="w-full bg-primary rounded-t-md min-h-[4px]"
                />
                <span className="text-xs text-muted-foreground">{d.mes}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Métricas Chave</h2>
          </div>
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{metric.value}</span>
                  <span className="text-xs text-success font-medium">{metric.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Top Departamentos</h2>
          </div>
          <div className="space-y-3">
            {departamentos.map((d) => (
              <div key={d.dept} className="flex items-center gap-4">
                <span className="text-sm w-40 shrink-0">{d.dept}</span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${d.pct}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full bg-primary rounded-full"
                  />
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
