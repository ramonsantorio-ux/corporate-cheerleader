const fs = require('fs');

let evo = fs.readFileSync('src/pages/EvolucaoContrato.tsx', 'utf8');
let form = fs.readFileSync('src/components/MedicaoForm.tsx', 'utf8');

// 1. UPDATE Medicao Interface
const interfaceAdditions = `
  encargosInss?: number;
  encargosFgts?: number;
  beneficioCafeDaManha?: number;
  beneficioSeguroDeVida?: number;
  beneficioPlanoDeSaude?: number;
  beneficioPlanoOdontologico?: number;
  beneficioTicketAlimentacao?: number;
  beneficioValeTransporte?: number;
  beneficioMaisParaTodos?: number;
  beneficioRefeicao?: number;
`;
evo = evo.replace('  folhaIrrf?: number;', '  folhaIrrf?: number;' + interfaceAdditions);

// 2. UPDATE EvolucaoContrato Custos calculation
// Find where we calculate `cust` in `Detalhes da Medição`
// We will just do a Regex replace for all occurrences of (detalhesMedicao.folhaInss || 0) + (detalhesMedicao.folhaFgts || 0)
const encargosCalc = ` + (detalhesMedicao.encargosInss || detalhesMedicao.folhaInss || 0) + (detalhesMedicao.encargosFgts || detalhesMedicao.folhaFgts || 0)`;
const beneficiosCalc = ` + (detalhesMedicao.beneficioCafeDaManha || 0) + (detalhesMedicao.beneficioSeguroDeVida || 0) + (detalhesMedicao.beneficioPlanoDeSaude || 0) + (detalhesMedicao.beneficioPlanoOdontologico || 0) + (detalhesMedicao.beneficioTicketAlimentacao || 0) + (detalhesMedicao.beneficioValeTransporte || 0) + (detalhesMedicao.beneficioMaisParaTodos || 0) + (detalhesMedicao.beneficioRefeicao || 0)`;

// We have 2 occurrences of `cust = ...`
evo = evo.replace(/(\+ \(detalhesMedicao\.folhaInss \|\| 0\) \+ \(detalhesMedicao\.folhaFgts \|\| 0\))/g, encargosCalc + beneficiosCalc);

// We have `const folhaTotal = m.custoFolha + m.horasExtras + (m.folhaInss || 0) + (m.folhaFgts || 0) + (m.folhaIrrf || 0);`
evo = evo.replace(
  'const folhaTotal = m.custoFolha + m.horasExtras + (m.folhaInss || 0) + (m.folhaFgts || 0) + (m.folhaIrrf || 0);',
  'const folhaTotal = m.custoFolha + m.horasExtras + (m.folhaIrrf || 0) + (m.encargosInss || m.folhaInss || 0) + (m.encargosFgts || m.folhaFgts || 0) + (m.beneficioCafeDaManha || 0) + (m.beneficioSeguroDeVida || 0) + (m.beneficioPlanoDeSaude || 0) + (m.beneficioPlanoOdontologico || 0) + (m.beneficioTicketAlimentacao || 0) + (m.beneficioValeTransporte || 0) + (m.beneficioMaisParaTodos || 0) + (m.beneficioRefeicao || 0);'
);

