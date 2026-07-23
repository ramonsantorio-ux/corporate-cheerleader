import { Brain, CheckCircle2, AlertTriangle, User, Zap, BarChart2, Target, Lightbulb, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, CartesianGrid } from 'recharts';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBusatoLogoBase64, drawBusatoHeader, drawBusatoFooter, drawPdfBarChart, drawPdfSlider } from '@/lib/pdfLogo';

interface DiscDominant { letter: string; score: number; }
interface DiscResult { D: number; I: number; S: number; C: number; dominant: DiscDominant; }
interface MbtiResult { type: string; desc: { title: string; desc: string }; percentages: { E: number; I: number; S: number; N: number; T: number; F: number; J: number; P: number }; }
interface BigFiveResult { O: number; C: number; E: number; A: number; N: number; }

export const discDescriptions: Record<string, Record<string, unknown>> = {
  D: {
    title: 'Dominância',
    desc: 'Focado em resultados, desafios e ação rápida. Toma a liderança naturalmente e busca o controle para garantir que as metas sejam cumpridas de forma eficiente.',
    motivation: 'Impulsionado por desafios que testam sua capacidade e pela conquista de metas bem definidas. A satisfação vem da sensação de progresso, de superar obstáculos e de ver as coisas acontecerem de forma eficaz.',
    strengths: ['Tomada de decisão rápida', 'Orientação para resultados', 'Resolução prática de problemas'],
    weaknesses: ['Pode ser visto como impaciente', 'Baixa tolerância a detalhes minuciosos', 'Pode atropelar opiniões alheias'],
    communication: 'Comunicação direta, objetiva e focada no resultado. Prefere ir direto ao ponto.',
    idealEnvironment: 'Você tende a ser determinado(a), focado(a) em resolver as coisas e toma a iniciativa com confiança, buscando eficiência e ambientes com metas claras.',
    managementTips: ['Seja objetivo(a) e direto(a) na comunicação.', 'Apresente informações de forma lógica e focada em resultados.', 'Valorize sua capacidade de decisão, mas reserve espaço genuíno para o diálogo.'],
    professional: {
      concentration: 'Foca energia na entrega de resultados tangíveis e no cumprimento de metas, mas demonstra flexibilidade para ajustar prioridades se a lógica indicar.',
      planning: 'Prefere um planejamento pragmático, direto ao ponto e orientado para a ação. Aberto a novas estratégias se demonstrarem potencial de resultado rápido.',
      decision: 'Toma decisões com confiança e autonomia, baseando-se em lógica e fatos disponíveis. Valoriza a agilidade no processo decisório.',
      perspective: 'Tende a ter uma visão mais prática e focada no objetivo imediato ou no problema a ser resolvido. Prefere direcionar frentes do que executar tudo.',
      interaction: 'Interage de forma funcional e orientada a objetivos. Constrói relacionamentos profissionais baseados em competência mútua.',
      organization: 'Prefere autonomia para gerenciar suas tarefas à sua maneira. Toma a iniciativa na organização para aumentar a eficiência.',
      pace: 'Adapta-se bem a um ritmo de trabalho dinâmico e orientado para a ação. Gosta de ver progresso rápido.',
      innovation: 'A criatividade é focada na resolução de problemas práticos e na busca por soluções eficientes para atingir metas.',
      roles: 'Potencial para funções que exigem iniciativa, foco em metas, tomada de decisão prática (ex: gestão de projetos, vendas, liderança focada em entrega).',
      development: ['Desenvolver maior paciência com processos mais lentos', 'Aprimorar a escuta ativa antes de direcionar a equipe', 'Valorizar a colaboração genuína e não apenas delegar']
    },
    academic: [
      'Cursos Técnicos/Tecnólogos: Gestão Comercial, Processos Gerenciais, Logística.',
      'Graduações: Administração, Engenharia de Produção, Economia.',
      'Direito: Com foco em resolução de conflitos ou advocacia estratégica.',
      'Cursos Livres: Liderança, Negociação Estratégica, Gestão de Projetos Ágeis.',
      'Pós-Graduação: MBA Executivo, Gestão Estratégica de Negócios.'
    ]
  },
  I: {
    title: 'Influência',
    desc: 'Comunicativo, persuasivo e focado em pessoas. Usa o entusiasmo e o otimismo para engajar a equipe e criar um ambiente de trabalho vibrante e colaborativo.',
    motivation: 'Impulsionado pelo reconhecimento, interação social e oportunidade de expressar suas ideias. A satisfação vem de inspirar os outros, de ambientes colaborativos e de ser o centro de uma equipe vibrante.',
    strengths: ['Excelente habilidade interpessoal', 'Poder de persuasão e motivação', 'Criatividade e inovação'],
    weaknesses: ['Dificuldade com organização e rotinas', 'Pode perder o foco em detalhes técnicos', 'Tende a agir pela emoção'],
    communication: 'Comunicação expressiva, animada e voltada para o engajamento emocional das pessoas.',
    idealEnvironment: 'Ambientes dinâmicos, livres de rotina excessiva, onde possa expressar suas ideias, colaborar com outros e receber reconhecimento público.',
    managementTips: ['Seja amigável e demonstre entusiasmo nas interações.', 'Permita tempo para trocas de ideias antes de entrar nos detalhes técnicos.', 'Forneça reconhecimento público e feedbacks positivos constantes.'],
    professional: {
      concentration: 'Foca energia em criar conexões, motivar pessoas e gerar visibilidade para projetos.',
      planning: 'Planejamento colaborativo e visionário. Gosta de debater ideias, mas pode perder o foco nos detalhes de execução.',
      decision: 'Decisões intuitivas e influenciadas pelo impacto que terão nas pessoas envolvidas.',
      perspective: 'Visão ampla, otimista e voltada para o futuro e para as relações humanas.',
      interaction: 'Extremamente sociável. Constrói redes de networking valiosas e resolve problemas através do diálogo.',
      organization: 'Prefere ambientes dinâmicos e menos engessados. Pode precisar de ferramentas ou suporte para manter a organização.',
      pace: 'Ritmo acelerado, enérgico e com muitas frentes abertas simultaneamente.',
      innovation: 'Alta criatividade focada no brainstorming e em soluções disruptivas que chamam a atenção.',
      roles: 'Marketing, Relações Públicas, Vendas Consultivas, Treinamento e Desenvolvimento, Gestão de Comunidades.',
      development: ['Melhorar o acompanhamento de tarefas até a conclusão', 'Basear decisões mais em dados e menos em intuição', 'Desenvolver capacidade de focar em tarefas solitárias ou rotineiras']
    },
    academic: [
      'Cursos Técnicos/Tecnólogos: Marketing, Recursos Humanos, Eventos.',
      'Graduações: Comunicação Social, Jornalismo, Relações Públicas, Psicologia.',
      'Cursos Livres: Oratória, Storytelling, Marketing Digital, Gestão de Pessoas.',
      'Pós-Graduação: Especialização em Comunicação Corporativa, Gestão de Pessoas e Liderança.'
    ]
  },
  S: {
    title: "Estabilidade",
    desc: "Paciente, leal e bom ouvinte. Busca harmonia no ambiente de trabalho, valorizando rotinas previsíveis e o suporte contínuo aos colegas de equipe.",
    motivation: 'Impulsionado por ajudar os outros, manter a harmonia e trabalhar em um ambiente seguro e estruturado. A satisfação vem da cooperação, do trabalho em equipe e de entregar resultados de forma consistente.',
    strengths: ["Confiabilidade e consistência", "Escuta empática e suporte", "Excelente jogador de equipe"],
    weaknesses: ["Resistência a mudanças bruscas", "Dificuldade em dizer \"não\"", "Pode ser excessivamente tolerante com baixo desempenho"],
    communication: "Comunicação calma, receptiva e focada em construir entendimento mútuo.",
    idealEnvironment: 'Ambientes harmoniosos, previsíveis e com processos bem definidos. Valoriza o trabalho em equipe e líderes que oferecem suporte.',
    managementTips: ['Mostre interesse genuíno pelo bem-estar e pelas opiniões.', 'Avise sobre mudanças com antecedência e explique o processo passo a passo.', 'Ofereça um ambiente seguro onde os erros sejam tratados como aprendizado.'],
    professional: {
      concentration: 'Foca na continuidade, na qualidade do suporte e no bem-estar da equipe e dos processos.',
      planning: 'Planejamento metódico, passo a passo e avesso a riscos. A segurança e previsibilidade ganham peso.',
      decision: 'Decisão moderada pela busca por consenso e análise do impacto humano.',
      perspective: 'Foco na manutenção e otimização do existente. Visão prática de longo prazo orientada à estabilidade.',
      interaction: 'Interação funcional equilibrada por uma valorização de relacionamentos estáveis e de confiança mútua.',
      organization: 'Autonomia exercida dentro de um quadro que valoriza a ordem e procedimentos claros.',
      pace: 'Ritmo dinâmico, mas desacelerado pela preferência por um fluxo de trabalho previsível e sem pressão extrema.',
      innovation: 'Abertura limitada à inovação focada em segurança e melhorias incrementais dos processos.',
      roles: 'Suporte ao Cliente, Recursos Humanos (DP), Operações, Saúde, Assistência Social, Ensino.',
      development: ['Aprender a se posicionar firmemente em conflitos', 'Aumentar a receptividade a mudanças ágeis', 'Praticar tomada de decisões autônomas com mais agilidade']
    },
    academic: [
      'Cursos Técnicos/Tecnólogos: Gestão de RH, Secretariado, Assistência Administrativa.',
      'Graduações: Psicologia, Pedagogia, Serviço Social, Enfermagem.',
      'Cursos Livres: Mediação de Conflitos, Inteligência Emocional, Atendimento ao Cliente.',
      'Pós-Graduação: Psicologia Organizacional, Gestão Escolar, Gestão de Projetos Tradicionais.'
    ]
  },
  C: {
    title: "Conformidade",
    desc: "Analítico, preciso e focado em qualidade. Age baseado em dados, lógica e regras, assegurando que o trabalho seja feito com os mais altos padrões de excelência.",
    motivation: 'Impulsionado pela precisão, qualidade e pela oportunidade de demonstrar sua expertise. A satisfação vem de resolver problemas complexos com lógica, seguir padrões de excelência e entregar um trabalho impecável.',
    strengths: ["Alta precisão e atenção aos detalhes", "Análise crítica profunda", "Forte senso de qualidade"],
    weaknesses: ["Perfeccionismo excessivo", "Tendência ao isolamento no trabalho", "Pode ser visto como muito crítico e frio"],
    communication: "Comunicação formal, baseada em fatos, números e lógica irrepreensível.",
    idealEnvironment: 'Ambientes organizados, com regras claras, expectativas bem definidas e tempo suficiente para analisar os detalhes e entregar com excelência.',
    managementTips: ['Comunique-se através de fatos, dados e evidências concretas.', 'Seja preciso e não exagere ou faça promessas vagas.', 'Dê tempo para que analisem a situação antes de exigir uma decisão imediata.'],
    professional: {
      concentration: 'Foca energia na exatidão, análise técnica e mitigação máxima de riscos e erros.',
      planning: 'Planejamento extremamente detalhado e embasado em dados concretos. Avalia todas as variáveis antes da ação.',
      decision: 'Decisão embasada unicamente na lógica. Precisa de tempo para analisar prós e contras.',
      perspective: 'Visão especialista. Busca dominar todas as variáveis técnicas e normas de um assunto.',
      interaction: 'Interação formal, baseada em fatos e discussões técnicas. Evita exposição emocional no ambiente de trabalho.',
      organization: 'Altamente organizado, cria sistemas, checklists e procedimentos rígidos para garantir a qualidade.',
      pace: 'Ritmo cauteloso e ponderado. O prazo é negociável, mas a qualidade e a exatidão não são.',
      innovation: 'Inovação metodológica focada em otimização de sistemas, segurança da informação e redução de falhas.',
      roles: 'Engenharia, TI, Contabilidade, Finanças, Análise de Dados, Qualidade, Compliance, Jurídico.',
      development: ['Não deixar o perfeccionismo paralisar entregas', 'Melhorar a diplomacia ao apontar erros dos colegas', 'Aceitar que nem sempre haverá 100% de previsibilidade']
    },
    academic: [
      'Cursos Técnicos/Tecnólogos: Análise de Sistemas, Contabilidade, Automação.',
      'Graduações: Ciência da Computação, Engenharia, Estatística, Ciências Contábeis.',
      'Cursos Livres: Data Science, Análise de Dados, Certificações de Qualidade (Six Sigma).',
      'Pós-Graduação: Finanças Corporativas, Auditoria, Engenharia de Software.'
    ]
  }
};

