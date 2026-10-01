"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Avatar, TagNivel } from "@/components/atoms";
import { createClient } from "@/lib/supabase/browser";
import { tempoRelativo } from "@/lib/utils";
import { criarComentario, apagarComentario } from "@/app/feed/actions";
import { Ico } from "@/components/icons";
import type { ComentarioFeed } from "@/lib/feed";
import type { Qualificacao } from "@/lib/qualificacoes";

const CAMPOS_AUTOR = "id, slug, nome, avatar_url, qualificacao";

export function Comentarios({
  postId,
  logado,
  isAdmin,
  meuPerfilId,
}: {
  postId: string;
  logado: boolean;
  isAdmin: boolean;
  meuPerfilId: string | null;
}) {
  const [lista, setLista] = useState<ComentarioFeed[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const supabaseRef = useRef(createClient());

  // carga inicial + realtime
  useEffect(() => {
    const supabase = supabaseRef.current;
    let ativo = true;

    async function carregar() {
      const { data } = await supabase
        .from("comentarios")
        .select(`id, corpo, criado_em, autor:autor_id (${CAMPOS_AUTOR})`)
        .eq("post_id", postId)
        .order("criado_em", { ascending: true });
      if (ativo) {
        setLista((data ?? []) as unknown as ComentarioFeed[]);
        setCarregando(false);
      }
    }
    carregar();

    const canal = supabase
      .channel(`comentarios:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "rede",
          table: "comentarios",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const novoId = (payload.new as { id: string }).id;
          // busca o comentário com o autor (o payload não traz o join)
          const { data } = await supabase
            .from("comentarios")
            .select(`id, corpo, criado_em, autor:autor_id (${CAMPOS_AUTOR})`)
            .eq("id", novoId)
            .maybeSingle();
          if (data && ativo) {
            setLista((prev) =>
              prev.some((c) => c.id === novoId)
                ? prev
                : [...prev, data as unknown as ComentarioFeed],
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "rede",
          table: "comentarios",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const idRemovido = (payload.old as { id: string }).id;
          if (ativo) setLista((prev) => prev.filter((c) => c.id !== idRemovido));
        },
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(canal);
    };
  }, [postId]);

  const remover = (id: string) => {
    if (!confirm("Remover este comentário?")) return;
    // otimista: some da lista já (o realtime confirma p/ os outros)
    setLista((prev) => prev.filter((c) => c.id !== id));
    start(async () => {
      await apagarComentario(id);
    });
  };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const corpo = texto.trim();
    if (!corpo) return;
    if (!logado) {
      window.location.href = "/entrar";
      return;
    }
    setErro(null);
    setTexto("");
    start(async () => {
      const r = await criarComentario(postId, corpo);
      if (r.erro) {
        setErro(r.erro);
        setTexto(corpo); // devolve o texto p/ não perder
      }
      // o INSERT chega pelo realtime; não precisa inserir na lista aqui
    });
  };

  return (
    <div className="mt-3 border-t pt-3" style={{ borderColor: C.line }}>
      {carregando ? (
        <p className="text-[13px]" style={{ color: C.muted }}>
          Carregando comentários…
        </p>
      ) : (
        <ul className="space-y-3">
          {lista.map((c) => {
            const q = (c.autor?.qualificacao ?? "thb") as Qualificacao;
            const href = `/especialista/${c.autor?.slug ?? c.autor?.id}`;
            return (
              <li key={c.id} className="flex gap-2.5">
                <Link href={href} className="shrink-0">
                  <Avatar nome={c.autor?.nome ?? "?"} foto={c.autor?.avatar_url} size={26} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={href}
                      className="truncate text-[13px]"
                      style={{ color: C.ink, fontFamily: F.serif }}
                    >
                      {c.autor?.nome ?? "—"}
                    </Link>
                    <TagNivel qualificacao={q} size="sm" />
                    <span className="text-[11px]" style={{ color: C.muted }}>
                      · {tempoRelativo(c.criado_em)}
                    </span>
                    {(isAdmin || (meuPerfilId && c.autor?.id === meuPerfilId)) && (
                      <button
                        onClick={() => remover(c.id)}
                        aria-label="Remover comentário"
                        className="ml-auto shrink-0"
                        style={{ color: C.muted }}
                      >
                        <Ico.lixo style={{ width: 13, height: 13 }} />
                      </button>
                    )}
                  </div>
                  <p
                    className="mt-0.5 whitespace-pre-wrap text-[14px] leading-snug"
                    style={{ color: C.ink }}
                  >
                    {c.corpo}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={enviar} className="mt-3 flex items-end gap-2">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={logado ? "Escreva um comentário…" : "Entre para comentar"}
          rows={1}
          className="flex-1 resize-none rounded-xl px-3 py-2 text-[14px] outline-none"
          style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }}
        />
        <button
          type="submit"
          disabled={pending || !texto.trim()}
          className="rounded-xl px-3.5 text-[14px] font-semibold"
          style={{
            height: 40,
            background: C.petrol,
            color: "#fff",
            opacity: pending || !texto.trim() ? 0.4 : 1,
          }}
        >
          Enviar
        </button>
      </form>
      {erro && (
        <p className="mt-1.5 text-[12px]" style={{ color: "#B4342A" }}>
          {erro}
        </p>
      )}
    </div>
  );
}
