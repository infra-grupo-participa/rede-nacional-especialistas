import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Avatar, Eyebrow } from "@/components/atoms";
import { Ico } from "@/components/icons";
import type { AutorRanking } from "@/lib/queries";

/* Ranking de autores por engajamento (top especialistas). Pódio destacado no
   topo (1º/2º/3º) e lista numerada abaixo. */
export function RankingAutores({ autores, titulo = "Top especialistas" }: { autores: AutorRanking[]; titulo?: string }) {
  if (autores.length === 0) return null;
  const medalha = (i: number) => (i === 0 ? "#E3A81C" : i === 1 ? "#9AA3AE" : i === 2 ? "#C77B3A" : null);

  return (
    <div className="rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2 pb-3">
        <Ico.troféu style={{ width: 16, height: 16, color: C.laranja }} />
        <Eyebrow>{titulo}</Eyebrow>
      </div>
      <ol className="space-y-1">
        {autores.map((a, i) => {
          const cor = medalha(i);
          return (
            <li key={a.perfil_id}>
              <Link href={`/especialista/${a.slug ?? a.perfil_id}`} className="card-hover flex items-center gap-3 rounded-xl px-2 py-2">
                <span
                  className="flex shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular-nums"
                  style={{
                    width: 26,
                    height: 26,
                    fontFamily: F.mono,
                    background: cor ? cor : C.paper,
                    color: cor ? "#fff" : C.muted,
                  }}
                >
                  {i + 1}
                </span>
                <Avatar nome={a.nome} foto={a.avatar_url} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
                    {a.nome}
                  </span>
                  <span className="block truncate text-[12px]" style={{ color: C.muted }}>
                    {a.n_artigos > 0 && `${a.n_artigos} ${a.n_artigos === 1 ? "artigo" : "artigos"}`}
                    {a.n_artigos > 0 && a.total_leituras > 0 && " · "}
                    {a.total_leituras > 0 && `${a.total_leituras.toLocaleString("pt-BR")} leituras`}
                    {a.n_artigos === 0 && a.total_leituras === 0 && a.n_posts > 0 && `${a.n_posts} posts`}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] font-bold tabular-nums" style={{ color: C.laranja, fontFamily: F.mono }}>
                  {a.pontos.toLocaleString("pt-BR")}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
