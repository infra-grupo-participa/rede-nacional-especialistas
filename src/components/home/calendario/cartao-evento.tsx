"use client";

/* ============================================================================
   Card de evento do painel direito — o clique inteiro leva ao link de
   inscrição (nova aba), como o PO pediu no wireframe.
   ========================================================================== */

import type { CSSProperties } from "react";
import { CATEGORIAS, faixaDeDatas, horaDe, type Evento } from "@/lib/eventos";
import { LP } from "@/lib/landing";
import { F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { COR_CLARA } from "@/components/home/calendario/apoio";

export function CartaoEvento({
  evento, ativo, aoRef,
}: {
  evento: Evento;
  /** true quando o dia selecionado na grade pertence a este evento. */
  ativo: boolean;
  aoRef: (el: HTMLAnchorElement | null) => void;
}) {
  const cor = COR_CLARA[evento.categoria];
  const hora = horaDe(evento);
  return (
    <a
      ref={aoRef}
      href={evento.linkInscricao}
      target="_blank"
      rel="noopener noreferrer"
      className="sev-card sev-foco block overflow-hidden rounded-2xl p-4"
      style={{
        "--sev-cat": cor,
        ...(ativo ? { "--sev-borda": "rgba(255,107,26,.55)" } : null),
      } as CSSProperties}
    >
      {/* evento âncora do mês: fio degradê no topo no lugar de sombra/selo. */}
      {evento.destaque && <span aria-hidden className="lp-fio -mx-4 -mt-4 mb-3 block" />}
      <div className="flex items-start justify-between gap-3">
        <span style={{ fontFamily: F.mono, fontVariantNumeric: "tabular-nums", fontSize: 12, fontWeight: 700, color: cor, letterSpacing: "0.02em" }}>
          {faixaDeDatas(evento)}
          {hora && ` · ${hora}`}
        </span>
        <Ico.externo aria-hidden style={{ width: 14, height: 14, color: LP.tintaEscuraSuave, flexShrink: 0 }} />
      </div>
      <h4 className="mt-1.5" style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 15, lineHeight: 1.3, letterSpacing: "-0.015em", color: "#fff" }}>
        {evento.titulo}
      </h4>
      <p className="mt-1.5 line-clamp-2" style={{ fontSize: 12.5, lineHeight: 1.55, color: LP.tintaEscuraFraca }}>
        {evento.descricao}
      </p>
      <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ fontSize: 12, color: LP.tintaEscuraFraca }}>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: cor }} />
          {CATEGORIAS[evento.categoria].rotulo}
        </span>
        <span className="flex items-center gap-1.5">
          {evento.formato === "online"
            ? <Ico.transmissao aria-hidden style={{ width: 13, height: 13 }} />
            : <Ico.pin aria-hidden style={{ width: 13, height: 13 }} />}
          {evento.local}
        </span>
      </p>
      <span className="sr-only">Abrir inscrição em nova aba</span>
    </a>
  );
}
