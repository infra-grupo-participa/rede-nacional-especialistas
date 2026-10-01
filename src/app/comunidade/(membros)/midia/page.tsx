import type { Metadata } from "next";
import { exigirMembro } from "@/comunidade/lib/sessao";
import { listarArquivos, midiasDosPosts } from "@/comunidade/lib/arquivos";
import { AbaArquivos } from "@/comunidade/components/arquivos/aba-arquivos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mídia",
};

/* Aba Mídia: a grade de fotos e vídeos do grupo (fotos publicadas nos posts +
   imagens e vídeos enviados ao acervo). */
export default async function MidiaPage() {
  const perfil = await exigirMembro();
  const [arquivos, midias] = await Promise.all([listarArquivos(), midiasDosPosts()]);

  return (
    <main>
      <AbaArquivos
        arquivos={arquivos.filter((a) => a.tipo === "imagem" || a.tipo === "video")}
        midias={midias}
        somente="midias"
        perfilId={perfil.id}
        isAdmin={perfil.papel === "admin"}
      />
    </main>
  );
}
