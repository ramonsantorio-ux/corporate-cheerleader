import * as XLSX from 'xlsx';

export interface ExcelRow {
  [key: string]: string | number | boolean | null;
}

/**
 * Converte de forma robusta valores de data vindos do Excel (nativos, numéricos ou strings)
 * para o formato ISO YYYY-MM-DD aceito pelo banco de dados.
 */
export function parseExcelDate(val: any): string | null {
  if (!val) return null;

  // 1. Já é um objeto Date (caso cellDates: true tenha funcionado)
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  // 2. É um número serial de data do Excel (ex: 45500)
  if (typeof val === 'number') {
    // Excel date epoch is 1900-01-01 (1 is 1900-01-01)
    const d = new Date(Math.round((val - 25569) * 864e5));
    if (isNaN(d.getTime())) return null;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // 3. É uma string (ex: '15/08/2024' ou '2024-08-15')
  if (typeof val === 'string') {
    const trimmed = val.trim();
    
    // Verifica formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.substring(0, 10);
    }
    
    // Verifica formato brasileiro comum: DD/MM/YYYY ou D/M/YY
    const parts = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (parts) {
      const d = parts[1].padStart(2, '0');
      const m = parts[2].padStart(2, '0');
      let y = parseInt(parts[3], 10);
      if (y < 100) y += 2000;
      return `${y}-${m}-${d}`;
    }
    
    // Tenta parse via Date() como fallback final
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  
  return null;
}

/**
 * Lê um ArrayBuffer de arquivo .xlsx e retorna as linhas como objetos.
 * A primeira linha é usada como cabeçalho (chaves dos objetos).
 * Datas Excel são retornadas como strings "YYYY-MM-DD".
 */
export async function readExcelRows(buffer: ArrayBuffer): Promise<ExcelRow[]> {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];

  const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { raw: true });
  
  return rawRows.map(row => {
    const newRow: ExcelRow = {};
    for (const key of Object.keys(row)) {
      let val = row[key];
      if (val instanceof Date) {
        const y = val.getFullYear();
        if (y === 1899) {
          const h = String(val.getHours()).padStart(2, '0');
          const m = String(val.getMinutes()).padStart(2, '0');
          val = `${h}:${m}`;
        } else {
          const m = String(val.getMonth() + 1).padStart(2, '0');
          const d = String(val.getDate()).padStart(2, '0');
          val = `${y}-${m}-${d}`;
        }
      }
      newRow[key] = val;
    }
    return newRow;
  });
}

/**
 * Lê um ArrayBuffer de arquivo .xlsx e retorna as linhas como arrays brutos (sem converter cabeçalho).
 * Equivalente ao XLSX.utils.sheet_to_json(ws, { header: 1 }).
 * Cada linha é um array com os valores de cada célula.
 * Datas Excel são retornadas como strings "YYYY-MM-DD".
 */
export async function readExcelRaw(buffer: ArrayBuffer): Promise<any[][]> {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];

  const result = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: true });
  
  return result.map(row => {
    return row.map(val => {
      if (val instanceof Date) {
        const y = val.getFullYear();
        if (y === 1899) {
          const h = String(val.getHours()).padStart(2, '0');
          const m = String(val.getMinutes()).padStart(2, '0');
          return `${h}:${m}`;
        } else {
          const m = String(val.getMonth() + 1).padStart(2, '0');
          const d = String(val.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      }
      return val ?? '';
    });
  });
}

/**
 * Exporta um array de objetos como arquivo .xlsx e dispara o download no browser.
 * @param data - Array de objetos onde as chaves viram cabeçalhos
 * @param filename - Nome do arquivo (ex: 'Eventos_Porto.xlsx')
 * @param sheetName - Nome da aba (padrão: 'Planilha1')
 */
export async function writeExcelFile(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = 'Planilha1'
): Promise<void> {
  if (!data.length) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, filename);
}
