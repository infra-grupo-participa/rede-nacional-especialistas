/* ============================================================================
   Agenda do Time Holding Brasil — dados dos "Próximos Eventos".

   MÓDULO PURO (sem I/O): pode ser importado por Client Components.

   Hoje a agenda é curada à mão neste arquivo. Quando a coordenação quiser
   editar pelo painel, basta criar a tabela `rede.eventos` com exatamente estas
   colunas e trocar `AGENDA` por uma query — a UI do calendário consome só o
   tipo `Evento`, não a origem.

   Regra de ouro: `inicio`/`fim` são ISO **local** (sem Z). O horário é o de
   Brasília e é exibido literalmente; nada de conversão de fuso no cliente,
   senão um evento das 19h vira 22h para quem estiver com o relógio em UTC.
   ========================================================================== */

export type CategoriaEvento =
  | "encontro"
  | "formacao"
  | "clinica"
  | "consultoria"
  | "diamantes";

export interface MetaCategoria {
  /** rótulo exibido na legenda e no chip do evento. */
  rotulo: string;
  /** cor sólida da categoria (bolinha da legenda, barra do card). */
  cor: string;
  /** fundo suave para o card do evento sobre superfície clara. */
  fundo: string;
}

/* Paleta da agenda: o laranja da marca é reservado ao "Encontro Nacional" (o
   evento-mãe). As demais categorias usam tons vizinhos e frios para não
   competir com o CTA da página. Todas passam 4.5:1 sobre o `fundo` do par. */
export const CATEGORIAS: Record<CategoriaEvento, MetaCategoria> = {
  encontro: { rotulo: "Encontro Nacional", cor: "#FF6B1A", fundo: "#FFEEE0" },
  formacao: { rotulo: "Curso Nacional em Formação", cor: "#1F6F6B", fundo: "#E4F0EF" },
  clinica: { rotulo: "Clínica / Treinamento", cor: "#B8451E", fundo: "#FBE9E2" },
  consultoria: { rotulo: "Consultoria / Mentoria", cor: "#4A5B8C", fundo: "#E9ECF6" },
  diamantes: { rotulo: "Diamantes (Intensivo)", cor: "#7A5AA8", fundo: "#EFEAF7" },
};

export const ORDEM_CATEGORIAS: CategoriaEvento[] = [
  "encontro",
  "formacao",
  "clinica",
  "consultoria",
  "diamantes",
];

export type FormatoEvento = "online" | "presencial" | "hibrido";

export interface Evento {
  id: string;
  titulo: string;
  categoria: CategoriaEvento;
  /** ISO local, ex.: "2026-08-14T19:00" (horário de Brasília). */
  inicio: string;
  /** ISO local do término. Evento de vários dias termina no último dia. */
  fim: string;
  /** true = ocupa o dia inteiro; a UI esconde a hora. */
  diaInteiro?: boolean;
  formato: FormatoEvento;
  /** "Transmissão on-line" ou "São Paulo · SP". */
  local: string;
  descricao: string;
  /** destino do clique no evento (página de inscrição). */
  linkInscricao: string;
  /** evento âncora do mês — a UI pode dar destaque visual. */
  destaque?: boolean;
}

