import type { CSSProperties } from "react";
import { C, F } from "@/lib/tokens";
import { tintaCapa } from "@/lib/utils";
import { STATUS_META, type Bloco, type StatusArtigo } from "@/lib/artigos-tipos";
import { Capa2 } from "@/components/artigo/capa";

/* Building-blocks visuais dos artigos, portados do MVP (App.jsx). Componentes
   puros (sem estado) — podem ser usados em Server ou Client Components. */

/* ------------------------------------------------------------------ Chapeu -- */
export function Chapeu({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <span
      className="block uppercase"
      style={{
        fontFamily: F.mono,
        fontVariantNumeric: "tabular-nums",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".12em",
        color: C.brass,
      }}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- TagStatus -- */
export function TagStatus({ status }: { status: StatusArtigo }) {
  const s = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.rotulo}
    </span>
  );
}

/* ---------------------------------------------------------------- Capa (re) -- */
/* Reexporta a Capa (que precisa de <img>); mantém a API do MVP. */
export function Capa({
  titulo,
  capa,
  variante = "default",
}: {
  titulo: string;
  capa?: string;
  variante?: "miniatura" | "baixa" | "destaque" | "alta" | "default";
}) {
  return <Capa2 titulo={titulo} capa={capa} variante={variante} />;
}

/* ----------------------------------------------------------- BlocosLidos --- */
/* Renderiza os blocos de um artigo (leitor / prévia / revisão). */
export function BlocosLidos({ blocos }: { blocos: Bloco[] }) {
  return (
    <>
      {(blocos ?? []).map((b) => {
        const texto = (b.texto ?? "").trim();
        if (b.tipo === "imagem") {
          if (!b.url) return null;
          return (
            <figure key={b.id} className="my-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.url} alt={b.legenda ?? ""} style={{ width: "100%", borderRadius: 16, display: "block" }} />
              {b.legenda && (
                <figcaption className="mt-2.5 text-center text-[13px] italic" style={{ color: C.muted }}>
                  {b.legenda}
                </figcaption>
              )}
            </figure>
          );
        }
        if (!texto) return null;
        if (b.tipo === "h2") {
          return (
            <h2
              key={b.id}
              className="mt-10 mb-1 text-[24px] leading-snug"
              style={{ fontFamily: F.serif, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}
            >
              {texto}
            </h2>
          );
        }
        if (b.tipo === "citacao") {
          return (
            <blockquote
              key={b.id}
              className="my-8 pl-5 text-[22px] leading-snug"
              style={{
                borderLeft: `4px solid ${C.laranja}`,
                color: C.ink,
                fontFamily: F.serif,
                fontWeight: 500,
                letterSpacing: "-0.015em",
              }}
            >
              {texto}
            </blockquote>
          );
        }
        return (
          <p key={b.id} className="mt-5 text-[17.5px]" style={{ color: "#26231f", lineHeight: 1.75 }}>
            {texto}
          </p>
        );
      })}
    </>
  );
}

/* Gradiente determinístico usado como capa de fallback. */
export function fundoCapa(titulo: string): CSSProperties {
  const [a, b] = tintaCapa(titulo);
  return { background: `linear-gradient(135deg, ${a}, ${b})` };
}
