const fs = require('fs');

function patch(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Remove html2canvas and export
  content = content.replace("import html2canvas from 'html2canvas';\n", "");
  content = content.replace(/const \[isExporting, setIsExporting\] = useState\(false\);\n/, "");
  content = content.replace(/const handleExport = async \(\) => \{[\s\S]*?\}\s*;\s*/, "");
  
  const exportBtnRegex = /<Button variant="outline" size="sm" onClick=\{handleExport\} disabled=\{isExporting\} data-html2canvas-ignore className="hidden sm:flex shadow-sm">[\s\S]*?<\/Button>/;
  content = content.replace(exportBtnRegex, "");

  // 2. Replace states and handlers
  const oldStates = /const \[editingId, setEditingId\] = useState<number \| null>\(null\);\s*const \[editRef, setEditRef\] = useState<string>\(''\);\s*const \[editAlc, setEditAlc\] = useState<string>\(''\);\s*const \[isSaving, setIsSaving\] = useState\(false\);/;
  
  const newStates = `const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, {ref: string, alc: string}>>({});
  const [isSaving, setIsSaving] = useState(false);`;
  
  content = content.replace(oldStates, newStates);

  const oldHandlers = /const handleEdit = \(m: any\) => \{[\s\S]*?\};\s*const handleSaveEdit = async \(id: number\) => \{[\s\S]*?\}\s*;/;
  
  const newHandlers = `const handleEditAll = () => {
    const values: Record<string, {ref: string, alc: string}> = {};
    data.metas.forEach((m: any) => {
      values[m.id] = { ref: m.ref.toString(), alc: m.alc.toString() };
    });
    setEditValues(values);
    setIsEditing(true);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updates = Object.keys(editValues).map(id => ({
        id,
        referencia: parseFloat(editValues[id].ref.replace(',', '.')),
        alcancado: parseFloat(editValues[id].alc.replace(',', '.'))
      }));
      
      await Promise.all(updates.map(u => supabase.from('indicadores_metas').update({
        referencia: u.referencia,
        alcancado: u.alcancado
      }).eq('id', u.id)));

      toast.success('Metas atualizadas!');
      setIsEditing(false);
      await fetchMetas();
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };`;
  
  content = content.replace(oldHandlers, newHandlers);

  // 3. Update TableHeader
  const oldTableHeader = /<TableHead className="text-right pr-6 font-bold">Diagnóstico<\/TableHead>/;
  const newTableHeader = `<TableHead className="text-right pr-6 font-bold">
                  {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={handleEditAll} className="h-8">
                      <Edit2 className="w-4 h-4 mr-2" /> Editar Lançamentos
                    </Button>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving} className="text-rose-600 h-8">
                        <X className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                      <Button variant="default" size="sm" onClick={handleSaveAll} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 h-8">
                        <Save className="w-4 h-4 mr-1" /> Salvar
                      </Button>
                    </div>
                  )}
                </TableHead>`;
  
  content = content.replace(oldTableHeader, newTableHeader);

  // 4. Update TableRow rendering
  const oldRowEdit = /\{editingId === m\.id \? \([\s\S]*?<\/TableCell>\s*<\/>\s*\) : \(\s*<>/;
  const newRowEdit = `{isEditing && editValues[m.id] ? (
                          <>
                            <TableCell className="text-center">
                              <Input type="number" step="0.01" className="w-20 mx-auto text-center h-8 text-xs" value={editValues[m.id].ref} onChange={e => setEditValues({...editValues, [m.id]: {...editValues[m.id], ref: e.target.value}})} />
                            </TableCell>
                            <TableCell className="text-center">
                              <Input type="number" step="0.01" className="w-24 mx-auto text-center h-8 text-xs" value={editValues[m.id].alc} onChange={e => setEditValues({...editValues, [m.id]: {...editValues[m.id], alc: e.target.value}})} />
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end">
                                <Badge className={\`shadow-sm border \${getStatusColor(m.status)}\`}>
                                  {getStatusIcon(m.status)}
                                  {m.status}
                                </Badge>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>`;
  content = content.replace(oldRowEdit, newRowEdit);

  // 5. Remove pencil icon
  const pencilIcon = /<Button\s*variant="ghost"\s*size="icon"\s*className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity absolute -right-2"\s*onClick=\{[^}]+\}\s*>\s*<Edit2 className="w-4 h-4 text-muted-foreground" \/>\s*<\/Button>/;
  content = content.replace(pencilIcon, "");
  
  // also need to replace the relative group class we added earlier? Wait, we can keep it, it does no harm.

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Patched ' + filePath);
}

patch('src/components/MetasBusato.tsx');
patch('src/components/MetasPorto.tsx');
