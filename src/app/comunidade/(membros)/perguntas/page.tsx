import type { Metadata } from "next";
import { ListaPosts } from "@/comunidade/components/lista-posts";
import { comPrevias, listarFeed } from "@/comunidade/lib/feed";
import { exigirMembro, euDe } from "@/comunidade/lib/sessao";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Perguntas abertas" };

/* Aba "Perguntas abertas": posts que ninguém respondeu ainda. */
export default async function PerguntasPage() {
  const perfil = await exigirMembro();
  const posts = await comPrevias(await listarFeed("novos", { semResposta: true }));

  return (
    <main className="rc-coluna rc-pilha">
      <header className="rc-cartao rc-pagina-topo">
        <h1>Perguntas abertas</h1>
        <p>Posts que ainda não receberam nenhum comentário.</p>
      </header>
      <ListaPosts posts={posts} eu={euDe(perfil)} vazio="Nenhum post sem resposta. Tudo em dia." />
    </main>
  );
}
