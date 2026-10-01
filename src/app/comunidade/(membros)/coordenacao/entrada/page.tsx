import Link from "next/link";
import { C, F, BORDA } from "@/lib/tokens";
import { exigirAdminPagina } from "@/comunidade/lib/admin";
import { contadoresCoordenacao, pedidosEntrada, pendentesSemPedido } from "@/comunidade/lib/gestao";
import { nivelDe } from "@/comunidade/lib/qualificacoes";
import { dataPonto } from "@/lib/utils";
import { CabecalhoCoordenacao, Caixa } from "@/comunidade/components/coordenacao/cabecalho";
import { BotaoSincronizar, CartaoPedido, LinhaPendenteSemPedido } from "@/comunidade/components/coordenacao/cartao-pedido";

export const dynamic = "force-dynamic";

/* Pedidos de entrada (o questionário de 3 perguntas do grupo do Facebook) e o
   cruzamento com a base de alunos para aplicar o nível. */
export default async function EntradaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigirAdminPagina();
  const sp = await searchParams;
  const aba = sp.aba === "aprovados" || sp.aba === "recusados" ? sp.aba : "pendentes";

  const [pendentes, semPedido, decididos, contadores] = await Promise.all([
    aba === "pendentes" ? pedidosEntrada("pendente") : Promise.resolve([]),
    aba === "pendentes" ? pendentesSemPedido() : Promise.resolve([]),
    aba === "pendentes" ? Promise.resolve([]) : pedidosEntrada(aba === "aprovados" ? "aprovado" : "recusado", 60),
    contadoresCoordenacao(),
  ]);

  const abas = [
    { id: "pendentes", rotulo: `Pendentes (${contadores.pedidos})` },
    { id: "aprovados", rotulo: "Aprovados" },
    { id: "recusados", rotulo: "Recusados" },
  ];

  return (
    <main>
      <CabecalhoCoordenacao ativa="entrada" contadores={contadores} />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[28px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 700 }}>
              Pedidos de entrada
            </h1>
            <p className="mt-1 text-[14px]" style={{ color: C.muted }}>
              Quem se cadastrou com o e-mail da compra já entra aprovado e com o nível certo. Os demais passam por aqui.
            </p>
          </div>
          <BotaoSincronizar />
        </div>

        <div className="mt-5 flex gap-2">
          {abas.map((a) => (
            <Link
              key={a.id}
              href={a.id === "pendentes" ? "/comunidade/coordenacao/entrada" : `/comunidade/coordenacao/entrada?aba=${a.id}`}
              className="press rounded-full px-4 text-[14px] font-semibold"
              style={{
                height: 38,
                lineHeight: "38px",
                background: aba === a.id ? C.ink : C.surface,
                color: aba === a.id ? C.fundo : C.ink,
                border: `1px solid ${aba === a.id ? C.ink : C.line}`,
              }}
            >
              {a.rotulo}
            </Link>
          ))}
        </div>

        {aba === "pendentes" ? (
          <>
            {pendentes.length === 0 ? (
              <Caixa className="mt-4 text-center">
                <p className="text-[15px]">Nenhum pedido aguardando.</p>
              </Caixa>
            ) : (
              <ul className="mt-4 space-y-3">
                {pendentes.map((p) => (
                  <CartaoPedido key={p.id} pedido={p} />
                ))}
              </ul>
            )}

            {semPedido.length > 0 && (
              <Caixa className="mt-6">
                <h2 className="text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
                  Cadastrados que ainda não responderam o questionário ({semPedido.length})
                </h2>
                <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                  Eles veem o questionário ao entrar. Libere direto só quando souber quem é (equipe, convidado).
                  Perfis criados automaticamente para usuários do workbook, da central e do GPS ficam fora desta lista.
                </p>
                <ul className="mt-2">
                  {semPedido.map((p) => (
                    <LinhaPendenteSemPedido key={p.id} perfil={p} />
                  ))}
                </ul>
              </Caixa>
            )}
          </>
        ) : decididos.length === 0 ? (
          <Caixa className="mt-4 text-center">
            <p className="text-[15px]">Nada por aqui ainda.</p>
          </Caixa>
        ) : (
          <ul className="mt-4 space-y-2">
            {decididos.map((d) => (
              <li key={d.id} className="rounded-2xl p-3.5" style={{ background: C.surface, border: BORDA }}>
                <div className="flex items-center gap-2">
                  <span className="min-w-0 truncate text-[15px] font-semibold">{d.perfil?.nome ?? "(membro removido)"}</span>
                  {d.perfil && (
                    <span className="text-[12px]" style={{ color: C.muted }}>
                      {nivelDe(d.perfil.qualificacao).rotulo}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-[12px]" style={{ color: C.muted }}>
                    {d.decidido_em ? dataPonto(d.decidido_em) : ""}
                  </span>
                </div>
                {d.motivo && (
                  <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                    {d.motivo}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