// Update Details View
const encargosView = `
                          <div className="space-y-1 mt-2 border-t pt-2 border-border/50">
                            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Encargos</h4>
                            {(detalhesMedicao.encargosInss || detalhesMedicao.folhaInss) ? <div className="flex justify-between text-muted-foreground/80"><span>INSS</span><span>{formatCurrency(detalhesMedicao.encargosInss || detalhesMedicao.folhaInss || 0)}</span></div> : null}
                            {(detalhesMedicao.encargosFgts || detalhesMedicao.folhaFgts) ? <div className="flex justify-between text-muted-foreground/80"><span>FGTS</span><span>{formatCurrency(detalhesMedicao.encargosFgts || detalhesMedicao.folhaFgts || 0)}</span></div> : null}
                          </div>
`;
const beneficiosView = `
                          <div className="space-y-1 mt-2 border-t pt-2 border-border/50">
                            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Benefícios</h4>
                            {detalhesMedicao.beneficioCafeDaManha ? <div className="flex justify-between text-muted-foreground/80"><span>Café da Manhã</span><span>{formatCurrency(detalhesMedicao.beneficioCafeDaManha)}</span></div> : null}
                            {detalhesMedicao.beneficioSeguroDeVida ? <div className="flex justify-between text-muted-foreground/80"><span>Seguro de Vida</span><span>{formatCurrency(detalhesMedicao.beneficioSeguroDeVida)}</span></div> : null}
                            {detalhesMedicao.beneficioPlanoDeSaude ? <div className="flex justify-between text-muted-foreground/80"><span>Plano de Saúde</span><span>{formatCurrency(detalhesMedicao.beneficioPlanoDeSaude)}</span></div> : null}
                            {detalhesMedicao.beneficioPlanoOdontologico ? <div className="flex justify-between text-muted-foreground/80"><span>Plano Odontológico</span><span>{formatCurrency(detalhesMedicao.beneficioPlanoOdontologico)}</span></div> : null}
                            {detalhesMedicao.beneficioTicketAlimentacao ? <div className="flex justify-between text-muted-foreground/80"><span>Ticket Alimentação</span><span>{formatCurrency(detalhesMedicao.beneficioTicketAlimentacao)}</span></div> : null}
                            {detalhesMedicao.beneficioValeTransporte ? <div className="flex justify-between text-muted-foreground/80"><span>Vale Transporte</span><span>{formatCurrency(detalhesMedicao.beneficioValeTransporte)}</span></div> : null}
                            {detalhesMedicao.beneficioMaisParaTodos ? <div className="flex justify-between text-muted-foreground/80"><span>Mais Para Todos</span><span>{formatCurrency(detalhesMedicao.beneficioMaisParaTodos)}</span></div> : null}
                            {detalhesMedicao.beneficioRefeicao ? <div className="flex justify-between text-muted-foreground/80"><span>Refeição</span><span>{formatCurrency(detalhesMedicao.beneficioRefeicao)}</span></div> : null}
                          </div>
`;

evo = evo.replace('{detalhesMedicao.folhaInss ? <div className="flex justify-between text-muted-foreground/80"><span>INSS</span><span>{formatCurrency(detalhesMedicao.folhaInss)}</span></div> : null}', '');
evo = evo.replace('{detalhesMedicao.folhaFgts ? <div className="flex justify-between text-muted-foreground/80"><span>FGTS</span><span>{formatCurrency(detalhesMedicao.folhaFgts)}</span></div> : null}', '');
evo = evo.replace('{detalhesMedicao.folhaIrrf ? <div className="flex justify-between text-muted-foreground/80"><span>IRRF</span><span>{formatCurrency(detalhesMedicao.folhaIrrf)}</span></div> : null}', '{detalhesMedicao.folhaIrrf ? <div className="flex justify-between text-muted-foreground/80"><span>IRRF</span><span>{formatCurrency(detalhesMedicao.folhaIrrf)}</span></div> : null}' + encargosView + beneficiosView);

fs.writeFileSync('src/pages/EvolucaoContrato.tsx', evo, 'utf8');

// 3. UPDATE MedicaoForm states
const formStateAdditions = `
    encargosInss: '', encargosFgts: '',
    beneficioCafeDaManha: '', beneficioSeguroDeVida: '', beneficioPlanoDeSaude: '', beneficioPlanoOdontologico: '',
    beneficioTicketAlimentacao: '', beneficioValeTransporte: '', beneficioMaisParaTodos: '', beneficioRefeicao: ''
`;
form = form.replace("folhaInss: '', folhaFgts: '', folhaIrrf: ''", "folhaIrrf: ''," + formStateAdditions);

// Update setFormData in useEffect
const useEffectAdditions = `
        encargosInss: (m.encargosInss || m.folhaInss || 0).toString(),
        encargosFgts: (m.encargosFgts || m.folhaFgts || 0).toString(),
        beneficioCafeDaManha: (m.beneficioCafeDaManha || 0).toString(),
        beneficioSeguroDeVida: (m.beneficioSeguroDeVida || 0).toString(),
        beneficioPlanoDeSaude: (m.beneficioPlanoDeSaude || 0).toString(),
        beneficioPlanoOdontologico: (m.beneficioPlanoOdontologico || 0).toString(),
        beneficioTicketAlimentacao: (m.beneficioTicketAlimentacao || 0).toString(),
        beneficioValeTransporte: (m.beneficioValeTransporte || 0).toString(),
        beneficioMaisParaTodos: (m.beneficioMaisParaTodos || 0).toString(),
        beneficioRefeicao: (m.beneficioRefeicao || 0).toString(),
`;
form = form.replace("folhaInss: (m.folhaInss || 0).toString(),\n        folhaFgts: (m.folhaFgts || 0).toString(),", useEffectAdditions);

