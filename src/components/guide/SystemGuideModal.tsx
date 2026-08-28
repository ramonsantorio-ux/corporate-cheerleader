import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HelpCircle, Compass, Activity, Users, GitMerge,
  CalendarDays, BrainCircuit, ClipboardList, CheckCircle2,
  ArrowRight, Search, Sparkles, Lightbulb, MousePointerClick,
  ExternalLink, Maximize2, Minimize2, ZoomIn, Eye,
  Clock, ShieldCheck, ChevronRight, Layers, Layout, Info
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Hotspot {
  id: number;
  x: number; // Porcentagem X (0 a 100)
  y: number; // Porcentagem Y (0 a 100)
  title: string;
  description: string;
  badge: string;
}

export interface GuideModule {
  id: string;
  route: string;
  category: string;
  title: string;
  shortDesc: string;
  icon: any;
  color: string;
  badgeColor: string;
  accentBg: string;
  estimatedTime: string;
  purpose: string;
  hotspots: Hotspot[];
  previewType: 'dashboard' | 'colaboradores' | 'organograma' | 'ausencias' | 'desempenho' | 'treinamentos';
  steps: {
    number: number;
    title: string;
    description: string;
    hotspotRef?: number;
  }[];
  buttons: {
    name: string;
    action: string;
    tip: string;
  }[];
  managerTip: string;
}

