import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, SeloVerificado, TagNivel } from "@/comunidade/components/atoms";
import { IcoRC } from "@/comunidade/components/icones";
import { ListaPosts } from "@/comunidade/components/lista-posts";
import { comPrevias, listarFeed } from "@/comunidade/lib/feed";
import { hrefMembro, limparBusca, listarMembros } from "@/comunidade/lib/grupo";
import { exigirMembro, euDe } from "@/comunidade/lib/sessao";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Busca" };

/** Hashtag do jeito que o banco guarda: minúscula, sem acento e sem o "#". */
function normalizarTag(q: string): string {
  return q
    .replace(/^#+/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")[0];
}

/* Busca do grupo: por assunto (texto dos posts), por #hashtag e por nome de
   colega. O campo do topo e a lupa das abas caem aqui com `?q=`. */
export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const perfil = await exigirMembro();
  const sp = await searchParams;
  const digitado = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim().slice(0, 80);

  const porTag = digitado.startsWith("#");
  const tag = porTag ? normalizarTag(digitado) : "";
  const termo = porTag ? "" : limparBusca(digitado);
  const buscou = Boolean(tag || termo);

  const [posts, membros] = await Promise.all([
    !buscou ? [] : listarFeed("novos", tag ? { hashtag: tag, comFixados: true } : { q: termo, comFixados: true }).then(comPrevias),
    termo ? listarMembros({ q: termo, porPagina: 6 }).then((r) => r.itens) : [],
  ]);
  const procurado = tag ? `#${tag}` : termo;

  return (
    <main className="rc-coluna rc-pilha">
      <header className="rc-cartao rc-pagina-topo">
        <h1>Busca</h1>
        <form action="/comunidade/busca" method="get" role="search" className="rc-busca-form">
          <label className="rc-busca-campo">
            <IcoRC.busca />
            <input key={digitado} type="search" name="q" defaultValue={digitado} placeholder="Pesquisar na Rede" aria-label="Pesquisar na Rede" maxLength={80} autoComplete="off" enterKeyHint="search" />
          </label>
          <button type="submit" className="rc-btn rc-btn-primario">
            Buscar
          </button>
        </form>
        {buscou ? (
          <p role="status">
            {posts.length === 0 && membros.length === 0
              ? `Nada encontrado para “${procurado}”.`
              : tag
                ? `Posts com a hashtag ${procurado}.`
                : `Resultados para “${procurado}”.`}
          </p>
        ) : (
          <p>Procure por um assunto, uma #hashtag ou o nome de um colega.</p>
        )}
      </header>

      {membros.length > 0 && (
        <section className="rc-cartao rc-pessoas" aria-label="Membros encontrados">
          <h2 className="rc-cartao-titulo">Membros</h2>
          {membros.map((m) => {
            const sub = m.profissao || m.headline || [m.cidade, m.uf].filter(Boolean).join("/");
            return (
              <Link key={m.id} href={hrefMembro(m)} className="rc-pessoa">
                <Avatar nome={m.nome} foto={m.avatar_url} size={40} />
                <span className="rc-pessoa-quem">
                  <span className="rc-pessoa-nome">
                    <span>{m.nome}</span>
                    {m.verificado && <SeloVerificado size="sm" />}
                    <TagNivel qualificacao={m.qualificacao} size="sm" />
                  </span>
                  {sub && <span className="rc-pessoa-sub">{sub}</span>}
                </span>
              </Link>
            );
          })}
        </section>
      )}

      {buscou && posts.length > 0 && membros.length > 0 && <h2 className="rc-secao-titulo">Posts</h2>}
      {buscou && <ListaPosts posts={posts} eu={euDe(perfil)} vazio={membros.length > 0 ? "Nenhum post com esse texto." : "Tente outra palavra, ou uma #hashtag de tema."} />}
    </main>
  );
}
