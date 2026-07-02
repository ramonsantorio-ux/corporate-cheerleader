/**
 * Utilitário de leitura de Excel usando ExcelJS.
 * Substitui o pacote xlsx (SheetJS Community) que tem vulnerabilidades sem correção.
 *
 * API compatível com o padrão xlsx.utils.sheet_to_json:
 * - Retorna array de objetos onde a 1ª linha é usada como cabeçalho
 * - Datas Excel (serial number) são convertidas automaticamente para string ISO "YYYY-MM-DD"
 */
import ExcelJS from 'exceljs';

export interface ExcelRow {
  [key: string]: string | number | boolean | null;
}

/**
 * Lê um ArrayBuffer de arquivo .xlsx e retorna as linhas como objetos.
 * A primeira linha é usada como cabeçalho (chaves dos objetos).
 * Datas Excel são retornadas como strings "YYYY-MM-DD".
 */
export async function readExcelRows(buffer: ArrayBuffer): Promise<ExcelRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers: string[] = [];
  const rows: ExcelRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    // row.values é 1-indexed (índice 0 é undefined)
    const values = row.values as any[];

    if (rowNumber === 1) {
      // Linha de cabeçalho
      for (let i = 1; i < values.length; i++) {
        headers.push(values[i] != null ? String(values[i]).trim() : `col_${i}`);
      }
    } else {
      const rowObj: ExcelRow = {};
      for (let i = 0; i < headers.length; i++) {
        let value = values[i + 1]; // +1 por causa do índice 1-based

        if (value instanceof Date) {
          // ExcelJS converte serial dates automaticamente para Date objects
          const y = value.getFullYear();
          const m = String(value.getMonth() + 1).padStart(2, '0');
          const d = String(value.getDate()).padStart(2, '0');
          value = `${y}-${m}-${d}`;
        } else if (value && typeof value === 'object' && 'richText' in value) {
          // Texto rico do Excel
          value = (value.richText as any[]).map((rt: any) => rt.text).join('');
        } else if (value == null) {
          value = '';
        }

        rowObj[headers[i]] = value as string | number | boolean | null;
      }
      rows.push(rowObj);
    }
  });

  return rows;
}

/**
 * Lê um ArrayBuffer de arquivo .xlsx e retorna as linhas como arrays brutos (sem converter cabeçalho).
 * Equivalente ao XLSX.utils.sheet_to_json(ws, { header: 1 }) do sheetjs.
 * Cada linha é um array com os valores de cada célula.
 * Datas Excel são retornadas como strings "YYYY-MM-DD".
 */
export async function readExcelRaw(buffer: ArrayBuffer): Promise<any[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const result: any[][] = [];

  worksheet.eachRow((row) => {
    const values = row.values as any[];
    // row.values é 1-indexed (índice 0 é undefined) — slice para remover
    const rowArr = values.slice(1).map(v => {
      if (v instanceof Date) {
        const y = v.getFullYear();
        const m = String(v.getMonth() + 1).padStart(2, '0');
        const d = String(v.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      if (v && typeof v === 'object' && 'richText' in v) {
        return (v.richText as any[]).map((rt: any) => rt.text).join('');
      }
      return v ?? '';
    });
    result.push(rowArr);
  });

  return result;
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

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Cabeçalhos a partir das chaves do primeiro objeto
  const headers = Object.keys(data[0]);
  worksheet.addRow(headers);

  // Linhas de dados
  data.forEach(row => {
    worksheet.addRow(headers.map(h => row[h] ?? ''));
  });

  // Estilos básicos para cabeçalho
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.commit();

  // Gera buffer e dispara download no browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

