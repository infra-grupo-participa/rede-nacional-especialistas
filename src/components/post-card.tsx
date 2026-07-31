"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Avatar } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { tempoRelativo } from "@/lib/utils";
import { votar, apagarPost } from "@/app/feed/actions";
import { Comentarios } from "@/components/comentarios";
import type { PostFeed } from "@/lib/feed";

/* Card de post — cara de rede social: cabeçalho (avatar/nome/headline/tempo),
   título opcional, corpo, imagem opcional, e barra de ações (upvote/score/
   downvote · comentar · compartilhar). */
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
  const [meuVoto, setMeuVoto] = useState(post.meu_voto);
  const [score, setScore] = useState(post.score);
  const [abertoComent, setAbertoComent] = useState(false);
  const [removido, setRemovido] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [pending, start] = useTransition();

  if (removido) return null;

  const aplicarVoto = (valor: 1 | -1) => {
    if (!logado) {
      window.location.href = "/entrar";
      return;
    }
    const anterior = meuVoto;
    const novo = anterior === valor ? 0 : valor;
    setMeuVoto(novo);
    setScore((s) => s - anterior + novo);
    start(async () => {
      const r = await votar(post.id, valor);
      if (r.erro) {
        setMeuVoto(anterior);
        setScore((s) => s - novo + anterior);
      }
    });
  };

  const remover = () => {
    if (!confirm("Remover este post?")) return;
    start(async () => {
      const r = await apagarPost(post.id);
      if (!r.erro) setRemovido(true);
    });
  };

  const compartilhar = async () => {
    const url = `${window.location.origin}/feed#post-${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* silencioso */
    }
  };

  const href = `/especialista/${post.autor.slug ?? post.autor.id}`;
  const subtitulo = post.autor.headline || post.autor.profissao || "";

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
        {(souAutor || isAdmin) && (
          <button onClick={remover} disabled={pending} aria-label="Remover post" className="shrink-0" style={{ color: C.muted }}>
            <Ico.lixo style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>

      {/* título + corpo */}
      <div className="px-4 pt-2.5">
        {post.titulo && (
          <h3 className="mb-1 text-[18px] leading-snug" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            {post.titulo}
          </h3>
        )}
        {post.corpo && (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed" style={{ color: C.ink }}>
            {post.corpo}
          </p>
        )}
      </div>

      {/* imagem */}
      {post.imagem_url && (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imagem_url} alt="" style={{ width: "100%", maxHeight: 420, objectFit: "cover", display: "block" }} />
        </div>
      )}

      {/* barra de ações */}
      <div className="flex items-center gap-1 px-3 py-2.5" style={{ borderTop: `1px solid ${C.line}`, marginTop: post.imagem_url ? 0 : 12 }}>
        {/* voto */}
        <div className="flex items-center rounded-full" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
          <button
            onClick={() => aplicarVoto(1)}
            disabled={pending}
            aria-label="Curtir"
            className="flex items-center justify-center rounded-full"
            style={{ width: 36, height: 34, color: meuVoto === 1 ? C.laranja : C.muted }}
          >
            <Ico.setaCima style={{ width: 17, height: 17 }} />
          </button>
          <span className="min-w-[20px] text-center text-[13px] font-bold tabular-nums" style={{ fontFamily: F.mono, color: meuVoto !== 0 ? C.ink : C.muted }}>
            {score}
          </span>
          <button
            onClick={() => aplicarVoto(-1)}
            disabled={pending}
            aria-label="Descurtir"
            className="flex items-center justify-center rounded-full"
            style={{ width: 36, height: 34, color: meuVoto === -1 ? C.ink : C.muted }}
          >
            <Ico.setaBaixo style={{ width: 17, height: 17 }} />
          </button>
        </div>

        {/* comentar */}
        <button
          onClick={() => setAbertoComent((v) => !v)}
          className="press ml-1 flex items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold"
          style={{ height: 36, color: C.muted }}
        >
          <Ico.balao style={{ width: 16, height: 16 }} />
          {post.n_comentarios > 0 ? post.n_comentarios : "Comentar"}
        </button>

        {/* compartilhar */}
        <button
          onClick={compartilhar}
          className="press ml-auto flex items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold"
          style={{ height: 36, color: copiado ? C.petrolDeep : C.muted }}
        >
          <Ico.share style={{ width: 15, height: 15 }} />
          {copiado ? "Copiado" : "Compartilhar"}
        </button>
      </div>

      {abertoComent && (
        <div className="px-4 pb-3">
          <Comentarios postId={post.id} logado={logado} isAdmin={isAdmin} meuPerfilId={meuPerfilId} />
        </div>
      )}
    </article>
  );
}
