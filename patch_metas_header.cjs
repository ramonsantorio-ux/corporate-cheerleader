const fs = require('fs');

function patchMetas(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // 1. Rename "Editar Lançamentos" to "Lançar"
    content = content.replace(/Editar Lançamentos/g, "Lançar");

    // 2. Move "Adicionar Métrica" from !isEditing to isEditing block
    // We need to extract the button and put it in the isEditing block.
    // In !isEditing, we have:
    /*
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleAddMetric} className="h-8 text-primary border-primary/20 hover:bg-primary/10">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Métrica
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-muted-foreground hover:text-primary">
                    <Pencil className="w-4 h-4 mr-2" />
                    Lançar
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="default" size="sm" onClick={handleSaveAll} disabled={isSaving} className="h-8">
    */
    
    // Actually let's just do a string replacement on the exact header block.
    // It's easier to find the flex items-center justify-end gap-2 and replace it entirely.
    const headerRegex = /<div className="flex items-center justify-end gap-2">([\s\S]*?)<\/div>\s*<\/TableHead>/;
    
    const newHeader = `<div className="flex items-center justify-end gap-2">
              {!isEditing ? (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-muted-foreground hover:text-primary">
                  <Pencil className="w-4 h-4 mr-2" />
                  Lançar
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleAddMetric} className="h-8 text-primary border-primary/20 hover:bg-primary/10">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Métrica
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSaveAll} disabled={isSaving} className="h-8">
                    {isSaving ? 'Salvando...' : 'Salvar Tudo'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8 text-muted-foreground">
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </TableHead>`;
          
    content = content.replace(headerRegex, newHeader);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Patched', filePath);
}

patchMetas('src/components/MetasBusato.tsx');
patchMetas('src/components/MetasPorto.tsx');
