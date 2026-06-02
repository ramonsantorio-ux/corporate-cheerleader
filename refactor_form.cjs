const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'EvolucaoContrato.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const exportIdx = content.indexOf('export default function EvolucaoContrato() {');

const formStateStart = content.indexOf('  // Form states');
const formStateEnd = content.indexOf('  const resetForm = () => {');

const resetFormStart = formStateEnd;
const resetFormEnd = content.indexOf('  const handleOpenModal = () => {');

const handleEditStart = content.indexOf('  const handleEdit = (m: Medicao) => {');
const handleEditEnd = content.indexOf('  const handleDelete = (id: number) => {');

const handleSaveStart = content.indexOf('  const handleSaveMedicao = (e: React.FormEvent) => {');
const handleSaveEnd = content.indexOf('  const formatCurrency = (value: number) =>');

const jsxFormStart = content.indexOf('            <form onSubmit={handleSaveMedicao} className="space-y-6">');
const jsxFormEnd = content.indexOf('            </form>') + 19;

content = content.replace("interface OfensorFinanceiro", "export interface OfensorFinanceiro")
content = content.replace("interface OfensorNotificacao", "export interface OfensorNotificacao")
content = content.replace("interface Medicao", "export interface Medicao")
content = content.replace("const LISTA_EQUIPAMENTOS", "export const LISTA_EQUIPAMENTOS")
content = content.replace("const formatCurrencyInput", "export const formatCurrencyInput")
content = content.replace("const parseCurrencyInput", "export const parseCurrencyInput")

const formStates = content.substring(formStateStart, resetFormStart);
const handleSaveFn = content.substring(handleSaveStart, handleSaveEnd);
const jsxForm = content.substring(jsxFormStart, jsxFormEnd);

const fechamentoFormCode = [
  "export function FechamentoForm({ medicaoToEdit, onSave, onCancel }: { medicaoToEdit: Medicao | null, onSave: (m: Medicao) => void, onCancel: () => void }) {",
  "  const { toast } = useToast();",
  formStates,
  "  useEffect(() => {",
  "    if (medicaoToEdit) {",
  "      const m = medicaoToEdit;",
  "      setFormData({",
  "        mes: m.mes,",
  "        aderencia: m.aderencia.toString(),",
  "        fatLocacao: m.fatLocacao.toString(),",
  "        fatMaoDeObra: m.fatMaoDeObra.toString(),",
  "        eventuais: m.eventuais.toString(),",
  "        impostoIrrf: (m.impostoIrrf || 0).toString(),",
  "        impostoPis: (m.impostoPis || 0).toString(),",
  "        impostoCofins: (m.impostoCofins || 0).toString(),",
  "        impostoCsll: (m.impostoCsll || 0).toString(),",
  "        impostoIss: (m.impostoIss || 0).toString(),",
  "        impostoInss: (m.impostoInss || 0).toString(),",
  "        impostoInssAdSat: (m.impostoInssAdSat || 0).toString(),",
  "        manutencaoPecas: (m.manutencaoPecas || 0).toString(),",
  "        manutencaoServicos: (m.manutencaoServicos || 0).toString(),",
  "        manutencaoPneus: (m.manutencaoPneus || 0).toString(),",
  "        manutencaoLubrificacao: (m.manutencaoLubrificacao || 0).toString(),",
  "        combustivelDieselS10: (m.combustivelDieselS10 || 0).toString(),",
  "        combustivelDieselS500: (m.combustivelDieselS500 || 0).toString(),",
  "        combustivelGasolina: (m.combustivelGasolina || 0).toString(),",
  "        uniforme: (m.uniforme || 0).toString(),",
  "        epi: (m.epi || 0).toString(),",
  "        escritorioMaterial: (m.escritorioMaterial || 0).toString(),",
  "        escritorioLimpeza: (m.escritorioLimpeza || 0).toString(),",
  "        custoFolha: (m.custoFolha || 0).toString(),",
  "        custoFolhaQtd: (m.custoFolhaQtd || '').toString(),",
  "        horasExtras: (m.horasExtras || 0).toString(),",
  "        horasExtrasQtd: (m.horasExtrasQtd || '').toString(),",
  "        folhaInss: (m.folhaInss || 0).toString(),",
  "        folhaFgts: (m.folhaFgts || 0).toString(),",
  "        folhaIrrf: (m.folhaIrrf || 0).toString(),",
  "      });",
  "      setDescontosList([...m.descontos]);",
  "      setMultasList([...m.multas]);",
  "      setNotificacoesList([...m.notificacoes]);",
  "      setEquipamentosList([...(m.equipamentosPerdidos || [])]);",
  "    } else {",
  "      setFormData({ ",
  "        mes: '', aderencia: '', fatLocacao: '', fatMaoDeObra: '', eventuais: '', ",
  "        impostoIrrf: '', impostoPis: '', impostoCofins: '', impostoCsll: '', impostoIss: '', impostoInss: '', impostoInssAdSat: '', ",
  "        manutencaoPecas: '', manutencaoServicos: '', manutencaoPneus: '', ",
  "        manutencaoLubrificacao: '', combustivelDieselS10: '', combustivelDieselS500: '', combustivelGasolina: '', ",
  "        uniforme: '', epi: '', escritorioMaterial: '', escritorioLimpeza: '',",
  "        custoFolha: '', custoFolhaQtd: '', horasExtras: '', horasExtrasQtd: '', folhaInss: '', folhaFgts: '', folhaIrrf: ''",
  "      });",
  "      setDescontosList([]);",
  "      setMultasList([]);",
  "      setNotificacoesList([]);",
  "      setEquipamentosList([]);",
  "    }",
  "  }, [medicaoToEdit]);",
  "",
  handleSaveFn.replace("toast({", "toast({"),
  "    onSave(novaMedicao);",
  "  };",
  "",
  "  return (",
  jsxForm,
  "  );",
  "}"
].join('\\n');

const simplifiedLogic = [
  "  const [medicaoToEdit, setMedicaoToEdit] = useState<Medicao | null>(null);",
  "",
  "  const handleOpenModal = () => {",
  "    setMedicaoToEdit(null);",
  "    setIsModalOpen(true);",
  "  };",
  "",
  "  const handleEdit = (m: Medicao) => {",
  "    setMedicaoToEdit(m);",
  "    setIsModalOpen(true);",
  "  };",
  "",
  "  const handleDelete = (id: number) => {",
  "    if (confirm('Tem certeza que deseja excluir esta medição?')) {",
  "      setMedicoes(medicoes.filter(m => m.id !== id));",
  "      toast({ title: 'Excluído', description: 'Medição excluída com sucesso.' });",
  "    }",
  "  };",
  "",
  "  const handleSaveMedicao = (novaMedicao: Medicao) => {",
  "    if (medicaoToEdit) {",
  "      setMedicoes(medicoes.map(m => m.id === medicaoToEdit.id ? novaMedicao : m));",
  "    } else {",
  "      setMedicoes([...medicoes, novaMedicao]);",
  "    }",
  "    setIsModalOpen(false);",
  "    setMedicaoToEdit(null);",
  "    toast({ title: 'Sucesso!', description: 'Medição salva com sucesso.' });",
  "  };"
].join('\\n');

content = content.substring(0, formStateStart) + simplifiedLogic + "\\n" + content.substring(handleSaveEnd);

const newJsxCall = '            <FechamentoForm medicaoToEdit={medicaoToEdit} onSave={handleSaveMedicao} onCancel={() => setIsModalOpen(false)} />';

const jsxFormStartNew = content.indexOf('            <form onSubmit={handleSaveMedicao} className="space-y-6">');
const jsxFormEndNew = content.indexOf('            </form>') + 19;

content = content.substring(0, jsxFormStartNew) + newJsxCall + content.substring(jsxFormEndNew);

const newExportIdx = content.indexOf('export default function EvolucaoContrato() {');
content = content.substring(0, newExportIdx) + fechamentoFormCode + "\\n\\n" + content.substring(newExportIdx);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Refactoring complete");
