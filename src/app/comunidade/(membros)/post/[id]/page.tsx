import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IcoRC } from "@/comunidade/components/icones";
import { PostCard } from "@/comunidade/components/post-card";
import { listarComentarios, postPorId } from "@/comunidade/lib/feed";
import { exigirMembro, euDe } from "@/comunidade/lib/sessao";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Post" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Página do post: o mesmo cartão da Discussão, com o texto inteiro e os
   comentários já abertos. */
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfil = await exigirMembro();
  if (!UUID.test(id)) notFound();
  const [post, comentarios] = await Promise.all([postPorId(id), listarComentarios(id)]);
  if (!post) notFound();

  return (
    <main className="rc-coluna rc-pilha">
      <Link href="/comunidade" className="rc-voltar">
        <IcoRC.chevronDireita />
        Discussão
      </Link>
      <PostCard post={post} eu={euDe(perfil)} pagina comentarios={comentarios} />
    </main>
  );
}
