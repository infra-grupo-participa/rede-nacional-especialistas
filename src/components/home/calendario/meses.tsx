"use client";

/* ============================================================================
   Navegação de meses do calendário: a "lombada" da agenda no desktop e o
   trilho horizontal de chips no mobile — os dois recebem só (mes, aoEscolher)
   para que a seção seja a única dona do estado.
   ========================================================================== */

import { useEffect, useRef } from "react";
import { CATEGORIAS, MESES, ORDEM_CATEGORIAS } from "@/lib/eventos";
import { LP } from "@/lib/landing";
import { C, F } from "@/lib/tokens";
import { ANO, CONTAGENS, COR_CLARA, reduzMotion } from "@/components/home/calendario/apoio";

/* ---------------------------------------------------------------- legenda -- */

export function Legenda({ horizontal = false }: { horizontal?: boolean }) {
  return (
    <ul className={horizontal ? "flex flex-row flex-wrap gap-x-4 gap-y-2" : "flex flex-col gap-2"}>
      {ORDEM_CATEGORIAS.map((cat) => (
        <li key={cat} className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: COR_CLARA[cat] }} />
          <span style={{ fontSize: 11.5, color: LP.tintaEscuraFraca }}>{CATEGORIAS[cat].rotulo}</span>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------- lombada (só desktop) -- */

export function LombadaMeses({ mes, aoEscolher }: { mes: number; aoEscolher: (m: number) => void }) {
  return (
    <aside className="hidden flex-col lg:flex" style={{ background: LP.preto, borderRight: `1px solid ${LP.linhaEscura}` }}>
      <div className="px-5 pb-4 pt-6">
        <p style={{ fontFamily: F.serif, fontWeight: 800, fontSize: 14, letterSpacing: "-0.01em", color: "#fff" }}>
          Time Holding Brasil
        </p>
        <p className="mt-0.5" style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em", color: LP.tintaEscuraSuave }}>
          AGENDA {ANO}
        </p>
      </div>
      <nav aria-label="Meses da agenda" className="flex-1 px-3">
        <ul className="flex flex-col gap-0.5">
          {MESES.map((nome, m) => {
            const ativo = m === mes;
            const vazio = CONTAGENS[m] === 0;
            return (
              <li key={nome}>
                <button
                  type="button"
                  disabled={vazio}
                  aria-current={ativo ? "true" : undefined}
                  onClick={() => aoEscolher(m)}
                  className="sev-foco relative flex w-full items-center justify-between rounded-lg px-3 py-[7px] text-left"
                  style={{
                    background: ativo ? "rgba(255,107,26,.1)" : "transparent",
                    color: ativo ? C.laranja : vazio ? LP.tintaEscuraSuave : LP.tintaEscuraFraca,
                    opacity: vazio ? 0.55 : 1,
                    fontSize: 13.5, fontWeight: ativo ? 800 : 600,
                    cursor: vazio ? "default" : "pointer",
                  }}
                >
                  {ativo && (
                    <span aria-hidden className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full" style={{ background: C.laranja }} />
                  )}
                  {nome}
                  {!vazio && (
                    <span
                      className="flex h-[19px] min-w-[19px] items-center justify-center rounded-full px-1"
                      style={{
                        background: ativo ? C.laranja : "rgba(255,255,255,.08)",
                        color: ativo ? "#0C0C0C" : LP.tintaEscuraFraca,
                        fontFamily: F.mono, fontVariantNumeric: "tabular-nums", fontSize: 11, fontWeight: 700,
                      }}
                    >
                      {CONTAGENS[m]}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="px-5 pb-6 pt-4" style={{ borderTop: `1px solid ${LP.linhaEscura}` }}>
        <Legenda />
      </div>
    </aside>
  );
}

/* ---------------------------------------------------- trilho (só mobile) -- */

export function TrilhoMeses({ mes, aoEscolher }: { mes: number; aoEscolher: (m: number) => void }) {
  const refTrilho = useRef<HTMLDivElement>(null);
  const refChips = useRef<(HTMLButtonElement | null)[]>([]);

  /* Centraliza o chip do mês ativo. scrollTo manual em vez de scrollIntoView:
     inline:center rolaria a PÁGINA na montagem se a seção estiver fora da
     viewport. */
  useEffect(() => {
    const trilho = refTrilho.current;
    const chip = refChips.current[mes];
    if (!trilho || !chip) return;
    trilho.scrollTo({
      left: chip.offsetLeft - (trilho.clientWidth - chip.offsetWidth) / 2,
      behavior: reduzMotion() ? "auto" : "smooth",
    });
  }, [mes]);

  return (
    /* -mx segue o padding do .lp-container (20px; 40px a partir de md). */
    <div ref={refTrilho} className="lp-trilho -mx-5 mt-8 overflow-x-auto px-5 md:-mx-10 md:px-10 lg:hidden">
      <div className="flex w-max gap-2 pb-1">
        {MESES.map((nome, m) => {
          const ativo = m === mes;
          const vazio = CONTAGENS[m] === 0;
          return (
            <button
              key={nome}
              ref={(el) => { refChips.current[m] = el; }}
              type="button"
              disabled={vazio}
              aria-current={ativo ? "true" : undefined}
              onClick={() => aoEscolher(m)}
              className="sev-foco flex h-10 shrink-0 items-center gap-2 rounded-full px-4"
              style={{
                background: ativo ? C.laranja : "transparent",
                border: `1px solid ${ativo ? C.laranja : LP.linhaEscura}`,
                color: ativo ? "#0C0C0C" : vazio ? LP.tintaEscuraSuave : "#fff",
                opacity: vazio ? 0.45 : 1,
                fontSize: 13, fontWeight: 700,
              }}
            >
              {nome.slice(0, 3)}
              {!vazio && (
                <span
                  className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1"
                  style={{
                    background: ativo ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.1)",
                    fontFamily: F.mono, fontVariantNumeric: "tabular-nums", fontSize: 11, fontWeight: 700,
                  }}
                >
                  {CONTAGENS[m]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