export const GUIDE_MODULES: GuideModule[] = [
  {
    id: 'dashboard',
    route: '/',
    category: 'Visão Geral',
    title: 'Central de Movimentações',
    shortDesc: 'Painel executivo com métricas consolidadas, movimentações e alertas.',
    icon: Activity,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    accentBg: 'from-blue-600/20 to-indigo-600/20',
    estimatedTime: '2 min',
    previewType: 'dashboard',
    purpose: 'Oferecer aos diretores, gerentes e supervisores um raio-x em tempo real de todo o efetivo, movimentações recentes, presenças, aniversariantes do mês e indicadores gerais de RH.',
    hotspots: [
      { id: 1, x: 22, y: 15, title: 'Seletor de Departamentos', description: 'Alterne entre visão global de todos os setores ou filtre apenas o seu contrato operacional.', badge: 'Filtro' },
      { id: 2, x: 50, y: 35, title: 'Cards de KPIs em Tempo Real', description: 'Total de colaboradores ativos, taxa de presença, turnover e novos feedbacks.', badge: 'Métricas' },
      { id: 3, x: 30, y: 70, title: 'Gráfico de Movimentações', description: 'Acompanhe o histórico de admissões, transferências e promoções por mês.', badge: 'Gráficos' },
      { id: 4, x: 78, y: 70, title: 'Aniversariantes do Mês', description: 'Lista com foto dos colaboradores que comemoram aniversário no mês corrente.', badge: 'Endomarketing' }
    ],
    steps: [
      {
        number: 1,
        title: 'Verifique os Indicadores do Topo',
        description: 'Acompanhe os cards de total de colaboradores ativos, taxa de presença média, turnover e movimentações do mês.',
        hotspotRef: 2
      },
      {
        number: 2,
        title: 'Filtre por Departamento ou Contrato',
        description: 'Utilize o seletor no topo da barra de navegação para alternar entre "Todos os Setores" ou um contrato específico (ex: Usina, Porto, Frotas).',
        hotspotRef: 1
      },
      {
        number: 3,
        title: 'Monitore as Notificações de Alerta',
        description: 'Clique no ícone de sino no topo para identificar atestados pendentes, ocorrências de SSMA ou feedbacks aguardando validação.'
      }
    ],
    buttons: [
      {
        name: 'Seletor de Departamentos (Topo)',
        action: 'Filtra os dados instantaneamente para o contrato selecionado.',
        tip: 'Líderes de setor já visualizam sua equipe filtrada por padrão.'
      },
      {
        name: 'Sino de Notificações',
        action: 'Abre a central de pendências dos últimos 30 dias.',
        tip: 'Notificações lidas deixam de somar no contador em vermelho.'
      },
      {
        name: 'Alternador de Tema (Sol/Lua)',
        action: 'Muda a visualização entre Modo Claro e Modo Escuro.',
        tip: 'Ideal para uso em tablets e ambientes com pouca luz.'
      }
    ],
    managerTip: 'Inicie seu dia sempre por esta tela para verificar ausências não programadas e parabenizar os aniversariantes da sua equipe!'
  },
  {
    id: 'colaboradores',
    route: '/colaboradores',
    category: 'Gestão de Pessoas',
    title: 'Colaboradores',
    shortDesc: 'Cadastro unificado, busca rápida e Perfil 360° de cada profissional.',
    icon: Users,
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    accentBg: 'from-indigo-600/20 to-purple-600/20',
    estimatedTime: '3 min',
    previewType: 'colaboradores',
    purpose: 'Centralizar todos os dados cadastrais, cargo, contrato, gestor imediato, histórico profissional, avaliações de desempenho, Fit Cultural e PDI de cada colaborador.',
    hotspots: [
      { id: 1, x: 28, y: 18, title: 'Busca Rápida & Filtros', description: 'Pesquise por nome, matrícula, cargo ou filtre por status ativo/inativo.', badge: 'Pesquisa' },
      { id: 2, x: 86, y: 18, title: 'Botão + Novo Colaborador', description: 'Abre o formulário completo de admissão de um novo profissional na empresa.', badge: 'Admissão' },
      { id: 3, x: 35, y: 55, title: 'Cartão do Colaborador', description: 'Exibe foto, cargo, departamento, gestor imediato e status contratual.', badge: 'Visualização' },
      { id: 4, x: 80, y: 55, title: 'Acesso ao Perfil 360°', description: 'Clique em qualquer colaborador para ver todas as suas notas, metas, PDI e histórico.', badge: 'Perfil' }
    ],
    steps: [
      {
        number: 1,
        title: 'Localize o Colaborador',
        description: 'Digite o nome, matrícula ou cargo no campo de busca. Você também pode filtrar por departamento, cargo ou status ativo/inativo.',
        hotspotRef: 1
      },
      {
        number: 2,
        title: 'Abra o Perfil 360°',
        description: 'Clique no card ou no nome do colaborador na lista para acessar o perfil individual completo.',
        hotspotRef: 4
      },
      {
        number: 3,
        title: 'Navegue pelas Abas do Perfil',
        description: 'Explore as abas: "Dados Gerais", "Fit Cultural", "Potencial", "Nine Box", "PDI" e "Histórico". Cada aba possui ações específicas de gestão.'
      },
      {
        number: 4,
        title: 'Cadastrar Novo Colaborador (RH/Admin)',
        description: 'Para admitir um novo funcionário, clique no botão azul "+ Novo Colaborador" no canto superior direito.',
        hotspotRef: 2
      }
    ],
    buttons: [
      {
        name: '+ Novo Colaborador',
        action: 'Abre o formulário completo de admissão e cadastro com foto.',
        tip: 'Preencha o Encarregado/Gestor para alimentar o organograma.'
      },
      {
        name: 'Exportar Lista / Relatório',
        action: 'Gera uma planilha Excel com os colaboradores filtrados.',
        tip: 'Útil para auditorias e fechamento de folha de pagamento.'
      },
      {
        name: 'Aba Fit Cultural (No Perfil)',
        action: 'Permite acompanhar a autoavaliação e realizar a avaliação do gestor.',
        tip: 'Utilize o botão "Copiar Link de Autoavaliação" para enviar no WhatsApp.'
      }
    ],
    managerTip: 'Mantenha as fotos dos seus liderados atualizadas para facilitar a identificação visual no organograma e nas reuniões de comitê de gente.'
  },
  {
    id: 'organograma',
    route: '/organograma',
    category: 'Gestão de Pessoas',
    title: 'Organograma',
    shortDesc: 'Mapa vivo da estrutura hierárquica e relações de liderança.',
    icon: GitMerge,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    accentBg: 'from-purple-600/20 to-pink-600/20',
    estimatedTime: '2 min',
    previewType: 'organograma',
    purpose: 'Exibir com máxima clareza a estrutura organizacional da Busato, quem responde a quem, as equipes de cada encarregado/supervisor e os níveis de liderança.',
    hotspots: [
      { id: 1, x: 50, y: 20, title: 'Diretoria / Alta Gestão', description: 'Topo da cadeia de comando da empresa e conexões com gerências.', badge: 'Liderança' },
      { id: 2, x: 30, y: 55, title: 'Supervisores & Encarregados', description: 'Líderes de contratos com indicador do número de liderados diretos.', badge: 'Equipes' },
      { id: 3, x: 88, y: 15, title: 'Controles de Zoom & Centralizar', description: 'Aproxime ou afaste a visualização e resete o enquadramento.', badge: 'Navegação' },
      { id: 4, x: 30, y: 85, title: 'Equipe Operacional', description: 'Ramo expandido mostrando operadores, motoristas e apoio.', badge: 'Operação' }
    ],
    steps: [
      {
        number: 1,
        title: 'Navegue pela Árvore Hierárquica',
        description: 'Arraste a tela com o mouse ou use o scroll para percorrer a estrutura de cima para baixo (Diretoria ➔ Supervisores ➔ Operacional).',
        hotspotRef: 1
      },
      {
        number: 2,
        title: 'Expandir ou Recolher Equipes',
        description: 'Clique no botão com o número de liderados ou ícone chevron em cada card de líder para abrir ou fechar sua equipe.',
        hotspotRef: 2
      },
      {
        number: 3,
        title: 'Acessar o Perfil do Líder ou Liderado',
        description: 'Clique sobre a foto ou nome de qualquer pessoa no organograma para abrir imediatamente o seu perfil 360°.'
      }
    ],
    buttons: [
      {
        name: 'Controles de Zoom (+ / -)',
        action: 'Aproxima ou afasta a visão geral do organograma.',
        tip: 'Permite ver o panorama geral da empresa em uma única tela.'
      },
      {
        name: 'Resetar Visão (Centralizar)',
        action: 'Retorna a câmera para o topo da árvore hierárquica.',
        tip: 'Excelente caso tenha navegado para uma ramificação distante.'
      },
      {
        name: 'Filtro por Gestor / Contrato',
        action: 'Isola apenas a árvore de um contrato ou líder específico.',
        tip: 'Ideal para reuniões de equipe e alinhamentos de contrato.'
      }
    ],
    managerTip: 'Se algum colaborador estiver aparecendo fora da equipe correta, acesse o perfil dele e ajuste o campo "Encarregado / Gestor Imediato".'
  },
  {
    id: 'ausencias',
    route: '/ausencias',
    category: 'Gestão de Pessoas',
    title: 'Ponto & Férias',
    shortDesc: 'Controle diário de assiduidade, atestados, faltas e programação de férias.',
    icon: CalendarDays,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    accentBg: 'from-amber-600/20 to-orange-600/20',
    estimatedTime: '3 min',
    previewType: 'ausencias',
    purpose: 'Garantir a disciplina operacional e previsibilidade dos contratos, acompanhando atestados de saúde (CID), faltas justificadas/injustificadas e o calendário anual de férias.',
    hotspots: [
      { id: 1, x: 20, y: 18, title: 'Filtro de Período & Mês', description: 'Selecione a data ou mês para ver a apuração diária da equipe.', badge: 'Período' },
      { id: 2, x: 86, y: 18, title: 'Botão + Registrar Ausência', description: 'Cadastre atestados médicos, faltas e anexe o comprovante digitalizado.', badge: 'Lançamento' },
      { id: 3, x: 30, y: 38, title: 'Cards de Resumo de Absenteísmo', description: 'Contador de faltas justificadas, injustificadas e atestados do período.', badge: 'KPIs' },
      { id: 4, x: 50, y: 70, title: 'Tabela Diária de Ocorrências', description: 'Lista detalhada com motivo, data de retorno e botão de anexo.', badge: 'Lançamentos' }
    ],
    steps: [
      {
        number: 1,
        title: 'Selecione a Data ou Mês de Referência',
        description: 'Escolha a data no calendário para verificar quem esteve presente, afastado ou de folga no dia.',
        hotspotRef: 1
      },
      {
        number: 2,
        title: 'Lançar Ocorrência ou Atestado',
        description: 'Clique em "+ Registrar Ausência", selecione o colaborador, informe o motivo (Atestado, Falta, Licença), período e anexe o comprovante.',
        hotspotRef: 2
      },
      {
        number: 3,
        title: 'Acompanhar a Grade de Férias',
        description: 'Acesse a aba "Planejamento de Férias" para visualizar quem estará ausente nos próximos meses e evitar desfalques operacionais.'
      }
    ],
    buttons: [
      {
        name: '+ Registrar Ausência',
        action: 'Abre o formulário de cadastro de atestado médico ou falta.',
        tip: 'Você pode indicar se a falta foi justificada ou injustificada.'
      },
      {
        name: 'Aba Férias',
        action: 'Mostra o mapa anual de férias agendadas por colaborador.',
        tip: 'Alerta sobre períodos críticos e vencimento de férias em dobro.'
      },
      {
        name: 'Exportar Relatório',
        action: 'Baixa o consolidado mensal de absenteísmo em Excel.',
        tip: 'Envie para o departamento de Recursos Humanos e Departamento Pessoal.'
      }
    ],
    managerTip: 'Lance os atestados médicos no mesmo dia do recebimento para que o setor de SSMA e o DP consigam validar a tempo do fechamento da folha.'
  },
  {
    id: 'desempenho',
    route: '/desempenho',
    category: 'Liderança & Gestão',
    title: 'Painel do Gestor',
    shortDesc: 'Fit Cultural, Matriz Nine Box, Metas, PDI e Feedbacks Contínuos.',
    icon: BrainCircuit,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    accentBg: 'from-emerald-600/20 to-teal-600/20',
    estimatedTime: '4 min',
    previewType: 'desempenho',
    purpose: 'O módulo central de avaliação de pessoas da Busato. Permite avaliar o Fit Cultural em 4 etapas (Autoavaliação, Gestor, Calibração e Validação), classificar talentos na Nine Box, traçar PDIs e dar feedbacks estruturados.',
    hotspots: [
      { id: 1, x: 28, y: 16, title: 'Abas do Painel do Gestor', description: 'Navegue entre Metas, Fit Cultural, Matriz Nine Box, PDI e Feedbacks.', badge: 'Abas' },
      { id: 2, x: 84, y: 16, title: 'Botão + Novo Ciclo / Link', description: 'Crie períodos semestrais e gere o link para WhatsApp do colaborador.', badge: 'Ação Rápida' },
      { id: 3, x: 50, y: 55, title: 'Matriz Nine Box (9 Quadrantes)', description: 'Cruzamento de Desempenho vs. Potencial com classificação visual.', badge: 'Talentos' },
      { id: 4, x: 50, y: 88, title: 'Notas Oficiais (1 a 5 e N/A)', description: 'Muito abaixo, Abaixo, Dentro, Acima, Muito acima do esperado e N/A.', badge: 'Critérios' }
    ],
    steps: [
      {
        number: 1,
        title: 'Selecione a Aba de Ação',
        description: 'Navegue entre: "Metas", "Fit Cultural", "Nine Box", "PDI" e "Feedbacks". Cada aba cumpre uma etapa do ciclo de gestão de gente.',
        hotspotRef: 1
      },
      {
        number: 2,
        title: 'Ciclo e Link de Autoavaliação do Fit Cultural',
        description: 'Clique em "Criar Novo Ciclo" para iniciar um período semestral. Em seguida, use o botão "Gerar Link de Autoavaliação" e envie no WhatsApp do colaborador.',
        hotspotRef: 2
      },
      {
        number: 3,
        title: 'Avaliação do Gestor e Calibração',
        description: 'Após o colaborador responder, o gestor avalia as competências de 1 a 5 (ou N/A). Em seguida, o comitê realiza a Calibração e a Validação final.',
        hotspotRef: 4
      },
      {
        number: 4,
        title: 'Matriz Nine Box e PDI',
        description: 'Cruze os resultados de Desempenho e Potencial na matriz 9-Box para identificar Promotores, Futuros Líderes ou pontos de atenção, criando o PDI em seguida.',
        hotspotRef: 3
      }
    ],
    buttons: [
      {
        name: 'Gerar Link de Autoavaliação',
        action: 'Cria o link exclusivo para o colaborador responder no celular sem login.',
        tip: 'O colaborador visualiza o card de identificação e opção N/A nas perguntas.'
      },
      {
        name: 'Criar Ciclo de Avaliação',
        action: 'Define um novo período oficial de avaliação (ex: 1º Semestre 2026).',
        tip: 'Permite selecionar quais cargos participarão da matriz Nine Box.'
      },
      {
        name: '+ Novo PDI / + Novo Feedback',
        action: 'Registra planos de ação e alinhamentos de desenvolvimento.',
        tip: 'Mantenha o colaborador ciente e acompanhe o status de evolução.'
      }
    ],
    managerTip: 'Lembre-se: no Fit Cultural a nota 3 representa "Dentro do Esperado", o que significa excelente desempenho na rotina! Use 4 e 5 para entregas que superam o contratado.'
  },
  {
    id: 'treinamentos',
    route: '/treinamentos',
    category: 'Talentos & Comportamento',
    title: 'Central de Assessments',
    shortDesc: 'Testes de Perfil Comportamental DISC, Potencial e Inteligência Emocional.',
    icon: ClipboardList,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    accentBg: 'from-rose-600/20 to-red-600/20',
    estimatedTime: '3 min',
    previewType: 'treinamentos',
    purpose: 'Mapear o perfil comportamental dos colaboradores para alocação assertiva de funções, identificar estilo de liderança, perfil de comunicação e necessidades de treinamento.',
    hotspots: [
      { id: 1, x: 25, y: 35, title: 'Card Teste DISC', description: 'Questionário de perfil comportamental com cálculo automatizado dos 4 fatores.', badge: 'DISC' },
      { id: 2, x: 82, y: 35, title: 'Botão Copiar Link do Teste', description: 'Envie o link diretamente no WhatsApp do colaborador para responder no celular.', badge: 'Compartilhar' },
      { id: 3, x: 45, y: 75, title: 'Gráfico Radar Comportamental', description: 'Teia visual comparando Dominância, Influência, Estabilidade e Conformidade.', badge: 'Gráficos' },
      { id: 4, x: 80, y: 75, title: 'Laudo Completo em PDF', description: 'Exportação detalhada para uso em feedback e recrutamento interno.', badge: 'Relatório' }
    ],
    steps: [
      {
        number: 1,
        title: 'Selecione o Tipo de Assessment',
        description: 'Escolha entre Teste DISC (Dominância, Influência, Estabilidade, Conformidade), Teste de Potencial ou Avaliação Comportamental.',
        hotspotRef: 1
      },
      {
        number: 2,
        title: 'Copie o Link e Envie ao Colaborador',
        description: 'Clique no botão "Copiar Link do Questionário" para enviar ao colaborador realizar no smartphone ou computador.',
        hotspotRef: 2
      },
      {
        number: 3,
        title: 'Analise o Relatório de Resultados',
        description: 'Assim que finalizado, acesse o gráfico radar, os pontos fortes do perfil, estilo de liderança e orientações de feedback recomendadas.',
        hotspotRef: 3
      }
    ],
    buttons: [
      {
        name: 'Iniciar Novo Teste DISC',
        action: 'Gera uma aplicação do formulário de 24 questões com 4 opções.',
        tip: 'Oriente o profissional a responder com espontaneidade e rapidez.'
      },
      {
        name: 'Gráficos Radar & Barras',
        action: 'Compara os 4 fatores do perfil comportamental visualmente.',
        tip: 'Ajuda a entender se o perfil é mais executor, analítico ou relacional.'
      },
      {
        name: 'Exportar Relatório PDF',
        action: 'Gera o laudo comportamental completo do colaborador.',
        tip: 'Ótimo material para ser trabalhado em sessões de feedback e PDI.'
      }
    ],
    managerTip: 'Não existe perfil "bom" ou "ruim" no DISC! Cada perfil brilha em funções diferentes: analíticos em controle de qualidade, executores em metas agressivas e comunicadores em relacionamento com clientes.'
  }
];

