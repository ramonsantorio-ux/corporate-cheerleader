import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MedicaoForm } from '@/components/MedicaoForm';
import { seedNotificacoes } from '@/pages/GestaoNotificacoes';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { TrendingUp, DollarSign, Calculator, LineChart as LineChartIcon, ShieldAlert, Target, AlertTriangle, FileWarning, TrendingDown, ArrowUpRight, ArrowDownRight, Minus, Plus, Trash2, Info, Pencil, Eye, EyeOff, RefreshCcw, Download, Upload, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, ReferenceLine, LabelList, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import * as XLSX from 'xlsx';
import { PerformanceMensalTab } from '@/components/PerformanceMensalTab';
import MetasBusato from '@/components/MetasBusato';
import MetasPorto from '@/components/MetasPorto';

interface OfensorFinanceiro {
  motivo: string;
  valor: number;
}

interface OfensorNotificacao {
  motivo: string;
  dataStr?: string;
  local?: string;
  solicitante?: string;
  planoDeAcao?: string;
  isGlobal?: boolean;
}

interface Medicao {
  id: number;
  _supabaseId?: string;
  mes: string;
  aderencia: number;
  fatLocacao: number;
  fatMaoDeObra: number;
  eventuais: number;
  impostoIrrf?: number;
  impostoPis?: number;
  impostoCofins?: number;
  impostoCsll?: number;
  impostoIss?: number;
  impostoInss?: number;
  impostoInssAdSat?: number;
  manutencaoPecas?: number;
  manutencaoServicos?: number;
  manutencaoPneus?: number;
  manutencaoLubrificacao?: number;
  combustivelDiesel?: number; // legacy
  combustivelDieselS10?: number;
  combustivelDieselS500?: number;
  combustivelGasolina?: number;
  uniforme?: number;
  epi?: number;
  escritorioMaterial?: number;
  escritorioLimpeza?: number;
  descontos: OfensorFinanceiro[];
  multas: OfensorFinanceiro[];
  notificacoes: OfensorNotificacao[];
  equipamentosPerdidos?: { motivo: string; aderencia: string }[];
  custoTurnover?: number;
  metaImpostos?: number;
  metaFolha?: number;
  metaManutencao?: number;
  metaCombustivel?: number;
  metaSeguranca?: number;
  metaMateriais?: number;
  manutencaoLavador?: number;
  manutencaoPreventiva?: number;
  custoFolha: number;
  custoFolhaQtd?: number;
  horasExtras: number;
  horasExtrasQtd?: number;
  beneficioCafeDaManha?: number;
  beneficioSeguroDeVida?: number;
  beneficioPlanoDeSaude?: number;
  beneficioPlanoOdontologico?: number;
  beneficioTicketAlimentacao?: number;
  beneficioValeTransporte?: number;
  beneficioMaisParaTodos?: number;
  beneficioRefeicao?: number;
  folhaInss?: number;
  folhaFgts?: number;
  folhaIrrf?: number;
  performanceMensal?: { desvio: string; qtde: number }[];
  aderenciaDiaria?: { dia: string; aderencia: number }[];
  aderenciaMinerioDiaria?: { dia: string; aderencia: number }[];
  aderenciaTpmDiaria?: { dia: string; aderencia: number }[];
}

const mockData: Medicao[] = [
  {
    "id": 1,
    "mes": "Ago/2025",
    "aderencia": 95.25,
    "fatLocacao": 2657193.57,
    "fatMaoDeObra": 2894.56,
    "eventuais": 0,
    "descontos": [],
    "multas": [],
    "notificacoes": [],
    "custoFolha": 863991.85,
    "horasExtras": 19599.71,
    "impostoInss": 172798.37,
    "impostoPis": 43891.45,
    "impostoCofins": 202166.7,
    "impostoIss": 133004.41,
    "impostoCsll": 28728.95,
    "impostoInssAdSat": 25919.76,
    "manutencaoPecas": 121087.37,
    "manutencaoServicos": 45444.52,
    "combustivelDieselS10": 218115.91,
    "uniforme": 5000,
    "escritorioMaterial": 2000,
    "beneficioVr": 45000,
    "beneficioVt": 15000,
    "planoSaude": 35000,
    "impostoFgts": 69119.35
  },
  {
    "id": 2,
    "mes": "Set/2025",
    "aderencia": 96.9,
    "fatLocacao": 2553023.52,
    "fatMaoDeObra": 21169.61,
    "eventuais": 0,
    "descontos": [],
    "multas": [],
    "notificacoes": [],
    "custoFolha": 863167.41,
    "horasExtras": 4750.38,
    "impostoInss": 172633.48,
    "impostoPis": 42474.19,
    "impostoCofins": 195638.68,
    "impostoIss": 128709.66,
    "impostoCsll": 27801.29,
    "impostoInssAdSat": 25895.02,
    "manutencaoPecas": 135221.28,
    "manutencaoServicos": 37949.78,
    "combustivelDieselS10": 234795.68,
    "uniforme": 5000,
    "escritorioMaterial": 2000,
    "beneficioVr": 45000,
    "beneficioVt": 15000,
    "planoSaude": 35000,
    "impostoFgts": 69053.39
  },
  {
    "id": 3,
    "mes": "Out/2025",
    "aderencia": 98.24,
    "fatLocacao": 2695354.76,
    "fatMaoDeObra": 47648.79,
    "eventuais": 0,
    "descontos": [],
    "multas": [],
    "notificacoes": [],
    "custoFolha": 868157.16,
    "horasExtras": 17518.22,
    "impostoInss": 173631.43,
    "impostoPis": 45259.56,
    "impostoCofins": 208468.27,
    "impostoIss": 137150.18,
    "impostoCsll": 29624.44,
    "impostoInssAdSat": 26044.71,
    "manutencaoPecas": 142742.72,
    "manutencaoServicos": 42679.75,
    "combustivelDieselS10": 213826.09,
    "uniforme": 5000,
    "escritorioMaterial": 2000,
    "beneficioVr": 45000,
    "beneficioVt": 15000,
    "planoSaude": 35000,
    "impostoFgts": 69452.57
  },
  {
    "id": 4,
    "mes": "Nov/2025",
    "aderencia": 97.64,
    "fatLocacao": 2576460.35,
    "fatMaoDeObra": 23932.71,
    "eventuais": 0,
    "descontos": [],
    "multas": [],
    "notificacoes": [],
    "custoFolha": 851694.95,
    "horasExtras": 4188.74,
    "impostoInss": 170338.99,
    "impostoPis": 42906.49,
    "impostoCofins": 197629.87,
    "impostoIss": 130019.65,
    "impostoCsll": 28084.25,
    "impostoInssAdSat": 25550.85,
    "manutencaoPecas": 152992.79,
    "manutencaoServicos": 49046.48,
    "combustivelDieselS10": 210194.03,
    "uniforme": 5000,
    "escritorioMaterial": 2000,
    "beneficioVr": 45000,
    "beneficioVt": 15000,
    "planoSaude": 35000,
    "impostoFgts": 68135.6
  },
  {
    "id": 5,
    "mes": "Dez/2025",
    "aderencia": 96.55,
    "fatLocacao": 2456504.91,
    "fatMaoDeObra": 23379.68,
    "eventuais": 0,
    "descontos": [],
    "multas": [],
    "notificacoes": [],
    "custoFolha": 869895.75,
    "horasExtras": 10379.4,
    "impostoInss": 173979.15,
    "impostoPis": 40918.1,
    "impostoCofins": 188471.23,
    "impostoIss": 123994.23,
    "impostoCsll": 26782.75,
    "impostoInssAdSat": 26096.87,
    "manutencaoPecas": 130384.37,
    "manutencaoServicos": 32624.84,
    "combustivelDieselS10": 223833.23,
    "uniforme": 5000,
    "escritorioMaterial": 2000,
    "beneficioVr": 45000,
    "beneficioVt": 15000,
    "planoSaude": 35000,
    "impostoFgts": 69591.66
  },
  {
    "id": 6,
    "mes": "Jan/2026",
    "aderencia": 94.42,
    "fatLocacao": 2620917.24,
    "fatMaoDeObra": 16501.69,
    "eventuais": 0,
    "descontos": [],
    "multas": [],
    "notificacoes": [],
    "custoFolha": 876232.83,
    "horasExtras": 19274.3,
    "impostoInss": 175246.57,
    "impostoPis": 43517.41,
    "impostoCofins": 200443.84,
    "impostoIss": 131870.95,
    "impostoCsll": 28484.12,
    "impostoInssAdSat": 26286.98,
    "manutencaoPecas": 156135.64,
    "manutencaoServicos": 42946.16,
    "combustivelDieselS10": 223157.94,
    "uniforme": 5000,
    "escritorioMaterial": 2000,
    "beneficioVr": 45000,
    "beneficioVt": 15000,
    "planoSaude": 35000,
    "impostoFgts": 70098.63
  },
  {
    "id": 7,
    "mes": "Fev/2026",
    "aderencia": 98.18,
    "fatLocacao": 2437646.29,
    "fatMaoDeObra": 17472.12,
    "eventuais": 0,
    "descontos": [],
    "multas": [],
    "notificacoes": [],
    "custoFolha": 907328.74,
    "horasExtras": 18755.73,
    "impostoInss": 181465.75,
    "impostoPis": 40509.45,
    "impostoCofins": 186589,
    "impostoIss": 122755.92,
    "impostoCsll": 26515.28,
    "impostoInssAdSat": 27219.86,
    "manutencaoPecas": 157641.88,
    "manutencaoServicos": 40319.98,
    "combustivelDieselS10": 206840.96,
    "uniforme": 5000,
    "escritorioMaterial": 2000,
    "beneficioVr": 45000,
    "beneficioVt": 15000,
    "planoSaude": 35000,
    "impostoFgts": 72586.3
  },
  {
    "id": 8,
    "mes": "Mar/2026",
    "aderencia": 98.71,
    "fatLocacao": 2678792.49,
    "fatMaoDeObra": 7306.58,
    "eventuais": 0,
    "descontos": [],
    "multas": [],
    "notificacoes": [],
    "custoFolha": 851550.29,
    "horasExtras": 811.08,
    "impostoInss": 170310.06,
    "impostoPis": 44320.63,
    "impostoCofins": 204143.53,
    "impostoIss": 134304.95,
    "impostoCsll": 29009.87,
    "impostoInssAdSat": 25546.51,
    "manutencaoPecas": 137015.37,
    "manutencaoServicos": 42038.06,
    "combustivelDieselS10": 219837.08,
    "uniforme": 5000,
    "escritorioMaterial": 2000,
    "beneficioVr": 45000,
    "beneficioVt": 15000,
    "planoSaude": 35000,
    "impostoFgts": 68124.02
  },
  {
    "id": 9,
    "mes": "Abr/2026",
    "aderencia": 94.85,
    "fatLocacao": 2496379.75,
    "fatMaoDeObra": 38455.92,
    "eventuais": 0,
    "descontos": [],
    "multas": [],
    "notificacoes": [],
    "custoFolha": 877508.18,
    "horasExtras": 5394.69,
    "impostoInss": 175501.64,
    "impostoPis": 41824.79,
    "impostoCofins": 192647.51,
    "impostoIss": 126741.78,
    "impostoCsll": 27376.23,
    "impostoInssAdSat": 26325.25,
    "manutencaoPecas": 126650.27,
    "manutencaoServicos": 49156.4,
    "combustivelDieselS10": 227380.7,
    "uniforme": 5000,
    "escritorioMaterial": 2000,
    "beneficioVr": 45000,
    "beneficioVt": 15000,
    "planoSaude": 35000,
    "impostoFgts": 70200.65
  },
  {
    "id": 10,
    "mes": "Mai/2026",
    "aderencia": 95.64,
    "fatLocacao": 2526574.55,
    "fatMaoDeObra": 12864.83,
    "eventuais": 0,
    "descontos": [],
    "multas": [],
    "notificacoes": [],
    "custoFolha": 873830.56,
    "horasExtras": 8273.06,
    "impostoInss": 174766.11,
    "impostoPis": 41900.75,
    "impostoCofins": 192997.39,
    "impostoIss": 126971.97,
    "impostoCsll": 27425.95,
    "impostoInssAdSat": 26214.92,
    "manutencaoPecas": 173515.64,
    "manutencaoServicos": 38086.56,
    "combustivelDieselS10": 237288.03,
    "uniforme": 5000,
    "escritorioMaterial": 2000,
    "beneficioVr": 45000,
    "beneficioVt": 15000,
    "planoSaude": 35000,
    "impostoFgts": 69906.44
  }
];

export const LISTA_EQUIPAMENTOS = [
  { grupo: "CAMINHÃO BASCULANTE 16TON", itens: ["BASCULANTE 16TON - MFE - 01", "BASCULANTE 16TON - MFE - 02", "BASCULANTE 16TON - MFE - 03", "BASCULANTE 16TON - MFE - 04", "BASCULANTE 16TON - TPM - 01", "BASCULANTE 16TON - TPM - 02"] },
  { grupo: "CAMINHÃO BASCULANTE 6M³", itens: ["BASCULANTE 6M³ - MFE - 01"] },
  { grupo: "CAMINHÃO BROOK", itens: ["BROOK - MFE - 01", "BROOK - TPM - 01"] },
  { grupo: "CAMINHÃO PIPA ASPERSÃO", itens: ["PIPA ASPERSÃO - MFE - 01", "PIPA ASPERSÃO - MFE - 02", "PIPA ASPERSÃO - MFE - 03", "PIPA ASPERSÃO - MFE - 04", "PIPA ASPERSÃO - MFE - 05", "PIPA ASPERSÃO - TPM - 01", "PIPA ASPERSÃO - TPM - 02", "PIPA ASPERSÃO - TPM - 03"] },
  { grupo: "CAMINHÃO PIPA ASPERSÃO VIAS", itens: ["PIPA ASPERSÃO VIAS - MFE - 01", "PIPA ASPERSÃO VIAS - MFE - 02"] },
  { grupo: "CAMINHÃO PIPA LIMPEZA", itens: ["PIPA LIMPEZA - MFE - 01", "PIPA LIMPEZA - MFE - 02", "PIPA LIMPEZA - TPM - 01"] },
  { grupo: "ESCAVADEIRA 312", itens: ["312 - MFE - 03"] },
  { grupo: "MINI CARR. 226B REMOTA", itens: ["CARR. 226B REMOTA - TPM - 01"] },
  { grupo: "MINI CARR. S70 REMOTA", itens: ["CARR. S70 REMOTA - MFE - 01", "CARR. S70 REMOTA - TPM - 01"] },
  { grupo: "MINI CARREGADEIRA 226B", itens: ["CARREGADEIRA 226B - MFE - 01", "CARREGADEIRA 226B - MFE - 02", "CARREGADEIRA 226B - MFE - 03", "CARREGADEIRA 226B - MFE - 04", "CARREGADEIRA 226B - MFE - 05", "CARREGADEIRA 226B - TPM - 01", "CARREGADEIRA 226B - TPM - 02"] },
  { grupo: "MINI ESCAVADEIRA 303.5", itens: ["ESCAVADEIRA 303.5 - MFE - 01", "ESCAVADEIRA 303.5 - MFE - 02"] },
  { grupo: "PÁ CARREGADEIRA 962GII", itens: ["CARREGADEIRA 962GII - MFE - 01"] },
  { grupo: "RETROESCAVADEIRA 416D", itens: ["416D - MFE - 01", "416D - MFE - 02", "416D - MFE - 03", "416D - TPM - 01"] }
];

export const dataPortoMinerio = [
  { mes: 'Jul', aderencia: 80.29, meta: 95 },
  { mes: 'Ago', aderencia: 79.82, meta: 95 },
  { mes: 'Set', aderencia: 87.75, meta: 95 },
  { mes: 'Out', aderencia: 88.99, meta: 95 },
  { mes: 'Nov', aderencia: 95.50, meta: 95 },
  { mes: 'Dez', aderencia: 95.15, meta: 95 },
  { mes: 'Jan', aderencia: 96.10, meta: 95 },
  { mes: 'Fev', aderencia: 95.64, meta: 95 },
  { mes: 'Mar', aderencia: 94.02, meta: 95 },
  { mes: 'Abr', aderencia: 96.68, meta: 95 },
  { mes: 'Mai', aderencia: 96.16, meta: 95 },
];

export const dataPortoTPM = [
  { mes: 'Jul', aderencia: 89.14, meta: 95 },
  { mes: 'Ago', aderencia: 86.83, meta: 95 },
  { mes: 'Set', aderencia: 92.30, meta: 95 },
  { mes: 'Out', aderencia: 93.38, meta: 95 },
  { mes: 'Nov', aderencia: 98.06, meta: 95 },
  { mes: 'Dez', aderencia: 97.46, meta: 95 },
  { mes: 'Jan', aderencia: 97.45, meta: 95 },
  { mes: 'Fev', aderencia: 96.85, meta: 95 },
  { mes: 'Mar', aderencia: 97.87, meta: 95 },
  { mes: 'Abr', aderencia: 98.89, meta: 95 },
  { mes: 'Mai', aderencia: 99.00, meta: 95 },
];

export const dataAderenciaDia = [
  { dia: '21/abr', aderencia: 92.41, meta: 95 },
  { dia: '22/abr', aderencia: 95.48, meta: 95 },
  { dia: '23/abr', aderencia: 95.21, meta: 95 },
  { dia: '24/abr', aderencia: 97.91, meta: 95 },
  { dia: '25/abr', aderencia: 95.97, meta: 95 },
  { dia: '26/abr', aderencia: 97.83, meta: 95 },
  { dia: '27/abr', aderencia: 97.89, meta: 95 },
  { dia: '28/abr', aderencia: 98.92, meta: 95 },
  { dia: '29/abr', aderencia: 90.08, meta: 95 },
  { dia: '30/abr', aderencia: 95.97, meta: 95 },
  { dia: '01/mai', aderencia: 100.00, meta: 95 },
  { dia: '02/mai', aderencia: 98.61, meta: 95 },
  { dia: '03/mai', aderencia: 98.68, meta: 95 },
  { dia: '04/mai', aderencia: 99.23, meta: 95 },
  { dia: '05/mai', aderencia: 98.69, meta: 95 },
  { dia: '06/mai', aderencia: 96.31, meta: 95 },
  { dia: '07/mai', aderencia: 95.70, meta: 95 },
  { dia: '08/mai', aderencia: 100.00, meta: 95 },
  { dia: '09/mai', aderencia: 98.94, meta: 95 },
  { dia: '10/mai', aderencia: 98.95, meta: 95 },
  { dia: '11/mai', aderencia: 94.88, meta: 95 },
  { dia: '12/mai', aderencia: 99.76, meta: 95 },
  { dia: '13/mai', aderencia: 96.48, meta: 95 },
  { dia: '14/mai', aderencia: 97.43, meta: 95 },
  { dia: '15/mai', aderencia: 96.43, meta: 95 },
  { dia: '16/mai', aderencia: 99.51, meta: 95 },
  { dia: '17/mai', aderencia: 98.92, meta: 95 },
  { dia: '18/mai', aderencia: 98.04, meta: 95 },
  { dia: '19/mai', aderencia: 94.36, meta: 95 },
  { dia: '20/mai', aderencia: 95.32, meta: 95 }
];

export const formatCurrencyInput = (value: string | number) => {
  if (value === '' || value === undefined || value === null) return '';
  const num = Number(value);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
};

export const parseCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return (parseInt(digits, 10) / 100).toString();
};

