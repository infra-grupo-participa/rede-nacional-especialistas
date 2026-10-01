"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, useTransition, type Ref } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/comunidade/components/atoms";
import { IcoRC } from "@/comunidade/components/icones";
import { Dialogo } from "@/comunidade/components/ui";
import { criarPost } from "@/comunidade/acoes/feed";
import { subirImagem } from "@/lib/subir-imagem";
import { MAX_FOTOS_POST } from "@/comunidade/lib/imagem-do-app";
import type { Eu } from "@/comunidade/lib/sessao";

/** Como a janela abre: no texto, já escolhendo a foto ou já na lista de hashtags. */
export type ModoCriarPost = "texto" | "foto" | "hashtag";

export interface CriarPostRef {
  abrir: (modo?: ModoCriarPost) => void;
}

const MAX_POST = 2000;
/** até aqui o texto fica em letra grande, como no Facebook */
const LIMITE_LETRA_GRANDE = 85;

function temHashtag(texto: string, tag: string): boolean {
  return new RegExp(`#${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}_])`, "iu").test(texto);
}

/* Janela "Criar post", no formato do Facebook: quem publica e o selo do grupo,
   o texto em letra grande, a foto escolhida, a caixa "Adicionar ao post" (aqui
   só Foto e Hashtag do tema) e o botão Postar. O rascunho fica guardado se a
   janela for fechada sem publicar. */
