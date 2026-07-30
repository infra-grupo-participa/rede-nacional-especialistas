"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { MAPA_PATHS, MAPA_VIEWBOX } from "@/lib/mapa-brasil";
import { ESTADO_POR_UF } from "@/lib/estados";

/** Interpola a "temperatura" de um estado (0..1) para uma tinta laranja→preta. */
function tinta(n: number, max: number): { fill: string; stroke: string } {
  if (n === 0) return { fill: "#FFD9BC", stroke: "#FCA968" }; // vazio: laranja bem claro
  const t = max > 0 ? n / max : 0;
  // do laranja claro ao preto, passando pelo laranja forte
  if (t < 0.5) {
    // #FFB877 → #FE7413
    const k = t / 0.5;
    const mix = (a: number, b: number) => Math.round(a + (b - a) * k);
    return {
      fill: `rgb(${mix(255, 254)}, ${mix(184, 116)}, ${mix(119, 19)})`,
      stroke: C.ink,
    };
  }
  // #FE7413 → #111111
  const k = (t - 0.5) / 0.5;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * k);
  return {
    fill: `rgb(${mix(254, 17)}, ${mix(116, 17)}, ${mix(19, 17)})`,
    stroke: C.ink,
  };
}

export function MapaBrasil({
  contagem,
  onEstado,
}: {
  contagem: Record<string, number>;
  /** Se fornecido, o clique chama isto em vez de navegar direto para /estado/[uf]. */
  onEstado?: (uf: string) => void;
}) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...Object.values(contagem));

  const abrir = (uf: string) => {
    if (onEstado) onEstado(uf);
    else router.push(`/estado/${uf}`);
  };

  const ativo = hover;
  const infoAtivo = ativo ? ESTADO_POR_UF[ativo] : null;
  const nAtivo = ativo ? (contagem[ativo] ?? 0) : 0;

  return (
    <div className="relative">
      <svg
        viewBox={MAPA_VIEWBOX}
        role="group"
        aria-label="Mapa do Brasil — clique num estado"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {Object.entries(MAPA_PATHS).map(([uf, d]) => {
          const n = contagem[uf] ?? 0;
          const { fill, stroke } = tinta(n, max);
          const isHover = hover === uf;
          const clicavel = true;
          return (
            <path
              key={uf}
              d={d}
              fill={isHover ? C.ink : fill}
              stroke={isHover ? C.laranja : stroke}
              strokeWidth={isHover ? 1.4 : 0.7}
              style={{
                cursor: clicavel ? "pointer" : "default",
                transition: "fill .12s, stroke .12s",
              }}
              tabIndex={0}
              role="button"
              aria-label={`${ESTADO_POR_UF[uf]?.nome ?? uf}: ${n} ${n === 1 ? "especialista" : "especialistas"}`}
              onMouseEnter={() => setHover(uf)}
              onMouseLeave={() => setHover((h) => (h === uf ? null : h))}
              onFocus={() => setHover(uf)}
              onBlur={() => setHover((h) => (h === uf ? null : h))}
              onClick={() => abrir(uf)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  abrir(uf);
                }
              }}
            />
          );
        })}
      </svg>

      {/* legenda / estado em foco */}
      <div className="mt-2 flex items-center justify-between px-1">
        <div className="text-[13px]" style={{ color: C.sobreFundo, fontFamily: F.mono }}>
          {infoAtivo ? (
            <span style={{ color: C.ink, fontWeight: 600 }}>
              {infoAtivo.nome} · {nAtivo} {nAtivo === 1 ? "especialista" : "especialistas"}
            </span>
          ) : (
            <span>passe o dedo pelo mapa e toque num estado</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ color: C.sobreFundo, fontFamily: F.mono }}>
            menos
          </span>
          <span style={{ width: 14, height: 10, borderRadius: 2, background: "#FFB877" }} />
          <span style={{ width: 14, height: 10, borderRadius: 2, background: C.laranja }} />
          <span style={{ width: 14, height: 10, borderRadius: 2, background: C.ink }} />
          <span className="text-[11px]" style={{ color: C.sobreFundo, fontFamily: F.mono }}>
            mais
          </span>
        </div>
      </div>
    </div>
  );
}