export const mbtiDescriptions: Record<string, any> = {
  ENTJ: { title: "Comandante", desc: "Líderes natos com visão estratégica e alto poder de execução.", traits: ["Decisivo", "Estratégico", "Ambicioso"] },
  ENTP: { title: "Debatedor",  desc: "Pensadores criativos que adoram desafiar ideias estabelecidas.", traits: ["Criativo", "Analítico", "Debates"] },
  ENFJ: { title: "Protagonista", desc: "Carismáticos e inspiradores, focados em desenvolver as pessoas.", traits: ["Empático", "Inspirador", "Comunicativo"] },
  ENFP: { title: "Campeão", desc: "Entusiastas criativos com uma energia contagiante.", traits: ["Entusiasmado", "Criativo", "Sociável"] },
  ESTJ: { title: "Executivo", desc: "Guardiões da tradição, comprometidos com ordem e resultados.", traits: ["Organizado", "Direto", "Confiável"] },
  ESTP: { title: "Empreendedor", desc: "Enérgicos e práticos, adoram ação e desafios imediatos.", traits: ["Dinâmico", "Ousado", "Adaptável"] },
  ESFJ: { title: "Cônsul", desc: "Cuidadosos e sociáveis, constroem harmonia e comunidade.", traits: ["Generoso", "Sociável", "Leal"] },
  ESFP: { title: "Animador", desc: "Espontâneos e entusiasmados, tornam tudo mais divertido.", traits: ["Divertido", "Espontâneo", "Sociável"] },
  INTJ: { title: "Arquiteto", desc: "Pensadores independentes com planos ambiciosos de longo prazo.", traits: ["Analítico", "Estratégico", "Independente"] },
  INTP: { title: "Pensador",  desc: "Inventores inovadores com sede insaciável de conhecimento.", traits: ["Lógico", "Inovador", "Curioso"] },
  INFJ: { title: "Advogado",  desc: "Idealistas raros, comprometidos com seu sistema de valores.", traits: ["Visionário", "Empático", "Reservado"] },
  INFP: { title: "Mediador",  desc: "Idealistas poéticos, guiados por seus valores profundos.", traits: ["Criativo", "Sensível", "Idealista"] },
  ISTJ: { title: "Logístico", desc: "Confiáveis e metódicos, com forte ética de trabalho.", traits: ["Responsável", "Detalhista", "Tradicional"] },
  ISTP: { title: "Virtuoso",  desc: "Experimentadores ousados que adoram resolver problemas práticos.", traits: ["Habilidoso", "Racional", "Reservado"] },
  ISFJ: { title: "Defensor",  desc: "Dedicados e calorosos, sempre prontos para proteger os outros.", traits: ["Dedicado", "Humilde", "Confiável"] },
  ISFP: { title: "Aventureiro", desc: "Artistas flexíveis, sempre prontos para explorar e sentir.", traits: ["Artístico", "Gentil", "Adaptável"] },
};

