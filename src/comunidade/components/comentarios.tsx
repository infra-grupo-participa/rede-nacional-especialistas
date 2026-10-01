"use client";

import { Fragment, useCallback, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore, useTransition, type ReactNode, type Ref } from "react";
import Link from "next/link";
import { Avatar, SeloVerificado, TagNivel } from "@/comunidade/components/atoms";
import { IcoRC } from "@/comunidade/components/icones";
import { createClient } from "@/lib/supabase/browser";
import { tempoRelativo } from "@/lib/utils";
import { criarComentario, apagarComentario } from "@/comunidade/acoes/feed";
import { hrefMembro } from "@/comunidade/lib/grupo-tipos";
import type { ComentarioFeed } from "@/comunidade/lib/feed";
import { CAMPOS_COMENTARIO } from "@/comunidade/lib/feed-tipos";
import type { Qualificacao } from "@/comunidade/lib/qualificacoes";
import type { Eu } from "@/comunidade/lib/sessao";


/* ------------------------------------------------------------ texto -- */

const RE_TRECHO = /(https?:\/\/[^\s<>"]+|#[\p{L}\p{N}_]+)/gu;

/** Texto de post ou comentário: `#hashtag` leva para a busca e endereço
 *  `http(s)://` vira link que abre em nova aba. */
export function TextoRico({ texto }: { texto: string }) {
  const partes = texto.split(RE_TRECHO);
  return (
    <>
      {partes.map((parte, i) => {
        if (i % 2 === 0) return parte;
        if (parte.startsWith("#")) {
          return (
            <Link key={i} href={`/comunidade/busca?q=${encodeURIComponent(parte)}`} className="rc-hashtag">
              {parte}
            </Link>
          );
        }
        // pontuação colada no fim do endereço fica fora do link
        const sobra = parte.match(/[.,;:!?)\]]+$/)?.[0] ?? "";
        const url = sobra ? parte.slice(0, -sobra.length) : parte;
        return (
          <Fragment key={i}>
            <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="rc-link-texto">
              {url}
            </a>
            {sobra}
          </Fragment>
        );
      })}
    </>
  );
}

/** Texto que corta em `linhas` com "Ver mais" no fim da última linha, como no
 *  Facebook. O botão só aparece se o texto de fato não coube (medido na tela;
 *  antes de medir vale um palpite pelo tamanho). */
