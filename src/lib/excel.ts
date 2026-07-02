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
