import type { CSSProperties, ReactElement, SVGProps } from "react";
import { LP, TIPO } from "@/lib/landing";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { Reveal } from "@/components/home/reveal";

/* ============================================================================
   Seção NAS REDES da landing institucional — faixa de prova social.

   Não há API do Instagram nem de nenhuma das redes disponível aqui, e número
   inventado ("+50 mil seguidores") em página institucional é dívida de
   credibilidade. Então a prova social é a PRESENÇA: os canais oficiais, o @ de
   cada um e o que a pessoa encontra em cada lugar. Zero métrica.

   Superfície: `LP.fundoFrio` (#F8FBFF) é um literal fixo, não uma CSS var de
   tema. Por isso TODA a paleta desta seção é literal também — se usássemos
   `C.ink`/`C.surface` aqui, o tema escuro pintaria texto claro sobre um fundo
   que continua branco. A seção é clara nos dois temas, por decisão da LP.
   ========================================================================== */

/* Paleta local, fixa (ver comentário acima). */
const TINTA = "#0C0C0C"; // título/nome da rede
const TINTA_FRACA = "#5B6472"; // 5,7:1 sobre #F8FBFF
const CARTAO = "#FFFFFF";
const FIO = "#E4EAF3";
const ACENTO = "#B8451E"; // laranja acessível (o #FF6B1A puro dá 2,6:1 aqui)

interface Rede {
  nome: string;
  handle: string;
  /** ATENÇÃO: URLs plausíveis, montadas a partir do @ da marca.
   *  A equipe do Time Holding Brasil precisa CONFIRMAR cada uma antes de
   *  publicar — link social quebrado na home é o pior tipo de link quebrado. */
  url: string;
  chamada: string;
  Icone: (p: SVGProps<SVGSVGElement>) => ReactElement;
  /** Cor da rede. Todas foram escolhidas/escurecidas para passar 4,5:1 com
   *  texto branco por cima (o estado "aceso" do botão Seguir). */
  cor: string;
  /** Mesma cor em 10% sobre branco — fundo do ícone. */
  tinta: string;
}

const REDES: Rede[] = [
  {
    nome: "Instagram",
    handle: "@timeholdingbrasil",
    url: "https://www.instagram.com/timeholdingbrasil/",
    chamada: "Bastidores dos encontros e recortes das aulas.",
    Icone: Ico.ig,
    cor: "#C13584",
    tinta: "rgba(193,53,132,.10)",
  },
  {
    nome: "YouTube",
    handle: "@timeholdingbrasil",
    url: "https://www.youtube.com/@timeholdingbrasil",
    chamada: "Aulas abertas, entrevistas e trechos dos eventos.",
    Icone: Ico.youtube,
    cor: "#CC0000",
    tinta: "rgba(204,0,0,.09)",
  },
  {
    nome: "LinkedIn",
    handle: "/timeholdingbrasil",
    url: "https://www.linkedin.com/company/timeholdingbrasil/",
    chamada: "O institucional da rede e o conteúdo mais técnico.",
    Icone: Ico.li,
    cor: "#0A66C2",
    tinta: "rgba(10,102,194,.10)",
  },
  {
    nome: "Facebook",
    handle: "/timeholdingbrasil",
    url: "https://www.facebook.com/timeholdingbrasil",
    chamada: "A comunidade e a agenda de eventos presenciais.",
    Icone: Ico.facebook,
    cor: "#0E5FC0",
    tinta: "rgba(14,95,192,.10)",
  },
  {
    nome: "TikTok",
    handle: "@timeholdingbrasil",
    url: "https://www.tiktok.com/@timeholdingbrasil",
    chamada: "Respostas curtas para as dúvidas mais comuns.",
    Icone: Ico.tiktok,
    cor: "#111111",
    tinta: "rgba(17,17,17,.07)",
  },
];

