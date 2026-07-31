/* ============================================================================
   Tokens de design — IDENTIDADE VISUAL THB (Time Holding Brasil).
   Fonte: LP do Holding Total (ver vault "Identidade visual THB").

   Off-white é a página (calor, não branco cru). Preto profundo é autoridade
   (headers/seções de destaque). Laranja #FF6B1A é a ação/energia da marca.
   Títulos em Manrope (bold extrovertido); corpo em Inter.
   Sobre laranja a letra é sempre PRETA (contraste); nunca branca.
   ========================================================================== */

export const C = {
  fundo: "#FAF6EE", // off-white quente — a página (não branco puro)
  surface: "#FFFFFF", // cartões — brancos, sobressaem do off-white
  paper: "#F4EEE3", // preenchimento leve (campos) sobre o off-white
  ink: "#141210", // texto e ações principais (preto quente)
  preto: "#0E0E0E", // preto profundo — seções de autoridade / hero
  muted: "#6E6A66", // texto secundário
  sobreFundo: "#6E6A66",
  line: "#E7E0D3", // divisória / fio sobre o off-white
  laranja: "#FF6B1A", // cor da marca THB
  petrol: "#FF6B1A", // ação/seleção = laranja com letra preta
  petrolDeep: "#B8451E", // laranja escuro (texto sobre soft, hover)
  petrolSoft: "#FFEEE0", // realce laranja bem claro
  brass: "#B8451E",
  brassSoft: "#FFEEE0",
  whats: "#141210",
  whatsDeep: "#000000",
  /** sombra laranja dos CTAs (micro-elevação da marca). */
  sombraLaranja: "0 8px 24px rgba(255,107,26,.28)",
} as const;

/** Borda padrão (fio sobre o off-white). */
export const BORDA = `1px solid ${C.line}`;

/* Duas famílias: Manrope nos títulos (personalidade THB) e Inter no corpo.
   As variáveis --font-manrope e --font-inter vêm do next/font no layout.
   F.serif = títulos (Manrope) · F.sans = corpo (Inter) · F.mono = etiquetas/números
   (Inter com tabular-nums no uso). */
const MANROPE =
  "var(--font-manrope), Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const INTER =
  "var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const F = {
  serif: MANROPE, // títulos/manchetes
  sans: INTER, // corpo
  mono: INTER, // etiquetas/números (uso com tabular-nums)
} as const;
