import { notFound, redirect } from "next/navigation";
import { getPerfilAtual } from "@/lib/auth";
import { meuArtigo } from "@/lib/artigos";
import { Editor } from "@/components/artigo/editor";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfil = await getPerfilAtual();
  if (!perfil) redirect("/entrar");
  if (perfil.status !== "aprovado") redirect("/aguardando");

  const artigo = await meuArtigo(id);
  if (!artigo) notFound();
  // só o dono edita (RLS já garante; reforço na UI)
  if (artigo.autor_id !== perfil.id && perfil.papel !== "admin") notFound();

  return (
    <Editor
      artigo={artigo}
      autor={{ nome: perfil.nome, avatar_url: perfil.avatar_url, profissao: perfil.profissao }}
    />
  );
}
