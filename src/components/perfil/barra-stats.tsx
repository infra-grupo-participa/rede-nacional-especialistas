import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import type { PerfilStats } from "@/lib/queries";

/* Barra de estatísticas do perfil (estilo YouTube/LinkedIn): artigos, leituras,
   posts. Números grandes em tabular, rótulo pequeno. */

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",") + "k";
  return String(n);
}

export function BarraStats({ stats }: { stats: PerfilStats }) {
  const itens = [
    { icone: <Ico.doc style={{ width: 15, height: 15 }} />, valor: stats.n_artigos, rotulo: stats.n_artigos === 1 ? "artigo" : "artigos" },
    { icone: <Ico.olho style={{ width: 15, height: 15 }} />, valor: stats.total_leituras, rotulo: "leituras" },
    { icone: <Ico.balao style={{ width: 15, height: 15 }} />, valor: stats.n_posts, rotulo: stats.n_posts === 1 ? "post" : "posts" },
  ];
  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      {itens.map((it, i) => (
        <div
          key={it.rotulo}
          className="flex flex-col items-center gap-0.5 py-3"
          style={{ borderLeft: i > 0 ? `1px solid ${C.line}` : "none" }}
        >
          <span className="flex items-center gap-1.5" style={{ color: C.petrolDeep }}>
            {it.icone}
            <span className="text-[20px] font-bold" style={{ color: C.ink, fontFamily: F.serif, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
              {fmt(it.valor)}
            </span>
          </span>
          <span className="text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}>
            {it.rotulo}
          </span>
        </div>
      ))}
    </div>
  );
}