export function TextoCortado({
  texto,
  linhas,
  className = "",
  semCorte = false,
}: {
  texto: string;
  linhas: 2 | 5 | 8;
  className?: string;
  semCorte?: boolean;
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [expandido, setExpandido] = useState(false);
  const palpite = texto.length > linhas * 80 || texto.split("\n").length > linhas;

  const assinar = useCallback(
    (avisar: () => void) => {
      if (!el || typeof ResizeObserver === "undefined") return () => {};
      const observador = new ResizeObserver(avisar);
      observador.observe(el);
      return () => observador.disconnect();
    },
    [el],
  );
  const transborda = useSyncExternalStore(
    assinar,
    () => (el ? el.scrollHeight > el.clientHeight + 1 : palpite),
    () => palpite,
  );

  const cortado = !semCorte && !expandido;
  return (
    <div className={`rc-corte ${className}`}>
      <div ref={setEl} className="rc-corte-miolo" data-cortado={cortado ? linhas : undefined}>
        <TextoRico texto={texto} />
      </div>
      {cortado && transborda && (
        <button type="button" className="rc-ver-mais" onClick={() => setExpandido(true)}>
          Ver mais
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------- campo de comentar -- */

interface CampoRef {
  focar: () => void;
}

/** Pílula de escrever comentário ou resposta. Enter envia e Shift+Enter quebra
 *  a linha (no celular, Enter quebra a linha e o envio é pelo botão). */
function CampoComentario({
  eu,
  rotulo,
  resposta = false,
  focarAoAbrir = false,
  ref,
  onEnviar,
}: {
  eu: Eu;
  rotulo: string;
  resposta?: boolean;
  focarAoAbrir?: boolean;
  ref?: Ref<CampoRef>;
  /** devolve true quando o comentário foi gravado; false devolve o texto ao campo */
  onEnviar: (corpo: string) => Promise<boolean>;
}) {
  const [texto, setTexto] = useState("");
  const [pending, start] = useTransition();
  const area = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({ focar: () => area.current?.focus() }), []);

  // a pílula cresce com o texto
  useEffect(() => {
    const no = area.current;
    if (!no) return;
    no.style.height = "auto";
    no.style.height = `${no.scrollHeight}px`;
  }, [texto]);

  useEffect(() => {
    if (focarAoAbrir) area.current?.focus();
  }, [focarAoAbrir]);

  const enviar = () => {
    const corpo = texto.trim();
    if (!corpo || pending) return;
    setTexto("");
    start(async () => {
      const gravou = await onEnviar(corpo);
      // não gravou: devolve o texto para a pessoa não perder o que escreveu
      if (!gravou) setTexto((atual) => (atual.trim() ? `${corpo}\n${atual}` : corpo));
    });
  };

  const aoTeclar = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    e.preventDefault();
    enviar();
  };

  return (
    <form
      className="rc-cc"
      data-resposta={resposta || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
    >
      <span className="rc-cc-avatar">
        <Avatar nome={eu.nome} foto={eu.avatar} size={resposta ? 24 : 32} />
      </span>
      <label className="rc-cc-pilula">
        <textarea
          ref={area}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={aoTeclar}
          placeholder={rotulo}
          aria-label={rotulo}
          rows={1}
          maxLength={1000}
        />
        {texto.trim() && (
          <button type="submit" className="rc-cc-enviar" aria-label="Enviar comentário" disabled={pending}>
            <IcoRC.enviar />
          </button>
        )}
      </label>
    </form>
  );
}

/* ------------------------------------------------------- um comentário -- */

function ItemComentario({
  c,
  resposta = false,
  linhas,
  podeResponder,
  podeRemover,
  onResponder,
  onRemover,
  children,
}: {
  c: ComentarioFeed;
  resposta?: boolean;
  linhas: 2 | 8;
  podeResponder: boolean;
  podeRemover: boolean;
  onResponder: () => void;
  onRemover: () => void;
  children?: ReactNode;
}) {
  const nome = c.autor?.nome ?? "Membro";
  const q = (c.autor?.qualificacao ?? "thb") as Qualificacao;
  const miolo = (
    <>
      <div className="rc-cm-topo">
        {c.autor ? (
          <Link href={hrefMembro(c.autor)} className="rc-cm-nome">
            {nome}
          </Link>
        ) : (
          <span className="rc-cm-nome">{nome}</span>
        )}
        {c.autor?.verificado && <SeloVerificado size="sm" />}
        <TagNivel qualificacao={q} size="sm" />
        <span className="rc-cm-tempo" suppressHydrationWarning>
          · {tempoRelativo(c.criado_em)}
        </span>
      </div>
      <TextoCortado texto={c.corpo} linhas={linhas} className="rc-cm-texto" />
      {(podeResponder || podeRemover) && (
        <div className="rc-cm-acoes">
          {podeResponder && (
            <button type="button" onClick={onResponder}>
              Responder
            </button>
          )}
          {podeRemover && (
            <button type="button" onClick={onRemover}>
              Remover
            </button>
          )}
        </div>
      )}
      {children}
    </>
  );
  const avatar = <Avatar nome={nome} foto={c.autor?.avatar_url} size={resposta ? 24 : 32} />;
  return (
    <li className="rc-cm" data-resposta={resposta || undefined}>
      {c.autor ? (
        <Link href={hrefMembro(c.autor)} className="rc-cm-avatar" aria-label={`Perfil de ${nome}`}>
          {avatar}
        </Link>
      ) : (
        <span className="rc-cm-avatar">{avatar}</span>
      )}
      <div className="rc-cm-corpo">{miolo}</div>
    </li>
  );
}

/* --------------------------------------------------------- comentários -- */

export interface ComentariosRef {
  /** abre a lista completa e leva o cursor para o campo de comentar */
  comentar: () => void;
}

/** Comentários de um post. No cartão do feed nasce FECHADO: mostra só a prévia
 *  (o último comentário) e o campo de comentar, sem consulta nem canal de tempo
 *  real. A lista completa e os canais só começam quando a pessoa abre os
 *  comentários daquele post, ou na página do post (`abertoInicial`). */
export function Comentarios({
  ref,
  postId,
  eu,
  total,
  previa = null,
  iniciais,
  abertoInicial = false,
  travado = false,
  motivoTrava = "",
  onTotal,
}: {
  ref?: Ref<ComentariosRef>;
  postId: string;
  eu: Eu;
  /** quantos comentários o post tem (respostas incluídas), segundo o servidor */
  total: number;
  /** último comentário de primeiro nível, mostrado enquanto a lista está fechada */
  previa?: ComentarioFeed | null;
  /** lista já lida no servidor (página do post): evita o "Carregando" */
  iniciais?: ComentarioFeed[];
  abertoInicial?: boolean;
  /** comentários travados pela moderação: some o campo (admin ainda comenta). */
  travado?: boolean;
  motivoTrava?: string;
  /** avisa o cartão quando a contagem muda (envio, remoção, tempo real) */
  onTotal?: (n: number) => void;
}) {
  const [aberto, setAberto] = useState(abertoInicial);
  const [lista, setLista] = useState<ComentarioFeed[]>(iniciais ?? []);
  const [carregada, setCarregada] = useState(Boolean(iniciais));
  const [falhou, setFalhou] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [removidos, setRemovidos] = useState<ReadonlySet<string>>(() => new Set());
  const [respostasAbertas, setRespostasAbertas] = useState<ReadonlySet<string>>(() => new Set());
  const [respondendoA, setRespondendoA] = useState<string | null>(null);
  const [erro, setErro] = useState<{ alvo: string; msg: string } | null>(null);
  const [, start] = useTransition();
  const campoPrincipal = useRef<CampoRef>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const cliente = useCallback(() => (supabaseRef.current ??= createClient()), []);

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
    const { data } = await cliente()
      .from("posts")
      .select("comentarios_travados, travado_motivo")
      .eq("id", postId)
      .maybeSingle();
    const p = data as { comentarios_travados?: boolean; travado_motivo?: string } | null;
    if (!p || typeof p.comentarios_travados !== "boolean") return;
    aplicarTrava(p.comentarios_travados, p.travado_motivo ?? "");
  }, [postId, aplicarTrava, cliente]);

  /** Lista completa dos comentários do post (carga inicial e depois de enviar).
   *  `null` quando a consulta falha: a lista que está na tela fica como está. */
  const buscarLista = useCallback(async (): Promise<ComentarioFeed[] | null> => {
    const { data, error } = await cliente()
      .from("comentarios")
      .select(CAMPOS_COMENTARIO)
      .eq("post_id", postId)
      .order("criado_em", { ascending: true });
    if (error) return null;
    return (data ?? []) as unknown as ComentarioFeed[];
  }, [postId, cliente]);

  // carga da lista completa + tempo real: só com os comentários ABERTOS
  useEffect(() => {
    if (!aberto) return;
    const supabase = cliente();
    let ativo = true;

    async function carregar() {
      void lerTrava();
      const dados = await buscarLista();
      if (!ativo) return;
      if (dados) {
        setLista(dados);
        setCarregada(true);
        setFalhou(false);
      } else {
        setFalhou(true);
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
          const { data } = await supabase.from("comentarios").select(CAMPOS_COMENTARIO).eq("id", novoId).maybeSingle();
          if (data && ativo) {
            setLista((prev) => (prev.some((c) => c.id === novoId) ? prev : [...prev, data as unknown as ComentarioFeed]));
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
          // as respostas de um comentário apagado somem junto (o banco apaga em cascata)
          if (ativo) setLista((prev) => prev.filter((c) => c.id !== idRemovido && c.parent_id !== idRemovido));
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
  }, [aberto, tentativa, postId, lerTrava, aplicarTrava, buscarLista, cliente]);

  /* ---- o que aparece ---- */
  // Fechado (ou ainda carregando): só a prévia. Aberto: a lista completa.
  const base = carregada ? lista : previa ? [previa] : [];
  const visiveis = base.filter((c) => !removidos.has(c.id) && !(c.parent_id && removidos.has(c.parent_id)));
  const idsVisiveis = new Set(visiveis.map((c) => c.id));
  // resposta cujo comentário de origem não está na lista aparece como comentário
  const raizes = visiveis.filter((c) => !c.parent_id || !idsVisiveis.has(c.parent_id));
  const respostasDe = (id: string) => visiveis.filter((c) => c.parent_id === id);

  const previaRemovida = previa && removidos.has(previa.id) ? 1 : 0;
  const totalAgora = carregada ? visiveis.length : Math.max(0, total - previaRemovida);
  const haMais = !carregada && totalAgora > visiveis.length;

  useEffect(() => {
    onTotal?.(totalAgora);
  }, [onTotal, totalAgora]);

  const podeComentar = !trava.travado || eu.isAdmin;
  // o motivo vem digitado pela coordenação: garante o ponto no fim da frase
  const motivoLimpo = trava.motivo.trim();
  const motivoTravaTexto = motivoLimpo && !/[.!?]$/.test(motivoLimpo) ? `${motivoLimpo}.` : motivoLimpo;

  useImperativeHandle(
    ref,
    () => ({
      comentar: () => {
        setAberto(true);
        campoPrincipal.current?.focar();
      },
    }),
    [],
  );

  /* ---- ações ---- */
  const remover = (id: string) => {
    if (!confirm("Remover este comentário?")) return;
    // otimista: some da lista já (o realtime confirma p/ os outros)
    setRemovidos((prev) => new Set(prev).add(id));
    start(async () => {
      const r = await apagarComentario(id);
      if (r.erro) {
        setRemovidos((prev) => {
          const volta = new Set(prev);
          volta.delete(id);
          return volta;
        });
        setErro({ alvo: "post", msg: r.erro });
      }
    });
  };

  /** Grava um comentário (ou uma resposta a `respostaA`). */
  const enviar = async (corpo: string, respostaA: string | null): Promise<boolean> => {
    const alvo = respostaA ?? "post";
    setErro(null);
    const r = await criarComentario(postId, corpo, respostaA);
    if (r.erro) {
      if (r.codigo === "travado") {
        // O banco barrou porque a moderação travou depois que a página abriu:
        // a tela vira para a trava (com o motivo) mesmo sem o evento ao vivo.
        // Sem erro vermelho: o aviso da trava já explica.
        setTrava((t) => (t.travado ? t : { travado: true, motivo: t.motivo }));
        await lerTrava();
      } else {
        setErro({ alvo, msg: r.erro });
      }
      return false;
    }
    if (respostaA) setRespostasAbertas((prev) => new Set(prev).add(respostaA));
    // O INSERT costuma chegar pelo realtime; relê a lista para o comentário
    // aparecer para quem enviou mesmo se o tempo real estiver fora do ar.
    const dados = await buscarLista();
    if (dados) {
      setLista(dados);
      setCarregada(true);
      setFalhou(false);
    }
    setAberto(true);
    return true;
  };

  const responder = (c: ComentarioFeed) => {
    setAberto(true);
    // as respostas têm um nível só: responder a uma resposta cai no comentário de origem
    setRespondendoA(c.parent_id ?? c.id);
  };

  return (
    <div className="rc-coment">
      {haMais && !aberto && (
        <button type="button" className="rc-coment-mais" onClick={() => setAberto(true)}>
          {visiveis.length > 0 ? "Ver mais comentários" : totalAgora === 1 ? "Ver 1 comentário" : `Ver ${totalAgora} comentários`}
        </button>
      )}
      {aberto && !carregada && !falhou && totalAgora > visiveis.length && <p className="rc-coment-nota">Carregando comentários…</p>}
      {aberto && falhou && (
        <p className="rc-coment-nota" role="status">
          Não foi possível carregar os comentários.{" "}
          <button
            type="button"
            onClick={() => {
              setFalhou(false);
              setTentativa((n) => n + 1);
            }}
          >
            Tentar de novo
          </button>
        </p>
      )}

      {raizes.length > 0 && (
        <ul className="rc-coment-lista">
          {raizes.map((c) => {
            const respostas = respostasDe(c.id);
            const abertas = respostasAbertas.has(c.id);
            return (
              <ItemComentario
                key={c.id}
                c={c}
                linhas={carregada ? 8 : 2}
                podeResponder={podeComentar}
                podeRemover={eu.isAdmin || c.autor?.id === eu.perfilId}
                onResponder={() => responder(c)}
                onRemover={() => remover(c.id)}
              >
                {respostas.length > 0 && !abertas && (
                  <button
                    type="button"
                    className="rc-cm-ver-respostas"
                    onClick={() => setRespostasAbertas((prev) => new Set(prev).add(c.id))}
                  >
                    <IcoRC.chevronBaixo />
                    {respostas.length === 1 ? "Ver 1 resposta" : `Ver ${respostas.length} respostas`}
                  </button>
                )}
                {respostas.length > 0 && abertas && (
                  <ul className="rc-cm-respostas">
                    {respostas.map((r) => (
                      <ItemComentario
                        key={r.id}
                        c={r}
                        resposta
                        linhas={8}
                        podeResponder={podeComentar}
                        podeRemover={eu.isAdmin || r.autor?.id === eu.perfilId}
                        onResponder={() => responder(r)}
                        onRemover={() => remover(r.id)}
                      />
                    ))}
                  </ul>
                )}
                {respondendoA === c.id && podeComentar && (
                  <>
                    <CampoComentario
                      eu={eu}
                      rotulo={`Responder como ${eu.primeiroNome}`}
                      resposta
                      focarAoAbrir
                      onEnviar={(corpo) => enviar(corpo, c.id)}
                    />
                    {erro?.alvo === c.id && (
                      <p className="rc-erro-texto rc-cc-erro" role="alert">
                        {erro.msg}
                      </p>
                    )}
                  </>
                )}
              </ItemComentario>
            );
          })}
        </ul>
      )}

      {trava.travado && (
        <p className="rc-coment-trava" role="status">
          <IcoRC.balaoTravado />
          <span>
            Comentários desativados pela moderação{motivoTravaTexto ? `: ${motivoTravaTexto}` : "."}
            {eu.isAdmin && " Como coordenação, você ainda pode comentar."}
          </span>
        </p>
      )}

      {podeComentar && (
        <CampoComentario eu={eu} rotulo={`Comente como ${eu.primeiroNome}`} ref={campoPrincipal} onEnviar={(corpo) => enviar(corpo, null)} />
      )}
      {erro?.alvo === "post" && (
        <p className="rc-erro-texto rc-cc-erro" role="alert">
          {erro.msg}
        </p>
      )}
    </div>
  );
}