// Update onSave
const saveAdditions = `
      encargosInss: parseFloat(formData.encargosInss) || 0,
      encargosFgts: parseFloat(formData.encargosFgts) || 0,
      beneficioCafeDaManha: parseFloat(formData.beneficioCafeDaManha) || 0,
      beneficioSeguroDeVida: parseFloat(formData.beneficioSeguroDeVida) || 0,
      beneficioPlanoDeSaude: parseFloat(formData.beneficioPlanoDeSaude) || 0,
      beneficioPlanoOdontologico: parseFloat(formData.beneficioPlanoOdontologico) || 0,
      beneficioTicketAlimentacao: parseFloat(formData.beneficioTicketAlimentacao) || 0,
      beneficioValeTransporte: parseFloat(formData.beneficioValeTransporte) || 0,
      beneficioMaisParaTodos: parseFloat(formData.beneficioMaisParaTodos) || 0,
      beneficioRefeicao: parseFloat(formData.beneficioRefeicao) || 0,
`;
form = form.replace("folhaInss: parseFloat(formData.folhaInss) || 0,\n      folhaFgts: parseFloat(formData.folhaFgts) || 0,", saveAdditions);


// Update JSX UI
// Remove INSS/FGTS from Folha accordion
const oldFolhaFields = `                      <div className="space-y-2">
                        <Label>INSS</Label>
                        <Input placeholder="R$ 0,00" value={formatCurrencyInput(formData.folhaInss)} onChange={(e) => setFormData({ ...formData, folhaInss: parseCurrencyInput(e.target.value) })} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label>FGTS</Label>
                        <Input placeholder="R$ 0,00" value={formatCurrencyInput(formData.folhaFgts)} onChange={(e) => setFormData({ ...formData, folhaFgts: parseCurrencyInput(e.target.value) })} className="bg-background" />
                      </div>`;
form = form.replace(oldFolhaFields, '');

// Add Encargos and Beneficios Accordion Items
const encargosBeneficiosJSX = `
                <AccordionItem value="encargos" className="border rounded-lg bg-muted/30 px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Encargos</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>INSS</Label>
                        <Input placeholder="R$ 0,00" value={formatCurrencyInput(formData.encargosInss)} onChange={(e) => setFormData({ ...formData, encargosInss: parseCurrencyInput(e.target.value) })} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label>FGTS</Label>
                        <Input placeholder="R$ 0,00" value={formatCurrencyInput(formData.encargosFgts)} onChange={(e) => setFormData({ ...formData, encargosFgts: parseCurrencyInput(e.target.value) })} className="bg-background" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="beneficios" className="border rounded-lg bg-muted/30 px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Benefícios</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Café da Manhã</Label>
                        <Input placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioCafeDaManha)} onChange={(e) => setFormData({ ...formData, beneficioCafeDaManha: parseCurrencyInput(e.target.value) })} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label>Seguro de Vida</Label>
                        <Input placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioSeguroDeVida)} onChange={(e) => setFormData({ ...formData, beneficioSeguroDeVida: parseCurrencyInput(e.target.value) })} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label>Plano de Saúde</Label>
                        <Input placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioPlanoDeSaude)} onChange={(e) => setFormData({ ...formData, beneficioPlanoDeSaude: parseCurrencyInput(e.target.value) })} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label>Plano Odontológico</Label>
                        <Input placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioPlanoOdontologico)} onChange={(e) => setFormData({ ...formData, beneficioPlanoOdontologico: parseCurrencyInput(e.target.value) })} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label>Ticket Alimentação</Label>
                        <Input placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioTicketAlimentacao)} onChange={(e) => setFormData({ ...formData, beneficioTicketAlimentacao: parseCurrencyInput(e.target.value) })} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label>Vale Transporte</Label>
                        <Input placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioValeTransporte)} onChange={(e) => setFormData({ ...formData, beneficioValeTransporte: parseCurrencyInput(e.target.value) })} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label>Mais Para Todos</Label>
                        <Input placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioMaisParaTodos)} onChange={(e) => setFormData({ ...formData, beneficioMaisParaTodos: parseCurrencyInput(e.target.value) })} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label>Refeição</Label>
                        <Input placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioRefeicao)} onChange={(e) => setFormData({ ...formData, beneficioRefeicao: parseCurrencyInput(e.target.value) })} className="bg-background" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
`;

form = form.replace('</AccordionItem>\n\n                <AccordionItem value="impostos"', '</AccordionItem>\n\n' + encargosBeneficiosJSX + '\n                <AccordionItem value="impostos"');

fs.writeFileSync('src/components/MedicaoForm.tsx', form, 'utf8');

console.log('Done refactoring Encargos and Beneficios');
