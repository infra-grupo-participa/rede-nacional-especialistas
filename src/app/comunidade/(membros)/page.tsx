import Link from "next/link";
import { comPrevias, listarFeed, listarFixados, meusPostsRetidos, type OrdemFeed } from "@/comunidade/lib/feed";
import { POSTS_POR_VEZ } from "@/comunidade/lib/feed-tipos";
import { exigirMembro, euDe } from "@/comunidade/lib/sessao";
import { configComunidade } from "@/comunidade/lib/gestao";
import { GRUPO, midiaRecente } from "@/comunidade/lib/grupo";
import { IcoRC } from "@/comunidade/components/icones";
import { FeedCliente } from "@/comunidade/components/feed-cliente";

export const dynamic = "force-dynamic";

/** Trecho da descrição do grupo para a lateral (o resto fica na aba Sobre). */
function resumo(texto: string, limite = 132): { trecho: string; cortou: boolean } {
  if (texto.length <= limite) return { trecho: texto, cortou: false };
  const corte = texto.slice(0, limite);
  const fim = corte.lastIndexOf(" ");
  return { trecho: corte.slice(0, fim > 60 ? fim : limite).replace(/[\s.,;:]+$/, ""), cortou: true };
}

/* Discussão: a primeira coisa que o membro vê ao entrar. À esquerda, escrever,
   posts em destaque e o feed (novos posts ou atividade recente, em levas que
   continuam ao rolar; o post em destaque também fica na lista); à direita, o
   "Sobre" e a "Mídia recente", como no grupo do Facebook. */
export default async function DiscussaoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ordem: OrdemFeed = sp.ordem === "atividade" ? "atividade" : "novos";
  const perfil = await exigirMembro();

  const [posts, fixados, config, retidos, midia] = await Promise.all([
    listarFeed(ordem, { comFixados: true, limite: POSTS_POR_VEZ }).then(comPrevias),
    listarFixados().then(comPrevias),
    configComunidade(),
    meusPostsRetidos(perfil.id),
    midiaRecente(4),
  ]);

  const descricao = resumo(GRUPO.descricao);

  return (
    <main className="rc-discussao">
      <FeedCliente
        key={ordem}
        posts={posts}
        fixados={fixados}
        ordem={ordem}
        eu={euDe(perfil)}
        hashtags={config.hashtags}
        exigirHashtag={config.exigir_hashtag}
        retidos={retidos}
      />

      <aside className="rc-lateral" aria-label="Sobre o grupo">
        <section className="rc-cartao rc-lat-cartao">
          <h2 className="rc-cartao-titulo">Sobre</h2>
          <p className="rc-lat-desc">
            {descricao.trecho}
            {descricao.cortou && "... "}
            {descricao.cortou && <Link href="/comunidade/sobre">Ver mais</Link>}
          </p>
          <ul className="rc-lat-itens">
            <li>
              <IcoRC.cadeado />
              <div>
                <strong>Privado</strong>
                <span>{GRUPO.privado}</span>
              </div>
            </li>
            <li>
              <IcoRC.olho />
              <div>
                <strong>Entrada com aprovação</strong>
                <span>{GRUPO.entrada}</span>
              </div>
            </li>
          </ul>
        </section>

        {midia.length > 0 && (
          <section className="rc-cartao rc-lat-cartao">
            <h2 className="rc-cartao-titulo">Mídia recente</h2>
            <div className="rc-midia-grade">
              {midia.map((m) => (
                <Link key={m.imagem_url} href={`/comunidade/post/${m.post_id}`} aria-label="Abrir o post desta foto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.imagem_url} alt="" loading="lazy" />
                </Link>
              ))}
            </div>
            <Link href="/comunidade/midia" className="rc-btn rc-btn-neutro rc-btn-bloco">
              Ver tudo
            </Link>
          </section>
        )}
      </aside>
    </main>
  );
}
