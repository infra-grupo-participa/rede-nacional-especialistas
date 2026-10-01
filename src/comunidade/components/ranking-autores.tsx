import Link from "next/link";
import { Avatar, SeloVerificado, TagNivel } from "@/comunidade/components/atoms";
import { plural } from "@/comunidade/components/paginas/textos";
import { hrefMembro } from "@/comunidade/lib/grupo-tipos";
import type { Qualificacao } from "@/comunidade/lib/qualificacoes";
import type { AutorRanking } from "@/comunidade/lib/ranking";

/* Quem mais contribui: lista numerada por pontos de participação, com o pódio
   (1º, 2º e 3º) marcado na cor da medalha. Cada nome leva ao perfil do membro
   dentro da comunidade. */
export function RankingAutores({ autores, titulo = "Quem mais contribui" }: { autores: AutorRanking[]; titulo?: string }) {
  if (autores.length === 0) return null;

  return (
    <section className="rc-cartao rc-pg-bloco" aria-label={titulo}>
      <div className="rc-pg-bloco-topo" style={{ marginBottom: 8 }}>
        <h2 className="rc-cartao-titulo">{titulo}</h2>
      </div>
      <ol className="rc-pg-rank">
        {autores.map((a, i) => {
          const sub = [a.n_posts > 0 ? plural(a.n_posts, "post", "posts") : "", a.n_artigos > 0 ? plural(a.n_artigos, "artigo", "artigos") : ""].filter(Boolean).join(" · ");
          return (
            <li key={a.perfil_id}>
              <Link href={hrefMembro({ slug: a.slug, id: a.perfil_id })} className="rc-pg-rank-item">
                <span className="rc-pg-rank-pos" data-pos={i + 1} aria-label={`${i + 1}º lugar`}>
                  {i + 1}
                </span>
                <Avatar nome={a.nome} foto={a.avatar_url} size={36} />
                <span className="rc-pg-membro-texto">
                  <span className="rc-pg-membro-nome">
                    <span className="rc-pg-membro-quem">
                      <span>{a.nome}</span>
                      {a.verificado && <SeloVerificado size="sm" />}
                    </span>
                    <TagNivel qualificacao={a.qualificacao as Qualificacao} size="sm" />
                  </span>
                  {sub && <span className="rc-pg-membro-sub">{sub}</span>}
                </span>
                <span className="rc-pg-rank-pontos" title="Pontos de participação">
                  {a.pontos.toLocaleString("pt-BR")} pts
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
