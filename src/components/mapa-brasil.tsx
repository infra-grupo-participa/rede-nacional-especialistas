"use client";

import { useMemo } from "react";
import { C, F, BORDA } from "@/lib/tokens";
import { MAPA, MAPA_VB } from "@/lib/mapa-brasil";
import { ESTADO_POR_UF } from "@/lib/estados";

/* MapaBrasil — cópia FIEL do App.jsx (MVP). viewBox 1000x1031, siglas nos estados
   grandes, estados pequenos (p:true) com linha puxada + balão, coropletia laranja
   por densidade. Um toque seleciona e abre a folha do estado (onAbrir). */

function misturar(de: string, para: string, t: number): string {
  const h = (c: string): [number, number, number] => [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = h(de);
  const [r2, g2, b2] = h(para);
  const m = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${m(r1, r2)}, ${m(g1, g2)}, ${m(b1, b2)})`;
}

export function MapaBrasil({
  contagem,
  onEstado,
}: {
  contagem: Record<string, number>;
  onEstado?: (uf: string) => void;
}) {
  const [vb0, vb1] = MAPA_VB;
  const max = useMemo(
    () => Math.max(1, ...Object.values(contagem)),
    [contagem],
  );

  const preenchimento = (uf: string) => {
    const n = contagem[uf] || 0;
    if (n === 0) return "#EDE7E1";
    return misturar("#FFE2C7", C.laranja, 0.2 + 0.8 * Math.sqrt(n / max));
  };
  const corRotulo = () => C.ink;

  const escolher = (uf: string) => onEstado?.(uf);

  return (
    <div className="px-4 pb-10">
      <div className="rounded-2xl p-3" style={{ background: C.surface, border: BORDA }}>
        <svg
          viewBox={`0 0 ${vb0} ${vb1}`}
          width="100%"
          role="group"
          aria-label="Mapa do Brasil por estado"
          style={{ display: "block", touchAction: "manipulation" }}
        >
          {Object.keys(MAPA).map((uf) => {
            const n = contagem[uf] || 0;
            const vazio = n === 0;
            const nome = ESTADO_POR_UF[uf]?.nome || uf;
            return (
              <path
                key={uf}
                d={MAPA[uf].d}
                fill={preenchimento(uf)}
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinejoin="round"
                onClick={() => escolher(uf)}
                style={{ cursor: vazio ? "default" : "pointer" }}
                role="button"
                tabIndex={0}
                aria-label={`${nome}, ${n} profissionais`}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    escolher(uf);
                  }
                }}
              />
            );
          })}

          {/* siglas só onde cabe (estados grandes) */}
          {Object.keys(MAPA)
            .filter((uf) => !MAPA[uf].p)
            .map((uf) => (
              <text
                key={uf}
                x={MAPA[uf].c[0]}
                y={MAPA[uf].c[1] + 7}
                textAnchor="middle"
                pointerEvents="none"
                style={{
                  fontFamily: F.mono,
                  fontVariantNumeric: "tabular-nums",
                  fontSize: 24,
                  fontWeight: 700,
                  fill: corRotulo(),
                }}
              >
                {uf}
              </text>
            ))}

          {/* estados pequenos: alvo de toque maior + sigla puxada para fora */}
          {Object.keys(MAPA)
            .filter((uf) => MAPA[uf].p)
            .map((uf) => {
              const [cx, cy] = MAPA[uf].c;
              const nome = ESTADO_POR_UF[uf]?.nome || uf;
              const n = contagem[uf] || 0;
              return (
                <g key={uf}>
                  <line x1={cx} y1={cy} x2={cx + 78} y2={cy} stroke="#D8D2CB" strokeWidth="2" />
                  <circle cx={cx + 100} cy={cy} r="26" fill={preenchimento(uf)} stroke="#fff" strokeWidth="2.5" />
                  <text
                    x={cx + 100}
                    y={cy + 7}
                    textAnchor="middle"
                    pointerEvents="none"
                    style={{
                      fontFamily: F.mono,
                      fontVariantNumeric: "tabular-nums",
                      fontSize: 20,
                      fontWeight: 700,
                      fill: corRotulo(),
                    }}
                  >
                    {uf}
                  </text>
                  <circle
                    cx={cx + 100}
                    cy={cy}
                    r="30"
                    fill="transparent"
                    style={{ cursor: "pointer" }}
                    onClick={() => escolher(uf)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${nome}, ${n} profissionais`}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        escolher(uf);
                      }
                    }}
                  />
                </g>
              );
            })}
        </svg>

        {/* legenda */}
        <div className="flex items-center gap-2 px-1 pt-2">
          <span className="text-[11px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
            menos
          </span>
          <span className="h-2 flex-1 rounded-full" style={{ background: `linear-gradient(to right, #FFE2C7, ${C.laranja})` }} />
          <span className="text-[11px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
            mais profissionais
          </span>
        </div>
      </div>

      <p className="pt-3 text-center text-[12px] uppercase" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums", letterSpacing: ".12em" }}>
        Toque em um estado
      </p>
    </div>
  );
}
