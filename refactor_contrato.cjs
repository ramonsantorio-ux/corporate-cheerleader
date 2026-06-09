const fs = require('fs');
const path = 'src/pages/EvolucaoContrato.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace the first medicoes.length > 0 ? (
const chartsStartRegex = /\{\/\* CHARTS SECTION \*\/\}\s*\{medicoes\.length > 0 \? \(\s*<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">/;
const tabsHeader = `{/* CHARTS SECTION */}
      {medicoes.length > 0 ? (
        <Tabs defaultValue="visao_executiva" className="w-full mt-6 space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl inline-flex w-full overflow-x-auto justify-start sm:justify-center border border-border/50">
            <TabsTrigger value="visao_executiva" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><Target className="w-4 h-4 mr-2" />Visão Executiva</TabsTrigger>
            <TabsTrigger value="custos_metas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><TrendingDown className="w-4 h-4 mr-2" />Custos e Metas</TabsTrigger>
            <TabsTrigger value="dre" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2 transition-all font-medium whitespace-nowrap"><DollarSign className="w-4 h-4 mr-2" />DRE Detalhada</TabsTrigger>
          </TabsList>

          <TabsContent value="visao_executiva" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">`;
if(chartsStartRegex.test(content)) {
    content = content.replace(chartsStartRegex, tabsHeader);
    console.log("Matched 1");
}

// 2. Remove the first closure of the ternary operator
const endOfFirstSectionRegex = /<\/div>\s*\)\s*:\s*\(\s*<div className="text-center p-12 border-2 border-dashed border-border rounded-xl">\s*<p className="text-muted-foreground">Nenhuma medi[^<]+<\/p>\s*<\/div>\s*\)\}/;
const replaceEndOfFirstSection = `        </div>
          </TabsContent>`;
if(endOfFirstSectionRegex.test(content)) {
    content = content.replace(endOfFirstSectionRegex, replaceEndOfFirstSection);
    console.log("Matched 2");
}

// 3. Right before Acompanhamento de Metas
const metasStartRegex = /\{\/\* ACOMPANHAMENTO DE METAS \*\/\}/;
const metasStartReplacement = `          <TabsContent value="custos_metas" className="space-y-6 mt-4">
      {/* ACOMPANHAMENTO DE METAS */}`;
if(metasStartRegex.test(content)) {
    content = content.replace(metasStartRegex, metasStartReplacement);
    console.log("Matched 3");
}

// 4. Right before DATA TABLE
const histRegex = /\{\/\* DATA TABLE \*\/\}/;
const histReplacement = `          </TabsContent>

          <TabsContent value="dre" className="space-y-6 mt-4">
      {/* DATA TABLE */}`;
if(histRegex.test(content)) {
    content = content.replace(histRegex, histReplacement);
    console.log("Matched 4");
}

// 5. At the very end of the page, close the main ternary
const closingRegex = /\{\/\* DRAWER DETALHES DE OFENSORES \*\/\}/;
const closingReplacement = `          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center p-12 border-2 border-dashed border-border rounded-xl">
          <p className="text-muted-foreground">Nenhuma medição registrada.</p>
        </div>
      )}

      {/* DRAWER DETALHES DE OFENSORES */}`;
if(closingRegex.test(content)) {
    content = content.replace(closingRegex, closingReplacement);
    console.log("Matched 5");
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');
