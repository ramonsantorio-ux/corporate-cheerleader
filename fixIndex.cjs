const fs = require('fs');

let content = fs.readFileSync('src/pages/Index.tsx', 'utf8');

if (!content.includes('ExpandableChart')) {
  content = content.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\nimport { ExpandableChart } from '@/components/ui/ExpandableChart';");
  
  content = content.replace(/<ResponsiveContainer([^>]*)>/g, '<ExpandableChart title="Visualização Ampliada">\n<ResponsiveContainer$1>');
  content = content.replace(/<\/ResponsiveContainer>/g, '</ResponsiveContainer>\n</ExpandableChart>');
  
  fs.writeFileSync('src/pages/Index.tsx', content, 'utf8');
}
