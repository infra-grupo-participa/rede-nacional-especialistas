import Link from "next/link";
import { C, F, BORDA } from "@/lib/tokens";
import { Ico } from "@/components/icons";

export type AbaCoordenacao =
  | "geral"
  | "participacao"
  | "entrada"
  | "moderacao"
  | "artigos"
  | "regras"
  | "registro";

const ABAS: { id: AbaCoordenacao; rotulo: string; href: string; badge?: "pedidos" | "retidos" | "artigos" }[] = [
  { id: "geral", rotulo: "Visão geral", href: "/coordenacao" },
  { id: "participacao", rotulo: "Participação", href: "/coordenacao/participacao" },
  { id: "entrada", rotulo: "Entrada", href: "/coordenacao/entrada", badge: "pedidos" },
  { id: "moderacao", rotulo: "Moderação", href: "/coordenacao/moderacao", badge: "retidos" },
  { id: "artigos", rotulo: "Artigos", href: "/coordenacao/artigos", badge: "artigos" },
  { id: "regras", rotulo: "Regras", href: "/coordenacao/regras" },
  { id: "registro", rotulo: "Registro", href: "/coordenacao/registro" },
];

/* Cabeçalho da coordenação: volta para o site + abas das ferramentas de gestão
   da comunidade (o que substitui o painel de admin do grupo do Facebook). */
export function CabecalhoCoordenacao({
  ativa,
  contadores,
}: {
  ativa: AbaCoordenacao;
  contadores?: { pedidos: number; retidos: number; artigos: number };
}) {
  return (
    <header className="sticky top-0 z-30" style={{ background: "var(--fundo-blur)", backdropFilter: "blur(10px)", borderBottom: BORDA }}>
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-2.5">
        <Link href="/feed" aria-label="Voltar ao feed" className="flex shrink-0 items-center justify-center" style={{ width: 40, height: 40, color: C.ink }}>
          <Ico.back style={{ width: 21, height: 21 }} />
        </Link>
        <Ico.escudo style={{ width: 18, height: 18, color: C.ink }} />
        <span className="text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
          Coordenação
        </span>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2 pt-1.5" style={{ scrollbarWidth: "none" }} aria-label="Ferramentas da coordenação">
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
