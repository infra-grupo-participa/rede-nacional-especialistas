"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Avatar, Eyebrow } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { createClient } from "@/lib/supabase/browser";
import { tempoRelativo } from "@/lib/utils";
import { comentarArtigo, apagarComentarioArtigo } from "@/app/artigos/comentarios-actions";
import type { Qualificacao } from "@/lib/qualificacoes";

const LIMITE = 1500;
const CAMPOS_AUTOR = "id, slug, nome, avatar_url, qualificacao, profissao, cidade, certificado";

interface AutorC {
  id: string;
  slug: string | null;
  nome: string;
  avatar_url: string;
  qualificacao: Qualificacao;
  profissao: string;
  cidade: string;
  certificado: boolean;
}
interface ComentarioA {
  id: string;
  texto: string;
  criado_em: string;
  autor: AutorC | null;
}

export function ComentariosArtigo({
  artigoId,
  logado,
  primeiroNome,
  isAdmin,
  meuPerfilId,
}: {
  artigoId: string;
  logado: boolean;
  primeiroNome: string | null;
  isAdmin: boolean;
  meuPerfilId: string | null;
}) {
  const [lista, setLista] = useState<ComentarioA[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    let ativo = true;

    async function carregar() {
      const { data } = await supabase
        .from("artigo_comentarios")
        .select(`id, texto, criado_em, autor:autor_id (${CAMPOS_AUTOR})`)
        .eq("artigo_id", artigoId)
        .order("criado_em", { ascending: false });
      if (ativo) {
        setLista((data ?? []) as unknown as ComentarioA[]);
        setCarregando(false);
      }
    }
    carregar();

    const canal = supabase
      .channel(`artcom:${artigoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "rede", table: "artigo_comentarios", filter: `artigo_id=eq.${artigoId}` },
        async (payload) => {
          const novoId = (payload.new as { id: string }).id;
          const { data } = await supabase
            .from("artigo_comentarios")
            .select(`id, texto, criado_em, autor:autor_id (${CAMPOS_AUTOR})`)
            .eq("id", novoId)
            .maybeSingle();
          if (data && ativo) {
            setLista((prev) =>
              prev.some((c) => c.id === novoId) ? prev : [data as unknown as ComentarioA, ...prev],
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "rede", table: "artigo_comentarios", filter: `artigo_id=eq.${artigoId}` },
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
  }, [artigoId]);

  const remover = (id: string) => {
    if (!confirm("Apagar este comentário?")) return;
    setLista((prev) => prev.filter((c) => c.id !== id));
    start(async () => {
      await apagarComentarioArtigo(id);
    });
  };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const t = texto.trim();
    if (t.length < 2) return;
    setErro(null);
    setTexto("");
    start(async () => {
      const r = await comentarArtigo(artigoId, t);
      if (r.erro) {
        setErro(r.erro);
        setTexto(t);
      }
    });
  };

  return (
    <section className="mt-8">
      <Eyebrow className="pb-3">Comentários</Eyebrow>

      {carregando ? (
        <p className="text-[13px]" style={{ color: C.muted }}>
          Carregando comentários…
        </p>
      ) : lista.length === 0 ? (
        <p className="text-[14px]" style={{ color: C.muted }}>
          Ainda não há comentários. Seja o primeiro.
        </p>
      ) : (
        <ul className="space-y-4">
          {lista.map((c) => {
            const meu = meuPerfilId && c.autor?.id === meuPerfilId;
            const href = `/especialista/${c.autor?.slug ?? c.autor?.id}`;
            return (
              <li key={c.id} className="flex gap-3">
                <Link href={href} className="shrink-0">
                  <Avatar nome={c.autor?.nome ?? "?"} foto={c.autor?.avatar_url} size={34} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link href={href} className="text-[14px]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600 }}>
                      {c.autor?.nome ?? "—"}
                    </Link>
                    {c.autor?.certificado && (
                      <Ico.selo style={{ width: 14, height: 14, color: C.laranja }} />
                    )}
                    <span className="text-[12px]" style={{ color: C.muted, fontFamily: F.mono }}>
                      · {tempoRelativo(c.criado_em)}
                    </span>
                    {(isAdmin || meu) && (
                      <button
                        onClick={() => remover(c.id)}
                        className="ml-auto shrink-0 text-[12px] font-semibold"
                        style={{ color: "#B24A42" }}
                      >
                        Apagar
                      </button>
                    )}
                  </div>
                  {(c.autor?.profissao || c.autor?.cidade) && (
                    <p className="text-[12px]" style={{ color: C.muted }}>
                      {[c.autor?.profissao, c.autor?.cidade].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 whitespace-pre-wrap text-[15px] leading-snug" style={{ color: C.ink }}>
                    {c.texto}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* composer */}
      {logado ? (
        <form onSubmit={enviar} className="mt-5">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, LIMITE))}
            placeholder={primeiroNome ? `Comentar como ${primeiroNome}…` : "Escreva um comentário…"}
            rows={3}
            className="w-full resize-none rounded-xl px-3 py-2.5 text-[15px] outline-none"
            style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }}
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[12px]" style={{ color: C.muted, fontFamily: F.mono }}>
              {texto.length}/{LIMITE}
            </span>
            <button
              type="submit"
              disabled={pending || texto.trim().length < 2}
              className="rounded-xl px-4 text-[14px] font-semibold"
              style={{
                height: 40,
                background: C.laranja,
                color: C.ink,
                opacity: pending || texto.trim().length < 2 ? 0.4 : 1,
              }}
            >
              {pending ? "Enviando…" : "Comentar"}
            </button>
          </div>
          {erro && (
            <p className="mt-1.5 text-[12px]" style={{ color: "#B24A42" }}>
              {erro}
            </p>
          )}
        </form>
      ) : (
        <div className="mt-5 rounded-2xl p-4 text-center" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
          <p className="text-[14px]" style={{ color: C.muted }}>
            Comentários são assinados pelo seu perfil da rede.
          </p>
          <Link
            href="/entrar"
            className="mt-2 inline-flex items-center rounded-xl px-4 text-[14px] font-semibold"
            style={{ height: 44, background: C.ink, color: "#fff", lineHeight: "44px" }}
          >
            Entrar para comentar
          </Link>
        </div>
      )}
    </section>
  );
}
