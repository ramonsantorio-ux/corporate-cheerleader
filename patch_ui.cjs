const fs = require('fs');

function patchMetasBusato() {
  const filePath = 'src/components/MetasBusato.tsx';
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Add Trash2 and Plus to lucide-react imports
  const importLucideRegex = /import \{ Edit2, Save, X \} from 'lucide-react';/;
  content = content.replace(importLucideRegex, "import { Edit2, Save, X, Trash2, Plus } from 'lucide-react';");

  // 2. Add handlers inside the component, right before handleEditAll
  const handleEditAllRegex = /const handleEditAll = \(\) => \{/;
  const handlersCode = `const handleDeleteMetric = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta métrica?')) return;
    try {
      setIsSaving(true);
      const { error } = await supabase.from('indicadores_metas').delete().eq('id', id);
      if (error) throw error;
      toast.success('Métrica excluída!');
      fetchMetas();
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMetric = async () => {
    const nome = window.prompt('Nome da nova métrica (ex: ISO 9001):');
    if (!nome) return;
    try {
      setIsSaving(true);
      const { error } = await supabase.from('indicadores_metas').insert({
        indicador: nome,
        setor: 'Busato',
        mes: selectedMonth,
        referencia: 0,
        alcancado: 0
      });
      if (error) throw error;
      toast.success('Métrica adicionada com sucesso!');
      fetchMetas();
    } catch (err: any) {
      toast.error('Erro ao adicionar métrica: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAll = () => {`;
  content = content.replace(handleEditAllRegex, handlersCode);

  // 3. Add Adicionar Métrica button next to Editar
  const headerButtonsRegex = /\{\!isEditing \? \([\s\S]*?<Button variant="ghost" size="sm" onClick=\{handleEditAll\} className="h-8">[\s\S]*?<Edit2 className="w-4 h-4 mr-2" \/> Editar Lançamentos[\s\S]*?<\/Button>[\s\S]*?\) : \(/;
  const newHeaderButtons = `{!isEditing ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleAddMetric} disabled={isSaving} className="h-8 text-primary border-primary hover:bg-primary/10">
                        <Plus className="w-4 h-4 mr-1" /> Adicionar Métrica
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleEditAll} className="h-8">
                        <Edit2 className="w-4 h-4 mr-2" /> Editar Lançamentos
                      </Button>
                    </div>
                  ) : (`;
  if (content.match(headerButtonsRegex)) {
    content = content.replace(headerButtonsRegex, newHeaderButtons);
  } else {
    console.log("Could not match headerButtonsRegex");
  }

  // 4. Add Excluir button next to the Badge inside the table row when editing
  const editingRowRegex = /<TableCell className="text-right pr-6">[\s\S]*?<div className="flex justify-end">[\s\S]*?<Badge className=\{`shadow-sm border \$\{getStatusColor\(m\.status\)\}`\}>[\s\S]*?\{getStatusIcon\(m\.status\)\}[\s\S]*?\{m\.status\}[\s\S]*?<\/Badge>[\s\S]*?<\/div>[\s\S]*?<\/TableCell>/;
  
  const newEditingRow = `<TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-2 items-center">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => handleDeleteMetric(m.id)} title="Excluir Métrica">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Badge className={\`shadow-sm border \${getStatusColor(m.status)}\`}>
                                  {getStatusIcon(m.status)}
                                  {m.status}
                                </Badge>
                              </div>
                            </TableCell>`;
  if (content.match(editingRowRegex)) {
      content = content.replace(editingRowRegex, newEditingRow);
  } else {
      console.log("Could not match editingRowRegex");
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Patched UI elements in MetasBusato');
}

patchMetasBusato();
