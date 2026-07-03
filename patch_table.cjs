const fs = require('fs');

function patchBusato() {
  const filePath = 'src/components/MetasBusato.tsx';
  let content = fs.readFileSync(filePath, 'utf-8');

  // We need to replace the entire logic inside `metasMes.map`
  const oldMapStart = `const metasFormatadas = metasMes.map((row: any) => {`;
  const oldMapEnd = `somaAtingido += Math.min(pct, 100);

        return {
          id: row.id, setor: row.setor,
          meta: row.indicador,
          ref: row.referencia,
          alc: row.alcancado,
          status: status
        };
      });

      const atingidoMedio = metasFormatadas.length ? somaAtingido / metasFormatadas.length : 0;`;

  // We will use a regex to match the block between oldMapStart and oldMapEnd.
  const regex = /const metasFormatadas = metasMes\.map\(\(row: any\) => \{[\s\S]*?const atingidoMedio = metasFormatadas\.length \? somaAtingido \/ metasFormatadas\.length : 0;/;

  const newCode = `let totalWeight = 0;
      let weightedSum = 0;

      const metasFormatadas = metasMes.map((row: any) => {
        const indicadorNome = row.indicador || '';
        const ind = indicadorNome.toLowerCase();
        const val = row.alcancado;
        
        let status = '';
        let fillPercentage = 0;
        let weight = 0;

        if (ind.includes('aderência')) {
            weight = 40;
            if (val >= 99) { status = 'Muito Acima do Esperado'; fillPercentage = 120; }
            else if (val >= 97) { status = 'Acima do Esperado'; fillPercentage = 110; }
            else if (val >= 95) { status = 'Dentro Esperado (Aceitável)'; fillPercentage = 100; }
            else if (val >= 93) { status = 'Abaixo do Esperado'; fillPercentage = 80; }
            else { status = 'Muito Abaixo do Esperado'; fillPercentage = 50; }
        } else if (ind.includes('eventos')) {
            weight = 10;
            if (val === 0) { status = 'Muito Acima do Esperado'; fillPercentage = 120; }
            else if (val === 1) { status = 'Acima do Esperado'; fillPercentage = 110; }
            else if (val === 2) { status = 'Dentro Esperado (Aceitável)'; fillPercentage = 100; }
            else if (val === 3) { status = 'Abaixo do Esperado'; fillPercentage = 80; }
            else { status = 'Muito Abaixo do Esperado'; fillPercentage = 50; }
        } else if (ind.includes('custo')) {
            weight = 10;
            if (val < 390914.24) { status = 'Muito Acima do Esperado'; fillPercentage = 120; }
            else if (val < 412631.70) { status = 'Acima do Esperado'; fillPercentage = 110; }
            else if (val < 434349.15) { status = 'Dentro Esperado (Aceitável)'; fillPercentage = 100; }
            else if (val <= 456066.61) { status = 'Abaixo do Esperado'; fillPercentage = 80; }
            else { status = 'Muito Abaixo do Esperado'; fillPercentage = 50; }
        } else if (ind.includes('eventuais')) {
            weight = 25;
            if (val >= 99) { status = 'Muito Acima do Esperado'; fillPercentage = 120; }
            else if (val >= 97) { status = 'Acima do Esperado'; fillPercentage = 110; }
            else if (val >= 95) { status = 'Dentro Esperado (Aceitável)'; fillPercentage = 100; }
            else if (val >= 93) { status = 'Abaixo do Esperado'; fillPercentage = 80; }
            else { status = 'Muito Abaixo do Esperado'; fillPercentage = 50; }
        } else if (ind.includes('preventivas')) {
            weight = 10;
            if (val >= 99) { status = 'Muito Acima do Esperado'; fillPercentage = 120; }
            else if (val >= 97) { status = 'Acima do Esperado'; fillPercentage = 110; }
            else if (val >= 95) { status = 'Dentro Esperado (Aceitável)'; fillPercentage = 100; }
            else if (val >= 93) { status = 'Abaixo do Esperado'; fillPercentage = 80; }
            else { status = 'Muito Abaixo do Esperado'; fillPercentage = 50; }
        } else if (ind.includes('turnover')) {
            weight = 5;
            const reducao = row.referencia > 0 ? ((row.referencia - val) / row.referencia) * 100 : 0;
            if (reducao >= 20) { status = 'Muito Acima do Esperado'; fillPercentage = 120; }
            else if (reducao >= 15) { status = 'Acima do Esperado'; fillPercentage = 110; }
            else if (reducao >= 10) { status = 'Dentro Esperado (Aceitável)'; fillPercentage = 100; }
            else if (reducao >= 5) { status = 'Abaixo do Esperado'; fillPercentage = 80; }
            else { status = 'Muito Abaixo do Esperado'; fillPercentage = 50; }
        } else {
            weight = 10; // Fallback
            const isLessIsBetter = ind.includes('interdições') || ind.includes('multas') || ind.includes('notificações') || ind.includes('afastamento') || ind.includes('perda');
            if (isLessIsBetter) {
                if (val === 0) fillPercentage = 120;
                else if (row.referencia === 0) fillPercentage = val === 0 ? 120 : 50;
                else fillPercentage = (row.referencia / val) * 100;
            } else {
                if (row.referencia === 0) fillPercentage = val > 0 ? 120 : 100;
                else fillPercentage = (val / row.referencia) * 100;
            }
            if (fillPercentage >= 110) status = 'Muito Acima do Esperado';
            else if (fillPercentage >= 100) status = 'Acima do Esperado';
            else if (fillPercentage >= 90) status = 'Dentro Esperado (Aceitável)';
            else if (fillPercentage >= 70) status = 'Abaixo do Esperado';
            else status = 'Muito Abaixo do Esperado';
        }

        if (status === 'Muito Acima do Esperado' || status === 'Acima do Esperado') counts.acima++;
        else if (status === 'Dentro Esperado (Aceitável)') counts.aceitavel++;
        else counts.abaixo++;

        totalWeight += weight;
        weightedSum += Math.min(fillPercentage, 100) * weight;

        return {
          id: row.id, setor: row.setor,
          meta: row.indicador,
          ref: row.referencia,
          alc: row.alcancado,
          status: status,
          score: fillPercentage
        };
      });

      const atingidoMedio = totalWeight > 0 ? weightedSum / totalWeight : 0;`;

  if (content.match(regex)) {
    content = content.replace(regex, newCode);
    
    // We also need to update the TableBody rendering to use m.score for the bar
    // Old: const fillPercentage = Math.min((m.alc / m.ref) * 100, 100) || 0;
    // New: const fillPercentage = Math.min(m.score, 100) || 0;
    content = content.replace(/const fillPercentage = Math\.min\(\(m\.alc \/ m\.ref\) \* 100, 100\) \|\| 0;/g, 'const fillPercentage = Math.min(m.score, 100) || 0;');
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Patched ' + filePath);
  } else {
    console.log('Regex did not match in ' + filePath);
  }
}

patchBusato();
