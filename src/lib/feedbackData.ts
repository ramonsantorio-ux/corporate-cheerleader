export type FeedbackStatus = 'novo' | 'em_analise' | 'em_andamento' | 'resolvido' | 'arquivado';
export type FeedbackPriority = 'baixa' | 'media' | 'alta' | 'critica';
export type FeedbackSetor = 'contrato_porto' | 'contrato_usina' | 'frotas' | 'medicao' | 'seguranca' | 'cco' | 'ccm' | 'manutencao' | 'rh' | 'financeiro';

export interface Feedback {
  id: string;
  titulo: string;
  descricao: string;
  setor: FeedbackSetor;
  prioridade: FeedbackPriority;
  status: FeedbackStatus;
  autor: string;
  departamento: string;
  criadoEm: string;
  atualizadoEm: string;
  votos: number;
  comentarios: number;
}

export const statusLabels: Record<FeedbackStatus, string> = {
  novo: 'Novo',
  em_analise: 'Em Análise',
  em_andamento: 'Em Andamento',
  resolvido: 'Resolvido',
  arquivado: 'Arquivado',
};

export const statusColors: Record<FeedbackStatus, string> = {
  novo: 'bg-info text-info-foreground',
  em_analise: 'bg-warning text-warning-foreground',
  em_andamento: 'bg-primary text-primary-foreground',
  resolvido: 'bg-success text-success-foreground',
  arquivado: 'bg-muted text-muted-foreground',
};

export const priorityLabels: Record<FeedbackPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const priorityColors: Record<FeedbackPriority, string> = {
  baixa: 'bg-muted text-muted-foreground',
  media: 'bg-info text-info-foreground',
  alta: 'bg-warning text-warning-foreground',
  critica: 'bg-destructive text-destructive-foreground',
};

export const setorLabels: Record<FeedbackSetor, string> = {
  contrato_porto: 'Contrato Porto',
  contrato_usina: 'Contrato Usina',
  frotas: 'Frotas',
  medicao: 'Medição',
  seguranca: 'Segurança',
  cco: 'CCO',
  ccm: 'CCM',
  manutencao: 'Manutenção',
  rh: 'RH',
  financeiro: 'Financeiro',
};

export const mockFeedbacks: Feedback[] = [
  {
    id: '1',
    titulo: 'Melhorar tempo de resposta do suporte',
    descricao: 'O tempo médio de resposta do suporte técnico está acima de 24h. Clientes estão reclamando da demora.',
    setor: 'cco',
    prioridade: 'alta',
    status: 'em_andamento',
    autor: 'Maria Silva',
    departamento: 'Customer Success',
    criadoEm: '2026-02-20',
    atualizadoEm: '2026-02-23',
    votos: 12,
    comentarios: 5,
  },
  {
    id: '2',
    titulo: 'Implementar autenticação 2FA',
    descricao: 'Necessário implementar autenticação de dois fatores para aumentar a segurança das contas corporativas.',
    setor: 'seguranca',
    prioridade: 'critica',
    status: 'em_analise',
    autor: 'Carlos Mendes',
    departamento: 'Segurança',
    criadoEm: '2026-02-18',
    atualizadoEm: '2026-02-22',
    votos: 24,
    comentarios: 8,
  },
  {
    id: '3',
    titulo: 'Novo processo de onboarding',
    descricao: 'Criar um processo de onboarding mais estruturado para novos colaboradores com materiais interativos.',
    setor: 'rh',
    prioridade: 'media',
    status: 'novo',
    autor: 'Ana Oliveira',
    departamento: 'Recursos Humanos',
    criadoEm: '2026-02-22',
    atualizadoEm: '2026-02-22',
    votos: 7,
    comentarios: 3,
  },
  {
    id: '4',
    titulo: 'Dashboard de métricas em tempo real',
    descricao: 'Disponibilizar dashboard com métricas de vendas e operações atualizadas em tempo real.',
    setor: 'contrato_porto',
    prioridade: 'alta',
    status: 'em_andamento',
    autor: 'Pedro Santos',
    departamento: 'Produto',
    criadoEm: '2026-02-15',
    atualizadoEm: '2026-02-24',
    votos: 18,
    comentarios: 11,
  },
  {
    id: '5',
    titulo: 'Reduzir etapas do fluxo de aprovação',
    descricao: 'O processo atual de aprovação de despesas possui 7 etapas. Sugestão de reduzir para no máximo 3.',
    setor: 'frotas',
    prioridade: 'media',
    status: 'resolvido',
    autor: 'Juliana Costa',
    departamento: 'Financeiro',
    criadoEm: '2026-02-10',
    atualizadoEm: '2026-02-20',
    votos: 15,
    comentarios: 6,
  },
  {
    id: '6',
    titulo: 'App mobile para equipe de campo',
    descricao: 'Equipe de vendas externa precisa de acesso mobile ao CRM com funcionalidade offline.',
    setor: 'manutencao',
    prioridade: 'alta',
    status: 'novo',
    autor: 'Roberto Lima',
    departamento: 'Vendas',
    criadoEm: '2026-02-23',
    atualizadoEm: '2026-02-23',
    votos: 9,
    comentarios: 2,
  },
  {
    id: '7',
    titulo: 'Programa de reconhecimento interno',
    descricao: 'Criar um programa de reconhecimento e premiação para colaboradores com base em feedbacks positivos.',
    setor: 'financeiro',
    prioridade: 'baixa',
    status: 'arquivado',
    autor: 'Fernanda Alves',
    departamento: 'RH',
    criadoEm: '2026-01-15',
    atualizadoEm: '2026-02-01',
    votos: 4,
    comentarios: 1,
  },
];
