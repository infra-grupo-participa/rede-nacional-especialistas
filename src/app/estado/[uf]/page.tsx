import Link from "next/link";
import { notFound } from "next/navigation";
import { ESTADO_POR_UF } from "@/lib/estados";
import { membrosPorUf } from "@/lib/queries";
import { norm } from "@/lib/utils";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { Placa } from "@/components/atoms";
import { CardMembro } from "@/components/card-membro";
import { ListaStagger, ItemStagger } from "@/components/lista-stagger";

export const dynamic = "force-dynamic";

export default async function EstadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ uf: string }>;
  searchParams: Promise<{ prof?: string }>;
}) {
  const { uf: ufParam } = await params;
  const { prof } = await searchParams;
  const uf = ufParam.toUpperCase();
  const estado = ESTADO_POR_UF[uf];
  if (!estado) notFound();

  const todos = await membrosPorUf(uf);
  const membros = prof
    ? todos.filter((m) => norm(m.profissao) === norm(prof))
    : todos;

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      {/* cabeçalho do estado */}
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
          <div
            className="truncate text-[18px] font-semibold leading-tight"
            style={{ color: C.ink, fontFamily: F.serif }}
          >
            {estado.nome}
          </div>
          <div className="text-[12px]" style={{ color: C.sobreFundo, fontFamily: F.mono }}>
            {membros.length}{" "}
            {membros.length === 1 ? "especialista" : "especialistas"} · {estado.regiao}
          </div>
        </div>
        <Placa uf={uf} tom="escuro" />
      </div>

      <div className="mx-auto max-w-2xl px-4 py-4">
        {prof && (
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold" style={{ background: C.laranja, color: C.ink }}>
              {prof}
              <Link href={`/estado/${uf}`} aria-label="Limpar filtro" style={{ display: "inline-flex" }}>
                <Ico.x style={{ width: 13, height: 13 }} />
              </Link>
            </span>
          </div>
        )}
        {membros.length === 0 ? (
          <div className="rounded-2xl px-5 py-14 text-center" style={{ background: C.surface }}>
            <p className="text-[16px]" style={{ color: C.ink, fontFamily: F.serif }}>
              Ainda não há especialistas em {estado.nome}.
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed" style={{ color: C.muted }}>
              Em breve a comunidade cresce por aqui. Volte para a vitrine e explore outros estados.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-[14px] font-semibold"
              style={{ color: C.petrol }}
            >
              ← Ver o mapa
            </Link>
          </div>
        ) : (
          <ListaStagger className="space-y-2.5">
            {membros.map((m) => (
              <ItemStagger key={m.id}>
                <CardMembro m={m} />
              </ItemStagger>
            ))}
          </ListaStagger>
        )}
      </div>
    </main>
  );
}
