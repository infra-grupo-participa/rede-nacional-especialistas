"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Avatar, SeloVerificado, TagNivel } from "@/components/atoms";
import { createClient } from "@/lib/supabase/browser";
import { tempoRelativo } from "@/lib/utils";
import { criarComentario, apagarComentario } from "@/app/feed/actions";
import { Ico } from "@/components/icons";
import type { ComentarioFeed } from "@/lib/feed";
import type { Qualificacao } from "@/lib/qualificacoes";

const CAMPOS_AUTOR = "id, slug, nome, avatar_url, qualificacao, verificado";

export function Comentarios({
  postId,
  logado,
  isAdmin,
  meuPerfilId,
  travado = false,
  motivoTrava = "",
}: {
  postId: string;
  logado: boolean;
  isAdmin: boolean;
  meuPerfilId: string | null;
  /** comentários travados pela moderação: some o campo (admin ainda comenta). */
  travado?: boolean;
  motivoTrava?: string;
}) {
  const [lista, setLista] = useState<ComentarioFeed[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const supabaseRef = useRef(createClient());

  // Trava dos comentários. Nasce das props e muda AO VIVO quando a moderação
  // trava ou libera o post (evento UPDATE do post, abaixo). Quando as props
  // mudam (ex.: router.refresh), elas voltam a mandar: ajuste de estado durante
  // o render, sem effect.
  const [trava, setTrava] = useState({ travado, motivo: motivoTrava });
  const [propsVistas, setPropsVistas] = useState({ travado, motivoTrava });
  if (propsVistas.travado !== travado || propsVistas.motivoTrava !== motivoTrava) {
    setPropsVistas({ travado, motivoTrava });
    setTrava({ travado, motivo: motivoTrava });
  }

  const aplicarTrava = useCallback((novoTravado: boolean, novoMotivo: string) => {
    setTrava((t) => (t.travado === novoTravado && t.motivo === novoMotivo ? t : { travado: novoTravado, motivo: novoMotivo }));
    if (!novoTravado) setErro(null);
  }, []);

  /** Estado atual da trava, direto do banco. Cobre o evento ao vivo perdido
   *  (reconexão, aba em segundo plano) e o envio barrado. Só troca o estado
   *  quando algo mudou, para não re-renderizar à toa. */
  const lerTrava = useCallback(async () => {
    const { data } = await supabaseRef.current
      .from("posts")
      .select("comentarios_travados, travado_motivo")
      .eq("id", postId)
      .maybeSingle();
    const p = data as { comentarios_travados?: boolean; travado_motivo?: string } | null;
    if (!p || typeof p.comentarios_travados !== "boolean") return;
    aplicarTrava(p.comentarios_travados, p.travado_motivo ?? "");
  }, [postId, aplicarTrava]);

  /** Lista completa dos comentários do post (carga inicial e depois de enviar). */
  const buscarLista = useCallback(async () => {
    const { data } = await supabaseRef.current
      .from("comentarios")
      .select(`id, corpo, criado_em, autor:autor_id (${CAMPOS_AUTOR})`)
      .eq("post_id", postId)
      .order("criado_em", { ascending: true });
    return (data ?? []) as unknown as ComentarioFeed[];
  }, [postId]);

  // carga inicial + realtime
  useEffect(() => {
    const supabase = supabaseRef.current;
    let ativo = true;

    async function carregar() {
      void lerTrava();
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
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[comentarios] tempo real dos comentários indisponível:", status, err?.message ?? "");
        }
      });

    // Trava/liberação ao vivo para quem está com o post aberto. Canal PRÓPRIO:
    // o Realtime grava os bindings de um canal numa transação só, então uma
    // falha aqui (rede.posts fora da publication, por exemplo) derrubaria junto
    // os comentários ao vivo se dividissem o canal.
    const canalTrava = supabase
      .channel(`post-trava:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "rede",
          table: "posts",
          filter: `id=eq.${postId}`,
        },
        (payload) => {
          const novo = payload.new as { comentarios_travados?: boolean; travado_motivo?: string };
          if (ativo && typeof novo.comentarios_travados === "boolean") {
            aplicarTrava(novo.comentarios_travados, novo.travado_motivo ?? "");
          }
        },
      )
      .on("system", {}, (m: { status?: string; message?: string }) => {
        if (m?.status === "error") console.warn("[comentarios] trava ao vivo indisponível:", m.message ?? "");
      })
      .subscribe((status, err) => {
        // SUBSCRIBED dispara também a cada reconexão: relê o estado para não
        // ficar com a trava velha se um evento se perdeu no meio.
        if (status === "SUBSCRIBED") void lerTrava();
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[comentarios] canal da trava:", status, err?.message ?? "");
        }
      });

    return () => {
      ativo = false;
      supabase.removeChannel(canal);
      supabase.removeChannel(canalTrava);
    };
  }, [postId, lerTrava, aplicarTrava]);

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
        setTexto(corpo); // devolve o texto p/ não perder
        if (r.codigo === "travado") {
          // O banco barrou porque a moderação travou depois que a página abriu:
          // a tela vira para a trava (com o motivo) mesmo sem o evento ao vivo.
          // Sem erro vermelho: o aviso da trava já explica.
          setTrava((t) => (t.travado ? t : { travado: true, motivo: t.motivo }));
          await lerTrava();
        } else {
          setErro(r.erro);
        }
        return;
      }
      // O INSERT costuma chegar pelo realtime; relê a lista para o comentário
      // aparecer para quem enviou mesmo se o tempo real estiver fora do ar.
      setLista(await buscarLista());
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
                    {c.autor?.verificado && <SeloVerificado size="sm" />}
                    <TagNivel qualificacao={q} size="sm" />
                    <span className="shrink-0 whitespace-nowrap text-[11px]" style={{ color: C.muted }}>
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

      {trava.travado && (
        <p className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[13px]" style={{ background: C.paper, color: C.muted }} role="status">
          <Ico.escudo style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
          <span>
            Comentários desativados pela moderação{trava.motivo ? `: ${trava.motivo}` : "."}
            {isAdmin && " Como coordenação, você ainda pode comentar."}
          </span>
        </p>
      )}

      {(!trava.travado || isAdmin) && (
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
      )}
      {erro && (
        <p className="mt-1.5 text-[12px]" style={{ color: "#B4342A" }}>
          {erro}
        </p>
      )}
    </div>
  );
}
