"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Avatar } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { CampoImagem } from "@/components/artigo/campo-imagem";
import { RankingAutores } from "@/components/ranking-autores";
import { criarPost } from "@/app/feed/actions";
import type { OrdemFeed, PostFeed } from "@/lib/feed";
import { tempoRelativo } from "@/lib/utils";
import type { AutorRanking } from "@/lib/queries";

export interface SessaoFeed {
  perfilId: string | null;
  primeiroNome: string | null;
  nome: string | null;
  avatar: string | null;
  aprovado: boolean;
  isAdmin: boolean;
}

const ABAS_ORDEM: { id: OrdemFeed; rotulo: string; dica: string }[] = [
  { id: "novos", rotulo: "Novos posts", dica: "na ordem em que foram publicados" },
  { id: "atividade", rotulo: "Atividade recente", dica: "sobem quando alguém comenta" },
];

export function FeedCliente({
  postsIniciais,
  fixados = [],
  ordem = "novos",
  ranking,
  sessao,
  hashtags = [],
  exigirHashtag = false,
  retidos = [],
}: {
  postsIniciais: PostFeed[];
  fixados?: PostFeed[];
  ordem?: OrdemFeed;
  ranking: AutorRanking[];
  sessao: SessaoFeed;
  hashtags?: string[];
  exigirHashtag?: boolean;
  retidos?: { id: string; titulo: string; corpo: string; criado_em: string }[];
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
  const [aviso, setAviso] = useState<string | null>(null);
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
    setAviso(null);
    start(async () => {
      const r = await criarPost({ titulo, corpo: corpo.trim(), imagem_url: imagem });
      if (r.erro) setErro(r.erro);
      else {
        setTitulo("");
        setCorpo("");
        setImagem("");
        setAberto(false);
        setAviso(r.aviso ?? null);
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

            {aberto && (hashtags.length > 0 || exigirHashtag) && (
              <p className="mt-1.5 text-[12px] leading-snug" style={{ color: C.muted }}>
                {exigirHashtag ? "Regra da #: comece com a hashtag do tema" : "Use a hashtag do tema"}
                {hashtags.length > 0 && (
                  <>
                    {": "}
                    {hashtags.map((h, i) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setCorpo((c) => (c.includes(`#${h}`) ? c : `#${h} ${c}`))}
                        className="font-semibold"
                        style={{ color: C.petrolDeep }}
                      >
                        #{h}
                        {i < hashtags.length - 1 ? " " : ""}
                      </button>
                    ))}
                  </>
                )}
                {exigirHashtag && ". Sem ela, os comentários ficam travados."}
              </p>
            )}

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

  const card = (p: PostFeed) => (
    <PostCard
      key={p.id}
      post={p}
      logado={logado}
      souAutor={sessao.perfilId === p.autor.id}
      isAdmin={sessao.isAdmin}
      meuPerfilId={sessao.perfilId}
    />
  );

  const lista =
    postsIniciais.length === 0 ? (
      <p className="pt-8 text-center text-[15px]" style={{ color: C.sobreFundo, fontFamily: F.serif }}>
        Ainda não há posts. Seja o primeiro a publicar.
      </p>
    ) : (
      postsIniciais.map(card)
    );

  const abas = (
    <div className="mt-4 flex items-center gap-2" role="tablist" aria-label="Ordenar o feed">
      {ABAS_ORDEM.map((a) => {
        const on = a.id === ordem;
        return (
          <Link
            key={a.id}
            href={a.id === "novos" ? "/feed" : `/feed?ordem=${a.id}`}
            role="tab"
            aria-selected={on}
            scroll={false}
            className="press rounded-full px-4 text-[14px] font-semibold"
            style={{
              height: 38,
              lineHeight: "38px",
              background: on ? C.ink : C.surface,
              color: on ? C.fundo : C.ink,
              border: `1px solid ${on ? C.ink : C.line}`,
            }}
          >
            {a.rotulo}
          </Link>
        );
      })}
      <span className="ml-1 hidden text-[12px] sm:inline" style={{ color: C.muted }}>
        {ABAS_ORDEM.find((a) => a.id === ordem)?.dica}
      </span>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-5">
      <div className="flex gap-6">
        {/* coluna do feed */}
        <div className="min-w-0 flex-1">
          {composer}

          {aviso && (
            <div className="mt-3 rounded-2xl p-3.5 text-[14px]" role="status" style={{ background: C.petrolSoft, color: C.ink, border: BORDA }}>
              {aviso}
            </div>
          )}

          {retidos.length > 0 && (
            <div className="mt-3 rounded-2xl p-3.5" style={{ background: C.surface, border: BORDA }}>
              <p className="text-[13px] font-semibold" style={{ color: C.ink }}>
                {retidos.length === 1 ? "1 post seu aguarda a moderação" : `${retidos.length} posts seus aguardam a moderação`}
              </p>
              <ul className="mt-1 space-y-0.5">
                {retidos.map((r) => (
                  <li key={r.id} className="truncate text-[13px]" style={{ color: C.muted }}>
                    {tempoRelativo(r.criado_em)} · {r.titulo || r.corpo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {fixados.length > 0 && (
            <section className="mt-4" aria-label="Posts em destaque">
              <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".12em" }}>
                <Ico.pin style={{ width: 14, height: 14 }} /> Em destaque
              </p>
              <div className="space-y-3">{fixados.map(card)}</div>
            </section>
          )}

          {abas}
          <div className="mt-3 space-y-3">{lista}</div>
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
