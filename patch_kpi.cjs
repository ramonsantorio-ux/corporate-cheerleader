const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  const oldLogic = /let fillPercentage = row\.referencia === 0 \? 100 : Math\.min\(\(row\.alcancado \/ row\.referencia\) \* 100, 150\);\s*let status = '';\s*\/\/ Logica simplificada\s*const indicadorNome = row\.indicador \|\| '';\s*const isLessIsBetter = indicadorNome\.toLowerCase\(\)\.includes\('interdições'\) \|\| indicadorNome\.toLowerCase\(\)\.includes\('custo'\);\s*if \(isLessIsBetter\) \{\s*if \(row\.alcancado === 0\) fillPercentage = 100;\s*else if \(row\.referencia > 0\) fillPercentage = Math\.max\(0, 100 - \(\(row\.alcancado \/ row\.referencia\) \* 100\)\);\s*\}/;

  const newLogic = `let fillPercentage = 0;
        let status = '';
        
        const indicadorNome = row.indicador || '';
        const ind = indicadorNome.toLowerCase();
        
        // Métricas onde "quanto menor melhor"
        const isLessIsBetter = ind.includes('turnover') || 
                               ind.includes('eventos') || 
                               ind.includes('custo') || 
                               ind.includes('interdições') ||
                               ind.includes('eventuais') ||
                               ind.includes('multas') ||
                               ind.includes('notificações') ||
                               ind.includes('afastamento') ||
                               ind.includes('perda');
        
        if (isLessIsBetter) {
            if (row.alcancado === 0) {
                fillPercentage = 150;
            } else if (row.referencia === 0) {
                fillPercentage = row.alcancado === 0 ? 150 : 0;
            } else {
                fillPercentage = (row.referencia / row.alcancado) * 100;
            }
        } else {
            if (row.referencia === 0) {
                fillPercentage = row.alcancado > 0 ? 150 : 100;
            } else {
                fillPercentage = (row.alcancado / row.referencia) * 100;
            }
        }
        
        fillPercentage = Math.min(fillPercentage, 150);`;

  if (content.match(oldLogic)) {
    content = content.replace(oldLogic, newLogic);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Patched ' + filePath);
  } else {
    console.log('Could not match logic in ' + filePath);
  }
}

patchFile('src/components/MetasBusato.tsx');
patchFile('src/components/MetasPorto.tsx');
