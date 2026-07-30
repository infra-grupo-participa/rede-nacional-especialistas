import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { Eyebrow } from "@/components/atoms";
import { listarPublicados } from "@/lib/artigos";
import { getPerfilAtual } from "@/lib/auth";
import { PainelArtigos } from "@/components/artigo/painel-artigos";

export const dynamic = "force-dynamic";

export default async function ArtigosPage() {
  const [artigos, perfil] = await Promise.all([listarPublicados(), getPerfilAtual()]);
  const aprovado = perfil?.status === "aprovado";

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}>
        <Link href="/" aria-label="Início" className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 44, color: C.ink }}>
          <Ico.back style={{ width: 21, height: 21 }} />
        </Link>
        <div className="min-w-0 flex-1">
          <span className="text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
            Artigos
          </span>
        </div>
        {aprovado && (
          <Link
            href="/meus-artigos"
            className="flex items-center gap-1.5 rounded-full px-3.5"
            style={{ height: 36, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}
          >
            <Ico.doc style={{ width: 15, height: 15 }} />
            <span className="text-[13px] font-semibold">Meus artigos</span>
          </Link>
        )}
      </header>

      <div className="mx-auto max-w-2xl px-5 pb-16 pt-6">
        <Eyebrow>Newsletter da rede</Eyebrow>
        <h1 className="mt-2 text-[28px] leading-tight" style={{ fontFamily: F.serif }}>
          O que os especialistas estão escrevendo
        </h1>
        <p className="mt-2 text-[15px]" style={{ color: C.muted }}>
          Análises e experiências de quem atua no dia a dia — publicadas com a curadoria da coordenação.
        </p>

        <div className="mt-6">
          <PainelArtigos artigos={artigos} />
        </div>
      </div>
    </main>
  );
}