export const bigFiveDetails: Record<string, any> = {
  O: {
    label: 'Abertura à Experiência', color: 'bg-violet-500', icon: '💡',
    high: { title: 'Visionário e Inovador', desc: 'Indivíduo criativo, com facilidade para propor soluções disruptivas e pensar fora da caixa.', impact: 'Pode atuar como um catalisador de transformações, mas pode se dispersar em rotinas ou processos muito rígidos.' },
    mid: { title: 'Pragmático Adaptável', desc: 'Equilibra bem a inovação com o uso de métodos já validados. Inova quando necessário, mas valoriza a previsibilidade.', impact: 'Traz estabilidade para projetos, não sendo resistente à mudança, mas também não abraçando o caos.' },
    low: { title: 'Orientado à Tradição', desc: 'Prefere processos estruturados, rotinas claras e métodos testados. Tem grande foco na execução prática e no presente.', impact: 'Excelente para garantir a estabilidade operacional, mas pode apresentar forte resistência a mudanças organizacionais.' }
  },
  C: {
    label: 'Conscienciosidade', color: 'bg-blue-500', icon: '🎯',
    high: { title: 'Metódico e Focado', desc: 'Altamente disciplinado, organizado e movido a metas. Possui forte senso de dever e foco extremo em qualidade.', impact: 'Ideal para gestão de processos críticos e liderança de entregas. Contudo, pode tender ao perfeccionismo limitante.' },
    mid: { title: 'Organizado e Flexível', desc: 'Mantém um bom nível de organização para atingir resultados, sem se prender a regras se isso atrasar o projeto.', impact: 'Apresenta um excelente equilíbrio entre o foco na meta e a capacidade ágil de recalcular a rota.' },
    low: { title: 'Espontâneo e Ágil', desc: 'Trabalha melhor em cenários abertos e sem burocracia. É flexível, improvisador e altamente focado no curto prazo.', impact: 'Ótimo para atuar em crises ou startups dinâmicas, mas pode falhar no acompanhamento e no seguimento de regras longas.' }
  },
  E: {
    label: 'Extroversão', color: 'bg-yellow-500', icon: '🤝',
    high: { title: 'Articulador Social', desc: 'Ganha energia nas interações, é comunicativo, assertivo e busca naturalmente posições de influência.', impact: 'Excelente para papéis comerciais, networking e motivação de equipes. Pode, porém, ofuscar membros mais quietos.' },
    mid: { title: 'Ambivertido Estratégico', desc: 'Adapta-se ao contexto: assume o protagonismo verbal quando necessário, mas atua de forma analítica quando o momento exige.', impact: 'Serve como a ponte de comunicação perfeita entre áreas altamente extrovertidas e times profundamente técnicos.' },
    low: { title: 'Analítico e Independente', desc: 'Prefere trabalhos de concentração individual. Ouve ativamente e processa internamente antes de se posicionar.', impact: 'Ideal para funções de alta profundidade técnica, estratégica ou analítica. Pode precisar de incentivo para debates abertos.' }
  },
  A: {
    label: 'Amabilidade', color: 'bg-green-500', icon: '❤️',
    high: { title: 'Acolhedor e Conciliador', desc: 'Altamente empático e voltado à colaboração. Prioriza a harmonia da equipe e a construção de consenso.', impact: 'Peça fundamental para a retenção de talentos e o clima organizacional. Pode ter dificuldade em tomar decisões impopulares.' },
    mid: { title: 'Colaborador Orientado a Resultados', desc: 'Trabalha bem em equipe, mas não hesita em criar atritos construtivos se achar que a entrega será prejudicada.', impact: 'O balanço ideal: mantém o bom clima, mas possui a firmeza necessária para blindar o interesse da empresa.' },
    low: { title: 'Questionador e Competitivo', desc: 'Coloca a lógica e os resultados acima da harmonia social. Tem uma postura direta, pragmática e firme.', impact: 'Crucial para cenários de reestruturação, negociações agressivas e auditoria, porém pode gerar desgaste no clima da equipe.' }
  },
  N: {
    label: 'Neuroticismo', color: 'bg-red-500', icon: '🛡️',
    high: { title: 'Alerta e Antecipador', desc: 'Possui um alto radar para riscos e problemas potenciais. Extremamente reativo a mudanças e ameaças no ambiente.', impact: 'Ótimo para setores de Compliance, Segurança ou Gestão de Risco, desde que a liderança atue para mitigar seu estresse ou burnout.' },
    mid: { title: 'Estabilidade Calibrada', desc: 'Mantém a tranquilidade na maioria das situações diárias, reagindo de forma proporcional a crises.', impact: 'Consegue absorver a pressão normal do dia a dia corporativo sem perder o foco na entrega.' },
    low: { title: 'Resiliente e Frio', desc: 'Extremamente calmo sob pressão intensa. Lida com urgências, cobranças e incertezas de forma puramente objetiva.', impact: 'O perfil ideal para lidar com situações de crise, alta pressão e incerteza, embora possa parecer pouco empático frente ao caos.' }
  }
};


