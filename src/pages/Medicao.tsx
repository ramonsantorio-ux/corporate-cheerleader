import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  Calculator, Upload, Download, FileSpreadsheet, Calendar, Search, Filter,
  CheckCircle2, AlertTriangle, Clock, RefreshCw, Trash2, Plus, FileText,
  Building2, Layers, ChevronDown, Check, ArrowUpDown, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface MedicaoItem {
  id: string;
  data_programacao: string; // YYYY-MM-DD ou DD/MM/YYYY
  tag_programada: string;
  os: string;
  hora_inicio_prog: string; // HH:MM:SS
  hora_fim_prog: string; // HH:MM:SS
  hora_inicio_real: string; // HH:MM:SS
  hora_fim_real: string; // HH:MM:SS
  horas_programadas_str: string; // HH:MM
  horas_realizadas_str: string; // HH:MM
  horas_programadas_dec: number; // Horas em decimal
  horas_realizadas_dec: number; // Horas em decimal
  aderencia_pct: number; // Percentual
  justificativa?: string;
}

// Dados de demonstração idênticos ao print da Vale / Busato Locações
const MOCK_MEDICAO_ITEMS: MedicaoItem[] = [
  { id: '1', data_programacao: '28/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026524152', hora_inicio_prog: '07:00:00', hora_fim_prog: '08:00:00', hora_inicio_real: '07:00:00', hora_fim_real: '08:00:00', horas_programadas_str: '1:00', horas_realizadas_str: '1:00', horas_programadas_dec: 1.0, horas_realizadas_dec: 1.0, aderencia_pct: 100.00 },
  { id: '2', data_programacao: '04/08/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026524550', hora_inicio_prog: '07:00:00', hora_fim_prog: '08:30:00', hora_inicio_real: '07:00:00', hora_fim_real: '08:30:00', horas_programadas_str: '1:30', horas_realizadas_str: '1:30', horas_programadas_dec: 1.5, horas_realizadas_dec: 1.5, aderencia_pct: 100.00 },
  { id: '3', data_programacao: '28/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026524460', hora_inicio_prog: '08:00:00', hora_fim_prog: '08:30:00', hora_inicio_real: '08:00:00', hora_fim_real: '08:30:00', horas_programadas_str: '0:30', horas_realizadas_str: '0:30', horas_programadas_dec: 0.5, horas_realizadas_dec: 0.5, aderencia_pct: 100.00 },
  { id: '4', data_programacao: '25/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026523773', hora_inicio_prog: '07:00:00', hora_fim_prog: '12:25:00', hora_inicio_real: '07:00:00', hora_fim_real: '12:25:00', horas_programadas_str: '5:25', horas_realizadas_str: '5:25', horas_programadas_dec: 5.416, horas_realizadas_dec: 5.416, aderencia_pct: 100.00 },
  { id: '5', data_programacao: '01/08/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026524292', hora_inicio_prog: '07:00:00', hora_fim_prog: '13:15:00', hora_inicio_real: '07:00:00', hora_fim_real: '13:15:00', horas_programadas_str: '6:15', horas_realizadas_str: '6:15', horas_programadas_dec: 6.25, horas_realizadas_dec: 6.25, aderencia_pct: 100.00 },
  { id: '6', data_programacao: '29/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026524222', hora_inicio_prog: '07:00:00', hora_fim_prog: '13:18:00', hora_inicio_real: '07:00:00', hora_fim_real: '13:18:00', horas_programadas_str: '6:18', horas_realizadas_str: '6:18', horas_programadas_dec: 6.3, horas_realizadas_dec: 6.3, aderencia_pct: 100.00 },
  { id: '7', data_programacao: '30/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026524012', hora_inicio_prog: '07:00:00', hora_fim_prog: '16:00:00', hora_inicio_real: '07:00:00', hora_fim_real: '16:00:00', horas_programadas_str: '9:00', horas_realizadas_str: '9:00', horas_programadas_dec: 9.0, horas_realizadas_dec: 9.0, aderencia_pct: 100.00 },
  { id: '8', data_programacao: '23/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026523633', hora_inicio_prog: '07:00:00', hora_fim_prog: '17:30:00', hora_inicio_real: '07:00:00', hora_fim_real: '17:30:00', horas_programadas_str: '10:30', horas_realizadas_str: '10:30', horas_programadas_dec: 10.5, horas_realizadas_dec: 10.5, aderencia_pct: 100.00 },
  { id: '9', data_programacao: '27/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026524082', hora_inicio_prog: '07:00:00', hora_fim_prog: '17:30:00', hora_inicio_real: '07:00:00', hora_fim_real: '17:30:00', horas_programadas_str: '10:30', horas_realizadas_str: '10:30', horas_programadas_dec: 10.5, horas_realizadas_dec: 10.5, aderencia_pct: 100.00 },
  { id: '10', data_programacao: '02/08/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026524348', hora_inicio_prog: '07:00:00', hora_fim_prog: '17:30:00', hora_inicio_real: '07:00:00', hora_fim_real: '17:30:00', horas_programadas_str: '10:30', horas_realizadas_str: '10:30', horas_programadas_dec: 10.5, horas_realizadas_dec: 10.5, aderencia_pct: 100.00 },
  { id: '11', data_programacao: '05/08/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026524619', hora_inicio_prog: '07:00:00', hora_fim_prog: '17:30:00', hora_inicio_real: '07:00:00', hora_fim_real: '17:30:00', horas_programadas_str: '10:30', horas_realizadas_str: '10:30', horas_programadas_dec: 10.5, horas_realizadas_dec: 10.5, aderencia_pct: 100.00 },
  { id: '12', data_programacao: '03/08/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026524481', hora_inicio_prog: '07:00:00', hora_fim_prog: '17:30:00', hora_inicio_real: '07:20:00', hora_fim_real: '17:30:00', horas_programadas_str: '10:30', horas_realizadas_str: '10:10', horas_programadas_dec: 10.5, horas_realizadas_dec: 10.166, aderencia_pct: 96.83, justificativa: 'Atraso na liberação da frente' },
  { id: '13', data_programacao: '21/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026523490', hora_inicio_prog: '07:00:00', hora_fim_prog: '17:30:00', hora_inicio_real: '07:53:00', hora_fim_real: '17:30:00', horas_programadas_str: '10:30', horas_realizadas_str: '9:37', horas_programadas_dec: 10.5, horas_realizadas_dec: 9.616, aderencia_pct: 91.59, justificativa: 'Inspeção diária e checklist' },
  { id: '14', data_programacao: '24/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026523703', hora_inicio_prog: '08:00:00', hora_fim_prog: '17:30:00', hora_inicio_real: '08:00:00', hora_fim_real: '17:30:00', horas_programadas_str: '9:30', horas_realizadas_str: '9:30', horas_programadas_dec: 9.5, horas_realizadas_dec: 9.5, aderencia_pct: 100.00 },
  { id: '15', data_programacao: '31/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026523943', hora_inicio_prog: '08:00:00', hora_fim_prog: '17:30:00', hora_inicio_real: '08:00:00', hora_fim_real: '17:30:00', horas_programadas_str: '9:30', horas_realizadas_str: '9:30', horas_programadas_dec: 9.5, horas_realizadas_dec: 9.5, aderencia_pct: 100.00 },
  { id: '16', data_programacao: '26/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026523830', hora_inicio_prog: '07:00:00', hora_fim_prog: '17:30:00', hora_inicio_real: '08:16:00', hora_fim_real: '17:30:00', horas_programadas_str: '10:30', horas_realizadas_str: '9:14', horas_programadas_dec: 10.5, horas_realizadas_dec: 9.233, aderencia_pct: 87.94, justificativa: 'Condição climática / Chuva' },
  { id: '17', data_programacao: '28/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026524462', hora_inicio_prog: '08:30:00', hora_fim_prog: '17:30:00', hora_inicio_real: '08:30:00', hora_fim_real: '17:30:00', horas_programadas_str: '9:00', horas_realizadas_str: '9:00', horas_programadas_dec: 9.0, horas_realizadas_dec: 9.0, aderencia_pct: 100.00 },
  { id: '18', data_programacao: '04/08/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026525422', hora_inicio_prog: '08:30:00', hora_fim_prog: '17:30:00', hora_inicio_real: '08:30:00', hora_fim_real: '17:30:00', horas_programadas_str: '9:00', horas_realizadas_str: '9:00', horas_programadas_dec: 9.0, horas_realizadas_dec: 9.0, aderencia_pct: 100.00 },
  { id: '19', data_programacao: '22/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026523565', hora_inicio_prog: '07:00:00', hora_fim_prog: '17:30:00', hora_inicio_real: '10:30:00', hora_fim_real: '17:30:00', horas_programadas_str: '10:30', horas_realizadas_str: '7:00', horas_programadas_dec: 10.5, horas_realizadas_dec: 7.0, aderencia_pct: 66.67, justificativa: 'Manutenção corretiva de pneu' },
  { id: '20', data_programacao: '25/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026524429', hora_inicio_prog: '12:25:00', hora_fim_prog: '17:30:00', hora_inicio_real: '12:25:00', hora_fim_real: '17:30:00', horas_programadas_str: '5:05', horas_realizadas_str: '5:05', horas_programadas_dec: 5.083, horas_realizadas_dec: 5.083, aderencia_pct: 100.00 },
  { id: '21', data_programacao: '01/08/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026525402', hora_inicio_prog: '13:15:00', hora_fim_prog: '17:30:00', hora_inicio_real: '13:15:00', hora_fim_real: '17:30:00', horas_programadas_str: '4:15', horas_realizadas_str: '4:15', horas_programadas_dec: 4.25, horas_realizadas_dec: 4.25, aderencia_pct: 100.00 },
  { id: '22', data_programacao: '29/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026524931', hora_inicio_prog: '13:18:00', hora_fim_prog: '17:30:00', hora_inicio_real: '13:18:00', hora_fim_real: '17:30:00', horas_programadas_str: '4:12', horas_realizadas_str: '4:12', horas_programadas_dec: 4.2, horas_realizadas_dec: 4.2, aderencia_pct: 100.00 },
  { id: '23', data_programacao: '30/07/2026', tag_programada: 'BUSATO_CAMINHÃO BASCULANTE 16TON - MFE - TERCEIROS_01', os: '2026525382', hora_inicio_prog: '16:00:00', hora_fim_prog: '17:30:00', hora_inicio_real: '16:00:00', hora_fim_real: '17:30:00', horas_programadas_str: '1:30', horas_realizadas_str: '1:30', horas_programadas_dec: 1.5, horas_realizadas_dec: 1.5, aderencia_pct: 100.00 },
];

