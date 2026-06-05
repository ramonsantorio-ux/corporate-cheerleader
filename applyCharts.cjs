const fs = require('fs');

const files = [
  'src/pages/Desempenho.tsx',
  'src/pages/Treinamentos.tsx',
  'src/pages/Feedbacks.tsx',
  'src/pages/Ausencias.tsx',
  'src/pages/Eventos.tsx',
  'src/components/CLevelAnalytics.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');

  if (!content.includes('ExpandableChart')) {
    // Add import statement safely
    if (content.includes("import { motion } from 'framer-motion';")) {
      content = content.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\nimport { ExpandableChart } from '@/components/ui/ExpandableChart';");
    } else if (content.includes("import * as XLSX from 'xlsx';")) {
      content = content.replace("import * as XLSX from 'xlsx';", "import * as XLSX from 'xlsx';\nimport { ExpandableChart } from '@/components/ui/ExpandableChart';");
    } else if (content.includes("import React, { useState")) {
      content = content.replace("import React, { useState", "import { ExpandableChart } from '@/components/ui/ExpandableChart';\nimport React, { useState");
    } else {
      content = "import { ExpandableChart } from '@/components/ui/ExpandableChart';\n" + content;
    }
    
    // Wrap ResponsiveContainers
    content = content.replace(/<ResponsiveContainer([^>]*)>/g, '<ExpandableChart title="Visualização Ampliada">\n<ResponsiveContainer$1>');
    content = content.replace(/<\/ResponsiveContainer>/g, '</ResponsiveContainer>\n</ExpandableChart>');
    
    fs.writeFileSync(f, content, 'utf8');
    console.log('Wrapped ' + f);
  }
});
