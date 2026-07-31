import { C, F } from "@/lib/tokens";
import { Eyebrow } from "@/components/atoms";
import { listarPublicados } from "@/lib/artigos";
import { getSessaoNav } from "@/lib/auth";
import { TopNav } from "@/components/topnav";
import { PainelArtigos } from "@/components/artigo/painel-artigos";

export const dynamic = "force-dynamic";

export default async function ArtigosPage() {
  const [artigos, sessao] = await Promise.all([listarPublicados(), getSessaoNav()]);

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <TopNav sessao={sessao} />

      <div className="mx-auto max-w-5xl px-5 pb-16 pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Newsletter da rede</Eyebrow>
          <h1 className="mt-2 text-[32px] leading-tight md:text-[38px]" style={{ fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.02em" }}>
            O que os especialistas estão escrevendo
          </h1>
          <p className="mx-auto mt-2.5 max-w-lg text-[15px] leading-relaxed" style={{ color: C.muted }}>
            Análises e experiências de quem atua no dia a dia — publicadas com a curadoria da coordenação.
          </p>
        </div>

        <div className="mt-8">
          <PainelArtigos artigos={artigos} />
        </div>
      </div>
    </main>
  );
}
