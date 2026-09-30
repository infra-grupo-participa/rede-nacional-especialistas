import { C, F } from "@/lib/tokens";
import { exigirAdminPagina } from "@/lib/admin";
import { contadoresCoordenacao } from "@/lib/gestao";
import { filaCoordenacao, contagemFila, type StatusArtigo, type ArtigoComAutor } from "@/lib/artigos";
import { Fila } from "@/components/coordenacao/fila";
import { CabecalhoCoordenacao } from "@/components/coordenacao/cabecalho";

export const dynamic = "force-dynamic";

export default async function ArtigosCoordenacaoPage() {
  await exigirAdminPagina();

  const [em_analise, ajustes, publicado, contagem, contadores] = await Promise.all([
    filaCoordenacao("em_analise"),
    filaCoordenacao("ajustes"),
    filaCoordenacao("publicado"),
    contagemFila(),
    contadoresCoordenacao(),
  ]);

  const porStatus = {
    em_analise,
    ajustes,
    publicado,
    rascunho: [] as ArtigoComAutor[],
  } satisfies Record<StatusArtigo, ArtigoComAutor[]>;

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <CabecalhoCoordenacao ativa="artigos" contadores={contadores} />
      <div className="mx-auto max-w-2xl px-5 pb-16 pt-6">
        <h1 className="text-[28px]" style={{ fontFamily: F.serif }}>
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
