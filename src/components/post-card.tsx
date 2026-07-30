"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Avatar, TagNivel } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { tempoRelativo } from "@/lib/utils";
import { votar, apagarPost } from "@/app/feed/actions";
import { Comentarios } from "@/components/comentarios";
import type { PostFeed } from "@/lib/feed";

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
  const [pending, start] = useTransition();

  if (removido) return null;

  const aplicarVoto = (valor: 1 | -1) => {
    if (!logado) {
      window.location.href = "/entrar";
      return;
    }
    // otimista: ajusta score e destaque no cliente
    const anterior = meuVoto;
    const novo = anterior === valor ? 0 : valor;
    setMeuVoto(novo);
    setScore((s) => s - anterior + novo);
    start(async () => {
      const r = await votar(post.id, valor);
      if (r.erro) {
        // reverte
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

  const nomeCurto = post.autor.nome;
  const href = `/especialista/${post.autor.slug ?? post.autor.id}`;

  return (
    <article
      className="rounded-2xl p-4"
      style={{ background: C.surface, border: `1px solid ${C.line}` }}
    >
      <div className="flex gap-3">
        {/* coluna de voto */}
        <div className="flex flex-col items-center gap-0.5 pt-0.5" style={{ width: 40 }}>
          <button
            onClick={() => aplicarVoto(1)}
            disabled={pending}
            aria-label="Votar a favor"
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{
              width: 32,
              height: 28,
              background: meuVoto === 1 ? C.fundo : C.paper,
              color: C.ink,
            }}
          >
            <Ico.cima style={{ width: 16, height: 16 }} />
          </button>
          <span
            className="text-[14px] font-bold tabular-nums"
            style={{ fontFamily: F.mono, color: C.ink }}
          >
            {score}
          </span>
          <button
            onClick={() => aplicarVoto(-1)}
            disabled={pending}
            aria-label="Votar contra"
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{
              width: 32,
              height: 28,
              background: meuVoto === -1 ? C.line : C.paper,
              color: C.ink,
            }}
          >
            <Ico.baixo style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* conteúdo */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={href} className="flex min-w-0 items-center gap-2">
              <Avatar nome={nomeCurto} foto={post.autor.avatar_url} size={28} />
              <span
                className="truncate text-[14px]"
                style={{ color: C.ink, fontFamily: F.serif }}
              >
                {nomeCurto}
              </span>
              <TagNivel qualificacao={post.autor.qualificacao} size="sm" />
            </Link>
            <span className="text-[12px]" style={{ color: C.muted }}>
              · {tempoRelativo(post.criado_em)}
            </span>
            {(souAutor || isAdmin) && (
              <button
                onClick={remover}
                disabled={pending}
                aria-label="Remover post"
                className="ml-auto"
                style={{ color: C.muted }}
              >
                <Ico.lixo style={{ width: 15, height: 15 }} />
              </button>
            )}
          </div>

          <p
            className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed"
            style={{ color: C.ink }}
          >
            {post.corpo}
          </p>

          <button
            onClick={() => setAbertoComent((v) => !v)}
            className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold"
            style={{ color: C.muted }}
          >
            <Ico.balao style={{ width: 15, height: 15 }} />
            {post.n_comentarios > 0
              ? `${post.n_comentarios} ${post.n_comentarios === 1 ? "comentário" : "comentários"}`
              : "Comentar"}
          </button>

          {abertoComent && (
            <Comentarios
              postId={post.id}
              logado={logado}
              isAdmin={isAdmin}
              meuPerfilId={meuPerfilId}
            />
          )}
        </div>
      </div>
    </article>
  );
}