interface NotificacaoGlobal {
  id: string;
  dataStr: string;
  local: string;
  motivo: string;
  solicitante: string;
}

const isDateInMedicaoMonth = (dateStr: string, medicaoMes: string) => {
  const [day, month, year] = dateStr.split('/');
  if (!day || !month || !year) return false;
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  
  const monthMap: Record<string, number> = { 
    'Jan': 0, 'Janeiro': 0, 
    'Fev': 1, 'Fevereiro': 1, 
    'Mar': 2, 'Março': 2, 
    'Abr': 3, 'Abril': 3, 
    'Mai': 4, 'Maio': 4, 
    'Jun': 5, 'Junho': 5, 
    'Jul': 6, 'Julho': 6, 
    'Ago': 7, 'Agosto': 7, 
    'Set': 8, 'Setembro': 8, 
    'Out': 9, 'Outubro': 9, 
    'Nov': 10, 'Novembro': 10, 
    'Dez': 11, 'Dezembro': 11 
  };
  const [mName, mYear] = medicaoMes.split('/');
  if (!mName || !mYear) return false;
  
  const mIndex = monthMap[mName];
  const mYearNum = Number(mYear);
  
  let prevMonth = mIndex - 1;
  let prevYear = mYearNum;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear--;
  }
  
  const startDate = new Date(prevYear, prevMonth, 21);
  const endDate = new Date(mYearNum, mIndex, 20, 23, 59, 59);
  
  return dateObj >= startDate && dateObj <= endDate;
};