/* ---------------------------------------------------------------- agenda -- */
/* Agenda 2026. Curadoria da coordenação THB. */
export const AGENDA: Evento[] = [
  {
    id: "encontro-nacional-2026",
    titulo: "Encontro Nacional do Time Holding Brasil",
    categoria: "encontro",
    inicio: "2026-09-10T09:00",
    fim: "2026-09-12T18:00",
    formato: "presencial",
    local: "São Paulo · SP",
    descricao:
      "Três dias com toda a rede reunida: painéis de estruturação patrimonial, casos reais dos escritórios Diamantes e a plenária de abertura do ciclo 2027.",
    linkInscricao: "https://timeholdingbrasil.com.br/encontro-nacional",
    destaque: true,
  },
  {
    id: "curso-nacional-formacao-t3",
    titulo: "Curso Nacional em Formação — Turma 3",
    categoria: "formacao",
    inicio: "2026-08-14T19:00",
    fim: "2026-08-16T17:00",
    formato: "hibrido",
    local: "São Paulo · SP e transmissão on-line",
    descricao:
      "Formação completa em holding familiar: blindagem patrimonial, sucessão, regimes de bens e eficiência tributária. Habilita o profissional a integrar a Rede Nacional.",
    linkInscricao: "https://timeholdingbrasil.com.br/curso-nacional",
    destaque: true,
  },
  {
    id: "clinica-itcmd-ago",
    titulo: "Clínica de Casos — ITCMD na prática",
    categoria: "clinica",
    inicio: "2026-08-21T19:30",
    fim: "2026-08-21T21:30",
    formato: "online",
    local: "Transmissão on-line",
    descricao:
      "Análise ao vivo de casos trazidos pelos membros: base de cálculo, domicílio fiscal e as teses que estão sendo aceitas nos tribunais estaduais.",
    linkInscricao: "https://timeholdingbrasil.com.br/clinicas",
  },
  {
    id: "consultoria-aberta-ago",
    titulo: "Consultoria Aberta com a coordenação",
    categoria: "consultoria",
    inicio: "2026-08-27T18:00",
    fim: "2026-08-27T20:00",
    formato: "online",
    local: "Transmissão on-line",
    descricao:
      "Plantão mensal de dúvidas técnicas. Traga a estrutura do seu cliente e receba um parecer da coordenação na hora.",
    linkInscricao: "https://timeholdingbrasil.com.br/consultoria-aberta",
  },
  {
    id: "diamantes-intensivo-set",
    titulo: "Diamantes — Intensivo de Setembro",
    categoria: "diamantes",
    inicio: "2026-09-25T09:00",
    fim: "2026-09-26T18:00",
    formato: "presencial",
    local: "Belo Horizonte · MG",
    descricao:
      "Encontro fechado dos escritórios Diamantes: operações complexas, holdings rurais e estruturação de grupos empresariais.",
    linkInscricao: "https://timeholdingbrasil.com.br/diamantes",
  },
  {
    id: "clinica-holding-rural-out",
    titulo: "Clínica de Casos — Holding rural e ITR",
    categoria: "clinica",
    inicio: "2026-10-09T19:30",
    fim: "2026-10-09T21:30",
    formato: "online",
    local: "Transmissão on-line",
    descricao:
      "Como estruturar patrimônio rural sem perder benefício fiscal: integralização de imóveis, ITR e a sucessão no campo.",
    linkInscricao: "https://timeholdingbrasil.com.br/clinicas",
  },
  {
    id: "curso-nacional-formacao-t4",
    titulo: "Curso Nacional em Formação — Turma 4",
    categoria: "formacao",
    inicio: "2026-10-23T19:00",
    fim: "2026-10-25T17:00",
    formato: "hibrido",
    local: "Curitiba · PR e transmissão on-line",
    descricao:
      "Última turma do ano da formação que certifica o profissional como especialista da Rede Nacional do Time Holding Brasil.",
    linkInscricao: "https://timeholdingbrasil.com.br/curso-nacional",
    destaque: true,
  },
  {
    id: "consultoria-aberta-out",
    titulo: "Consultoria Aberta com a coordenação",
    categoria: "consultoria",
    inicio: "2026-10-29T18:00",
    fim: "2026-10-29T20:00",
    formato: "online",
    local: "Transmissão on-line",
    descricao:
      "Plantão mensal de dúvidas técnicas com a coordenação nacional.",
    linkInscricao: "https://timeholdingbrasil.com.br/consultoria-aberta",
  },
  {
    id: "clinica-sucessao-nov",
    titulo: "Clínica de Casos — Sucessão e regime de bens",
    categoria: "clinica",
    inicio: "2026-11-13T19:30",
    fim: "2026-11-13T21:30",
    formato: "online",
    local: "Transmissão on-line",
    descricao:
      "Viabilidade da holding familiar em cada regime de bens e a proteção do patrimônio nas relações extraconjugais.",
    linkInscricao: "https://timeholdingbrasil.com.br/clinicas",
  },
  {
    id: "diamantes-fechamento-dez",
    titulo: "Diamantes — Fechamento do ciclo 2026",
    categoria: "diamantes",
    inicio: "2026-12-04T09:00",
    fim: "2026-12-05T18:00",
    formato: "presencial",
    local: "São Paulo · SP",
    descricao:
      "Balanço do ano com os escritórios Diamantes e definição das metas do ciclo seguinte.",
    linkInscricao: "https://timeholdingbrasil.com.br/diamantes",
  },
  {
    id: "consultoria-aberta-dez",
    titulo: "Consultoria Aberta — edição de encerramento",
    categoria: "consultoria",
    inicio: "2026-12-17T18:00",
    fim: "2026-12-17T20:00",
    formato: "online",
    local: "Transmissão on-line",
    descricao:
      "Último plantão do ano: planejamento tributário para a virada e o que muda em 2027.",
    linkInscricao: "https://timeholdingbrasil.com.br/consultoria-aberta",
  },
];

