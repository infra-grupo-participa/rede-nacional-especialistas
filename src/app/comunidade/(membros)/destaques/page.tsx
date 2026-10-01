import type { Metadata } from "next";
import { ListaPosts } from "@/comunidade/components/lista-posts";
import { comPrevias, listarFixados } from "@/comunidade/lib/feed";
import { exigirMembro, euDe } from "@/comunidade/lib/sessao";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Em destaque" };

/* Aba "Em destaque": os posts que a coordenação fixou. */
export default async function DestaquesPage() {
  const perfil = await exigirMembro();
  const posts = await comPrevias(await listarFixados());

  return (
    <main className="rc-coluna rc-pilha">
      <header className="rc-cartao rc-pagina-topo">
        <h1>Em destaque</h1>
        <p>Os posts que a coordenação fixou para todo mundo ver.</p>
      </header>
      <ListaPosts posts={posts} eu={euDe(perfil)} vazio="A coordenação ainda não destacou nenhum post." />
    </main>
  );
}
