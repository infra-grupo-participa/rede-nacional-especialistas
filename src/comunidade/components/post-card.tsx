"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Avatar, TagNivel, SeloVerificado } from "@/comunidade/components/atoms";
import { IcoRC } from "@/comunidade/components/icones";
import { Comentarios, TextoCortado, type ComentariosRef } from "@/comunidade/components/comentarios";
import { MenuPost, PostAcoes } from "@/comunidade/components/post-acoes";
import { hrefMembro } from "@/comunidade/lib/grupo-tipos";
import { tempoRelativo } from "@/lib/utils";
import type { ComentarioFeed, PostFeed } from "@/comunidade/lib/feed";
import type { Eu } from "@/comunidade/lib/sessao";

/* Cartão do post, como no grupo do Facebook: quem escreveu e há quanto tempo,
   o menu "…", o texto (com hashtags e "Ver mais"), a foto, a linha de curtir,
   comentar e compartilhar, a prévia do último comentário e o campo de comentar.
   Na página do post (`pagina`) o texto vem inteiro e os comentários, abertos. */
export function PostCard({
  post,
  eu,
  pagina = false,
  comentarios,
}: {
  post: PostFeed;
  eu: Eu;
  /** página do post: sem corte no texto e com os comentários já abertos */
  pagina?: boolean;
  /** comentários já lidos no servidor (página do post) */
  comentarios?: ComentarioFeed[];
}) {
  const refComentarios = useRef<ComentariosRef>(null);
  const [nComentarios, setNComentarios] = useState(post.n_comentarios);
  const [removido, setRemovido] = useState(false);
  if (removido) return null;

  const hrefAutor = hrefMembro(post.autor);
  const hrefPost = `/comunidade/post/${post.id}`;

  return (
    <article id={`post-${post.id}`} className="rc-cartao rc-post">
      <header className="rc-post-topo">
        <Link href={hrefAutor} className="rc-post-avatar" aria-label={`Perfil de ${post.autor.nome}`}>
          <Avatar nome={post.autor.nome} foto={post.autor.avatar_url} size={40} />
        </Link>
        <div className="rc-post-quem">
          <span className="rc-post-nome-linha">
            <Link href={hrefAutor} className="rc-post-nome">
              {post.autor.nome}
            </Link>
            {post.autor.verificado && <SeloVerificado size="sm" />}
            <TagNivel qualificacao={post.autor.qualificacao} size="sm" />
          </span>
          <span className="rc-post-meta">
            <Link href={hrefPost} suppressHydrationWarning>
              {tempoRelativo(post.criado_em)}
            </Link>
            {post.fixado && (
              <span className="rc-post-fixado">
                · <IcoRC.pin /> Fixado
              </span>
            )}
          </span>
        </div>
        <MenuPost post={post} eu={eu} onRemovido={() => setRemovido(true)} />
      </header>

      {(post.titulo || post.corpo) && (
        <div className="rc-post-corpo">
          {post.titulo &&
            (pagina ? (
              <h1 className="rc-post-titulo">{post.titulo}</h1>
            ) : (
              <h2 className="rc-post-titulo">
                <Link href={hrefPost}>{post.titulo}</Link>
              </h2>
            ))}
          {post.corpo && <TextoCortado texto={post.corpo} linhas={5} semCorte={pagina} className="rc-post-texto" />}
        </div>
      )}

      {post.imagem_url &&
        (pagina ? (
          <a href={post.imagem_url} target="_blank" rel="noopener noreferrer" className="rc-post-imagem" data-inteira aria-label="Abrir a foto em tamanho real">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imagem_url} alt="" />
          </a>
        ) : (
          <Link href={hrefPost} className="rc-post-imagem" aria-label="Abrir o post">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imagem_url} alt="" loading="lazy" />
          </Link>
        ))}

      <PostAcoes post={post} nComentarios={nComentarios} onComentar={() => refComentarios.current?.comentar()} />

      <Comentarios
        ref={refComentarios}
        postId={post.id}
        eu={eu}
        total={post.n_comentarios}
        previa={post.previa ?? null}
        iniciais={comentarios}
        abertoInicial={pagina}
        travado={post.comentarios_travados}
        motivoTrava={post.travado_motivo}
        onTotal={setNComentarios}
      />
    </article>
  );
}
