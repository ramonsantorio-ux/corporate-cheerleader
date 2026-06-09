const fs = require('fs');

const path = 'src/pages/Ausencias.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('TabsContent')) {
  content = content.replace(
    "import { useNavigate } from 'react-router-dom';",
    "import { useNavigate } from 'react-router-dom';\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';"
  );
}

function extractSection(startMarker, endMarkerOrNextStart) {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return '';
  const endIdx = content.indexOf(endMarkerOrNextStart, startIdx + startMarker.length);
  if (endIdx === -1) return '';
  const section = content.slice(startIdx, endIdx);
  content = content.slice(0, startIdx) + content.slice(endIdx);
  return section;
}

const metaDiaria = extractSection('{/* ═══ META DIÁRIA ═══ */}', '{/* ═══ CHARTS ROW ═══ */}');
const chartsRow = extractSection('{/* ═══ CHARTS ROW ═══ */}', '{/* ═══ PAINEL CLÍNICO - ATESTADOS (DASHBOARD VISUAL) ═══ */}');
const painelClinico = extractSection('{/* ═══ PAINEL CLÍNICO - ATESTADOS (DASHBOARD VISUAL) ═══ */}', '{/* ═══ HORAS NEGATIVAS POR COLABORADOR ═══ */}');
const horasNegativas = extractSection('{/* ═══ HORAS NEGATIVAS POR COLABORADOR ═══ */}', '{/* ═══ EXTRAS CONTROL ═══ */}');
const extrasControl = extractSection('{/* ═══ EXTRAS CONTROL ═══ */}', '{/* ═══ ADVERTÊNCIAS ═══ */}');
const advertencias = extractSection('{/* ═══ ADVERTÊNCIAS ═══ */}', '{/* ═══ VACATION OVERVIEW ═══ */}');
const vacationOverview = extractSection('{/* ═══ VACATION OVERVIEW ═══ */}', '{/* ═══ EMPLOYEE ROSTER ═══ */}');

const employeeRosterStartIdx = content.indexOf('{/* ═══ EMPLOYEE ROSTER ═══ */}');
const endOfReturnIdx = content.lastIndexOf('</div>\n  );\n}');
const employeeRosterAndTables = content.slice(employeeRosterStartIdx, endOfReturnIdx);

// Aqui está a correção. A string final remove o trecho de 'EMPLOYEE ROSTER' em diante
const beforeRoster = content.slice(0, employeeRosterStartIdx);
const afterReturn = content.slice(endOfReturnIdx);

const tabsStructure = `
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 border border-border/50 overflow-x-auto flex whitespace-nowrap hide-scrollbar">
          <TabsTrigger value="overview" className="text-xs uppercase tracking-wider">Panorama Mensal</TabsTrigger>
          <TabsTrigger value="health" className="text-xs uppercase tracking-wider">Saúde e Desvios</TabsTrigger>
          <TabsTrigger value="vacations" className="text-xs uppercase tracking-wider">Férias</TabsTrigger>
          <TabsTrigger value="history" className="text-xs uppercase tracking-wider">Histórico Completo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 outline-none">
          ${metaDiaria}
          ${chartsRow}
          ${horasNegativas}
          ${extrasControl}
        </TabsContent>

        <TabsContent value="health" className="space-y-6 outline-none">
          ${painelClinico}
          ${advertencias}
        </TabsContent>

        <TabsContent value="vacations" className="space-y-6 outline-none">
          ${vacationOverview}
        </TabsContent>

        <TabsContent value="history" className="space-y-6 outline-none">
          ${employeeRosterAndTables}
        </TabsContent>
      </Tabs>
`;

content = beforeRoster + tabsStructure + afterReturn;

fs.writeFileSync(path, content, 'utf8');
console.log('Reordering complete!');
