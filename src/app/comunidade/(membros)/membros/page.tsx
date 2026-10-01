import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IcoRC } from "@/comunidade/components/icones";
import { LinhaMembro } from "@/comunidade/components/paginas/linha-membro";
import { RankingAutores } from "@/comunidade/components/ranking-autores";
import { contagemCurta, contarMembros, coordenacaoDoGrupo, limparBusca, listarMembros } from "@/comunidade/lib/grupo";
import { rankingAutores } from "@/comunidade/lib/ranking";
import { exigirMembro } from "@/comunidade/lib/sessao";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Membros",
};

const POR_PAGINA = 40;

function caminho(q: string, pagina: number): string {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (pagina > 1) sp.set("pagina", String(pagina));
  const qs = sp.toString();
  return qs ? `/comunidade/membros?${qs}` : "/comunidade/membros";
}

/* Aba Membros: quem está na comunidade. Só nome, nível, profissão e cidade:
   e-mail, WhatsApp e telefone nunca aparecem em lista. */
export default async function MembrosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigirMembro();
  const sp = await searchParams;
  const q = limparBusca(typeof sp.q === "string" ? sp.q : "");
  const pedida = Number.parseInt(typeof sp.pagina === "string" ? sp.pagina : "1", 10);
  const pagina = Number.isFinite(pedida) && pedida > 0 ? Math.min(pedida, 5000) : 1;

  const [total, coordenacao, lista, ranking] = await Promise.all([
    contarMembros(),
    q ? Promise.resolve([]) : coordenacaoDoGrupo(),
    listarMembros({ q, pagina, porPagina: POR_PAGINA }),
    rankingAutores(10),
  ]);
  const paginas = Math.max(1, Math.ceil(lista.total / POR_PAGINA));
  // Página além do fim (link antigo, membro que saiu): volta para uma que existe.
  if (pagina > paginas) redirect(caminho(q, paginas));

  return (
    <main className="rc-pg">
      <div className="rc-pg-duas">
        <div className="rc-pg-principal">
          <section className="rc-cartao rc-pg-bloco" aria-labelledby="membros-titulo">
            <h1 id="membros-titulo" className="rc-cartao-titulo">
              Membros <span className="rc-pg-conta">· {contagemCurta(total)}</span>
            </h1>
            <p className="rc-pg-texto-apoio" style={{ marginTop: 4 }}>
              Quem está na comunidade. Só membros aprovados veem esta lista.
            </p>

            <form action="/comunidade/membros" method="get" role="search" className="rc-pg-busca" style={{ marginTop: 14 }}>
              <IcoRC.busca />
              <input type="search" name="q" defaultValue={q} placeholder="Encontrar um membro pelo nome" aria-label="Encontrar um membro pelo nome" maxLength={80} enterKeyHint="search" autoComplete="off" />
            </form>

            {q && lista.total > 0 && (
              <p className="rc-pg-nota" style={{ marginTop: 10 }}>
                {lista.total === 1 ? "1 resultado" : `${lista.total.toLocaleString("pt-BR")} resultados`} para &ldquo;{q}&rdquo;.{" "}
                <Link href="/comunidade/membros" className="rc-pg-link">
                  Limpar busca
                </Link>
              </p>
            )}

            {coordenacao.length > 0 && pagina === 1 && (
              <>
                <hr className="rc-pg-fio" />
                <h2 className="rc-pg-subtitulo">
                  Coordenação <span className="rc-pg-conta">· {coordenacao.length}</span>
                </h2>
                <ul className="rc-pg-membros-lista">
                  {coordenacao.map((m) => (
                    <LinhaMembro key={m.id} membro={m} />
                  ))}
                </ul>
              </>
            )}

            <hr className="rc-pg-fio" />
            {!q && (
              <h2 className="rc-pg-subtitulo">
                Todos os membros <span className="rc-pg-conta">· {contagemCurta(lista.total)}</span>
              </h2>
            )}
            {lista.itens.length === 0 ? (
              <p className="rc-pg-texto-apoio" style={{ padding: "4px 0" }}>
                {q ? (
                  <>
                    Nenhum membro com esse nome.{" "}
                    <Link href="/comunidade/membros" className="rc-pg-link">
                      Limpar busca
                    </Link>
                  </>
                ) : (
                  "Ainda não há membros."
                )}
              </p>
            ) : (
              <ul className="rc-pg-membros-lista">
                {lista.itens.map((m) => (
                  <LinhaMembro key={m.id} membro={m} />
                ))}
              </ul>
            )}

            {paginas > 1 && (
              <nav className="rc-pg-paginacao" aria-label="Páginas da lista de membros">
                {pagina > 1 ? (
                  <Link href={caminho(q, pagina - 1)} className="rc-btn rc-btn-neutro" rel="prev">
                    Anterior
                  </Link>
                ) : (
                  <span className="rc-btn rc-btn-neutro" aria-disabled="true">
                    Anterior
                  </span>
                )}
                <span>
                  Página {pagina.toLocaleString("pt-BR")} de {paginas.toLocaleString("pt-BR")}
                </span>
                {pagina < paginas ? (
                  <Link href={caminho(q, pagina + 1)} className="rc-btn rc-btn-neutro" rel="next">
                    Próxima
                  </Link>
                ) : (
                  <span className="rc-btn rc-btn-neutro" aria-disabled="true">
                    Próxima
                  </span>
                )}
              </nav>
            )}
          </section>
        </div>

        <aside className="rc-pg-lateral">
          <RankingAutores autores={ranking} titulo="Quem mais contribui" />
        </aside>
      </div>
    </main>
  );
}
