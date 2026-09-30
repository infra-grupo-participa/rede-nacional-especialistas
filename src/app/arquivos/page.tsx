import type { Metadata } from "next";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { TopNav } from "@/components/topnav";
import { getPerfilAtual, getSessaoNav } from "@/lib/auth";
import { listarArquivos, midiasDosPosts } from "@/lib/arquivos";
import { AbaArquivos } from "@/components/arquivos/aba-arquivos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arquivos e mídias · Rede Nacional de Especialistas",
};

export default async function ArquivosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const [perfil, nav] = await Promise.all([getPerfilAtual(), getSessaoNav()]);

  if (perfil?.status !== "aprovado") {
    return (
      <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
        <TopNav sessao={nav} />
        <div className="mx-auto max-w-md px-5 pt-16 text-center">
          <h1 className="text-[24px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 700 }}>
            Arquivos exclusivos dos alunos
          </h1>
          <p className="mt-3 text-[15px]" style={{ color: C.muted }}>
            Documentos, modelos e vídeos da comunidade ficam disponíveis depois que a coordenação libera seu acesso.
          </p>
          <Link
            href={perfil ? "/aguardando" : "/entrar"}
            className="press mt-6 inline-flex items-center justify-center rounded-xl px-6 text-[15px] font-semibold"
            style={{ height: 52, background: C.laranja, color: C.ink }}
          >
            {perfil ? "Ver meu pedido de entrada" : "Entrar"}
          </Link>
        </div>
      </main>
    );
  }

  const [arquivos, midias] = await Promise.all([listarArquivos(), midiasDosPosts()]);

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <TopNav sessao={nav} />
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
