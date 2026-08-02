/* ============================================================================
   DESIGN SYSTEM DA LANDING INSTITUCIONAL (home do Time Holding Brasil).

   Camada acima de `tokens.ts`: `C`/`F` continuam sendo a fonte de cor e fonte
   do app inteiro. Este módulo acrescenta só o que a página institucional
   precisa e o app não tinha — escala tipográfica de landing, ritmo vertical,
   receitas de botão e as superfícies escuras.

   Decisões vindas da auditoria da referência (timeholdingbrasil.com.br/v2 e
   do padrão de header do G4). Cada uma está comentada com o porquê para que a
   próxima pessoa não desfaça sem saber o custo:

   1. LARANJA CONTINUA SÓLIDO (#FF6B1A) como token de sistema. A v2 usa uma
      família de 6+ laranjas soltos; isso é dívida, não design. Aqui o laranja é
      um só, e o GRADIENTE (`GRAD.marca`) é reservado a acento tipográfico e
      fios — nunca preenche botão (botão chapado lê mais firme e não briga com
      o texto preto por cima).
   2. SEM BOX-SHADOW. Nem a v2 nem o app usam sombra para profundidade. A
      hierarquia vem de blocos de cor sólida, fio de 1px e glow radial.
   3. RADIUS EM DOIS REGIMES. Pílula total nos CTAs/chips; 10-20px em cards e
      superfícies. Nada entre 4 e 8px — o meio-termo lê como bootstrap.
   4. TRACKING NEGATIVO progressivo: quanto maior o texto, mais fechado. É a
      assinatura tipográfica da referência e o que mais barato aproxima o
      resultado do mercado.
   ========================================================================== */

import { C } from "@/lib/tokens";

/* ------------------------------------------------------------- superfície -- */
/* A landing alterna claro e escuro em blocos inteiros. Os tons escuros são
   fixos (não seguem [data-theme]): a primeira dobra e a agenda são pretas nos
   dois temas, senão a página perde a assinatura de autoridade no tema claro. */
export const LP = {
  /** preto do header e do hero — o mesmo da referência. */
  preto: "#0C0C0C",
  /** preto um pouco mais frio das seções escuras internas (agenda). */
  pretoFrio: "#050608",
  /** superfície elevada dentro do escuro (cards sobre preto). */
  pretoCard: "#131313",
  /** fio sobre superfície escura. */
  linhaEscura: "rgba(255,255,255,.12)",
  /** texto secundário sobre escuro (passa 4.5:1 sobre #0C0C0C). */
  tintaEscuraFraca: "rgba(255,255,255,.66)",
  /** texto terciário/rótulo sobre escuro. */
  tintaEscuraSuave: "rgba(255,255,255,.44)",
  /** off-white frio das seções de prova social (redes). */
  fundoFrio: "#F8FBFF",
  /** largura de conteúdo — referência usa 1280. */
  largura: 1280,
} as const;

/* -------------------------------------------------------------- gradiente -- */
export const GRAD = {
  /** gradiente de marca da referência. Só para texto de acento e fios. */
  marca: "linear-gradient(90deg, #FF6A00 0%, #FF9A1F 52%, #FFB648 100%)",
  /** fio de 1px sob o header / separando blocos escuros. */
  fio: "linear-gradient(90deg, rgba(255,106,0,0) 0%, #FF6A00 18%, #FFB648 82%, rgba(255,182,72,0) 100%)",
  /** glow radial laranja — a assinatura visual dos blocos escuros. */
  glow: "radial-gradient(circle, rgba(255,107,26,.30) 0%, rgba(255,107,26,0) 68%)",
  /** glow frio, usado atrás do calendário para não estourar de laranja. */
  glowFrio: "radial-gradient(circle, rgba(120,150,255,.14) 0%, rgba(120,150,255,0) 70%)",
} as const;

/** Aplica o gradiente da marca no texto (usar em <span>). */
export const textoGradiente = {
  backgroundImage: GRAD.marca,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  // fallback: se background-clip:text não pintar, o laranja sólido aparece.
  WebkitTextFillColor: "transparent",
} as const;

/* ------------------------------------------------------------------ ritmo -- */
/* Respiro vertical da landing. A referência usa ~7em (112px) desktop; no
   mobile ela cai para ~12% da largura, que na prática é 56-64px. */
export const RITMO = {
  secaoDesktop: 112,
  secaoTablet: 80,
  secaoMobile: 60,
  /** padding lateral do container por breakpoint. */
  ladoDesktop: 40,
  ladoMobile: 20,
} as const;

/* --------------------------------------------------------------- tipografia -- */
/* Escala fluida com clamp(): um só valor cobre mobile→desktop sem media query,
   o que mantém o texto coerente nos tamanhos intermediários (tablet), onde
   breakpoints discretos costumam quebrar. Tracking fecha conforme o corpo cresce. */
