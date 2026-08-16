export const DEPARTAMENTOS = [
  'Contrato Porto',
  'Contrato Usina',
  'Frotas',
  'Medição',
  'Segurança',
  'CCO',
  'CCM',
  'Manutenção',
  'RH',
  'Financeiro',
] as const;

export type Departamento = typeof DEPARTAMENTOS[number];

/**
 * Verifica se um valor é um departamento válido
 */
export function isValidDepartamento(value: string): value is Departamento {
  return (DEPARTAMENTOS as readonly string[]).includes(value);
}
