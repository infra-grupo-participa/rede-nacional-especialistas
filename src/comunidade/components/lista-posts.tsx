"use client";

import { IcoRC } from "@/comunidade/components/icones";
import { PostCard } from "@/comunidade/components/post-card";
import { tempoRelativo } from "@/lib/utils";
import type { PostFeed } from "@/comunidade/lib/feed";
import type { Eu } from "@/comunidade/lib/sessao";

/* Lista de cartões de post. Usada na Discussão, nas listas (em destaque,
   perguntas abertas, busca, seu conteúdo) e no perfil do membro. */
export function ListaPosts({
  posts,
  eu,
  vazio,
  onRemovido,
}: {
  posts: PostFeed[];
  /** quem está olhando (`euDe(perfil)`) */
  eu: Eu;
  /** frase mostrada quando não há post */
  vazio?: string;
  /** chamado com o id quando um post da lista é removido */
  onRemovido?: (id: string) => void;
}) {
  if (posts.length === 0) {
    return vazio ? <p className="rc-cartao rc-vazio">{vazio}</p> : null;
  }
  return (
    <div className="rc-lista-posts">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} eu={eu} onRemovido={onRemovido} />
      ))}
    </div>
  );
}

/* Posts do próprio membro que a moderação segurou (palavra da lista de
   moderação): ainda não aparecem para os outros. */
export function CartaoRetidos({ retidos }: { retidos: { id: string; titulo: string; corpo: string; criado_em: string }[] }) {
  if (retidos.length === 0) return null;
  return (
    <section className="rc-cartao rc-retidos" aria-label="Posts aguardando a moderação">
      <p className="rc-retidos-titulo">
        <IcoRC.relogio />
        {retidos.length === 1 ? "1 post seu aguarda a moderação" : `${retidos.length} posts seus aguardam a moderação`}
      </p>
      <ul>
        {retidos.map((r) => (
          <li key={r.id} suppressHydrationWarning>
            {tempoRelativo(r.criado_em)} · {r.titulo || r.corpo || "Foto"}
          </li>
        ))}
      </ul>
      <p className="rc-retidos-nota">Aparecem para o grupo assim que a coordenação aprovar.</p>
    </section>
  );
}
