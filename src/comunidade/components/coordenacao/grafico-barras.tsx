"use client";

import { useState } from "react";
import { C, F, BORDA } from "@/lib/tokens";

export interface PontoBarra {
  rotulo: string;
  /** rótulo curto do eixo (ex.: "12/09"); vazio = não mostra no eixo. */
  eixo?: string;
  valor: number;
  /** linhas extras do tooltip (ex.: "Posts: 3"). */
  detalhe?: string[];
}

/* Barras de UMA série (sem legenda: o título nomeia). Barras finas com topo
   arredondado de 4px apoiadas na linha de base, 2px de respiro entre elas,
   grade recessiva só com o máximo. Hover mostra o valor; a tabela fica a um
   clique para quem não enxerga a cor ou usa leitor de tela. */
export function GraficoBarras({
  titulo,
  pontos,
  altura = 140,
  unidade = "",
}: {
  titulo: string;
  pontos: PontoBarra[];
  altura?: number;
  unidade?: string;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const [tabela, setTabela] = useState(false);
  const max = Math.max(1, ...pontos.map((p) => p.valor));
  const soma = pontos.reduce((s, p) => s + p.valor, 0);
  const p = ativo !== null ? pontos[ativo] : null;

  return (
    <figure className="m-0">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-[14px] font-semibold" style={{ color: C.ink }}>
          {titulo}
        </span>
        <button onClick={() => setTabela((v) => !v)} className="text-[12px] font-semibold" style={{ color: C.petrolDeep }}>
          {tabela ? "Ver gráfico" : "Ver tabela"}
        </button>
      </figcaption>

      {tabela ? (
        <div className="mt-2 max-h-72 overflow-auto rounded-xl" style={{ border: BORDA }}>
          <table className="w-full text-[13px]">
            <tbody>
              {pontos.map((pt, i) => (
                <tr key={i} style={{ borderTop: i ? BORDA : undefined }}>
                  <td className="px-3 py-1.5" style={{ color: C.muted }}>
                    {pt.rotulo}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums" style={{ color: C.ink, fontFamily: F.mono }}>
                    {pt.valor.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-1.5 text-[12px]" style={{ color: C.muted }}>
                    {pt.detalhe?.join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* leitura do ponto em foco (ou total do período) */}
          <p className="mt-1 h-[34px] text-[12px] leading-tight" style={{ color: C.muted }} aria-live="polite">
            {p ? (
              <>
                <span className="font-semibold" style={{ color: C.ink }}>
                  {p.rotulo}: {p.valor.toLocaleString("pt-BR")} {unidade}
                </span>
                {p.detalhe && <span className="block">{p.detalhe.join(" · ")}</span>}
              </>
            ) : (
              <>
                Total no período: <span className="font-semibold tabular-nums" style={{ color: C.ink }}>{soma.toLocaleString("pt-BR")}</span>
                <span className="block">Passe o mouse ou toque numa barra para ver o detalhe.</span>
              </>
            )}
          </p>
          <div className="relative mt-5" style={{ height: altura }} onMouseLeave={() => setAtivo(null)}>
            {/* grade: só a linha do máximo, recessiva */}
            <div className="absolute left-0 right-0 top-0 flex items-center gap-1" style={{ borderTop: `1px dashed ${C.line}` }}>
              <span className="-mt-[18px] text-[10px] tabular-nums" style={{ color: C.muted, fontFamily: F.mono }}>
                {max.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="absolute inset-0 flex items-end" style={{ gap: pontos.length > 40 ? 1 : 2, borderBottom: `1px solid ${C.line}` }}>
              {pontos.map((pt, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setAtivo(i)}
                  onFocus={() => setAtivo(i)}
                  onClick={() => setAtivo(i)}
                  aria-label={`${pt.rotulo}: ${pt.valor}`}
                  className="flex h-full min-w-0 flex-1 items-end"
                  style={{ background: "transparent" }}
                >
                  <span
                    className="block w-full"
                    style={{
                      height: pt.valor > 0 ? `${Math.max(2, (pt.valor / max) * 100)}%` : 0,
                      background: C.ink,
                      opacity: ativo === null || ativo === i ? 1 : 0.35,
                      borderRadius: "4px 4px 0 0",
                      transition: "opacity .12s",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1 flex" style={{ gap: pontos.length > 40 ? 1 : 2 }} aria-hidden="true">
            {pontos.map((pt, i) => (
              <span key={i} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center text-[10px]" style={{ color: C.muted, fontFamily: F.mono }}>
                {pt.eixo ?? ""}
              </span>
            ))}
          </div>
        </>
      )}
    </figure>
  );
}
