/* ============================================================================
   Tokens de design — portados do MVP rede-nacional-especialistas.jsx

   Laranja é o ambiente. Branco é o papel. Preto é a tinta.
   Nenhum texto fica branco sobre laranja (contraste 2.7:1, ilegível);
   preto sobre laranja dá 7.7:1, então toda letra é preta.
   ========================================================================== */

export const C = {
  fundo: "#FE7413", // laranja — a cor da página
  ink: "#111111", // preto — todo o texto e as ações principais
  surface: "#FFFFFF", // branco — os cartões, as folhas de conteúdo
  paper: "#FFF6EF", // preenchimento leve DENTRO do branco (inputs)
  line: "#EFE2D6", // divisória sobre o branco
  muted: "#6B6259", // texto secundário sobre o branco
  sobreFundo: "#2E1600", // texto secundário sobre o laranja
  laranja: "#FE7413",
  petrol: "#111111", // ação primária = preto
  petrolDeep: "#000000",
  petrolSoft: "#FFEBD9", // realce laranja bem claro
  brass: "#8A3E06",
  brassSoft: "#FFEBD9",
  whats: "#111111", // o verde do WhatsApp brigaria com o laranja
  whatsDeep: "#000000",
} as const;

export const F = {
  // O nome da pessoa sempre em serifa. É a regra tipográfica da rede.
  serif:
    "ui-serif, Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', serif",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  // Sigla do estado, contagens e etiquetas: cara de registro/placa.
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
} as const;
