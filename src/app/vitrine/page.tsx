import { C, F } from "@/lib/tokens";
import { Eyebrow } from "@/components/atoms";
import { catalogoEspecialistas } from "@/lib/queries";
import { getSessaoNav } from "@/lib/auth";
import { TopNav } from "@/components/topnav";
import { Catalogo } from "@/components/vitrine/catalogo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vitrine de especialistas — Time Holding Brasil",
  description: "Advogados e contadores da rede, por região e especialidade.",
};

export default async function VitrinePage() {
  const [especialistas, sessao] = await Promise.all([
    catalogoEspecialistas(),
    getSessaoNav(),
  ]);

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <TopNav sessao={sessao} />

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Rede Nacional de Especialistas</Eyebrow>
          <h1 className="mt-2 text-[32px] leading-tight md:text-[38px]" style={{ fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Encontre um especialista
          </h1>
          <p className="mx-auto mt-2.5 max-w-lg text-[15px] leading-relaxed" style={{ color: C.muted }}>
            Advogados e contadores do Time Holding Brasil — {especialistas.length} profissionais, do seu estado ao país inteiro.
          </p>
        </div>

        <div className="mt-8">
          <Catalogo especialistas={especialistas} />
        </div>
      </div>
    </main>
  );
}
