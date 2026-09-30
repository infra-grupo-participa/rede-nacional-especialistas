"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Avatar, TagNivel } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { tempoRelativo } from "@/lib/utils";
import { moderarPost } from "@/app/feed/actions";
import { adicionarPalavra, removerPalavra } from "@/app/coordenacao/actions";
import type { PalavraModeracao, PostRetido } from "@/lib/gestao";

export function CartaoRetido({ post, decidido }: { post: PostRetido; decidido?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const decidir = (d: "publicado" | "recusado") =>
    start(async () => {
      const r = await moderarPost(post.id, d);
      if (r.erro) setErro(r.erro);
      else router.refresh();
    });

  return (
    <li className="rounded-2xl p-4" style={{ background: C.surface, border: BORDA }}>
      <div className="flex items-center gap-2.5">
        <Avatar nome={post.autor.nome} foto={post.autor.avatar_url} size={36} />
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <Link href={`/especialista/${post.autor.slug ?? post.autor.id}`} target="_blank" className="truncate text-[14px] font-semibold">
              {post.autor.nome}
            </Link>
            <TagNivel qualificacao={post.autor.qualificacao} size="sm" />
          </span>
          <span className="text-[12px]" style={{ color: C.muted }}>
            {tempoRelativo(post.criado_em)}
          </span>
        </div>
      </div>
      {post.titulo && (
        <p className="mt-3 text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
          {post.titulo}
        </p>
      )}
      <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed">{post.corpo}</p>
      {post.imagem_url && post.imagem_url.trim().length > 1 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imagem_url} alt="" className="mt-2 rounded-xl" style={{ maxHeight: 220, objectFit: "cover" }} />
      )}
      {post.retido_por.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]" style={{ color: C.muted }}>
          Retido por:
          {post.retido_por.map((t) => (
            <span key={t} className="rounded-full px-2 py-0.5 font-semibold" style={{ background: "#FBEDEC", color: "#A33F37" }}>
              {t}
            </span>
          ))}
        </p>
      )}
      {!decidido ? (
        <div className="mt-3 flex gap-2">
          <button onClick={() => decidir("publicado")} disabled={pending} className="press rounded-full px-5 text-[14px] font-semibold" style={{ height: 40, background: C.laranja, color: C.ink }}>
            Aprovar e publicar
          </button>
          <button onClick={() => decidir("recusado")} disabled={pending} className="press rounded-full px-4 text-[14px] font-semibold" style={{ height: 40, border: "1px solid #B24A42", color: "#B24A42" }}>
            Recusar
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <button onClick={() => decidir("publicado")} disabled={pending} className="press rounded-full px-4 text-[13px] font-semibold" style={{ height: 36, border: BORDA }}>
            Publicar mesmo assim
          </button>
        </div>
      )}
      {erro && (
        <p className="mt-2 text-[13px]" style={{ color: "#B24A42" }}>
          {erro}
        </p>
      )}
    </li>
  );
}

/* Palavras-chave que mandam o post para aprovação (casamento por palavra
   inteira, sem acento e sem caixa). A lista é fechada: membro não enxerga. */
export function ListaPalavras({ palavras }: { palavras: PalavraModeracao[] }) {
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const adicionar = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      setErro(null);
      const r = await adicionarPalavra(termo);
      if (r.erro) setErro(r.erro);
      else {
        setTermo("");
        router.refresh();
      }
    });
  };

  const remover = (id: string) =>
    start(async () => {
      const r = await removerPalavra(id);
      if (r.erro) setErro(r.erro);
      else router.refresh();
    });

  return (
    <div>
      <form onSubmit={adicionar} className="flex gap-2">
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Palavra ou expressão (ex.: pix, curso grátis)"
          maxLength={80}
          className="min-w-0 flex-1 rounded-xl px-3 text-[14px] outline-none"
          style={{ height: 42, background: C.paper, border: BORDA, color: C.ink }}
        />
        <button type="submit" disabled={pending || termo.trim().length < 2} className="press rounded-full px-4 text-[14px] font-semibold" style={{ height: 42, background: C.ink, color: C.fundo, opacity: termo.trim().length < 2 ? 0.4 : 1 }}>
          Adicionar
        </button>
      </form>
      {erro && (
        <p className="mt-2 text-[13px]" style={{ color: "#B24A42" }}>
          {erro}
        </p>
      )}
      {palavras.length === 0 ? (
        <p className="mt-3 text-[13px]" style={{ color: C.muted }}>
          Nenhuma palavra cadastrada. Sem lista, nenhum post é retido.
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {palavras.map((p) => (
            <li key={p.id} className="flex items-center gap-1 rounded-full pl-3 pr-1 text-[13px] font-semibold" style={{ height: 32, background: C.paper, border: BORDA }}>
              {p.termo}
              <button onClick={() => remover(p.id)} disabled={pending} aria-label={`Remover ${p.termo}`} className="flex items-center justify-center rounded-full" style={{ width: 26, height: 26, color: C.muted }}>
                <Ico.x style={{ width: 13, height: 13 }} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
