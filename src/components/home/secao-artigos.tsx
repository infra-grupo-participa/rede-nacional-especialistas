"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { TIPO, BOTAO, CARD } from "@/lib/landing";
import { Avatar } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { Reveal } from "@/components/home/reveal";
import { Capa2 } from "@/components/artigo/capa";
import { dataPonto } from "@/lib/utils";
import { chapeuDe, tempoLeitura, type ArtigoComAutor } from "@/lib/artigos-tipos";

/* ============================================================================
   Seção ARTIGOS da landing institucional.

   Mesmo sistema visual da seção de membros (eyebrow com traço, acento em
   `C.petrolDeep`, card com fio e sem sombra), mudando só a superfície: aqui o
   fundo é `C.paper`, um degrau mais quente que o off-white da seção anterior,
   e os cards voltam para `C.surface` — é o contraste que separa os dois blocos
   sem precisar de linha divisória.

   O "carregar mais" fatia o array recebido no cliente (mesmo padrão de
   `painel-artigos-desktop.tsx`): a home já busca os artigos no servidor, então
   revelar mais não custa uma nova viagem ao banco.
   ========================================================================== */

/** Quantos artigos entram por vez (múltiplo de 3 = linhas cheias no desktop). */
const PASSO = 6;

/* Outline do token sem padding/fontSize fixos — o rótulo com a contagem estoura
   a linha no 360px com os 30px de padding do `BOTAO.pilulaOutline`. `undefined`
   (e não 0) porque o React omite a propriedade: estilo inline vence classe, e
   um `padding: 0` inline anularia as classes `px-*` responsivas. */
const CTA_MAIS: CSSProperties = { ...BOTAO.pilulaOutline, padding: undefined, fontSize: undefined };

/* ---------------------------------------------------------- CartaoArtigoLP -- */
function CartaoArtigoLP({ a }: { a: ArtigoComAutor }) {
  // sem slug o artigo ainda é acessível pelo id (mesma rota).
  const href = `/artigo/${a.slug ?? a.id}`;
  const publicado = a.publicado_em ?? a.criado_em;
  const minutos = tempoLeitura(a);

  return (
    <Link
      href={href}
      aria-label={`Ler o artigo: ${a.titulo}`}
      className="lp-card-claro group flex h-full flex-col"
      style={CARD.claro}
    >
      <Capa2 titulo={a.titulo} capa={a.capa} variante="destaque" />

      <span className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3.5">
        <span className="flex items-baseline justify-between gap-3">
          <span
            className="truncate uppercase"
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".12em",
              color: C.petrolDeep,
            }}
          >
            {chapeuDe(a)}
          </span>
          <time
            dateTime={publicado}
            className="shrink-0 text-[11px]"
            style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}
          >
            {dataPonto(publicado)}
          </time>
        </span>

        <span
          className="linha3 mt-2 block text-[18px]"
          style={{ color: C.ink, fontFamily: F.serif, fontWeight: 700, letterSpacing: "-0.022em", lineHeight: 1.22 }}
        >
          {a.titulo}
        </span>

        {a.resumo && (
          <span className="linha3 mt-2 block text-[13.5px]" style={{ color: C.sobreFundo, lineHeight: 1.6 }}>
            {a.resumo}
          </span>
        )}

        {/* rodapé do card: assinatura + a chamada textual que o PO pediu. */}
        <span className="mt-auto block pt-4">
          <span className="block" style={{ height: 1, background: C.line }} />
          <span className="mt-3 flex items-center gap-2">
            <Avatar nome={a.autor.nome} foto={a.autor.avatar_url} size={24} />
            <span className="min-w-0 flex-1 truncate text-[12px]" style={{ color: C.ink, fontWeight: 600 }}>
              {a.autor.nome}
            </span>
            <span
              className="shrink-0 text-[11px]"
              style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}
            >
              {minutos} min
            </span>
          </span>
          <span
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold group-hover:underline"
            style={{ color: C.petrolDeep }}
          >
            Leia mais <span aria-hidden="true">»</span>
          </span>
        </span>
      </span>
    </Link>
  );
}

