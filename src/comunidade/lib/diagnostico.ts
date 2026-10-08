/* Diagnóstico de Holding Familiar (isca da Black do Marcio).
   Fonte única das perguntas, da pontuação e das faixas. A interface lê daqui e o
   servidor recalcula a nota daqui; a nota nunca vem do navegador.

   Eixo 1, habilidade técnica: 40 pontos (formação 20 + objetivo 20).
   Eixo 2, capacidade comercial: 60 pontos (carteira 15 + contatos 10 + 7 clientes x 5).
   Perguntas sem peso (idade e cidade) servem ao comercial e ao critério rápido de MQL. */

export type Eixo = "tecnica" | "comercial" | "perfil";

export interface Opcao {
  id: string;
  rotulo: string;
  pontos: number;
}

export interface Pergunta {
  id: string;
  eixo: Eixo;
  /** Texto curto que aparece acima da pergunta, como um capítulo do teste. */
  etapa: string;
  titulo: string;
  ajuda?: string;
  opcoes: Opcao[];
}

const FAIXA_CLIENTES: Opcao[] = [
  { id: "0", rotulo: "Nenhum", pontos: 0 },
  { id: "1-5", rotulo: "De 1 a 5", pontos: 1 },
  { id: "6-10", rotulo: "De 6 a 10", pontos: 2 },
  { id: "11-15", rotulo: "De 11 a 15", pontos: 4 },
  { id: "16+", rotulo: "16 ou mais", pontos: 5 },
];

/** Os 7 perfis de cliente, nesta ordem (pedido do Marcio). */
const CLIENTES: { id: string; titulo: string; ajuda: string }[] = [
  {
    id: "cli_inventario",
    titulo: "Quantas pessoas que você conhece querem evitar o inventário?",
    ajuda: "Famílias que querem poupar os herdeiros do inventário e do ITCMD.",
  },
  {
    id: "cli_protecao",
    titulo: "Quantos empresários você conhece que precisam proteger o patrimônio?",
    ajuda: "Donos de empresa expostos a dívidas, ações trabalhistas ou riscos do negócio.",
  },
  {
    id: "cli_legado",
    titulo: "Quantas pessoas você conhece que querem preservar o legado da família?",
    ajuda: "Quem quer manter o patrimônio unido e organizado para as próximas gerações.",
  },
  {
    id: "cli_imoveis",
    titulo: "Quantas pessoas você conhece que vivem de imóveis alugados?",
    ajuda: "Proprietários que pagam imposto alto sobre aluguel na pessoa física.",
  },
  {
    id: "cli_controle",
    titulo: "Quantas famílias você conhece que precisam organizar o controle dos negócios?",
    ajuda: "Empresas familiares com sucessão, sócios ou herdeiros para acomodar.",
  },
  {
    id: "cli_presumido",
    titulo: "Quantos empresários do lucro presumido você conhece?",
    ajuda: "Empresas no lucro presumido que podem ganhar com o planejamento.",
  },
  {
    id: "cli_dividendos",
    titulo: "Quantas pessoas você conhece que recebem dividendos?",
    ajuda: "Sócios e investidores que recebem lucros e dividendos com frequência.",
  },
];

