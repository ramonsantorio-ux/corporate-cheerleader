const fs = require('fs');

function patchFile(filePath, setor) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // 1. Add selectedYear state
    if (!content.includes('const [selectedYear')) {
        const stateRegex = /const \[isSaving, setIsSaving\] = useState\(false\);/;
        content = content.replace(stateRegex, "const [isSaving, setIsSaving] = useState(false);\n  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());");
    }

    // 2. Add selectedYear to fetchMetas
    const fetchMetasRegex = /\.eq\('setor', 'Busato'\)/g;
    const fetchMetasRegexPorto = /\.eq\('setor', 'Porto'\)/g;
    
    if (setor === 'Busato') {
        if (!content.includes(".eq('ano', selectedYear)")) {
            content = content.replace(fetchMetasRegex, ".eq('setor', 'Busato')\n        .eq('ano', selectedYear)");
        }
    } else {
        if (!content.includes(".eq('ano', selectedYear)")) {
            content = content.replace(fetchMetasRegexPorto, ".eq('setor', 'Porto')\n        .eq('ano', selectedYear)");
        }
    }

    // 3. Add ano to handleAddMetric
    if (content.includes('handleAddMetric')) {
        const insertRegex = /mes: selectedMonth,/;
        if (!content.includes('ano: selectedYear,')) {
            content = content.replace(insertRegex, "mes: selectedMonth,\n        ano: selectedYear,");
        }
    }

    // 4. Update useEffect dependencies
    const useEffectRegex = /useEffect\(\(\) => \{ fetchMetas\(\); \}, \[\]\);/;
    content = content.replace(useEffectRegex, "useEffect(() => { fetchMetas(); }, [selectedYear]);");

    // 5. Replace "Evolução 2026" with Select Dropdown
    const titleRegex = /<h2 className="text-sm font-bold uppercase tracking-wider">Evolução 2026<\/h2>/;
    const newTitle = `<h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                Evolução
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-[80px] h-6 text-xs font-bold bg-transparent border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </h2>`;
    content = content.replace(titleRegex, newTitle);

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Patched', filePath);
}

patchFile('src/components/MetasBusato.tsx', 'Busato');
patchFile('src/components/MetasPorto.tsx', 'Porto');
