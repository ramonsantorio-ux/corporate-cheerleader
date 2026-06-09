const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/Ramon Leonard/Downloads/Planilha de acompanhamento/CONTROLE GERAL.xlsx');
console.log('Sheets:', wb.SheetNames);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
console.log(JSON.stringify(data.slice(0, 10), null, 2));
