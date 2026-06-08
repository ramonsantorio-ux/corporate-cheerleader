const fs = require('fs');
const content = fs.readFileSync('src/pages/Eventos.tsx', 'utf8');

// Verificando sintaxe básica ou uso de variáveis não definidas
let lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('analytics.topCids') && !l.includes('topCids')) console.log('Line', i+1, l);
});

console.log("Check finished");
