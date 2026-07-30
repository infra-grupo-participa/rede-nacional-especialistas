import Link from "next/link";
import { redirect } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { Eyebrow } from "@/components/atoms";
import { getPerfilAtual } from "@/lib/auth";
import { FluxoAtualizacao } from "@/components/perfil/fluxo-atualizacao";

export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const perfil = await getPerfilAtual();
  if (!perfil) redirect("/entrar");
  if (perfil.status !== "aprovado") redirect("/aguardando");

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}>
        <Link href="/" aria-label="Início" className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 44, color: C.ink }}>
          <Ico.back style={{ width: 21, height: 21 }} />
        </Link>
        <div className="min-w-0 flex-1">
          <Eyebrow>Confirme seus dados</Eyebrow>
        </div>
        <Link href="/meus-artigos" className="rounded-full px-3.5 text-[13px] font-semibold" style={{ height: 36, lineHeight: "36px", background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}>
          Meus artigos
        </Link>
      </header>

      <div className="px-5 pt-4">
        <h1 className="text-[26px]" style={{ fontFamily: F.serif }}>
          Seu perfil na rede
        </h1>
      </div>

      <FluxoAtualizacao perfil={perfil} />
    </main>
  );
}
