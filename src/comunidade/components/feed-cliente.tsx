"use client";

import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/comunidade/components/atoms";
import { IcoRC } from "@/comunidade/components/icones";
import { ItemMenu, Menu } from "@/comunidade/components/ui";
import { CriarPost, type CriarPostRef } from "@/comunidade/components/criar-post";
import { CartaoRetidos, ListaPosts } from "@/comunidade/components/lista-posts";
import { hrefMembro } from "@/comunidade/lib/grupo-tipos";
import type { OrdemFeed, PostFeed } from "@/comunidade/lib/feed";
import { POSTS_POR_VEZ } from "@/comunidade/lib/feed-tipos";
import { maisPosts } from "@/comunidade/acoes/feed";
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

  // Levas seguintes ("ver mais" e rolagem). A primeira leva vem do servidor em
  // `posts` e pode ser renovada (curtir, comentar, publicar); as seguintes
  // ficam aqui e não se perdem nessa renovação. Trocar a ordem remonta o
  // componente (key na página) e zera tudo.
  const [extras, setExtras] = useState<PostFeed[]>([]);
  const [acabou, setAcabou] = useState(posts.length < POSTS_POR_VEZ);
  const [carregando, setCarregando] = useState(false);
  const [erroMais, setErroMais] = useState<string | null>(null);
  const [removidos, setRemovidos] = useState<ReadonlySet<string>>(() => new Set());
  const ocupado = useRef(false);
  const sentinela = useRef<HTMLDivElement>(null);

  // A primeira leva foi renovada: o que saiu dela (empurrado por um post novo)
  // passa para as levas seguintes, para nada sumir do meio da lista. Ajuste de
  // estado durante o render, sem effect.
  const [primeira, setPrimeira] = useState(posts);
  if (primeira !== posts) {
    const agora = new Set(posts.map((p) => p.id));
    const sairam = primeira.filter((p) => !agora.has(p.id) && !removidos.has(p.id));
    setPrimeira(posts);
    if (sairam.length > 0) {
      setExtras((atual) => {
        const tenho = new Set(atual.map((p) => p.id));
        return [...sairam.filter((p) => !tenho.has(p.id)), ...atual];
      });
    } else if (extras.length === 0) {
      // o grupo pode ter passado de uma leva enquanto a página estava aberta
      setAcabou(posts.length < POSTS_POR_VEZ);
    }
  }

  const naPrimeira = new Set(posts.map((p) => p.id));
  const lista = [...posts, ...extras.filter((p) => !naPrimeira.has(p.id))].filter((p) => !removidos.has(p.id));
  const total = lista.length;
  // a leva seguinte começa depois do último post mostrado (posição, não contagem)
  const ultimo = lista[lista.length - 1];
  const depoisValor = ultimo ? (ordem === "atividade" ? ultimo.ultima_atividade_em : ultimo.criado_em) : null;
  const depoisId = ultimo?.id ?? null;

  /** Post removido: sai da lista e da conta na hora. */
  const aoRemover = useCallback((id: string) => {
    setRemovidos((r) => new Set(r).add(id));
    setExtras((atual) => atual.filter((p) => p.id !== id));
  }, []);

  const carregarMais = useCallback(async () => {
    if (ocupado.current || !depoisValor || !depoisId) return;
    ocupado.current = true;
    setCarregando(true);
    setErroMais(null);
    try {
      const r = await maisPosts(ordem, { valor: depoisValor, id: depoisId });
      if (r.erro) setErroMais(r.erro);
      else {
        setExtras((atual) => {
          const tenho = new Set(atual.map((p) => p.id));
          return [...atual, ...r.posts.filter((p) => !tenho.has(p.id))];
        });
        setAcabou(r.acabou);
      }
    } catch {
      setErroMais("Não foi possível carregar mais posts. Tente de novo.");
    } finally {
      ocupado.current = false;
      setCarregando(false);
    }
  }, [ordem, depoisValor, depoisId]);

  // rolagem: chegando perto do fim da lista, busca a próxima leva sozinho
  useEffect(() => {
    const alvo = sentinela.current;
    if (!alvo || acabou || erroMais) return;
    const olho = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) void carregarMais();
      },
      { rootMargin: "600px 0px" },
    );
    olho.observe(alvo);
    return () => olho.disconnect();
  }, [acabou, erroMais, carregarMais]);
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
            <span>Fotos</span>
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
        <ListaPosts posts={lista} eu={eu} vazio="Ainda não há posts. Seja o primeiro a publicar." onRemovido={aoRemover} />
        {!acabou && (
          <div ref={sentinela} className="rc-feed-mais">
            {erroMais && (
              <p className="rc-erro-texto" role="alert">
                {erroMais}
              </p>
            )}
            <button type="button" className="rc-btn rc-btn-neutro rc-btn-bloco" onClick={() => void carregarMais()} disabled={carregando}>
              {carregando ? "Carregando…" : "Ver mais posts"}
            </button>
          </div>
        )}
        {acabou && total > POSTS_POR_VEZ && <p className="rc-feed-fim">Você chegou ao primeiro post do grupo.</p>}
      </div>
    </div>
  );
}
