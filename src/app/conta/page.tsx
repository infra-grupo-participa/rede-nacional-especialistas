import Link from "next/link";
import { redirect } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { Eyebrow } from "@/components/atoms";
import { getPerfilAtual } from "@/lib/auth";
import { EditorPerfil } from "@/components/perfil/editor-perfil";

export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const perfil = await getPerfilAtual();
  if (!perfil) redirect("/entrar");
  if (perfil.status !== "aprovado") redirect("/aguardando");

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <div className="sticky top-0 z-20 flex items-center gap-2 px-4 py-3" style={{ background: `${C.fundo}ee`, backdropFilter: "blur(8px)", borderBottom: `1px solid rgba(17,17,17,.10)` }}>
        <Link href="/" aria-label="Início" className="press flex shrink-0 items-center justify-center rounded-full" style={{ width: 40, height: 40, color: C.ink, background: C.surface, border: BORDA }}>
          <Ico.back style={{ width: 20, height: 20 }} />
        </Link>
        <div className="min-w-0 flex-1">
          <Eyebrow>Meu perfil</Eyebrow>
        </div>
        <Link href="/meus-artigos" className="press rounded-full px-3.5 text-[13px] font-semibold" style={{ height: 38, lineHeight: "38px", background: C.surface, border: BORDA, color: C.ink }}>
          Meus artigos
        </Link>
      </div>

      <div className="px-4 pt-4">
        <div className="mx-auto max-w-lg">
          <h1 className="text-[26px]" style={{ fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            Personalize seu perfil
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: C.muted }}>
            Capriche — é a sua vitrine na rede. Quanto mais completo, mais você se destaca.
          </p>
        </div>
      </div>

      <EditorPerfil perfil={perfil} />
    </main>
  );
}
