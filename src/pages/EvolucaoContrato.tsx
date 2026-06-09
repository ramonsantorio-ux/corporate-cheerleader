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
import { TrendingUp, DollarSign, Calculator, LineChart as LineChartIcon, ShieldAlert, Target, AlertTriangle, FileWarning, TrendingDown, ArrowUpRight, ArrowDownRight, Minus, Plus, Trash2, Info, Pencil, Eye, EyeOff, RefreshCcw, Download, Upload, Calendar, Share2, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, ReferenceLine, LabelList, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import * as XLSX from 'xlsx';

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

  useEffect(() => {
    const fetchMedicoes = async () => {
      try {
        const { data, error } = await supabase.from('medicoes').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        
        const saved = localStorage.getItem('corporate_cheerleader_medicoes');
        
        if (data && data.length > 0) {
          const mappedData = data.map(d => ({ ...d.dados, _supabaseId: d.id }));
          setMedicoes(mappedData);
        } else if (data && data.length === 0) {
          setMedicoes([]);
        } else if (saved) {
          setMedicoes(JSON.parse(saved));
        } else {
          setMedicoes([]);
        }
      } catch (error) {
        console.error('Erro ao buscar do supabase:', error);
        const saved = localStorage.getItem('corporate_cheerleader_medicoes');
        if (saved) setMedicoes(JSON.parse(saved));
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
    const medicaoComIdLocal = editingId ? { ...novaMedicao, id: editingId } : { ...novaMedicao, id: Date.now() };
    
    if (editingId) {
      const existing = medicoes.find(m => m.id === editingId);
      if (existing && existing._supabaseId) {
        await supabase.from('medicoes').update({ mes: medicaoComIdLocal.mes, dados: medicaoComIdLocal }).eq('id', existing._supabaseId);
        setMedicoes(medicoes.map(m => m.id === editingId ? { ...medicaoComIdLocal, _supabaseId: existing._supabaseId } : m));
      } else {
        setMedicoes(medicoes.map(m => m.id === editingId ? medicaoComIdLocal : m));
      }
      toast({ title: 'Sucesso', description: 'Fechamento atualizado com sucesso!' });
    } else {
      const { data, error } = await supabase.from('medicoes').insert([{ mes: medicaoComIdLocal.mes, dados: medicaoComIdLocal }]).select();
      if (!error && data && data.length > 0) {
        setMedicoes([...medicoes, { ...medicaoComIdLocal, _supabaseId: data[0].id }]);
      } else {
        setMedicoes([...medicoes, medicaoComIdLocal]);
      }
      toast({ title: 'Sucesso', description: 'Fechamento registrado com sucesso!' });
    }
    setIsModalOpen(false);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 shadow-md rounded-md z-50">
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">
                {typeof entry.value === 'number' && entry.name.includes('Glosa') || entry.name.includes('Ofensores') ? `R$ ${(entry.value).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Derivations for charts and KPIs
  const chartData = useMemo(() => {
    // Gerar últimos 12 meses para os dados do contrato industrial
    const data = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mes = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      // Aderência à programação (Meta VALE é 95%)
      const baseAderencia = 90 + Math.random() * 9; // Varia de 90 a 99
      const aderencia = Number(baseAderencia.toFixed(1));
      
      // Disponibilidade Física Equipamentos (MEV)
      const horasTotais = 7200; // Ex: 10 equipamentos operando 720h/mês
      const horasParadas = Math.floor(Math.random() * 800);
      const horasTrabalhadas = horasTotais - horasParadas;
      const disponibilidade = Number(((horasTrabalhadas / horasTotais) * 100).toFixed(1));

      // SSMA (RACs) - Conformidade de Treinamento e Inspeção
      const rac1 = 80 + Math.random() * 20; // Altura
      const rac2 = 90 + Math.random() * 10; // Veículos Leves
      const rac3 = 85 + Math.random() * 15; // Equipamentos Móveis
      const rac4 = 95 + Math.random() * 5;  // Bloqueio Energia
      const racMedia = Number(((rac1 + rac2 + rac3 + rac4) / 4).toFixed(1));

      // Glosas e Penalidades Financeiras
      const glosaAderencia = aderencia < 95 ? (95 - aderencia) * 1500 : 0;
      const glosaSSMA = Math.random() > 0.7 ? Math.random() * 5000 : 0; // Multas de segurança esporádicas
      const totalGlosas = Number((glosaAderencia + glosaSSMA).toFixed(2));

      data.push({
        mes,
        aderencia,
        metaAderencia: 95,
        disponibilidade,
        horasTrabalhadas,
        horasParadas,
        racMedia,
        rac1: Number(rac1.toFixed(1)),
        rac2: Number(rac2.toFixed(1)),
        rac3: Number(rac3.toFixed(1)),
        rac4: Number(rac4.toFixed(1)),
        totalGlosas,
        glosaAderencia,
        glosaSSMA
      });
    }
    return data;
  }, [timeRange]);

  const filteredChartData = useMemo(() => {
    if (timeRange === 'all') return chartData;
    const months = parseInt(timeRange);
    return chartData.slice(-months);
  }, [chartData, timeRange]);

  const lastMonth = filteredChartData[filteredChartData.length - 1];
  const prevMonth = filteredChartData[filteredChartData.length - 2] || lastMonth;

  const ofensoresData = useMemo(() => {
    const totalGlosaAderencia = filteredChartData.reduce((acc, curr) => acc + curr.glosaAderencia, 0);
    const totalGlosaSSMA = filteredChartData.reduce((acc, curr) => acc + curr.glosaSSMA, 0);
    const totalFaltaEfetivo = Math.random() * 15000 + 5000;
    const totalAvarias = Math.random() * 20000 + 10000;

    return [
      { name: 'Baixa Aderência (SLA < 95%)', value: totalGlosaAderencia, color: 'hsl(var(--destructive))' },
      { name: 'Infrações SSMA/RAC', value: totalGlosaSSMA, color: 'hsl(var(--warning))' },
      { name: 'Absenteísmo/Falta Efetivo', value: totalFaltaEfetivo, color: 'hsl(var(--orange-500))' },
      { name: 'Quebra de Equipamentos', value: totalAvarias, color: 'hsl(var(--muted-foreground))' },
    ].filter(item => item.value > 0);
  }, [filteredChartData]);

  const radarRACData = [
    { subject: 'RAC 01 (Altura)', A: lastMonth?.rac1 || 0, fullMark: 100 },
    { subject: 'RAC 02 (Veículos Leves)', A: lastMonth?.rac2 || 0, fullMark: 100 },
    { subject: 'RAC 03 (Equip. Móveis)', A: lastMonth?.rac3 || 0, fullMark: 100 },
    { subject: 'RAC 04 (Bloqueio Energia)', A: lastMonth?.rac4 || 0, fullMark: 100 },
    { subject: 'RAC 05 (Içamento)', A: 90 + Math.random()*10, fullMark: 100 },
  ];

  const getTrend = (current: number, prev: number, inverseGood = false) => {
    if (!current || !prev) return { icon: <Minus className="w-4 h-4 text-muted-foreground" />, color: 'text-muted-foreground', value: '0%' };
    const diff = ((current - prev) / prev) * 100;
    const isPositive = diff >= 0;
    const isGood = inverseGood ? !isPositive : isPositive;
    
    if (Math.abs(diff) < 0.1) return { icon: <Minus className="w-4 h-4 text-muted-foreground" />, color: 'text-muted-foreground', value: '0%' };
    
    return {
      icon: isPositive ? <ArrowUpRight className={`w-4 h-4 ${isGood ? 'text-success' : 'text-destructive'}`} /> : <ArrowDownRight className={`w-4 h-4 ${isGood ? 'text-success' : 'text-destructive'}`} />,
      color: isGood ? 'text-success' : 'text-destructive',
      value: `${Math.abs(diff).toFixed(1)}%`
    };
  };

  const dashboardContent = useMemo(() => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão Operacional do Contrato</h2>
          <p className="text-muted-foreground">Monitoramento de SLAs, SSMA, Conformidade RAC e Equipamentos (MEV).</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-background border-border shadow-sm">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon"><Download className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon"><Share2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aderência à Programação</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastMonth?.aderencia}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getTrend(lastMonth?.aderencia, prevMonth?.aderencia).icon}
              <span className={`text-xs ${getTrend(lastMonth?.aderencia, prevMonth?.aderencia).color} font-medium`}>
                {getTrend(lastMonth?.aderencia, prevMonth?.aderencia).value}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
            </div>
            {lastMonth?.aderencia < 95 && (
              <div className="mt-2 text-[11px] bg-destructive/10 text-destructive px-2 py-1 rounded-md inline-block font-semibold">
                ⚠️ Abaixo da meta (95%)
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibilidade MEV</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastMonth?.disponibilidade}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getTrend(lastMonth?.disponibilidade, prevMonth?.disponibilidade).icon}
              <span className={`text-xs ${getTrend(lastMonth?.disponibilidade, prevMonth?.disponibilidade).color} font-medium`}>
                {getTrend(lastMonth?.disponibilidade, prevMonth?.disponibilidade).value}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              {lastMonth?.horasTrabalhadas}h operadas / {lastMonth?.horasParadas}h em manutenção
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conformidade RAC (SSMA)</CardTitle>
            <ShieldAlert className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastMonth?.racMedia}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getTrend(lastMonth?.racMedia, prevMonth?.racMedia).icon}
              <span className={`text-xs ${getTrend(lastMonth?.racMedia, prevMonth?.racMedia).color} font-medium`}>
                {getTrend(lastMonth?.racMedia, prevMonth?.racMedia).value}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
            </div>
            <div className="mt-2 flex gap-2">
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">0 Acidentes</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">0 Interdições</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penalidades / Glosas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {(lastMonth?.totalGlosas / 1000).toFixed(1)}k
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getTrend(lastMonth?.totalGlosas, prevMonth?.totalGlosas, true).icon}
              <span className={`text-xs ${getTrend(lastMonth?.totalGlosas, prevMonth?.totalGlosas, true).color} font-medium`}>
                {getTrend(lastMonth?.totalGlosas, prevMonth?.totalGlosas, true).value}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Aderência à Programação (SLA)</CardTitle>
            <CardDescription>Acompanhamento mensal da meta de aderência contratual (Mínimo de 95%).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorAderencia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
                  <YAxis domain={[80, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <ReferenceLine y={95} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ position: 'top', value: 'Corte (95%)', fill: 'hsl(var(--destructive))', fontSize: 11, fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="aderencia" name="Aderência SLA" fill="url(#colorAderencia)" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 5, fill: "hsl(var(--background))", strokeWidth: 2 }} activeDot={{ r: 7, fill: "hsl(var(--primary))" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Conformidade de Treinamentos (SSMA / RACs)</CardTitle>
            <CardDescription>Adesão da equipe aos Requisitos de Atividades Críticas vigentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarRACData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Conformidade RAC" dataKey="A" stroke="hsl(var(--success))" strokeWidth={2} fill="hsl(var(--success))" fillOpacity={0.4} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Disponibilidade Física (MEV)</CardTitle>
            <CardDescription>Horas trabalhadas vs Horas em manutenção das Máquinas e Veículos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => `${val}h`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="horasTrabalhadas" name="Horas Operando" stackId="a" fill="hsl(var(--blue-500))" barSize={35} />
                  <Bar dataKey="horasParadas" name="Horas Manutenção" stackId="a" fill="hsl(var(--orange-500))" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Mapa de Desvios (Glosas / Penalidades)</CardTitle>
            <CardDescription>Principais ofensores que geram glosas financeiras no contrato (Acumulado).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              {ofensoresData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ofensoresData}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {ofensoresData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <Label 
                        value="Total Ofensores" 
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

    </div>
  ), [filteredChartData, lastMonth, prevMonth, timeRange, ofensoresData, radarRACData]);

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
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
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
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
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
