const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (!content.includes(".order('indicador'")) {
    // Look for the Supabase fetch query
    content = content.replace(
      /\.select\('\*'\)\s*\.eq\('setor', '([^']+)'\);/,
      ".select('*')\n        .eq('setor', '$1')\n        .order('indicador', { ascending: true });"
    );
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Patched ' + filePath);
  } else {
    console.log('Already patched ' + filePath);
  }
}

patchFile('src/components/MetasBusato.tsx');
patchFile('src/components/MetasPorto.tsx');
