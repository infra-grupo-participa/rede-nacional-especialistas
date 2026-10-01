import type { Metadata } from "next";
import { CartaoRetidos, ListaPosts } from "@/comunidade/components/lista-posts";
import { comPrevias, listarFeed, meusPostsRetidos } from "@/comunidade/lib/feed";
import { exigirMembro, euDe } from "@/comunidade/lib/sessao";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Seu conteúdo" };

/* "Seu conteúdo": tudo o que o próprio membro publicou e, antes, o que a
   moderação ainda está segurando. */
export default async function SeuConteudoPage() {
  const perfil = await exigirMembro();
  const [posts, retidos] = await Promise.all([
    listarFeed("novos", { autorId: perfil.id, comFixados: true, limite: 60 }).then(comPrevias),
    meusPostsRetidos(perfil.id),
  ]);

  return (
    <main className="rc-coluna rc-pilha">
      <header className="rc-cartao rc-pagina-topo">
        <h1>Seu conteúdo</h1>
        <p>Tudo o que você publicou na Rede, do mais novo para o mais antigo.</p>
      </header>
      <CartaoRetidos retidos={retidos} />
      <ListaPosts posts={posts} eu={euDe(perfil)} vazio="Você ainda não publicou nada." />
    </main>
  );
}
