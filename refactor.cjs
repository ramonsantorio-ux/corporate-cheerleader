const fs = require('fs');
const path = 'src/pages/EvolucaoContrato.tsx';
let code = fs.readFileSync(path, 'utf8');

const returnIdx = code.indexOf('  return (\n    <div className="p-4 md:p-8');
const beforeReturn = code.substring(0, returnIdx);
const afterReturn = code.substring(returnIdx);

const kpiStart = afterReturn.indexOf('      {/* KPI TOP CARDS */}');
const sheetEnd = afterReturn.indexOf('      </Sheet>') + 14;

const dashboardJSX = afterReturn.substring(kpiStart, sheetEnd);

const newAfterReturn = afterReturn.substring(0, kpiStart) + '      {dashboardContent}\n' + afterReturn.substring(sheetEnd);

const memoBlock = `
  const dashboardContent = useMemo(() => (
    <>
${dashboardJSX}
    </>
  ), [medicoes, lastMonth, chartData, expandedRow, isDrawerOpen, detalhesMedicao, hiddenCards, prevMonth]);

`;

fs.writeFileSync(path, beforeReturn + memoBlock + newAfterReturn);
console.log('Done!');
