export const DEPARTAMENTOS = [
  'Todos os Setores (Acesso Geral)',
  'Almoxarifado',
  'CCO',
  'CCM',
  'Contrato Porto',
  'Contrato Usina',
  'Financeiro',
  'Frotas',
  'Infraestrutura',
  'Locação',
  'Manutenção',
  'Medição',
  'Qualidade',
  'RH',
  'SSMA',
  'Suprimentos',
] as const;

export type Departamento = typeof DEPARTAMENTOS[number];

/**
 * Verifica se um valor é um departamento válido
 */
export function isValidDepartamento(value: string): value is Departamento {
  return (DEPARTAMENTOS as readonly string[]).includes(value);
}
