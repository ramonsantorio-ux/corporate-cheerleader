import { useState, useEffect, useMemo } from 'react';
import { getBusatoLogoBase64, drawBusatoHeader, drawBusatoFooter } from '@/lib/pdfLogo';
import { motion } from 'framer-motion';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import { BarChart3, TrendingUp, PieChart, Download, FileText, FileSpreadsheet, User, ShieldAlert, Calendar, Clock, AlertTriangle, Users } from 'lucide-react';
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

interface AttendanceRow { id: string; date: string; employee_id: string; status: string; observation: string | null; }
interface WarningRow { id: string; date: string; employee_id: string; reason: string; applied: boolean; observation: string | null; }
interface EventRow { id: string; event_date: string; involved_name: string; description: string; location: string | null; equipment: string | null; shift: string | null; supervisor: string | null; }
interface MeetingRow { id: string; meeting_date: string; employee_id: string; manager_name: string; status: string; notes: string | null; }
interface OvertimeRow { id: string; period_start: string; period_end: string; employee_id: string; extras_count: number; }

const attendanceLabels: Record<string, string> = {
  falta: 'Falta Injustificada', falta_injustificada: 'Falta Injustificada',
  falta_justificada: 'Falta Justificada', atestado: 'Atestado Médico',
  presente: 'Presente', extra: 'Hora Extra',
};

