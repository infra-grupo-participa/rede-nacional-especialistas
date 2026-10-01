"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { TIPO, BOTAO, CARD } from "@/lib/landing";
import { Avatar } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { Reveal } from "@/components/home/reveal";
import { MapaBrasil } from "@/components/mapa-brasil";
import { SheetEstado } from "@/components/sheet-estado";
import { rotuloProfissao } from "@/lib/profissoes-permitidas";
import type { EspecialistaCatalogo } from "@/lib/queries";

/* ============================================================================
   Seção MEMBROS da landing institucional.

   Três blocos, nesta ordem de leitura: declaração + número de autoridade + CTA
   à esquerda, mapa do Brasil à direita (empilhados no mobile) e, abaixo, a
   prévia com foto dos membros em destaque — pedido explícito do PO para o
   cliente "ver como ficaria" com gente de verdade.

   Por que o acento é `C.petrolDeep` e não `C.laranja`: sobre o off-white
   (#FAF6EE) o laranja da marca mede 2,6:1, o que reprova até no limiar de
   texto grande (3:1). O laranja sólido fica só no que é decorativo (o traço do
   eyebrow) e nos CTAs, onde ele é FUNDO e a letra é preta. Não troque de volta.
   ========================================================================== */

/** Quantos membros entram na prévia (2 linhas de 4 no desktop). */
const PREVIA = 8;

const FRASE =
  "Uma comunidade de especialistas presente em todo o Brasil, entregando soluções estratégicas para a estruturação patrimonial e de negócios para as famílias brasileiras.";
/** Trecho que recebe ênfase visual — o PO marcou em negrito no wireframe. */
const ENFASE = "soluções estratégicas para a estruturação patrimonial";

/* Ênfase sem `dangerouslySetInnerHTML`: fatiamos a frase em torno do trecho e
   devolvemos nós React. Se o trecho não existir mais na frase, degrada para o
   texto puro em vez de sumir com a ênfase silenciosamente. */
function comEnfase(texto: string, trecho: string): ReactNode {
  const i = texto.indexOf(trecho);
  if (i === -1) return texto;
  return (
    <>
      {texto.slice(0, i)}
      <em
        style={{
          fontStyle: "normal",
          color: C.petrolDeep,
          textDecoration: "underline",
          textDecorationColor: C.laranja,
          textDecorationThickness: 2,
          textUnderlineOffset: 6,
        }}
      >
        {trecho}
      </em>
      {texto.slice(i + trecho.length)}
    </>
  );
}

/* O CTA sai do `BOTAO.pilula` sem padding/fontSize fixos: no 360px o rótulo
   completo ("Ver membros do Time Holding Brasil") estoura a linha com os 34px
   de padding do token. Largura, padding e corpo passam a vir de classes
   responsivas; o resto do token (cor, altura, raio, peso) fica intacto.
   `undefined` (e não 0) é obrigatório: o React omite a propriedade, e só assim
   as classes `px-*`/`text-*` valem — estilo inline sempre vence classe. */
const CTA_MEMBROS: CSSProperties = { ...BOTAO.pilula, padding: undefined, fontSize: undefined };

/* ---------------------------------------------------------- CartaoMembro -- */
function CartaoMembro({ m }: { m: EspecialistaCatalogo }) {
  // sem slug o perfil ainda não tem URL pública — manda para a vitrine.
  const href = m.slug ? `/especialista/${m.slug}` : "/vitrine";
  const local = [m.cidade?.trim(), m.uf?.trim()].filter(Boolean).join("/");

  return (
    <Link
      href={href}
      aria-label={`Ver o perfil de ${m.nome}`}
      className="lp-card-claro flex h-full w-full flex-col items-center px-3.5 pb-5 pt-6 text-center"
      style={CARD.claro}
    >
      <Avatar nome={m.nome} foto={m.avatar_url} size={76} />

      {/* altura de 2 linhas reservada: sem isso a profissão e a cidade dançam
          de card para card conforme o nome quebra, e a grade perde o alinhamento.
          O clamp mora no filho porque `.linha2` usa `display:-webkit-box`, que
          não centraliza vertical — o pai flex resolve isso. */}
      <span className="mt-3.5 flex w-full items-center justify-center" style={{ minHeight: 38 }}>
        <span
          className="linha2 text-[15px]"
          style={{ fontFamily: F.serif, fontWeight: 700, color: C.ink, letterSpacing: "-0.018em", lineHeight: 1.25 }}
        >
          {m.nome}
        </span>
      </span>

      <span className="mt-1 block truncate text-[12.5px] font-semibold" style={{ color: C.petrolDeep }}>
        {rotuloProfissao(m.profissao)}
      </span>

      {local && (
        <span className="mt-2 inline-flex max-w-full items-center gap-1 text-[12px]" style={{ color: C.muted }}>
          <Ico.pin style={{ width: 12, height: 12, flexShrink: 0 }} aria-hidden="true" />
          <span className="truncate">{local}</span>
        </span>
      )}
    </Link>
  );
}