// Funções utilitárias de tempo (HH:MM e Decimal)
function decimalToTimeStr(dec: number): string {
  if (isNaN(dec) || dec < 0) return '0:00';
  const totalMinutes = Math.round(dec * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

function timeStrToDecimal(str: string): number {
  if (!str) return 0;
  const parts = str.trim().split(':');
  if (parts.length >= 2) {
    const h = parseFloat(parts[0]) || 0;
    const m = parseFloat(parts[1]) || 0;
    const s = parts.length > 2 ? parseFloat(parts[2]) || 0 : 0;
    return h + m / 60 + s / 3600;
  }
  const num = parseFloat(str.replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

function calculateDurationDecimal(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 0;
  const start = timeStrToDecimal(startStr);
  const end = timeStrToDecimal(endStr);
  let diff = end - start;
  if (diff < 0) diff += 24; // caso vire a meia noite
  return Math.max(0, diff);
}

export default function Medicao() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados dos Dados
  const [items, setItems] = useState<MedicaoItem[]>(() => {
    const saved = localStorage.getItem('busato_medicao_items');
    if (saved) {
      try { return JSON.parse(saved); } catch { return MOCK_MEDICAO_ITEMS; }
    }
    return MOCK_MEDICAO_ITEMS;
  });

  const [startDate, setStartDate] = useState<string>('2026-07-21');
  const [endDate, setEndDate] = useState<string>('2026-08-20');
  const [selectedTag, setSelectedTag] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Modal de edição / inserção manual
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicaoItem | null>(null);

  // Salva no localStorage para persistência imediata
  useEffect(() => {
    localStorage.setItem('busato_medicao_items', JSON.stringify(items));
  }, [items]);

  // Lista única de TAGs
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => { if (it.tag_programada) set.add(it.tag_programada.trim()); });
    return Array.from(set).sort();
  }, [items]);

  // Filtragem dos itens
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Filtro de TAG
      if (selectedTag !== 'todas' && item.tag_programada !== selectedTag) {
        return false;
      }

      // Filtro de Busca (OS ou Justificativa)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchOs = item.os?.toLowerCase().includes(term);
        const matchTag = item.tag_programada?.toLowerCase().includes(term);
        const matchJust = item.justificativa?.toLowerCase().includes(term);
        if (!matchOs && !matchTag && !matchJust) return false;
      }

      // Filtro de Data (se preenchido)
      if (startDate && endDate && item.data_programacao) {
        // Normaliza data de DD/MM/YYYY para YYYY-MM-DD para comparação
        let itemIso = item.data_programacao;
        if (item.data_programacao.includes('/')) {
          const [d, m, y] = item.data_programacao.split('/');
          itemIso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        if (itemIso < startDate || itemIso > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedTag, searchTerm, startDate, endDate]);

  // Totais e KPIs Consolidados
  const totals = useMemo(() => {
    let totalProgDec = 0;
    let totalRealDec = 0;

    filteredItems.forEach(it => {
      totalProgDec += it.horas_programadas_dec || 0;
      totalRealDec += it.horas_realizadas_dec || 0;
    });

    const aderenciaGeralPct = totalProgDec > 0 ? (totalRealDec / totalProgDec) * 100 : 100;

    return {
      horasProgramadasStr: decimalToTimeStr(totalProgDec),
      horasRealizadasStr: decimalToTimeStr(totalRealDec),
      horasProgramadasDec: totalProgDec,
      horasRealizadasDec: totalRealDec,
      aderenciaPct: aderenciaGeralPct,
      totalRegistros: filteredItems.length
    };
  }, [filteredItems]);

  // Parser do Excel importado
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawData || rawData.length === 0) {
          toast({ title: 'Planilha Vazia', description: 'Nenhum dado encontrado no arquivo selecionado.', variant: 'destructive' });
          setIsProcessing(false);
          return;
        }

        const parsedItems: MedicaoItem[] = [];

        rawData.forEach((row, idx) => {
          // Mapeamento flexível de cabeçalhos
          const dataProg = row['Data Programação'] || row['Data Programacao'] || row['Data'] || row['DATA'] || '';
          const tagProg = row['TAG Programada'] || row['TAG Programacao'] || row['TAG'] || row['Equipamento'] || row['TAG / Equipamento'] || '';
          const os = String(row['OS'] || row['Ordem de Serviço'] || row['Ordem de Servico'] || row['Num OS'] || '').trim();
          
          const horaIniProg = String(row['Hora Início Prog'] || row['Hora Inicio Prog'] || row['Inicio Prog'] || row['Hora Inicial Prog'] || '07:00:00').trim();
          const horaFimProg = String(row['Hora Fim Prog'] || row['Fim Prog'] || row['Hora Final Prog'] || '17:30:00').trim();
          const horaIniReal = String(row['Hora Início Real'] || row['Hora Inicio Real'] || row['Inicio Real'] || row['Hora Inicial Real'] || horaIniProg).trim();
          const horaFimReal = String(row['Hora Fim Real'] || row['Fim Real'] || row['Hora Final Real'] || horaFimProg).trim();
          
          let horasProgStr = String(row['Horas Programadas'] || row['Horas Prog'] || '').trim();
          let horasRealStr = String(row['Horas Realizadas'] || row['Horas Real'] || '').trim();
          const justificativa = String(row['Justificativa'] || row['Motivo'] || row['Observação'] || '').trim();

          // Calcula decimais
          let progDec = timeStrToDecimal(horasProgStr);
          if (progDec === 0) {
            progDec = calculateDurationDecimal(horaIniProg, horaFimProg);
            horasProgStr = decimalToTimeStr(progDec);
          }

          let realDec = timeStrToDecimal(horasRealStr);
          if (realDec === 0) {
            realDec = calculateDurationDecimal(horaIniReal, horaFimReal);
            horasRealStr = decimalToTimeStr(realDec);
          }

          const aderencia = progDec > 0 ? (realDec / progDec) * 100 : 100;

          // Normaliza Data
          let formattedDate = dataProg;
          if (dataProg instanceof Date) {
            const d = dataProg.getDate().toString().padStart(2, '0');
            const m = (dataProg.getMonth() + 1).toString().padStart(2, '0');
            const y = dataProg.getFullYear();
            formattedDate = `${d}/${m}/${y}`;
          }

          if (tagProg || os || dataProg) {
            parsedItems.push({
              id: `imp_${Date.now()}_${idx}`,
              data_programacao: formattedDate || '21/07/2026',
              tag_programada: tagProg || 'BUSATO_LOCAÇÕES',
              os: os || `OS-${idx + 1}`,
              hora_inicio_prog: horaIniProg,
              hora_fim_prog: horaFimProg,
              hora_inicio_real: horaIniReal,
              hora_fim_real: horaFimReal,
              horas_programadas_str: horasProgStr,
              horas_realizadas_str: horasRealStr,
              horas_programadas_dec: progDec,
              horas_realizadas_dec: realDec,
              aderencia_pct: Number(aderencia.toFixed(2)),
              justificativa
            });
          }
        });

        if (parsedItems.length > 0) {
          setItems(parsedItems);
          setImportDialogOpen(false);
          toast({
            title: 'Importação Concluída com Sucesso!',
            description: `${parsedItems.length} registros de medição e aderência foram importados e calculados.`,
          });
        } else {
          toast({ title: 'Aviso', description: 'Não foi possível reconhecer o layout das colunas da planilha.', variant: 'destructive' });
        }
      } catch (err: any) {
        console.error('Erro ao ler Excel:', err);
        toast({ title: 'Erro na Leitura do Arquivo', description: err.message || 'Arquivo inválido', variant: 'destructive' });
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // Exportar Excel Consolidado
  const exportToExcel = () => {
    const exportData = filteredItems.map(it => ({
      'Data Programação': it.data_programacao,
      'TAG Programada': it.tag_programada,
      'OS': it.os,
      'Hora Início Prog': it.hora_inicio_prog,
      'Hora Fim Prog': it.hora_fim_prog,
      'Hora Início Real': it.hora_inicio_real,
      'Hora Fim Real': it.hora_fim_real,
      'Horas Programadas': it.horas_programadas_str,
      'Horas Realizadas': it.horas_realizadas_str,
      'Aderência %': `${it.aderencia_pct.toFixed(2)}%`,
      'Justificativa': it.justificativa || ''
    }));

    // Linha de Totalizador
    exportData.push({
      'Data Programação': 'TOTAL CONSOLIDADO',
      'TAG Programada': `Total de ${filteredItems.length} OS`,
      'OS': '',
      'Hora Início Prog': '',
      'Hora Fim Prog': '',
      'Hora Início Real': '',
      'Hora Fim Real': '',
      'Horas Programadas': totals.horasProgramadasStr,
      'Horas Realizadas': totals.horasRealizadasStr,
      'Aderência %': `${totals.aderenciaPct.toFixed(2)}%`,
      'Justificativa': ''
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aderência Medição');
    XLSX.writeFile(wb, `Medicao_Aderencia_Busato_${startDate}_a_${endDate}.xlsx`);
    toast({ title: 'Planilha Exportada!', description: 'Arquivo Excel gerado com sucesso.' });
  };

  // Restaura dados mock
  const restoreMockData = () => {
    setItems(MOCK_MEDICAO_ITEMS);
    toast({ title: 'Dados de Exemplo Restaurados' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ═══ HEADER EXECUTIVO COM IDENTIDADE VISUAL VALE / BUSATO ═══ */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 rounded-2xl p-6 text-white shadow-lg border border-teal-600/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="bg-white/20 backdrop-blur text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/20 uppercase tracking-wider">
              Contratos & Locações
            </span>
            <span className="text-teal-200 text-xs font-semibold">•</span>
            <span className="text-teal-100 text-xs font-medium">Operações & Medição de Equipamentos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Aderência a programação – <span className="italic font-light text-teal-200">Busato locações</span>
          </h1>
          <p className="text-teal-100/80 text-xs sm:text-sm mt-1 max-w-2xl">
            Painel consolidado de medição mensal, controle de horas programadas vs. realizadas e aderência operacional para faturamento.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setImportDialogOpen(true)}
            className="bg-white hover:bg-teal-50 text-teal-900 font-bold shadow-md hover:shadow-lg transition-all text-xs sm:text-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-teal-700" />
            <span>Importar Planilha Excel</span>
          </Button>

          <Button
            onClick={exportToExcel}
            variant="outline"
            className="bg-teal-800/60 hover:bg-teal-800 text-white border-white/20 text-xs sm:text-sm font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      {/* ═══ FILTROS DO TOPO E KPIS GLOBAIS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Painel de Filtros (Esquerda) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-teal-600" /> Filtros de Medição
            </h3>
            <button 
              onClick={restoreMockData}
              className="text-[11px] text-teal-600 hover:underline font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Restaurar Base Padrão
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Data Programação (Início)</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-10 bg-slate-50 border-slate-200 text-xs font-medium"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Data Programação (Fim)</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-10 bg-slate-50 border-slate-200 text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">TAG Programada / Equipamento</Label>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-xs font-medium truncate">
                <SelectValue placeholder="Todas as TAGs..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="todas">Todas as TAGs ({availableTags.length})</SelectItem>
                {availableTags.map(tag => (
                  <SelectItem key={tag} value={tag} className="text-xs">
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por OS, TAG ou Justificativa..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-slate-50 border-slate-200 text-xs"
              />
            </div>
          </div>
        </div>

        {/* ═══ KPIS DE ADERÊNCIA NO TOPO DIREITO (IGUAL AO PRINT) ═══ */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Horas Programadas */}
          <div className="bg-emerald-500 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Horas Programadas</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">{totals.horasProgramadasStr}</div>
              <span className="text-[11px] text-emerald-100 font-medium mt-0.5 block">
                Total acumulado ({totals.horasProgramadasDec.toFixed(1)}h)
              </span>
            </div>
          </div>

          {/* Card 2: Horas Realizadas */}
          <div className="bg-teal-600 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-100">Horas Realizadas</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">{totals.horasRealizadasStr}</div>
              <span className="text-[11px] text-teal-100 font-medium mt-0.5 block">
                Efetivo executado ({totals.horasRealizadasDec.toFixed(1)}h)
              </span>
            </div>
          </div>

          {/* Card 3: Aderência % */}
          <div className={`rounded-2xl p-5 shadow-md flex flex-col justify-between relative overflow-hidden text-white ${
            totals.aderenciaPct >= 95 ? 'bg-cyan-500' : totals.aderenciaPct >= 85 ? 'bg-amber-500' : 'bg-rose-500'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white/90">Aderência %</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">
                {totals.aderenciaPct.toFixed(2).replace('.', ',')}%
              </div>
              <span className="text-[11px] text-white/90 font-medium mt-0.5 block">
                {totals.aderenciaPct >= 95 ? 'Meta Atingida (≥ 95%)' : 'Abaixo da Meta (< 95%)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TABELA DE DETALHAMENTO & MEDIÇÃO (GRID IDÊNTICO AO EXCEL) ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-700" />
            <h3 className="font-bold text-slate-800 text-sm">
              Detalhamento de Programação & Apontamentos Realizados
            </h3>
            <span className="bg-slate-200 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {filteredItems.length} registros
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 100%
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-2"></span> 85%-99%
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ml-2"></span> &lt; 85%
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-teal-800 text-white font-bold tracking-wider uppercase text-[11px] shadow-xs z-10">
              <tr>
                <th className="p-3 border-r border-teal-700/60 whitespace-nowrap">Data Programação</th>
                <th className="p-3 border-r border-teal-700/60 min-w-[280px]">TAG Programada</th>
                <th className="p-3 border-r border-teal-700/60 text-center whitespace-nowrap">OS</th>
                <th className="p-3 border-r border-teal-700/60 text-center whitespace-nowrap">Hora Início Prog</th>
                <th className="p-3 border-r border-teal-700/60 text-center whitespace-nowrap">Hora Fim Prog</th>
                <th className="p-3 border-r border-teal-700/60 text-center whitespace-nowrap">Hora Início Real</th>
                <th className="p-3 border-r border-teal-700/60 text-center whitespace-nowrap">Hora Fim Real</th>
                <th className="p-3 border-r border-teal-700/60 text-right whitespace-nowrap">Horas Programadas</th>
                <th className="p-3 border-r border-teal-700/60 text-right whitespace-nowrap">Horas Realizadas</th>
                <th className="p-3 border-r border-teal-700/60 text-right whitespace-nowrap">Aderência %</th>
                <th className="p-3 min-w-[200px]">Justificativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => {
                  const is100 = item.aderencia_pct >= 99.9;
                  const isWarning = item.aderencia_pct >= 85 && item.aderencia_pct < 99.9;
                  const isCritical = item.aderencia_pct < 85;

                  return (
                    <tr 
                      key={item.id || index}
                      className={`hover:bg-teal-50/40 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      <td className="p-3 font-semibold text-slate-800 border-r border-slate-100 whitespace-nowrap">
                        {item.data_programacao}
                      </td>
                      <td className="p-3 font-medium text-slate-700 border-r border-slate-100 max-w-[320px] truncate" title={item.tag_programada}>
                        {item.tag_programada}
                      </td>
                      <td className="p-3 font-mono text-center text-slate-600 border-r border-slate-100 whitespace-nowrap">
                        {item.os}
                      </td>
                      <td className="p-3 text-center text-slate-600 font-mono border-r border-slate-100 whitespace-nowrap">
                        {item.hora_inicio_prog}
                      </td>
                      <td className="p-3 text-center text-slate-600 font-mono border-r border-slate-100 whitespace-nowrap">
                        {item.hora_fim_prog}
                      </td>
                      <td className="p-3 text-center text-slate-600 font-mono border-r border-slate-100 whitespace-nowrap">
                        {item.hora_inicio_real}
                      </td>
                      <td className="p-3 text-center text-slate-600 font-mono border-r border-slate-100 whitespace-nowrap">
                        {item.hora_fim_real}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800 border-r border-slate-100 whitespace-nowrap">
                        {item.horas_programadas_str}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800 border-r border-slate-100 whitespace-nowrap">
                        {item.horas_realizadas_str}
                      </td>
                      <td className="p-3 text-right border-r border-slate-100 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          is100 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isWarning 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.aderencia_pct.toFixed(2).replace('.', ',')}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {item.justificativa ? (
                          <span className="italic text-slate-700">{item.justificativa}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>

            {/* ═══ LINHA TOTALIZADORA FIXA NO RODAPÉ (IGUAL AO PRINT) ═══ */}
            <tfoot className="sticky bottom-0 bg-teal-800 text-white font-bold uppercase text-xs z-10 shadow-md">
              <tr>
                <td colSpan={7} className="p-3 text-left tracking-wider font-black">
                  Total Geral Consolidado
                </td>
                <td className="p-3 text-right font-black text-sm text-emerald-200">
                  {totals.horasProgramadasStr}
                </td>
                <td className="p-3 text-right font-black text-sm text-emerald-200">
                  {totals.horasRealizadasStr}
                </td>
                <td className="p-3 text-right font-black text-sm text-cyan-200">
                  {totals.aderenciaPct.toFixed(2).replace('.', ',')}%
                </td>
                <td className="p-3 text-left text-xs text-teal-200 normal-case font-normal">
                  {totals.totalRegistros} OS apuradas
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ═══ MODAL DE IMPORTAÇÃO DE PLANILHA EXCEL ═══ */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-800 text-lg">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              Importar Planilha de Aderência e Medição
            </DialogTitle>
            <DialogDescription>
              Selecione o arquivo Excel (.xlsx, .xls ou .csv) fornecido pela Vale / Operação para importar e calcular automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-teal-300 hover:border-teal-600 bg-teal-50/40 hover:bg-teal-50/80 transition-all rounded-2xl p-8 text-center cursor-pointer space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Clique para selecionar ou arraste o arquivo aqui</p>
                <p className="text-xs text-slate-500 mt-1">Formatos suportados: Excel (.xlsx, .xls) ou CSV</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-700">📌 Colunas reconhecidas automaticamente:</p>
              <p>• Data Programação, TAG Programada, OS, Hora Início/Fim Prog, Hora Início/Fim Real, Horas Programadas, Horas Realizadas e Justificativa.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
