/* Reações dos posts (puro, serve no servidor e no navegador). Cada membro tem
   uma reação por post; o post guarda a contagem por tipo em `posts.reacoes`. */

export const REACOES = ["curtir", "amei", "risada", "uau", "triste", "raiva"] as const;
export type Reacao = (typeof REACOES)[number];

export const ROTULO_REACAO: Record<Reacao, string> = {
  curtir: "Curtir",
  amei: "Amei",
  risada: "Risada",
  uau: "Uau",
  triste: "Triste",
  raiva: "Raiva",
};

export function ehReacao(x: unknown): x is Reacao {
  return typeof x === "string" && (REACOES as readonly string[]).includes(x);
}

export type ContagemReacoes = Partial<Record<Reacao, number>>;

/** Limpa o jsonb do banco: só tipos conhecidos com número inteiro positivo. */
export function lerContagem(bruto: unknown): ContagemReacoes {
  const saida: ContagemReacoes = {};
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return saida;
  for (const [tipo, n] of Object.entries(bruto as Record<string, unknown>)) {
    if (ehReacao(tipo) && typeof n === "number" && Number.isFinite(n) && n > 0) saida[tipo] = Math.floor(n);
  }
  return saida;
}

export function totalReacoes(c: ContagemReacoes): number {
  return REACOES.reduce((soma, t) => soma + (c[t] ?? 0), 0);
}

/** Tipos com pelo menos uma reação, do mais usado para o menos usado (empate:
 *  a ordem fixa de REACOES). */
export function reacoesOrdenadas(c: ContagemReacoes): { tipo: Reacao; n: number }[] {
  return REACOES.map((tipo, i) => ({ tipo, n: c[tipo] ?? 0, i }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map(({ tipo, n }) => ({ tipo, n }));
}

/** Contagem depois de o membro trocar a própria reação de `de` para `para`. */
export function trocarReacao(c: ContagemReacoes, de: Reacao | null, para: Reacao | null): ContagemReacoes {
  const nova: ContagemReacoes = { ...c };
  if (de) {
    const n = (nova[de] ?? 0) - 1;
    if (n > 0) nova[de] = n;
    else delete nova[de];
  }
  if (para) nova[para] = (nova[para] ?? 0) + 1;
  return nova;
}
