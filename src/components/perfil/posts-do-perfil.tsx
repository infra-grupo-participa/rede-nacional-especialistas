"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { C, F, BORDA } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { tempoRelativo } from "@/lib/utils";
import type { PostFeed } from "@/lib/feed";

const LIMITE = 240;

/** Card de post enxuto para o histórico do perfil (leva ao post completo). */
function CardPostPerfil({ post }: { post: PostFeed }) {
  const hrefPost = `/post/${post.id}`;
  const longo = post.corpo.length > LIMITE;
  const corpo = longo ? post.corpo.slice(0, LIMITE).trimEnd() + "…" : post.corpo;

  return (
    <article className="card-hover overflow-hidden rounded-2xl" style={{ background: C.surface, border: BORDA }}>
      <div className="px-4 pt-3.5">
        <span className="block text-[12px]" style={{ color: C.muted }}>
          {tempoRelativo(post.criado_em)}
        </span>
        {post.titulo && (
          <Link href={hrefPost} className="mt-1 block text-[17px] leading-snug" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            {post.titulo}
          </Link>
        )}
        {post.corpo && (
          <p className="mt-1 whitespace-pre-wrap text-[14.5px] leading-relaxed" style={{ color: C.ink }}>
            {corpo}
            {longo && (
              <Link href={hrefPost} className="ml-1 font-semibold" style={{ color: C.petrolDeep }}>
                Ler mais
              </Link>
            )}
          </p>
        )}
      </div>

      {post.imagem_url && (
        <Link href={hrefPost} className="mt-3 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imagem_url} alt="" style={{ width: "100%", maxHeight: 360, objectFit: "cover", display: "block" }} />
        </Link>
      )}

      <div className="flex items-center gap-4 px-4 py-3 text-[13px]" style={{ color: C.muted }}>
        <span className="inline-flex items-center gap-1.5">
          <Ico.coracao style={{ width: 15, height: 15 }} /> {post.score}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Ico.balao style={{ width: 15, height: 15 }} /> {post.n_comentarios}
        </span>
        <Link href={hrefPost} className="ml-auto inline-flex items-center gap-1 font-semibold press" style={{ color: C.ink }}>
          Abrir <Ico.chevron style={{ width: 14, height: 14 }} />
        </Link>
      </div>
    </article>
  );
}

/** Histórico do perfil com abas Publicações / Mídia (estilo Twitter). */
export function PostsDoPerfil({
  posts,
  primeiroNome,
}: {
  posts: PostFeed[];
  primeiroNome: string;
}) {
  const [aba, setAba] = useState<"posts" | "midia">("posts");
  const midias = useMemo(() => posts.filter((p) => p.imagem_url), [posts]);

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl px-4 py-8 text-center" style={{ background: C.surface, border: BORDA }}>
        <p className="text-[14px]" style={{ color: C.muted }}>
          {primeiroNome} ainda não publicou nada.
        </p>
      </div>
    );
  }

  const abas: { id: "posts" | "midia"; rotulo: string; n: number }[] = [
    { id: "posts", rotulo: "Publicações", n: posts.length },
    { id: "midia", rotulo: "Mídia", n: midias.length },
  ];

  return (
    <div>
      {/* abas */}
      <div className="mb-3 flex gap-1 rounded-xl p-1" style={{ background: C.paper, border: BORDA }}>
        {abas.map((a) => {
          const ativo = aba === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className="press flex-1 rounded-lg py-2 text-[13.5px] font-semibold"
              style={{
                background: ativo ? C.surface : "transparent",
                color: ativo ? C.ink : C.muted,
                border: ativo ? BORDA : "1px solid transparent",
              }}
            >
              {a.rotulo} <span style={{ color: C.muted }}>· {a.n}</span>
            </button>
          );
        })}
      </div>

      {aba === "posts" ? (
        <div className="space-y-2.5">
          {posts.map((p) => (
            <CardPostPerfil key={p.id} post={p} />
          ))}
        </div>
      ) : midias.length === 0 ? (
        <div className="rounded-2xl px-4 py-8 text-center" style={{ background: C.surface, border: BORDA }}>
          <p className="text-[14px]" style={{ color: C.muted }}>Nenhuma mídia ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {midias.map((p) => (
            <Link key={p.id} href={`/post/${p.id}`} className="press block overflow-hidden rounded-xl" style={{ aspectRatio: "1 / 1", border: BORDA }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imagem_url} alt={p.titulo || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