export default function EvolucaoContrato() {
  const { toast } = useToast();
  const [notificacaoDetalhe, setNotificacaoDetalhe] = useState<OfensorNotificacao | null>(null);
  const [notificacoesGlobais, setNotificacoesGlobais] = useState<NotificacaoGlobal[]>(seedNotificacoes);
  
  useEffect(() => {
    const saved = localStorage.getItem('corporate_cheerleader_notificacoes_globais');
    if (saved) {
      setNotificacoesGlobais(JSON.parse(saved));
    }
  }, []);

  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mergeMedicoes = (arr: any[]) => {
    return arr.reduce((acc, curr) => {
      const existing = acc.find((m: any) => m.mes === curr.mes);
      if (existing) {
        Object.keys(curr).forEach(key => {
          if (Array.isArray(curr[key]) && curr[key].length > 0) {
            existing[key] = curr[key];
          } else if (typeof curr[key] === 'number' && curr[key] !== 0 && existing[key] === 0) {
            existing[key] = curr[key];
          } else if (curr[key] && !existing[key]) {
            existing[key] = curr[key];
          }
        });
      } else {
        acc.push({ ...curr });
      }
      return acc;
    }, [] as any[]);
  };

  useEffect(() => {
    const fetchMedicoes = async () => {
      try {
        const { data, error } = await supabase.from('medicoes').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        
        const saved = localStorage.getItem('corporate_cheerleader_medicoes');
        
        if (data && data.length > 0) {
          const mappedData = data.map(d => ({ ...d.dados, _supabaseId: d.id }));
          setMedicoes(mergeMedicoes(mappedData));
        } else if (data && data.length === 0) {
          setMedicoes([]);
        } else if (saved) {
          setMedicoes(mergeMedicoes(JSON.parse(saved)));
        } else {
          setMedicoes([]);
        }
      } catch (error) {
        console.error('Erro ao buscar do supabase:', error);
        const saved = localStorage.getItem('corporate_cheerleader_medicoes');
        if (saved) setMedicoes(mergeMedicoes(JSON.parse(saved)));
        else setMedicoes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedicoes();
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Privacy mode state
  const [hiddenCards, setHiddenCards] = useState<Record<string, boolean>>({});
  const [timeRange, setTimeRange] = useState('12');
  const [activeTab, setActiveTab] = useState('visao_executiva');
  const [selectedMonthDRE, setSelectedMonthDRE] = useState<string | null>(null);
  const toggleCardVisibility = (key: string) => {
    setHiddenCards(prev => ({ ...prev, [key]: !prev[key] }));
  };
  // Detalhes Drawer State
  const [detalhesMedicao, setDetalhesMedicao] = useState<Medicao | null>(null);

  const handleOpenModal = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const data = localStorage.getItem('corporate_cheerleader_medicoes');
    const blob = new Blob([data || '[]'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_corporate_cheerleader.json';
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      localStorage.setItem('corporate_cheerleader_medicoes', content);
      window.location.reload();
    };
    reader.readAsText(file);
  };

  const handleEdit = (m: Medicao) => {
    setEditingId(m.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este fechamento mensal?')) {
      const existing = medicoes.find(m => m.id === id);
      if (existing && existing._supabaseId) {
        await supabase.from('medicoes').delete().eq('id', existing._supabaseId);
      }
      setMedicoes(medicoes.filter(m => m.id !== id));
      toast({ title: 'Sucesso', description: 'Fechamento excluído com sucesso!' });
    }
  };

  const handleSaveFromComponent = async (novaMedicao: Medicao) => {
    // Validação anti-duplicação: se não for uma edição (editingId vazio) 
    // mas o mês já existir na lista, bloqueia o salvamento.
    if (!editingId) {
      const isDuplicate = medicoes.some(m => m.mes.toLowerCase().trim() === novaMedicao.mes.toLowerCase().trim());
      if (isDuplicate) {
        toast({ title: 'Ação Bloqueada', description: `O mês ${novaMedicao.mes} já existe no sistema. Por favor, edite o registro existente ao invés de criar um novo.`, variant: 'destructive' });
        return;
      }
    }

    const medicaoComIdLocal = editingId ? { ...novaMedicao, id: editingId } : { ...novaMedicao, id: Date.now() };
    
    try {
      if (editingId) {
        const existing = medicoes.find(m => m.id === editingId);
        if (existing && existing._supabaseId) {
          const { error } = await supabase.from('medicoes').update({ mes: medicaoComIdLocal.mes, dados: medicaoComIdLocal }).eq('id', existing._supabaseId);
          if (error) throw error;
          setMedicoes(medicoes.map(m => m.id === editingId ? { ...medicaoComIdLocal, _supabaseId: existing._supabaseId } : m));
        } else {
          setMedicoes(medicoes.map(m => m.id === editingId ? medicaoComIdLocal : m));
        }
        toast({ title: 'Sucesso', description: 'Fechamento atualizado com sucesso!' });
      } else {
        const { data, error } = await supabase.from('medicoes').insert([{ mes: medicaoComIdLocal.mes, dados: medicaoComIdLocal }]).select();
        if (error) throw error;
        if (data && data.length > 0) {
          setMedicoes([...medicoes, { ...medicaoComIdLocal, _supabaseId: data[0].id }]);
        } else {
          setMedicoes([...medicoes, medicaoComIdLocal]);
        }
        toast({ title: 'Sucesso', description: 'Fechamento registrado com sucesso!' });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro de Conexão', description: 'Não foi possível salvar no banco de dados. Tente novamente.', variant: 'destructive' });
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);


  // Derivations for charts and KPIs
  const chartData = useMemo(() => {
    return medicoes.map(m => {
      const globais = notificacoesGlobais.filter(ng => isDateInMedicaoMonth(ng.dataStr, m.mes));
      const globaisNotifs = globais.filter(ng => ng.tipo === 'Notificação' || !ng.tipo).map(ng => ({ 
        motivo: `${ng.motivo} (Ref: ${ng.local})`,
        dataStr: ng.dataStr,
        local: ng.local,
        solicitante: ng.solicitante,
        planoDeAcao: ng.planoDeAcao,
        isGlobal: true
      }));
      const globaisMultas = globais.filter(ng => ng.tipo === 'Multa').map(ng => ({ 
        motivo: `${ng.motivo} (Ref: ${ng.local})`, 
        valor: ng.valorOriginal || 0,
        dataStr: ng.dataStr,
        local: ng.local,
        solicitante: ng.solicitante,
        planoDeAcao: ng.planoDeAcao,
        isGlobal: true
      }));
      
      const todasNotificacoes = [...m.notificacoes, ...globaisNotifs];
      const todasMultas = [...m.multas, ...globaisMultas];

      const sumDescontos = m.descontos.reduce((acc, curr) => acc + curr.valor, 0);
      const sumMultas = todasMultas.reduce((acc, curr) => acc + curr.valor, 0);
      
      const receitaTotal = m.fatLocacao + m.fatMaoDeObra + m.eventuais;
      const impostosTotal = (m.impostoIrrf || 0) + (m.impostoPis || 0) + (m.impostoCofins || 0) + (m.impostoCsll || 0) + (m.impostoIss || 0);
      const folhaTotal = m.custoFolha + m.horasExtras + (m.folhaInss || 0) + (m.folhaFgts || 0) + (m.folhaIrrf || 0) + (m.custoTurnover || 0) + (m.beneficioCafeDaManha || 0) + (m.beneficioSeguroDeVida || 0) + (m.beneficioPlanoDeSaude || 0) + (m.beneficioPlanoOdontologico || 0) + (m.beneficioTicketAlimentacao || 0) + (m.beneficioValeTransporte || 0) + (m.beneficioMaisParaTodos || 0) + (m.beneficioRefeicao || 0);
      const manutencaoTotal = (m.manutencaoPecas || 0) + (m.manutencaoServicos || 0) + (m.manutencaoPneus || 0) + (m.manutencaoLubrificacao || 0) + (m.manutencaoLavador || 0) + (m.manutencaoPreventiva || 0);
      const combustivelTotal = (m.combustivelDiesel || 0) + (m.combustivelDieselS10 || 0) + (m.combustivelDieselS500 || 0) + (m.combustivelGasolina || 0);
      const uniformeTotal = (m.uniforme || 0) + (m.epi || 0);
      const escritorioTotal = (m.escritorioMaterial || 0) + (m.escritorioLimpeza || 0);
      
      // SSMA (RACs) - Conformidade de Treinamento e Inspeção
      const rac1 = 80 + Math.random() * 20; // Altura
      const rac2 = 90 + Math.random() * 10; // Veículos Leves
      const rac3 = 85 + Math.random() * 15; // Equipamentos Móveis
      const rac4 = 95 + Math.random() * 5;  // Bloqueio Energia

      const perdas = sumDescontos + sumMultas;

      const custosTotais = folhaTotal + manutencaoTotal + combustivelTotal + uniformeTotal + escritorioTotal;
      const saldo = receitaTotal - impostosTotal - custosTotais - perdas;
      const margem = receitaTotal > 0 ? (saldo / receitaTotal) * 100 : 0;
      
      return {
        ...m,
        notificacoes: todasNotificacoes,
        multas: todasMultas,
        saldo,
        margem: parseFloat(margem.toFixed(1)),
        rac1: Number(rac1.toFixed(1)),
        rac2: Number(rac2.toFixed(1)),
        rac3: Number(rac3.toFixed(1)),
        rac4: Number(rac4.toFixed(1)),
        perdas,
        sumDescontos,
        sumMultas,
        receitaTotal,
        impostosTotal,
        folhaTotal,
        manutencaoTotal,
        combustivelTotal,
        uniformeTotal,
        escritorioTotal,
        custosTotais
      };
    });
  }, [medicoes, notificacoesGlobais]);

  const filteredChartData = useMemo(() => {
    if (timeRange === 'all') return chartData;
    const limit = parseInt(timeRange);
    return chartData.slice(-limit);
  }, [chartData, timeRange]);

  const filteredPortoMinerio = useMemo(() => {
    if (timeRange === 'all') return dataPortoMinerio;
    const limit = parseInt(timeRange);
    return dataPortoMinerio.slice(-limit);
  }, [timeRange]);

  const filteredPortoTPM = useMemo(() => {
    if (timeRange === 'all') return dataPortoTPM;
    const limit = parseInt(timeRange);
    return dataPortoTPM.slice(-limit);
  }, [timeRange]);

  const filteredAderenciaDia = useMemo(() => {
    // O gráfico diário tem dados de apenas 1 mês, então ele sempre será exibido integralmente 
    // para filtros de 3, 6 ou 12 meses.
    return dataAderenciaDia;
  }, [timeRange]);

  const lastMonth = [...chartData].reverse().find(m => m.receitaTotal > 0) || chartData[chartData.length - 1];
  const lastMonthIndex = chartData.findIndex(m => m === lastMonth);
  const prevMonth = lastMonthIndex > 0 ? chartData[lastMonthIndex - 1] : chartData[chartData.length - 2] || chartData[0];

  const ofensoresData = useMemo(() => {
    let glosas = 0;
    let multas = 0;
    let horasExtras = 0;
    medicoes.forEach(m => {
      glosas += m.descontos.reduce((acc, curr) => acc + curr.valor, 0);
      multas += m.multas.reduce((acc, curr) => acc + curr.valor, 0);
      horasExtras += m.horasExtras;
    });
    return [
      { name: 'Glosas Operacionais', value: glosas, color: 'hsl(var(--destructive))' },
      { name: 'Multas Aplicadas', value: multas, color: '#991b1b' },
      { name: 'Horas Extras', value: horasExtras, color: 'hsl(var(--warning))' },
    ].filter(item => item.value > 0);
  }, [medicoes]);

  const getTrend = (current: number, prev: number, inverseGood = false) => {
    if (!prev) return { icon: Minus, color: 'text-muted-foreground' };
    if (current > prev) return { icon: ArrowUpRight, color: inverseGood ? 'text-destructive' : 'text-success' };
    if (current < prev) return { icon: ArrowDownRight, color: inverseGood ? 'text-success' : 'text-destructive' };
    return { icon: Minus, color: 'text-muted-foreground' };
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/80 border border-border/50 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[200px]">
          <p className="font-black text-sm mb-3 border-b border-border/50 pb-2">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground font-medium">{entry.name}</span>
                </div>
                <span className="font-bold text-foreground">
                  {entry.name.includes('Margem') || entry.name.includes('Aderência') || entry.name.includes('Meta') 
                    ? `${entry.value}%` 
                    : entry.name.includes('Notificações') 
                      ? entry.value 
                      : formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const monthData = data.activePayload[0].payload;
      if (monthData && monthData.id) {
        setDetalhesMedicao(monthData);
      }
    }
  };


  
  const radarRACData = [
    { subject: 'RAC 01 (Altura)', A: lastMonth?.rac1 || 0, fullMark: 100 },
    { subject: 'RAC 02 (Veículos Leves)', A: lastMonth?.rac2 || 0, fullMark: 100 },
    { subject: 'RAC 03 (Equipamentos Móveis)', A: lastMonth?.rac3 || 0, fullMark: 100 },
    { subject: 'RAC 04 (Bloqueio de Energia)', A: lastMonth?.rac4 || 0, fullMark: 100 },
    { subject: 'RAC 05 (Içamento)', A: 90 + Math.random()*10, fullMark: 100 },
  ];

  const dashboardContent = useMemo(() => (
    <>
      {/* KPI TOP CARDS */}
      {lastMonth && (
        <div className="flex flex-wrap gap-4 [&>*]:flex-1 [&>*]:min-w-[200px]">
          <div className={`glass-card rounded-xl p-4 border-l-4 ${lastMonth.aderencia < 95 ? 'border-l-destructive bg-destructive/5' : 'border-l-primary'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${lastMonth.aderencia < 95 ? 'text-destructive' : 'text-muted-foreground'}`}>
                <Target className="w-3.5 h-3.5" /> Aderência SLA
              </p>
              <button onClick={() => toggleCardVisibility('aderencia')} className="text-muted-foreground hover:text-foreground transition-colors">
                {hiddenCards['aderencia'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-end justify-between">
              <h3 className={`text-2xl font-black tracking-tight transition-all duration-300 ${hiddenCards['aderencia'] ? 'blur-md select-none opacity-50 text-foreground' : (lastMonth.aderencia < 95 ? 'text-destructive' : '')}`}>{lastMonth.aderencia}%</h3>
              {prevMonth && (() => {
                const Trend = getTrend(lastMonth.aderencia, prevMonth.aderencia).icon;
                const color = getTrend(lastMonth.aderencia, prevMonth.aderencia).color;
                return <Trend className={`w-5 h-5 mb-1 ${color}`} />;
              })()}
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Faturamento Bruto</p>
              <button onClick={() => toggleCardVisibility('faturamento')} className="text-muted-foreground hover:text-foreground transition-colors">
                {hiddenCards['faturamento'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-end justify-between">
              <h3 className={`text-xl font-black text-foreground tracking-tight transition-all duration-300 ${hiddenCards['faturamento'] ? 'blur-md select-none opacity-50' : ''}`}>{formatCurrency(lastMonth.receitaTotal)}</h3>
              {prevMonth && (() => {
                const Trend = getTrend(lastMonth.receitaTotal, prevMonth.receitaTotal).icon;
                const color = getTrend(lastMonth.receitaTotal, prevMonth.receitaTotal).color;
                return <Trend className={`w-5 h-5 mb-1 ${color}`} />;
              })()}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 border-l-4 border-l-success bg-success/5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-success uppercase tracking-wider flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Lucro Líquido Real</p>
              <button onClick={() => toggleCardVisibility('lucro')} className="text-success/70 hover:text-success transition-colors">
                {hiddenCards['lucro'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-end justify-between">
              <h3 className={`text-xl font-black text-success tracking-tight transition-all duration-300 ${hiddenCards['lucro'] ? 'blur-md select-none opacity-50' : ''}`}>{formatCurrency(lastMonth.saldo)}</h3>
              {prevMonth && (() => {
                const Trend = getTrend(lastMonth.saldo, prevMonth.saldo).icon;
                const color = getTrend(lastMonth.saldo, prevMonth.saldo).color;
                return <Trend className={`w-5 h-5 mb-1 ${color}`} />;
              })()}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5" /> Margem Líquida</p>
              <button onClick={() => toggleCardVisibility('margem')} className="text-muted-foreground hover:text-foreground transition-colors">
                {hiddenCards['margem'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-end justify-between">
              <h3 className={`text-2xl font-black tracking-tight transition-all duration-300 ${hiddenCards['margem'] ? 'blur-md select-none opacity-50 text-foreground' : 'text-primary'}`}>{lastMonth.margem}%</h3>
              {prevMonth && (() => {
                const Trend = getTrend(lastMonth.margem, prevMonth.margem).icon;
                const color = getTrend(lastMonth.margem, prevMonth.margem).color;
                return <Trend className={`w-5 h-5 mb-1 ${color}`} />;
              })()}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 border-l-4 border-l-destructive bg-destructive/5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Sangria (Glosas+Multas)</p>
              <button onClick={() => toggleCardVisibility('perdas')} className="text-destructive/70 hover:text-destructive transition-colors">
                {hiddenCards['perdas'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-end justify-between">
              <h3 className={`text-xl font-black text-destructive tracking-tight transition-all duration-300 ${hiddenCards['perdas'] ? 'blur-md select-none opacity-50' : ''}`}>{formatCurrency(lastMonth.perdas)}</h3>
              {prevMonth && (() => {
                const Trend = getTrend(lastMonth.perdas, prevMonth.perdas, true).icon;
                const color = getTrend(lastMonth.perdas, prevMonth.perdas, true).color;
                return <Trend className={`w-5 h-5 mb-1 ${color}`} />;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* CHARTS SECTION */}
      {medicoes.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            <TabsList className="bg-muted/50 p-1 rounded-xl inline-flex w-full sm:w-auto overflow-x-auto justify-start sm:justify-center border border-border/50">
              <TabsTrigger value="visao_executiva" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><Target className="w-4 h-4 mr-2" />Visão Executiva</TabsTrigger>
              <TabsTrigger value="custos_metas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><TrendingDown className="w-4 h-4 mr-2" />Custos e Metas</TabsTrigger>
              <TabsTrigger value="dre" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><DollarSign className="w-4 h-4 mr-2" />DRE Detalhada</TabsTrigger>

              <TabsTrigger value="performance_mensal" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><BarChart3 className="w-4 h-4 mr-2" />Performance Mensal</TabsTrigger>
              <TabsTrigger value="metas_busato" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><Target className="w-4 h-4 mr-2" />Metas Busato</TabsTrigger>
              <TabsTrigger value="metas_porto" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><Target className="w-4 h-4 mr-2" />Metas Porto</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap hidden sm:block">Período:</span>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background border-border/50 shadow-sm rounded-xl h-10">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="3">Últimos 3 meses</SelectItem>
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Últimos 12 meses</SelectItem>
                  <SelectItem value="all">Todo o período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="visao_executiva" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* NOVO GRÁFICO DIRETORIA - ADERÊNCIA SLA */}
          <Card className="shadow-sm border-border lg:col-span-2 xl:col-span-2 transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:scale-[1.01] cursor-pointer" onClick={() => setExpandedChart('sla')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Evolução da Aderência (SLA)</CardTitle>
              <CardDescription className="text-xs">Visão executiva do SLA vs meta de 95%.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                    <defs>
                      <linearGradient id="colorSlaArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={10} minTickGap={15} angle={-45} textAnchor="end" height={60} />
                    <YAxis domain={['auto', 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => `${val}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <ReferenceLine y={95} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ position: 'top', value: 'Meta SLA (95%)', fill: 'hsl(var(--warning))', fontSize: 11, fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="aderencia" name="Aderência SLA (%)" fill="url(#colorSlaArea)" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 5, fill: "hsl(var(--background))", strokeWidth: 2 }} activeDot={{ r: 7, fill: "hsl(var(--primary))" }}>
                      <LabelList dataKey="aderencia" position="top" offset={10} formatter={(val: number) => `${val}%`} style={{ fontSize: '11px', fontWeight: 'bold', fill: 'hsl(var(--primary))' }} />
                    </Area>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border lg:col-span-1 xl:col-span-1 transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:scale-[1.01] cursor-pointer" onClick={() => setExpandedChart('resumo')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Aderência vs Margem</CardTitle>
              <CardDescription className="text-xs">Correlação qualidade vs lucro.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                    <defs>
                      <linearGradient id="colorSla" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={10} minTickGap={15} angle={-45} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" fontSize={12} domain={[80, 100]} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--blue-500))" fontSize={12} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar yAxisId="left" dataKey="aderencia" name="Aderência SLA" fill="url(#colorSla)" radius={[8, 8, 0, 0]} barSize={40} />
                    <Line yAxisId="right" type="monotone" dataKey="margem" name="Margem (%)" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 5, strokeWidth: 2, fill: "hsl(var(--background))" }} activeDot={{ r: 8, fill: "hsl(var(--primary))" }} style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))' }} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border lg:col-span-2 xl:col-span-2 transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:scale-[1.01] cursor-pointer" onClick={() => setExpandedChart('rentabilidade')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Análise de Rentabilidade</CardTitle>
              <CardDescription className="text-xs">Receita vs Lucro vs Ofensores Financeiros.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                    <defs>
                      <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={10} minTickGap={15} angle={-45} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" tickFormatter={(val) => `R${(val/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 'auto']} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `R${(val/1000).toFixed(0)}k`} stroke="hsl(var(--destructive))" fontSize={12} domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="saldo" name="Lucro Líquido Real" fill="url(#colorSaldo)" stroke="hsl(var(--success))" strokeWidth={3} />
                    <Bar yAxisId="right" stackId="a" dataKey="perdas" name="Glosas/Multas" fill="hsl(var(--destructive))" barSize={35} radius={[0, 0, 0, 0]} />
                    <Bar yAxisId="right" stackId="a" dataKey="horasExtras" name="Horas Extras" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border lg:col-span-1 xl:col-span-1 transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:scale-[1.01] cursor-pointer" onClick={() => setExpandedChart('ofensores')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Mapa de Ofensores</CardTitle>
              <CardDescription className="text-xs">Ralos financeiros acumulados no ano.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full mt-2">
                {ofensoresData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ofensoresData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {ofensoresData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <Label 
                          value="Total Perdas" 
                          position="centerBottom" 
                          dy={-10} 
                          fill="hsl(var(--muted-foreground))" 
                          fontSize={12} 
                        />
                        <Label 
                          value={`R$ ${(ofensoresData.reduce((acc, curr) => acc + curr.value, 0) / 1000).toFixed(1)}k`} 
                          position="centerTop" 
                          dy={15} 
                          fill="hsl(var(--foreground))" 
                          fontSize={22} 
                          fontWeight="bold" 
                        />
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Sem ofensores financeiros registrados.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
                </div>
          </TabsContent>

      
                <TabsContent value="custos_metas" className="space-y-6 mt-4">
      {/* ACOMPANHAMENTO DE METAS */}
      {medicoes.length > 0 && (
        <Card className="shadow-sm border-border overflow-hidden mb-6">
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              Acompanhamento de Metas
            </h3>
          </div>
          <CardContent className="p-4">
            
            <div className="grid grid-cols-1 gap-8">
              {/* IMPOSTOS */}
              <div className="space-y-2 border border-border/50 rounded-xl p-4 bg-background/50">
                <h4 className="font-bold text-center">Impostos</h4>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={0} angle={-35} textAnchor="end" height={60} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="impostoIrrf" name="IRRF" stackId="a" fill="#3b82f6" maxBarSize={45} />
                      <Bar dataKey="impostoPis" name="PIS" stackId="a" fill="#60a5fa" maxBarSize={45} />
                      <Bar dataKey="impostoCofins" name="COFINS" stackId="a" fill="#93c5fd" maxBarSize={45} />
                      <Bar dataKey="impostoCsll" name="CSLL" stackId="a" fill="#2dd4bf" maxBarSize={45} />
                      <Bar dataKey="impostoIss" name="ISS" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      <Line type="monotone" dataKey="metaImpostos" name="Meta Impostos" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 5" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* FOLHA */}
              <div className="space-y-2 border border-border/50 rounded-xl p-4 bg-background/50">
                <h4 className="font-bold text-center">Folha de Pagamento</h4>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={0} angle={-35} textAnchor="end" height={60} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="custoFolha" name="Salários" stackId="a" fill="#8b5cf6" maxBarSize={45} />
                      <Bar dataKey="horasExtras" name="Horas Extras" stackId="a" fill="#a78bfa" maxBarSize={45} />
                      <Bar dataKey="beneficioValeTransporte" name="VT" stackId="a" fill="#f59e0b" maxBarSize={45} />
                      <Bar dataKey="beneficioTicketAlimentacao" name="VA" stackId="a" fill="#fbbf24" maxBarSize={45} />
                      <Bar dataKey="beneficioRefeicao" name="VR" stackId="a" fill="#fcd34d" maxBarSize={45} />
                      <Bar dataKey="beneficioPlanoDeSaude" name="Plano Saúde" stackId="a" fill="#ec4899" maxBarSize={45} />
                      <Bar dataKey="beneficioPlanoOdontologico" name="Plano Odonto" stackId="a" fill="#f472b6" maxBarSize={45} />
                      <Bar dataKey="beneficioSeguroDeVida" name="Seg. Vida" stackId="a" fill="#fbcfe8" maxBarSize={45} />
                      <Bar dataKey="beneficioCafeDaManha" name="Café Manhã" stackId="a" fill="#84cc16" maxBarSize={45} />
                      <Bar dataKey="folhaInss" name="INSS" stackId="a" fill="#0ea5e9" maxBarSize={45} />
                      <Bar dataKey="folhaFgts" name="FGTS" stackId="a" fill="#38bdf8" maxBarSize={45} />
                      <Bar dataKey="folhaIrrf" name="IRRF" stackId="a" fill="#7dd3fc" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      <Line type="monotone" dataKey="metaFolha" name="Meta Folha" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 5" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MANUTENÇÃO */}
              <div className="space-y-2 border border-border/50 rounded-xl p-4 bg-background/50">
                <h4 className="font-bold text-center">Manutenção</h4>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={0} angle={-35} textAnchor="end" height={60} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="manutencaoPreventiva" name="Preventiva" stackId="a" fill="#f97316" maxBarSize={45} />
                      <Bar dataKey="manutencaoServicos" name="Serviços" stackId="a" fill="#fdba74" maxBarSize={45} />
                      <Bar dataKey="manutencaoPecas" name="Peças" stackId="a" fill="#64748b" maxBarSize={45} />
                      <Bar dataKey="manutencaoPneus" name="Pneus" stackId="a" fill="#94a3b8" maxBarSize={45} />
                      <Bar dataKey="manutencaoLubrificacao" name="Lubrificação" stackId="a" fill="#cbd5e1" maxBarSize={45} />
                      <Bar dataKey="manutencaoLavador" name="Lavador" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      <Line type="monotone" dataKey="metaManutencao" name="Meta Manutenção" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 5" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* COMBUSTÍVEL */}
              <div className="space-y-2 border border-border/50 rounded-xl p-4 bg-background/50">
                <h4 className="font-bold text-center">Combustível</h4>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={0} angle={-35} textAnchor="end" height={60} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="combustivelDieselS10" name="Diesel S10" stackId="a" fill="#14b8a6" maxBarSize={45} />
                      <Bar dataKey="combustivelDieselS500" name="Diesel S500" stackId="a" fill="#2dd4bf" maxBarSize={45} />
                      <Bar dataKey="combustivelGasolina" name="Gasolina" stackId="a" fill="#5eead4" maxBarSize={45} />
                      <Bar dataKey="combustivelDiesel" name="Diesel (Antigo)" stackId="a" fill="#99f6e4" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      <Line type="monotone" dataKey="metaCombustivel" name="Meta Combustível" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 5" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SEGURANÇA */}
              <div className="space-y-2 border border-border/50 rounded-xl p-4 bg-background/50">
                <h4 className="font-bold text-center">Segurança</h4>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={0} angle={-35} textAnchor="end" height={60} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="epi" name="EPI" stackId="a" fill="#eab308" maxBarSize={45} />
                      <Bar dataKey="uniforme" name="Uniforme" stackId="a" fill="#fde047" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      <Line type="monotone" dataKey="metaSeguranca" name="Meta Segurança" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 5" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MATERIAIS */}
              <div className="space-y-2 border border-border/50 rounded-xl p-4 bg-background/50">
                <h4 className="font-bold text-center">Materiais</h4>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={0} angle={-35} textAnchor="end" height={60} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="escritorioMaterial" name="Mat. Escritório" stackId="a" fill="#a855f7" maxBarSize={45} />
                      <Bar dataKey="escritorioLimpeza" name="Mat. Limpeza" stackId="a" fill="#c084fc" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      <Line type="monotone" dataKey="metaMateriais" name="Meta Materiais" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 5" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      )}

                </TabsContent>

          <TabsContent value="dre" className="space-y-6 mt-4">
      {/* DATA TABLE */}

      {medicoes.length > 0 && (
        <Card className="shadow-sm border-border overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20">
          <div className="p-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><Calculator className="w-5 h-5 text-primary" /> Histórico Financeiro Detalhado</h3>
              {selectedMonthDRE && (
                <button onClick={() => setSelectedMonthDRE(null)} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium hover:bg-primary/20 transition-colors">
                  Filtrado: {selectedMonthDRE} (Limpar ✕)
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto relative">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background/95 backdrop-blur z-10">
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase text-muted-foreground">Mês</th>
                  <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase text-muted-foreground">Ofensores</th>
                  <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase text-muted-foreground">Aderência</th>
                  <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase text-muted-foreground">Receita</th>
                  <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase text-muted-foreground">Impostos</th>
                  <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase text-muted-foreground">Folha</th>
                  <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase text-muted-foreground">Manutenção</th>
                  <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase text-muted-foreground">Combustível</th>
                  <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase text-muted-foreground" title="Uniforme/EPI">Segurança</th>
                  <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase text-muted-foreground">Materiais</th>
                  <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase text-muted-foreground bg-success/10">Lucro Líquido</th>
                  <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase text-muted-foreground bg-primary/5">Margem</th>
                  <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase text-muted-foreground sticky right-0 bg-muted/40 z-20 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] border-l">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {chartData.slice().reverse().map((m, i) => {
                  const hasOfensores = m.descontos.length > 0 || m.multas.length > 0 || m.notificacoes.length > 0;
                  return (
                    <tr key={m.id} className={`transition-all duration-200 hover:bg-muted/30 ${i === 0 ? 'font-medium bg-primary/5' : ''}`}>
                      <td className="px-2 py-3 text-center font-semibold whitespace-nowrap">{m.mes}</td>
                      <td className="px-2 py-3 text-center whitespace-nowrap">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`h-7 px-2 text-xs font-bold ${hasOfensores ? 'text-destructive border-destructive hover:bg-destructive/10' : 'text-muted-foreground hover:text-primary hover:border-primary/50'}`}
                          onClick={() => setDetalhesMedicao(m)}
                        >
                          <Info className="w-3 h-3 mr-1" />
                          Ver Detalhes
                        </Button>
                      </td>
                      <td className={`px-2 py-3 text-center font-bold whitespace-nowrap ${m.aderencia >= 98 ? 'text-success' : m.aderencia >= 95 ? 'text-warning' : 'text-destructive'}`}>{m.aderencia}%</td>
                      <td className="px-2 py-3 text-center text-success font-semibold whitespace-nowrap">{formatCurrency(m.receitaTotal)}</td>
                      <td className="px-2 py-3 text-center text-destructive whitespace-nowrap">{formatCurrency(m.impostosTotal)}</td>
                      <td className="px-2 py-3 text-center text-destructive whitespace-nowrap">{formatCurrency(m.folhaTotal)}</td>
                      <td className="px-2 py-3 text-center text-destructive whitespace-nowrap">{formatCurrency(m.manutencaoTotal)}</td>
                      <td className="px-2 py-3 text-center text-destructive whitespace-nowrap">{formatCurrency(m.combustivelTotal)}</td>
                      <td className="px-2 py-3 text-center text-destructive whitespace-nowrap">{formatCurrency(m.uniformeTotal)}</td>
                      <td className="px-2 py-3 text-center text-destructive whitespace-nowrap">{formatCurrency(m.escritorioTotal)}</td>
                      <td className={`px-2 py-3 text-center bg-success/5 font-bold whitespace-nowrap ${m.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(m.saldo)}</td>
                      <td className="px-2 py-3 text-center font-bold bg-primary/5 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs inline-block min-w-[40px] ${m.margem >= 15 ? 'bg-success/20 text-success' : m.margem >= 5 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}`}>
                          {m.margem}%
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center sticky right-0 bg-background/95 backdrop-blur-md z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] border-l whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(m)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

                </TabsContent>


          <TabsContent value="performance_mensal" className="space-y-6 mt-4">
            <PerformanceMensalTab 
              medicoes={medicoes} 
              setMedicoes={setMedicoes} 
              timeRange={timeRange} 
              chartData={filteredChartData}
            />
          </TabsContent>
          <TabsContent value="metas_busato" className="space-y-6 mt-4">
            <MetasBusato />
          </TabsContent>
          <TabsContent value="metas_porto" className="space-y-6 mt-4">
            <MetasPorto />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center p-12 border-2 border-dashed border-border rounded-xl">
          <p className="text-muted-foreground">Nenhuma medição registrada.</p>
        </div>
      )}

      {/* DRAWER DETALHES DE OFENSORES */}
      <Sheet open={!!detalhesMedicao} onOpenChange={(val) => !val && setDetalhesMedicao(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl flex items-center gap-2 text-primary"><LineChartIcon className="w-5 h-5" /> Detalhes da Medição</SheetTitle>
            <SheetDescription>
              Resumo financeiro e operacional de <span className="font-bold text-foreground">{detalhesMedicao?.mes}</span>
            </SheetDescription>
          </SheetHeader>
          
          {detalhesMedicao && (
            <div className="space-y-6 pb-10">
              
              {/* KPIs do Mês */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20 shadow-sm transition-all duration-300 hover:shadow-md">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Aderência SLA</p>
                  <p className={`text-2xl font-black ${detalhesMedicao.aderencia >= 95 ? 'text-success' : 'text-destructive'}`}>{detalhesMedicao.aderencia}%</p>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20 shadow-sm transition-all duration-300 hover:shadow-md">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Margem Líquida</p>
                  {(() => {
                    const rec = detalhesMedicao.fatLocacao + detalhesMedicao.fatMaoDeObra + detalhesMedicao.eventuais;
                    const impostosTotais = (detalhesMedicao.impostoIrrf || 0) + (detalhesMedicao.impostoPis || 0) + (detalhesMedicao.impostoCofins || 0) + (detalhesMedicao.impostoCsll || 0) + (detalhesMedicao.impostoIss || 0);
                    const cust = (detalhesMedicao.custoFolha || 0) + (detalhesMedicao.horasExtras || 0) + (detalhesMedicao.folhaInss || 0) + (detalhesMedicao.folhaFgts || 0) + (detalhesMedicao.folhaIrrf || 0) + (detalhesMedicao.custoTurnover || 0) + (detalhesMedicao.beneficioCafeDaManha || 0) + (detalhesMedicao.beneficioSeguroDeVida || 0) + (detalhesMedicao.beneficioPlanoDeSaude || 0) + (detalhesMedicao.beneficioPlanoOdontologico || 0) + (detalhesMedicao.beneficioTicketAlimentacao || 0) + (detalhesMedicao.beneficioValeTransporte || 0) + (detalhesMedicao.beneficioMaisParaTodos || 0) + (detalhesMedicao.beneficioRefeicao || 0) + (detalhesMedicao.manutencaoPecas || 0) + (detalhesMedicao.manutencaoServicos || 0) + (detalhesMedicao.manutencaoPneus || 0) + (detalhesMedicao.manutencaoLubrificacao || 0) + (detalhesMedicao.manutencaoPreventiva || 0) + (detalhesMedicao.manutencaoLavador || 0) + (detalhesMedicao.combustivelDiesel || 0) + (detalhesMedicao.combustivelDieselS10 || 0) + (detalhesMedicao.combustivelDieselS500 || 0) + (detalhesMedicao.combustivelGasolina || 0) + (detalhesMedicao.uniforme || 0) + (detalhesMedicao.epi || 0) + (detalhesMedicao.escritorioMaterial || 0) + (detalhesMedicao.escritorioLimpeza || 0) + impostosTotais;
                    const perdas = detalhesMedicao.descontos.reduce((a,c)=>a+c.valor,0) + detalhesMedicao.multas.reduce((a,c)=>a+c.valor,0);
                    const lucro = rec - cust - perdas;
                    const marg = rec > 0 ? (lucro/rec)*100 : 0;
                    return (
                      <p className={`text-2xl font-black ${marg >= 10 ? 'text-success' : 'text-warning'}`}>
                        {marg.toFixed(1)}%
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* DRE Simplificado */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm uppercase text-muted-foreground border-b pb-1 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Composição Financeira</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Faturamento Locação</span>
                    <span>{formatCurrency(detalhesMedicao.fatLocacao)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Faturamento Mão de Obra</span>
                    <span>{formatCurrency(detalhesMedicao.fatMaoDeObra)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Faturamento Eventual</span>
                    <span>{formatCurrency(detalhesMedicao.eventuais)}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-success pt-2 border-t border-border/50">
                    <span>Receita Bruta Total</span>
                    <span>{formatCurrency(detalhesMedicao.fatLocacao + detalhesMedicao.fatMaoDeObra + detalhesMedicao.eventuais)}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm pt-4">
                  {(() => {
                    const impostos = (detalhesMedicao.impostoIrrf || 0) + (detalhesMedicao.impostoPis || 0) + (detalhesMedicao.impostoCofins || 0) + (detalhesMedicao.impostoCsll || 0) + (detalhesMedicao.impostoIss || 0);
                    const manutencao = (detalhesMedicao.manutencaoPecas || 0) + (detalhesMedicao.manutencaoServicos || 0) + (detalhesMedicao.manutencaoPneus || 0) + (detalhesMedicao.manutencaoLubrificacao || 0) + (detalhesMedicao.manutencaoPreventiva || 0) + (detalhesMedicao.manutencaoLavador || 0);
                    const folha = (detalhesMedicao.custoFolha || 0) + (detalhesMedicao.horasExtras || 0) + (detalhesMedicao.folhaInss || 0) + (detalhesMedicao.folhaFgts || 0) + (detalhesMedicao.folhaIrrf || 0) + (detalhesMedicao.custoTurnover || 0) + (detalhesMedicao.beneficioCafeDaManha || 0) + (detalhesMedicao.beneficioSeguroDeVida || 0) + (detalhesMedicao.beneficioPlanoDeSaude || 0) + (detalhesMedicao.beneficioPlanoOdontologico || 0) + (detalhesMedicao.beneficioTicketAlimentacao || 0) + (detalhesMedicao.beneficioValeTransporte || 0) + (detalhesMedicao.beneficioMaisParaTodos || 0) + (detalhesMedicao.beneficioRefeicao || 0);
                    const combustivel = (detalhesMedicao.combustivelDiesel || 0) + (detalhesMedicao.combustivelDieselS10 || 0) + (detalhesMedicao.combustivelDieselS500 || 0) + (detalhesMedicao.combustivelGasolina || 0);
                    const uniforme = detalhesMedicao.uniforme || 0;
                    const epi = detalhesMedicao.epi || 0;
                    const escritorio = detalhesMedicao.escritorioMaterial || 0;
                    const limpeza = detalhesMedicao.escritorioLimpeza || 0;
                    const totalCustos = folha + manutencao + combustivel + uniforme + epi + escritorio + limpeza + impostos;
                    
                    return (
                      <>
                        <Accordion type="multiple" className="w-full space-y-1 mt-2">
                          {/* IMPOSTOS */}
                        <AccordionItem value="impostos" className="border-b border-border/50 py-1">
                          <AccordionTrigger className="hover:no-underline py-2 px-1 text-muted-foreground flex justify-between w-full font-normal">
                            <span>Impostos (Total)</span>
                            <span className="text-destructive font-bold pr-2">-{formatCurrency(impostos)}</span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-2 px-2 bg-muted/10 rounded-lg space-y-2 text-xs">
                            <div className="flex justify-between"><span>PIS</span><span>{formatCurrency(detalhesMedicao.impostoPis || 0)}</span></div>
                            <div className="flex justify-between"><span>COFINS</span><span>{formatCurrency(detalhesMedicao.impostoCofins || 0)}</span></div>
                            <div className="flex justify-between"><span>CSLL</span><span>{formatCurrency(detalhesMedicao.impostoCsll || 0)}</span></div>
                            <div className="flex justify-between"><span>ISS</span><span>{formatCurrency(detalhesMedicao.impostoIss || 0)}</span></div>
                            
                          </AccordionContent>
                        </AccordionItem>

                        {/* FOLHA */}
                        <AccordionItem value="folha" className="border-b border-border/50 py-1">
                          <AccordionTrigger className="hover:no-underline py-2 px-1 text-muted-foreground flex justify-between w-full font-normal">
                            <span>Custos de Folha (Total)</span>
                            <span className="text-orange-500 font-bold pr-2">-{formatCurrency(folha)}</span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-2 px-2 bg-muted/10 rounded-lg space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between"><span>Folha de Pagamento {detalhesMedicao.custoFolhaQtd ? `(${detalhesMedicao.custoFolhaQtd} pess.)` : ''}</span><span>{formatCurrency(detalhesMedicao.custoFolha || 0)}</span></div>
                            <div className="flex justify-between"><span>Horas Extras {detalhesMedicao.horasExtrasQtd ? `(${detalhesMedicao.horasExtrasQtd} pess.)` : ''}</span><span>{formatCurrency(detalhesMedicao.horasExtras || 0)}</span></div>
                            <div className="flex justify-between text-muted-foreground/80"><span>INSS</span><span>{formatCurrency(detalhesMedicao.folhaInss || 0)}</span></div>
                            <div className="flex justify-between text-muted-foreground/80"><span>FGTS</span><span>{formatCurrency(detalhesMedicao.folhaFgts || 0)}</span></div>
                            <div className="flex justify-between text-muted-foreground/80"><span>IRRF (Folha)</span><span>{formatCurrency(detalhesMedicao.folhaIrrf || 0)}</span></div>
                            <div className="flex justify-between text-muted-foreground/80"><span>Café da Manhã</span><span>{formatCurrency(detalhesMedicao.beneficioCafeDaManha || 0)}</span></div>
                            <div className="flex justify-between text-muted-foreground/80"><span>Seguro de Vida</span><span>{formatCurrency(detalhesMedicao.beneficioSeguroDeVida || 0)}</span></div>
                            <div className="flex justify-between text-muted-foreground/80"><span>Plano de Saúde</span><span>{formatCurrency(detalhesMedicao.beneficioPlanoDeSaude || 0)}</span></div>
                            <div className="flex justify-between text-muted-foreground/80"><span>Plano Odontológico</span><span>{formatCurrency(detalhesMedicao.beneficioPlanoOdontologico || 0)}</span></div>
                            <div className="flex justify-between text-muted-foreground/80"><span>Ticket Alimentação</span><span>{formatCurrency(detalhesMedicao.beneficioTicketAlimentacao || 0)}</span></div>
                            <div className="flex justify-between text-muted-foreground/80"><span>Vale Transporte</span><span>{formatCurrency(detalhesMedicao.beneficioValeTransporte || 0)}</span></div>
                            <div className="flex justify-between text-muted-foreground/80"><span>Benefício Mais p/ Todos</span><span>{formatCurrency(detalhesMedicao.beneficioMaisParaTodos || 0)}</span></div>
                            <div className="flex justify-between text-muted-foreground/80"><span>Refeição</span><span>{formatCurrency(detalhesMedicao.beneficioRefeicao || 0)}</span></div>
                            <div className="flex justify-between"><span>Turnover</span><span>{formatCurrency(detalhesMedicao.custoTurnover || 0)}</span></div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* MANUTENÇÃO */}
                        <AccordionItem value="manutencao" className="border-b border-border/50 py-1">
                          <AccordionTrigger className="hover:no-underline py-2 px-1 text-muted-foreground flex justify-between w-full font-normal">
                            <span>Manutenção (Total)</span>
                            <span className="text-orange-500 font-bold pr-2">-{formatCurrency(manutencao)}</span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-2 px-2 bg-muted/10 rounded-lg space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between"><span>Peças</span><span>{formatCurrency(detalhesMedicao.manutencaoPecas || 0)}</span></div>
                            <div className="flex justify-between"><span>Serviços</span><span>{formatCurrency(detalhesMedicao.manutencaoServicos || 0)}</span></div>
                            <div className="flex justify-between"><span>Pneus</span><span>{formatCurrency(detalhesMedicao.manutencaoPneus || 0)}</span></div>
                            <div className="flex justify-between"><span>Lubrificação</span><span>{formatCurrency(detalhesMedicao.manutencaoLubrificacao || 0)}</span></div>
                            <div className="flex justify-between"><span>Preventiva</span><span>{formatCurrency(detalhesMedicao.manutencaoPreventiva || 0)}</span></div>
                            <div className="flex justify-between"><span>Lavador</span><span>{formatCurrency(detalhesMedicao.manutencaoLavador || 0)}</span></div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* COMBUSTÍVEL */}
                        <AccordionItem value="combustivel" className="border-b border-border/50 py-1">
                          <AccordionTrigger className="hover:no-underline py-2 px-1 text-muted-foreground flex justify-between w-full font-normal">
                            <span>Combustível (Total)</span>
                            <span className="text-orange-500 font-bold pr-2">-{formatCurrency(combustivel)}</span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-2 px-2 bg-muted/10 rounded-lg space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between"><span>Diesel S10</span><span>{formatCurrency(detalhesMedicao.combustivelDieselS10 || 0)}</span></div>
                            <div className="flex justify-between"><span>Diesel S500</span><span>{formatCurrency(detalhesMedicao.combustivelDieselS500 || 0)}</span></div>
                            <div className="flex justify-between"><span>Gasolina</span><span>{formatCurrency(detalhesMedicao.combustivelGasolina || 0)}</span></div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* SEGURANÇA */}
                        <AccordionItem value="seguranca" className="border-b border-border/50 py-1">
                          <AccordionTrigger className="hover:no-underline py-2 px-1 text-muted-foreground flex justify-between w-full font-normal">
                            <span>Segurança (Total)</span>
                            <span className="text-orange-500 font-bold pr-2">-{formatCurrency(uniforme + epi)}</span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-2 px-2 bg-muted/10 rounded-lg space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between"><span>Uniforme</span><span>{formatCurrency(uniforme)}</span></div>
                            <div className="flex justify-between"><span>EPI</span><span>{formatCurrency(epi)}</span></div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* MATERIAIS */}
                        <AccordionItem value="materiais" className="border-b border-border/50 py-1">
                          <AccordionTrigger className="hover:no-underline py-2 px-1 text-muted-foreground flex justify-between w-full font-normal">
                            <span>Materiais (Total)</span>
                            <span className="text-orange-500 font-bold pr-2">-{formatCurrency(escritorio + limpeza)}</span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-2 px-2 bg-muted/10 rounded-lg space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between"><span>Material de Escritório</span><span>{formatCurrency(escritorio)}</span></div>
                            <div className="flex justify-between"><span>Material de Limpeza</span><span>{formatCurrency(limpeza)}</span></div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                        <div className="flex justify-between items-center font-bold pt-2 border-t border-border/50">
                          <span>Custos de Execução</span>
                          <span className="text-orange-600">-{formatCurrency(totalCustos)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex justify-between items-center font-black text-lg pt-4 border-t-2 border-border">
                  <span>Lucro Líquido</span>
                  {(() => {
                    const rec = detalhesMedicao.fatLocacao + detalhesMedicao.fatMaoDeObra + detalhesMedicao.eventuais;
                    const impostosTotais = (detalhesMedicao.impostoIrrf || 0) + (detalhesMedicao.impostoPis || 0) + (detalhesMedicao.impostoCofins || 0) + (detalhesMedicao.impostoCsll || 0) + (detalhesMedicao.impostoIss || 0);
                    const cust = (detalhesMedicao.custoFolha || 0) + (detalhesMedicao.horasExtras || 0) + (detalhesMedicao.folhaInss || 0) + (detalhesMedicao.folhaFgts || 0) + (detalhesMedicao.folhaIrrf || 0) + (detalhesMedicao.custoTurnover || 0) + (detalhesMedicao.beneficioCafeDaManha || 0) + (detalhesMedicao.beneficioSeguroDeVida || 0) + (detalhesMedicao.beneficioPlanoDeSaude || 0) + (detalhesMedicao.beneficioPlanoOdontologico || 0) + (detalhesMedicao.beneficioTicketAlimentacao || 0) + (detalhesMedicao.beneficioValeTransporte || 0) + (detalhesMedicao.beneficioMaisParaTodos || 0) + (detalhesMedicao.beneficioRefeicao || 0) + (detalhesMedicao.manutencaoPecas || 0) + (detalhesMedicao.manutencaoServicos || 0) + (detalhesMedicao.manutencaoPneus || 0) + (detalhesMedicao.manutencaoLubrificacao || 0) + (detalhesMedicao.manutencaoPreventiva || 0) + (detalhesMedicao.manutencaoLavador || 0) + (detalhesMedicao.combustivelDiesel || 0) + (detalhesMedicao.combustivelDieselS10 || 0) + (detalhesMedicao.combustivelDieselS500 || 0) + (detalhesMedicao.combustivelGasolina || 0) + (detalhesMedicao.uniforme || 0) + (detalhesMedicao.epi || 0) + (detalhesMedicao.escritorioMaterial || 0) + (detalhesMedicao.escritorioLimpeza || 0) + impostosTotais;
                    const perdas = detalhesMedicao.descontos.reduce((a,c)=>a+c.valor,0) + detalhesMedicao.multas.reduce((a,c)=>a+c.valor,0);
                    const lucro = rec - cust - perdas;
                    return (
                      <span className={lucro >= 0 ? 'text-success' : 'text-destructive'}>
                        {formatCurrency(lucro)}
                      </span>
                    );
                  })()}
                </div>
              </div>
              
              <div className="pt-2 pb-2">
                <Accordion type="multiple" className="w-full space-y-4">
                  {/* Descontos / Glosas */}
                  <AccordionItem value="descontos" className="border-none">
                    <AccordionTrigger className="font-bold text-sm uppercase text-muted-foreground border-b pb-1 hover:no-underline py-2">
                      Descontos / Glosas ({detalhesMedicao.descontos.length})
                    </AccordionTrigger>
                    <AccordionContent className="pt-3">
                      {detalhesMedicao.descontos.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Nenhum desconto aplicado no período.</p>
                      ) : (
                        <ul className="space-y-2">
                          {detalhesMedicao.descontos.map((d, i) => (
                            <li key={i} className="flex justify-between items-center text-sm p-3 bg-muted/30 rounded-lg border border-border/50">
                              <span>{d.motivo}</span>
                              <span className="font-bold text-destructive">{formatCurrency(d.valor)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Multas */}
                  <AccordionItem value="multas" className="border-none">
                    <AccordionTrigger className="font-bold text-sm uppercase text-muted-foreground border-b pb-1 hover:no-underline py-2">
                      Multas Contratuais ({detalhesMedicao.multas.length})
                    </AccordionTrigger>
                    <AccordionContent className="pt-3">
                      {detalhesMedicao.multas.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Nenhuma multa aplicada no período.</p>
                      ) : (
                        <ul className="space-y-2">
                          {detalhesMedicao.multas.map((m, i) => (
                            <li 
                              key={i} 
                              onClick={() => (m as any).isGlobal ? setNotificacaoDetalhe(m as any) : undefined}
                              className={`flex justify-between items-center text-sm p-3 bg-destructive/10 rounded-lg border border-destructive/20 ${(m as any).isGlobal ? 'cursor-pointer hover:bg-destructive/20 hover:border-destructive/50 transition-colors' : ''}`}
                            >
                              <div className="flex flex-col gap-1">
                                <span className="text-destructive font-medium">{m.motivo}</span>
                                {(m as any).isGlobal && <span className="text-[10px] uppercase bg-destructive/20 px-2 py-0.5 rounded-full w-fit text-destructive">Detalhes</span>}
                              </div>
                              <span className="font-bold text-destructive">{formatCurrency(m.valor)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Notificações */}
                  <AccordionItem value="notificacoes" className="border-none">
                    <AccordionTrigger className="font-bold text-sm uppercase text-muted-foreground border-b pb-1 hover:no-underline py-2">
                      Notificações Formais ({detalhesMedicao.notificacoes.length})
                    </AccordionTrigger>
                    <AccordionContent className="pt-3">
                      {detalhesMedicao.notificacoes.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Nenhuma notificação recebida no período.</p>
                      ) : (
                        <ul className="space-y-2">
                          {detalhesMedicao.notificacoes.map((n, i) => (
                            <li 
                              key={i} 
                              onClick={() => setNotificacaoDetalhe(n)}
                              className={`text-sm p-3 bg-warning/10 rounded-lg border border-warning/20 text-warning-foreground font-medium flex items-center gap-2 cursor-pointer hover:bg-warning/20 hover:border-warning/50 transition-colors`}
                            >
                              <FileWarning className="w-4 h-4 text-warning" />
                              <span className="flex-1">{n.motivo}</span>
                              <span className="text-[10px] uppercase bg-warning/20 px-2 py-0.5 rounded-full">Detalhes</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Equipamentos */}
              <div className="pt-2 pb-6">
                <Accordion type="multiple" className="w-full space-y-4">
                  {/* Abaixo SLA */}
                  <AccordionItem value="abaixo" className="border-none">
                    <AccordionTrigger className="font-bold text-sm uppercase text-muted-foreground border-b pb-1 hover:no-underline py-2">
                      Equipamentos Abaixo do SLA (SLA &lt; 95%)
                    </AccordionTrigger>
                    <AccordionContent className="pt-3">
                      {!detalhesMedicao.equipamentosPerdidos?.filter(e => e.aderencia && parseFloat(e.aderencia.replace(',', '.')) < 95).length ? (
                        <p className="text-sm text-muted-foreground italic">Nenhum equipamento abaixo do SLA.</p>
                      ) : (
                        <ul className="space-y-2">
                          {detalhesMedicao.equipamentosPerdidos.filter(e => e.aderencia && parseFloat(e.aderencia.replace(',', '.')) < 95).map((e, i) => (
                            <li key={i} className="flex justify-between items-center text-sm p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-destructive" />
                                <span className="text-destructive font-medium">{e.motivo}</span>
                              </div>
                              {e.aderencia && <span className="font-bold text-destructive whitespace-nowrap">{e.aderencia}%</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Acima SLA */}
                  <AccordionItem value="acima" className="border-none">
                    <AccordionTrigger className="font-bold text-sm uppercase text-muted-foreground border-b pb-1 hover:no-underline py-2">
                      Equipamentos Acima do SLA (SLA &ge; 95%)
                    </AccordionTrigger>
                    <AccordionContent className="pt-3">
                      {!detalhesMedicao.equipamentosPerdidos?.filter(e => e.aderencia && parseFloat(e.aderencia.replace(',', '.')) >= 95).length ? (
                        <p className="text-sm text-muted-foreground italic">Nenhum equipamento acima do SLA.</p>
                      ) : (
                        <ul className="space-y-2">
                          {detalhesMedicao.equipamentosPerdidos.filter(e => e.aderencia && parseFloat(e.aderencia.replace(',', '.')) >= 95).map((e, i) => (
                            <li key={i} className="flex justify-between items-center text-sm p-3 bg-success/10 rounded-lg border border-success/20">
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-success" />
                                <span className="text-success font-medium">{e.motivo}</span>
                              </div>
                              {e.aderencia && <span className="font-bold text-success whitespace-nowrap">{e.aderencia}%</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  ), [medicoes, lastMonth, chartData, detalhesMedicao, hiddenCards, prevMonth, activeTab, timeRange, selectedMonthDRE, ofensoresData, filteredChartData]);

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LineChartIcon className="w-8 h-8 text-primary" />
            Dashboard de Contrato
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise executiva de SLA, rentabilidade financeira e ofensores operacionais.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <input type="file" id="import-backup" accept=".json" className="hidden" onChange={handleImport} />
          
          <Button onClick={() => document.getElementById('import-backup')?.click()} variant="outline" className="gap-2 text-muted-foreground hover:text-foreground">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar Backup</span>
          </Button>
          
          <Button onClick={handleExport} variant="outline" className="gap-2 text-muted-foreground hover:text-foreground">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Backup</span>
          </Button>

          <Button onClick={() => { localStorage.removeItem('corporate_cheerleader_medicoes'); window.location.reload(); }} variant="outline" className="gap-2 border-primary/50 text-primary">
            <RefreshCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Restaurar Padrão</span>
          </Button>

          <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); }}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenModal} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"><Calculator className="w-4 h-4" /> Lançar Fechamento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="mb-4">
              <DialogTitle className="text-xl flex items-center gap-2"><Calculator className="w-5 h-5 text-primary" /> {editingId ? 'Editar Medição Mensal' : 'Lançar Medição Mensal'}</DialogTitle>
              <p className="text-sm text-muted-foreground">Insira os resultados operacionais e financeiros referentes ao fechamento do mês.</p>
            </DialogHeader>
            <MedicaoForm 
              medicaoToEdit={editingId ? medicoes.find(m => m.id === editingId) || null : null}
              onSave={handleSaveFromComponent}
              onCancel={() => setIsModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {dashboardContent}


      {/* DIALOG GERAL DE GRÁFICOS */}
      <Dialog open={expandedChart !== null} onOpenChange={(open) => !open && setExpandedChart(null)}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {expandedChart === 'sla' && 'Evolução da Aderência (SLA)'}
              {expandedChart === 'minerio' && 'Porto - Minério (Aderência vs Meta)'}
              {expandedChart === 'tpm' && 'Porto - TPM (Aderência vs Meta)'}
              {expandedChart === 'diario' && 'Evolução Aderência Mês (Diário)'}
              {expandedChart === 'resumo' && 'Aderência vs Margem'}
              {expandedChart === 'rentabilidade' && 'Análise de Rentabilidade'}
              {expandedChart === 'ofensores' && 'Mapa de Ofensores (Acumulado)'}
              {expandedChart === 'metas' && 'Acompanhamento de Metas'}
            </DialogTitle>
            <DialogDescription>Visualização ampliada do gráfico selecionado.</DialogDescription>
          </DialogHeader>
          <div className="h-[70vh] w-full mt-4">
            
            {expandedChart === 'sla' && (
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="colorSlaAreaBig" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
                    <YAxis domain={['auto', 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => `${val}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <ReferenceLine y={95} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ position: 'top', value: 'Meta SLA (95%)', fill: 'hsl(var(--warning))', fontSize: 11, fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="aderencia" name="Aderência SLA (%)" fill="url(#colorSlaAreaBig)" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 5, fill: "hsl(var(--background))", strokeWidth: 2 }} activeDot={{ r: 7, fill: "hsl(var(--primary))" }}>
                      <LabelList dataKey="aderencia" position="top" offset={10} formatter={(val) => `${val}%`} style={{ fontSize: '11px', fontWeight: 'bold', fill: 'hsl(var(--primary))' }} />
                    </Area>
                  </ComposedChart>
                </ResponsiveContainer>
            )}

            {/* AS MODAIS DE MINÉRIO, TPM E DIÁRIO FORAM REMOVIDAS POIS O DAILYCHART GERENCIA SUA PRÓPRIA MODAL */}

            {expandedChart === 'resumo' && (
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }} onClick={(e: any) => { if (e && e.activeLabel) { setSelectedMonthDRE(e.activeLabel); setActiveTab('dre'); } }} className="cursor-pointer">
                    <defs>
                      <linearGradient id="colorSlaBig" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={10} interval={0} angle={-45} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" fontSize={12} domain={[80, 100]} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--blue-500))" fontSize={12} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar yAxisId="left" dataKey="aderencia" name="Aderência SLA" fill="url(#colorSlaBig)" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="margem" name="Margem (%)" stroke="hsl(var(--blue-500))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
            )}

            {expandedChart === 'rentabilidade' && (
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="colorSaldoBig" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={10} interval={0} angle={-45} textAnchor="end" height={60} />
                    <YAxis tickFormatter={(val) => `R${val/1000}k`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar stackId="a" dataKey="perdas" name="Glosas/Multas" fill="hsl(var(--destructive))" barSize={30} />
                    <Bar stackId="a" dataKey="horasExtras" name="Horas Extras" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                    <Area type="monotone" dataKey="saldo" name="Lucro Líquido Real" fill="url(#colorSaldoBig)" stroke="hsl(var(--success))" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
            )}

            {expandedChart === 'ofensores' && (
              <div className="w-full h-full">
                {ofensoresData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ofensoresData} cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" paddingAngle={2} dataKey="value">
                        {ofensoresData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '14px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem ofensores financeiros registrados.</div>
                )}
              </div>
            )}

            {expandedChart === 'metas' && (
              <Tabs defaultValue="impostos" className="w-full h-full flex flex-col">
                <TabsList className="grid grid-cols-3 sm:grid-cols-6 mb-4 h-auto shrink-0">
                  <TabsTrigger value="impostos" className="py-2">Impostos</TabsTrigger>
                  <TabsTrigger value="folha" className="py-2">Folha</TabsTrigger>
                  <TabsTrigger value="manutencao" className="py-2">Manutenção</TabsTrigger>
                  <TabsTrigger value="combustivel" className="py-2">Combustível</TabsTrigger>
                  <TabsTrigger value="seguranca" className="py-2">Segurança</TabsTrigger>
                  <TabsTrigger value="materiais" className="py-2">Materiais</TabsTrigger>
                </TabsList>
                {['impostos', 'folha', 'manutencao', 'combustivel', 'seguranca', 'materiais'].map(tab => (
                  <TabsContent key={tab} value={tab} className="flex-1 mt-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey={tab === 'impostos' ? 'impostosTotal' : tab === 'folha' ? 'folhaTotal' : tab === 'manutencao' ? 'manutencaoTotal' : tab === 'combustivel' ? 'combustivelTotal' : tab === 'seguranca' ? 'uniformeTotal' : 'escritorioTotal'} name="Custo Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Line type="monotone" dataKey={tab === 'impostos' ? 'metaImpostos' : tab === 'folha' ? 'metaFolha' : tab === 'manutencao' ? 'metaManutencao' : tab === 'combustivel' ? 'metaCombustivel' : tab === 'seguranca' ? 'metaSeguranca' : 'metaMateriais'} name="Meta" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </TabsContent>
                ))}
              

</Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE DETALHES DE NOTIFICACAO */}
      <Dialog open={notificacaoDetalhe !== null} onOpenChange={(open) => !open && setNotificacaoDetalhe(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileWarning className="w-5 h-5 text-warning" /> Detalhes da Notificação</DialogTitle>
            <DialogDescription>Dados vindos da Gestão de Notificações</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase">Motivo</Label>
              <p className="font-medium text-sm">{notificacaoDetalhe?.motivo}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase">Data Recebimento</Label>
                <p className="font-medium text-sm">{notificacaoDetalhe?.dataStr || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase">Local</Label>
                <p className="font-medium text-sm">{notificacaoDetalhe?.local || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase">Solicitante</Label>
                <p className="font-medium text-sm">{notificacaoDetalhe?.solicitante || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase">Plano de Ação</Label>
                <p className="font-medium text-sm">{notificacaoDetalhe?.planoDeAcao || 'N/A'}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
