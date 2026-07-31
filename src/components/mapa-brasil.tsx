"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { C, F, BORDA } from "@/lib/tokens";
import { MAPA, MAPA_VB } from "@/lib/mapa-brasil";
import { ESTADO_POR_UF } from "@/lib/estados";

/* lê o tema atual (claro/escuro) reagindo à troca de data-theme no <html>. */
function useTemaEscuro(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const obs = new MutationObserver(cb);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      return () => obs.disconnect();
    },
    () => document.documentElement.getAttribute("data-theme") === "dark",
    () => false,
  );
}

/* MapaBrasil — base fiel ao MVP (viewBox 1000x1031, siglas, estados pequenos
   puxados, coropletia laranja) + camada de interatividade (Framer Motion):
   entrada com fade/escala, hover que acende o estado + tooltip, pulso no estado
   mais quente, e um leve zoom/foco ao clicar antes de abrir a folha. */

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
  const [hover, setHover] = useState<string | null>(null);
  const [focado, setFocado] = useState<string | null>(null);

  const escuro = useTemaEscuro();
  const LARANJA = "#FF6B1A";
  // rampas por tema. Claro: creme→laranja. Escuro: grafite→laranja vivo.
  const VAZIO = escuro ? "#2A2622" : "#EDE7E1";
  const RAMPA_INI = escuro ? "#5A3016" : "#FFE2C7";
  const STROKE = escuro ? "#0A0A0B" : "#fff"; // fio que separa os estados
  const ROTULO_VAZIO = escuro ? "#7C756D" : C.ink; // sigla dos estados sem gente

  const max = useMemo(() => Math.max(1, ...Object.values(contagem)), [contagem]);
  const ufMaisQuente = useMemo(() => {
    let melhor: string | null = null;
    let n = 0;
    for (const [uf, v] of Object.entries(contagem)) if (v > n) { n = v; melhor = uf; }
    return melhor;
  }, [contagem]);

  const corBase = (uf: string) => {
    const n = contagem[uf] || 0;
    if (n === 0) return VAZIO;
    return misturar(RAMPA_INI, LARANJA, 0.2 + 0.8 * Math.sqrt(n / max));
  };
  // No hover/foco o estado acende no laranja vivo da marca.
  const preenchimento = (uf: string) => {
    const n = contagem[uf] || 0;
    if (uf === hover || uf === focado) {
      if (n === 0) return escuro ? "#3A342E" : "#DCD3C9";
      return escuro ? "#FF8A3D" : misturar(LARANJA, "#111111", 0.3);
    }
    return corBase(uf);
  };
  // sigla: branca quando o estado está aceso/tem cor; senão a cor de "vazio".
  const corRotulo = (uf: string) => {
    const n = contagem[uf] || 0;
    if (uf === hover || uf === focado) return escuro ? "#0A0A0B" : "#fff";
    if (n === 0) return ROTULO_VAZIO;
    return escuro ? "#0A0A0B" : C.ink; // sobre laranja, texto escuro
  };

  const escolher = (uf: string) => {
    // leve foco/zoom antes de abrir a folha (a folha abre logo em seguida)
    setFocado(uf);
    onEstado?.(uf);
    setTimeout(() => setFocado(null), 320);
  };

  const nomeHover = hover ? ESTADO_POR_UF[hover]?.nome ?? hover : null;
  const nHover = hover ? contagem[hover] || 0 : 0;

  return (
    <div className="px-4 pb-10">
      <motion.div
        className="relative rounded-2xl p-3"
        style={{ background: C.surface, border: BORDA }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      >
        {/* tooltip flutuante do estado em hover */}
        <div
          className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2"
          style={{
            opacity: hover ? 1 : 0,
            transform: `translateX(-50%) translateY(${hover ? 0 : -6}px)`,
            transition: "opacity .16s, transform .16s",
          }}
        >
          {hover && (
            <div
              className="flex items-center gap-2 rounded-full px-3.5 py-1.5"
              style={{ background: C.ink, color: "#fff", boxShadow: "0 8px 24px rgba(17,17,17,.24)" }}
            >
              <span className="text-[13px] font-semibold">{nomeHover}</span>
              <span
                className="rounded-full px-1.5 text-[11px]"
                style={{ background: C.laranja, color: C.ink, fontFamily: F.mono, fontVariantNumeric: "tabular-nums", fontWeight: 700 }}
              >
                {nHover}
              </span>
            </div>
          )}
        </div>

        <svg
          viewBox={`0 0 ${vb0} ${vb1}`}
          width="100%"
          role="group"
          aria-label="Mapa do Brasil por estado"
          style={{ display: "block", touchAction: "manipulation" }}
        >
          {/* pulso no estado mais quente: um eco do path que respira por trás */}
          {ufMaisQuente && !hover && !focado && (
            <motion.path
              d={MAPA[ufMaisQuente].d}
              fill={C.laranja}
              stroke="none"
              pointerEvents="none"
              style={{ transformOrigin: "center", transformBox: "fill-box" }}
              initial={{ opacity: 0.35, scale: 1 }}
              animate={{ opacity: [0.35, 0, 0.35], scale: [1, 1.06, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {Object.keys(MAPA).map((uf, i) => {
            const n = contagem[uf] || 0;
            const vazio = n === 0;
            const nome = ESTADO_POR_UF[uf]?.nome || uf;
            const ativo = uf === hover || uf === focado;
            return (
              <motion.path
                key={uf}
                d={MAPA[uf].d}
                fill={preenchimento(uf)}
                stroke={ativo ? C.laranja : STROKE}
                strokeWidth={ativo ? 4 : 2.5}
                strokeLinejoin="round"
                style={{ cursor: vazio ? "default" : "pointer", transition: "fill .18s, stroke-width .12s, stroke .12s" }}
                role="button"
                tabIndex={0}
                aria-label={`${nome}, ${n} profissionais`}
                // entrada: cada estado surge escalonado (só opacidade — sem scale,
                // que distorceria o path SVG a partir da origem do viewBox)
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12 + i * 0.01, duration: 0.28 }}
                onMouseEnter={() => setHover(uf)}
                onMouseLeave={() => setHover((h) => (h === uf ? null : h))}
                onFocus={() => setHover(uf)}
                onBlur={() => setHover((h) => (h === uf ? null : h))}
                onClick={() => escolher(uf)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    escolher(uf);
                  }
                }}
              />
            );
          })}

          {/* siglas nos estados grandes */}
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
                  fill: corRotulo(uf),
                  transition: "fill .18s",
                }}
              >
                {uf}
              </text>
            ))}

          {/* estados pequenos: alvo maior + sigla puxada para fora */}
          {Object.keys(MAPA)
            .filter((uf) => MAPA[uf].p)
            .map((uf) => {
              const [cx, cy] = MAPA[uf].c;
              const nome = ESTADO_POR_UF[uf]?.nome || uf;
              const n = contagem[uf] || 0;
              return (
                <g key={uf}>
                  <line x1={cx} y1={cy} x2={cx + 78} y2={cy} stroke={escuro ? "#4A423A" : "#D8D2CB"} strokeWidth="2" />
                  <circle cx={cx + 100} cy={cy} r="26" fill={preenchimento(uf)} stroke={STROKE} strokeWidth="2.5" style={{ transition: "fill .18s" }} />
                  <text
                    x={cx + 100}
                    y={cy + 7}
                    textAnchor="middle"
                    pointerEvents="none"
                    style={{ fontFamily: F.mono, fontVariantNumeric: "tabular-nums", fontSize: 20, fontWeight: 700, fill: corRotulo(uf), transition: "fill .18s" }}
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
                    onMouseEnter={() => setHover(uf)}
                    onMouseLeave={() => setHover((h) => (h === uf ? null : h))}
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
          <span className="h-2 flex-1 rounded-full" style={{ background: `linear-gradient(to right, ${RAMPA_INI}, ${LARANJA})` }} />
          <span className="text-[11px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
            mais profissionais
          </span>
        </div>
      </motion.div>

      <p className="pt-3 text-center text-[12px] uppercase" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums", letterSpacing: ".12em" }}>
        Toque em um estado
      </p>
    </div>
  );
}