// Componente Visual Ilustrado Realista de Cada Tela (Mockup em Alta Resolução)
function ScreenMockup({
  type,
  hotspots,
  activeHotspot,
  onSelectHotspot
}: {
  type: GuideModule['previewType'];
  hotspots: Hotspot[];
  activeHotspot: number | null;
  onSelectHotspot: (id: number) => void;
}) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-2xl select-none group">
      {/* Barra de Janela / Browser estilo Mac */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="text-[10px] text-slate-400 font-mono ml-2 font-medium">busatocontratos.com.br</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="hidden sm:inline bg-slate-800 px-2 py-0.5 rounded text-[9px] text-slate-300">
            Pressione nos círculos numerados para explorar
          </span>
          <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Conteúdo Ilustrado Fiel de Cada Tela */}
      <div className="p-4 sm:p-5 bg-slate-900/90 text-slate-200 min-h-[260px] sm:min-h-[300px] flex flex-col justify-between relative overflow-hidden">
        {type === 'dashboard' && (
          <div className="space-y-3 pointer-events-none opacity-90">
            {/* Topo com Seletor */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">B</div>
                <div className="h-3 w-28 bg-slate-700 rounded" />
              </div>
              <div className="h-6 w-36 bg-slate-800 border border-slate-700 rounded-md flex items-center px-2">
                <div className="h-2 w-20 bg-blue-400/60 rounded" />
              </div>
            </div>
            {/* 4 Cards de Métricas */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
                <div className="text-[9px] text-slate-400">Colaboradores</div>
                <div className="text-lg font-black text-white mt-1">68</div>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
                <div className="text-[9px] text-slate-400">Taxa Presença</div>
                <div className="text-lg font-black text-emerald-400 mt-1">94%</div>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
                <div className="text-[9px] text-slate-400">Turnover</div>
                <div className="text-lg font-black text-cyan-400 mt-1">1.2%</div>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
                <div className="text-[9px] text-slate-400">Feedbacks</div>
                <div className="text-lg font-black text-amber-400 mt-1">14</div>
              </div>
            </div>
            {/* Gráfico + Lista */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="col-span-2 bg-slate-800/50 p-3 rounded-lg border border-slate-800 h-28 flex flex-col justify-between">
                <div className="h-2.5 w-28 bg-slate-700 rounded" />
                <div className="flex items-end gap-2 h-16 pt-2">
                  <div className="flex-1 bg-blue-500/40 rounded-t h-40%" />
                  <div className="flex-1 bg-blue-500/60 rounded-t h-60%" />
                  <div className="flex-1 bg-blue-500/80 rounded-t h-75%" />
                  <div className="flex-1 bg-blue-400 rounded-t h-90%" />
                </div>
              </div>
              <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-800 space-y-2">
                <div className="h-2 w-20 bg-slate-700 rounded" />
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-700" />
                  <div className="h-2 w-14 bg-slate-600 rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-700" />
                  <div className="h-2 w-14 bg-slate-600 rounded" />
                </div>
              </div>
            </div>
          </div>
        )}

        {type === 'colaboradores' && (
          <div className="space-y-3 pointer-events-none opacity-90">
            {/* Barra de Busca + Botão Novo */}
            <div className="flex items-center justify-between gap-3">
              <div className="h-7 flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 flex items-center">
                <div className="h-2 w-32 bg-slate-600 rounded" />
              </div>
              <div className="h-7 w-32 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                + Novo Colaborador
              </div>
            </div>
            {/* Cards de Colaboradores */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                      C{idx}
                    </div>
                    <div>
                      <div className="h-2.5 w-24 bg-slate-600 rounded" />
                      <div className="h-2 w-16 bg-slate-700 rounded mt-1" />
                    </div>
                  </div>
                  <div className="h-5 px-2 bg-indigo-500/20 border border-indigo-500/30 rounded text-[9px] font-bold text-indigo-300 flex items-center">
                    Ver Perfil
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === 'organograma' && (
          <div className="space-y-3 pointer-events-none opacity-90 flex flex-col items-center justify-center">
            {/* Controles de Zoom */}
            <div className="absolute top-3 right-3 flex gap-1">
              <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-300">+</div>
              <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-300">-</div>
            </div>
            {/* Raiz: Diretoria */}
            <div className="bg-purple-600/30 border border-purple-400/50 px-4 py-2 rounded-xl text-center shadow-md">
              <div className="text-[10px] font-bold text-purple-200">Diretoria Executiva</div>
              <div className="text-[8px] text-purple-300">Ramon Leonard Santório</div>
            </div>
            {/* Linha vertical */}
            <div className="w-0.5 h-4 bg-purple-500/40" />
            {/* Nível de Coordenações */}
            <div className="grid grid-cols-3 gap-4 w-full px-2">
              <div className="bg-slate-800/90 border border-slate-700 p-2 rounded-lg text-center">
                <div className="text-[9px] font-bold text-slate-200">Coord. Usina</div>
                <div className="text-[8px] text-slate-400">12 liderados</div>
              </div>
              <div className="bg-slate-800/90 border border-slate-700 p-2 rounded-lg text-center">
                <div className="text-[9px] font-bold text-slate-200">Coord. Porto</div>
                <div className="text-[8px] text-slate-400">18 liderados</div>
              </div>
              <div className="bg-slate-800/90 border border-slate-700 p-2 rounded-lg text-center">
                <div className="text-[9px] font-bold text-slate-200">Coord. Frotas</div>
                <div className="text-[8px] text-slate-400">15 liderados</div>
              </div>
            </div>
          </div>
        )}

        {type === 'ausencias' && (
          <div className="space-y-3 pointer-events-none opacity-90">
            {/* Topo com Filtro de Data e Botão Registrar */}
            <div className="flex items-center justify-between">
              <div className="h-6 w-36 bg-slate-800 border border-slate-700 rounded-md px-2 flex items-center">
                <div className="h-2 w-20 bg-slate-500 rounded" />
              </div>
              <div className="h-6 px-2.5 bg-amber-600 rounded-md text-[10px] font-bold text-white flex items-center">
                + Registrar Ausência
              </div>
            </div>
            {/* 3 Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <div className="text-[8px] text-slate-400">Faltas Injustificadas</div>
                <div className="text-base font-black text-rose-400">0</div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <div className="text-[8px] text-slate-400">Atestados Médicos</div>
                <div className="text-base font-black text-amber-400">0</div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <div className="text-[8px] text-slate-400">Em Férias</div>
                <div className="text-base font-black text-blue-400">0</div>
              </div>
            </div>
            {/* Tabela de Lançamentos */}
            <div className="bg-slate-800/60 rounded-lg border border-slate-800 p-2 space-y-1.5">
              <div className="flex justify-between border-b border-slate-700/60 pb-1 text-[8px] text-slate-400">
                <span>Colaborador</span>
                <span>Tipo de Ausência</span>
                <span>Período</span>
              </div>
              <div className="flex justify-between text-[8px] text-slate-300">
                <span>Abner Carvalho</span>
                <span className="text-amber-400">Atestado Médico (2 dias)</span>
                <span>28/08 a 29/08</span>
              </div>
            </div>
          </div>
        )}

        {type === 'desempenho' && (
          <div className="space-y-3 pointer-events-none opacity-90">
            {/* Abas */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex gap-1 bg-slate-800 p-0.5 rounded-md text-[9px]">
                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold">Fit Cultural</span>
                <span className="px-2 py-0.5 text-slate-400">Nine Box</span>
                <span className="px-2 py-0.5 text-slate-400">Metas</span>
                <span className="px-2 py-0.5 text-slate-400">PDI</span>
              </div>
              <div className="h-6 px-2 bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded text-[9px] font-bold flex items-center">
                Copiar Link WhatsApp
              </div>
            </div>
            {/* Matriz Nine Box Miniatura */}
            <div className="grid grid-cols-3 gap-1 bg-slate-800/40 p-2 rounded-lg border border-slate-700/60">
              <div className="bg-amber-500/20 border border-amber-500/30 p-1.5 rounded text-[8px] text-amber-200">Profissional Enigma</div>
              <div className="bg-emerald-500/20 border border-emerald-500/30 p-1.5 rounded text-[8px] text-emerald-200">Forte Desempenho</div>
              <div className="bg-cyan-500/30 border border-cyan-400/50 p-1.5 rounded text-[8px] text-cyan-200 font-bold">⭐ Top Talent</div>
              <div className="bg-slate-700/40 border border-slate-600/40 p-1.5 rounded text-[8px] text-slate-300">Eficaz</div>
              <div className="bg-emerald-500/20 border border-emerald-500/30 p-1.5 rounded text-[8px] text-emerald-200">Mantenedor</div>
              <div className="bg-emerald-500/20 border border-emerald-500/30 p-1.5 rounded text-[8px] text-emerald-200">Forte Desempenho</div>
              <div className="bg-rose-500/20 border border-rose-500/30 p-1.5 rounded text-[8px] text-rose-200">Risco</div>
              <div className="bg-slate-700/40 border border-slate-600/40 p-1.5 rounded text-[8px] text-slate-300">Eficaz</div>
              <div className="bg-amber-500/20 border border-amber-500/30 p-1.5 rounded text-[8px] text-amber-200">Especialista</div>
            </div>
          </div>
        )}

        {type === 'treinamentos' && (
          <div className="space-y-3 pointer-events-none opacity-90">
            {/* Topo DISC */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[9px] font-bold">DISC</span>
                <span className="text-[10px] text-slate-300 font-bold">Mapeamento Comportamental</span>
              </div>
              <div className="h-6 px-2 bg-rose-600 rounded text-[9px] font-bold text-white flex items-center">
                Copiar Link do Teste
              </div>
            </div>
            {/* Gráfico Teia Radar */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="bg-rose-500/20 border border-rose-500/40 p-2 rounded text-center">
                <div className="text-xs font-black text-rose-300">D</div>
                <div className="text-[8px] text-slate-300">Dominância</div>
                <div className="text-sm font-bold text-white mt-1">78%</div>
              </div>
              <div className="bg-amber-500/20 border border-amber-500/40 p-2 rounded text-center">
                <div className="text-xs font-black text-amber-300">I</div>
                <div className="text-[8px] text-slate-300">Influência</div>
                <div className="text-sm font-bold text-white mt-1">85%</div>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-500/40 p-2 rounded text-center">
                <div className="text-xs font-black text-emerald-300">S</div>
                <div className="text-[8px] text-slate-300">Estabilidade</div>
                <div className="text-sm font-bold text-white mt-1">62%</div>
              </div>
              <div className="bg-blue-500/20 border border-blue-500/40 p-2 rounded text-center">
                <div className="text-xs font-black text-blue-300">C</div>
                <div className="text-[8px] text-slate-300">Conformidade</div>
                <div className="text-sm font-bold text-white mt-1">70%</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ HOTSPOTS INTERATIVOS PULSANTES SOBRE O PRINT ═══ */}
        {hotspots.map((hs) => {
          const isActive = activeHotspot === hs.id;
          return (
            <button
              key={hs.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectHotspot(hs.id);
              }}
              style={{ top: `${hs.y}%`, left: `${hs.x}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group/hotspot transition-all ${
                isActive ? 'scale-125 z-30' : 'hover:scale-115'
              }`}
              title={hs.title}
            >
              {/* Efeito Halo / Onda Pulsante */}
              <span className={`absolute -inset-1.5 rounded-full animate-ping opacity-75 ${
                isActive ? 'bg-amber-400' : 'bg-primary'
              }`} />
              {/* Círculo Principal com o Número */}
              <div className={`relative w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg transition-all border ${
                isActive
                  ? 'bg-amber-400 text-slate-950 border-white ring-4 ring-amber-400/40'
                  : 'bg-primary text-primary-foreground border-white/80'
              }`}>
                {hs.id}
              </div>

              {/* Tooltip Hover no Hotspot */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/hotspot:block z-40 w-48 p-2 bg-slate-900/95 border border-slate-700 text-white rounded-lg shadow-xl text-[11px] pointer-events-none">
                <span className="font-bold block text-teal-300">{hs.title}</span>
                <span className="text-slate-300 text-[10px]">{hs.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SystemGuideModal({ open, onOpenChange }: { open: boolean; onOpenChange: (val: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'passos' | 'botoes' | 'dicas'>('preview');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(1);

  // Identifica o módulo da rota atual para abrir já focado nele
  const currentModuleFromRoute = GUIDE_MODULES.find(m => {
    if (m.route === '/') return location.pathname === '/';
    return location.pathname.startsWith(m.route);
  }) || GUIDE_MODULES[0];

  const [selectedModuleId, setSelectedModuleId] = useState<string>(currentModuleFromRoute.id);

  // Sincroniza se o usuário abrir o modal em rotas diferentes
  useEffect(() => {
    if (open) {
      const match = GUIDE_MODULES.find(m => {
        if (m.route === '/') return location.pathname === '/';
        return location.pathname.startsWith(m.route);
      });
      if (match) {
        setSelectedModuleId(match.id);
        setActiveHotspot(1);
      }
    }
  }, [open, location.pathname]);

  // Filtro de busca
  const filteredModules = GUIDE_MODULES.filter(m => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.title.toLowerCase().includes(term) ||
      m.category.toLowerCase().includes(term) ||
      m.shortDesc.toLowerCase().includes(term) ||
      m.purpose.toLowerCase().includes(term) ||
      m.buttons.some(b => b.name.toLowerCase().includes(term) || b.action.toLowerCase().includes(term))
    );
  });

  const activeModule = GUIDE_MODULES.find(m => m.id === selectedModuleId) || GUIDE_MODULES[0];
  const IconComp = activeModule.icon;

  const handleNavigateToModule = (route: string) => {
    onOpenChange(false);
    navigate(route);
  };

  const currentHotspotData = activeModule.hotspots.find(h => h.id === activeHotspot) || activeModule.hotspots[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`p-0 overflow-hidden bg-background border-border/80 shadow-2xl rounded-2xl flex flex-col transition-all duration-300 ${
        isFullScreen ? 'w-[98vw] h-[96vh] max-w-none' : 'max-w-5xl h-[90vh] max-h-[850px]'
      }`}>
        {/* Header do Guia estilo Notion / Linear */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 text-white p-5 sm:p-6 shrink-0 relative border-b border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 backdrop-blur-md flex items-center justify-center border border-teal-400/30 shadow-inner">
                <Compass className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-400/20">
                    Manual Interativo com Prints
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-300">Gestão & Operações Busato</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
                  Guia Visual de Módulos & Botões
                </h2>
              </div>
            </div>

            {/* Controles de Janela (Maximizar / Tela Cheia) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                title={isFullScreen ? 'Reduzir tamanho' : 'Expandir para tela cheia'}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300/90 mt-2 max-w-3xl">
            Explore as telas reais com pontos interativos numerados, entenda a finalidade de cada botão e siga o fluxo recomendado para líderes e gestores.
          </p>

          {/* Campo de Busca Rápida no Header */}
          <div className="mt-4 relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquise por módulo, botão (ex: '+ Novo', 'Nine Box', 'Link')..."
              className="pl-9 h-9 bg-white/10 border-white/20 text-white placeholder:text-slate-400 text-xs rounded-xl focus:bg-white/20 transition-all"
            />
          </div>
        </div>

        {/* Corpo Principal Dividido em 2 Colunas */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Menu Lateral de Módulos (Coluna Esquerda) */}
          <div className="w-full md:w-72 border-r border-border/80 bg-muted/20 p-3 shrink-0 flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2">
              Selecione o Módulo ({filteredModules.length})
            </span>
            <ScrollArea className="flex-1">
              <div className="space-y-1 pr-2">
                {filteredModules.map(mod => {
                  const ModIcon = mod.icon;
                  const isSelected = mod.id === activeModule.id;
                  const isCurrentScreen = location.pathname === mod.route || (mod.route !== '/' && location.pathname.startsWith(mod.route));

                  return (
                    <button
                      key={mod.id}
                      onClick={() => {
                        setSelectedModuleId(mod.id);
                        setActiveHotspot(1);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 relative ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-md font-semibold'
                          : 'hover:bg-muted/80 text-foreground/80'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : mod.color
                      }`}>
                        <ModIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs truncate font-bold">{mod.title}</span>
                          {isCurrentScreen && (
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                              isSelected ? 'bg-white text-primary' : 'bg-primary/20 text-primary'
                            }`}>
                              Aqui
                            </span>
                          )}
                        </div>
                        <span className={`text-[11px] block truncate mt-0.5 ${
                          isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}>
                          {mod.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Área de Detalhamento do Módulo (Coluna Direita) */}
          <div className="flex-1 overflow-hidden flex flex-col bg-background">
            {/* Topo do Módulo com Abas Visuais */}
            <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${activeModule.color} shadow-xs border`}>
                  <IconComp className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] font-semibold ${activeModule.badgeColor}`}>
                      {activeModule.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" /> {activeModule.estimatedTime}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
                    {activeModule.title}
                  </h3>
                </div>
              </div>

              {/* Botão de Ir para a tela */}
              <Button
                size="sm"
                onClick={() => handleNavigateToModule(activeModule.route)}
                className="gap-1.5 text-xs font-semibold shadow-xs"
              >
                <span>Acessar tela agora</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Pílulas de Navegação por Abas (Print / Passos / Botões / Dicas) */}
            <div className="px-5 pt-3 pb-1 border-b border-border/60 bg-muted/5 flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visualização com Prints (Hotspots)</span>
              </button>

              <button
                onClick={() => setActiveTab('passos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'passos'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Passo a Passo ({activeModule.steps.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('botoes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'botoes'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <MousePointerClick className="w-3.5 h-3.5" />
                <span>Guia de Botões ({activeModule.buttons.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('dicas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'dicas'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Dicas do Gestor</span>
              </button>
            </div>

            {/* Conteúdo Dinâmico com Scroll */}
            <ScrollArea className="flex-1 p-5 sm:p-6">
              <div className="space-y-6 max-w-4xl">
                {/* ═══ ABA 1: VISUALIZAÇÃO COM PRINTS & HOTSPOTS DINÂMICOS ═══ */}
                {activeTab === 'preview' && (
                  <div className="space-y-4">
                    {/* Objetivo */}
                    <div className="bg-muted/30 border border-border/70 rounded-xl p-3.5">
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                        💡 <strong>Para que serve:</strong> {activeModule.purpose}
                      </p>
                    </div>

                    {/* Mockup Interativo com Hotspots */}
                    <ScreenMockup
                      type={activeModule.previewType}
                      hotspots={activeModule.hotspots}
                      activeHotspot={activeHotspot}
                      onSelectHotspot={(id) => setActiveHotspot(id)}
                    />

                    {/* Caixa de Destaque do Hotspot Selecionado */}
                    {currentHotspotData && (
                      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 rounded-xl p-4 flex items-start gap-3 shadow-xs">
                        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {currentHotspotData.id}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-sm text-foreground">{currentHotspotData.title}</h5>
                            <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary">
                              {currentHotspotData.badge}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {currentHotspotData.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══ ABA 2: PASSO A PASSO GUIADO ═══ */}
                {activeTab === 'passos' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Fluxo Recomendado para o Usuário
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {activeModule.steps.map((step) => (
                        <div
                          key={step.number}
                          onClick={() => {
                            if (step.hotspotRef) {
                              setActiveHotspot(step.hotspotRef);
                              setActiveTab('preview');
                            }
                          }}
                          className="bg-card border border-border/70 rounded-xl p-4 flex items-start gap-3.5 shadow-2xs hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                        >
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {step.number}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs sm:text-sm font-bold text-foreground">{step.title}</h5>
                              {step.hotspotRef && (
                                <span className="text-[10px] text-primary font-semibold flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                  Ver no print (Item {step.hotspotRef}) <ChevronRight className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ ABA 3: GUIA DE BOTÕES ═══ */}
                {activeTab === 'botoes' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MousePointerClick className="w-4 h-4 text-blue-500" /> Dicionário de Ações desta Tela
                    </h4>
                    <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border/60 bg-card">
                      {activeModule.buttons.map((btn, bIdx) => (
                        <div key={bIdx} className="p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                          <div className="space-y-1 sm:max-w-[50%]">
                            <span className="font-bold text-foreground flex items-center gap-2 text-xs sm:text-sm">
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              {btn.name}
                            </span>
                            <p className="text-muted-foreground text-xs">{btn.action}</p>
                          </div>
                          <div className="bg-primary/5 border border-primary/15 text-primary text-xs rounded-lg px-3 py-1.5 sm:max-w-[45%] font-medium">
                            💡 <strong>Dica prática:</strong> {btn.tip}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ ABA 4: DICAS DO GESTOR ═══ */}
                {activeTab === 'dicas' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                      <div className="p-3 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                          Dica de Liderança & Boas Práticas (Busato)
                        </h5>
                        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                          {activeModule.managerTip}
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border/80 rounded-xl p-4 space-y-2">
                      <h6 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Governança & Confidencialidade
                      </h6>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Líderes de contrato (Encarregados e Supervisores) possuem acesso restrito aos seus respectivos liderados diretos. Dados estratégicos de comitê (como Calibração e Matriz Nine Box) são resguardados para garantir uma governança íntegra.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Rodapé do Modal */}
            <div className="p-3.5 sm:p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Precisa de ajuda adicional? Consulte a equipe de RH & Governança Busato.
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
                  Fechar
                </Button>
                <Button size="sm" onClick={() => handleNavigateToModule(activeModule.route)} className="text-xs font-semibold gap-1.5 shadow-sm">
                  <span>Ir para {activeModule.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
