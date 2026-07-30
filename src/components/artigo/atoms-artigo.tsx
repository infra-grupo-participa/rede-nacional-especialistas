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
            <figure key={b.id} className="mt-6">
              <Capa titulo={b.legenda ?? ""} capa={b.url} variante="default" />
              {b.legenda && (
                <figcaption className="mt-2 text-[13px]" style={{ color: C.muted }}>
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
              className="mt-7 text-[20px] leading-snug"
              style={{ fontFamily: F.serif, fontWeight: 600, color: C.ink, letterSpacing: "-0.018em" }}
            >
              {texto}
            </h2>
          );
        }
        if (b.tipo === "citacao") {
          return (
            <blockquote
              key={b.id}
              className="mt-6 pl-4 text-[17px] leading-relaxed"
              style={{
                borderLeft: `3px solid ${C.petrol}`,
                color: C.petrolDeep,
                fontFamily: F.serif,
                fontWeight: 500,
                letterSpacing: "-0.011em",
              }}
            >
              {texto}
            </blockquote>
          );
        }
        return (
          <p key={b.id} className="mt-4 text-[16px] leading-relaxed" style={{ color: C.ink }}>
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