export function DiscReport({ resultScreen, employeeName = "Colaborador" }: { resultScreen: DiscResult, employeeName?: string }) {
  const dom = resultScreen.dominant;
  const info = discDescriptions[dom.letter];
  const colorMap: Record<string, string> = { D: 'bg-red-500', I: 'bg-yellow-500', S: 'bg-green-500', C: 'bg-blue-500' };
  const hexMap: Record<string, string> = { D: '#ef4444', I: '#eab308', S: '#22c55e', C: '#3b82f6' };

  // Secundário (maior após o dominante)
  const sorted = [
    { l: 'D', v: resultScreen.D, n: 'Dominância' },
    { l: 'I', v: resultScreen.I, n: 'Influência' },
    { l: 'S', v: resultScreen.S, n: 'eStabilidade' },
    { l: 'C', v: resultScreen.C, n: 'Conformidade' }
  ].sort((a, b) => b.v - a.v);
  const sec = sorted[1];

  const radarData = [
    { subject: 'Dominância', A: resultScreen.D, fullMark: 100 },
    { subject: 'Influência', A: resultScreen.I, fullMark: 100 },
    { subject: 'eStabilidade', A: resultScreen.S, fullMark: 100 },
    { subject: 'Conformidade', A: resultScreen.C, fullMark: 100 },
  ];

  const calcTrend = (val: number) => Math.max(0, Math.min(100, Math.round(50 + (val / 56) * 50)));

  // Puxa as diferenças reais se o teste for Ipsativo (rawDiffs existe), caso contrário estima pelo % antigo
  const getD = () => resultScreen.rawDiffs ? resultScreen.rawDiffs.D : (resultScreen.D - 50);
  const getI = () => resultScreen.rawDiffs ? resultScreen.rawDiffs.I : (resultScreen.I - 50);
  const getS = () => resultScreen.rawDiffs ? resultScreen.rawDiffs.S : (resultScreen.S - 50);
  const getC = () => resultScreen.rawDiffs ? resultScreen.rawDiffs.C : (resultScreen.C - 50);

  const trends = [
    { label: 'Foco Principal', left: 'Pessoas & Relacionamentos', right: 'Tarefas & Resultados', val: calcTrend((getD() + getC()) - (getI() + getS())) },
    { label: 'Ritmo de Trabalho', left: 'Calmo & Consistente', right: 'Rápido & Intenso', val: calcTrend((getD() + getI()) - (getS() + getC())) },
    { label: 'Tomada de Decisão', left: 'Colaborativa & Ponderada', right: 'Autônoma & Direta', val: calcTrend((getD() + getC()) - (getI() + getS())) }, // Aproximação baseada em Tarefa vs Pessoa
    { label: 'Estilo de Comunicação', left: 'Expressiva/Persuasiva', right: 'Direta/Objetiva', val: calcTrend((getD() * 2) - (getI() * 2)) }, // Foco na polaridade D vs I
    { label: 'Abordagem a Mudanças', left: 'Busca Estabilidade', right: 'Busca Flexibilidade/Ação', val: calcTrend((getD() + getI()) - (getS() + getC())) },
    { label: 'Organização e Planej.', left: 'Adaptável/Espontânea', right: 'Estruturada/Metódica', val: calcTrend((getC() * 2) - (getI() * 2)) },
    { label: 'Interação Social', left: 'Reservada/Formal', right: 'Expansiva/Informal', val: calcTrend((getI() * 2) - (getC() * 2)) },
    { label: 'Abordagem a Riscos', left: 'Cautelosa/Segura', right: 'Ousada/Experimental', val: calcTrend((getD() + getI()) - (getC() + getS())) },
  ];

  const exportPdf = () => {
    const doc = new jsPDF();
    getBusatoLogoBase64().then(logo => {
      let currentY = drawBusatoHeader(doc, logo, "Relatório Premium DISC", "Análise Comportamental Estratégica");
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Perfil Primário: ${dom.letter} - ${info.title}`, 14, currentY + 10);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Perfil Secundário de Apoio: ${sec.l} - ${sec.n}`, 14, currentY + 18);
      
      let barY = currentY + 30;
      barY = drawPdfBarChart(doc, "Dominância (D)", resultScreen.D, barY, { color: [239, 68, 68] });
      barY = drawPdfBarChart(doc, "Influência (I)", resultScreen.I, barY, { color: [234, 179, 8] });
      barY = drawPdfBarChart(doc, "Estabilidade (S)", resultScreen.S, barY, { color: [34, 197, 94] });
      barY = drawPdfBarChart(doc, "Conformidade (C)", resultScreen.C, barY, { color: [59, 130, 246] });
      
      currentY = barY + 5;

      doc.setFont("helvetica", "bold");
      doc.text("Sumário Executivo", 14, currentY + 5);
      doc.setFont("helvetica", "normal");
      const splitDesc = doc.splitTextToSize(info.desc, 180);
      doc.text(splitDesc, 14, currentY + 13);

      currentY += 13 + (splitDesc.length * 5);

      doc.setFont("helvetica", "bold");
      doc.text("Estilo de Comunicação", 14, currentY + 10);
      doc.setFont("helvetica", "normal");
      const splitComm = doc.splitTextToSize(info.communication, 180);
      doc.text(splitComm, 14, currentY + 18);

      // Nova Página: Tendências Comportamentais (Sliders)
      doc.addPage();
      currentY = drawBusatoHeader(doc, logo, "Relatório Premium DISC", "Tendências Comportamentais");
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Polaridade e Equilíbrio de Energia", 14, currentY + 10);
      
      let sliderY = currentY + 25;
      trends.forEach(t => {
        sliderY = drawPdfSlider(doc, t.left, t.right, t.val, 100 - t.val, sliderY);
      });

      // Nova Página: Análise Profissional
      doc.addPage();
      currentY = drawBusatoHeader(doc, logo, "Relatório Premium DISC", "Análise Profissional Completa");
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Análise Profissional - ${dom.letter} (${info.title})`, 14, currentY + 10);
      
      const profItems = [
        ["Concentração e Objetivos", info.professional.concentration],
        ["Planejamento Estratégico", info.professional.planning],
        ["Tomada de Decisão", info.professional.decision],
        ["Perspectiva e Foco", info.professional.perspective],
        ["Ritmo de Trabalho", info.professional.pace],
        ["Organização", info.professional.organization]
      ];

      autoTable(doc, {
        startY: currentY + 20,
        body: profItems,
        theme: 'grid',
        styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 130 } }
      });

      doc.setFont("helvetica", "bold");
      doc.text("Áreas de Desenvolvimento Profissional", 14, (doc as any).lastAutoTable.finalY + 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      info.professional.development.forEach((dev: string, idx: number) => {
        doc.text(`• ${dev}`, 14, (doc as any).lastAutoTable.finalY + 25 + (idx * 6));
      });

      // Nova Página: Formação Acadêmica e Perfil Secundário
      doc.addPage();
      currentY = drawBusatoHeader(doc, logo, "Relatório Premium DISC", "Formação e Perfil Secundário");
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`A Força do Perfil Secundário: ${sec.l}`, 14, currentY + 10);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const secInfo = discDescriptions[sec.l];
      const splitSec = doc.splitTextToSize(`Seu perfil secundário (${sec.l}) atua como um equilibrador. Enquanto o perfil primário direciona suas ações, a influência secundária adiciona a seguinte camada: ${secInfo.desc}`, 180);
      doc.text(splitSec, 14, currentY + 20);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Sugestões Acadêmicas e de Carreira", 14, currentY + 35);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      let listY = currentY + 45;
      info.academic.forEach((ac: string) => {
        const splitAc = doc.splitTextToSize(`• ${ac}`, 180);
        doc.text(splitAc, 14, listY);
        listY += splitAc.length * 6; // Avança proporcionalmente às linhas que a sugestão ocupou
      });

      drawBusatoFooter(doc);
      doc.save(`DISC_${employeeName.replace(/\s+/g, '_')}.pdf`);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-xl border border-primary/20">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2"><Brain className="w-7 h-7 text-primary" /> Relatório Executivo DISC</h2>
          <p className="text-sm text-muted-foreground mt-1">Análise exclusiva de Perfil Comportamental e Dinâmica de Energia.</p>
        </div>
        <Button onClick={exportPdf} className="bg-primary text-primary-foreground shadow-md hover:scale-105 transition-transform">
          <Download className="w-4 h-4 mr-2" /> Baixar PDF Oficial
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["resumo", "tendencias", "executivo"]} className="w-full space-y-4">
        
        {/* === RESUMO E GRÁFICOS === */}
        <AccordionItem value="resumo" className="glass-card rounded-xl border-none overflow-hidden shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:bg-muted/30 hover:no-underline data-[state=open]:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 font-bold text-lg"><BarChart2 className="w-5 h-5 text-primary" /> Destaques do Perfil</div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-6 border-t border-border/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="bg-card rounded-xl border border-border/50 p-5 flex flex-col h-full shadow-sm">
                <h3 className="font-bold text-sm text-center mb-4 uppercase tracking-wider text-muted-foreground">Intensidade do Perfil (%)</h3>
                <div className="flex-1 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sorted} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="l" tick={{fontWeight: 'bold'}} />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                      <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                        {sorted.map((entry, index) => <Cell key={`cell-${index}`} fill={hexMap[entry.l]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border/50 p-5 flex flex-col h-full shadow-sm">
                <h3 className="font-bold text-sm text-center mb-4 uppercase tracking-wider text-muted-foreground">Sua Dinâmica (Radar)</h3>
                <div className="flex-1 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} />
                      <Radar name="Energia" dataKey="A" stroke={hexMap[dom.letter]} fill={hexMap[dom.letter]} fillOpacity={0.4} />
                      <RechartsTooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            <div className="mt-6 bg-muted/30 p-6 rounded-xl border border-border/50">
              <h3 className="font-bold text-lg mb-4 text-primary">Resumo do Perfil</h3>
              <p className="text-sm text-foreground/90 leading-relaxed mb-4">
                Seu perfil DISC é predominantemente <strong>{dom.letter} ({info.title})</strong>, com uma influência secundária de <strong>{sec.l} ({discDescriptions[sec.l].title})</strong>.
              </p>
              <div className="space-y-4">
                <div className="text-sm text-foreground/80 leading-relaxed border-l-4 border-primary pl-4">
                  <strong>Como perfil {dom.letter} dominante, você tende a ser motivado(a) por:</strong><br />
                  {info.motivation}
                </div>
                <div className="text-sm text-foreground/80 leading-relaxed border-l-4 border-muted-foreground pl-4">
                  <strong>Sua influência secundária {sec.l} pode adicionar traços relacionados à motivação por:</strong><br />
                  {discDescriptions[sec.l].motivation}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* === TENDÊNCIAS COMPORTAMENTAIS === */}
        <AccordionItem value="tendencias" className="glass-card rounded-xl border-none overflow-hidden shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:bg-muted/30 hover:no-underline data-[state=open]:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 font-bold text-lg"><Target className="w-5 h-5 text-primary" /> Tendências Comportamentais (Sliders)</div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-6 border-t border-border/50">
            <div className="space-y-6">
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                <span className="w-1/3 text-right">Extremo Esquerdo</span>
                <span className="w-1/3 text-center">Centro (Equilíbrio)</span>
                <span className="w-1/3 text-left">Extremo Direito</span>
              </div>
              {trends.map(t => (
                <div key={t.label} className="flex flex-col sm:flex-row items-center gap-4 group">
                  <div className="w-full sm:w-1/4 text-center sm:text-right">
                    <p className="text-xs font-bold">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">{t.left}</p>
                  </div>
                  <div className="w-full sm:w-2/4 relative h-4 bg-muted rounded-full overflow-visible flex items-center">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border z-0"></div>
                    <div 
                      className="absolute w-5 h-5 bg-primary rounded-full shadow-md z-10 top-1/2 -translate-y-1/2 -translate-x-1/2 border-2 border-background transition-all group-hover:scale-125"
                      style={{ left: `${t.val}%` }}
                    />
                  </div>
                  <div className="w-full sm:w-1/4 text-center sm:text-left">
                    <p className="text-[10px] text-muted-foreground mt-3 sm:mt-0">{t.right}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-8">Este diagrama ilustra suas preferências situacionais. O marcador indica a polarização (ou equilíbrio) de sua energia.</p>
          </AccordionContent>
        </AccordionItem>

        {/* === SUMÁRIO EXECUTIVO === */}
        <AccordionItem value="executivo" className="glass-card rounded-xl border-none overflow-hidden shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:bg-muted/30 hover:no-underline data-[state=open]:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 font-bold text-lg"><FileText className="w-5 h-5 text-primary" /> Sumário Executivo & Relacionamento</div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-6 border-t border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-success/5 border border-success/20 p-5 rounded-xl">
                <h3 className="font-bold text-success flex items-center gap-2 mb-3"><CheckCircle2 className="w-5 h-5"/> Principais Forças</h3>
                <ul className="space-y-2 text-sm text-foreground/80">
                  {info.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2"><span className="mt-1 block w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" /> {s}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-warning/5 border border-warning/20 p-5 rounded-xl">
                <h3 className="font-bold text-warning flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5"/> Potenciais Desafios</h3>
                <ul className="space-y-2 text-sm text-foreground/80">
                  {info.weaknesses.map((w: string, i: number) => (
                    <li key={i} className="flex items-start gap-2"><span className="mt-1 block w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" /> {w}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-muted/20 border border-border/50 p-5 rounded-xl md:col-span-2">
                <h3 className="font-bold text-primary mb-2">Estilo de Comunicação</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{info.communication}</p>
              </div>

              <div className="bg-muted/20 border border-border/50 p-5 rounded-xl md:col-span-2">
                <h3 className="font-bold text-primary mb-2">Ambiente Ideal (Tendência)</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{info.idealEnvironment}</p>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl md:col-span-2">
                <h3 className="font-bold text-primary mb-3">Dicas para Interação/Gestão</h3>
                <ul className="space-y-2 text-sm text-foreground/80">
                  {info.managementTips.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-2"><span className="mt-1 block w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> {tip}</li>
                  ))}
                </ul>
              </div>

            </div>
          </AccordionContent>
        </AccordionItem>



        {/* === ANÁLISE PROFISSIONAL (DEEP DIVE) === */}
        <AccordionItem value="prof" className="glass-card rounded-xl border-none overflow-hidden shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:bg-muted/30 hover:no-underline data-[state=open]:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 font-bold text-lg"><Target className="w-5 h-5 text-primary" /> Análise Profissional Completa</div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-6 border-t border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Concentração e Objetivos', text: info.professional.concentration },
                { title: 'Planejamento e Estratégia', text: info.professional.planning },
                { title: 'Tomada de Decisão', text: info.professional.decision },
                { title: 'Perspectiva e Especialização', text: info.professional.perspective },
                { title: 'Dinâmica de Interação Social', text: info.professional.interaction },
                { title: 'Organização e Administração', text: info.professional.organization },
                { title: 'Ritmo e Fluxo de Trabalho', text: info.professional.pace },
                { title: 'Inovação e Criatividade', text: info.professional.innovation }
              ].map(item => (
                <div key={item.title} className="p-4 bg-muted/20 border border-border/50 rounded-lg">
                  <h4 className="font-bold text-sm text-primary mb-2">{item.title}</h4>
                  <p className="text-xs text-foreground/80 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-5 bg-primary/5 border border-primary/20 rounded-xl">
              <h4 className="font-bold text-primary mb-3">PDI (Áreas de Desenvolvimento Profissional)</h4>
              <ul className="space-y-2 text-sm">
                {info.professional.development.map((dev: string, i: number) => (
                  <li key={i} className="flex items-start gap-2"><span className="mt-1 block w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> {dev}</li>
                ))}
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* === INFLUÊNCIA SECUNDÁRIA === */}
        <AccordionItem value="secundaria" className="glass-card rounded-xl border-none overflow-hidden shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:bg-muted/30 hover:no-underline data-[state=open]:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 font-bold text-lg"><Brain className="w-5 h-5 text-purple-500" /> A Força da Influência Secundária</div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-6 border-t border-border/50">
            <div className="bg-purple-500/5 border border-purple-500/20 p-6 rounded-xl">
              <h3 className="font-bold text-purple-600 mb-2">Perfil Secundário: {sec.l} ({discDescriptions[sec.l].title})</h3>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                O seu perfil secundário age como um moderador e equilibrador das suas tendências naturais mais fortes ({dom.letter}). 
                Enquanto o seu perfil dominante busca <strong>{info.title.toLowerCase()}</strong>, a sua influência secundária traz a seguinte camada adicional para a sua personalidade:
              </p>
              <div className="p-4 bg-background rounded-lg border-l-4 border-purple-500 text-sm shadow-sm">
                {discDescriptions[sec.l].desc}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* === SUGESTÕES ACADÊMICAS === */}
        <AccordionItem value="academica" className="glass-card rounded-xl border-none overflow-hidden shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:bg-muted/30 hover:no-underline data-[state=open]:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 font-bold text-lg"><FileText className="w-5 h-5 text-amber-500" /> Formação & Sugestões de Carreira</div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-6 border-t border-border/50">
            <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-xl">
              <p className="text-sm text-foreground/80 leading-relaxed mb-6">
                Com base no seu pragmatismo, foco e características de <strong>{info.title}</strong>, considere áreas e cursos que permitam a aplicação das suas forças naturais:
              </p>
<div className="space-y-3">
                {info.academic.map((ac: string, i: number) => {
                  const [boldPart, restPart] = ac.split(': ');
                  return (
                    <div key={i} className="p-3 bg-background rounded-lg shadow-sm border border-border/50 text-sm">
                      <strong className="text-amber-600 block mb-1">{boldPart}:</strong>
                      <span className="text-foreground/80">{restPart}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-4 bg-muted/20 border-l-4 border-l-muted-foreground rounded-r-lg text-xs text-muted-foreground">
                <strong>Nota Importante:</strong> O DISC oferece insights valiosos sobre tendências, mas não define capacidades intelectuais ou interesses exclusivos. As escolhas de carreira devem ser multifatoriais.
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}

export function MbtiReport({ resultScreen }: { resultScreen: MbtiResult }) {
  const type = resultScreen.type;
  const info = resultScreen.desc;
  const p = resultScreen.percentages || { E: 50, I: 50, S: 50, N: 50, T: 50, F: 50, J: 50, P: 50 };

  const exportPdf = () => {
    const doc = new jsPDF();
    getBusatoLogoBase64().then(logo => {
      let currentY = drawBusatoHeader(doc, logo, "Relatório Premium MBTI", "Mapeamento Cognitivo e Comportamental");
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Arquétipo MBTI: ${type} - ${info?.title || ''}`, 14, currentY + 10);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const splitDesc = doc.splitTextToSize(info?.desc || '', 180);
      doc.text(splitDesc, 14, currentY + 20);

      currentY += 20 + (splitDesc.length * 5);

      let sliderY = currentY + 15;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Dimensões Cognitivas", 14, sliderY);
      
      sliderY += 10;
      sliderY = drawPdfSlider(doc, "Extroversão (E)", "Introversão (I)", p.E, p.I, sliderY, { leftColor: [79, 70, 229], rightColor: [203, 213, 225] });
      sliderY = drawPdfSlider(doc, "Sensação (S)", "Intuição (N)", p.S, p.N, sliderY, { leftColor: [79, 70, 229], rightColor: [203, 213, 225] });
      sliderY = drawPdfSlider(doc, "Pensamento (T)", "Sentimento (F)", p.T, p.F, sliderY, { leftColor: [79, 70, 229], rightColor: [203, 213, 225] });
      sliderY = drawPdfSlider(doc, "Julgamento (J)", "Percepção (P)", p.J, p.P, sliderY, { leftColor: [79, 70, 229], rightColor: [203, 213, 225] });

      doc.setFont("helvetica", "bold");
      doc.text("Aplicação Prática no Trabalho", 14, sliderY + 10);
      doc.setFont("helvetica", "normal");
      const splitApp = doc.splitTextToSize(`Os perfis ${type} geralmente buscam ambientes onde possam aplicar seus pontos fortes naturais. Trazem diversidade cognitiva à equipe, influenciando o formato de tomada de decisão e resolução de problemas operacionais.`, 180);
      doc.text(splitApp, 14, sliderY + 18);

      drawBusatoFooter(doc);
      doc.save(`MBTI_${type}.pdf`);
    });
  };

  const AxisBar = ({ label1, val1, label2, val2 }: { label1: string; val1: number; label2: string; val2: number }) => (
    <div className="mb-4">
      <div className="flex justify-between text-xs font-bold mb-1">
        <span>{label1} ({val1}%)</span>
        <span>{label2} ({val2}%)</span>
      </div>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
        <div style={{ width: `${val1}%` }} className="bg-indigo-500 h-full" />
        <div style={{ width: `${val2}%` }} className="bg-slate-300 dark:bg-slate-700 h-full" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-gradient-to-r from-indigo-500/10 to-transparent p-6 rounded-xl border border-indigo-500/20">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2"><User className="w-7 h-7 text-indigo-500" /> Relatório Executivo MBTI</h2>
          <p className="text-sm text-muted-foreground mt-1">Mapeamento de Arquétipos e Dinâmica Cognitiva Avançada.</p>
        </div>
        <Button onClick={exportPdf} className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:scale-105 transition-transform">
          Baixar PDF Oficial
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-card rounded-xl p-6 border-t-4 border-t-indigo-500 flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-6xl font-black text-indigo-500 drop-shadow-md mb-2">{type}</span>
          <h3 className="text-xl font-bold uppercase tracking-wide">{info?.title}</h3>
          <p className="text-xs text-muted-foreground mt-2">{info?.traits?.join(' • ')}</p>
        </div>

        <div className="glass-card rounded-xl p-6 shadow-sm md:col-span-2">
          <h3 className="font-bold text-indigo-500 mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5"/> Espectros Cognitivos</h3>
          <AxisBar label1="Extroversão (E)" val1={p.E} label2="Introversão (I)" val2={p.I} />
          <AxisBar label1="Sensação (S)" val1={p.S} label2="Intuição (N)" val2={p.N} />
          <AxisBar label1="Pensamento (T)" val1={p.T} label2="Sentimento (F)" val2={p.F} />
          <AxisBar label1="Julgamento (J)" val1={p.J} label2="Percepção (P)" val2={p.P} />
        </div>

      </div>

      <div className="glass-card p-6 rounded-xl shadow-sm space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2"><Brain className="w-5 h-5 text-indigo-500"/> Análise Profunda do Arquétipo</h3>
        <p className="text-sm text-foreground/80 leading-relaxed border-l-4 border-indigo-500 pl-4 bg-muted/20 p-4 rounded-r-lg">
          {info?.desc || "Perfil com forte foco em análise lógica e resolução sistêmica."}
        </p>
        
        <div className="bg-indigo-500/5 p-5 rounded-xl border border-indigo-500/20 mt-4">
          <h4 className="font-bold text-indigo-600 flex items-center gap-2 mb-2"><Zap className="w-4 h-4"/> Dinâmica de Trabalho e Liderança</h4>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Profissionais do arquétipo <strong className="uppercase">{type}</strong> aplicam sua energia predominantemente de forma {p.E > p.I ? 'externa (foco em ação e pessoas)' : 'interna (foco em reflexão e ideias)'}. 
            Eles processam informações focando no {p.S > p.N ? 'concreto e imediato' : 'futuro e nas possibilidades'} e tomam decisões utilizando prioritariamente {p.T > p.F ? 'lógica impessoal' : 'valores e empatia'}. 
            Seu estilo de vida no trabalho é marcado por {p.J > p.P ? 'estrutura e planejamento rígido' : 'flexibilidade e adaptação a urgências'}.
          </p>
        </div>
      </div>
    </div>
  );
}

