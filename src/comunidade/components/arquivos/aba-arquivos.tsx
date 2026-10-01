"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SeloVerificado, TagNivel } from "@/comunidade/components/atoms";
import { IcoRC } from "@/comunidade/components/icones";
import { Dialogo, ItemMenu, Menu } from "@/comunidade/components/ui";
import { diaCurto } from "@/comunidade/components/paginas/textos";
import { createClient } from "@/lib/supabase/browser";
import { norm } from "@/lib/utils";
import { hrefMembro } from "@/comunidade/lib/grupo-tipos";
import {
  BUCKET_ARQUIVOS,
  MAX_MB_ARQUIVO,
  tamanhoLegivel,
  tipoPorMime,
  type Arquivo,
  type MidiaPost,
  type TipoArquivo,
} from "@/comunidade/lib/arquivos-tipos";
import { apagarArquivo, fixarArquivo, linkDoArquivo, registrarArquivo } from "@/comunidade/acoes/arquivos";

/* Abas Mídia e Arquivos do grupo. É o mesmo acervo (tabela `arquivos` + fotos
   dos posts), separado em duas telas como no Facebook:
   - "midias": grade de fotos e vídeos (fotos dos posts + imagens e vídeos
     enviados);
   - "arquivos": lista de documentos e links.
   Enviar, abrir, remover (autor ou coordenação) e fixar (coordenação) seguem
   as mesmas ações e permissões de antes. */

type Somente = "arquivos" | "midias";

const ROTULO_TIPO: Record<TipoArquivo, string> = {
  documento: "Documento",
  imagem: "Foto",
  video: "Vídeo",
  link: "Link",
};

const ehMidia = (t: TipoArquivo) => t === "imagem" || t === "video";
const ehEnderecoWeb = (u: string | null | undefined): u is string => !!u && /^https?:\/\//i.test(u);

/** Abre um arquivo do acervo em nova aba. A aba é aberta já no clique (antes
 *  do await) para o navegador não bloquear. Devolve a mensagem de erro, se
 *  houver. Só navega para endereço http(s). */
async function abrirArquivo(id: string): Promise<string | null> {
  const janela = window.open("", "_blank");
  const r = await linkDoArquivo(id);
  if (ehEnderecoWeb(r.url)) {
    if (janela) {
      janela.opener = null;
      janela.location.href = r.url;
    } else {
      window.location.href = r.url;
    }
    return null;
  }
  janela?.close();
  return r.erro ?? "Não foi possível abrir.";
}

export function AbaArquivos({
  arquivos,
  midias,
  somente,
  perfilId,
  isAdmin,
}: {
  arquivos: Arquivo[];
  midias: MidiaPost[];
  /** qual aba do grupo esta tela é */
  somente: Somente;
  perfilId: string;
  isAdmin: boolean;
}) {
  const [enviando, setEnviando] = useState(false);
  const abrirEnvio = useCallback(() => setEnviando(true), []);
  const fecharEnvio = useCallback(() => setEnviando(false), []);

  return (
    <div className="rc-pg">
      <section className="rc-cartao rc-pg-bloco">
        {somente === "arquivos" ? (
          <ListaDeArquivos arquivos={arquivos.filter((a) => !ehMidia(a.tipo))} perfilId={perfilId} isAdmin={isAdmin} onAdicionar={abrirEnvio} />
        ) : (
          <GradeDeMidia arquivos={arquivos.filter((a) => ehMidia(a.tipo))} midias={midias} perfilId={perfilId} isAdmin={isAdmin} onAdicionar={abrirEnvio} />
        )}
      </section>
      <FormEnvio aberto={enviando} onFechar={fecharEnvio} perfilId={perfilId} somente={somente} />
    </div>
  );
}

/* ------------------------------------------------------------ Arquivos -- */

