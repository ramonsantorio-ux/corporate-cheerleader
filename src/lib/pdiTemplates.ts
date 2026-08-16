export interface PdiActionSuggestion {
  title: string;
  category: '70_experience' | '20_exposure' | '10_education';
  description: string;
  suggestedDays: number;
}

export interface PdiCompetencyTrack {
  id: string;
  name: string;
  description: string;
  iconName: string;
  actions: PdiActionSuggestion[];
}

export const PDI_COMPETENCY_TRACKS: PdiCompetencyTrack[] = [
  {
    id: 'lideranca_operacional',
    name: 'Liderança & Gestão de Equipes',
    description: 'Desenvolvimento de competências para liderar pessoas, delegar tarefas e conduzir reuniões operacionais.',
    iconName: 'Users',
    actions: [
      {
        title: 'Conduzir 8 reuniões de DDS (Diálogo Diário de Segurança) em campo',
        category: '70_experience',
        description: 'Liderar as reuniões diárias com a equipe de campo com foco em metas e prevenção.',
        suggestedDays: 30
      },
      {
        title: 'Liderar projeto de melhoria contínua de rotina da equipe',
        category: '70_experience',
        description: 'Mapear um gargalo operacional na frente de trabalho e aplicar plano de ação 5W2H.',
        suggestedDays: 60
      },
      {
        title: 'Mentoria quinzenal com Gerente/Coordenador Operacional',
        category: '20_exposure',
        description: 'Realizar 4 sessões de alinhamento estratégico sobre tomada de decisão sob pressão.',
        suggestedDays: 60
      },
      {
        title: 'Shadowing (acompanhamento) de encarregado sênior em outra base',
        category: '20_exposure',
        description: 'Passar 2 dias acompanhando a rotina e resolução de conflitos de um líder experiente.',
        suggestedDays: 45
      },
      {
        title: 'Curso: Liderança Situacional e Gestão de Pessoas',
        category: '10_education',
        description: 'Concluir treinamento corporativo sobre feedback assertivo e delegação eficaz.',
        suggestedDays: 45
      }
    ]
  },
  {
    id: 'seguranca_ssma',
    name: 'Segurança & Cultura SSMA Zero Acidentes',
    description: 'Foco em conformidade com normas regulamentadoras, auditorias comportamentais e prevenção.',
    iconName: 'Shield',
    actions: [
      {
        title: 'Realizar 10 inspeções comportamentais de segurança em campo',
        category: '70_experience',
        description: 'Identificar desvios, orientar colaboradores e preencher checklist de SSMA.',
        suggestedDays: 30
      },
      {
        title: 'Revisar e atualizar o procedimento operacional de uma atividade crítica',
        category: '70_experience',
        description: 'Atualizar a APR (Análise Preliminar de Risco) em conjunto com a equipe técnica.',
        suggestedDays: 45
      },
      {
        title: 'Benchmarking de boas práticas com o Técnico de Segurança do Trabalho',
        category: '20_exposure',
        description: 'Discutir causas raízes de quase-acidentes e definir ações preventivas.',
        suggestedDays: 30
      },
      {
        title: 'Treinamento de Reciclagem de NRs Aplicáveis e Percepção de Risco',
        category: '10_education',
        description: 'Certificação formal nas normas regulamentadoras pertinentes à função.',
        suggestedDays: 30
      }
    ]
  },
  {
    id: 'produtividade_eficiencia',
    name: 'Eficiência Operacional & Gestão de Recursos',
    description: 'Otimização de tempo, controle de custos, conservação de equipamentos e frotas.',
    iconName: 'TrendingUp',
    actions: [
      {
        title: 'Implementar rotina de inspeção diária de checklist de máquinas/veículos',
        category: '70_experience',
        description: 'Garantir 100% de preenchimento e reporte imediato de não conformidades.',
        suggestedDays: 30
      },
      {
        title: 'Mapear e reduzir tempo ocioso ou paradas não programadas',
        category: '70_experience',
        description: 'Acompanhar indicadores de horas produtivas e apresentar relatório de resultados.',
        suggestedDays: 60
      },
      {
        title: 'Reunião mensal com CCO/Manutenção para alinhamento de produtividade',
        category: '20_exposure',
        description: 'Analisar indicadores de telemetria e consumo de combustível com a equipe técnica.',
        suggestedDays: 45
      },
      {
        title: 'Workshop de Metodologia Lean e Eliminação de Desperdícios',
        category: '10_education',
        description: 'Estudo prático dos conceitos de 5S, desperdício e fluxo contínuo.',
        suggestedDays: 30
      }
    ]
  },
  {
    id: 'comunicacao_relacionamento',
    name: 'Comunicação Assertiva & Gestão de Conflitos',
    description: 'Melhoria na clareza de instruções, inteligência emocional e relacionamento interpessoal.',
    iconName: 'MessageSquare',
    actions: [
      {
        title: 'Conduzir sessões estruturadas de feedback individual com liderados',
        category: '70_experience',
        description: 'Aplicar a técnica SCI (Situação, Comportamento, Impacto) em pelo menos 5 conversas.',
        suggestedDays: 45
      },
      {
        title: 'Participar como observador e relator em reuniões de comitê',
        category: '20_exposure',
        description: 'Sintetizar as decisões tomadas e comunicar aos respectivos setores.',
        suggestedDays: 30
      },
      {
        title: 'Curso: Comunicação Não Violenta e Inteligência Emocional',
        category: '10_education',
        description: 'Capacitação voltada para escuta ativa, clareza e gestão de expectativas.',
        suggestedDays: 45
      }
    ]
  }
];