export function CriarPost({
  ref,
  eu,
  hashtags = [],
  exigirHashtag = false,
  onPublicado,
}: {
  ref?: Ref<CriarPostRef>;
  eu: Eu;
  /** hashtags dos temas definidas pela coordenação (sem o "#") */
  hashtags?: string[];
  /** regra da #: post sem a hashtag do tema fica com os comentários travados */
  exigirHashtag?: boolean;
  /** chamado depois de publicar; `aviso` vem quando o post ficou retido ou travado */
  onPublicado?: (aviso: string | null) => void;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [corpo, setCorpo] = useState("");
  const [imagens, setImagens] = useState<string[]>([]);
  /** quantas fotos ainda estão sendo enviadas */
  const [enviando, setEnviando] = useState(0);
  const enviandoFoto = enviando > 0;
  const [painelTags, setPainelTags] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const texto = useRef<HTMLTextAreaElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  // referência estável: o Dialogo refaz o foco quando `onFechar` muda
  const fechar = useCallback(() => setAberto(false), []);

  const grande = corpo.length <= LIMITE_LETRA_GRANDE && corpo.split("\n").length <= 3;
  const temConteudo = corpo.trim().length > 0 || imagens.length > 0;

  /** Leva o cursor para o texto, na posição pedida (padrão: o fim). */
  const focarTexto = useCallback((posicao?: number) => {
    requestAnimationFrame(() => {
      const no = texto.current;
      if (!no) return;
      no.focus();
      const p = posicao ?? no.value.length;
      no.setSelectionRange(p, p);
    });
  }, []);

  /** Coloca a hashtag do tema no começo do texto (sem repetir). Sem hashtags
   *  definidas pela coordenação, começa o texto com "#" para a pessoa completar. */
  const porHashtag = useCallback(
    (tag: string) => {
      setCorpo((c) => {
        if (!tag) return c.trimStart().startsWith("#") ? c : `#${c}`;
        return temHashtag(c, tag) ? c : `#${tag} ${c}`;
      });
      setPainelTags(false);
      focarTexto(tag ? undefined : 1);
    },
    [focarTexto],
  );

  const alternarTags = useCallback(() => {
    if (hashtags.length === 0) porHashtag("");
    else setPainelTags((v) => !v);
  }, [hashtags.length, porHashtag]);

  useImperativeHandle(
    ref,
    () => ({
      abrir: (modo = "texto") => {
        setAberto(true);
        // o seletor de arquivo precisa abrir no mesmo toque
        if (modo === "foto" && enviando === 0 && imagens.length < MAX_FOTOS_POST) arquivo.current?.click();
        if (modo === "hashtag") {
          if (hashtags.length === 0) porHashtag("");
          else setPainelTags(true);
        }
      },
    }),
    [hashtags.length, porHashtag, enviando, imagens.length],
  );

  // ao abrir, o cursor vai para o texto (no celular não: o teclado cobriria a janela)
  useEffect(() => {
    if (aberto && !window.matchMedia("(pointer: coarse)").matches) texto.current?.focus();
  }, [aberto]);

  // a área de texto cresce com o que foi escrito
  useEffect(() => {
    const no = texto.current;
    if (!aberto || !no) return;
    no.style.height = "auto";
    no.style.height = `${no.scrollHeight}px`;
  }, [aberto, corpo, grande, imagens.length, enviandoFoto]);

  /** Envia as fotos escolhidas, uma de cada vez, até o limite do post. As que
   *  passam entram na ordem; as que falham ficam de fora, com o motivo. */
  const escolherFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const escolhidas = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (escolhidas.length === 0) return;
    const vagas = MAX_FOTOS_POST - imagens.length;
    const arquivos = escolhidas.slice(0, Math.max(vagas, 0));
    const falhas: string[] = [];
    if (escolhidas.length > arquivos.length) falhas.push(`Um post leva até ${MAX_FOTOS_POST} fotos; as outras ficaram de fora.`);
    setErro(null);
    // soma: um segundo lote não pode zerar a conta do primeiro
    setEnviando((n) => n + arquivos.length);
    for (const file of arquivos) {
      try {
        const r = await subirImagem(file, "bloco");
        setImagens((atual) => (atual.includes(r.url) || atual.length >= MAX_FOTOS_POST ? atual : [...atual, r.url]));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Não foi possível enviar a foto.";
        falhas.push(`${file.name}: ${msg.replace(/\s*—\s*/g, ", ")}`);
      } finally {
        setEnviando((n) => Math.max(n - 1, 0));
      }
    }
    if (falhas.length > 0) setErro((antes) => [antes, ...falhas].filter(Boolean).join(" "));
  };

  const publicar = () => {
    if (!temConteudo || pending || enviandoFoto) return;
    setErro(null);
    start(async () => {
      let r: Awaited<ReturnType<typeof criarPost>>;
      try {
        r = await criarPost({ titulo: "", corpo: corpo.trim(), imagens });
      } catch {
        // sem rede ou página antiga depois de uma atualização do site: o texto e as fotos ficam
        setErro("Não foi possível publicar. Confira a conexão e tente de novo.");
        return;
      }
      if (r.erro) {
        setErro(r.erro);
        return;
      }
      setCorpo("");
      setImagens([]);
      setPainelTags(false);
      setAberto(false);
      onPublicado?.(r.aviso ?? null);
      router.refresh();
    });
  };

  return (
    <>
      <input ref={arquivo} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={escolherFoto} hidden tabIndex={-1} aria-hidden="true" />
      <Dialogo aberto={aberto} onFechar={fechar} titulo="Criar post" largura={500}>
        <form
          className="rc-cp"
          onSubmit={(e) => {
            e.preventDefault();
            publicar();
          }}
        >
          <div className="rc-cp-autor">
            <Avatar nome={eu.nome} foto={eu.avatar} size={40} />
            <div style={{ minWidth: 0 }}>
              <span className="rc-cp-nome">{eu.nome}</span>
              <span className="rc-cp-selo">
                <IcoRC.cadeado /> Grupo privado
              </span>
            </div>
          </div>

          <textarea
            ref={texto}
            className="rc-cp-texto"
            data-grande={grande || undefined}
            data-com-foto={imagens.length > 0 || enviandoFoto ? true : undefined}
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                publicar();
              }
            }}
            placeholder="Escreva algo..."
            aria-label="Texto do post"
            maxLength={MAX_POST}
            rows={3}
          />
          {corpo.length > MAX_POST - 200 && (
            <p className="rc-cp-contagem">
              {corpo.length} de {MAX_POST}
            </p>
          )}

          {(imagens.length > 0 || enviandoFoto) && (
            <div className="rc-cp-fotos" data-uma={imagens.length + enviando === 1 || undefined}>
              {imagens.map((url, i) => (
                <div key={url} className="rc-cp-foto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${i + 1} do post`} />
                  <button
                    type="button"
                    className="rc-icone-btn rc-cp-foto-tirar"
                    aria-label={`Tirar a foto ${i + 1}`}
                    onClick={() => setImagens((atual) => atual.filter((u) => u !== url))}
                  >
                    <IcoRC.x />
                  </button>
                </div>
              ))}
              {Array.from({ length: enviando }, (_, i) => (
                <div key={`enviando-${i}`} className="rc-cp-foto" data-enviando role="status">
                  Enviando…
                </div>
              ))}
            </div>
          )}
          {imagens.length > 0 && (
            <p className="rc-cp-fotos-nota">
              {imagens.length === 1 ? "1 foto" : `${imagens.length} fotos`} de até {MAX_FOTOS_POST}.
            </p>
          )}

          {painelTags && hashtags.length > 0 && (
            <div className="rc-cp-tags">
              <p>Toque na hashtag do tema: ela entra no começo do post.</p>
              <div className="rc-cp-tags-lista">
                {hashtags.map((h) => (
                  <button key={h} type="button" className="rc-cp-tag" onClick={() => porHashtag(h)}>
                    #{h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {exigirHashtag && (
            <p className="rc-cp-regra">
              <IcoRC.info />
              <span>Regra da #: comece o post com a hashtag do tema. Sem ela, os comentários ficam travados.</span>
            </p>
          )}

          {erro && (
            <p className="rc-erro-texto rc-cp-erro" role="alert">
              {erro}
            </p>
          )}

          <div className="rc-cp-adicionar">
            <span>Adicionar ao post</span>
            <div className="rc-cp-icones">
              <button type="button" className="rc-cp-icone" aria-label={imagens.length > 0 ? "Adicionar mais fotos" : "Fotos"} title={imagens.length > 0 ? "Adicionar mais fotos" : "Fotos"} disabled={enviandoFoto || imagens.length >= MAX_FOTOS_POST} onClick={() => arquivo.current?.click()}>
                <IcoRC.imagem />
              </button>
              <button
                type="button"
                className="rc-cp-icone"
                aria-label="Hashtag do tema"
                title="Hashtag do tema"
                data-ativo={painelTags || undefined}
                aria-expanded={hashtags.length > 0 ? painelTags : undefined}
                onClick={alternarTags}
              >
                <IcoRC.hashtag />
              </button>
            </div>
          </div>

          <button type="submit" className="rc-btn rc-btn-primario rc-btn-bloco rc-cp-postar" disabled={!temConteudo || pending || enviandoFoto}>
            {pending ? "Publicando…" : "Postar"}
          </button>
        </form>
      </Dialogo>
    </>
  );
}