/* -------------------------------------------------------------- SecaoArtigos */
export function SecaoArtigos({ artigos }: { artigos: ArtigoComAutor[] }) {
  const [mostrar, setMostrar] = useState(PASSO);
  const visiveis = artigos.slice(0, mostrar);
  const restantes = artigos.length - visiveis.length;

  return (
    <section id="artigos" className="lp-secao" style={{ background: C.paper, color: C.ink }}>
      <div className="lp-container">
        {/* ------------------------------------------------------- cabeçalho */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2.5">
            <span aria-hidden="true" style={{ width: 22, height: 2, borderRadius: 2, background: C.laranja }} />
            <span style={{ ...TIPO.eyebrow, fontFamily: F.mono, color: C.petrolDeep }}>Artigos</span>
          </p>

          <h2 className="mt-5" style={{ ...TIPO.h2, color: C.ink }}>
            Conhecimento aplicado, escrito por{" "}
            <em style={{ fontStyle: "normal", color: C.petrolDeep }}>quem está na prática</em>
          </h2>

          <p className="mt-4" style={{ ...TIPO.corpo, color: C.sobreFundo }}>
            Holding, sucessão, proteção patrimonial e tributário — publicados pelos próprios
            especialistas do Time Holding Brasil.
          </p>
        </Reveal>

        {/* ----------------------------------------------------------- grade */}
        {artigos.length === 0 ? (
          <Reveal atraso={90} className="mx-auto mt-10 max-w-xl">
            <div className="px-6 py-12 text-center" style={CARD.claro}>
              <span
                className="mx-auto flex items-center justify-center rounded-2xl"
                style={{ width: 46, height: 46, background: C.petrolSoft, color: C.petrolDeep }}
              >
                <Ico.livro style={{ width: 22, height: 22 }} aria-hidden="true" />
              </span>
              <p
                className="mt-4 text-[16px]"
                style={{ fontFamily: F.serif, fontWeight: 700, color: C.ink, letterSpacing: "-0.018em" }}
              >
                Os primeiros artigos estão sendo escritos.
              </p>
              <p className="mx-auto mt-2 max-w-sm text-[13.5px]" style={{ color: C.sobreFundo, lineHeight: 1.65 }}>
                Assim que a rede publicar, o conteúdo aparece aqui — sempre assinado por um
                especialista do Time Holding Brasil.
              </p>
            </div>
          </Reveal>
        ) : (
          <>
            {/* Com menos artigos que colunas, um grid de 3 colunas encosta o
                card na margem esquerda e desalinha da chamada, que é
                centralizada. Nesse caso a lista vira um flex centralizado com
                a mesma largura de coluna — a rede ainda tem poucos artigos
                publicados, então este é o estado real de hoje, não uma borda. */}
            <ul
              className={
                visiveis.length < 3
                  ? "mt-10 flex list-none flex-wrap justify-center gap-5 lg:mt-12"
                  : "mt-10 grid list-none gap-5 md:grid-cols-2 lg:mt-12 lg:grid-cols-3"
              }
            >
              {visiveis.map((a, i) => (
                /* o atraso só escalona a PRIMEIRA leva; nas seguintes o índice
                   volta a crescer e o card ainda entra suave, sem espera longa. */
                <Reveal
                  key={a.id}
                  como="li"
                  atraso={Math.min(i, 5) * 60}
                  className={visiveis.length < 3 ? "w-full max-w-[380px]" : ""}
                >
                  <CartaoArtigoLP a={a} />
                </Reveal>
              ))}
            </ul>

            {/* status para leitor de tela: o botão não muda de lugar, então a
                única pista de que algo aconteceu precisa ser anunciada. */}
            <p role="status" aria-live="polite" className="sr-only">
              Mostrando {visiveis.length} de {artigos.length} artigos.
            </p>

            {restantes > 0 && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setMostrar((n) => n + PASSO)}
                  className="press w-full max-w-xs px-6 text-[14px] sm:w-auto sm:max-w-none sm:px-8 sm:text-[15.5px]"
                  style={CTA_MAIS}
                >
                  Carregar mais
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 600,
                      color: C.muted,
                    }}
                  >
                    {restantes} {restantes === 1 ? "restante" : "restantes"}
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
