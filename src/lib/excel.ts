import * as XLSX from 'xlsx';

export interface ExcelRow {
  [key: string]: string | number | boolean | null;
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
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        val = `${y}-${m}-${d}`;
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
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
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
