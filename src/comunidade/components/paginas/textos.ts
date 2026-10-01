/* Textos de data e de contagem das abas do grupo (Sobre, Membros, perfil).
   Puro, sem I/O. As datas saem sempre no fuso de São Paulo, para o servidor
   (UTC) não virar o dia nem o mês. */

const FUSO = "America/Sao_Paulo";

/** "outubro de 2026" */
export function mesDeAno(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, month: "long", year: "numeric" }).format(new Date(iso));
}

/** "4 de setembro de 2026" */
export function diaPorExtenso(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

/** "12/09/2026" */
export function diaCurto(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}

/** Tempo decorrido por extenso, para "No ar há ...": "menos de um dia",
 *  "3 dias", "2 meses", "1 ano". */
export function tempoDecorrido(iso: string, agora: number = Date.now()): string {
  const dias = Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 86400000));
  if (dias < 1) return "menos de um dia";
  if (dias < 30) return plural(dias, "dia", "dias");
  const meses = Math.floor(dias / 30.44);
  if (meses < 12) return plural(Math.max(meses, 1), "mês", "meses");
  return plural(Math.floor(dias / 365.25) || 1, "ano", "anos");
}

/** "1 post" / "3 posts" (número com separador de milhar). */
export function plural(n: number, um: string, varios: string): string {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

/** "Advogada · São Paulo/SP", com o que houver. */
export function ondeEoQue(m: { profissao?: string | null; cidade?: string | null; uf?: string | null }): string {
  return [m.profissao?.trim(), lugar(m)].filter(Boolean).join(" · ");
}

/** "São Paulo/SP", "São Paulo" ou "SP". */
export function lugar(m: { cidade?: string | null; uf?: string | null }): string {
  const cidade = m.cidade?.trim();
  const uf = m.uf?.trim();
  if (cidade && uf && cidade.toUpperCase() !== uf.toUpperCase()) return `${cidade}/${uf}`;
  return cidade || uf || "";
}
