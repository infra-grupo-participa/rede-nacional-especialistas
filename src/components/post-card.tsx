"use client";

import { useState } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Avatar } from "@/components/atoms";
import { tempoRelativo } from "@/lib/utils";
import { Comentarios } from "@/components/comentarios";
import { PostAcoes } from "@/components/post-acoes";
import type { PostFeed } from "@/lib/feed";

const LIMITE = 280; // corpo acima disso ganha "Ler mais"

export function PostCard({
  post,
  logado,
  souAutor,
  isAdmin,
  meuPerfilId,
}: {
  post: PostFeed;
  logado: boolean;
  souAutor: boolean;
  isAdmin: boolean;
  meuPerfilId: string | null;
}) {
  const [abertoComent, setAbertoComent] = useState(false);
  const [expandido, setExpandido] = useState(false);

  const href = `/especialista/${post.autor.slug ?? post.autor.id}`;
  const hrefPost = `/post/${post.id}`;
  const subtitulo = post.autor.headline || post.autor.profissao || "";
  const longo = post.corpo.length > LIMITE;
  const corpoMostrado = !expandido && longo ? post.corpo.slice(0, LIMITE).trimEnd() + "…" : post.corpo;

  return (
    <article id={`post-${post.id}`} className="card-hover overflow-hidden rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      {/* cabeçalho */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <Link href={href} className="shrink-0">
          <Avatar nome={post.autor.nome} foto={post.autor.avatar_url} size={44} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={href} className="block truncate text-[15px] leading-tight" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            {post.autor.nome}
          </Link>
          <span className="block truncate text-[12px]" style={{ color: C.muted }}>
            {subtitulo && `${subtitulo} · `}
            {tempoRelativo(post.criado_em)}
          </span>
        </div>
      </div>

      {/* título + corpo (com "Ler mais") */}
      <div className="px-4 pt-2.5">
        {post.titulo && (
          <Link href={hrefPost} className="mb-1 block text-[18px] leading-snug" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            {post.titulo}
          </Link>
        )}
        {post.corpo && (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed" style={{ color: C.ink }}>
            {corpoMostrado}
            {longo && !expandido && (
              <button onClick={() => setExpandido(true)} className="ml-1 font-semibold" style={{ color: C.petrolDeep }}>
                Ler mais
              </button>
            )}
          </p>
        )}
      </div>

      {post.imagem_url && (
        <Link href={hrefPost} className="mt-3 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imagem_url} alt="" style={{ width: "100%", maxHeight: 420, objectFit: "cover", display: "block" }} />
        </Link>
      )}

      <div className="px-3" style={{ marginTop: post.imagem_url ? 0 : 12 }}>
        <PostAcoes
          post={post}
          logado={logado}
          souAutor={souAutor}
          isAdmin={isAdmin}
          onComentar={() => setAbertoComent((v) => !v)}
        />
      </div>

      {abertoComent && (
        <div className="px-4 pb-3">
          <Comentarios postId={post.id} logado={logado} isAdmin={isAdmin} meuPerfilId={meuPerfilId} />
        </div>
      )}
    </article>
  );
}
