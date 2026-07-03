const fs = require('fs');

const filePath = 'src/pages/EvolucaoContrato.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const regex = /<div className="flex items-center gap-2 w-full sm:w-auto">\s*<span className="text-sm font-medium text-muted-foreground whitespace-nowrap hidden sm:block">Período:<\/span>/g;

const replacement = `{!(activeTab === 'metas_busato' || activeTab === 'metas_porto') && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap hidden sm:block">Período:</span>`;

const regexEnd = /<\/Select>\s*<\/div>/g;
// I need to be careful with replace, maybe just do it manually.

const lines = content.split('\n');
let modified = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<span className="text-sm font-medium text-muted-foreground whitespace-nowrap hidden sm:block">Período:</span>')) {
        // the line before is <div className="flex items-center gap-2 w-full sm:w-auto">
        if (lines[i-1].includes('<div className="flex items-center gap-2 w-full sm:w-auto">')) {
            lines[i-1] = lines[i-1].replace('<div', "{!(activeTab === 'metas_busato' || activeTab === 'metas_porto') && (\n<div");
            // now find the closing div of this select
            let j = i;
            while (!lines[j].includes('</Select>')) j++;
            if (lines[j+1].includes('</div>')) {
                lines[j+1] = lines[j+1].replace('</div>', "</div>\n)}");
                modified = true;
            }
            break;
        }
    }
}

if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log('Successfully patched EvolucaoContrato.tsx');
} else {
    console.log('Could not find the target lines to patch in EvolucaoContrato.tsx');
}
