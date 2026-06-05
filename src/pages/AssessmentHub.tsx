import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, CheckCircle2, ArrowLeft, Send, BarChart2,
  ChevronRight, ChevronLeft, User, Zap, FlipHorizontal, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import DiscTest from './DiscTest';
import MbtiTest from './MbtiTest';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  DISC â€“ 30 perguntas
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const discQuestions = [
  { id: 1, text: "Como vocÃª age sob pressÃ£o?", options: [{ letter: "D", text: "Tomo a lideranÃ§a e resolvo rapidamente." }, { letter: "I", text: "Tento manter a equipe motivada e unida." }, { letter: "S", text: "Sigo o planejamento e mantenho a calma." }, { letter: "C", text: "Analiso os dados antes de tomar qualquer decisÃ£o." }] },
  { id: 2, text: "Em projetos em equipe, vocÃª costuma:", options: [{ letter: "D", text: "Delegar tarefas e focar no prazo." }, { letter: "I", text: "Incentivar as ideias e a comunicaÃ§Ã£o." }, { letter: "S", text: "Apoiar os colegas e garantir harmonia." }, { letter: "C", text: "Garantir que as regras e padrÃµes sejam seguidos." }] },
  { id: 3, text: "Seu maior motivador no trabalho Ã©:", options: [{ letter: "D", text: "Desafios e resultados." }, { letter: "I", text: "Reconhecimento e interaÃ§Ã£o." }, { letter: "S", text: "Estabilidade e rotina clara." }, { letter: "C", text: "PrecisÃ£o e qualidade." }] },
  { id: 4, text: "Quando enfrenta um problema complexo, vocÃª:", options: [{ letter: "D", text: "Enfrenta de frente com soluÃ§Ãµes ousadas." }, { letter: "I", text: "Discute com outras pessoas para ter ideias." }, { letter: "S", text: "Busca mÃ©todos que jÃ¡ funcionaram antes." }, { letter: "C", text: "Investiga a fundo todas as variÃ¡veis." }] },
  { id: 5, text: "Na comunicaÃ§Ã£o, vocÃª prefere:", options: [{ letter: "D", text: "Ser direto e objetivo." }, { letter: "I", text: "Ser expressivo e amigÃ¡vel." }, { letter: "S", text: "Ser paciente e bom ouvinte." }, { letter: "C", text: "Ser detalhista e baseado em fatos." }] },
  { id: 6, text: "Seu estilo de lideranÃ§a Ã© mais:", options: [{ letter: "D", text: "Comandante e exigente." }, { letter: "I", text: "Inspirador e carismÃ¡tico." }, { letter: "S", text: "Acolhedor e participativo." }, { letter: "C", text: "Exigente com normas e organizado." }] },
  { id: 7, text: "Como vocÃª lida com mudanÃ§as bruscas?", options: [{ letter: "D", text: "Vejo como uma oportunidade de inovar." }, { letter: "I", text: "Me adapto bem se for algo empolgante." }, { letter: "S", text: "Preciso de tempo para entender o impacto." }, { letter: "C", text: "Quero saber os porquÃªs e as novas regras." }] },
  { id: 8, text: "Ao tomar decisÃµes importantes, vocÃª:", options: [{ letter: "D", text: "Decide rÃ¡pido e assume os riscos." }, { letter: "I", text: "Pensa em como isso afetarÃ¡ as pessoas." }, { letter: "S", text: "Consulta os envolvidos para consenso." }, { letter: "C", text: "Faz uma anÃ¡lise crÃ­tica de prÃ³s e contras." }] },
  { id: 9, text: "O que mais te irrita no ambiente de trabalho?", options: [{ letter: "D", text: "LentidÃ£o e falta de iniciativa." }, { letter: "I", text: "Pessimismo e isolamento." }, { letter: "S", text: "Conflitos desnecessÃ¡rios e injustiÃ§as." }, { letter: "C", text: "DesorganizaÃ§Ã£o e erros frequentes." }] },
  { id: 10, text: "O que as pessoas mais elogiam em vocÃª?", options: [{ letter: "D", text: "Minha coragem e foco." }, { letter: "I", text: "Meu carisma e energia." }, { letter: "S", text: "Minha lealdade e empatia." }, { letter: "C", text: "Minha inteligÃªncia e perfeccionismo." }] },
  { id: 11, text: "Seu ritmo de trabalho ideal Ã©:", options: [{ letter: "D", text: "Acelerado e cheio de metas." }, { letter: "I", text: "DinÃ¢mico e interativo." }, { letter: "S", text: "Constante e previsÃ­vel." }, { letter: "C", text: "Estruturado e sem pressa excessiva." }] },
  { id: 12, text: "Como vocÃª reage a crÃ­ticas?", options: [{ letter: "D", text: "Me defendo ou tento provar meu ponto." }, { letter: "I", text: "Levo para o lado pessoal inicialmente." }, { letter: "S", text: "Aceito, mas me sinto inseguro." }, { letter: "C", text: "Analiso se hÃ¡ fundamento lÃ³gico." }] },
  { id: 13, text: "Qual palavra melhor define vocÃª?", options: [{ letter: "D", text: "Decisivo." }, { letter: "I", text: "Otimista." }, { letter: "S", text: "ConfiÃ¡vel." }, { letter: "C", text: "Preciso." }] },
  { id: 14, text: "No planejamento de algo novo, vocÃª foca em:", options: [{ letter: "D", text: "O que vamos alcanÃ§ar (o objetivo)." }, { letter: "I", text: "Quem vai participar (as pessoas)." }, { letter: "S", text: "Como vamos fazer (o processo)." }, { letter: "C", text: "Quais sÃ£o os riscos (a seguranÃ§a)." }] },
  { id: 15, text: "Sua principal forÃ§a em um time Ã©:", options: [{ letter: "D", text: "Impulsionar a aÃ§Ã£o." }, { letter: "I", text: "Gerar entusiasmo." }, { letter: "S", text: "Manter a cooperaÃ§Ã£o." }, { letter: "C", text: "Garantir a excelÃªncia." }] },
  { id: 16, text: "O que vocÃª prefere evitar?", options: [{ letter: "D", text: "Perder o controle da situaÃ§Ã£o." }, { letter: "I", text: "Ser ignorado ou rejeitado." }, { letter: "S", text: "MudanÃ§as repentinas no escopo." }, { letter: "C", text: "Estar errado ou cometer falhas." }] },
  { id: 17, text: "Como vocÃª delega tarefas?", options: [{ letter: "D", text: "Dou a ordem e espero resultados." }, { letter: "I", text: "FaÃ§o um pedido animado." }, { letter: "S", text: "Explico com calma e dou suporte." }, { letter: "C", text: "Passo instruÃ§Ãµes extremamente detalhadas." }] },
  { id: 18, text: "O que mais te atrai em um lÃ­der?", options: [{ letter: "D", text: "Autoridade e visÃ£o." }, { letter: "I", text: "Carisma e acessibilidade." }, { letter: "S", text: "CompreensÃ£o e apoio." }, { letter: "C", text: "LÃ³gica e competÃªncia tÃ©cnica." }] },
  { id: 19, text: "Quando tem muitas tarefas, vocÃª:", options: [{ letter: "D", text: "Priorizo as mais difÃ­ceis logo." }, { letter: "I", text: "PeÃ§o ajuda para fazer junto com alguÃ©m." }, { letter: "S", text: "FaÃ§o uma de cada vez no meu ritmo." }, { letter: "C", text: "Crio uma planilha ou lista organizada." }] },
  { id: 20, text: "Sua abordagem para o aprendizado Ã©:", options: [{ letter: "D", text: "Aprender fazendo (tentativa e erro)." }, { letter: "I", text: "Debater com outras pessoas sobre o tema." }, { letter: "S", text: "Ter alguÃ©m me guiando passo a passo." }, { letter: "C", text: "Ler e pesquisar profundamente." }] },
  { id: 21, text: "Um ambiente ideal de trabalho tem:", options: [{ letter: "D", text: "Muita autonomia e competiÃ§Ã£o saudÃ¡vel." }, { letter: "I", text: "Festas, comemoraÃ§Ãµes e networking." }, { letter: "S", text: "Paz, respeito mÃºtuo e previsibilidade." }, { letter: "C", text: "Regras claras, silÃªncio e organizaÃ§Ã£o." }] },
  { id: 22, text: "VocÃª se considera uma pessoa mais:", options: [{ letter: "D", text: "Firme e ousada." }, { letter: "I", text: "Falante e persuasiva." }, { letter: "S", text: "Serena e amÃ¡vel." }, { letter: "C", text: "Exata e crÃ­tica." }] },
  { id: 23, text: "Para te convencer de algo, Ã© preciso:", options: [{ letter: "D", text: "Mostrar os resultados rÃ¡pidos." }, { letter: "I", text: "Contar uma histÃ³ria envolvente." }, { letter: "S", text: "Provar que Ã© seguro e testado." }, { letter: "C", text: "Apresentar fatos e dados concretos." }] },
  { id: 24, text: "Em uma discussÃ£o, sua postura Ã©:", options: [{ letter: "D", text: "Impor minha opiniÃ£o com veemÃªncia." }, { letter: "I", text: "Tentar contornar com humor." }, { letter: "S", text: "Ceder para evitar estresse maior." }, { letter: "C", text: "Argumentar apenas com base em provas." }] },
  { id: 25, text: "Como vocÃª lida com regras?", options: [{ letter: "D", text: "Se atrapalham, eu as ignoro." }, { letter: "I", text: "Vejo como guias flexÃ­veis." }, { letter: "S", text: "Respeito para manter a ordem." }, { letter: "C", text: "Sigo rigorosamente, foram feitas para isso." }] },
  { id: 26, text: "VocÃª costuma focar mais no:", options: [{ letter: "D", text: "Futuro." }, { letter: "I", text: "Presente." }, { letter: "S", text: "Passado." }, { letter: "C", text: "Detalhe do momento." }] },
  { id: 27, text: "No convÃ­vio social, vocÃª:", options: [{ letter: "D", text: "Gosto de organizar e decidir o que faremos." }, { letter: "I", text: "Sou a alma da festa, falo com todos." }, { letter: "S", text: "Prefiro conversar com conhecidos." }, { letter: "C", text: "Sou mais reservado e observador." }] },
  { id: 28, text: "Quando as coisas dÃ£o errado, vocÃª:", options: [{ letter: "D", text: "Fico impaciente e exijo aÃ§Ãµes." }, { letter: "I", text: "Fico frustrado, mas logo me animo." }, { letter: "S", text: "Fico triste e tento entender o que falhou." }, { letter: "C", text: "Procuro imediatamente a causa tÃ©cnica do erro." }] },
  { id: 29, text: "Para reconhecer seu trabalho, vocÃª prefere:", options: [{ letter: "D", text: "PromoÃ§Ã£o ou aumento financeiro." }, { letter: "I", text: "Elogios em pÃºblico." }, { letter: "S", text: "Um agradecimento sincero no privado." }, { letter: "C", text: "Reconhecimento tÃ©cnico da minha competÃªncia." }] },
  { id: 30, text: "Avaliando um novo colega, vocÃª repara primeiro:", options: [{ letter: "D", text: "Se ele Ã© produtivo e Ã¡gil." }, { letter: "I", text: "Se ele Ã© simpÃ¡tico e amigÃ¡vel." }, { letter: "S", text: "Se ele Ã© educado e prestativo." }, { letter: "C", text: "Se ele Ã© qualificado e pontual." }] }
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MBTI â€“ 20 perguntas (pares dicotÃ´micos)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const mbtiQuestions = [
  { id: 1, pair: "EI", text: "Em situaÃ§Ãµes sociais vocÃª:", A: { letter: "E", text: "Gosta de estar rodeado de pessoas e fica energizado com isso." }, B: { letter: "I", text: "Prefere momentos de reflexÃ£o e recarrega sozinho." } },
  { id: 2, pair: "EI", text: "Quando toma decisÃµes difÃ­ceis:", A: { letter: "E", text: "Fala sobre isso com amigos para processar." }, B: { letter: "I", text: "Prefere refletir internamente antes de falar." } },
  { id: 3, pair: "EI", text: "Em reuniÃµes, vocÃª costuma:", A: { letter: "E", text: "Participar ativamente e pensar em voz alta." }, B: { letter: "I", text: "Ouvir antes de falar e preferir contribuir por escrito." } },
  { id: 4, pair: "EI", text: "No final de uma semana intensa com pessoas:", A: { letter: "E", text: "Me sinto energizado e com vontade de continuar." }, B: { letter: "I", text: "Me sinto drenado e preciso de tempo sozinho." } },
  { id: 5, pair: "SN", text: "Ao aprender algo novo, vocÃª prefere:", A: { letter: "S", text: "Exemplos prÃ¡ticos, passo a passo e hands-on." }, B: { letter: "N", text: "Entender o conceito geral e o 'grande quadro' primeiro." } },
  { id: 6, pair: "SN", text: "VocÃª confia mais em:", A: { letter: "S", text: "Fatos concretos e experiÃªncias passadas." }, B: { letter: "N", text: "IntuiÃ§Ã£o e possibilidades futuras." } },
  { id: 7, pair: "SN", text: "Ao descrever algo, vocÃª foca em:", A: { letter: "S", text: "Os detalhes e a sequÃªncia exata dos fatos." }, B: { letter: "N", text: "PadrÃµes, metÃ¡foras e o significado geral." } },
  { id: 8, pair: "SN", text: "Na resoluÃ§Ã£o de problemas, vocÃª prefere:", A: { letter: "S", text: "SoluÃ§Ãµes testadas e comprovadas." }, B: { letter: "N", text: "SoluÃ§Ãµes criativas e inovadoras, mesmo sem garantia." } },
  { id: 9, pair: "TF", text: "Ao dar um feedback, vocÃª:", A: { letter: "T", text: "Prioriza ser honesto e direto, mesmo que doa." }, B: { letter: "F", text: "Considera muito como a pessoa vai se sentir ao receber." } },
  { id: 10, pair: "TF", text: "Em uma discussÃ£o, vocÃª geralmente:", A: { letter: "T", text: "Foca na lÃ³gica e nos fatos, independente das emoÃ§Ãµes." }, B: { letter: "F", text: "Considera os sentimentos e o impacto nas relaÃ§Ãµes." } },
  { id: 11, pair: "TF", text: "Ao ver injustiÃ§a, vocÃª reage:", A: { letter: "T", text: "Analisando o que Ã© certo segundo as regras." }, B: { letter: "F", text: "Se afetando emocionalmente e defendendo a pessoa." } },
  { id: 12, pair: "TF", text: "VocÃª se orgulha mais de:", A: { letter: "T", text: "Ser competente, eficiente e lÃ³gico." }, B: { letter: "F", text: "Ser empÃ¡tico, prestativo e harmonioso." } },
  { id: 13, pair: "JP", text: "No seu dia a dia, vocÃª prefere:", A: { letter: "J", text: "Planejar antecipadamente e seguir listas." }, B: { letter: "P", text: "Manter as opÃ§Ãµes abertas e ser espontÃ¢neo." } },
  { id: 14, pair: "JP", text: "Prazo final:", A: { letter: "J", text: "Me incomoda muito deixar para Ãºltima hora." }, B: { letter: "P", text: "Funciono bem sob pressÃ£o na Ãºltima hora." } },
  { id: 15, pair: "JP", text: "Seu ambiente de trabalho ideal Ã©:", A: { letter: "J", text: "Estruturado, com rotinas e processos claros." }, B: { letter: "P", text: "FlexÃ­vel, com espaÃ§o para adaptar conforme a situaÃ§Ã£o." } },
  { id: 16, pair: "JP", text: "Ao terminar um projeto, vocÃª sente:", A: { letter: "J", text: "AlÃ­vio e satisfaÃ§Ã£o em finalizar e segurar ao prÃ³ximo." }, B: { letter: "P", text: "Ã€s vezes vontade de melhorar mais antes de entregar." } },
  { id: 17, pair: "EI", text: "Conhecer novas pessoas te:", A: { letter: "E", text: "Anima e energiza." }, B: { letter: "I", text: "Cansa e exige esforÃ§o extra." } },
  { id: 18, pair: "SN", text: "Futuro para vocÃª Ã©:", A: { letter: "S", text: "O resultado de escolhas prÃ¡ticas que faÃ§o hoje." }, B: { letter: "N", text: "Cheio de possibilidades e instigante de imaginar." } },
  { id: 19, pair: "TF", text: "Na hora de criticar alguÃ©m:", A: { letter: "T", text: "Vou direto ao ponto, a verdade Ã© mais importante." }, B: { letter: "F", text: "Escolho cuidadosamente as palavras para nÃ£o magoar." } },
  { id: 20, pair: "JP", text: "MudanÃ§a de planos de Ãºltima hora:", A: { letter: "J", text: "Me causa stress e desconforto." }, B: { letter: "P", text: "Encaro com tranquilidade e atÃ© gosto da novidade." } },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Big Five (OCEAN) â€“ 25 perguntas (escala 1â€“5)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const bigFiveQuestions = [
  { id: 1, dim: "O", text: "Gosto de explorar novas ideias e conceitos abstratos." },
  { id: 2, dim: "O", text: "Tenho muita imaginaÃ§Ã£o e gosto de artes, mÃºsica ou literatura." },
  { id: 3, dim: "O", text: "Prefiro rotinas estabelecidas a experiÃªncias completamente novas." },
  { id: 4, dim: "O", text: "Acho fascinante aprender sobre assuntos fora da minha Ã¡rea." },
  { id: 5, dim: "O", text: "Tenho pensamentos incomuns e originais com frequÃªncia." },
  { id: 6, dim: "C", text: "Sou organizado e costumo fazer listas e planejamentos." },
  { id: 7, dim: "C", text: "Entrego tarefas sempre no prazo e raramente preciso de lembretes." },
  { id: 8, dim: "C", text: "Por vezes sou descuidado com detalhes e distraÃ­do." },
  { id: 9, dim: "C", text: "Tenho autodisciplina e persisto atÃ© concluir o que comeÃ§o." },
  { id: 10, dim: "C", text: "Trabalho duro mesmo quando a tarefa nÃ£o Ã© estimulante." },
  { id: 11, dim: "E", text: "Me sinto confortÃ¡vel em festas e eventos com pessoas desconhecidas." },
  { id: 12, dim: "E", text: "Costumo tomar a iniciativa e assumir o papel de lÃ­der." },
  { id: 13, dim: "E", text: "Prefiro quietude e momentos a sÃ³s do que grandes grupos." },
  { id: 14, dim: "E", text: "Me sinto cheio de energia e entusiasmo na maior parte do tempo." },
  { id: 15, dim: "E", text: "Falo muito e gosto de estar no centro das atenÃ§Ãµes." },
  { id: 16, dim: "A", text: "Sinto compaixÃ£o genuÃ­na pelas dificuldades dos outros." },
  { id: 17, dim: "A", text: "Evito conflitos e prefiro ceder do que discutir." },
  { id: 18, dim: "A", text: "Ã€s vezes sou rude e direto ao ponto de magoar as pessoas." },
  { id: 19, dim: "A", text: "Tenho interesse sincero no bem-estar das pessoas ao meu redor." },
  { id: 20, dim: "A", text: "Costumo confiar nas pessoas e assumo boas intenÃ§Ãµes delas." },
  { id: 21, dim: "N", text: "Me preocupo frequentemente com coisas que podem dar errado." },
  { id: 22, dim: "N", text: "Fico facilmente estressado quando tenho muitas tarefas." },
  { id: 23, dim: "N", text: "Raramente fico triste ou ansioso por situaÃ§Ãµes cotidianas." },
  { id: 24, dim: "N", text: "Ã€s vezes me sinto inseguro e questiono minhas prÃ³prias capacidades." },
  { id: 25, dim: "N", text: "Minhas emoÃ§Ãµes oscilam bastante ao longo do dia." },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Resultados DISC
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const discDescriptions: Record<string, { title: string; desc: string; strengths: string[]; weaknesses: string[]; communication: string }> = {
  D: {
    title: "Dominante (Executor)",
    desc: "Focados em resultados, competitivos e diretos. Adoram desafios, assumir o controle e tomar decisÃµes rÃ¡pidas sob pressÃ£o.",
    strengths: ["Foco em resultados e metas", "Tomada de decisÃ£o rÃ¡pida", "Coragem para assumir riscos", "AutoconfianÃ§a e assertividade"],
    weaknesses: ["Pode ser autoritÃ¡rio ou impaciente", "TendÃªncia a ignorar detalhes", "Pode atropelar os sentimentos alheios"],
    communication: "Seja direto, breve e foque nos resultados. Evite excesso de detalhes e vÃ¡ direto ao ponto."
  },
  I: {
    title: "Influente (Comunicador)",
    desc: "SociÃ¡veis, entusiastas e persuasivos. Focam nas pessoas, adoram interagir e trazem muita energia criativa ao ambiente.",
    strengths: ["Carisma e alto poder de persuasÃ£o", "Otimismo contagiante", "Habilidade de engajar pessoas", "Criatividade e improvisaÃ§Ã£o"],
    weaknesses: ["Pode perder o foco facilmente", "DesorganizaÃ§Ã£o com prazos", "Dificuldade com rotinas rÃ­gidas"],
    communication: "Seja amigÃ¡vel e demonstre entusiasmo. Permita tempo para interaÃ§Ãµes sociais e crie um ambiente descontraÃ­do."
  },
  S: {
    title: "EstÃ¡vel (Planejador)",
    desc: "Pacientes, confiÃ¡veis e empÃ¡ticos. Valorizam a estabilidade, a harmonia e sÃ£o excelentes no trabalho em equipe a longo prazo.",
    strengths: ["Lealdade extrema", "Ã“timos ouvintes e conselheiros", "Trabalho em equipe colaborativo", "PaciÃªncia e consistÃªncia"],
    weaknesses: ["ResistÃªncia a mudanÃ§as bruscas", "Dificuldade em dizer 'nÃ£o'", "Pode ser indeciso sob pressÃ£o extrema"],
    communication: "Seja calmo, paciente e explique as coisas passo a passo. DÃª tempo para processarem mudanÃ§as e evite pressÃµes repentinas."
  },
  C: {
    title: "Conforme (Analista)",
    desc: "AnalÃ­ticos, detalhistas e precisos. Buscam qualidade e perfeiÃ§Ã£o baseando-se em fatos, dados lÃ³gicos e processos claros.",
    strengths: ["Alta precisÃ£o e foco na qualidade", "Pensamento lÃ³gico e analÃ­tico", "OrganizaÃ§Ã£o extrema", "Habilidade de resolver problemas complexos"],
    weaknesses: ["Perfeccionismo que pode gerar atrasos", "Pode ser muito crÃ­tico com os outros", "Dificuldade em lidar com ambiguidades"],
    communication: "Foque em dados, fatos e processos lÃ³gicos. ForneÃ§a detalhes preferencialmente por escrito. Evite apelos puramente emocionais."
  }
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Resultados MBTI
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const mbtiDescriptions: Record<string, { title: string; desc: string; traits: string[] }> = {
  ENTJ: { title: "Comandante", desc: "LÃ­deres natos com visÃ£o estratÃ©gica e alto poder de execuÃ§Ã£o.", traits: ["Decisivo", "EstratÃ©gico", "Ambicioso"] },
  ENTP: { title: "Debatedor",  desc: "Pensadores criativos que adoram desafiar ideias estabelecidas.", traits: ["Criativo", "AnalÃ­tico", "Debates"] },
  ENFJ: { title: "Protagonista", desc: "CarismÃ¡ticos e inspiradores, focados em desenvolver as pessoas.", traits: ["EmpÃ¡tico", "Inspirador", "Comunicativo"] },
  ENFP: { title: "CampeÃ£o", desc: "Entusiastas criativos com uma energia contagiante.", traits: ["Entusiasmado", "Criativo", "SociÃ¡vel"] },
  ESTJ: { title: "Executivo", desc: "GuardiÃµes da tradiÃ§Ã£o, comprometidos com ordem e resultados.", traits: ["Organizado", "Direto", "ConfiÃ¡vel"] },
  ESTP: { title: "Empreendedor", desc: "EnÃ©rgicos e prÃ¡ticos, adoram aÃ§Ã£o e desafios imediatos.", traits: ["DinÃ¢mico", "Ousado", "AdaptÃ¡vel"] },
  ESFJ: { title: "CÃ´nsul", desc: "Cuidadosos e sociÃ¡veis, constroem harmonia e comunidade.", traits: ["Generoso", "SociÃ¡vel", "Leal"] },
  ESFP: { title: "Animador", desc: "EspontÃ¢neos e entusiasmados, tornam tudo mais divertido.", traits: ["Divertido", "EspontÃ¢neo", "SociÃ¡vel"] },
  INTJ: { title: "Arquiteto", desc: "Pensadores independentes com planos ambiciosos de longo prazo.", traits: ["AnalÃ­tico", "EstratÃ©gico", "Independente"] },
  INTP: { title: "Pensador",  desc: "Inventores inovadores com sede insaciÃ¡vel de conhecimento.", traits: ["LÃ³gico", "Inovador", "Curioso"] },
  INFJ: { title: "Advogado",  desc: "Idealistas raros, comprometidos com seu sistema de valores.", traits: ["VisionÃ¡rio", "EmpÃ¡tico", "Reservado"] },
  INFP: { title: "Mediador",  desc: "Idealistas poÃ©ticos, guiados por seus valores profundos.", traits: ["Criativo", "SensÃ­vel", "Idealista"] },
  ISTJ: { title: "LogÃ­stico", desc: "ConfiÃ¡veis e metÃ³dicos, com forte Ã©tica de trabalho.", traits: ["ResponsÃ¡vel", "Detalhista", "Tradicional"] },
  ISTP: { title: "Virtuoso",  desc: "Experimentadores ousados que adoram resolver problemas prÃ¡ticos.", traits: ["Habilidoso", "Racional", "Reservado"] },
  ISFJ: { title: "Defensor",  desc: "Dedicados e calorosos, sempre prontos para proteger os outros.", traits: ["Dedicado", "Humilde", "ConfiÃ¡vel"] },
  ISFP: { title: "Aventureiro", desc: "Artistas flexÃ­veis, sempre prontos para explorar e sentir.", traits: ["ArtÃ­stico", "Gentil", "AdaptÃ¡vel"] },
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Componente Principal
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function AssessmentHub() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const testType = type || 'disc';

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState(id || '');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [bigFiveAnswers, setBigFiveAnswers] = useState<Record<number, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultScreen, setResultScreen] = useState<any>(null);

  useEffect(() => {
    supabase.from('funcionarios').select('id, nome, cargo').order('nome')
      .then(({ data }) => { if (data) setEmployees(data); });
  }, []);

  if (testType === 'disc') {
    return <DiscTest />;
  }

  if (testType === 'mbti') {
    return <MbtiTest />;
  }


  // â”€â”€ DISC helpers â”€â”€
  const calcDisc = () => {
    let d=0,i=0,s=0,c=0;
    Object.values(answers).forEach(v => { if(v==='D')d++; if(v==='I')i++; if(v==='S')s++; if(v==='C')c++; });
    const total=30;
    const result = { D: Math.round((d/total)*100), I: Math.round((i/total)*100), S: Math.round((s/total)*100), C: Math.round((c/total)*100),
      dominant: [{letter:'D',val:d,title:'Dominante'},{letter:'I',val:i,title:'Influente'},{letter:'S',val:s,title:'EstÃ¡vel'},{letter:'C',val:c,title:'Conforme'}].sort((a,b)=>b.val-a.val)[0] };
    return result;
  };

  // â”€â”€ MBTI helpers â”€â”€
  const calcMbti = () => {
    let E=0,I=0,S=0,N=0,T=0,F=0,J=0,P=0;
    mbtiQuestions.forEach(q => {
      const ans = answers[q.id];
      if (!ans) return;
      if(ans==='E')E++; if(ans==='I')I++; if(ans==='S')S++; if(ans==='N')N++;
      if(ans==='T')T++; if(ans==='F')F++; if(ans==='J')J++; if(ans==='P')P++;
    });
    const type = `${E>=I?'E':'I'}${S>=N?'S':'N'}${T>=F?'T':'F'}${J>=P?'J':'P'}`;
    return { type, E, I, S, N, T, F, J, P, desc: mbtiDescriptions[type] || { title: type, desc: '', traits: [] } };
  };

  // â”€â”€ Big Five helpers â”€â”€
  const calcBigFive = () => {
    const dims: Record<string,number[]> = { O:[], C:[], E:[], A:[], N:[] };
    // reversed items (negative phrasing)
    const reversed = [3, 8, 13, 18, 23];
    bigFiveQuestions.forEach(q => {
      const raw = bigFiveAnswers[q.id] ?? 0;
      const val = reversed.includes(q.id) ? 6 - raw : raw;
      if (val > 0) dims[q.dim].push(val);
    });
    const pct = (arr: number[]) => arr.length ? Math.round((arr.reduce((s,v)=>s+v,0) / (arr.length*5))*100) : 0;
    return {
      O: pct(dims.O), C: pct(dims.C), E: pct(dims.E), A: pct(dims.A), N: pct(dims.N),
    };
  };

  const handleSubmit = async () => {
    if (!selectedEmpId) { toast({ title: 'Selecione um funcionÃ¡rio.', variant: 'destructive' }); return; }
    if (testType === 'disc' && Object.keys(answers).length < 30) { toast({ title: 'Responda todas as 30 perguntas.', variant: 'destructive' }); return; }
    if (testType === 'mbti' && Object.keys(answers).length < 20) { toast({ title: 'Responda todas as 20 perguntas.', variant: 'destructive' }); return; }
    if (testType === 'bigfive' && Object.keys(bigFiveAnswers).length < 25) { toast({ title: 'Avalie todas as 25 afirmaÃ§Ãµes.', variant: 'destructive' }); return; }

    setIsSubmitting(true);
    let result: any = null;
    if (testType === 'disc')    result = calcDisc();
    if (testType === 'mbti')    result = calcMbti();
    if (testType === 'bigfive') result = calcBigFive();

    try {
      // 1. Tenta salvar no Supabase
      const { error } = await supabase.from('assessment_results').insert({
        user_id: selectedEmpId,
        type: testType,
        result_data: result
      });
      
      if (error) {
        console.warn("A tabela assessment_results pode ainda nÃ£o existir no Supabase. Usando LocalStorage como fallback.", error);
        localStorage.setItem(`${testType}_${selectedEmpId}`, JSON.stringify(result));
      }

      setResultScreen(result);
      toast({ title: error ? 'âœ… Salvo localmente.' : 'âœ… AnÃ¡lise salva no banco de dados!' });
    } catch (err) {
      localStorage.setItem(`${testType}_${selectedEmpId}`, JSON.stringify(result));
      setResultScreen(result);
      toast({ title: 'âœ… AnÃ¡lise concluÃ­da (salva localmente).' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const questions = testType === 'disc' ? discQuestions : mbtiQuestions;
  const totalQ = testType === 'bigfive' ? 25 : questions.length;
  const progress = testType === 'bigfive'
    ? (Object.keys(bigFiveAnswers).length / 25) * 100
    : (Object.keys(answers).length / totalQ) * 100;

  // â”€â”€ Result Screen â”€â”€
  if (resultScreen) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">AnÃ¡lise ConcluÃ­da!</h1>
          <p className="text-muted-foreground mt-1">Os resultados foram salvos no perfil do colaborador.</p>
        </div>

        {testType === 'disc' && (() => {
          const dom = resultScreen.dominant;
          const info = discDescriptions[dom.letter];
          const colorMap: any = { D: 'bg-red-500', I: 'bg-yellow-500', S: 'bg-green-500', C: 'bg-blue-500' };
          
          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black flex items-center justify-center gap-2 mb-2"><Brain className="w-6 h-6 text-primary" /> RelatÃ³rio Executivo: AnÃ¡lise DISC</h2>
                <p className="text-muted-foreground">Mapeamento de estilo comportamental, tomada de decisÃ£o e comunicaÃ§Ã£o.</p>
              </div>

              <div className="glass-card rounded-xl p-6 border-l-4" style={{ borderLeftColor: `var(--${colorMap[dom.letter].split('-')[1]}-500, #ccc)` }}>
                <div className="flex flex-col md:flex-row gap-6">
                  
                  {/* Left: Graphic */}
                  <div className="md:w-1/3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6 text-center">
                    <span className="text-7xl font-black text-primary drop-shadow-md">{dom.letter}</span>
                    <h3 className="text-xl font-bold mt-2 uppercase tracking-wide">{info.title}</h3>
                    <div className="grid grid-cols-4 gap-2 w-full mt-6">
                      {[{l:'D',v:resultScreen.D,c:'bg-red-500'},{l:'I',v:resultScreen.I,c:'bg-yellow-500'},{l:'S',v:resultScreen.S,c:'bg-green-500'},{l:'C',v:resultScreen.C,c:'bg-blue-500'}].map(x=>(
                        <div key={x.l} className="flex flex-col items-center">
                          <div className="text-sm font-bold">{x.v}%</div>
                          <div className={`h-1.5 w-full rounded-full mt-1 ${x.c} opacity-${x.l === dom.letter ? '100' : '30'}`} />
                          <div className="text-[10px] font-bold text-muted-foreground mt-1">{x.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Exec Summary */}
                  <div className="md:w-2/3 space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg text-sm text-foreground/80 leading-relaxed border border-border/50">
                      <strong className="text-primary block mb-1">Como atua:</strong> {info.desc}
                      <strong className="text-primary block mt-3 mb-1">Estilo de ComunicaÃ§Ã£o:</strong> {info.communication}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="bg-success/5 p-4 rounded-lg text-sm border border-success/20">
                        <strong className="text-success flex items-center gap-1 mb-2"><CheckCircle2 className="w-4 h-4"/> Pontos Fortes</strong>
                        <ul className="list-disc pl-4 space-y-1 text-success-foreground/80">
                          {info.strengths.map((s: string) => <li key={s}>{s}</li>)}
                        </ul>
                      </div>
                      <div className="bg-warning/10 p-4 rounded-lg text-sm border border-warning/20">
                        <strong className="text-warning flex items-center gap-1 mb-2"><AlertTriangle className="w-4 h-4"/> AtenÃ§Ã£o (Oportunidades)</strong>
                        <ul className="list-disc pl-4 space-y-1 text-warning-foreground/80">
                          {info.weaknesses.map((w: string) => <li key={w}>{w}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {testType === 'mbti' && (() => {
          const type = resultScreen.type;
          const info = resultScreen.desc;
          
          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black flex items-center justify-center gap-2 mb-2"><User className="w-6 h-6 text-primary" /> RelatÃ³rio Executivo: MBTI</h2>
                <p className="text-muted-foreground">Mapeamento de 16 ArquÃ©tipos de Personalidade e DinÃ¢mica Cognitiva.</p>
              </div>

              <div className="glass-card rounded-xl p-6 border-l-4 border-l-primary">
                <div className="flex flex-col md:flex-row gap-6">
                  
                  {/* Left: Graphic */}
                  <div className="md:w-1/3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6 text-center">
                    <div className="text-6xl font-black tracking-widest text-primary drop-shadow-md mb-2">{type}</div>
                    <h3 className="text-xl font-bold uppercase tracking-wide">{info?.title}</h3>
                    <div className="flex flex-wrap gap-1 justify-center mt-4">
                      {info?.traits?.map((t: string) => (
                        <span key={t} className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Exec Summary */}
                  <div className="md:w-2/3 space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg text-sm text-foreground/80 leading-relaxed border border-border/50">
                      <strong className="text-primary block mb-1">AnÃ¡lise do ArquÃ©tipo:</strong> {info?.desc}
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg text-sm text-primary-foreground/90 leading-relaxed border border-primary/20 mt-4">
                      <strong className="text-primary flex items-center gap-1 mb-2"><Zap className="w-4 h-4"/> AplicaÃ§Ã£o PrÃ¡tica</strong>
                      Os perfis <strong className="uppercase">{info?.title}</strong> geralmente buscam ambientes onde possam aplicar seus pontos fortes naturais ({info?.traits?.join(', ').toLowerCase()}). Trazem diversidade cognitiva Ã  equipe, influenciando o formato de tomada de decisÃ£o e resoluÃ§Ã£o de problemas operacionais.
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {testType === 'bigfive' && (() => {
          const bigFiveDetails: Record<string, any> = {
            O: {
              label: 'Abertura Ã  ExperiÃªncia', color: 'bg-violet-500', icon: 'ðŸ’¡',
              high: { title: 'VisionÃ¡rio e Inovador', desc: 'IndivÃ­duo criativo, com facilidade para propor soluÃ§Ãµes disruptivas e pensar fora da caixa.', impact: 'Pode atuar como um catalisador de transformaÃ§Ãµes, mas pode se dispersar em rotinas ou processos muito rÃ­gidos.' },
              mid: { title: 'PragmÃ¡tico AdaptÃ¡vel', desc: 'Equilibra bem a inovaÃ§Ã£o com o uso de mÃ©todos jÃ¡ validados. Inova quando necessÃ¡rio, mas valoriza a previsibilidade.', impact: 'Traz estabilidade para projetos, nÃ£o sendo resistente Ã  mudanÃ§a, mas tambÃ©m nÃ£o abraÃ§ando o caos.' },
              low: { title: 'Orientado Ã  TradiÃ§Ã£o', desc: 'Prefere processos estruturados, rotinas claras e mÃ©todos testados. Tem grande foco na execuÃ§Ã£o prÃ¡tica e no presente.', impact: 'Excelente para garantir a estabilidade operacional, mas pode apresentar forte resistÃªncia a mudanÃ§as organizacionais.' }
            },
            C: {
              label: 'Conscienciosidade', color: 'bg-blue-500', icon: 'ðŸŽ¯',
              high: { title: 'MetÃ³dico e Focado', desc: 'Altamente disciplinado, organizado e movido a metas. Possui forte senso de dever e foco extremo em qualidade.', impact: 'Ideal para gestÃ£o de processos crÃ­ticos e lideranÃ§a de entregas. Contudo, pode tender ao perfeccionismo limitante.' },
              mid: { title: 'Organizado e FlexÃ­vel', desc: 'MantÃ©m um bom nÃ­vel de organizaÃ§Ã£o para atingir resultados, sem se prender a regras se isso atrasar o projeto.', impact: 'Apresenta um excelente equilÃ­brio entre o foco na meta e a capacidade Ã¡gil de recalcular a rota.' },
              low: { title: 'EspontÃ¢neo e Ãgil', desc: 'Trabalha melhor em cenÃ¡rios abertos e sem burocracia. Ã‰ flexÃ­vel, improvisador e altamente focado no curto prazo.', impact: 'Ã“timo para atuar em crises ou startups dinÃ¢micas, mas pode falhar no acompanhamento e no seguimento de regras longas.' }
            },
            E: {
              label: 'ExtroversÃ£o', color: 'bg-yellow-500', icon: 'ðŸ¤',
              high: { title: 'Articulador Social', desc: 'Ganha energia nas interaÃ§Ãµes, Ã© comunicativo, assertivo e busca naturalmente posiÃ§Ãµes de influÃªncia.', impact: 'Excelente para papÃ©is comerciais, networking e motivaÃ§Ã£o de equipes. Pode, porÃ©m, ofuscar membros mais quietos.' },
              mid: { title: 'Ambivertido EstratÃ©gico', desc: 'Adapta-se ao contexto: assume o protagonismo verbal quando necessÃ¡rio, mas atua de forma analÃ­tica quando o momento exige.', impact: 'Serve como a ponte de comunicaÃ§Ã£o perfeita entre Ã¡reas altamente extrovertidas e times profundamente tÃ©cnicos.' },
              low: { title: 'AnalÃ­tico e Independente', desc: 'Prefere trabalhos de concentraÃ§Ã£o individual. Ouve ativamente e processa internamente antes de se posicionar.', impact: 'Ideal para funÃ§Ãµes de alta profundidade tÃ©cnica, estratÃ©gica ou analÃ­tica. Pode precisar de incentivo para debates abertos.' }
            },
            A: {
              label: 'Amabilidade', color: 'bg-green-500', icon: 'â¤ï¸',
              high: { title: 'Acolhedor e Conciliador', desc: 'Altamente empÃ¡tico e voltado Ã  colaboraÃ§Ã£o. Prioriza a harmonia da equipe e a construÃ§Ã£o de consenso.', impact: 'PeÃ§a fundamental para a retenÃ§Ã£o de talentos e o clima organizacional. Pode ter dificuldade em tomar decisÃµes impopulares.' },
              mid: { title: 'Colaborador Orientado a Resultados', desc: 'Trabalha bem em equipe, mas nÃ£o hesita em criar atritos construtivos se achar que a entrega serÃ¡ prejudicada.', impact: 'O balanÃ§o ideal: mantÃ©m o bom clima, mas possui a firmeza necessÃ¡ria para blindar o interesse da empresa.' },
              low: { title: 'Questionador e Competitivo', desc: 'Coloca a lÃ³gica e os resultados acima da harmonia social. Tem uma postura direta, pragmÃ¡tica e firme.', impact: 'Crucial para cenÃ¡rios de reestruturaÃ§Ã£o, negociaÃ§Ãµes agressivas e auditoria, porÃ©m pode gerar desgaste no clima da equipe.' }
            },
            N: {
              label: 'Neuroticismo', color: 'bg-red-500', icon: 'ðŸ›¡ï¸',
              high: { title: 'Alerta e Antecipador', desc: 'Possui um alto radar para riscos e problemas potenciais. Extremamente reativo a mudanÃ§as e ameaÃ§as no ambiente.', impact: 'Ã“timo para setores de Compliance, SeguranÃ§a ou GestÃ£o de Risco, desde que a lideranÃ§a atue para mitigar seu estresse ou burnout.' },
              mid: { title: 'Estabilidade Calibrada', desc: 'MantÃ©m a tranquilidade na maioria das situaÃ§Ãµes diÃ¡rias, reagindo de forma proporcional a crises.', impact: 'Consegue absorver a pressÃ£o normal do dia a dia corporativo sem perder o foco na entrega.' },
              low: { title: 'Resiliente e Frio', desc: 'Extremamente calmo sob pressÃ£o intensa. Lida com urgÃªncias, cobranÃ§as e incertezas de forma puramente objetiva.', impact: 'O perfil ideal para lidar com situaÃ§Ãµes de crise, alta pressÃ£o e incerteza, embora possa parecer pouco empÃ¡tico frente ao caos.' }
            }
          };

          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black flex items-center justify-center gap-2 mb-2"><BarChart2 className="w-6 h-6 text-primary" /> RelatÃ³rio Executivo: Big Five</h2>
                <p className="text-muted-foreground">AnÃ¡lise profunda de tendÃªncias psicolÃ³gicas, engajamento e impacto organizacional.</p>
              </div>

              {['O', 'C', 'E', 'A', 'N'].map(key => {
                const trait = bigFiveDetails[key];
                const score = resultScreen[key];
                const level = score >= 65 ? 'high' : score <= 40 ? 'low' : 'mid';
                const result = trait[level];

                return (
                  <div key={key} className="glass-card rounded-xl p-6 border-l-4" style={{ borderLeftColor: `var(--${trait.color.split('-')[1]}-500, #ccc)` }}>
                    <div className="flex flex-col md:flex-row gap-6">
                      
                      {/* Left: Score & Graphic */}
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
                          <span>MÃ©dio</span>
                          <span>Alto</span>
                        </div>
                      </div>

                      {/* Right: Exec Summary */}
                      <div className="md:w-2/3 space-y-4">
                        <div>
                          <h3 className="text-sm font-bold uppercase text-primary tracking-wider mb-1">ClassificaÃ§Ã£o do Perfil</h3>
                          <p className="text-xl font-black text-foreground">{result.title}</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="bg-muted/30 p-3 rounded-lg text-sm text-foreground/80 leading-relaxed border border-border/50">
                            <strong>CaracterÃ­sticas:</strong> {result.desc}
                          </div>
                          <div className="bg-primary/5 p-3 rounded-lg text-sm text-primary-foreground/90 leading-relaxed border border-primary/20">
                            <strong className="text-primary">ðŸ’¡ Impacto na OrganizaÃ§Ã£o & LideranÃ§a:</strong><br/>
                            {result.impact}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => navigate('/assessments')}>Voltar ao Hub</Button>
          <Button onClick={() => navigate(`/funcionario/${selectedEmpId}`)}>Ver Perfil Completo</Button>
        </div>
      </div>
    );
  }

  // â”€â”€ Big Five Screen â”€â”€
  if (testType === 'bigfive') {
    const q = bigFiveQuestions[currentQ];
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><BarChart2 className="w-5 h-5 text-primary" />Big Five (OCEAN)</h1>
            <p className="text-sm text-muted-foreground">Modelo mais validado cientificamente â€” 25 afirmaÃ§Ãµes</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="text-sm font-semibold mb-2 block">FuncionÃ¡rio Avaliado:</label>
          <select className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} disabled={!!id}>
            <option value="" disabled>Selecione...</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.nome} â€” {e.cargo}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>QuestÃ£o {currentQ+1} de {totalQ}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={q.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="kpi-card p-6 rounded-xl space-y-4">
            <p className="text-lg font-semibold leading-snug">"{q.text}"</p>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { val: 1, label: "Discordo totalmente" },
                { val: 2, label: "Discordo" },
                { val: 3, label: "Neutro" },
                { val: 4, label: "Concordo" },
                { val: 5, label: "Concordo totalmente" },
              ].map(opt => (
                <button key={opt.val} onClick={() => {
                  setBigFiveAnswers(prev => ({ ...prev, [q.id]: opt.val }));
                  if (currentQ < totalQ - 1) setCurrentQ(c => c + 1);
                }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${bigFiveAnswers[q.id] === opt.val ? 'bg-primary text-primary-foreground border-primary font-bold' : 'bg-background border-border hover:border-primary/60 hover:bg-muted text-muted-foreground'}`}>
                  <span className="text-xl font-bold">{opt.val}</span>
                  <span className="leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentQ(c => Math.max(0, c-1))} disabled={currentQ === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          {currentQ < totalQ - 1 ? (
            <Button onClick={() => setCurrentQ(c => c+1)} disabled={!bigFiveAnswers[q.id]}>
              PrÃ³xima <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || Object.keys(bigFiveAnswers).length < 25 || !selectedEmpId}>
              {isSubmitting ? 'Calculando...' : 'Finalizar'} <Send className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // â”€â”€ DISC / MBTI Screen (paginado por questÃ£o) â”€â”€
  const q = questions[currentQ] as any;
  const isDisc = testType === 'disc';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {isDisc ? <Brain className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
            {isDisc ? 'AnÃ¡lise DISC' : 'MBTI â€” 16 Personalidades'}
          </h1>
          <p className="text-sm text-muted-foreground">{isDisc ? '30 questÃµes comportamentais' : '20 pares de preferÃªncias'}</p>
        </div>
      </div>

      {isDisc && currentQ === 0 && Object.keys(answers).length === 0 && (
        <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl text-sm">
          <p className="font-bold text-primary mb-2 text-base">O que Ã© a AnÃ¡lise DISC?</p>
          <p className="text-muted-foreground leading-relaxed">
            O DISC Ã© uma metodologia globalmente reconhecida de avaliaÃ§Ã£o de perfil comportamental que mapeia quatro dimensÃµes: <strong>D</strong>ominÃ¢ncia, <strong>I</strong>nfluÃªncia, <strong>E</strong>stabilidade (S) e <strong>C</strong>onformidade. 
            NÃ£o existem perfis certos ou errados; a anÃ¡lise ajuda as organizaÃ§Ãµes a entenderem os talentos naturais, o estilo ideal de comunicaÃ§Ã£o e as oportunidades de desenvolvimento de cada colaborador, fomentando a formaÃ§Ã£o de equipes mais equilibradas.
          </p>
        </div>
      )}

      <div className="glass-card rounded-xl p-4">
        <label className="text-sm font-semibold mb-2 block">FuncionÃ¡rio Avaliado:</label>
        <select className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} disabled={!!id}>
          <option value="" disabled>Selecione...</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.nome} â€” {e.cargo}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>QuestÃ£o {currentQ+1} de {totalQ}</span>
          <span>{Object.keys(answers).length} respondidas</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          className="kpi-card p-6 rounded-xl space-y-4">
          <p className="text-lg font-semibold leading-snug">
            <span className="text-primary font-bold">{currentQ+1}. </span>
            {q.text || (isDisc ? q.text : q.text)}
          </p>
          <div className="grid grid-cols-1 gap-3">
            {(isDisc ? q.options : [{ letter: q.A.letter, text: q.A.text }, { letter: q.B.letter, text: q.B.text }]).map((opt: any) => (
              <button key={opt.letter} onClick={() => {
                setAnswers(prev => ({ ...prev, [q.id]: opt.letter }));
                if (currentQ < totalQ - 1) setTimeout(() => setCurrentQ(c => c+1), 250);
              }}
                className={`text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${answers[q.id] === opt.letter ? 'bg-primary/10 border-primary text-primary font-medium' : 'bg-background border-border hover:border-primary/60 hover:bg-muted/60'}`}>
                <span className="text-sm">{opt.text}</span>
                {answers[q.id] === opt.letter && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentQ(c => Math.max(0, c-1))} disabled={currentQ === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>
        {currentQ < totalQ - 1 ? (
          <Button variant="outline" onClick={() => setCurrentQ(c => c+1)}>
            PrÃ³xima <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedEmpId}>
            {isSubmitting ? 'Analisando...' : 'Finalizar'} <Send className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
