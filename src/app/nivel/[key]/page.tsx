import Link from "next/link";
import { notFound } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { Eyebrow } from "@/components/atoms";
import { SeloNivel } from "@/components/niveis";
import { CardMembro } from "@/components/card-membro";
import { membrosPorNivel } from "@/lib/queries";
import { NIVEIS, type Qualificacao } from "@/lib/qualificacoes";

export const dynamic = "force-dynamic";

export default async function NivelPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const nivel = NIVEIS[key as Qualificacao];
  if (!nivel || nivel.icone === null) notFound(); // só níveis com selo têm diretório

  const membros = await membrosPorNivel(key);

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}>
        <Link href="/" aria-label="Início" className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 44, color: C.ink }}>
          <Ico.back style={{ width: 21, height: 21 }} />
        </Link>
        <div className="min-w-0 flex-1 text-[13px]" style={{ color: C.sobreFundo, fontFamily: F.mono }}>
          Nível
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 pb-16 pt-6">
        <div className="flex items-center gap-2">
          <SeloNivel q={key as Qualificacao} tamanho="lg" />
        </div>
        <h1 className="mt-3 text-[28px]" style={{ fontFamily: F.serif }}>
          Especialistas {nivel.rotulo}
        </h1>
        <p className="mt-2 text-[15px]" style={{ color: C.muted }}>
          {membros.length} {membros.length === 1 ? "profissional" : "profissionais"} · {nivel.faixa}
        </p>

        {membros.length === 0 ? (
          <div className="mt-6 rounded-2xl p-6 text-center" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <p className="text-[15px]" style={{ color: C.ink }}>
              Ainda não há especialistas neste nível.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            {membros.map((m) => (
              <CardMembro key={m.id} m={m} />
            ))}
          </div>
        )}

        <div className="mt-8">
          <Eyebrow>Outros níveis</Eyebrow>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.values(NIVEIS)
              .filter((n) => n.icone !== null && n.key !== key)
              .map((n) => (
                <Link key={n.key} href={`/nivel/${n.key}`}>
                  <SeloNivel q={n.key} tamanho="sm" />
                </Link>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
}