function ListaDeArquivos({ arquivos, perfilId, isAdmin, onAdicionar }: { arquivos: Arquivo[]; perfilId: string; isAdmin: boolean; onAdicionar: () => void }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "documento" | "link">("todos");

  const lista = useMemo(() => {
    const q = norm(busca);
    return arquivos.filter((a) => (filtro === "todos" || a.tipo === filtro) && (!q || norm(`${a.titulo} ${a.descricao} ${a.autor?.nome ?? ""}`).includes(q)));
  }, [arquivos, busca, filtro]);

  return (
    <>
      <div className="rc-pg-acervo-topo">
        <div>
          <h1 className="rc-pg-titulo">
            Arquivos {arquivos.length > 0 && <span className="rc-pg-conta">· {arquivos.length.toLocaleString("pt-BR")}</span>}
          </h1>
          <p className="rc-pg-nota" style={{ marginTop: 2 }}>
            Modelos, apresentações e links de apoio enviados pelos membros.
          </p>
        </div>
        <button type="button" className="rc-btn rc-btn-primario" onClick={onAdicionar}>
          <IcoRC.mais /> Adicionar arquivo
        </button>
      </div>

      {arquivos.length === 0 ? (
        <div className="rc-pg-vazio">
          <IcoRC.pasta />
          <strong>Ainda não há arquivos</strong>
          <p>Envie um documento ou cole um link de apoio. Ele fica aqui para todos os membros.</p>
        </div>
      ) : (
        <>
          <div className="rc-pg-acervo-filtros">
            <label className="rc-pg-busca">
              <IcoRC.busca />
              <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nos arquivos" aria-label="Buscar nos arquivos por título, descrição ou autor" autoComplete="off" />
            </label>
            <select className="rc-pg-campo" style={{ height: 40 }} value={filtro} onChange={(e) => setFiltro(e.target.value as "todos" | "documento" | "link")} aria-label="Filtrar por tipo">
              <option value="todos">Todos os tipos</option>
              <option value="documento">Documentos</option>
              <option value="link">Links</option>
            </select>
          </div>

          {lista.length === 0 ? (
            <div className="rc-pg-vazio">
              <strong>Nenhum arquivo com esse filtro</strong>
              <p>Tente outra palavra ou volte para todos os tipos.</p>
            </div>
          ) : (
            <>
              <div className="rc-pg-arq-cab" aria-hidden="true">
                <span>Nome</span>
                <span>Tipo</span>
                <span>Enviado por</span>
                <span>Data</span>
                <span />
              </div>
              <ul className="rc-pg-arq">
                {lista.map((a) => (
                  <LinhaArquivo key={a.id} a={a} podeApagar={isAdmin || a.autor?.id === perfilId} isAdmin={isAdmin} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </>
  );
}

function LinhaArquivo({ a, podeApagar, isAdmin }: { a: Arquivo; podeApagar: boolean; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const abrir = () =>
    start(async () => {
      setErro(null);
      setErro(await abrirArquivo(a.id));
    });

  const apagar = () => {
    if (!confirm(`Remover "${a.titulo}"? Não dá para desfazer.`)) return;
    start(async () => {
      const r = await apagarArquivo(a.id);
      if (r.erro) setErro(r.erro);
      else router.refresh();
    });
  };

  const fixar = () =>
    start(async () => {
      const r = await fixarArquivo(a.id, !a.fixado);
      if (r.erro) setErro(r.erro);
      else router.refresh();
    });

  return (
    <li>
      <div className="rc-pg-arq-linha">
        <div className="rc-pg-arq-nome">
          <span className="rc-pg-arq-icone">{a.tipo === "link" ? <IcoRC.link /> : <IcoRC.documento />}</span>
          <div style={{ minWidth: 0 }}>
            <p className="rc-pg-arq-titulo">
              {a.fixado && (
                <span title="Fixado pela coordenação" style={{ display: "inline-flex" }}>
                  <IcoRC.pin />
                  <span className="rc-pg-so-leitor">Fixado.</span>
                </span>
              )}
              <span>{a.titulo}</span>
            </p>
            {a.descricao && <p className="rc-pg-arq-desc">{a.descricao}</p>}
          </div>
        </div>

        <div className="rc-pg-arq-meta">
          <span>
            {ROTULO_TIPO[a.tipo]}
            {a.tamanho_bytes > 0 && ` · ${tamanhoLegivel(a.tamanho_bytes)}`}
          </span>
          <span className="rc-pg-arq-autor">
            <span className="rc-pg-arq-sep" aria-hidden="true">
              ·
            </span>
            {a.autor ? (
              <>
                <Link href={hrefMembro(a.autor)}>{a.autor.nome}</Link>
                {a.autor.verificado && <SeloVerificado size="sm" />}
                <TagNivel qualificacao={a.autor.qualificacao} size="sm" />
              </>
            ) : (
              "Membro removido"
            )}
          </span>
          <span>
            <span className="rc-pg-arq-sep" aria-hidden="true">
              ·
            </span>
            {diaCurto(a.criado_em)}
          </span>
        </div>

        <div className="rc-pg-arq-acoes">
          {ehEnderecoWeb(a.url) ? (
            <a href={a.url} target="_blank" rel="noopener noreferrer nofollow" className="rc-btn rc-btn-neutro">
              Abrir <IcoRC.externo />
            </a>
          ) : (
            <button type="button" className="rc-btn rc-btn-neutro" onClick={abrir} disabled={pending}>
              Abrir
            </button>
          )}
          {(isAdmin || podeApagar) && (
            <Menu
              rotulo={`Ações de ${a.titulo}`}
              gatilho={({ aberto, alternar }) => (
                <button type="button" className="rc-icone-btn" aria-label="Mais ações" aria-haspopup="menu" aria-expanded={aberto} onClick={alternar} disabled={pending}>
                  <IcoRC.pontos />
                </button>
              )}
            >
              {(fechar) => (
                <>
                  {isAdmin && (
                    <ItemMenu
                      icone={<IcoRC.pin />}
                      sub={a.fixado ? "Volta para a ordem de envio." : "Fica no começo da lista."}
                      onClick={() => {
                        fechar();
                        fixar();
                      }}
                    >
                      {a.fixado ? "Desafixar" : "Fixar no topo"}
                    </ItemMenu>
                  )}
                  {podeApagar && (
                    <ItemMenu
                      icone={<IcoRC.lixo />}
                      perigo
                      onClick={() => {
                        fechar();
                        apagar();
                      }}
                    >
                      Remover arquivo
                    </ItemMenu>
                  )}
                </>
              )}
            </Menu>
          )}
        </div>
      </div>
      {erro && (
        <p className="rc-erro-texto rc-pg-arq-erro" role="alert">
          {erro}
        </p>
      )}
    </li>
  );
}

/* --------------------------------------------------------------- Mídia -- */

type ItemMidia =
  | { chave: string; origem: "post"; ehVideo: false; criado_em: string; midia: MidiaPost }
  | { chave: string; origem: "arquivo"; ehVideo: boolean; criado_em: string; arquivo: Arquivo };

function GradeDeMidia({ arquivos, midias, perfilId, isAdmin, onAdicionar }: { arquivos: Arquivo[]; midias: MidiaPost[]; perfilId: string; isAdmin: boolean; onAdicionar: () => void }) {
  const [filtro, setFiltro] = useState<"tudo" | "fotos" | "videos">("tudo");
  const [erro, setErro] = useState<string | null>(null);

  // Fotos dos posts e envios do acervo numa lista só, do mais novo para o mais antigo.
  const itens = useMemo<ItemMidia[]>(() => {
    const dePosts: ItemMidia[] = midias.map((m) => ({ chave: `p-${m.post_id}`, origem: "post", ehVideo: false, criado_em: m.criado_em, midia: m }));
    const deArquivos: ItemMidia[] = arquivos.map((a) => ({ chave: `a-${a.id}`, origem: "arquivo", ehVideo: a.tipo === "video", criado_em: a.criado_em, arquivo: a }));
    return [...dePosts, ...deArquivos].sort((x, y) => y.criado_em.localeCompare(x.criado_em));
  }, [arquivos, midias]);

  const nVideos = itens.filter((i) => i.ehVideo).length;
  const temOsDois = nVideos > 0 && nVideos < itens.length;
  const visiveis = !temOsDois || filtro === "tudo" ? itens : itens.filter((i) => (filtro === "videos" ? i.ehVideo : !i.ehVideo));

  return (
    <>
      <div className="rc-pg-acervo-topo">
        <div>
          <h1 className="rc-pg-titulo">
            Mídia {itens.length > 0 && <span className="rc-pg-conta">· {itens.length.toLocaleString("pt-BR")}</span>}
          </h1>
          <p className="rc-pg-nota" style={{ marginTop: 2 }}>
            Fotos publicadas nos posts e fotos e vídeos enviados pelos membros.
          </p>
        </div>
        <button type="button" className="rc-btn rc-btn-primario" onClick={onAdicionar}>
          <IcoRC.mais /> Adicionar foto ou vídeo
        </button>
      </div>

      {temOsDois && (
        <div className="rc-pg-acervo-filtros">
          <div className="rc-pg-seg" data-curto="true" role="group" aria-label="Filtrar a mídia">
            {(
              [
                ["tudo", "Tudo"],
                ["fotos", "Fotos"],
                ["videos", "Vídeos"],
              ] as const
            ).map(([id, rotulo]) => (
              <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
                {rotulo}
              </button>
            ))}
          </div>
        </div>
      )}

      {erro && (
        <p className="rc-erro-texto rc-pg-arq-erro" role="alert" style={{ marginTop: 14 }}>
          {erro}
        </p>
      )}

      {itens.length === 0 ? (
        <div className="rc-pg-vazio">
          <IcoRC.imagem />
          <strong>Ainda não há fotos nem vídeos</strong>
          <p>As fotos publicadas nos posts da Discussão aparecem aqui sozinhas.</p>
        </div>
      ) : (
        <ul className="rc-pg-midia">
          {visiveis.map((i) =>
            i.origem === "post" ? (
              <li key={i.chave}>
                <Link href={`/comunidade/post/${i.midia.post_id}`} className="rc-pg-midia-item" aria-label={`Ver o post de ${i.midia.autor || "um membro"}`} title={i.midia.autor ? `Post de ${i.midia.autor}` : undefined}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.midia.imagem_url} alt="" loading="lazy" />
                </Link>
              </li>
            ) : (
              <LadrilhoArquivo key={i.chave} a={i.arquivo} podeApagar={isAdmin || i.arquivo.autor?.id === perfilId} onErro={setErro} />
            ),
          )}
        </ul>
      )}
    </>
  );
}

/** Foto ou vídeo enviado ao acervo: o quadrado abre o arquivo; autor e
 *  coordenação têm o botão de remover no canto. */
function LadrilhoArquivo({ a, podeApagar, onErro }: { a: Arquivo; podeApagar: boolean; onErro: (e: string | null) => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const ehVideo = a.tipo === "video";
  const rotulo = `${ehVideo ? "Abrir o vídeo" : "Abrir a foto"} ${a.titulo}`;

  const abrir = () =>
    start(async () => {
      onErro(null);
      onErro(await abrirArquivo(a.id));
    });

  const apagar = () => {
    if (!confirm(`Remover "${a.titulo}"? Não dá para desfazer.`)) return;
    start(async () => {
      const r = await apagarArquivo(a.id);
      if (r.erro) onErro(r.erro);
      else router.refresh();
    });
  };

  const miolo =
    !ehVideo && a.miniatura ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={a.miniatura} alt="" loading="lazy" />
    ) : (
      <span className="rc-pg-midia-video">
        <span>{ehVideo ? <IcoRC.video /> : <IcoRC.imagem />}</span>
        <strong>{a.titulo}</strong>
      </span>
    );

  return (
    <li>
      {ehEnderecoWeb(a.url) ? (
        <a href={a.url} target="_blank" rel="noopener noreferrer nofollow" className="rc-pg-midia-item" aria-label={rotulo} title={a.titulo}>
          {miolo}
        </a>
      ) : (
        <button type="button" className="rc-pg-midia-item" onClick={abrir} disabled={pending} aria-label={rotulo} title={a.titulo}>
          {miolo}
        </button>
      )}
      {podeApagar && (
        <button type="button" className="rc-pg-midia-remover" onClick={apagar} disabled={pending} aria-label={`Remover ${a.titulo}`} title="Remover">
          <IcoRC.lixo />
        </button>
      )}
    </li>
  );
}

/* --------------------------------------------------------------- Envio -- */

function FormEnvio({ aberto, onFechar, perfilId, somente }: { aberto: boolean; onFechar: () => void; perfilId: string; somente: Somente }) {
  const router = useRouter();
  const naMidia = somente === "midias";
  const [modo, setModo] = useState<"arquivo" | "link">("arquivo");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const limpar = () => {
    setTitulo("");
    setDescricao("");
    setArquivo(null);
    setLink("");
    setErro(null);
    setModo("arquivo");
  };

  const escolher = (f: File | null) => {
    setErro(null);
    if (f && f.size > MAX_MB_ARQUIVO * 1024 * 1024) {
      setErro(`O arquivo tem ${(f.size / 1048576).toFixed(1).replace(".", ",")} MB. O limite é ${MAX_MB_ARQUIVO} MB. Para vídeo longo, cole o link do YouTube ou do Drive.`);
      setArquivo(null);
      return;
    }
    if (f && naMidia && !ehMidia(tipoPorMime(f.type || ""))) {
      setErro("Aqui entram fotos e vídeos. Documento vai na aba Arquivos.");
      setArquivo(null);
      return;
    }
    setArquivo(f);
    if (f && !titulo) setTitulo(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  };

  const salvar = () =>
    start(async () => {
      setErro(null);
      let tipo: TipoArquivo;
      if (modo === "arquivo") {
        if (!arquivo) {
          setErro("Escolha um arquivo.");
          return;
        }
        tipo = tipoPorMime(arquivo.type || "");
        const supabase = createClient();
        const nomeSeguro = arquivo.name.normalize("NFD").replace(/[^\w.-]+/g, "-").slice(-80);
        const caminho = `${perfilId}/${crypto.randomUUID()}-${nomeSeguro}`;
        const { error } = await supabase.storage.from(BUCKET_ARQUIVOS).upload(caminho, arquivo, {
          contentType: arquivo.type || "application/octet-stream",
          upsert: false,
        });
        if (error) {
          setErro(`Falha ao enviar: ${error.message}`);
          return;
        }
        const r = await registrarArquivo({ titulo, descricao, tipo, caminho, mime: arquivo.type, tamanho: arquivo.size });
        if (r.erro) {
          await supabase.storage.from(BUCKET_ARQUIVOS).remove([caminho]);
          setErro(r.erro);
          return;
        }
      } else {
        tipo = naMidia ? "video" : "link";
        const r = await registrarArquivo({ titulo, descricao, tipo, url: link });
        if (r.erro) {
          setErro(r.erro);
          return;
        }
      }
      limpar();
      onFechar();
      // Foto ou vídeo enviado pela aba Arquivos mora na aba Mídia: leva para lá.
      if (!naMidia && ehMidia(tipo)) router.push("/comunidade/midia");
      else router.refresh();
    });

  const pronto = titulo.trim().length >= 2 && (modo === "arquivo" ? !!arquivo : link.trim().length > 0);

  return (
    <Dialogo aberto={aberto} onFechar={onFechar} titulo={naMidia ? "Adicionar foto ou vídeo" : "Adicionar arquivo"} largura={500}>
      <form
        className="rc-pg-envio"
        onSubmit={(e) => {
          e.preventDefault();
          if (pronto && !pending) salvar();
        }}
      >
        <div className="rc-pg-seg" role="group" aria-label="Como adicionar">
          <button type="button" aria-pressed={modo === "arquivo"} onClick={() => setModo("arquivo")}>
            {naMidia ? "Enviar foto ou vídeo" : "Enviar arquivo"}
          </button>
          <button type="button" aria-pressed={modo === "link"} onClick={() => setModo("link")}>
            {naMidia ? "Colar link de vídeo" : "Colar link"}
          </button>
        </div>

        {modo === "arquivo" ? (
          <div>
            <label className="rc-pg-envio-arquivo">
              <input type="file" className="rc-pg-so-leitor" accept={naMidia ? "image/*,video/*" : undefined} onChange={(e) => escolher(e.target.files?.[0] ?? null)} />
              <span className="rc-pg-arq-icone">{arquivo ? naMidia ? <IcoRC.imagem /> : <IcoRC.documento /> : <IcoRC.mais />}</span>
              <span>
                {arquivo ? (
                  <>
                    <strong>{arquivo.name}</strong>
                    <small>{tamanhoLegivel(arquivo.size)} · toque para trocar</small>
                  </>
                ) : (
                  <>
                    <strong>{naMidia ? "Escolher foto ou vídeo" : "Escolher arquivo"}</strong>
                    <small>Até {MAX_MB_ARQUIVO} MB</small>
                  </>
                )}
              </span>
            </label>
            {!naMidia && (
              <p className="rc-pg-nota" style={{ marginTop: 6 }}>
                Foto e vídeo enviados por aqui aparecem na aba Mídia.
              </p>
            )}
          </div>
        ) : (
          <label>
            <span className="rc-pg-rotulo">{naMidia ? "Link do vídeo (YouTube, Vimeo, Drive)" : "Link"}</span>
            <input type="text" inputMode="url" className="rc-pg-campo" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" autoComplete="off" />
          </label>
        )}

        <label>
          <span className="rc-pg-rotulo">Título</span>
          <input className="rc-pg-campo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={160} autoComplete="off" />
        </label>
        <label>
          <span className="rc-pg-rotulo">Descrição (opcional)</span>
          <textarea className="rc-pg-campo" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} maxLength={600} />
        </label>

        {erro && (
          <p className="rc-erro-texto" role="alert" style={{ margin: 0, fontSize: 14 }}>
            {erro}
          </p>
        )}

        <button type="submit" className="rc-btn rc-btn-primario rc-btn-bloco" style={{ height: 44 }} disabled={pending || !pronto}>
          {pending ? "Enviando..." : "Salvar"}
        </button>
      </form>
    </Dialogo>
  );
}
