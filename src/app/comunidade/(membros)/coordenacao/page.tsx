import Link from "next/link";
import { C, F, BORDA } from "@/lib/tokens";
import { exigirAdminPagina } from "@/comunidade/lib/admin";
import { contadoresCoordenacao, hojeSP, insights, periodoDe } from "@/comunidade/lib/gestao";
import { nivelDe, NIVEIS_ORDENADOS } from "@/comunidade/lib/qualificacoes";
import { hrefMembro } from "@/comunidade/lib/grupo-tipos";
import { TagNivel } from "@/comunidade/components/atoms";
import { CabecalhoCoordenacao, Caixa } from "@/comunidade/components/coordenacao/cabecalho";
import { SeletorPeriodo } from "@/comunidade/components/coordenacao/seletor-periodo";
import { GraficoBarras, type PontoBarra } from "@/comunidade/components/coordenacao/grafico-barras";

export const dynamic = "force-dynamic";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function ddmm(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/* Visão geral = os "Insights do grupo" do Facebook, sem o limite de 28 dias:
   crescimento, engajamento, membros ativos (inclusive quem só lê), melhores
   dias e horários, top posts e top contribuidores, e o recorte por nível. */
export default async function VisaoGeralPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigirAdminPagina();
  const sp = await searchParams;
  const periodo = periodoDe(sp, 30);
  const hoje = hojeSP();
  const [ins, contadores] = await Promise.all([insights(periodo), contadoresCoordenacao()]);
  const t = ins.totais;

  // Rótulo de eixo espaçado para não amontoar (mais ou menos 6 marcas).
  const passo = Math.max(1, Math.ceil(ins.serie.length / 6));
  const serieAtivos: PontoBarra[] = ins.serie.map((s, i) => ({
    rotulo: ddmm(s.dia),
    eixo: i % passo === 0 ? ddmm(s.dia) : "",
    valor: s.ativos,
    detalhe: s.novos ? [`${s.novos} primeiro(s) acesso(s)`] : undefined,
  }));
  const serieInteracoes: PontoBarra[] = ins.serie.map((s, i) => ({
    rotulo: ddmm(s.dia),
    eixo: i % passo === 0 ? ddmm(s.dia) : "",
    valor: s.posts + s.comentarios + s.reacoes,
    detalhe: [`Posts: ${s.posts}`, `Comentários: ${s.comentarios}`, `Reações: ${s.reacoes}`],
  }));
  const porDow = new Map(ins.dias_semana.map((d) => [d.dow, d.n]));
  const serieDias: PontoBarra[] = DIAS.map((nome, dow) => ({ rotulo: nome, eixo: DIAS_CURTOS[dow], valor: porDow.get(dow) ?? 0 }));
  const porHora = new Map(ins.horas.map((h) => [h.hora, h.n]));
  const serieHoras: PontoBarra[] = Array.from({ length: 24 }, (_, h) => ({
    rotulo: `${String(h).padStart(2, "0")}h`,
    eixo: h % 3 === 0 ? `${h}h` : "",
    valor: porHora.get(h) ?? 0,
  }));

  const melhorDia = [...serieDias].sort((a, b) => b.valor - a.valor)[0];
  const melhorHora = [...serieHoras].sort((a, b) => b.valor - a.valor)[0];
  const porNivel = new Map(ins.por_nivel.map((n) => [n.qualificacao, n]));
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

  const blocos: { rotulo: string; valor: number; nota?: string; href?: string }[] = [
    { rotulo: "Membros aprovados", valor: t.membros_aprovados, nota: `${t.membros_com_conta.toLocaleString("pt-BR")} já criaram conta` },
    { rotulo: "Acessaram no período", valor: t.ativos, nota: `${pct(t.ativos, t.membros_com_conta)}% de quem tem conta`, href: `/comunidade/coordenacao/participacao?inicio=${periodo.inicio}&fim=${periodo.fim}&situacao=ativos` },
    { rotulo: "Primeiro acesso no período", valor: t.novos_no_periodo },
    { rotulo: "Interagiram (post, comentário ou reação)", valor: t.participantes, nota: `${pct(t.participantes, t.ativos)}% dos que acessaram` },
    { rotulo: "Posts", valor: t.posts },
    { rotulo: "Comentários", valor: t.comentarios },
    { rotulo: "Reações", valor: t.reacoes },
  ];

  return (
    <main>
      <CabecalhoCoordenacao ativa="geral" contadores={contadores} />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[28px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 700 }}>
              Visão geral da comunidade
            </h1>
            <p className="mt-1 text-[14px]" style={{ color: C.muted }}>
              {ddmm(periodo.inicio)} a {ddmm(periodo.fim)} · horário de Brasília
            </p>
          </div>
          <SeletorPeriodo inicio={periodo.inicio} fim={periodo.fim} hoje={hoje} />
        </div>

        {(t.pedidos_pendentes > 0 || t.posts_retidos > 0) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {t.pedidos_pendentes > 0 && (
              <Link href="/comunidade/coordenacao/entrada" className="press rounded-2xl px-4 py-3 text-[14px] font-semibold" style={{ background: C.petrolSoft, color: C.ink, border: BORDA }}>
                {t.pedidos_pendentes} {t.pedidos_pendentes === 1 ? "pedido de entrada aguarda" : "pedidos de entrada aguardam"} análise →
              </Link>
            )}
            {t.posts_retidos > 0 && (
              <Link href="/comunidade/coordenacao/moderacao" className="press rounded-2xl px-4 py-3 text-[14px] font-semibold" style={{ background: C.petrolSoft, color: C.ink, border: BORDA }}>
                {t.posts_retidos} {t.posts_retidos === 1 ? "post retido" : "posts retidos"} pela palavra-chave →
              </Link>
            )}
          </div>
        )}

        {/* números do período */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {blocos.map((b) => {
            const corpo = (
              <>
                <span className="block text-[12px] leading-snug" style={{ color: C.muted }}>
                  {b.rotulo}
                </span>
                <span className="mt-1 block text-[28px] font-bold leading-none tabular-nums" style={{ fontFamily: F.serif }}>
                  {b.valor.toLocaleString("pt-BR")}
                </span>
                {b.nota && (
                  <span className="mt-1.5 block text-[12px]" style={{ color: C.muted }}>
                    {b.nota}
                  </span>
                )}
              </>
            );
            return b.href ? (
              <Link key={b.rotulo} href={b.href} className="card-hover rounded-2xl p-4" style={{ background: C.surface, border: BORDA }}>
                {corpo}
              </Link>
            ) : (
              <div key={b.rotulo} className="rounded-2xl p-4" style={{ background: C.surface, border: BORDA }}>
                {corpo}
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Caixa>
            <GraficoBarras titulo="Membros que acessaram, por dia" pontos={serieAtivos} unidade="membros" />
          </Caixa>
          <Caixa>
            <GraficoBarras titulo="Interações por dia (posts + comentários + reações)" pontos={serieInteracoes} unidade="interações" />
          </Caixa>
          <Caixa>
            <GraficoBarras titulo="Posts e comentários por dia da semana" pontos={serieDias} altura={120} />
            {melhorDia && melhorDia.valor > 0 && (
              <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
                Dia mais movimentado: <strong style={{ color: C.ink }}>{melhorDia.rotulo}</strong>
              </p>
            )}
          </Caixa>
          <Caixa>
            <GraficoBarras titulo="Posts e comentários por horário" pontos={serieHoras} altura={120} />
            {melhorHora && melhorHora.valor > 0 && (
              <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
                Horário mais movimentado: <strong style={{ color: C.ink }}>{melhorHora.rotulo}</strong>
              </p>
            )}
          </Caixa>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Caixa>
            <h2 className="text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
              Top contribuidores do período
            </h2>
            {ins.top_contribuidores.length === 0 ? (
              <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
                Ninguém postou nem comentou neste período.
              </p>
            ) : (
              <ol className="mt-3 space-y-1.5">
                {ins.top_contribuidores.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-2 text-[14px]">
                    <span className="w-5 shrink-0 text-right tabular-nums" style={{ color: C.muted, fontFamily: F.mono }}>
                      {i + 1}
                    </span>
                    <Link href={hrefMembro(c)} className="min-w-0 truncate font-semibold">
                      {c.nome}
                    </Link>
                    <TagNivel qualificacao={c.qualificacao} size="sm" />
                    <span className="ml-auto shrink-0 text-[12px] tabular-nums" style={{ color: C.muted }}>
                      {c.posts} posts · {c.comentarios} coment.
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Caixa>

          <Caixa>
            <h2 className="text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
              Top posts do período
            </h2>
            {ins.top_posts.length === 0 ? (
              <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
                Nenhum post publicado neste período.
              </p>
            ) : (
              <ol className="mt-3 space-y-2">
                {ins.top_posts.map((p) => (
                  <li key={p.id} className="text-[14px]">
                    <Link href={`/comunidade/post/${p.id}`} className="line-clamp-1 font-semibold">
                      {p.titulo || "(sem texto)"}
                    </Link>
                    <span className="flex items-center gap-1.5 text-[12px]" style={{ color: C.muted }}>
                      {p.autor} <TagNivel qualificacao={p.qualificacao} size="sm" /> · {p.score} votos · {p.n_comentarios} comentários
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Caixa>
        </div>

        <Caixa className="mt-4">
          <h2 className="text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
            Por nível
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-[14px]">
              <thead>
                <tr className="text-left text-[12px]" style={{ color: C.muted }}>
                  <th className="py-1.5 pr-3 font-semibold">Nível</th>
                  <th className="py-1.5 pr-3 text-right font-semibold">Membros</th>
                  <th className="py-1.5 pr-3 text-right font-semibold">Sem conta criada</th>
                  <th className="py-1.5 pr-3 text-right font-semibold">Acessaram no período</th>
                  <th className="py-1.5 text-right font-semibold">% ativos</th>
                </tr>
              </thead>
              <tbody>
                {[...NIVEIS_ORDENADOS].reverse().map((n) => {
                  const d = porNivel.get(n.key);
                  return (
                    <tr key={n.key} style={{ borderTop: BORDA }}>
                      <td className="py-2 pr-3">
                        <Link href={`/comunidade/coordenacao/participacao?nivel=${n.key}&inicio=${periodo.inicio}&fim=${periodo.fim}`}>
                          <TagNivel qualificacao={n.key} size="md" />
                        </Link>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{(d?.membros ?? 0).toLocaleString("pt-BR")}</td>
                      <td className="py-2 pr-3 text-right tabular-nums" style={{ color: C.muted }}>
                        {(d?.sem_conta ?? 0).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{(d?.ativos ?? 0).toLocaleString("pt-BR")}</td>
                      <td className="py-2 text-right tabular-nums">{pct(d?.ativos ?? 0, d?.membros ?? 0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px]" style={{ color: C.muted }}>
            &quot;Sem conta criada&quot; são alunos da base que ainda não entraram na rede nenhuma vez. Nível {nivelDe("thb").rotulo} é o aluno
            que ainda não tem produto Aurum ou acima.
          </p>
        </Caixa>
      </div>
    </main>
  );
}
