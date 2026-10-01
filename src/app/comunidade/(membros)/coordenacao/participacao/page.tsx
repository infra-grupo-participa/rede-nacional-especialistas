import { C, F, BORDA } from "@/lib/tokens";
import { exigirAdminPagina } from "@/comunidade/lib/admin";
import {
  aplicarFiltros,
  contadoresCoordenacao,
  ehInativo,
  filtrosDe,
  hojeSP,
  periodoDe,
  relatorioParticipacao,
} from "@/comunidade/lib/gestao";
import { idsVerificados } from "@/comunidade/lib/verificados";
import { CabecalhoCoordenacao } from "@/comunidade/components/coordenacao/cabecalho";
import { SeletorPeriodo } from "@/comunidade/components/coordenacao/seletor-periodo";
import { FiltrosRelatorioBarra } from "@/comunidade/components/coordenacao/filtros-relatorio";
import { TabelaParticipacao } from "@/comunidade/components/coordenacao/tabela-participacao";

export const dynamic = "force-dynamic";

/* Relatório de participação por membro (itens 1 a 7 do documento): uma linha
   por aluno, com posts, comentários, reações, primeiro e último acesso, nível,
   filtro de inativos e exportação para planilha. */
export default async function ParticipacaoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigirAdminPagina();
  const sp = await searchParams;
  const periodo = periodoDe(sp, 30);
  const filtros = filtrosDe(sp);
  const hoje = hojeSP();

  const [todas, contadores, verificados] = await Promise.all([
    relatorioParticipacao(periodo),
    contadoresCoordenacao(),
    idsVerificados(),
  ]);
  const linhas = aplicarFiltros(todas, filtros);

  // Resumo sobre os aprovados (a base da comunidade), independente dos filtros.
  const aprovados = todas.filter((l) => l.status === "aprovado");
  const comConta = aprovados.filter((l) => l.tem_conta);
  const resumo = [
    { rotulo: "Aprovados", valor: aprovados.length },
    { rotulo: "Com conta criada", valor: comConta.length },
    { rotulo: "Acessaram no período", valor: aprovados.filter((l) => l.dias_ativos_periodo > 0).length },
    { rotulo: `Sem acesso há ${filtros.diasInativo}+ dias`, valor: comConta.filter((l) => l.ultimo_acesso && ehInativo(l, filtros.diasInativo)).length },
    { rotulo: "Conta criada, nunca acessou", valor: comConta.filter((l) => !l.ultimo_acesso).length },
  ];

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") qs.set(k, v);
  qs.set("inicio", periodo.inicio);
  qs.set("fim", periodo.fim);

  return (
    <main>
      <CabecalhoCoordenacao ativa="participacao" contadores={contadores} />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[28px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 700 }}>
              Participação por membro
            </h1>
            <p className="mt-1 max-w-2xl text-[14px]" style={{ color: C.muted }}>
              Uma linha por aluno. Nos contadores, o primeiro número é do período escolhido e o segundo é desde a entrada.
              O acesso conta mesmo quando a pessoa só entrou e leu.
            </p>
          </div>
          <SeletorPeriodo inicio={periodo.inicio} fim={periodo.fim} hoje={hoje} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {resumo.map((r) => (
            <div key={r.rotulo} className="rounded-2xl p-3.5" style={{ background: C.surface, border: BORDA }}>
              <span className="block text-[12px] leading-snug" style={{ color: C.muted }}>
                {r.rotulo}
              </span>
              <span className="mt-1 block text-[24px] font-bold leading-none tabular-nums" style={{ fontFamily: F.serif }}>
                {r.valor.toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <FiltrosRelatorioBarra filtros={filtros} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px]" style={{ color: C.muted }}>
            <strong style={{ color: C.ink }}>{linhas.length.toLocaleString("pt-BR")}</strong> {linhas.length === 1 ? "membro" : "membros"} no recorte
          </p>
          <a
            href={`/comunidade/coordenacao/participacao/exportar?${qs.toString()}`}
            className="press inline-flex items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold"
            style={{ height: 40, background: C.laranja, color: C.ink }}
          >
            Baixar planilha (.csv)
          </a>
        </div>

        <div className="mt-3">
          <TabelaParticipacao linhas={linhas} diasInativo={filtros.diasInativo} verificados={[...verificados]} />
        </div>

        <p className="mt-4 text-[12px] leading-relaxed" style={{ color: C.muted }}>
          * Primeiro acesso estimado: o rastreio de acesso começou com esta versão do sistema. Para quem já participava antes,
          o primeiro acesso é o dia da atividade mais antiga (post, comentário, reação, artigo) ou do último login conhecido.
          &quot;Sem conta&quot; é aluno da base de compras que ainda não criou login na rede.
        </p>
      </div>
    </main>
  );
}
