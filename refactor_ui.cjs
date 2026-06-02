const fs = require('fs');

let form = fs.readFileSync('src/components/MedicaoForm.tsx', 'utf8');

// 1. Remove INSS and FGTS from UI (using string replacement since the structure is consistent)
const folhaInssCode = `<div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">INSS (Folha)</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.folhaInss)} onChange={e => setFormData({...formData, folhaInss: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>`;
const folhaFgtsCode = `<div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">FGTS</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.folhaFgts)} onChange={e => setFormData({...formData, folhaFgts: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>`;

form = form.replace(folhaInssCode, '');
form = form.replace(folhaFgtsCode, '');

// 2. Add Encargos and Beneficios HTML
const encargosBeneficiosJSX = `
                  {/* Encargos */}
                  <div>
                    <h5 className="text-xs font-bold uppercase text-muted-foreground mb-3 border-b border-warning/20 pb-1">Encargos</h5>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">INSS</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.encargosInss)} onChange={e => setFormData({...formData, encargosInss: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">FGTS</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.encargosFgts)} onChange={e => setFormData({...formData, encargosFgts: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                    </div>
                  </div>

                  {/* Benefícios */}
                  <div>
                    <h5 className="text-xs font-bold uppercase text-muted-foreground mb-3 border-b border-warning/20 pb-1">Benefícios</h5>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Café da Manhã</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioCafeDaManha)} onChange={e => setFormData({...formData, beneficioCafeDaManha: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Seguro de Vida</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioSeguroDeVida)} onChange={e => setFormData({...formData, beneficioSeguroDeVida: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Plano de Saúde</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioPlanoDeSaude)} onChange={e => setFormData({...formData, beneficioPlanoDeSaude: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Plano Odontológico</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioPlanoOdontologico)} onChange={e => setFormData({...formData, beneficioPlanoOdontologico: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Ticket Alimentação</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioTicketAlimentacao)} onChange={e => setFormData({...formData, beneficioTicketAlimentacao: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Vale Transporte</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioValeTransporte)} onChange={e => setFormData({...formData, beneficioValeTransporte: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Mais Para Todos</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioMaisParaTodos)} onChange={e => setFormData({...formData, beneficioMaisParaTodos: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Refeição</Label>
                        <Input type="text" placeholder="R$ 0,00" value={formatCurrencyInput(formData.beneficioRefeicao)} onChange={e => setFormData({...formData, beneficioRefeicao: parseCurrencyInput(e.target.value)})} className="bg-background" />
                      </div>
                    </div>
                  </div>
`;

form = form.replace('{/* Impostos */}', encargosBeneficiosJSX + '\n                  {/* Impostos */}');

fs.writeFileSync('src/components/MedicaoForm.tsx', form, 'utf8');

console.log('UI updated successfully!');
