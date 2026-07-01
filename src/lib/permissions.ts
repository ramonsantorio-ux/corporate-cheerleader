export const PAGE_GROUPS = [
  {
    module: 'Visão Geral',
    pages: [
      { key: 'dashboard', label: 'Dashboard' }
    ]
  },
  {
    module: 'Gestão de Pessoas',
    pages: [
      { key: 'colaboradores', label: 'Colaboradores' },
      { key: 'organograma', label: 'Organograma' },
      { key: 'ausencias', label: 'Ponto & Férias' },
    ]
  },
  {
    module: 'Liderança & Gestão',
    pages: [
      { key: 'desempenho', label: 'Painel do Gestor' },
    ]
  },
  {
    module: 'Talentos & Comportamento',
    pages: [
      { key: 'treinamentos', label: 'Central de Assessments' },
      { key: 'disc', label: 'Teste DISC' },
      { key: 'mbti', label: 'MBTI' },
      { key: 'bigfive', label: 'Big Five' },
    ]
  },
  {
    module: 'Operações',
    pages: [
      { key: 'eventos', label: 'SSMA' },
      { key: 'evolucao', label: 'Contratos' },
      { key: 'notificacoes', label: 'Notificações/Multas' },
    ]
  },
  {
    module: 'Sistema',
    pages: [
      { key: 'configuracoes', label: 'Configurações' },
    ]
  },
  {
    module: 'Outros Módulos',
    pages: [
      { key: 'cadastro', label: 'Cadastro' },
      { key: 'feedbacks', label: 'Feedbacks' },
      { key: 'novo_feedback', label: 'Novo Feedback' },
      { key: 'relatorios', label: 'Relatórios' },
      { key: 'reunioes', label: 'Reuniões 1:1' },
      { key: 'cco', label: 'CCO / Informações' },
    ]
  }
];

export const PAGES = PAGE_GROUPS.flatMap(g => g.pages);