/* ------------------------------------------------------------- CartaoRede -- */
function CartaoRede({ r }: { r: Rede }) {
  /* A cor da rede viaja por CSS var para que o hover/foco possa ser feito em
     CLASSE (`hover:[border-color:var(--rede)]`). Se a borda viesse no `style`
     inline, o inline venceria o hover e o card nunca acenderia. */
  const vars = { "--rede": r.cor, "--fio": FIO } as CSSProperties;

  return (
    <a
      href={r.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col border p-5 transition-colors [border-color:var(--fio)] hover:[border-color:var(--rede)] focus-visible:[border-color:var(--rede)]"
      style={{ ...vars, background: CARTAO, borderRadius: 18 }}
      aria-label={`${r.nome} do Time Holding Brasil, ${r.handle} — abre em nova aba`}
    >
      <span
        className="flex items-center justify-center rounded-2xl"
        style={{ width: 48, height: 48, background: r.tinta, color: r.cor }}
      >
        <r.Icone style={{ width: 24, height: 24 }} aria-hidden="true" />
      </span>

      <span
        className="mt-4 block text-[16px]"
        style={{ fontFamily: F.serif, fontWeight: 700, color: TINTA, letterSpacing: "-0.02em" }}
      >
        {r.nome}
      </span>

      <span
        className="mt-1 block truncate text-[12.5px]"
        style={{ fontFamily: F.mono, fontVariantNumeric: "tabular-nums", color: TINTA_FRACA }}
      >
        {r.handle}
      </span>

      <span className="mt-2.5 block text-[13px]" style={{ color: TINTA_FRACA, lineHeight: 1.55 }}>
        {r.chamada}
      </span>

      {/* "Seguir" é afordância visual, não um segundo link: o card inteiro já
          é o <a>. Acende com a cor da rede quando o card recebe hover/foco. */}
      <span className="block pt-5" style={{ marginTop: "auto" }}>
        <span
          className="inline-flex items-center justify-center gap-1.5 rounded-full border px-4 text-[13px] font-bold transition-colors [border-color:var(--fio)] group-hover:text-white group-hover:[background-color:var(--rede)] group-hover:[border-color:var(--rede)] group-focus-visible:text-white group-focus-visible:[background-color:var(--rede)] group-focus-visible:[border-color:var(--rede)]"
          style={{ height: 44, color: TINTA }}
        >
          Seguir
          <Ico.externo style={{ width: 14, height: 14 }} aria-hidden="true" />
        </span>
      </span>
    </a>
  );
}

/* ---------------------------------------------------------------- SecaoRedes */
export function SecaoRedes() {
  return (
    <section id="nas-redes" className="lp-secao" style={{ background: LP.fundoFrio, color: TINTA }}>
      <div className="lp-container">
        {/* ------------------------------------------------------- cabeçalho */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2.5">
            <span aria-hidden="true" style={{ width: 22, height: 2, borderRadius: 2, background: C.laranja }} />
            <span style={{ ...TIPO.eyebrow, fontFamily: F.mono, color: ACENTO }}>Nas redes</span>
          </p>

          <h2 className="mt-5" style={{ ...TIPO.h2, color: TINTA }}>
            Acompanhe o Time Holding Brasil{" "}
            <em style={{ fontStyle: "normal", color: ACENTO }}>onde você já está</em>
          </h2>

          <p className="mt-4" style={{ ...TIPO.corpo, color: TINTA_FRACA }}>
            Conteúdo novo toda semana nos canais oficiais da rede. Escolha por onde prefere
            acompanhar.
          </p>
        </Reveal>

        {/* ----------------------------------------------------------- grade */}
        <ul className="mt-10 grid list-none gap-4 sm:grid-cols-2 md:grid-cols-3 lg:mt-12 lg:grid-cols-5">
          {REDES.map((r, i) => (
            <Reveal key={r.nome} como="li" atraso={i * 70}>
              <CartaoRede r={r} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
