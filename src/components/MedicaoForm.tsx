import React, { useState, useEffect, useRef } from 'react';
import { readExcelRaw, readExcelRows } from '@/lib/excel';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, DollarSign, Calculator, LineChart as LineChartIcon, ShieldAlert, Target, AlertTriangle, FileWarning, TrendingDown, ArrowUpRight, ArrowDownRight, Minus, Plus, Trash2, Info, Pencil, Eye, EyeOff, Settings, Briefcase } from "lucide-react";
import { Medicao, OfensorFinanceiro, OfensorNotificacao, LISTA_EQUIPAMENTOS, formatCurrencyInput, parseCurrencyInput } from '../pages/EvolucaoContrato';

export function MedicaoForm({ medicaoToEdit, onSave, onCancel }: { medicaoToEdit: Medicao | null, onSave: (m: Medicao) => void, onCancel: () => void }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Form states
  const [formData, setFormData] = useState({
    mes: '', aderencia: '', fatLocacao: '', fatMaoDeObra: '', eventuais: '', 
    impostoIrrf: '', impostoPis: '', impostoCofins: '', impostoCsll: '', impostoIss: '', impostoInss: '', impostoInssAdSat: '', 
    manutencaoPecas: '', manutencaoServicos: '', manutencaoPneus: '', 
    manutencaoLubrificacao: '', manutencaoLavador: '', manutencaoPreventiva: '', combustivelDieselS10: '', combustivelDieselS500: '', combustivelGasolina: '',
    uniforme: '', epi: '', escritorioMaterial: '', escritorioLimpeza: '',
    custoFolha: '', custoFolhaQtd: '', horasExtras: '', horasExtrasQtd: '', folhaIrrf: '', custoTurnover: '',
    metaImpostos: '', metaFolha: '', metaManutencao: '', metaCombustivel: '', metaSeguranca: '', metaMateriais: '',
    encargosInss: '', encargosFgts: '',
    beneficioCafeDaManha: '', beneficioSeguroDeVida: '', beneficioPlanoDeSaude: '', beneficioPlanoOdontologico: '',
    beneficioTicketAlimentacao: '', beneficioValeTransporte: '', beneficioMaisParaTodos: '', beneficioRefeicao: ''

  });
  const [descontosList, setDescontosList] = useState<OfensorFinanceiro[]>([]);
  const [multasList, setMultasList] = useState<OfensorFinanceiro[]>([]);
  const [notificacoesList, setNotificacoesList] = useState<OfensorNotificacao[]>([]);
  const [equipamentosList, setEquipamentosList] = useState<{ motivo: string; aderencia: string }[]>([]);
  const [aderenciaDiaria, setAderenciaDiaria] = useState<{ dia: string; aderencia: number }[]>([]);
  const [aderenciaMinerioDiaria, setAderenciaMinerioDiaria] = useState<{ dia: string; aderencia: number }[]>([]);
  const [aderenciaTpmDiaria, setAderenciaTpmDiaria] = useState<{ dia: string; aderencia: number }[]>([]);


  useEffect(() => {
    if (medicaoToEdit) {
      const m = medicaoToEdit;
      setFormData({
        mes: m.mes || '',
        aderencia: (m.aderencia || 0).toString(),
        fatLocacao: (m.fatLocacao || 0).toString(),
        fatMaoDeObra: (m.fatMaoDeObra || 0).toString(),
        eventuais: (m.eventuais || 0).toString(),
        impostoIrrf: (m.impostoIrrf || 0).toString(),
        impostoPis: (m.impostoPis || 0).toString(),
        impostoCofins: (m.impostoCofins || 0).toString(),
        impostoCsll: (m.impostoCsll || 0).toString(),
        impostoIss: (m.impostoIss || 0).toString(),
        impostoInss: (m.impostoInss || 0).toString(),
        impostoInssAdSat: (m.impostoInssAdSat || 0).toString(),
        manutencaoPecas: (m.manutencaoPecas || 0).toString(),
        manutencaoServicos: (m.manutencaoServicos || 0).toString(),
        manutencaoPneus: (m.manutencaoPneus || 0).toString(),
        manutencaoLubrificacao: (m.manutencaoLubrificacao || 0).toString(),
        manutencaoLavador: (m.manutencaoLavador || 0).toString(),
        manutencaoPreventiva: (m.manutencaoPreventiva || 0).toString(),
        combustivelDieselS10: (m.combustivelDieselS10 || 0).toString(),
        combustivelDieselS500: (m.combustivelDieselS500 || 0).toString(),
        combustivelGasolina: (m.combustivelGasolina || 0).toString(),
        uniforme: (m.uniforme || 0).toString(),
        epi: (m.epi || 0).toString(),
        escritorioMaterial: (m.escritorioMaterial || 0).toString(),
        escritorioLimpeza: (m.escritorioLimpeza || 0).toString(),
        custoFolha: (m.custoFolha || 0).toString(),
        custoFolhaQtd: (m.custoFolhaQtd || '').toString(),
        custoTurnover: (m.custoTurnover || 0).toString(),
        metaImpostos: (m.metaImpostos || 0).toString(),
        metaFolha: (m.metaFolha || 0).toString(),
        metaManutencao: (m.metaManutencao || 0).toString(),
        metaCombustivel: (m.metaCombustivel || 0).toString(),
        metaSeguranca: (m.metaSeguranca || 0).toString(),
        metaMateriais: (m.metaMateriais || 0).toString(),
        horasExtras: (m.horasExtras || 0).toString(),
        horasExtrasQtd: (m.horasExtrasQtd || '').toString(),
        
        encargosInss: (m.encargosInss || m.folhaInss || 0).toString(),
        encargosFgts: (m.encargosFgts || m.folhaFgts || 0).toString(),
        beneficioCafeDaManha: (m.beneficioCafeDaManha || 0).toString(),
        beneficioSeguroDeVida: (m.beneficioSeguroDeVida || 0).toString(),
        beneficioPlanoDeSaude: (m.beneficioPlanoDeSaude || 0).toString(),
        beneficioPlanoOdontologico: (m.beneficioPlanoOdontologico || 0).toString(),
        beneficioTicketAlimentacao: (m.beneficioTicketAlimentacao || 0).toString(),
        beneficioValeTransporte: (m.beneficioValeTransporte || 0).toString(),
        beneficioMaisParaTodos: (m.beneficioMaisParaTodos || 0).toString(),
        beneficioRefeicao: (m.beneficioRefeicao || 0).toString(),

        folhaIrrf: (m.folhaIrrf || 0).toString(),
      });
      setDescontosList([...(m.descontos || [])]);
      setMultasList([...(m.multas || [])]);
      setNotificacoesList([...(m.notificacoes || [])]);
      setEquipamentosList([...(m.equipamentosPerdidos || [])]);
      setAderenciaDiaria([...(m.aderenciaDiaria || [])]);
      setAderenciaMinerioDiaria([...(m.aderenciaMinerioDiaria || [])]);
      setAderenciaTpmDiaria([...(m.aderenciaTpmDiaria || [])]);
    } else {
      setFormData({ 
        mes: '', aderencia: '', fatLocacao: '', fatMaoDeObra: '', eventuais: '', 
        impostoIrrf: '', impostoPis: '', impostoCofins: '', impostoCsll: '', impostoIss: '', impostoInss: '', impostoInssAdSat: '', 
        manutencaoPecas: '', manutencaoServicos: '', manutencaoPneus: '', 
        manutencaoLubrificacao: '', manutencaoLavador: '', manutencaoPreventiva: '', combustivelDieselS10: '', combustivelDieselS500: '', combustivelGasolina: '', 
        uniforme: '', epi: '', escritorioMaterial: '', escritorioLimpeza: '',
        custoFolha: '', custoFolhaQtd: '', horasExtras: '', horasExtrasQtd: '', folhaInss: '', folhaFgts: '', folhaIrrf: '', custoTurnover: '',
        metaImpostos: '', metaFolha: '', metaManutencao: '', metaCombustivel: '', metaSeguranca: '', metaMateriais: ''
      });
      setDescontosList([]);
      setMultasList([]);
      setNotificacoesList([]);
      setEquipamentosList([]);
    }
  }, [medicaoToEdit]);

  const addDesconto = () => setDescontosList([...descontosList, { motivo: '', valor: 0 }]);
  const updateDesconto = (index: number, field: 'motivo'|'valor', value: any) => {
    const list = [...descontosList];
    list[index] = { ...list[index], [field]: value };
    setDescontosList(list);
  };
  const removeDesconto = (index: number) => setDescontosList(descontosList.filter((_, i) => i !== index));

  const addMulta = () => setMultasList([...multasList, { motivo: '', valor: 0 }]);
  const updateMulta = (index: number, field: 'motivo'|'valor', value: any) => {
    const list = [...multasList];
    list[index] = { ...list[index], [field]: value };
    setMultasList(list);
  };
  const removeMulta = (index: number) => setMultasList(multasList.filter((_, i) => i !== index));

  const addNotificacao = () => setNotificacoesList([...notificacoesList, { motivo: '' }]);
  const updateNotificacao = (index: number, value: string) => {
    const list = [...notificacoesList];
    list[index] = { motivo: value };
    setNotificacoesList(list);
  };
  const removeNotificacao = (index: number) => setNotificacoesList(notificacoesList.filter((_, i) => i !== index));

  const addEquipamento = () => setEquipamentosList([...equipamentosList, { motivo: '', aderencia: '' }]);
  const updateEquipamento = (index: number, field: 'motivo' | 'aderencia', value: string) => {
    const list = [...equipamentosList];
    list[index] = { ...list[index], [field]: value };
    setEquipamentosList(list);
  };
  const removeEquipamento = (index: number) => setEquipamentosList(equipamentosList.filter((_, i) => i !== index));

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      // readExcelRaw retorna arrays brutos (equivalente a sheet_to_json com header:1)
      const rows = await readExcelRaw(data);
      
      const newEquipamentos = [...equipamentosList];
      const allTags = LISTA_EQUIPAMENTOS.flatMap(g => g.itens);
      let importedCount = 0;

      rows.forEach(row => {
        if (Array.isArray(row)) {
          let tagIndex = -1;
          let tagMatch = '';
          for (let i = 0; i < row.length; i++) {
            if (typeof row[i] === 'string' && allTags.includes(row[i].trim())) {
              tagIndex = i;
              tagMatch = row[i].trim();
              break;
            }
          }
          if (tagIndex !== -1 && tagIndex + 1 < row.length) {
            const val = row[tagIndex + 1];
            let aderenciaStr = '';
            if (typeof val === 'number') {
              aderenciaStr = (val * 100).toFixed(2);
            } else if (typeof val === 'string') {
              aderenciaStr = val.replace('%', '').trim();
            }
            if (!newEquipamentos.find(eq => eq.motivo === tagMatch)) {
              newEquipamentos.push({ motivo: tagMatch, aderencia: aderenciaStr.replace('.', ',') });
              importedCount++;
            }
          }
        }
      });
      
      setEquipamentosList(newEquipamentos);
      toast({ title: 'Sucesso', description: `${importedCount} equipamentos importados da planilha.`, variant: 'default' });
    } catch (err) {
      toast({ title: 'Erro na Importação', description: 'Não foi possível ler a planilha selecionada.', variant: 'destructive' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportExcelDiario = async (e: React.ChangeEvent<HTMLInputElement>, setState: (data: { dia: string; aderencia: number }[]) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const ab = await file.arrayBuffer();
      const json = await readExcelRows(ab);

      const importados: { dia: string; aderencia: number }[] = [];
      
      json.forEach((row) => {
        const diaKey = Object.keys(row).find(k => k.toLowerCase().includes('data - d') || k.toLowerCase().includes('dia'));
        const mesKey = Object.keys(row).find(k => k.toLowerCase().includes('data - m') || k.toLowerCase().includes('mês') || k.toLowerCase().includes('mes'));
        const aderenciaKey = Object.keys(row).find(k => k.toLowerCase().includes('% df') || k.toLowerCase().includes('aderencia') || k.toLowerCase().includes('aderência'));

        if (diaKey && aderenciaKey) {
          let diaFormatado = String(row[diaKey]);
          if (mesKey && row[mesKey]) {
             const mesStr = String(row[mesKey]).substring(0, 3).toLowerCase();
             diaFormatado = `${diaFormatado.padStart(2, '0')}/${mesStr}`;
          }

          let aderenciaValor = row[aderenciaKey];
          let aderenciaNum = 0;
          
          if (typeof aderenciaValor === 'string') {
            aderenciaValor = aderenciaValor.replace('%', '').replace(',', '.');
            aderenciaNum = parseFloat(aderenciaValor);
          } else if (typeof aderenciaValor === 'number') {
            if (aderenciaValor <= 1) {
              aderenciaNum = aderenciaValor * 100;
            } else {
              aderenciaNum = aderenciaValor;
            }
          }

          if (!isNaN(aderenciaNum)) {
            importados.push({
              dia: diaFormatado,
              aderencia: Number(aderenciaNum.toFixed(2))
            });
          }
        }
      });

      if (importados.length > 0) {
        setState(importados);
        toast({ title: 'Sucesso', description: `${importados.length} dias importados da planilha.` });
      } else {
        toast({ title: 'Erro de Formatação no Excel', description: 'Nenhuma linha válida foi importada. Verifique se as colunas "Dia" (ou Data - D) e "Aderência" (ou % DF) existem na sua planilha.', variant: 'destructive', duration: 8000 });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Falha ao processar o arquivo Excel.', variant: 'destructive' });
    }
    e.target.value = '';
  };

  const handleSaveMedicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mes || !formData.fatLocacao) {
      toast({ title: 'Erro', description: 'Mês e Fat. Locação são obrigatórios.', variant: 'destructive' });
      return;
    }

    const novaMedicao: Medicao = {
      id: medicaoToEdit ? medicaoToEdit.id : Date.now(),
      mes: formData.mes,
      aderencia: parseFloat(formData.aderencia) || 0,
      fatLocacao: parseFloat(formData.fatLocacao) || 0,
      fatMaoDeObra: parseFloat(formData.fatMaoDeObra) || 0,
      eventuais: parseFloat(formData.eventuais) || 0,
      impostoIrrf: parseFloat(formData.impostoIrrf) || 0,
      impostoPis: parseFloat(formData.impostoPis) || 0,
      impostoCofins: parseFloat(formData.impostoCofins) || 0,
      impostoCsll: parseFloat(formData.impostoCsll) || 0,
      impostoIss: parseFloat(formData.impostoIss) || 0,
      impostoInss: parseFloat(formData.impostoInss) || 0,
      impostoInssAdSat: parseFloat(formData.impostoInssAdSat) || 0,
      manutencaoPecas: parseFloat(formData.manutencaoPecas) || 0,
      manutencaoServicos: parseFloat(formData.manutencaoServicos) || 0,
      manutencaoPneus: parseFloat(formData.manutencaoPneus) || 0,
      manutencaoLubrificacao: parseFloat(formData.manutencaoLubrificacao) || 0,
      manutencaoLavador: parseFloat(formData.manutencaoLavador) || 0,
      manutencaoPreventiva: parseFloat(formData.manutencaoPreventiva) || 0,
      combustivelDieselS10: parseFloat(formData.combustivelDieselS10) || 0,
      combustivelDieselS500: parseFloat(formData.combustivelDieselS500) || 0,
      combustivelGasolina: parseFloat(formData.combustivelGasolina) || 0,
      uniforme: parseFloat(formData.uniforme) || 0,
      epi: parseFloat(formData.epi) || 0,
      escritorioMaterial: parseFloat(formData.escritorioMaterial) || 0,
      escritorioLimpeza: parseFloat(formData.escritorioLimpeza) || 0,
      descontos: [...descontosList],
      multas: [...multasList],
      notificacoes: [...notificacoesList],
      equipamentosPerdidos: [...equipamentosList],
      custoFolha: parseFloat(formData.custoFolha) || 0,
      custoFolhaQtd: parseInt(formData.custoFolhaQtd) || 0,
      custoTurnover: parseFloat(formData.custoTurnover) || 0,
      horasExtras: parseFloat(formData.horasExtras) || 0,
      horasExtrasQtd: parseInt(formData.horasExtrasQtd) || 0,
      metaImpostos: parseFloat(formData.metaImpostos) || 0,
      metaFolha: parseFloat(formData.metaFolha) || 0,
      metaManutencao: parseFloat(formData.metaManutencao) || 0,
      metaCombustivel: parseFloat(formData.metaCombustivel) || 0,
      metaSeguranca: parseFloat(formData.metaSeguranca) || 0,
      metaMateriais: parseFloat(formData.metaMateriais) || 0,
      
      folhaInss: parseFloat(formData.encargosInss) || 0,
      folhaFgts: parseFloat(formData.encargosFgts) || 0,
      beneficioCafeDaManha: parseFloat(formData.beneficioCafeDaManha) || 0,
      beneficioSeguroDeVida: parseFloat(formData.beneficioSeguroDeVida) || 0,
      beneficioPlanoDeSaude: parseFloat(formData.beneficioPlanoDeSaude) || 0,
      beneficioPlanoOdontologico: parseFloat(formData.beneficioPlanoOdontologico) || 0,
      beneficioTicketAlimentacao: parseFloat(formData.beneficioTicketAlimentacao) || 0,
      beneficioValeTransporte: parseFloat(formData.beneficioValeTransporte) || 0,
      beneficioMaisParaTodos: parseFloat(formData.beneficioMaisParaTodos) || 0,
      beneficioRefeicao: parseFloat(formData.beneficioRefeicao) || 0,

      folhaIrrf: parseFloat(formData.folhaIrrf) || 0,
      aderenciaDiaria,
      aderenciaMinerioDiaria,
      aderenciaTpmDiaria,
    };

    onSave(novaMedicao);
  };

  return (
    <>
            <form onSubmit={handleSaveMedicao} className="space-y-6">
              
              <div className="bg-muted/30 p-5 rounded-xl border border-border/50 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Mês de Referência</Label>
                  <Input placeholder="Ex: Mai/2026" required value={formData.mes} onChange={e => setFormData({...formData, mes: e.target.value})} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" /> Aderência SLA (%)</Label>
                  <Input type="number" step="0.1" placeholder="0.0" required value={formData.aderencia} onChange={e => setFormData({...formData, aderencia: e.target.value})} className="bg-background" />
                </div>
              </div>

              <div className="bg-success/5 p-5 rounded-xl border border-success/20">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2 text-success"><DollarSign className="w-4 h-4" /> Receitas</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Fat. Locação</Label>
                    <Input type="text" placeholder="R$ 0,00" required value={formatCurrencyInput(formData.fatLocacao)} onChange={e => setFormData({...formData, fatLocacao: parseCurrencyInput(e.target.value)})} className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Fat. Mão de Obra</Label>
                    <Input type="text" placeholder="R$ 0,00" required value={formatCurrencyInput(formData.fatMaoDeObra)} onChange={e => setFormData({...formData, fatMaoDeObra: parseCurrencyInput(e.target.value)})} className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Fat. Eventual</Label>
                    <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.eventuais)} onChange={e => setFormData({...formData, eventuais: parseCurrencyInput(e.target.value)})} className="bg-background" />
                  </div>
                </div>
              </div>

              <div className="bg-warning/10 p-5 rounded-xl border border-warning/20">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2 text-warning"><Calculator className="w-4 h-4" /> Custos de Execução</h4>
                
                <div className="space-y-5">
                  {/* Folha */}
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-warning/20 pb-1">
                      <h5 className="text-xs font-bold uppercase text-muted-foreground">Folha</h5>
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] uppercase font-bold text-primary">Meta de Custo:</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.metaFolha)} onChange={e => setFormData({...formData, metaFolha: parseCurrencyInput(e.target.value)})} className="bg-background h-6 w-28 text-xs font-bold text-primary border-primary/30" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2 border border-border/50 p-3 rounded-lg bg-muted/10">
                        <Label className="text-xs text-muted-foreground font-semibold">Folha de Pagamento</Label>
                        <div className="flex gap-2">
                          <Input type="text" placeholder="Qtd" value={formData.custoFolhaQtd} onChange={e => setFormData({...formData, custoFolhaQtd: e.target.value.replace(/\D/g, '')})} className="bg-background w-20" />
                          <Input type="text" placeholder="R$ 0,00" required value={formatCurrencyInput(formData.custoFolha)} onChange={e => setFormData({...formData, custoFolha: parseCurrencyInput(e.target.value)})} className="bg-background flex-1" />
                        </div>
                      </div>
                      <div className="space-y-2 border border-border/50 p-3 rounded-lg bg-muted/10">
                        <Label className="text-xs text-muted-foreground font-semibold">Turnover (Desligamentos)</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.custoTurnover)} onChange={e => setFormData({...formData, custoTurnover: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2 border border-border/50 p-3 rounded-lg bg-muted/10">
                        <Label className="text-xs text-muted-foreground font-semibold">Horas Extras</Label>
                        <div className="flex gap-2">
                          <Input type="text" placeholder="Qtd" value={formData.horasExtrasQtd} onChange={e => setFormData({...formData, horasExtrasQtd: e.target.value.replace(/\D/g, '')})} className="bg-background w-20" />
                          <Input type="text" placeholder="R$ 0,00" required value={formatCurrencyInput(formData.horasExtras)} onChange={e => setFormData({...formData, horasExtras: parseCurrencyInput(e.target.value)})} className="bg-background flex-1" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      
                      
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">IRRF (Folha)</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.folhaIrrf)} onChange={e => setFormData({...formData, folhaIrrf: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                    </div>
                  </div>

                  
                  {/* Encargos */}
                  <div>
                    <h5 className="text-xs font-bold uppercase text-muted-foreground mb-3 border-b border-warning/20 pb-1">Encargos</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">INSS</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.encargosInss)} onChange={e => setFormData({...formData, encargosInss: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">FGTS</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.encargosFgts)} onChange={e => setFormData({...formData, encargosFgts: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                    </div>
                  </div>

                  {/* Benefícios */}
                  <div>
                    <h5 className="text-xs font-bold uppercase text-muted-foreground mb-3 border-b border-warning/20 pb-1">Benefícios</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Café da Manhã</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioCafeDaManha)} onChange={e => setFormData({...formData, beneficioCafeDaManha: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Seguro de Vida</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioSeguroDeVida)} onChange={e => setFormData({...formData, beneficioSeguroDeVida: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Plano de Saúde</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioPlanoDeSaude)} onChange={e => setFormData({...formData, beneficioPlanoDeSaude: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Plano Odontológico</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioPlanoOdontologico)} onChange={e => setFormData({...formData, beneficioPlanoOdontologico: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Ticket Alimentação</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioTicketAlimentacao)} onChange={e => setFormData({...formData, beneficioTicketAlimentacao: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Vale Transporte</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioValeTransporte)} onChange={e => setFormData({...formData, beneficioValeTransporte: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Mais Para Todos</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioMaisParaTodos)} onChange={e => setFormData({...formData, beneficioMaisParaTodos: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Refeição</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioRefeicao)} onChange={e => setFormData({...formData, beneficioRefeicao: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                    </div>
                  </div>

                  {/* Impostos */}
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-warning/20 pb-1">
                      <h5 className="text-xs font-bold uppercase text-muted-foreground">Impostos</h5>
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] uppercase font-bold text-primary">Meta de Custo:</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.metaImpostos)} onChange={e => setFormData({...formData, metaImpostos: parseCurrencyInput(e.target.value)})} className="bg-background h-6 w-28 text-xs font-bold text-primary border-primary/30" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">PIS</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.impostoPis)} onChange={e => setFormData({...formData, impostoPis: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">COFINS</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.impostoCofins)} onChange={e => setFormData({...formData, impostoCofins: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">CSLL</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.impostoCsll)} onChange={e => setFormData({...formData, impostoCsll: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">ISS</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.impostoIss)} onChange={e => setFormData({...formData, impostoIss: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label className="text-xs text-muted-foreground font-semibold">INSS ad (SAT)</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.impostoInssAdSat)} onChange={e => setFormData({...formData, impostoInssAdSat: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                    </div>
                  </div>

                  {/* Manutenção */}
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-warning/20 pb-1">
                      <h5 className="text-xs font-bold uppercase text-muted-foreground">Manutenção</h5>
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] uppercase font-bold text-primary">Meta de Custo:</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.metaManutencao)} onChange={e => setFormData({...formData, metaManutencao: parseCurrencyInput(e.target.value)})} className="bg-background h-6 w-28 text-xs font-bold text-primary border-primary/30" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Peças</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.manutencaoPecas)} onChange={e => setFormData({...formData, manutencaoPecas: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Serviços</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.manutencaoServicos)} onChange={e => setFormData({...formData, manutencaoServicos: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Pneus</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.manutencaoPneus)} onChange={e => setFormData({...formData, manutencaoPneus: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Lubrificação</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.manutencaoLubrificacao)} onChange={e => setFormData({...formData, manutencaoLubrificacao: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Lavador</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.manutencaoLavador)} onChange={e => setFormData({...formData, manutencaoLavador: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Preventiva</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.manutencaoPreventiva)} onChange={e => setFormData({...formData, manutencaoPreventiva: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                    </div>
                  </div>

                  {/* Combustível */}
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-warning/20 pb-1">
                      <h5 className="text-xs font-bold uppercase text-muted-foreground">Combustível</h5>
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] uppercase font-bold text-primary">Meta de Custo:</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.metaCombustivel)} onChange={e => setFormData({...formData, metaCombustivel: parseCurrencyInput(e.target.value)})} className="bg-background h-6 w-28 text-xs font-bold text-primary border-primary/30" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Diesel S10</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.combustivelDieselS10)} onChange={e => setFormData({...formData, combustivelDieselS10: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Diesel S500</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.combustivelDieselS500)} onChange={e => setFormData({...formData, combustivelDieselS500: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Gasolina</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.combustivelGasolina)} onChange={e => setFormData({...formData, combustivelGasolina: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                    </div>
                  </div>

                  {/* Segurança */}
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-warning/20 pb-1">
                      <h5 className="text-xs font-bold uppercase text-muted-foreground">Segurança</h5>
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] uppercase font-bold text-primary">Meta de Custo:</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.metaSeguranca)} onChange={e => setFormData({...formData, metaSeguranca: parseCurrencyInput(e.target.value)})} className="bg-background h-6 w-28 text-xs font-bold text-primary border-primary/30" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Uniforme</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.uniforme)} onChange={e => setFormData({...formData, uniforme: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">EPI</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.epi)} onChange={e => setFormData({...formData, epi: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                    </div>
                  </div>

                  {/* Materiais */}
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-warning/20 pb-1">
                      <h5 className="text-xs font-bold uppercase text-muted-foreground">Materiais</h5>
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] uppercase font-bold text-primary">Meta de Custo:</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.metaMateriais)} onChange={e => setFormData({...formData, metaMateriais: parseCurrencyInput(e.target.value)})} className="bg-background h-6 w-28 text-xs font-bold text-primary border-primary/30" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Mat. de Escritório</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.escritorioMaterial)} onChange={e => setFormData({...formData, escritorioMaterial: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Mat. de Limpeza</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.escritorioLimpeza)} onChange={e => setFormData({...formData, escritorioLimpeza: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metas foram movidas para os cabeçalhos de cada tópico */}

              <div className="bg-destructive/5 p-5 rounded-xl border border-destructive/20 space-y-5">
                <h4 className="font-bold text-sm flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" /> Ofensores Detalhados (Deduções)</h4>
                
                {/* Glosas */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Glosas / Descontos ({descontosList.length})</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addDesconto} className="h-7 text-xs gap-1 border-destructive text-destructive hover:bg-destructive hover:text-white"><Plus className="w-3 h-3" /> Adicionar</Button>
                  </div>
                  {descontosList.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start animate-in slide-in-from-top-1">
                      <Input placeholder="Motivo do desconto..." value={item.motivo} onChange={e => updateDesconto(idx, 'motivo', e.target.value)} className="bg-background flex-1" />
                      <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(item.valor || '')} onChange={e => updateDesconto(idx, 'valor', parseFloat(parseCurrencyInput(e.target.value)) || 0)} className="bg-background w-32" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeDesconto(idx)} className="text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>

                {/* Medição de Equipamentos */}
                <div className="space-y-2 pt-2 border-t border-destructive/10">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Medição de Equipamentos ({equipamentosList.length})</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-7 text-xs gap-1 border-primary text-primary hover:bg-primary hover:text-white"><ArrowUpRight className="w-3 h-3" /> Importar Excel</Button>
                      <Button type="button" variant="outline" size="sm" onClick={addEquipamento} className="h-7 text-xs gap-1 border-destructive text-destructive hover:bg-destructive hover:text-white"><Plus className="w-3 h-3" /> Adicionar</Button>
                    </div>
                  </div>
                  {equipamentosList.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start animate-in slide-in-from-top-1">
                      <Select value={item.motivo || undefined} onValueChange={val => updateEquipamento(idx, 'motivo', val)}>
                        <SelectTrigger className="bg-background flex-1 h-9">
                          <SelectValue placeholder="Selecione o equipamento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {LISTA_EQUIPAMENTOS.map(grupo => (
                            <SelectGroup key={grupo.grupo}>
                              <SelectLabel className="bg-muted/50 text-xs font-black uppercase text-primary tracking-wider">{grupo.grupo}</SelectLabel>
                              {grupo.itens.map(eq => (
                                <SelectItem key={eq} value={eq} className="pl-6">{eq}</SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input placeholder="SLA (%)" value={item.aderencia || ''} onChange={e => updateEquipamento(idx, 'aderencia', e.target.value)} className="bg-background w-24 text-center font-medium" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeEquipamento(idx)} className="text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>

              </div>

              {/* GRÁFICOS DIÁRIOS (EXCEL) */}
              <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2 text-primary"><LineChartIcon className="w-4 h-4" /> Importação de Gráficos Diários</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2 relative">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Aderência Geral (Diária)</Label>
                    <div className="relative">
                      <Button variant="outline" className="w-full text-left justify-start border-primary/20 hover:bg-primary/5 text-primary">
                        <TrendingUp className="w-4 h-4 mr-2" /> {aderenciaDiaria.length > 0 ? `${aderenciaDiaria.length} dias importados` : 'Importar Excel Geral'}
                      </Button>
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleImportExcelDiario(e, setAderenciaDiaria)} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Aderência Minério</Label>
                    <div className="relative">
                      <Button variant="outline" className="w-full text-left justify-start border-primary/20 hover:bg-primary/5 text-primary">
                        <Briefcase className="w-4 h-4 mr-2" /> {aderenciaMinerioDiaria.length > 0 ? `${aderenciaMinerioDiaria.length} dias importados` : 'Importar Excel Minério'}
                      </Button>
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleImportExcelDiario(e, setAderenciaMinerioDiaria)} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Aderência TPM</Label>
                    <div className="relative">
                      <Button variant="outline" className="w-full text-left justify-start border-primary/20 hover:bg-primary/5 text-primary">
                        <Settings className="w-4 h-4 mr-2" /> {aderenciaTpmDiaria.length > 0 ? `${aderenciaTpmDiaria.length} dias importados` : 'Importar Excel TPM'}
                      </Button>
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => handleImportExcelDiario(e, setAderenciaTpmDiaria)} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full font-bold text-md">{medicaoToEdit ? 'Salvar Alterações' : 'Registrar Fechamento do Mês'}</Button>
            </form>
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
    </>
  );
}
