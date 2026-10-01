import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { exigirMembro } from "@/comunidade/lib/sessao";
import { listarArquivos } from "@/comunidade/lib/arquivos";
import { AbaArquivos } from "@/comunidade/components/arquivos/aba-arquivos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arquivos",
};

/* Aba Arquivos: documentos e links de apoio. Fotos e vídeos ficam na aba
   Mídia; o endereço antigo (?aba=midias) leva para lá. */
export default async function ArquivosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const perfil = await exigirMembro();
  const sp = await searchParams;
  if (sp.aba === "midias") redirect("/comunidade/midia");

  const arquivos = await listarArquivos();

  return (
    <main>
      <AbaArquivos
        arquivos={arquivos.filter((a) => a.tipo === "documento" || a.tipo === "link")}
        midias={[]}
        somente="arquivos"
        perfilId={perfil.id}
        isAdmin={perfil.papel === "admin"}
      />
    </main>
  );
}
