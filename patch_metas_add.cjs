const fs = require('fs');

function patchMetas(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    const searchStr = `                  {!isEditing ? (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={handleAddMetric} disabled={isSaving} className="h-8 text-primary border-primary hover:bg-primary/10">
                        <Plus className="w-4 h-4 mr-1" /> Adicionar Métrica
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleEditAll} className="h-8">
                        <Edit2 className="w-4 h-4 mr-2" /> Lançar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving} className="text-rose-600 h-8">
                        <X className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                      <Button variant="default" size="sm" onClick={handleSaveAll} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 h-8">
                        <Save className="w-4 h-4 mr-1" /> Salvar
                      </Button>
                    </div>
                  )}`;

    // The actual strings might differ slightly in spacing or exact classNames. Let's use regex for safety.
    const regex = /\{\!isEditing \? \([\s\S]*?Adicionar Métrica[\s\S]*?Lançar[\s\S]*?\) : \([\s\S]*?Cancelar[\s\S]*?Salvar[\s\S]*?\}\)/;
    
    const replacement = `{!isEditing ? (
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={handleEditAll} className="h-8">
                        <Edit2 className="w-4 h-4 mr-2" /> Lançar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={handleAddMetric} disabled={isSaving} className="h-8 text-primary border-primary hover:bg-primary/10">
                        <Plus className="w-4 h-4 mr-1" /> Adicionar Métrica
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving} className="text-rose-600 h-8">
                        <X className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                      <Button variant="default" size="sm" onClick={handleSaveAll} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 h-8">
                        <Save className="w-4 h-4 mr-1" /> Salvar
                      </Button>
                    </div>
                  )}`;

    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Patched', filePath);
    } else {
        console.log('Could not find the target block in', filePath);
    }
}

patchMetas('src/components/MetasBusato.tsx');
patchMetas('src/components/MetasPorto.tsx');
