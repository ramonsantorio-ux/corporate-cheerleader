const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
  ShadingType
} = require('docx');

async function generate() {
  const blueColor = '0085CA'; // Azul ciano do título da foto da Vale
  const employees = [
    { name: 'Adair Ribeiro', role: 'Técnico I', c1Prog: 'JAN - ABR', c1Real: '27 / 02', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Alexandre Rangel', role: 'Mecânico I', c1Prog: 'JAN - ABR', c1Real: '16 / 03', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Ana Júlia', role: 'PFP', c1Prog: '—', c1Real: '— / —', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Ariesley Araujo', role: 'Técnico Especializado', c1Prog: 'JAN - ABR', c1Real: '20 / 01', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Cleidison Alves', role: 'Técnico II', c1Prog: 'JAN - ABR', c1Real: '12 / 02', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Danielle Brito', role: 'Mecânico I', c1Prog: 'JAN - ABR', c1Real: '14 / 01', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Eduardo Patrick', role: 'Técnico Especializado', c1Prog: 'JAN - ABR', c1Real: '12 / 02', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Eliza Machado', role: 'Técnico I', c1Prog: 'JAN - ABR', c1Real: '12 / 02', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Fabbio Silva', role: 'Técnico Especializado', c1Prog: 'JAN - ABR', c1Real: '29 / 01', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Gabriel Effgen', role: 'Mecânico I', c1Prog: 'JAN - ABR', c1Real: '— / —', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Guilherme Bortoli', role: 'Técnico II', c1Prog: 'JAN - ABR', c1Real: '07 / 03', c2Prog: 'MAI - AGO', c2Real: '20 / 07', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Gustavo Batista', role: 'Técnico I', c1Prog: 'JAN - ABR', c1Real: '16 / 03', c2Prog: 'MAI - AGO', c2Real: '22 / 07', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Henrique Caniçali', role: 'Técnico I', c1Prog: 'JAN - ABR', c1Real: '28 / 01', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Lucas Andrade', role: 'Técnico de Segurança', c1Prog: 'Isento', c1Real: 'Recém-admitido', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Victoria Galvani', role: 'Mecânico I', c1Prog: 'JAN - ABR', c1Real: '', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Vinícius Ramos', role: 'Técnico I', c1Prog: 'JAN - ABR', c1Real: '', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: 'Yuri Sá', role: 'Técnico Especializado', c1Prog: 'JAN - ABR', c1Real: '', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: '[Novo Colaborador]', role: 'Cargo / Função', c1Prog: 'JAN - ABR', c1Real: '', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
    { name: '[Novo Colaborador]', role: 'Cargo / Função', c1Prog: 'JAN - ABR', c1Real: '', c2Prog: 'MAI - AGO', c2Real: '', c3Prog: 'SET / DEZ', c3Real: '' },
  ];

  // Cabeçalho da página
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: blueColor },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          // Logo / Ícone VPS
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({ text: '⚙️ VPS VALE', bold: true, size: 22, color: '007E7A' }),
                  new TextRun({ text: '\nBusato Contratos', bold: true, size: 16, color: 'B91C1C' }),
                ],
              }),
            ],
          }),
          // Título Centralizado
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Cronograma de Feedback',
                    bold: true,
                    size: 34,
                    color: blueColor,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Oficina do Porto',
                    bold: true,
                    size: 26,
                    color: blueColor,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Pilar Pessoas • Rotina de Acompanhamento Individual e PDI',
                    italics: true,
                    size: 16,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
          // Foto do Coordenador / Gestor
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Table({
                width: { size: 90, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: blueColor },
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: blueColor },
                  left: { style: BorderStyle.SINGLE, size: 6, color: blueColor },
                  right: { style: BorderStyle.SINGLE, size: 6, color: blueColor },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        shading: { fill: 'F0F9FF', type: ShadingType.CLEAR },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: 'Foto do(a)\nCoordenador(a)', size: 13, bold: true, color: '0284C7' }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Linhas da tabela principal
  const tableRows = [];

  // Linha de Cabeçalho dos Ciclos
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 26, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: 'Colaborador / Função', bold: true, size: 18, color: '0F172A' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Foto', bold: true, size: 18, color: '0F172A' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Etapa', bold: true, size: 16, color: '0F172A' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: 'E0F2FE', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: '1º Ciclo', bold: true, size: 20, color: '0369A1' })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: '(JAN — ABR)', size: 14, color: '0284C7', bold: true })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: 'FEF3C7', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: '2º Ciclo', bold: true, size: 20, color: 'B45309' })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: '(MAI — AGO)', size: 14, color: 'D97706', bold: true })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: 'DCFCE7', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: '3º Ciclo', bold: true, size: 20, color: '15803D' })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: '(SET — DEZ)', size: 14, color: '16A34A', bold: true })],
            }),
          ],
        }),
      ],
    })
  );

  // Linhas para cada funcionário
  for (const emp of employees) {
    tableRows.push(
      new TableRow({
        children: [
          // Nome e Cargo
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: emp.name, bold: true, size: 17, color: '0F172A' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: emp.role, size: 14, color: '64748B' }),
                ],
              }),
            ],
          }),
          // Caixa de Foto
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Table({
                width: { size: 85, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.DASHED, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.DASHED, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.DASHED, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.DASHED, size: 4, color: 'CBD5E1' },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: '👤', size: 16 })],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          // Rótulos Programado / Real
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: 'Prog.', bold: true, size: 14, color: '475569' })],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: 'Real', bold: true, size: 14, color: '0F172A' })],
              }),
            ],
          }),
          // 1º Ciclo
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `[ ${emp.c1Prog || 'JAN - ABR'} ]`,
                    size: 14,
                    bold: true,
                    color: '0369A1',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: emp.c1Real ? ` ${emp.c1Real} ` : ' ___ / ___ ',
                    size: 15,
                    bold: true,
                    color: emp.c1Real ? '0F172A' : '94A3B8',
                  }),
                ],
              }),
            ],
          }),
          // 2º Ciclo
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `[ ${emp.c2Prog || 'MAI - AGO'} ]`,
                    size: 14,
                    bold: true,
                    color: 'B45309',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: emp.c2Real ? ` ${emp.c2Real} ` : ' ___ / ___ ',
                    size: 15,
                    bold: true,
                    color: emp.c2Real ? '0F172A' : '94A3B8',
                  }),
                ],
              }),
            ],
          }),
          // 3º Ciclo
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `[ ${emp.c3Prog || 'SET - DEZ'} ]`,
                    size: 14,
                    bold: true,
                    color: '15803D',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: emp.c3Real ? ` ${emp.c3Real} ` : ' ___ / ___ ',
                    size: 15,
                    bold: true,
                    color: emp.c3Real ? '0F172A' : '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }

  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
      left: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
      right: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
    },
    rows: tableRows,
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 576, // 0.4 pol
              bottom: 576,
              left: 576,
              right: 576,
            },
          },
        },
        children: [
          headerTable,
          new Paragraph({ text: '', spacing: { after: 120 } }),
          mainTable,
          new Paragraph({ text: '', spacing: { after: 120 } }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({ text: 'Diretrizes VPS Vale para Feedback: ', bold: true, size: 14, color: '0F172A' }),
              new TextRun({
                text: '1. Todo colaborador deve receber feedback formal a cada ciclo. 2. Os prazos devem ser rigorosamente respeitados (Meta 100% no prazo). 3. As oportunidades de desenvolvimento identificadas devem ser convertidas em ações no PDI.',
                size: 13,
                color: '475569',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  // Caminhos de destino
  const dirDownloadsIndicadores = 'C:\\Users\\Ramon Leonard\\Downloads\\indicadores';
  const dirDownloadsProntos = 'C:\\Users\\Ramon Leonard\\Downloads\\indicadores_prontos_para_impressao';

  if (!fs.existsSync(dirDownloadsIndicadores)) {
    fs.mkdirSync(dirDownloadsIndicadores, { recursive: true });
  }
  if (!fs.existsSync(dirDownloadsProntos)) {
    fs.mkdirSync(dirDownloadsProntos, { recursive: true });
  }

  const file1 = path.join(dirDownloadsIndicadores, 'Cronograma_de_Feedback_Oficina_do_Porto_VPS.docx');
  const file2 = path.join(dirDownloadsProntos, 'Cronograma_de_Feedback_Oficina_do_Porto_VPS.docx');

  fs.writeFileSync(file1, buffer);
  fs.writeFileSync(file2, buffer);

  console.log(`Documento gerado com sucesso em:\n${file1}\n${file2}`);
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