/* -------------------------------------------------------------- SecaoMembros */
export function SecaoMembros({
  contagem,
  destaques,
  total,
}: {
  contagem: Record<string, number>;
  destaques: EspecialistaCatalogo[];
  total: number;
}) {
  const [uf, setUf] = useState<string | null>(null);
  const previa = destaques.slice(0, PREVIA);

  return (
    <section id="membros" className="lp-secao" style={{ background: C.fundo, color: C.ink }}>
      <div className="lp-container">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* ------------------------------------------------ declaração + CTA */}
          <Reveal>
            <p className="inline-flex items-center gap-2.5">
              <span aria-hidden="true" style={{ width: 22, height: 2, borderRadius: 2, background: C.laranja }} />
              <span style={{ ...TIPO.eyebrow, fontFamily: F.mono, color: C.petrolDeep }}>Membros</span>
            </p>

            <h2 className="mt-5" style={{ ...TIPO.h2, color: C.ink }}>
              {comEnfase(FRASE, ENFASE)}
            </h2>

            {total > 0 && (
              <>
                <hr className="lp-fio mt-7" style={{ width: 88 }} />
                <p className="mt-4 flex items-baseline gap-2">
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 800,
                      fontSize: 30,
                      letterSpacing: "-0.03em",
                      color: C.ink,
                    }}
                  >
                    {total.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-[14px]" style={{ color: C.sobreFundo }}>
                    {total === 1 ? "especialista no Brasil" : "especialistas em todo o Brasil"}
                  </span>
                </p>
              </>
            )}

            <Link
              href="/vitrine"
              className="press mt-7 w-full px-6 text-[14px] sm:w-auto sm:px-8 sm:text-[15.5px]"
              style={CTA_MEMBROS}
            >
              Ver membros do Time Holding Brasil
            </Link>
          </Reveal>

          {/* ----------------------------------------------------------- mapa */}
          {/* `MapaBrasil` já traz o próprio card, a legenda e a acessibilidade
              de teclado — reusado inteiro, sem reimplementar nada. */}
          <Reveal atraso={110} className="lg:order-last">
            <div className="-mx-4 sm:mx-0">
              <MapaBrasil contagem={contagem} onEstado={setUf} />
            </div>
          </Reveal>
        </div>

        {/* ------------------------------------------------- prévia de membros */}
        <Reveal atraso={80} className="mt-2 lg:mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h3 className="text-[15px]" style={{ fontFamily: F.serif, fontWeight: 700, color: C.ink, letterSpacing: "-0.018em" }}>
              Alguns dos nossos membros
            </h3>
            {/* py-3 leva o alvo de toque a 44px sem mexer na linha de base. */}
            <Link
              href="/vitrine"
              className="inline-flex items-center gap-1.5 py-3 text-[13px] font-semibold"
              style={{ color: C.petrolDeep }}
            >
              Ver a rede inteira
              <Ico.seta style={{ width: 15, height: 15 }} aria-hidden="true" />
            </Link>
          </div>

          {previa.length > 0 ? (
            /* mobile: trilho horizontal com snap, sangrando até a borda da tela.
               md+: vira grade e o trilho deixa de rolar. */
            <ul className="lp-trilho -mx-5 mt-4 flex snap-x snap-mandatory list-none gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-4">
              {previa.map((m) => (
                <li key={m.id} className="w-[168px] shrink-0 snap-start md:w-auto md:shrink">
                  <CartaoMembro m={m} />
                </li>
              ))}
            </ul>
          ) : (
            /* vazio: um painel do mesmo material dos cards, não um buraco. */
            <div className="mt-4 px-5 py-10 text-center" style={CARD.claro}>
              <p className="text-[15px]" style={{ fontFamily: F.serif, fontWeight: 700, color: C.ink, letterSpacing: "-0.018em" }}>
                Os perfis dos membros aparecem aqui em instantes.
              </p>
              <p className="mx-auto mt-2 max-w-md text-[13.5px]" style={{ color: C.sobreFundo, lineHeight: 1.65 }}>
                Enquanto isso, use o mapa acima para encontrar um especialista no seu estado.
              </p>
            </div>
          )}
        </Reveal>
      </div>

      {/* folha do estado — mesmo padrão da vitrine: a `key` remonta o conteúdo
          a cada UF, evitando mostrar os dados do estado anterior. */}
      <SheetEstado key={uf ?? "nenhum"} uf={uf} onFechar={() => setUf(null)} />
    </section>
  );
}
