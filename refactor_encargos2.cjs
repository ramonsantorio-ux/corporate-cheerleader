const fs = require('fs');

let form = fs.readFileSync('src/components/MedicaoForm.tsx', 'utf8');

// 1. Remove INSS and FGTS from UI
const inssFgtsPattern = /<div className="space-y-2">\s*<Label>INSS<\/Label>[\s\S]*?<div className="space-y-2">\s*<Label>FGTS<\/Label>[\s\S]*?<\/div>\s*<\/div>/;
form = form.replace(inssFgtsPattern, '');

// 2. Add Encargos and Beneficios Accordion Items
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

const impostosIndex = form.indexOf('<AccordionItem value="impostos"');
if (impostosIndex > -1 && form.indexOf('AccordionItem value="encargos"') === -1) {
  form = form.slice(0, impostosIndex) + encargosBeneficiosJSX + form.slice(impostosIndex);
}

fs.writeFileSync('src/components/MedicaoForm.tsx', form, 'utf8');

console.log('UI updated successfully.');
