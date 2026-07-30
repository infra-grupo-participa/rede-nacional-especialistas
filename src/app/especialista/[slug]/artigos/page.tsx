import Link from "next/link";
import { notFound } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { Eyebrow } from "@/components/atoms";
import { LinhaEditorial } from "@/components/artigo/cartoes";
import { perfilPorSlug } from "@/lib/queries";
import { artigosDoAutor } from "@/lib/artigos";

export const dynamic = "force-dynamic";

/* TelaArtigosMembro — todos os artigos publicados de um autor (fiel ao MVP 1663). */
export default async function ArtigosMembroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = await perfilPorSlug(slug);
  if (!m) notFound();
  const artigos = await artigosDoAutor(m.id);

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}>
        <Link href={`/especialista/${m.slug ?? m.id}`} aria-label="Voltar" className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 44, color: C.ink }}>
          <Ico.back style={{ width: 21, height: 21 }} />
        </Link>
        <div className="min-w-0 flex-1 text-[13px]" style={{ color: C.sobreFundo, fontFamily: F.mono }}>
          Artigos
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
        <div className="px-1">
          <Eyebrow sobreFundo>Artigos publicados</Eyebrow>
          <h1 className="mt-1 text-[24px] leading-tight" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            {m.nome}
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: C.sobreFundo, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
            {artigos.length} {artigos.length === 1 ? "artigo" : "artigos"}
          </p>
        </div>
        <div className="mt-4 space-y-2.5">
          {artigos.map((a) => (
            <LinhaEditorial key={a.id} a={a} />
          ))}
        </div>
      </div>
    </main>
  );
}
