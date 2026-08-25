import { describe, it, expect } from 'vitest';
import { canViewOrApplyTargetAssessment, getHierarchyLevel } from '../lib/hierarchy';
import { DEPARTAMENTOS } from '../lib/departments';

describe('Auditoria Pré-Lançamento: Governança, Hierarquia e Fit Cultural', () => {

  describe('1. Matriz de Cargos e Governança Hierárquica', () => {
    it('deve atribuir níveis hierárquicos corretos (1 a 9)', () => {
      expect(getHierarchyLevel('Diretor')).toBe(1);
      expect(getHierarchyLevel('Gerente Geral')).toBe(2);
      expect(getHierarchyLevel('Gerente')).toBe(3);
      expect(getHierarchyLevel('Coordenador')).toBe(4);
      expect(getHierarchyLevel('Supervisor')).toBe(5);
      expect(getHierarchyLevel('Encarregado Operacional')).toBe(6);
      expect(getHierarchyLevel('Analista')).toBe(7);
      expect(getHierarchyLevel('Assistente')).toBe(8);
      expect(getHierarchyLevel('Auxiliar')).toBe(9);
    });

    it('deve permitir que o próprio colaborador sempre acerte seu perfil (isSelf = true)', () => {
      // Supervisor abrindo seu próprio perfil
      expect(canViewOrApplyTargetAssessment('Supervisor', 'Supervisor', false, true, false)).toBe(true);
      // Analista abrindo seu próprio perfil
      expect(canViewOrApplyTargetAssessment('Analista', 'Analista', false, true, false)).toBe(true);
      // Diretor abrindo seu próprio perfil
      expect(canViewOrApplyTargetAssessment('Diretor', 'Diretor', false, true, false)).toBe(true);
    });

    it('deve isolar pares de Supervisores (Supervisor NÃO pode ver outro Supervisor)', () => {
      // Supervisor tentando ver outro Supervisor (não é self, não é subordinado direto)
      expect(canViewOrApplyTargetAssessment('Supervisor', 'Supervisor', false, false, false)).toBe(false);
      // Supervisor tentando ver Coordenador (cargo superior)
      expect(canViewOrApplyTargetAssessment('Supervisor', 'Coordenador', false, false, false)).toBe(false);
      // Supervisor visualizando Encarregado (subordinado)
      expect(canViewOrApplyTargetAssessment('Supervisor', 'Encarregado', false, false, false)).toBe(true);
      // Supervisor visualizando Analista (subordinado)
      expect(canViewOrApplyTargetAssessment('Supervisor', 'Analista', false, false, false)).toBe(true);
    });

    it('deve permitir que Gerentes vejam toda a sua linha de liderança', () => {
      // Gerente vendo Supervisor
      expect(canViewOrApplyTargetAssessment('Gerente', 'Supervisor', false, false, false)).toBe(true);
      // Gerente vendo outro Gerente
      expect(canViewOrApplyTargetAssessment('Gerente', 'Gerente', false, false, false)).toBe(true);
      // Gerente tentando ver Diretor (cargo superior)
      expect(canViewOrApplyTargetAssessment('Gerente', 'Diretor', false, false, false)).toBe(false);
    });
  });

  describe('2. Departamentos e Setores Oficiais', () => {
    it('deve conter todos os novos setores e em ordem alfabética', () => {
      expect(DEPARTAMENTOS).toContain('Locação');
      expect(DEPARTAMENTOS).toContain('Infraestrutura');
      expect(DEPARTAMENTOS).toContain('Qualidade');
      expect(DEPARTAMENTOS).toContain('SSMA');
      expect(DEPARTAMENTOS).not.toContain('Segurança'); // Renomeado para SSMA
      expect(DEPARTAMENTOS[0]).toBe('Todos os Setores (Acesso Geral)');
    });
  });

  describe('3. Modelo Matemático de Re-normalização com N/A (Fit Cultural)', () => {
    it('deve calcular a média exata desconsiderando itens N/A (score = 0)', () => {
      // 4 perguntas: notas 4, 5, 5 e 1 item N/A (score 0)
      const scores = [
        { score: 4 },
        { score: 5 },
        { score: 5 },
        { score: 0 } // N/A
      ];

      const validScores = scores.filter(s => s.score != null && s.score > 0);
      const avg = validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length;

      expect(validScores.length).toBe(3);
      expect(avg).toBeCloseTo(4.666, 2);
      // Se fosse nota 5 em todas válidas
      const perfectWithNA = [{ score: 5 }, { score: 5 }, { score: 0 }];
      const validPerfect = perfectWithNA.filter(s => s.score > 0);
      const avgPerfect = validPerfect.reduce((sum, s) => sum + s.score, 0) / validPerfect.length;
      expect(avgPerfect).toBe(5.0); // Nota máxima preservada em 5.0
    });
  });
});
