import fs from 'fs';

let content = fs.readFileSync('src/pages/EvolucaoContrato.tsx', 'utf8');

content = content.replace("interface OfensorFinanceiro", "export interface OfensorFinanceiro");
content = content.replace("interface OfensorNotificacao", "export interface OfensorNotificacao");
content = content.replace("interface Medicao", "export interface Medicao");
content = content.replace("const LISTA_EQUIPAMENTOS", "export const LISTA_EQUIPAMENTOS");
content = content.replace("const formatCurrencyInput", "export const formatCurrencyInput");
content = content.replace("const parseCurrencyInput", "export const parseCurrencyInput");

const formStateStart = content.indexOf('  // Form states');
const resetFormStart = content.indexOf('  const resetForm = () => {');
const formStates = content.substring(formStateStart, resetFormStart);

const handleSaveStart = content.indexOf('  const handleSaveMedicao = (e: React.FormEvent) => {');
const formatCurrencyStart = content.indexOf('  const formatCurrency = (value: number) =>');
const handleSaveFn = content.substring(handleSaveStart, formatCurrencyStart);

const jsxFormStart = content.indexOf('            <form onSubmit={handleSaveMedicao} className="space-y-6">');
const jsxFormEnd = content.indexOf('            </form>') + 19;
const jsxForm = content.substring(jsxFormStart, jsxFormEnd);

const medicaoFormCode = `import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Target, DollarSign, Calculator, Settings, Briefcase, Plus, Minus, Trash2 } from 'lucide-react';
import { Medicao, OfensorFinanceiro, OfensorNotificacao, LISTA_EQUIPAMENTOS, formatCurrencyInput, parseCurrencyInput } from '../pages/EvolucaoContrato';

export function MedicaoForm({ medicaoToEdit, onSave, onCancel }: { medicaoToEdit: Medicao | null, onSave: (m: Medicao) => void, onCancel: () => void }) {
  const { toast } = useToast();
${formStates}
  useEffect(() => {
    if (medicaoToEdit) {
      const m = medicaoToEdit;
      setFormData({
        mes: m.mes,
        aderencia: m.aderencia.toString(),
        fatLocacao: m.fatLocacao.toString(),
        fatMaoDeObra: m.fatMaoDeObra.toString(),
        eventuais: m.eventuais.toString(),
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
        combustivelDieselS10: (m.combustivelDieselS10 || 0).toString(),
        combustivelDieselS500: (m.combustivelDieselS500 || 0).toString(),
        combustivelGasolina: (m.combustivelGasolina || 0).toString(),
        uniforme: (m.uniforme || 0).toString(),
        epi: (m.epi || 0).toString(),
        escritorioMaterial: (m.escritorioMaterial || 0).toString(),
        escritorioLimpeza: (m.escritorioLimpeza || 0).toString(),
        custoFolha: (m.custoFolha || 0).toString(),
        custoFolhaQtd: (m.custoFolhaQtd || '').toString(),
        horasExtras: (m.horasExtras || 0).toString(),
        horasExtrasQtd: (m.horasExtrasQtd || '').toString(),
        folhaInss: (m.folhaInss || 0).toString(),
        folhaFgts: (m.folhaFgts || 0).toString(),
        folhaIrrf: (m.folhaIrrf || 0).toString(),
      });
      setDescontosList([...m.descontos]);
      setMultasList([...m.multas]);
      setNotificacoesList([...m.notificacoes]);
      setEquipamentosList([...(m.equipamentosPerdidos || [])]);
    } else {
      setFormData({ 
        mes: '', aderencia: '', fatLocacao: '', fatMaoDeObra: '', eventuais: '', 
        impostoIrrf: '', impostoPis: '', impostoCofins: '', impostoCsll: '', impostoIss: '', impostoInss: '', impostoInssAdSat: '', 
        manutencaoPecas: '', manutencaoServicos: '', manutencaoPneus: '', 
        manutencaoLubrificacao: '', combustivelDieselS10: '', combustivelDieselS500: '', combustivelGasolina: '', 
        uniforme: '', epi: '', escritorioMaterial: '', escritorioLimpeza: '',
        custoFolha: '', custoFolhaQtd: '', horasExtras: '', horasExtrasQtd: '', folhaInss: '', folhaFgts: '', folhaIrrf: ''
      });
      setDescontosList([]);
      setMultasList([]);
      setNotificacoesList([]);
      setEquipamentosList([]);
    }
  }, [medicaoToEdit]);

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
      horasExtras: parseFloat(formData.horasExtras) || 0,
      horasExtrasQtd: parseInt(formData.horasExtrasQtd) || 0,
      folhaInss: parseFloat(formData.folhaInss) || 0,
      folhaFgts: parseFloat(formData.folhaFgts) || 0,
      folhaIrrf: parseFloat(formData.folhaIrrf) || 0,
    };

    onSave(novaMedicao);
  };

  return (
${jsxForm}
  );
}
`;

fs.writeFileSync('src/components/MedicaoForm.tsx', medicaoFormCode, 'utf8');

// Now clean up EvolucaoContrato.tsx
const simplifiedLogic = `
  const [medicaoToEdit, setMedicaoToEdit] = useState<Medicao | null>(null);

  const handleOpenModal = () => {
    setMedicaoToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (m: Medicao) => {
    setMedicaoToEdit(m);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta medição?')) {
      setMedicoes(medicoes.filter(m => m.id !== id));
      toast({ title: 'Excluído', description: 'Medição excluída com sucesso.' });
    }
  };

  const handleSaveMedicao = (novaMedicao: Medicao) => {
    if (medicaoToEdit) {
      setMedicoes(medicoes.map(m => m.id === medicaoToEdit.id ? novaMedicao : m));
    } else {
      setMedicoes([...medicoes, novaMedicao]);
    }
    setIsModalOpen(false);
    setMedicaoToEdit(null);
    toast({ title: 'Sucesso!', description: 'Medição salva com sucesso.' });
  };
`;

content = content.substring(0, formStateStart) + simplifiedLogic + '\n' + content.substring(formatCurrencyStart);

const newJsxCall = '            <MedicaoForm medicaoToEdit={medicaoToEdit} onSave={handleSaveMedicao} onCancel={() => setIsModalOpen(false)} />';
const newJsxFormStart = content.indexOf('            <form onSubmit={handleSaveMedicao} className="space-y-6">');
const newJsxFormEnd = content.indexOf('            </form>') + 19;

content = content.substring(0, newJsxFormStart) + newJsxCall + content.substring(newJsxFormEnd);

// Add import
content = "import { MedicaoForm } from '../components/MedicaoForm';\n" + content;

fs.writeFileSync('src/pages/EvolucaoContrato.tsx', content, 'utf8');
console.log('Done mapping.');
