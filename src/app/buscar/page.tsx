import Link from "next/link";
import { buscarMembros } from "@/lib/queries";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { CardMembro } from "@/components/card-membro";
import { BuscaInput } from "./busca-input";

export const dynamic = "force-dynamic";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const termo = (q ?? "").trim();
  const membros = termo ? await buscarMembros(termo) : [];

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}
      >
        <Link
          href="/"
          aria-label="Voltar"
          className="flex shrink-0 items-center justify-center"
          style={{ width: 44, height: 44, color: C.ink }}
        >
          <Ico.back style={{ width: 21, height: 21 }} />
        </Link>
        <div className="min-w-0 flex-1">
          <BuscaInput inicial={termo} />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-4">
        <p className="px-1 pb-3 text-[13px]" style={{ color: C.sobreFundo, fontFamily: F.mono }}>
          {termo
            ? `${membros.length} ${membros.length === 1 ? "resultado" : "resultados"} para “${termo}”`
            : "Digite algo para buscar."}
        </p>

        {termo && membros.length === 0 ? (
          <div className="rounded-2xl px-5 py-14 text-center" style={{ background: C.surface }}>
            <p className="text-[16px]" style={{ color: C.ink, fontFamily: F.serif }}>
              Nenhum especialista encontrado.
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed" style={{ color: C.muted }}>
              Tente por outra cidade, nome ou profissão.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {membros.map((m) => (
              <CardMembro key={m.id} m={m} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
