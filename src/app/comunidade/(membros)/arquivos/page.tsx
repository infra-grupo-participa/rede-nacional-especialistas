import type { Metadata } from "next";
import { exigirMembro } from "@/comunidade/lib/sessao";
import { listarArquivos, midiasDosPosts } from "@/comunidade/lib/arquivos";
import { AbaArquivos } from "@/comunidade/components/arquivos/aba-arquivos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arquivos e mídias",
};

export default async function ArquivosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const perfil = await exigirMembro();
  const [arquivos, midias] = await Promise.all([listarArquivos(), midiasDosPosts()]);

  return (
    <main>
      <AbaArquivos
        arquivos={arquivos}
        midias={midias}
        abaInicial={sp.aba === "midias" ? "midias" : "arquivos"}
        perfilId={perfil.id}
        isAdmin={perfil.papel === "admin"}
      />
    </main>
  );
}
