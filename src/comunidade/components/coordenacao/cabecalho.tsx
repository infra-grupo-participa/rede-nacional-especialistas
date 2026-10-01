import Link from "next/link";
import { C, F, BORDA } from "@/lib/tokens";

export type AbaCoordenacao =
  | "geral"
  | "participacao"
  | "entrada"
  | "moderacao"
  | "artigos"
  | "regras"
  | "registro";

const ABAS: { id: AbaCoordenacao; rotulo: string; href: string; badge?: "pedidos" | "retidos" | "artigos" }[] = [
  { id: "geral", rotulo: "Visão geral", href: "/comunidade/coordenacao" },
  { id: "participacao", rotulo: "Participação", href: "/comunidade/coordenacao/participacao" },
  { id: "entrada", rotulo: "Entrada", href: "/comunidade/coordenacao/entrada", badge: "pedidos" },
  { id: "moderacao", rotulo: "Moderação", href: "/comunidade/coordenacao/moderacao", badge: "retidos" },
  { id: "regras", rotulo: "Regras", href: "/comunidade/coordenacao/regras" },
  { id: "registro", rotulo: "Registro", href: "/comunidade/coordenacao/registro" },
];

/* Ferramentas da coordenação: as abas de gestão da comunidade (o que substitui
   o painel de admin do grupo do Facebook). Fica logo abaixo das abas do grupo. */
export function CabecalhoCoordenacao({
  ativa,
  contadores,
}: {
  ativa: AbaCoordenacao;
  contadores?: { pedidos: number; retidos: number; artigos: number };
}) {
  return (
    <header style={{ borderBottom: BORDA }}>
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2.5" style={{ scrollbarWidth: "none" }} aria-label="Ferramentas da coordenação">
        {ABAS.map((a) => {
          const on = a.id === ativa;
          const n = a.badge && contadores ? contadores[a.badge] : 0;
          return (
            <Link
              key={a.id}
              href={a.href}
              aria-current={on ? "page" : undefined}
              className="press flex shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold"
              style={{
                height: 36,
                background: on ? C.ink : "transparent",
                color: on ? C.fundo : C.ink,
              }}
            >
              {a.rotulo}
              {n > 0 && (
                <span
                  className="rounded-full px-1.5 text-[11px] font-bold tabular-nums"
                  style={{ background: C.laranja, color: C.ink, fontFamily: F.mono, lineHeight: "18px" }}
                >
                  {n}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

/** Caixa padrão das seções da coordenação. */
export function Caixa({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl p-4 sm:p-5 ${className}`} style={{ background: C.surface, border: BORDA }}>
      {children}
    </section>
  );
}
