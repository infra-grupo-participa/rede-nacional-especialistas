/* ============================================================================
   Tokens de design — IDENTIDADE VISUAL THB (Time Holding Brasil).
   Fonte: LP do Holding Total (ver vault "Identidade visual THB").

   Off-white é a página (calor, não branco cru). Preto profundo é autoridade
   (headers/seções de destaque). Laranja #FF6B1A é a ação/energia da marca.
   Títulos em Manrope (bold extrovertido); corpo em Inter.
   Sobre laranja a letra é sempre PRETA (contraste); nunca branca.
   ========================================================================== */

/* Os tokens apontam para CSS vars (definidas em globals.css por tema). Trocar
   [data-theme] no <html> repinta tudo — nenhum componente precisa mudar.
   Fallbacks garantem o tema claro caso a var não resolva. */
export const C = {
  fundo: "var(--fundo, #FAF6EE)",
  surface: "var(--surface, #FFFFFF)",
  paper: "var(--paper, #F4EEE3)",
  ink: "var(--ink, #141210)",
  preto: "var(--preto, #0E0E0E)",
  muted: "var(--muted, #6E6A66)",
  sobreFundo: "var(--sobreFundo, #6E6A66)",
  line: "var(--line, #E7E0D3)",
  laranja: "var(--laranja, #FF6B1A)",
  petrol: "var(--petrol, #FF6B1A)",
  petrolDeep: "var(--petrolDeep, #B8451E)",
  petrolSoft: "var(--petrolSoft, #FFEEE0)",
  brass: "var(--brass, #B8451E)",
  brassSoft: "var(--brassSoft, #FFEEE0)",
  whats: "var(--whats, #141210)",
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