export const TIPO = {
  /** manchete da primeira dobra. */
  display: {
    fontFamily: "var(--font-manrope), Manrope, sans-serif",
    fontSize: "clamp(2.15rem, 1.15rem + 4.4vw, 4.25rem)",
    lineHeight: 1.04,
    letterSpacing: "-0.035em",
    fontWeight: 800,
  },
  /** título de seção. */
  h2: {
    fontFamily: "var(--font-manrope), Manrope, sans-serif",
    fontSize: "clamp(1.7rem, 1.15rem + 2.1vw, 2.75rem)",
    lineHeight: 1.1,
    letterSpacing: "-0.028em",
    fontWeight: 700,
  },
  /** título de card / subtítulo forte. */
  h3: {
    fontFamily: "var(--font-manrope), Manrope, sans-serif",
    fontSize: "clamp(1.05rem, 0.95rem + 0.4vw, 1.3rem)",
    lineHeight: 1.25,
    letterSpacing: "-0.02em",
    fontWeight: 700,
  },
  /** parágrafo de destaque (abaixo de manchete). */
  leadGrande: {
    fontSize: "clamp(1rem, 0.94rem + 0.32vw, 1.16rem)",
    lineHeight: 1.68,
    letterSpacing: "-0.006em",
  },
  /** corpo padrão. */
  corpo: {
    fontSize: "clamp(0.94rem, 0.9rem + 0.16vw, 1rem)",
    lineHeight: 1.7,
    letterSpacing: "-0.004em",
  },
  /** rótulo/eyebrow em caixa alta. */
  eyebrow: {
    fontSize: 11.5,
    letterSpacing: "0.18em",
    fontWeight: 700,
    textTransform: "uppercase" as const,
  },
} as const;

/* ------------------------------------------------------------------ botão -- */
/* Duas famílias, conforme a auditoria:
   · `pilula`  → CTA de conteúdo (dentro das seções). Generoso na horizontal.
   · `barra`   → par sólido/outline do header, radius 10px (padrão G4, que o
                 PDF do PO pediu explicitamente). Compacto e pesado.
   Sobre laranja o texto é SEMPRE preto — regra de contraste da marca. */
type Estilo = React.CSSProperties;

const BASE_BOTAO: Estilo = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontWeight: 700,
  letterSpacing: "-0.014em",
  whiteSpace: "nowrap",
  border: "1px solid transparent",
  transition: "background-color .18s ease, color .18s ease, border-color .18s ease, transform .12s ease",
};

export const BOTAO = {
  /** CTA principal de seção — laranja chapado, pílula. */
  pilula: {
    ...BASE_BOTAO,
    background: C.laranja,
    color: "#0C0C0C",
    borderRadius: 9999,
    padding: "0 34px",
    height: 54,
    fontSize: 15.5,
  } as Estilo,
  /** CTA secundário de seção sobre fundo claro — outline. */
  pilulaOutline: {
    ...BASE_BOTAO,
    background: "transparent",
    color: C.ink,
    borderColor: C.line,
    borderRadius: 9999,
    padding: "0 30px",
    height: 54,
    fontSize: 15.5,
  } as Estilo,
  /** CTA secundário sobre fundo ESCURO — outline claro. */
  pilulaOutlineEscuro: {
    ...BASE_BOTAO,
    background: "transparent",
    color: "#fff",
    borderColor: "rgba(255,255,255,.28)",
    borderRadius: 9999,
    padding: "0 30px",
    height: 54,
    fontSize: 15.5,
  } as Estilo,
  /** header — sólido (padrão G4: retângulo suave, texto pequeno e pesado). */
  barra: {
    ...BASE_BOTAO,
    background: C.laranja,
    color: "#0C0C0C",
    borderRadius: 10,
    padding: "0 18px",
    height: 40,
    fontSize: 12.5,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    textTransform: "uppercase" as const,
  } as Estilo,
  /** header — outline sobre a barra preta. */
  barraOutline: {
    ...BASE_BOTAO,
    background: "transparent",
    color: "#fff",
    borderColor: "rgba(255,255,255,.34)",
    borderRadius: 10,
    padding: "0 18px",
    height: 40,
    fontSize: 12.5,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    textTransform: "uppercase" as const,
  } as Estilo,
} as const;

/* ------------------------------------------------------------------ card -- */
export const CARD = {
  /** card sobre fundo claro — fio, sem sombra. */
  claro: {
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 18,
    overflow: "hidden",
  } as Estilo,
  /** card sobre fundo escuro. */
  escuro: {
    background: LP.pretoCard,
    border: `1px solid ${LP.linhaEscura}`,
    borderRadius: 18,
    overflow: "hidden",
  } as Estilo,
} as const;

/* ------------------------------------------------------------- navegação -- */
/* Itens do menu institucional, na ordem que o PO definiu no wireframe.
   Âncoras para as seções da própria home; a "Área do membro" e o
   "Quero me inscrever" são os dois CTAs do canto direito. */
export const MENU = [
  { id: "quem-somos", rotulo: "Quem somos" },
  { id: "membros", rotulo: "Membros" },
  { id: "artigos", rotulo: "Artigos" },
  { id: "nas-redes", rotulo: "Nas redes" },
  { id: "proximos-eventos", rotulo: "Próximos eventos" },
] as const;

export const CTA = {
  inscrever: { rotulo: "Quero me inscrever", href: "/entrar?intencao=cadastro" },
  membro: { rotulo: "Área do membro", href: "/entrar" },
} as const;