export function BigFiveReport({ resultScreen }: { resultScreen: BigFiveResult }) {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black flex items-center justify-center gap-2 mb-2"><BarChart2 className="w-6 h-6 text-primary" /> Relatório Executivo: Big Five</h2>
        <p className="text-muted-foreground">Análise profunda de tendências psicológicas, engajamento e impacto organizacional.</p>
      </div>

      {['O', 'C', 'E', 'A', 'N'].map(key => {
        const trait = bigFiveDetails[key];
        const score = resultScreen[key];
        const level = score >= 65 ? 'high' : score <= 40 ? 'low' : 'mid';
        const result = trait[level];

        return (
          <div key={key} className="glass-card rounded-xl p-6 border-l-4" style={{ borderLeftColor: `var(--${trait.color.split('-')[1]}-500, #ccc)` }}>
            <div className="flex flex-col md:flex-row gap-6">
              
              <div className="md:w-1/3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-foreground text-lg">{trait.icon} {trait.label}</span>
                  <span className="font-black text-2xl">{score}%</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden mb-2">
                  <motion.div initial={{width:0}} animate={{width:`${score}%`}} transition={{duration:1}} className={`h-full rounded-full ${trait.color}`} />
                </div>
                <div className="flex justify-between text-[10px] uppercase text-muted-foreground font-bold px-1">
                  <span>Baixo</span>
                  <span>Médio</span>
                  <span>Alto</span>
                </div>
              </div>

              <div className="md:w-2/3 space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase text-primary tracking-wider mb-1">Classificação do Perfil</h3>
                  <p className="text-xl font-black text-foreground">{result.title}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-sm text-foreground/80 leading-relaxed border border-border/50">
                  <strong className="text-primary block mb-1">Síntese Analítica:</strong>
                  {result.desc}
                </div>
                <div className="bg-primary/5 p-4 rounded-lg text-sm text-primary-foreground/90 border border-primary/20">
                  <strong className="text-primary flex items-center gap-1 mb-1"><Zap className="w-4 h-4"/> Impacto Organizacional:</strong>
                  {result.impact}
                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}
