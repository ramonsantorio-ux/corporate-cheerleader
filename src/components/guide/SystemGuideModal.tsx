import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HelpCircle, BookOpen, Compass, Activity, Users, GitMerge,
  CalendarDays, BrainCircuit, ClipboardList, CheckCircle2,
  ArrowRight, Search, Sparkles, Lightbulb, MousePointerClick,
  Layers, ExternalLink, ShieldCheck, ChevronRight, X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface GuideModule {
  id: string;
  route: string;
  category: string;
  title: string;
  shortDesc: string;
  icon: any;
  color: string;
  badgeColor: string;
  purpose: string;
  steps: {
    number: number;
    title: string;
    description: string;
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
    purpose: 'Oferecer aos diretores, gerentes e supervisores um raio-x em tempo real de todo o efetivo, movimentações recentes, presenças, aniversariantes do mês e indicadores gerais de RH.',
    steps: [
      {
        number: 1,
        title: 'Verifique os Indicadores do Topo',
        description: 'Acompanhe os cards de total de colaboradores ativos, taxa de presença média, turnover e movimentações do mês.'
      },
      {
        number: 2,
        title: 'Filtre por Departamento ou Contrato',
        description: 'Utilize o seletor no topo da barra de navegação para alternar entre "Todos os Setores" ou um contrato específico (ex: Usina, Porto, Frotas).'
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
    purpose: 'Centralizar todos os dados cadastrais, cargo, contrato, gestor imediato, histórico profissional, avaliações de desempenho, Fit Cultural e PDI de cada colaborador.',
    steps: [
      {
        number: 1,
        title: 'Localize o Colaborador',
        description: 'Digite o nome, matrícula ou cargo no campo de busca. Você também pode filtrar por departamento, cargo ou status ativo/inativo.'
      },
      {
        number: 2,
        title: 'Abra o Perfil 360°',
        description: 'Clique no card ou no nome do colaborador na lista para acessar o perfil individual completo.'
      },
      {
        number: 3,
        title: 'Navegue pelas Abas do Perfil',
        description: 'Explore as abas: "Dados Gerais", "Fit Cultural", "Potencial", "Nine Box", "PDI" e "Histórico". Cada aba possui ações específicas de gestão.'
      },
      {
        number: 4,
        title: 'Cadastrar Novo Colaborador (RH/Admin)',
        description: 'Para admitir um novo funcionário, clique no botão azul "+ Novo Colaborador" no canto superior direito.'
      }
    ],
    buttons: [
      {
        name: 'Novo Colaborador',
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
    purpose: 'Exibir com máxima clareza a estrutura organizacional da Busato, quem responde a quem, as equipes de cada encarregado/supervisor e os níveis de liderança.',
    steps: [
      {
        number: 1,
        title: 'Navegue pela Árvore Hierárquica',
        description: 'Arraste a tela com o mouse ou use o scroll para percorrer a estrutura de cima para baixo (Diretoria ➔ Supervisores ➔ Operacional).'
      },
      {
        number: 2,
        title: 'Expandir ou Recolher Equipes',
        description: 'Clique no botão com o número de liderados ou ícone chevron em cada card de líder para abrir ou fechar sua equipe.'
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
    purpose: 'Garantir a disciplina operacional e previsibilidade dos contratos, acompanhando atestados de saúde (CID), faltas justificadas/injustificadas e o calendário anual de férias.',
    steps: [
      {
        number: 1,
        title: 'Selecione a Data ou Mês de Referência',
        description: 'Escolha a data no calendário para verificar quem esteve presente, afastado ou de folga no dia.'
      },
      {
        number: 2,
        title: 'Lançar Ocorrência ou Atestado',
        description: 'Clique em "+ Registrar Ausência", selecione o colaborador, informe o motivo (Atestado, Falta, Licença), período e anexe o comprovante.'
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
    purpose: 'O módulo central de avaliação de pessoas da Busato. Permite avaliar o Fit Cultural em 4 etapas (Autoavaliação, Gestor, Calibração e Validação), classificar talentos na Nine Box, traçar PDIs e dar feedbacks estruturados.',
    steps: [
      {
        number: 1,
        title: 'Selecione a Aba de Ação',
        description: 'Navegue entre: "Metas", "Fit Cultural", "Nine Box", "PDI" e "Feedbacks". Cada aba cumpre uma etapa do ciclo de gestão de gente.'
      },
      {
        number: 2,
        title: 'Ciclo e Link de Autoavaliação do Fit Cultural',
        description: 'Clique em "Criar Novo Ciclo" para iniciar um período semestral. Em seguida, use o botão "Gerar Link de Autoavaliação" e envie no WhatsApp do colaborador.'
      },
      {
        number: 3,
        title: 'Avaliação do Gestor e Calibração',
        description: 'Após o colaborador responder, o gestor avalia as competências de 1 a 5 (ou N/A). Em seguida, o comitê realiza a Calibração e a Validação final.'
      },
      {
        number: 4,
        title: 'Matriz Nine Box e PDI',
        description: 'Cruze os resultados de Desempenho e Potencial na matriz 9-Box para identificar Promotores, Futuros Líderes ou pontos de atenção, criando o PDI em seguida.'
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
    purpose: 'Mapear o perfil comportamental dos colaboradores para alocação assertiva de funções, identificar estilo de liderança, perfil de comunicação e necessidades de treinamento.',
    steps: [
      {
        number: 1,
        title: 'Selecione o Tipo de Assessment',
        description: 'Escolha entre Teste DISC (Dominância, Influência, Estabilidade, Conformidade), Teste de Potencial ou Avaliação Comportamental.'
      },
      {
        number: 2,
        title: 'Copie o Link e Envie ao Colaborador',
        description: 'Clique no botão "Copiar Link do Questionário" para enviar ao colaborador realizar no smartphone ou computador.'
      },
      {
        number: 3,
        title: 'Analise o Relatório de Resultados',
        description: 'Assim que finalizado, acesse o gráfico radar, os pontos fortes do perfil, estilo de liderança e orientações de feedback recomendadas.'
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

export function SystemGuideModal({ open, onOpenChange }: { open: boolean; onOpenChange: (val: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-border/80 shadow-2xl rounded-2xl h-[90vh] max-h-[800px] flex flex-col">
        {/* Header do Guia */}
        <div className="bg-gradient-to-r from-slate-900 via-primary/95 to-slate-950 text-white p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Compass className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  Manual de Treinamento
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs text-slate-300">Gestão & Operações Busato</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
                Guia de Módulos & Passo a Passo
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300/90 mt-2 max-w-2xl">
            Aprenda como funciona cada funcionalidade, descubra o que faz cada botão e veja o passo a passo prático para tirar o melhor proveito do sistema.
          </p>

          {/* Campo de Busca Rápida no Header */}
          <div className="mt-4 relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por módulo, botão ou funcionalidade..."
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
                      onClick={() => setSelectedModuleId(mod.id)}
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
                              Você está aqui
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
            <ScrollArea className="flex-1 p-5 sm:p-6">
              <div className="space-y-6 max-w-3xl">
                {/* Topo do Módulo Ativo */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${activeModule.color} shadow-xs border`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] font-semibold ${activeModule.badgeColor}`}>
                          {activeModule.category}
                        </Badge>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
                        {activeModule.title}
                      </h3>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleNavigateToModule(activeModule.route)}
                    className="gap-1.5 text-xs font-semibold shadow-xs"
                  >
                    <span>Ir para esta tela</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* 1. O que é e para que serve */}
                <div className="bg-muted/30 border border-border/70 rounded-xl p-4 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" /> Objetivo & Finalidade
                  </h4>
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                    {activeModule.purpose}
                  </p>
                </div>

                {/* 2. Passo a Passo em Cards */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Passo a Passo de Utilização
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {activeModule.steps.map((step) => (
                      <div
                        key={step.number}
                        className="bg-card border border-border/70 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs hover:border-primary/40 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                          {step.number}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-foreground">{step.title}</h5>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Guia dos Botões & Ações da Tela */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MousePointerClick className="w-4 h-4 text-blue-500" /> O que faz cada Botão desta Tela?
                  </h4>
                  <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border/60 bg-card">
                    {activeModule.buttons.map((btn, bIdx) => (
                      <div key={bIdx} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 transition-colors">
                        <div className="space-y-0.5 sm:max-w-[50%]">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            {btn.name}
                          </span>
                          <p className="text-muted-foreground text-[11px]">{btn.action}</p>
                        </div>
                        <div className="bg-primary/5 border border-primary/15 text-primary text-[11px] rounded-lg px-2.5 py-1 sm:max-w-[45%] font-medium">
                          💡 <strong>Dica:</strong> {btn.tip}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Dica de Ouro para o Gestor */}
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                      Dica de Liderança & Boas Práticas
                    </h5>
                    <p className="text-xs text-amber-950 dark:text-amber-200 mt-1 leading-relaxed">
                      {activeModule.managerTip}
                    </p>
                  </div>
                </div>
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
                <Button size="sm" onClick={() => handleNavigateToModule(activeModule.route)} className="text-xs font-semibold gap-1">
                  <span>Acessar {activeModule.title}</span>
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
