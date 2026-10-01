"use client";

import { useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/comunidade/components/atoms";
import { IcoRC } from "@/comunidade/components/icones";
import { ItemMenu, Menu } from "@/comunidade/components/ui";
import { CriarPost, type CriarPostRef } from "@/comunidade/components/criar-post";
import { CartaoRetidos, ListaPosts } from "@/comunidade/components/lista-posts";
import { hrefMembro } from "@/comunidade/lib/grupo-tipos";
import type { OrdemFeed, PostFeed } from "@/comunidade/lib/feed";
import type { Eu } from "@/comunidade/lib/sessao";

const ORDENS: { id: OrdemFeed; rotulo: string; dica: string; href: string }[] = [
  { id: "novos", rotulo: "Novos posts", dica: "na ordem em que foram publicados", href: "/comunidade" },
  { id: "atividade", rotulo: "Atividade recente", dica: "sobem quando alguém comenta", href: "/comunidade?ordem=atividade" },
];

/* Coluna da Discussão, na ordem do grupo do Facebook: a caixa "Escreva algo...",
   os avisos, "Em destaque" (abre e fecha), a ordem do feed e os posts. */
export function FeedCliente({
  posts,
  fixados = [],
  ordem = "novos",
  eu,
  hashtags = [],
  exigirHashtag = false,
  retidos = [],
}: {
  posts: PostFeed[];
  fixados?: PostFeed[];
  ordem?: OrdemFeed;
  eu: Eu;
  hashtags?: string[];
  exigirHashtag?: boolean;
  retidos?: { id: string; titulo: string; corpo: string; criado_em: string }[];
}) {
  const router = useRouter();
  const criar = useRef<CriarPostRef>(null);
  const [trocando, trocar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);
  const [destaqueAberto, setDestaqueAberto] = useState(false);
  const idDestaque = useId();
  const ordemAtual = ORDENS.find((o) => o.id === ordem) ?? ORDENS[0];

  return (
    <div className="rc-feed">
      <section className="rc-cartao rc-compor" aria-label="Criar post">
        <div className="rc-compor-linha">
          <Link href={hrefMembro({ id: eu.perfilId })} className="rc-compor-avatar" aria-label="Meu perfil">
            <Avatar nome={eu.nome} foto={eu.avatar} size={40} />
          </Link>
          <button type="button" className="rc-compor-pilula" onClick={() => criar.current?.abrir("texto")}>
            Escreva algo...
          </button>
        </div>
        <div className="rc-compor-atalhos">
          <button type="button" className="rc-btn rc-btn-fantasma" onClick={() => criar.current?.abrir("foto")}>
            <IcoRC.imagem />
            <span>Foto</span>
          </button>
          <button type="button" className="rc-btn rc-btn-fantasma" onClick={() => criar.current?.abrir("hashtag")}>
            <IcoRC.hashtag />
            <span>Hashtag do tema</span>
          </button>
        </div>
      </section>

      <CriarPost ref={criar} eu={eu} hashtags={hashtags} exigirHashtag={exigirHashtag} onPublicado={setAviso} />

      {aviso && (
        <div className="rc-cartao rc-aviso" role="status">
          <IcoRC.info />
          <p>
            {aviso}
            {aviso.includes("regras") && (
              <>
                {" "}
                <Link href="/comunidade/sobre#regras">Abrir as regras do grupo</Link>
              </>
            )}
          </p>
          <button type="button" className="rc-aviso-fechar" aria-label="Fechar o aviso" onClick={() => setAviso(null)}>
            <IcoRC.x />
          </button>
        </div>
      )}

      <CartaoRetidos retidos={retidos} />

      {fixados.length > 0 && (
        <section className="rc-destaque" aria-label="Posts em destaque">
          <button type="button" className="rc-cartao rc-destaque-topo" aria-expanded={destaqueAberto} aria-controls={idDestaque} onClick={() => setDestaqueAberto((v) => !v)}>
            <span className="rc-destaque-rotulo">
              <span className="rc-cartao-titulo">Em destaque</span>
              <span className="rc-destaque-n">{fixados.length === 1 ? "1 post" : `${fixados.length} posts`}</span>
            </span>
            <span className="rc-destaque-seta">{destaqueAberto ? <IcoRC.chevronCima /> : <IcoRC.chevronBaixo />}</span>
          </button>
          <div id={idDestaque} hidden={!destaqueAberto}>
            {destaqueAberto && <ListaPosts posts={fixados} eu={eu} />}
          </div>
        </section>
      )}

      <div className="rc-ordem">
        <Menu
          lado="esquerda"
          rotulo="Ordem dos posts"
          gatilho={({ aberto, alternar }) => (
            <button type="button" className="rc-ordem-btn" aria-haspopup="menu" aria-expanded={aberto} onClick={alternar}>
              {ordemAtual.rotulo}
              <IcoRC.setaBaixo />
            </button>
          )}
        >
          {(fechar) =>
            ORDENS.map((o) => (
              <ItemMenu
                key={o.id}
                sub={o.dica}
                icone={o.id === ordem ? <IcoRC.marcado /> : <span className="rc-ordem-vago" />}
                onClick={() => {
                  fechar();
                  // sem rolar: a página fica onde está e só a lista troca
                  if (o.id !== ordem) trocar(() => router.push(o.href, { scroll: false }));
                }}
              >
                {o.rotulo}
              </ItemMenu>
            ))
          }
        </Menu>
      </div>

      <div className="rc-feed-lista" data-trocando={trocando || undefined} aria-busy={trocando}>
        <ListaPosts posts={posts} eu={eu} vazio="Ainda não há posts. Seja o primeiro a publicar." />
      </div>
    </div>
  );
}
