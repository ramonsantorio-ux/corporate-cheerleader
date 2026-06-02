import os

filepath = r"src\pages\EvolucaoContrato.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Export types and constants
content = content.replace("interface OfensorFinanceiro", "export interface OfensorFinanceiro")
content = content.replace("interface OfensorNotificacao", "export interface OfensorNotificacao")
content = content.replace("interface Medicao", "export interface Medicao")
content = content.replace("const LISTA_EQUIPAMENTOS", "export const LISTA_EQUIPAMENTOS")
content = content.replace("const formatCurrencyInput", "export const formatCurrencyInput")
content = content.replace("const parseCurrencyInput", "export const parseCurrencyInput")

# Find markers
form_state_start = content.find("  // Form states")
reset_form_start = content.find("  const resetForm = () => {")
handle_open_modal = content.find("  const handleOpenModal = () => {")
handle_edit_start = content.find("  const handleEdit = (m: Medicao) => {")
handle_delete_start = content.find("  const handleDelete = (id: number) => {")
handle_save_start = content.find("  const handleSaveMedicao = (e: React.FormEvent) => {")
format_currency_start = content.find("  const formatCurrency = (value: number) =>")
jsx_form_start = content.find('            <form onSubmit={handleSaveMedicao} className="space-y-6">')
jsx_form_end = content.find('            </form>') + 19

# Extract parts
form_states = content[form_state_start:reset_form_start]
handle_save_fn = content[handle_save_start:format_currency_start]
jsx_form = content[jsx_form_start:jsx_form_end]

# Create FechamentoForm
fechamento_form_code = f"""
export function FechamentoForm({{ medicaoToEdit, onSave, onCancel }}: {{ medicaoToEdit: Medicao | null, onSave: (m: Medicao) => void, onCancel: () => void }}) {{
  const {{ toast }} = useToast();
  
{form_states}
  useEffect(() => {{
    if (medicaoToEdit) {{
      const m = medicaoToEdit;
      setFormData({{
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
      }});
      setDescontosList([...m.descontos]);
      setMultasList([...m.multas]);
      setNotificacoesList([...m.notificacoes]);
      setEquipamentosList([...(m.equipamentosPerdidos || [])]);
    }} else {{
      setFormData({{ 
        mes: '', aderencia: '', fatLocacao: '', fatMaoDeObra: '', eventuais: '', 
        impostoIrrf: '', impostoPis: '', impostoCofins: '', impostoCsll: '', impostoIss: '', impostoInss: '', impostoInssAdSat: '', 
        manutencaoPecas: '', manutencaoServicos: '', manutencaoPneus: '', 
        manutencaoLubrificacao: '', combustivelDieselS10: '', combustivelDieselS500: '', combustivelGasolina: '', 
        uniforme: '', epi: '', escritorioMaterial: '', escritorioLimpeza: '',
        custoFolha: '', custoFolhaQtd: '', horasExtras: '', horasExtrasQtd: '', folhaInss: '', folhaFgts: '', folhaIrrf: ''
      }});
      setDescontosList([]);
      setMultasList([]);
      setNotificacoesList([]);
      setEquipamentosList([]);
    }}
  }}, [medicaoToEdit]);

  const handleSaveMedicao = (e: React.FormEvent) => {{
    e.preventDefault();
    if (!formData.mes || !formData.fatLocacao) {{
      toast({{ title: 'Erro', description: 'Mês e Fat. Locação são obrigatórios.', variant: 'destructive' }});
      return;
    }}
    const novaMedicao: Medicao = {{
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
    }};
    onSave(novaMedicao);
  }};

  return (
{jsx_form}
  );
}}
"""

simplified_logic = """
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
      toast({ title: "Excluído", description: "Medição excluída com sucesso." });
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
    toast({ title: "Sucesso!", description: "Medição salva com sucesso." });
  };
"""

# Apply modifications
content = content[:form_state_start] + simplified_logic + content[format_currency_start:]

new_jsx_call = '            <FechamentoForm medicaoToEdit={medicaoToEdit} onSave={handleSaveMedicao} onCancel={() => setIsModalOpen(false)} />'

# Now find the jsx_form again because offsets changed
jsx_form_start_new = content.find('            <form onSubmit={handleSaveMedicao} className="space-y-6">')
jsx_form_end_new = content.find('            </form>') + 19
content = content[:jsx_form_start_new] + new_jsx_call + content[jsx_form_end_new:]

# Inject FechamentoForm right before EvolucaoContrato
new_export_idx = content.find("export default function EvolucaoContrato() {")
content = content[:new_export_idx] + fechamento_form_code + "\n\n" + content[new_export_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactoring via Python complete")
