const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/pages/Index.tsx',
  'src/pages/Desempenho.tsx',
  'src/pages/Treinamentos.tsx',
  'src/pages/Feedbacks.tsx',
  'src/pages/Ausencias.tsx',
  'src/pages/Avaliacoes.tsx',
  'src/pages/Competencias.tsx',
  'src/pages/Eventos.tsx',
  'src/components/CLevelAnalytics.tsx',
  'src/components/ExecutiveReports.tsx',
  'src/pages/EvolucaoContrato.tsx'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Remove ALL existing <ExpandableChart ...> opening tags
  content = content.replace(/<ExpandableChart[^>]*>/g, '');
  // Remove ALL existing </ExpandableChart> closing tags
  content = content.replace(/<\/ExpandableChart>/g, '');
  
  // Now we have a clean file without ExpandableChart wrappers.
  // We re-wrap the ResponsiveContainer.
  
  // Make sure we have the import
  if (!content.includes("import { ExpandableChart }")) {
    const importStatement = "import { ExpandableChart } from '@/components/ui/ExpandableChart';\n";
    const importRegex = /^import.*?;?\s*$/gm;
    let match;
    let lastImportIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
      lastImportIndex = match.index + match[0].length;
    }
    
    if (lastImportIndex > 0) {
      content = content.substring(0, lastImportIndex) + '\n' + importStatement + content.substring(lastImportIndex);
    } else {
      content = importStatement + content;
    }
  }

  // Wrap properly
  const regex = /(<ResponsiveContainer[\s\S]*?<\/ResponsiveContainer>)/g;
  content = content.replace(regex, (match) => {
    return `<ExpandableChart title="Visualização Ampliada">\n${match}\n</ExpandableChart>`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Cleaned and Updated ${file}`);
});