export default function Relatorios() {
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [warnings, setWarnings] = useState<WarningRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [overtime, setOvertime] = useState<OvertimeRow[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [period, setPeriod] = useState<PeriodRange>(getPortoPeriod(0));

  useEffect(() => {
    Promise.all([
      supabase.from('feedbacks').select('*').order('criado_em', { ascending: false }),
      supabase.from('funcionarios').select('id, nome, cargo, departamento, turno, letra, email, escolaridade, data_admissao').order('nome'),
      supabase.from('daily_attendance').select('*').order('date', { ascending: false }),
      supabase.from('employee_warnings').select('*').order('date', { ascending: false }),
      supabase.from('events').select('*').order('event_date', { ascending: false }),
      supabase.from('meetings').select('*').order('meeting_date', { ascending: false }),
      supabase.from('overtime_control').select('*').order('period_start', { ascending: false }),
    ]).then(([fb, fn, att, warn, ev, meet, ot]) => {
      if (fb.data) setFeedbacks(fb.data as FeedbackRow[]);
      if (fn.data) setFuncionarios(fn.data as FuncionarioRow[]);
      if (att.data) setAttendance(att.data as AttendanceRow[]);
      if (warn.data) setWarnings(warn.data as WarningRow[]);
      if (ev.data) setEvents(ev.data as EventRow[]);
      if (meet.data) setMeetings(meet.data as MeetingRow[]);
      if (ot.data) setOvertime(ot.data as OvertimeRow[]);
    });
  }, []);

  const empMap = useMemo(() => {
    const m: Record<string, FuncionarioRow> = {};
    funcionarios.forEach(f => { m[f.id] = f; });
    return m;
  }, [funcionarios]);

  // ── Period filtering ──
  const filteredFeedbacks = useMemo(() => feedbacks.filter(f => {
    const d = new Date(f.criado_em).toISOString().split('T')[0];
    return d >= period.start && d <= period.end;
  }), [feedbacks, period]);

  const filteredAttendance = useMemo(() => attendance.filter(a => a.date >= period.start && a.date <= period.end), [attendance, period]);
  const filteredWarnings = useMemo(() => warnings.filter(w => w.date >= period.start && w.date <= period.end), [warnings, period]);
  const filteredEvents = useMemo(() => events.filter(e => e.event_date >= period.start && e.event_date <= period.end), [events, period]);
  const filteredMeetings = useMemo(() => meetings.filter(m => m.meeting_date >= period.start && m.meeting_date <= period.end), [meetings, period]);
  const filteredOvertime = useMemo(() => overtime.filter(o => o.period_start <= period.end && o.period_end >= period.start), [overtime, period]);

  // ── Feedback metrics ──
  const totalFb = filteredFeedbacks.length;
  const resolvidosFb = filteredFeedbacks.filter(f => f.status === 'resolvido').length;
  const taxaResolucao = totalFb > 0 ? Math.round((resolvidosFb / totalFb) * 100) : 0;

  const deptCounts: Record<string, number> = {};
  filteredFeedbacks.forEach(f => { deptCounts[f.setor] = (deptCounts[f.setor] || 0) + 1; });
  const departamentos = Object.entries(deptCounts).map(([key, count]) => ({
    dept: setorLabels[key as FeedbackSetor] || key, count, pct: totalFb > 0 ? Math.round((count / totalFb) * 100) : 0,
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
  filteredFeedbacks.forEach(f => { const g = f.gestor || 'Sem gestor'; gestorCounts[g] = (gestorCounts[g] || 0) + 1; });
  const gestorData = Object.entries(gestorCounts).map(([nome, count]) => ({ nome, count })).sort((a, b) => b.count - a.count);

  // ── Attendance metrics ──
  const attDeviations = filteredAttendance.filter(a => ['falta', 'falta_injustificada', 'falta_justificada', 'atestado'].includes(a.status));
  const faltasInj = filteredAttendance.filter(a => a.status === 'falta' || a.status === 'falta_injustificada').length;
  const faltasJust = filteredAttendance.filter(a => a.status === 'falta_justificada').length;
  const atestados = filteredAttendance.filter(a => a.status === 'atestado').length;
  const extras = filteredAttendance.filter(a => a.status === 'extra').length;

  // ── Warning metrics ──
  const warningsApplied = filteredWarnings.filter(w => w.applied).length;
  const warningsPending = filteredWarnings.filter(w => !w.applied).length;

  // ── Meeting metrics ──
  const meetingsDone = filteredMeetings.filter(m => m.status === 'completed').length;
  const meetingsScheduled = filteredMeetings.filter(m => m.status === 'scheduled').length;

  // ── Overtime metrics ──
  const totalExtras = filteredOvertime.reduce((s, o) => s + o.extras_count, 0);

  // ── Top desvios per employee ──
  const desviosPorFunc = useMemo(() => {
    const map: Record<string, { nome: string; faltas: number; atestados: number; advertencias: number; eventos: number; total: number }> = {};
    attDeviations.forEach(a => {
      const emp = empMap[a.employee_id];
      if (!emp) return;
      if (!map[emp.id]) map[emp.id] = { nome: emp.nome, faltas: 0, atestados: 0, advertencias: 0, eventos: 0, total: 0 };
      if (a.status === 'atestado') map[emp.id].atestados++;
      else map[emp.id].faltas++;
      map[emp.id].total++;
    });
    filteredWarnings.forEach(w => {
      const emp = empMap[w.employee_id];
      if (!emp) return;
      if (!map[emp.id]) map[emp.id] = { nome: emp.nome, faltas: 0, atestados: 0, advertencias: 0, eventos: 0, total: 0 };
      map[emp.id].advertencias++;
      map[emp.id].total++;
    });
    filteredEvents.forEach(ev => {
      const emp = funcionarios.find(f => f.nome.toLowerCase() === ev.involved_name?.toLowerCase());
      if (!emp) return;
      if (!map[emp.id]) map[emp.id] = { nome: emp.nome, faltas: 0, atestados: 0, advertencias: 0, eventos: 0, total: 0 };
      map[emp.id].eventos++;
      map[emp.id].total++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [attDeviations, filteredWarnings, filteredEvents, empMap, funcionarios]);

  const fbMetrics = [
    { label: 'Total de Feedbacks', value: totalFb.toString() },
    { label: 'Taxa de resolução', value: `${taxaResolucao}%` },
    { label: 'Resolvidos', value: resolvidosFb.toString() },
    { label: 'Pendentes', value: (totalFb - resolvidosFb).toString() },
  ];

  // ══════════ EXPORT: General PDF ══════════
  async function exportPDF() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const logoBase64 = await getBusatoLogoBase64();
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const blue = [...PDF_COLORS.primary] as [number, number, number];
    const blueLt = [...PDF_COLORS.lightBg] as [number, number, number];
    let pageNum = 1;

    function header() {
      drawBusatoHeader(doc, logoBase64, { pageWidth: pw });
    }
    function footer() {
      drawBusatoFooter(doc, pageNum, { pageWidth: pw, pageHeight: ph });
    }
    function section(title: string, y: number) {
      doc.setFillColor(...tealLight);
      doc.rect(14, y, pw - 28, 10, 'F');
      doc.setFillColor(...teal);
      doc.rect(14, y, 3, 10, 'F');
      doc.setTextColor(...teal); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text(title, 21, y + 7);
      doc.setTextColor(0);
      return y + 14;
    }
    function checkPage(y: number, need: number) {
      if (y + need > ph - 25) { footer(); doc.addPage(); pageNum++; header(); return 38; }
      return y;
    }

    header();
    let y = 36;

    // Title
    doc.setFillColor(250, 250, 250); doc.setDrawColor(220);
    doc.roundedRect(14, y, pw - 28, 14, 2, 2, 'FD');
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(30);
    doc.text('RELATÓRIO GERAL CONSOLIDADO', 18, y + 9);
    doc.setFontSize(8); doc.setTextColor(100); doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${period.label}`, pw - 18, y + 9, { align: 'right' });
    y += 22;

    // ── FEEDBACKS ──
    y = section('FEEDBACKS', y);
    autoTable(doc, {
      startY: y, margin: { left: 18, right: 18 },
      head: [['Indicador', 'Valor']],
      body: fbMetrics.map(m => [m.label, m.value]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [...teal], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...tealLight] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    if (departamentos.length > 0) {
      y = checkPage(y, 30);
      autoTable(doc, {
        startY: y, margin: { left: 18, right: 18 },
        head: [['Departamento', 'Qtd', '%']],
        body: departamentos.map(d => [d.dept, d.count.toString(), `${d.pct}%`]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [...teal], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [...tealLight] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── PONTO / OCORRÊNCIAS ──
    y = checkPage(y, 40);
    y = section('PONTO / OCORRÊNCIAS', y);
    autoTable(doc, {
      startY: y, margin: { left: 18, right: 18 },
      head: [['Indicador', 'Quantidade']],
      body: [
        ['Faltas Injustificadas', String(faltasInj)],
        ['Faltas Justificadas', String(faltasJust)],
        ['Atestados Médicos', String(atestados)],
        ['Horas Extras (registros)', String(extras)],
        ['Total Desvios no Período', String(attDeviations.length)],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [...teal], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...tealLight] },
      columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── ADVERTÊNCIAS ──
    y = checkPage(y, 40);
    y = section('ADVERTÊNCIAS', y);
    autoTable(doc, {
      startY: y, margin: { left: 18, right: 18 },
      head: [['Indicador', 'Quantidade']],
      body: [
        ['Advertências Aplicadas', String(warningsApplied)],
        ['Advertências Pendentes', String(warningsPending)],
        ['Total no Período', String(filteredWarnings.length)],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [...teal], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...tealLight] },
      columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    if (filteredWarnings.length > 0) {
      y = checkPage(y, 30);
      autoTable(doc, {
        startY: y, margin: { left: 18, right: 18 },
        head: [['Data', 'Colaborador', 'Motivo', 'Aplicada']],
        body: filteredWarnings.map(w => [
          new Date(w.date + 'T00:00:00').toLocaleDateString('pt-BR'),
          empMap[w.employee_id]?.nome || '—',
          w.reason,
          w.applied ? 'SIM' : 'NÃO',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [...teal], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [...tealLight] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── EVENTOS ──
    y = checkPage(y, 40);
    y = section(`EVENTOS (${filteredEvents.length})`, y);
    if (filteredEvents.length > 0) {
      autoTable(doc, {
        startY: y, margin: { left: 18, right: 18 },
        head: [['Data', 'Envolvido', 'Descrição', 'Local']],
        body: filteredEvents.slice(0, 50).map(ev => [
          new Date(ev.event_date + 'T00:00:00').toLocaleDateString('pt-BR'),
          ev.involved_name,
          ev.description.length > 50 ? ev.description.slice(0, 47) + '...' : ev.description,
          ev.location || '—',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [...teal], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [...tealLight] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(9); doc.setTextColor(120);
      doc.text('Nenhum evento no período.', 18, y + 2); y += 10;
    }

    // ── REUNIÕES ──
    y = checkPage(y, 40);
    y = section(`REUNIÕES (${filteredMeetings.length})`, y);
    autoTable(doc, {
      startY: y, margin: { left: 18, right: 18 },
      head: [['Indicador', 'Quantidade']],
      body: [
        ['Reuniões Realizadas', String(meetingsDone)],
        ['Reuniões Agendadas', String(meetingsScheduled)],
        ['Total no Período', String(filteredMeetings.length)],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [...teal], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...tealLight] },
      columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── HORAS EXTRAS ──
    y = checkPage(y, 30);
    y = section('CONTROLE DE HORAS EXTRAS', y);
    autoTable(doc, {
      startY: y, margin: { left: 18, right: 18 },
      head: [['Indicador', 'Quantidade']],
      body: [
        ['Total Extras no Período', String(totalExtras)],
        ['Registros de Controle', String(filteredOvertime.length)],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [...teal], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...tealLight] },
      columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── TOP DESVIOS ──
    if (desviosPorFunc.length > 0) {
      y = checkPage(y, 40);
      y = section('TOP COLABORADORES COM DESVIOS', y);
      autoTable(doc, {
        startY: y, margin: { left: 18, right: 18 },
        head: [['Colaborador', 'Faltas', 'Atestados', 'Advertências', 'Eventos', 'Total']],
        body: desviosPorFunc.map(d => [d.nome, String(d.faltas), String(d.atestados), String(d.advertencias), String(d.eventos), String(d.total)]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [...teal], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [...tealLight] },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center', fontStyle: 'bold' } },
      });
    }

    footer();
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      if (i > 1) header();
      // re-draw footer with correct numbering
      doc.setDrawColor(...teal); doc.setLineWidth(0.5);
      doc.line(14, ph - 14, pw - 14, ph - 14);
      doc.setFontSize(7); doc.setTextColor(120); doc.setFont('helvetica', 'normal');
      doc.text('Busato — Documento gerado automaticamente pelo sistema. Proibida a reprodução sem autorização.', 14, ph - 9);
      doc.text(`Página ${i} / ${totalPages}`, pw - 14, ph - 9, { align: 'right' });
    }

    doc.save(`Relatorio_Geral_${period.start}_${period.end}.pdf`);
  }

  async function exportExcel() {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fbMetrics.map(m => ({ Métrica: m.label, Valor: m.value }))), 'Feedbacks');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(departamentos.map(d => ({ Departamento: d.dept, Feedbacks: d.count, Percentual: `${d.pct}%` }))), 'Departamentos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Indicador: 'Faltas Injustificadas', Quantidade: faltasInj },
      { Indicador: 'Faltas Justificadas', Quantidade: faltasJust },
      { Indicador: 'Atestados', Quantidade: atestados },
      { Indicador: 'Horas Extras', Quantidade: extras },
      { Indicador: 'Total Desvios', Quantidade: attDeviations.length },
    ]), 'Ponto');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredWarnings.map(w => ({
      Data: new Date(w.date + 'T00:00:00').toLocaleDateString('pt-BR'),
      Colaborador: empMap[w.employee_id]?.nome || '—',
      Motivo: w.reason, Aplicada: w.applied ? 'SIM' : 'NÃO',
    }))), 'Advertências');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredEvents.map(ev => ({
      Data: new Date(ev.event_date + 'T00:00:00').toLocaleDateString('pt-BR'),
      Envolvido: ev.involved_name, Descrição: ev.description, Local: ev.location || '—',
    }))), 'Eventos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredMeetings.map(m => ({
      Data: new Date(m.meeting_date + 'T00:00:00').toLocaleDateString('pt-BR'),
      Gestor: m.manager_name, Status: m.status, Colaborador: empMap[m.employee_id]?.nome || '—',
    }))), 'Reuniões');
    if (desviosPorFunc.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(desviosPorFunc.map(d => ({
        Colaborador: d.nome, Faltas: d.faltas, Atestados: d.atestados, Advertências: d.advertencias, Eventos: d.eventos, Total: d.total,
      }))), 'Top Desvios');
    }
    XLSX.writeFile(wb, `Relatorio_Geral_${period.start}_${period.end}.xlsx`);
  }

  // ══════════ EXPORT: Employee Ficha PDF ══════════
  async function exportEmployeePDF() {
    if (!selectedEmployee) return;
    const emp = funcionarios.find(f => f.id === selectedEmployee);
    if (!emp) return;

    const empFeedbacks = filteredFeedbacks.filter(f => f.autor?.toLowerCase() === emp.nome.toLowerCase());

    const [fitRes, goalsRes, eventsRes, attRes, warnRes] = await Promise.all([
      supabase.from('fit_cultural').select('criteria, stage, score').eq('employee_id', emp.id),
      supabase.from('goals').select('*').eq('cargo', emp.cargo),
      supabase.from('events').select('*').ilike('involved_name', emp.nome).gte('event_date', period.start).lte('event_date', period.end).order('event_date', { ascending: false }),
      supabase.from('daily_attendance').select('*').eq('employee_id', emp.id).gte('date', period.start).lte('date', period.end).order('date', { ascending: false }),
      supabase.from('employee_warnings').select('*').eq('employee_id', emp.id).gte('date', period.start).lte('date', period.end).order('date', { ascending: false }),
    ]);

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const logoBase64 = await getBusatoLogoBase64();
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const teal: [number, number, number] = [13, 148, 136];
    const tealLt: [number, number, number] = [232, 245, 243];
    const dark: [number, number, number] = [30, 40, 50];
    const gray: [number, number, number] = [120, 130, 140];
    const turnoLabels: Record<string, string> = { dia_a: 'Dia A', dia_b: 'Dia B', noite_a: 'Noite A', noite_b: 'Noite B', adm: 'Administrativo' };
    let pageNum = 1;

    function addHeader() {
      drawBusatoHeader(doc, logoBase64, { pageWidth: pageW });
    }
    function addFooter() {
      drawBusatoFooter(doc, pageNum, { pageWidth: pageW, pageHeight: pageH });
    }
    function sect(title: string, y: number) {
      doc.setFillColor(...tealLt); doc.rect(14, y, pageW - 28, 10, 'F');
      doc.setFillColor(...teal); doc.rect(14, y, 3, 10, 'F');
      doc.setTextColor(...teal); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text(title, 21, y + 7); doc.setTextColor(0);
      return y + 14;
    }
    function checkPage(y: number, n: number) {
      if (y + n > pageH - 25) { addFooter(); doc.addPage(); pageNum++; addHeader(); return 38; }
      return y;
    }

    addHeader();
    let y = 36;

    doc.setFillColor(250, 250, 250); doc.setDrawColor(220);
    doc.roundedRect(14, y, pageW - 28, 18, 2, 2, 'FD');
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...dark);
    doc.text('FICHA COMPLETA DO COLABORADOR', 18, y + 8);
    doc.setFontSize(9); doc.setTextColor(...gray); doc.setFont('helvetica', 'normal');
    doc.text(`Matrícula: ${emp.id.substring(0, 8).toUpperCase()}`, 18, y + 15);
    y += 24;

    y = sect('DADOS CADASTRAIS', y);
    autoTable(doc, {
      startY: y, margin: { left: 18, right: 18 }, theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3, textColor: dark },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, textColor: teal } },
      body: [
        ['Nome Completo', emp.nome], ['Cargo', emp.cargo], ['Departamento', emp.departamento],
        ['E-mail', emp.email || '—'], ['Turno', turnoLabels[emp.turno] || emp.turno || '—'],
        ['Letra', emp.letra || '—'], ['Escolaridade', emp.escolaridade || '—'],
        ['Data de Admissão', emp.data_admissao ? new Date(emp.data_admissao).toLocaleDateString('pt-BR') : '—'],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Feedbacks
    y = checkPage(y, 30);
    y = sect(`HISTÓRICO DE FEEDBACKS (${empFeedbacks.length})`, y);
    if (empFeedbacks.length > 0) {
      autoTable(doc, {
        startY: y, margin: { left: 18, right: 18 },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: teal, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        head: [['Título', 'Status', 'Prioridade', 'Gestor', 'Data']],
        body: empFeedbacks.map(f => [f.titulo, f.status, f.prioridade, f.gestor || '—', new Date(f.criado_em).toLocaleDateString('pt-BR')]),
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9); doc.setTextColor(...gray); doc.text('Nenhum feedback registrado.', 18, y + 2); y += 12;
    }

    // Fit Cultural
    const fitData = (fitRes.data || []) as any[];
    const fitScored = fitData.filter(s => s.score != null);
    y = checkPage(y, 30);
    y = sect('AVALIAÇÃO FIT CULTURAL', y);
    if (fitScored.length > 0) {
      const stageLabels: Record<string, string> = { autoavaliacao: 'Autoavaliação', gestor: 'Gestor', calibracao: 'Calibração', validacao: 'Validação' };
      autoTable(doc, {
        startY: y, margin: { left: 18, right: 18 },
        headStyles: { fillColor: teal, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        head: [['Critério', 'Etapa', 'Nota']],
        body: fitScored.map(s => [s.criteria, stageLabels[s.stage] || s.stage, String(s.score)]),
        styles: { fontSize: 8, cellPadding: 3 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9); doc.setTextColor(...gray); doc.text('Nenhuma avaliação FIT Cultural registrada.', 18, y + 2); y += 12;
    }

    // Goals
    const goalsData = (goalsRes.data || []) as any[];
    y = checkPage(y, 30);
    y = sect(`METAS — ${emp.cargo.toUpperCase()}`, y);
    if (goalsData.length > 0) {
      autoTable(doc, {
        startY: y, margin: { left: 18, right: 18 },
        headStyles: { fillColor: teal, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        head: [['Descrição', 'Peso (%)', 'Resultado', 'Status']],
        body: goalsData.map(g => {
          let status = '—';
          if (g.resultado != null) { if (g.resultado >= 100) status = '✓ Atingida'; else if (g.resultado >= 80) status = '◐ Parcial'; else status = '✗ Abaixo'; }
          return [g.descricao, `${g.peso}%`, g.resultado != null ? `${g.resultado}%` : '—', status];
        }),
        styles: { fontSize: 8, cellPadding: 3 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9); doc.setTextColor(...gray); doc.text('Nenhuma meta definida para este cargo.', 18, y + 2); y += 12;
    }

    // Attendance deviations
    const empAtt = (attRes.data || []) as any[];
    const empDevs = empAtt.filter((a: any) => ['falta', 'falta_injustificada', 'falta_justificada', 'atestado'].includes(a.status));
    y = checkPage(y, 30);
    y = sect(`REGISTROS DE PONTO — DESVIOS (${empDevs.length})`, y);
    if (empDevs.length > 0) {
      autoTable(doc, {
        startY: y, margin: { left: 18, right: 18 },
        headStyles: { fillColor: teal, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [...tealLt] },
        head: [['Data', 'Status', 'Observação']],
        body: empDevs.map((a: any) => [
          new Date(a.date + 'T00:00:00').toLocaleDateString('pt-BR'),
          attendanceLabels[a.status] || a.status,
          a.observation || '—',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9); doc.setTextColor(...gray); doc.text('Nenhum desvio de ponto no período.', 18, y + 2); y += 12;
    }

    // Warnings
    const empWarns = (warnRes.data || []) as any[];
    y = checkPage(y, 30);
    y = sect(`ADVERTÊNCIAS (${empWarns.length})`, y);
    if (empWarns.length > 0) {
      autoTable(doc, {
        startY: y, margin: { left: 18, right: 18 },
        headStyles: { fillColor: teal, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [...tealLt] },
        head: [['Data', 'Motivo', 'Aplicada', 'Observação']],
        body: empWarns.map((w: any) => [
          new Date(w.date + 'T00:00:00').toLocaleDateString('pt-BR'), w.reason, w.applied ? 'SIM' : 'NÃO', w.observation || '—',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9); doc.setTextColor(...gray); doc.text('Nenhuma advertência no período.', 18, y + 2); y += 12;
    }

    // Events
    const empEvents = (eventsRes.data || []) as any[];
    y = checkPage(y, 30);
    y = sect(`HISTÓRICO DE EVENTOS (${empEvents.length})`, y);
    if (empEvents.length > 0) {
      autoTable(doc, {
        startY: y, margin: { left: 18, right: 18 },
        headStyles: { fillColor: teal, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [...tealLt] },
        head: [['Data', 'Descrição', 'Local', 'Equipamento']],
        body: empEvents.map((ev: any) => [
          ev.event_date ? new Date(ev.event_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—',
          ev.description?.length > 50 ? ev.description.slice(0, 47) + '...' : (ev.description || '—'),
          ev.location || '—', ev.equipment || '—',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9); doc.setTextColor(...gray); doc.text('Nenhum evento registrado.', 18, y + 2); y += 12;
    }

    // Signature
    y = checkPage(y, 40); y += 14;
    doc.setDrawColor(200); doc.setLineWidth(0.3);
    doc.line(14, y + 20, 90, y + 20);
    doc.line(pageW - 90, y + 20, pageW - 14, y + 20);
    doc.setFontSize(8); doc.setTextColor(...gray); doc.setFont('helvetica', 'normal');
    doc.text('Assinatura do Colaborador', 52, y + 26, { align: 'center' });
    doc.text('Assinatura do Gestor', pageW - 52, y + 26, { align: 'center' });

    addFooter();
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      if (i > 1) addHeader();
      doc.setDrawColor(...teal); doc.setLineWidth(0.5);
      doc.line(14, pageH - 14, pageW - 14, pageH - 14);
      doc.setFontSize(7); doc.setTextColor(...gray); doc.setFont('helvetica', 'normal');
      doc.text('Busato — Documento gerado automaticamente pelo sistema. Proibida a reprodução sem autorização.', 14, pageH - 9);
      doc.text(`Página ${i} / ${totalPages}`, pageW - 14, pageH - 9, { align: 'right' });
    }

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

      {/* ══ KPIs: Feedbacks ══ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Feedbacks</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {fbMetrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`corporate-kpi ${i === 0 ? '' : i === 1 ? 'corporate-kpi-accent' : i === 2 ? 'corporate-kpi-accent' : 'corporate-kpi-warning'}`}>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{m.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ══ KPIs: Ponto / Ocorrências ══ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Ponto / Ocorrências</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Faltas Injustificadas', value: faltasInj, warn: true },
            { label: 'Faltas Justificadas', value: faltasJust },
            { label: 'Atestados', value: atestados },
            { label: 'Horas Extras', value: extras },
            { label: 'Total Desvios', value: attDeviations.length, warn: true },
          ].map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`corporate-kpi ${m.warn ? 'corporate-kpi-warning' : ''}`}>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{m.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ══ KPIs: Advertências + Eventos + Reuniões ══ */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Advertências */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Advertências</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Aplicadas', value: warningsApplied },
              { label: 'Pendentes', value: warningsPending },
            ].map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="corporate-kpi">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{m.value}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Eventos */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Eventos</h2>
          </div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="corporate-kpi">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total no Período</p>
            <p className="text-3xl font-bold text-foreground mt-1">{filteredEvents.length}</p>
          </motion.div>
        </div>

        {/* Reuniões */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Reuniões</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Realizadas', value: meetingsDone },
              { label: 'Agendadas', value: meetingsScheduled },
            ].map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="corporate-kpi">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{m.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Charts: Feedbacks ══ */}
      <div className="grid lg:grid-cols-2 gap-6">
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
                  <motion.div initial={{ width: 0 }} animate={{ width: `${totalFb > 0 ? (g.count / totalFb) * 100 : 0}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }} className="h-full bg-primary rounded-full" />
                </div>
                <span className="text-xs font-semibold text-foreground w-8 text-right">{g.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ══ Top Desvios ══ */}
      {desviosPorFunc.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="corporate-section">
          <div className="corporate-section-header">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Top Colaboradores com Desvios no Período</h2>
            </div>
          </div>
          <div className="corporate-section-body overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-3 font-semibold text-muted-foreground text-xs uppercase">Colaborador</th>
                  <th className="py-2 px-3 font-semibold text-muted-foreground text-xs uppercase text-center">Faltas</th>
                  <th className="py-2 px-3 font-semibold text-muted-foreground text-xs uppercase text-center">Atestados</th>
                  <th className="py-2 px-3 font-semibold text-muted-foreground text-xs uppercase text-center">Advertências</th>
                  <th className="py-2 px-3 font-semibold text-muted-foreground text-xs uppercase text-center">Eventos</th>
                  <th className="py-2 px-3 font-semibold text-muted-foreground text-xs uppercase text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {desviosPorFunc.map((d, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium text-foreground">{d.nome}</td>
                    <td className="py-2 px-3 text-center text-foreground">{d.faltas}</td>
                    <td className="py-2 px-3 text-center text-foreground">{d.atestados}</td>
                    <td className="py-2 px-3 text-center text-foreground">{d.advertencias}</td>
                    <td className="py-2 px-3 text-center text-foreground">{d.eventos}</td>
                    <td className="py-2 px-3 text-center font-bold text-destructive">{d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Department Distribution */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="corporate-section">
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
  );
}
