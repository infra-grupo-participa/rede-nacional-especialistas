"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Avatar } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { CampoImagem } from "@/components/artigo/campo-imagem";
import { RankingAutores } from "@/components/ranking-autores";
import { criarPost } from "@/app/feed/actions";
import type { PostFeed } from "@/lib/feed";
import type { AutorRanking } from "@/lib/queries";

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
  ranking,
  sessao,
}: {
  postsIniciais: PostFeed[];
  ranking: AutorRanking[];
  sessao: SessaoFeed;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [imagem, setImagem] = useState("");
  const logado = Boolean(sessao.perfilId);
  // abre o composer já montado quando vier de "Publicar → Post no feed" (?compor=1)
  const [aberto, setAberto] = useState(() => params.get("compor") === "1" && logado && sessao.aprovado);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // rola até o composer quando abre via atalho (sem setState no effect)
  useEffect(() => {
    if (aberto && params.get("compor") === "1") {
      document.getElementById("composer-feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publicar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corpo.trim() && !imagem && !titulo.trim()) return;
    setErro(null);
    start(async () => {
      const r = await criarPost({ titulo, corpo: corpo.trim(), imagem_url: imagem });
      if (r.erro) setErro(r.erro);
      else {
        setTitulo("");
        setCorpo("");
        setImagem("");
        setAberto(false);
        router.refresh();
      }
    });
  };

  const composer =
    logado && sessao.aprovado ? (
      <form id="composer-feed" onSubmit={publicar} className="rounded-2xl p-4" style={{ background: C.surface, border: BORDA }}>
        <div className="flex gap-3">
          <Avatar nome={sessao.nome ?? "?"} foto={sessao.avatar} size={40} />
          <div className="min-w-0 flex-1">
            {aberto && (
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título (opcional)"
                className="mb-2 w-full rounded-xl px-3 text-[15px] font-semibold outline-none"
                style={{ height: 44, background: C.paper, border: BORDA, color: C.ink, fontFamily: F.serif }}
              />
            )}
            <textarea
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              onFocus={() => setAberto(true)}
              placeholder="Compartilhe algo com a rede…"
              rows={aberto ? 3 : 1}
              className="w-full resize-none rounded-xl px-3 py-2.5 text-[15px] outline-none"
              style={{ background: C.paper, border: BORDA, color: C.ink }}
            />

            {aberto && imagem && (
              <div className="mt-2">
                <CampoImagem tipo="bloco" valor={imagem} onMudar={setImagem} />
              </div>
            )}

            <div className="mt-2 flex items-center justify-between">
              {aberto && !imagem ? (
                <button
                  type="button"
                  onClick={() => setImagem(" ")}
                  className="press flex items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold"
                  style={{ height: 36, color: C.petrolDeep, background: C.petrolSoft }}
                >
                  <Ico.mais style={{ width: 15, height: 15 }} /> Imagem
                </button>
              ) : (
                <span className="text-[12px]" style={{ color: erro ? "#B4342A" : "transparent" }}>
                  {erro || "."}
                </span>
              )}
              <button
                type="submit"
                disabled={pending || (!corpo.trim() && !titulo.trim() && imagem.trim().length <= 1)}
                className="press rounded-full px-5 text-[14px] font-semibold"
                style={{
                  height: 40,
                  background: C.laranja,
                  color: C.ink,
                  opacity: pending || (!corpo.trim() && !titulo.trim() && imagem.trim().length <= 1) ? 0.4 : 1,
                }}
              >
                {pending ? "Publicando…" : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      </form>
    ) : logado && !sessao.aprovado ? (
      <div className="rounded-2xl p-4 text-[14px]" style={{ background: C.surface, border: BORDA, color: C.muted }}>
        Seu acesso está em aprovação pela coordenação. Assim que liberado, você poderá publicar.
      </div>
    ) : (
      <a href="/entrar" className="press block rounded-2xl p-4 text-center text-[14px] font-semibold" style={{ background: C.surface, border: BORDA, color: C.ink }}>
        Entre para publicar e participar da conversa
      </a>
    );

  const lista =
    postsIniciais.length === 0 ? (
      <p className="pt-8 text-center text-[15px]" style={{ color: C.sobreFundo, fontFamily: F.serif }}>
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
    );

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-5">
      <div className="flex gap-6">
        {/* coluna do feed */}
        <div className="min-w-0 flex-1">
          {composer}
          <div className="mt-4 space-y-3">{lista}</div>
        </div>

        {/* ranking (lateral no desktop) */}
        {ranking.length > 0 && (
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-4">
              <RankingAutores autores={ranking} />
            </div>
          </aside>
        )}
      </div>

      {/* ranking no mobile: abaixo do feed */}
      {ranking.length > 0 && (
        <div className="mt-6 lg:hidden">
          <RankingAutores autores={ranking} />
        </div>
      )}
    </div>
  );
}