/* --------------------------------------------------------------- helpers -- */

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

export const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

/** "2026-08-14T19:00" → Date local, sem passar pelo parser de UTC. */
export function paraData(iso: string): Date {
  const [dia, hora = "00:00"] = iso.split("T");
  const [a, m, d] = dia.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  return new Date(a, m - 1, d, h, min || 0, 0, 0);
}

/** Chave de dia "2026-08-14" a partir de um Date. */
export function chaveDia(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}

/** Todos os dias que um evento ocupa (eventos de vários dias entram em cada um). */
export function diasDoEvento(e: Evento): string[] {
  const ini = paraData(e.inicio);
  const fim = paraData(e.fim);
  const dias: string[] = [];
  const cursor = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate());
  const ultimo = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
  // guarda contra data invertida: nunca mais de 60 iterações.
  let guarda = 0;
  while (cursor <= ultimo && guarda++ < 60) {
    dias.push(chaveDia(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias.length ? dias : [chaveDia(ini)];
}

/** Índice dia → eventos daquele dia, já ordenado por horário. */
export function indicePorDia(eventos: Evento[]): Record<string, Evento[]> {
  const mapa: Record<string, Evento[]> = {};
  for (const e of eventos) {
    for (const dia of diasDoEvento(e)) (mapa[dia] ??= []).push(e);
  }
  for (const dia of Object.keys(mapa)) {
    mapa[dia].sort((a, b) => a.inicio.localeCompare(b.inicio));
  }
  return mapa;
}

/** Quantos eventos cada mês (0-11) tem no ano dado — para o badge da sidebar. */
export function contagemPorMes(eventos: Evento[], ano: number): number[] {
  const n = Array(12).fill(0) as number[];
  for (const e of eventos) {
    const meses = new Set(diasDoEvento(e).map((d) => Number(d.slice(5, 7)) - 1));
    const anoEv = Number(e.inicio.slice(0, 4));
    if (anoEv !== ano) continue;
    for (const m of meses) n[m] += 1;
  }
  return n;
}

/** Eventos de um mês (0-11), ordenados. */
export function eventosDoMes(eventos: Evento[], ano: number, mes: number): Evento[] {
  return eventos
    .filter((e) => diasDoEvento(e).some((d) => Number(d.slice(0, 4)) === ano && Number(d.slice(5, 7)) - 1 === mes))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

/** Os N próximos eventos a partir de uma data de referência. */
export function proximos(eventos: Evento[], de: Date, n = 3): Evento[] {
  return eventos
    .filter((e) => paraData(e.fim) >= de)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .slice(0, n);
}

/** Grade do mês: 6 semanas × 7 dias, com os dias vizinhos preenchidos. */
export function gradeDoMes(ano: number, mes: number): { data: Date; doMes: boolean }[] {
  const primeiro = new Date(ano, mes, 1);
  const inicio = new Date(ano, mes, 1 - primeiro.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const data = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
    return { data, doMes: data.getMonth() === mes };
  });
}

/** "14 ago" · "14–16 ago" · "10 set – 12 set" conforme o intervalo. */
export function faixaDeDatas(e: Evento): string {
  const i = paraData(e.inicio);
  const f = paraData(e.fim);
  const mes = (d: Date) => MESES[d.getMonth()].slice(0, 3).toLowerCase();
  if (chaveDia(i) === chaveDia(f)) return `${i.getDate()} ${mes(i)}`;
  if (i.getMonth() === f.getMonth()) return `${i.getDate()}–${f.getDate()} ${mes(i)}`;
  return `${i.getDate()} ${mes(i)} – ${f.getDate()} ${mes(f)}`;
}

/** "19:00" — vazio quando o evento é de dia inteiro. */
export function horaDe(e: Evento): string {
  if (e.diaInteiro) return "";
  return e.inicio.slice(11, 16);
}
