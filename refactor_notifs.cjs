const fs = require('fs');

let code = fs.readFileSync('src/pages/EvolucaoContrato.tsx', 'utf8');

// 1. Import getMonthForNotification
code = code.replace(
  `import { MedicaoForm } from '@/components/MedicaoForm';`,
  `import { MedicaoForm } from '@/components/MedicaoForm';\nimport { getMonthForNotification, NotificacaoGlobal } from './GestaoNotificacoes';`
);

// 2. Add state inside EvolucaoContrato
const stateRegex = /const \[searchTerm, setSearchTerm\] = useState\(''\);/;
code = code.replace(
  stateRegex,
  `const [searchTerm, setSearchTerm] = useState('');\n  const [notificacoesGlobais, setNotificacoesGlobais] = useState<NotificacaoGlobal[]>([]);\n\n  useEffect(() => {\n    const saved = localStorage.getItem('corporate_cheerleader_notificacoes_globais');\n    if (saved) setNotificacoesGlobais(JSON.parse(saved));\n  }, []);`
);

// 3. Inject the logic to override "multas" and "notificacoes" for each Medicao in chartData
const chartDataRegex = /const chartData = data\.filter\(m => m\.mes\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)\);/;
code = code.replace(
  chartDataRegex,
  `const chartData = data.filter(m => m.mes.toLowerCase().includes(searchTerm.toLowerCase())).map(m => {
    const notifsMes = notificacoesGlobais.filter(n => getMonthForNotification(n.dataStr) === m.mes);
    return {
      ...m,
      notificacoes: notifsMes.filter(n => n.tipo === 'Notificação').map(n => ({ motivo: n.motivo })),
      multas: notifsMes.filter(n => n.tipo === 'Multa').map(n => ({ motivo: n.motivo, valor: n.valorOriginal || 0 }))
    };
  });`
);

// 4. Update the "detalhesMedicao" when viewing the Modal so it also gets the overrides!
const viewDetailsRegex = /const viewDetails = \(m: Medicao\) => {([\s\S]*?)setDetalhesMedicao\(m\);\n\s*setIsDetailsOpen\(true\);\n\s*};/;
code = code.replace(
  viewDetailsRegex,
  `const viewDetails = (m: Medicao) => {
    const notifsMes = notificacoesGlobais.filter(n => getMonthForNotification(n.dataStr) === m.mes);
    const enrichedMedicao = {
      ...m,
      notificacoes: notifsMes.filter(n => n.tipo === 'Notificação').map(n => ({ motivo: n.motivo })),
      multas: notifsMes.filter(n => n.tipo === 'Multa').map(n => ({ motivo: n.motivo, valor: n.valorOriginal || 0 }))
    };
    setDetalhesMedicao(enrichedMedicao);
    setIsDetailsOpen(true);
  };`
);

fs.writeFileSync('src/pages/EvolucaoContrato.tsx', code);
console.log('EvolucaoContrato refactored!');

// --- Now remove the manual input from MedicaoForm.tsx ---
let formCode = fs.readFileSync('src/components/MedicaoForm.tsx', 'utf8');
// Replace the section of the form for Multas and Notificacoes
// To do this simply, we will just hide the UI for them, since they are read-only now.
const removeNotificacoesUI = /<div className="space-y-4 pt-4 border-t border-border\/50">([\s\S]*?)<div className="space-y-4 pt-4 border-t border-border\/50">/g;

// I'll just remove the whole block where notificacoes and multas are edited.
// Let's replace the Notificacoes block with a warning.
const notifBlockRegex = /<h3 className="text-lg font-semibold text-primary flex items-center gap-2">[\s\S]*?<FileWarning className="w-5 h-5" \/>[\s\S]*?Notificações Formais[\s\S]*?<\/h3>([\s\S]*?)<\/div>\s*<\/div>/;
formCode = formCode.replace(notifBlockRegex, `<h3 className="text-lg font-semibold text-primary flex items-center gap-2"><FileWarning className="w-5 h-5" /> Notificações Formais</h3><div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border border-border/50">As notificações e multas agora são gerenciadas na aba global "Notificações/Multas". Elas serão vinculadas automaticamente a esta medição.</div></div>`);

const multasBlockRegex = /<h3 className="text-lg font-semibold text-primary flex items-center gap-2">[\s\S]*?<Receipt className="w-5 h-5" \/>[\s\S]*?Multas Aplicadas[\s\S]*?<\/h3>([\s\S]*?)<\/div>\s*<\/div>/;
formCode = formCode.replace(multasBlockRegex, `<h3 className="text-lg font-semibold text-primary flex items-center gap-2"><Receipt className="w-5 h-5" /> Multas Aplicadas</h3><div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border border-border/50">As multas agora são gerenciadas na aba global "Notificações/Multas".</div></div>`);

fs.writeFileSync('src/components/MedicaoForm.tsx', formCode);
console.log('MedicaoForm refactored!');
