export interface HierarchyLevel {
  level: number;
  name: string;
  description: string;
}

export const HIERARQUIA_NIVEIS: readonly HierarchyLevel[] = [
  { level: 1, name: 'Diretoria', description: 'Acesso executivo total a todos os testes, relatórios e pessoas' },
  { level: 2, name: 'Gerente Geral', description: 'Acesso gerencial amplo aos setores e contratos sob gestão' },
  { level: 3, name: 'Gerente', description: 'Gestão direta do setor, aplicação e visualização de testes' },
  { level: 4, name: 'Coordenador', description: 'Coordenação operacional e acompanhamento da equipe' },
  { level: 5, name: 'Supervisor', description: 'Supervisão direta e acompanhamento de avaliações' },
  { level: 6, name: 'Encarregado', description: 'Liderança de campo e apoio à aplicação de avaliações' },
  { level: 7, name: 'Analista', description: 'Análise técnica e realização de testes' },
  { level: 8, name: 'Assistente', description: 'Suporte operacional e realização de testes' },
  { level: 9, name: 'Auxiliar', description: 'Execução operacional base' },
] as const;

/**
 * Retorna o nível hierárquico (1 a 9) a partir da string do cargo do colaborador.
 */
export function getHierarchyLevel(cargo?: string | null): number {
  if (!cargo) return 9; // Padrão Auxiliar
  const lower = cargo.toLowerCase().trim();

  if (lower.includes('diretor') || lower.includes('diretoria') || lower.includes('vp') || lower.includes('presidente')) return 1;
  if (lower.includes('gerente geral') || lower.includes('superintendente')) return 2;
  if (lower.includes('gerente') || lower.includes('manager')) return 3;
  if (lower.includes('coordenador') || lower.includes('coordenacao')) return 4;
  if (lower.includes('supervisor')) return 5;
  if (lower.includes('encarregado') || lower.includes('líder') || lower.includes('lider')) return 6;
  if (lower.includes('analista') || lower.includes('especialista') || lower.includes('engenheiro')) return 7;
  if (lower.includes('assistente')) return 8;
  if (lower.includes('auxiliar') || lower.includes('operador') || lower.includes('motorista') || lower.includes('ajudante')) return 9;

  return 7; // Padrão intermediário caso não identifique palavra-chave
}

/**
 * Retorna o nome do nível hierárquico (ex: "Gerente", "Coordenador").
 */
export function getHierarchyName(cargo?: string | null): string {
  const level = getHierarchyLevel(cargo);
  const found = HIERARQUIA_NIVEIS.find(h => h.level === level);
  return found ? found.name : 'Auxiliar';
}

/**
 * Verifica se o colaborador com este cargo tem permissão para APLICAR / SOLICITAR testes psicométricos.
 * (Liberado para Níveis 1 a 6 - Encarregados a Diretoria, além de Admins/RH).
 */
export function canApplyAssessments(cargo?: string | null, isAdminOrRh = false): boolean {
  if (isAdminOrRh) return true;
  const level = getHierarchyLevel(cargo);
  return level <= 6; // Diretoria a Encarregado
}

/**
 * Verifica se o usuário logado (com seu cargo/nível) pode visualizar ou aplicar testes em outro colaborador (targetCargo).
 * Níveis numéricos menores = hierarquia superior.
 * Para Supervisores (Nível 5) e inferiores, a regra restringe a visualização de pares do mesmo nível.
 */
export function canViewOrApplyTargetAssessment(
  userCargo?: string | null,
  targetCargo?: string | null,
  isAdminOrRh = false,
  isSelf = false,
  isDirectSubordinate = false
): boolean {
  if (isAdminOrRh || isSelf || isDirectSubordinate) return true;

  const userLevel = getHierarchyLevel(userCargo);
  const targetLevel = getHierarchyLevel(targetCargo);

  // Cargos executivos/gerenciais (Níveis 1 a 4: Diretoria, Gerente Geral, Gerente, Coordenador)
  // possuem visão gerencial ampla do setor sob sua gestão.
  if (userLevel <= 4) {
    return userLevel <= targetLevel;
  }

  // Supervisores (Nível 5), Encarregados (Nível 6) e demais cargos operacionais (7 a 9)
  // visualizam EXCLUSIVAMENTE sua equipe (cargos hierarquicamente inferiores a eles: targetLevel > userLevel)
  return userLevel < targetLevel;
}
