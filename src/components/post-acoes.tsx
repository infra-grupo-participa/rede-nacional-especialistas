"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { votar, apagarPost } from "@/app/feed/actions";
import type { PostFeed } from "@/lib/feed";

/* Barra de ações do post (curtir/score, comentar, compartilhar). Reusada no card
   do feed e na página do post. `onComentar` alterna os comentários no card; na
   página do post os comentários já ficam abertos (semComentarInline). */
export function PostAcoes({
  post,
  logado,
  souAutor,
  isAdmin,
  onComentar,
  semComentarInline,
}: {
  post: PostFeed;
  logado: boolean;
  souAutor: boolean;
  isAdmin: boolean;
  onComentar?: () => void;
  semComentarInline?: boolean;
}) {
  const router = useRouter();
  const [meuVoto, setMeuVoto] = useState(post.meu_voto);
  const [score, setScore] = useState(post.score);
  const [copiado, setCopiado] = useState(false);
  const [pending, start] = useTransition();

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
      if (!r.erro) router.push("/feed");
    });
  };

  const compartilhar = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* silencioso */
    }
  };

  return (
    <div className="flex items-center gap-1 py-2.5" style={{ borderTop: `1px solid ${C.line}` }}>
      <div className="flex items-center rounded-full" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
        <button onClick={() => aplicarVoto(1)} disabled={pending} aria-label="Curtir" className="flex items-center justify-center rounded-full" style={{ width: 36, height: 34, color: meuVoto === 1 ? C.laranja : C.muted }}>
          <Ico.setaCima style={{ width: 17, height: 17 }} />
        </button>
        <span className="min-w-[20px] text-center text-[13px] font-bold tabular-nums" style={{ fontFamily: F.mono, color: meuVoto !== 0 ? C.ink : C.muted }}>
          {score}
        </span>
        <button onClick={() => aplicarVoto(-1)} disabled={pending} aria-label="Descurtir" className="flex items-center justify-center rounded-full" style={{ width: 36, height: 34, color: meuVoto === -1 ? C.ink : C.muted }}>
          <Ico.setaBaixo style={{ width: 17, height: 17 }} />
        </button>
      </div>

      <button
        onClick={() => (semComentarInline ? router.push(`/post/${post.id}`) : onComentar?.())}
        className="press ml-1 flex items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold"
        style={{ height: 36, color: C.muted }}
      >
        <Ico.balao style={{ width: 16, height: 16 }} />
        {post.n_comentarios > 0 ? post.n_comentarios : "Comentar"}
      </button>

      <button onClick={compartilhar} className="press ml-auto flex items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold" style={{ height: 36, color: copiado ? C.petrolDeep : C.muted }}>
        <Ico.share style={{ width: 15, height: 15 }} />
        {copiado ? "Copiado" : "Compartilhar"}
      </button>

      {(souAutor || isAdmin) && (
        <button onClick={remover} disabled={pending} aria-label="Remover post" className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, color: C.muted }}>
          <Ico.lixo style={{ width: 15, height: 15 }} />
        </button>
      )}
    </div>
  );
}
