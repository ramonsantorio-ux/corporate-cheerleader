const fs = require('fs');

const replacements = [
  { file: 'src/pages/Ausencias.tsx', search: 'outerRadius={80} innerRadius={40}', replace: 'outerRadius="80%" innerRadius="50%"' },
  { file: 'src/pages/Avaliacoes.tsx', search: 'outerRadius={100} innerRadius={50}', replace: 'outerRadius="80%" innerRadius="40%"' },
  { file: 'src/pages/Avaliacoes.tsx', search: 'outerRadius={100} innerRadius={60}', replace: 'outerRadius="80%" innerRadius="50%"' },
  { file: 'src/pages/EvolucaoContrato.tsx', search: 'outerRadius={110}', replace: 'outerRadius="80%"' },
  { file: 'src/pages/EvolucaoContrato.tsx', search: 'innerRadius={120} outerRadius={180}', replace: 'innerRadius="50%" outerRadius="80%"' },
  { file: 'src/pages/Feedbacks.tsx', search: 'innerRadius={40} outerRadius={65}', replace: 'innerRadius="50%" outerRadius="80%"' },
  { file: 'src/pages/FuncionarioProfile.tsx', search: 'outerRadius={100} innerRadius={50}', replace: 'outerRadius="80%" innerRadius="40%"' },
  { file: 'src/pages/Index.tsx', search: 'innerRadius={55} outerRadius={95}', replace: 'innerRadius="50%" outerRadius="80%"' }
];

replacements.forEach(r => {
  if (fs.existsSync(r.file)) {
    let content = fs.readFileSync(r.file, 'utf8');
    // Global replacement to catch all instances
    const newContent = content.split(r.search).join(r.replace);
    if (content !== newContent) {
      fs.writeFileSync(r.file, newContent, 'utf8');
      console.log('Fixed radiuses in ' + r.file);
    }
  }
});
