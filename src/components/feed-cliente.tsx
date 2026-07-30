"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { Avatar } from "@/components/atoms";
import { PostCard } from "@/components/post-card";
import { criarPost } from "@/app/feed/actions";
import type { PostFeed } from "@/lib/feed";

export interface SessaoFeed {
  perfilId: string | null;
  primeiroNome: string | null;
  nome: string | null;
  avatar: string | null;
  aprovado: boolean;
  isAdmin: boolean;
}

export function FeedCliente({
  postsIniciais,
  sessao,
}: {
  postsIniciais: PostFeed[];
  sessao: SessaoFeed;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const logado = Boolean(sessao.perfilId);

  const publicar = (e: React.FormEvent) => {
    e.preventDefault();
    const corpo = texto.trim();
    if (!corpo) return;
    setErro(null);
    start(async () => {
      const r = await criarPost(corpo);
      if (r.erro) {
        setErro(r.erro);
      } else {
        setTexto("");
        router.refresh(); // recarrega o server component com o novo post
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pb-20 pt-5">
      {/* composer */}
      {logado && sessao.aprovado ? (
        <form
          onSubmit={publicar}
          className="rounded-2xl p-4"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <div className="flex gap-3">
            <Avatar nome={sessao.nome ?? "?"} foto={sessao.avatar} size={40} />
            <div className="min-w-0 flex-1">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Compartilhe algo com a rede…"
                rows={3}
                className="w-full resize-none rounded-xl px-3 py-2.5 text-[15px] outline-none"
                style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }}
              />
              <div className="mt-2 flex items-center justify-between">
                {erro ? (
                  <span className="text-[12px]" style={{ color: "#B4342A" }}>
                    {erro}
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={pending || !texto.trim()}
                  className="rounded-xl px-4 text-[14px] font-semibold"
                  style={{
                    height: 40,
                    background: C.petrol,
                    color: "#fff",
                    opacity: pending || !texto.trim() ? 0.4 : 1,
                  }}
                >
                  Publicar
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : logado && !sessao.aprovado ? (
        <div
          className="rounded-2xl p-4 text-[14px]"
          style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.muted }}
        >
          Seu acesso está em aprovação pela coordenação. Assim que liberado, você poderá publicar.
        </div>
      ) : (
        <a
          href="/entrar"
          className="block rounded-2xl p-4 text-center text-[14px] font-semibold"
          style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}
        >
          Entre para publicar e participar da conversa
        </a>
      )}

      {/* lista */}
      <div className="mt-4 space-y-3">
        {postsIniciais.length === 0 ? (
          <p
            className="pt-8 text-center text-[15px]"
            style={{ color: C.sobreFundo, fontFamily: F.serif }}
          >
            Ainda não há posts. Seja o primeiro a publicar.
          </p>
        ) : (
          postsIniciais.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              logado={logado}
              souAutor={sessao.perfilId === p.autor.id}
              isAdmin={sessao.isAdmin}
              meuPerfilId={sessao.perfilId}
            />
          ))
        )}
      </div>
    </div>
  );
}
