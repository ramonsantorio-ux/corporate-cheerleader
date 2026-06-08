const xlsx = require('xlsx');

function analyzeSpreadsheet() {
  const filePath = 'C:\\Users\\Ramon Leonard\\Downloads\\Indicador Segurança\\INDICADORES-EM-SST-BUSATO TRANSPORTES...xlsm';
  try {
    const workbook = xlsx.readFile(filePath);
    console.log("Planilhas encontradas:", workbook.SheetNames);
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      console.log(`\n--- Aba: ${sheetName} ---`);
      console.log(`Total de linhas: ${data.length}`);
      
      if (data.length > 0) {
        // Encontrar a primeira linha que parece ser um cabeçalho (tem valores)
        const headerIndex = data.findIndex(row => row && row.some(cell => cell));
        if (headerIndex !== -1) {
          console.log(`Cabeçalhos (Linha ${headerIndex + 1}):`, data[headerIndex].slice(0, 10));
          // Mostrar primeira linha de dados
          if (data.length > headerIndex + 1) {
             console.log(`Exemplo de dados:`, data[headerIndex + 1].slice(0, 10));
          }
        }
      }
    });
  } catch (error) {
    console.error("Erro ao ler o arquivo:", error);
  }
}

analyzeSpreadsheet();
