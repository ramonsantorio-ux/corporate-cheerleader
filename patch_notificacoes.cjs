const fs = require('fs');

const filePath = 'src/pages/GestaoNotificacoes.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add imports
if (!content.includes('import PeriodFilter')) {
    const importRegex = /import { motion, AnimatePresence } from 'framer-motion';/;
    content = content.replace(importRegex, "import { motion, AnimatePresence } from 'framer-motion';\nimport PeriodFilter, { getMonthPeriod } from '@/components/filters/PeriodFilter';\nimport type { PeriodRange } from '@/components/filters/PeriodFilter';");
}

// 2. Add state
if (!content.includes('const [period, setPeriod]')) {
    const stateRegex = /const \[searchQuery, setSearchQuery\] = useState\(''\);/;
    content = content.replace(stateRegex, "const [searchQuery, setSearchQuery] = useState('');\n  const [period, setPeriod] = useState<PeriodRange>(getMonthPeriod(0));");
}

// 3. Add to UI
if (!content.includes('<PeriodFilter value={period}')) {
    const uiRegex = /<div className="flex flex-col sm:flex-row gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">\s*<div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted\/30 rounded-lg border border-border\/50">/;
    const uiReplace = `<div className="flex flex-col sm:flex-row gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
        <PeriodFilter value={period} onChange={setPeriod} className="sm:w-auto shrink-0" />
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border/50">`;
    content = content.replace(uiRegex, uiReplace);
}

// 4. Add filter logic
if (!content.includes('matchDate')) {
    const filterRegex = /const matchSearch = (.*?);\s*return matchType && matchAction && matchSearch;/s;
    const filterReplace = `const matchSearch = $1;
      const parts = n.dataStr.split('/');
      let matchDate = true;
      if (parts.length === 3) {
        const nDate = \`\${parts[2]}-\${parts[1].padStart(2,'0')}-\${parts[0].padStart(2,'0')}\`;
        matchDate = nDate >= period.start && nDate <= period.end;
      }
      return matchType && matchAction && matchSearch && matchDate;`;
    content = content.replace(filterRegex, filterReplace);
    
    // update dependency array
    const depRegex = /\}, \[notificacoes, filterType, filterAction, searchQuery\]\);/;
    content = content.replace(depRegex, "}, [notificacoes, filterType, filterAction, searchQuery, period]);");
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully patched GestaoNotificacoes.tsx');
