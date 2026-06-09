const fs = require('fs');
const path = 'src/pages/EvolucaoContrato.tsx';
let content = fs.readFileSync(path, 'utf8');

// The replacement tool messed up and duplicated handleEdit, handleExport etc.
// Let's find the second occurrence of `const [selectedMonthDRE` and remove everything until the second `setIsModalOpen(false); };`
// Actually, it's safer to just look at what the diff block showed:
const duplicatedStr = `  const [selectedMonthDRE, setSelectedMonthDRE] = useState<string | null>(null);
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
  };`;

// Also, the previous string replaced "excluído" with "excludo" due to encoding, so let's just use regex to remove from `const [selectedMonthDRE` up to `setIsModalOpen(false);\n  };\n`

const regex = /const \[selectedMonthDRE[\s\S]*?setIsModalOpen\(false\);\n  \};\n/;

const match = content.match(regex);
if (match) {
  // It matches the first occurrence. We want to remove the SECOND occurrence.
  // We can split and join.
  const parts = content.split(match[0]);
  if (parts.length > 2) {
    // There are multiple occurrences
    content = parts[0] + match[0] + parts.slice(1).join('').replace(match[0], '');
    console.log('Duplicatas removidas com sucesso');
  } else {
    console.log('Nenhuma duplicata encontada ou o regex não pegou a segunda');
  }
}

// Ensure CustomTooltip is inside
if (!content.includes('const CustomTooltip = ')) {
  console.log('CustomTooltip still missing?');
}

fs.writeFileSync(path, content, 'utf8');
