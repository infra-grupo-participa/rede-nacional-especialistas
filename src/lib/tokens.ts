/* ============================================================================
   Tokens de design — replicados do novo front (rede-nacional-especialistas-local).

   Branco é a página. Preto é a palavra. Laranja é o detalhe — mapa, seleção,
   ação. Nada de texto branco sobre laranja (2,7:1, ilegível); sobre laranja a
   letra é sempre preta (7,7:1).
   ========================================================================== */

export const C = {
  fundo: "#FFFFFF", // a página é branca
  surface: "#FFFFFF", // cartões — separados do fundo por fio, não por cor
  paper: "#FBF7F3", // preenchimento leve dentro do branco (campos)
  ink: "#111111", // todo o texto e as ações principais
  muted: "#6E6A66", // texto secundário sobre o branco
  sobreFundo: "#6E6A66", // fundo é branco → texto secundário é o mesmo
  line: "#E9E3DD", // divisória / fio
  laranja: "#FE7413",
  petrol: "#FE7413", // ação/seleção = laranja com letra preta
  petrolDeep: "#C24E00",
  petrolSoft: "#FFF1E5", // realce laranja bem claro
  brass: "#C24E00",
  brassSoft: "#FFF1E5",
  whats: "#111111", // o contato é a ação mais forte: preto
  whatsDeep: "#000000",
} as const;

/** Borda padrão (fio sobre o branco). */
export const BORDA = `1px solid ${C.line}`;

/* Uma fonte só no site inteiro: Inter. Os três nomes continuam existindo porque
   marcam papéis diferentes (título, corpo, etiqueta) — o que distingue cada
   papel é peso, tamanho e espaçamento, não a família. A variável --font-inter
   vem do next/font no layout. */
const INTER =
  "var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const F = {
  serif: INTER,
  sans: INTER,
  mono: INTER,
} as const;
