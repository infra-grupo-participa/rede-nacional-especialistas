import Link from "next/link";
import { redirect } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { Eyebrow } from "@/components/atoms";
import { getPerfilAtual } from "@/lib/auth";
import { filaCoordenacao, contagemFila, type StatusArtigo, type ArtigoComAutor } from "@/lib/artigos";
import { Fila } from "@/components/coordenacao/fila";

export const dynamic = "force-dynamic";

export default async function CoordenacaoPage() {
  const perfil = await getPerfilAtual();
  if (!perfil) redirect("/entrar");
  if (perfil.papel !== "admin" || perfil.status !== "aprovado") redirect("/");

  const [em_analise, ajustes, publicado, contagem] = await Promise.all([
    filaCoordenacao("em_analise"),
    filaCoordenacao("ajustes"),
    filaCoordenacao("publicado"),
    contagemFila(),
  ]);

  const porStatus = {
    em_analise,
    ajustes,
    publicado,
    rascunho: [] as ArtigoComAutor[],
  } satisfies Record<StatusArtigo, ArtigoComAutor[]>;

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}>
        <Link href="/" aria-label="Início" className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 44, color: C.ink }}>
          <Ico.back style={{ width: 21, height: 21 }} />
        </Link>
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <Ico.escudo style={{ width: 18, height: 18, color: C.ink }} />
          <span className="text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
            Coordenação
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 pb-16 pt-6">
        <Eyebrow>Coordenação</Eyebrow>
        <h1 className="mt-2 text-[28px]" style={{ fontFamily: F.serif }}>
          Aprovação de artigos
        </h1>
        <p className="mt-2 text-[15px]" style={{ color: C.muted }}>
          Revise os artigos enviados pelos membros. Aprove para publicar ou devolva com um
          pedido de ajustes.
        </p>

        <div className="mt-6">
          <Fila porStatus={porStatus} contagem={contagem} />
        </div>
      </div>
    </main>
  );
}