export const PERGUNTAS: Pergunta[] = [
  {
    id: "formacao",
    eixo: "tecnica",
    etapa: "Sua base",
    titulo: "Qual é a sua formação?",
    opcoes: [
      { id: "advogado", rotulo: "Sou advogado(a)", pontos: 20 },
      { id: "contador", rotulo: "Sou contador(a)", pontos: 20 },
      { id: "bacharel", rotulo: "Sou bacharel em Direito", pontos: 20 },
      { id: "estudante", rotulo: "Sou estudante de Direito", pontos: 17 },
      { id: "outra_facilidade", rotulo: "Sou de outra área e tenho facilidade com temas jurídicos", pontos: 6 },
      { id: "outra", rotulo: "Sou de outra área e não tenho familiaridade jurídica", pontos: 0 },
    ],
  },
  {
    id: "objetivo",
    eixo: "tecnica",
    etapa: "Sua base",
    titulo: "O que você quer fazer com a Holding Familiar?",
    opcoes: [
      { id: "viver", rotulo: "Viver de Holding Familiar", pontos: 20 },
      { id: "servico", rotulo: "Ter um serviço a mais no meu escritório", pontos: 17 },
      { id: "academico", rotulo: "Conhecimento acadêmico", pontos: 6 },
      { id: "propria", rotulo: "Constituir a minha própria Holding", pontos: 2 },
    ],
  },
  {
    id: "carteira",
    eixo: "comercial",
    etapa: "Seu mercado",
    titulo: "Como está a sua carteira de clientes hoje?",
    opcoes: [
      { id: "potenciais", rotulo: "Tenho clientes com potencial para Holding", pontos: 15 },
      { id: "nao_sei", rotulo: "Tenho carteira, mas não sei se são clientes potenciais", pontos: 11 },
      { id: "nenhum", rotulo: "Ainda não tenho clientes", pontos: 3 },
    ],
  },
  {
    id: "contatos_1mi",
    eixo: "comercial",
    etapa: "Seu mercado",
    titulo: "Quantas pessoas você conhece com patrimônio acima de R$ 1 milhão?",
    ajuda: "Contatos com quem você teria abertura para conversar.",
    opcoes: [
      { id: "0", rotulo: "Nenhuma", pontos: 0 },
      { id: "1-5", rotulo: "De 1 a 5", pontos: 2 },
      { id: "6-15", rotulo: "De 6 a 15", pontos: 5 },
      { id: "16-30", rotulo: "De 16 a 30", pontos: 8 },
      { id: "30+", rotulo: "Mais de 30", pontos: 10 },
    ],
  },
  ...CLIENTES.map<Pergunta>((c) => ({ ...c, eixo: "comercial", etapa: "Seus clientes", opcoes: FAIXA_CLIENTES })),
  {
    id: "idade",
    eixo: "perfil",
    etapa: "Para fechar",
    titulo: "Qual é a sua faixa de idade?",
    opcoes: [
      { id: "ate-34", rotulo: "Até 34 anos", pontos: 0 },
      { id: "35-44", rotulo: "De 35 a 44 anos", pontos: 0 },
      { id: "45-54", rotulo: "De 45 a 54 anos", pontos: 0 },
      { id: "55+", rotulo: "55 anos ou mais", pontos: 0 },
    ],
  },
];

export type Respostas = Record<string, string>;

export type FaixaId = "pequenas" | "razoaveis" | "grandes" | "excelentes";

export interface Faixa {
  id: FaixaId;
  min: number;
  titulo: string;
  /** true = recebe o convite da live e a comunicação intensa. */
  convidaLive: boolean;
}

export const FAIXAS: Faixa[] = [
  { id: "pequenas", min: 0, titulo: "Chances pequenas", convidaLive: false },
  { id: "razoaveis", min: 40, titulo: "Chances razoáveis", convidaLive: false },
  { id: "grandes", min: 60, titulo: "Chances grandes", convidaLive: true },
  { id: "excelentes", min: 80, titulo: "Chances excelentes", convidaLive: true },
];

export interface Resultado {
  total: number;
  tecnica: number;
  comercial: number;
  faixa: Faixa;
  /** Critério rápido da ata: advogado(a) com menos de 55 anos. */
  mql: boolean;
}

export const MAX_TECNICA = 40;
export const MAX_COMERCIAL = 60;

/** Devolve null se faltar resposta ou se alguma opção não existir. */
export function calcular(respostas: Respostas): Resultado | null {
  let tecnica = 0;
  let comercial = 0;
  for (const p of PERGUNTAS) {
    const op = p.opcoes.find((o) => o.id === respostas[p.id]);
    if (!op) return null;
    if (p.eixo === "tecnica") tecnica += op.pontos;
    if (p.eixo === "comercial") comercial += op.pontos;
  }
  const total = tecnica + comercial;
  const faixa = [...FAIXAS].reverse().find((f) => total >= f.min)!;
  const mql = respostas.formacao === "advogado" && respostas.idade !== "55+";
  return { total, tecnica, comercial, faixa, mql };
}
