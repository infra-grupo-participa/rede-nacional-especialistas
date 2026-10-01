"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { votar, apagarPost, fixarPost, travarComentarios } from "@/comunidade/acoes/feed";
import type { PostFeed } from "@/comunidade/lib/feed";

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
      window.location.href = "/comunidade/entrar";
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
      if (!r.erro) router.push("/comunidade");
    });
  };

  const compartilhar = async () => {
    const url = `${window.location.origin}/comunidade/post/${post.id}`;
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
        onClick={() => (semComentarInline ? router.push(`/comunidade/post/${post.id}`) : onComentar?.())}
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

      {isAdmin ? (
        <MenuModeracao post={post} onRemover={remover} />
      ) : (
        souAutor && (
          <button onClick={remover} disabled={pending} aria-label="Remover post" className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, color: C.muted }}>
            <Ico.lixo style={{ width: 15, height: 15 }} />
          </button>
        )
      )}
    </div>
  );
}

/* Menu da coordenação no post: fixar em destaque, travar/liberar comentários
   (com motivo) e remover. Cada ação cai no registro de atividades do banco. */
function MenuModeracao({ post, onRemover }: { post: PostFeed; onRemover: () => void }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const executar = (fn: () => Promise<{ erro?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.erro) setErro(r.erro);
      else {
        setAberto(false);
        router.refresh();
      }
    });

  const alternarTrava = () => {
    if (post.comentarios_travados) {
      executar(() => travarComentarios(post.id, false));
      return;
    }
    const motivo = prompt("Motivo da trava (aparece para os membros). Pode deixar em branco.", "Post fora da regra da #.");
    if (motivo === null) return;
    executar(() => travarComentarios(post.id, true, motivo));
  };

  const item = "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] font-semibold";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Moderação"
        aria-expanded={aberto}
        className="flex items-center justify-center rounded-full"
        style={{ width: 34, height: 34, color: C.muted }}
      >
        <Ico.escudo style={{ width: 16, height: 16 }} />
      </button>
      {aberto && (
        <div
          role="menu"
          className="anim-fade absolute bottom-10 right-0 z-30 w-60 overflow-hidden rounded-2xl"
          style={{ background: C.surface, border: BORDA, boxShadow: "0 16px 40px rgba(17,17,17,.16)" }}
        >
          <p className="px-3.5 pb-1 pt-2.5 text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".12em" }}>
            Moderação
          </p>
          <button role="menuitem" disabled={pending} onClick={() => executar(() => fixarPost(post.id, !post.fixado))} className={item} style={{ color: C.ink }}>
            <Ico.pin style={{ width: 16, height: 16, color: C.muted }} />
            {post.fixado ? "Tirar do destaque" : "Fixar em destaque"}
          </button>
          <button role="menuitem" disabled={pending} onClick={alternarTrava} className={item} style={{ color: C.ink }}>
            <Ico.balao style={{ width: 16, height: 16, color: C.muted }} />
            {post.comentarios_travados ? "Liberar comentários" : "Travar comentários"}
          </button>
          <div style={{ borderTop: BORDA }} />
          <button role="menuitem" disabled={pending} onClick={onRemover} className={item} style={{ color: "#B24A42" }}>
            <Ico.lixo style={{ width: 16, height: 16 }} />
            Remover post
          </button>
          {erro && (
            <p className="px-3.5 pb-2.5 text-[12px]" style={{ color: "#B24A42" }}>
              {erro}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
