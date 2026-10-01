"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  SeloVerificado,
  TagNivel,
} from "@/comunidade/components/atoms";
import { IcoRC } from "@/comunidade/components/icones";
import { ItemMenu, Menu } from "@/comunidade/components/ui";
import {
  CriarPost,
  type CriarPostRef,
} from "@/comunidade/components/criar-post";
import { CapaPadrao } from "@/comunidade/components/paginas/capa-padrao";
import { salvarCamposPerfil } from "@/comunidade/acoes/perfil";
import { corDeCapaValida } from "@/comunidade/lib/perfil-tipos";
import { subirImagem } from "@/lib/subir-imagem";
import type { Qualificacao } from "@/comunidade/lib/qualificacoes";
import type { Eu } from "@/comunidade/lib/sessao";

/* Topo do perfil do membro, no formato do perfil do Facebook: capa larga, foto
   redonda, nome grande, botões à direita e as abas (Tudo, Sobre, Fotos). No
   próprio perfil a capa e a foto trocam ali mesmo, sem tela de formulário. */

export type AbaPerfil = "tudo" | "sobre" | "fotos";

export interface TopoPerfilProps {
  /** caminho do perfil (ex.: /comunidade/membro/bia-aluna) */
  base: string;
  aba: AbaPerfil;
  ehMeu: boolean;
  nome: string;
  avatar: string | null;
  capa: string;
  corCapa: string;
  verificado: boolean;
  qualificacao: Qualificacao;
  daCoordenacao: boolean;
  /** "Advogada · São Paulo/SP" */
  linha: string;
  /** só no próprio perfil: para o botão "Criar post" */
  eu?: Eu;
  hashtags?: string[];
  exigirHashtag?: boolean;
}

const ABAS: { id: AbaPerfil; rotulo: string }[] = [
  { id: "tudo", rotulo: "Tudo" },
  { id: "sobre", rotulo: "Sobre" },
  { id: "fotos", rotulo: "Fotos" },
];

/** A mensagem de erro do envio de imagem vem com travessão; aqui vira vírgula. */
function mensagem(e: unknown): string {
  const m =
    e instanceof Error ? e.message : "Não foi possível enviar a imagem.";
  return m.replace(/\s+—\s+/g, ", ");
}

export function TopoPerfil(p: TopoPerfilProps) {
  const router = useRouter();
  const [enviando, setEnviando] = useState<"capa" | "foto" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  /** recado depois de publicar (post retido pela moderação ou com comentários travados) */
  const [aviso, setAviso] = useState<string | null>(null);
  const inputCapa = useRef<HTMLInputElement>(null);
  const inputFoto = useRef<HTMLInputElement>(null);
  const criar = useRef<CriarPostRef>(null);

  const trocar = async (arquivo: File | undefined, qual: "capa" | "foto") => {
    if (!arquivo) return;
    setErro(null);
    setEnviando(qual);
    try {
      const { url } = await subirImagem(
        arquivo,
        qual === "capa" ? "perfilcapa" : "avatar",
      );
      const r = await salvarCamposPerfil(
        qual === "capa" ? { capa_url: url } : { avatar_url: url },
      );
      if (r.erro) throw new Error(r.erro);
      router.refresh();
    } catch (e) {
      setErro(mensagem(e));
    } finally {
      setEnviando(null);
    }
  };

  const removerCapa = async () => {
    setErro(null);
    setEnviando("capa");
    try {
      const r = await salvarCamposPerfil({ capa_url: "" });
      if (r.erro) throw new Error(r.erro);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : "Não foi possível remover a capa. Tente de novo.");
    } finally {
      setEnviando(null);
    }
  };

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${p.base}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt(
        "Copie o link do perfil:",
        `${window.location.origin}${p.base}`,
      );
    }
  };

  const capa = p.capa.trim();
  const cor = p.corCapa.trim();

  return (
    <header className="rc-perfil-topo">
      <div className="rc-perfil-miolo">
        {/* a caixa não corta o que sai dela: o menu de "Editar foto da capa" abre
            para baixo, por cima do nome; só a imagem (rc-perfil-capa) é cortada */}
        <div className="rc-perfil-capa-caixa">
          <div
            className="rc-perfil-capa"
            style={
              !capa && cor && corDeCapaValida(cor)
                ? { background: cor }
                : undefined
            }
          >
            {capa ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={capa} alt="" />
            ) : cor && corDeCapaValida(cor) ? null : (
              <CapaPadrao />
            )}
          </div>
          {p.ehMeu && (
            <div className="rc-perfil-capa-acao">
              {capa ? (
                <Menu
                  rotulo="Foto da capa"
                  gatilho={({ aberto, alternar }) => (
                    <button
                      type="button"
                      className="rc-btn rc-perfil-btn-capa"
                      aria-expanded={aberto}
                      aria-label={enviando === "capa" ? "Enviando a capa" : "Editar foto da capa"}
                      aria-busy={enviando === "capa" || undefined}
                      onClick={alternar}
                      disabled={enviando !== null}
                    >
                      <IcoRC.camera />
                      <span>
                        {enviando === "capa"
                          ? "Enviando…"
                          : "Editar foto da capa"}
                      </span>
                    </button>
                  )}
                >
                  {(fechar) => (
                    <>
                      <ItemMenu
                        icone={<IcoRC.imagem />}
                        onClick={() => {
                          fechar();
                          inputCapa.current?.click();
                        }}
                      >
                        Enviar outra foto
                      </ItemMenu>
                      <ItemMenu
                        icone={<IcoRC.lixo />}
                        perigo
                        onClick={() => {
                          fechar();
                          void removerCapa();
                        }}
                      >
                        Remover a capa
                      </ItemMenu>
                    </>
                  )}
                </Menu>
              ) : (
                <button
                  type="button"
                  className="rc-btn rc-perfil-btn-capa"
                  aria-label={enviando === "capa" ? "Enviando a capa" : "Adicionar foto da capa"}
                  aria-busy={enviando === "capa" || undefined}
                  onClick={() => inputCapa.current?.click()}
                  disabled={enviando !== null}
                >
                  <IcoRC.camera />
                  <span>
                    {enviando === "capa"
                      ? "Enviando…"
                      : "Adicionar foto da capa"}
                  </span>
                </button>
              )}
              <input
                ref={inputCapa}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  void trocar(e.target.files?.[0], "capa");
                  e.target.value = "";
                }}
              />
            </div>
          )}
        </div>

        <div className="rc-perfil-ident">
          <div className="rc-perfil-foto">
            <Avatar nome={p.nome} foto={p.avatar} size={168} />
            {p.ehMeu && (
              <>
                <button
                  type="button"
                  className="rc-icone-btn rc-perfil-btn-foto"
                  aria-label={
                    enviando === "foto"
                      ? "Enviando a foto"
                      : "Trocar a foto de perfil"
                  }
                  title="Trocar a foto de perfil"
                  onClick={() => inputFoto.current?.click()}
                  disabled={enviando !== null}
                >
                  <IcoRC.camera />
                </button>
                <input
                  ref={inputFoto}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => {
                    void trocar(e.target.files?.[0], "foto");
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>

          <div className="rc-perfil-quem">
            <h1 className="rc-perfil-nome">
              <span>{p.nome}</span>
              {p.verificado && <SeloVerificado size="lg" />}
            </h1>
            <p className="rc-perfil-selos">
              <TagNivel qualificacao={p.qualificacao} size="md" />
              {p.daCoordenacao && (
                <span className="rc-perfil-coord">
                  <IcoRC.escudo /> Coordenação
                </span>
              )}
            </p>
            {p.linha && <p className="rc-perfil-linha">{p.linha}</p>}
          </div>

          {p.ehMeu && p.eu && (
            <div className="rc-perfil-botoes">
              <button
                type="button"
                className="rc-btn rc-btn-primario"
                onClick={() => criar.current?.abrir()}
              >
                <IcoRC.mais /> Criar post
              </button>
              <Link
                href={`${p.base}?aba=sobre`}
                className="rc-btn rc-btn-neutro"
                scroll={false}
              >
                <IcoRC.lapis /> Editar perfil
              </Link>
              <CriarPost
                ref={criar}
                eu={p.eu}
                hashtags={p.hashtags}
                exigirHashtag={p.exigirHashtag}
                onPublicado={setAviso}
              />
            </div>
          )}
        </div>

        {erro && (
          <p className="rc-perfil-erro rc-erro-texto" role="alert">
            {erro}
          </p>
        )}

        {aviso && (
          <div className="rc-cartao rc-aviso rc-perfil-aviso" role="status">
            <IcoRC.info />
            <p>{aviso}</p>
            <button
              type="button"
              className="rc-aviso-fechar"
              aria-label="Fechar o aviso"
              onClick={() => setAviso(null)}
            >
              <IcoRC.x />
            </button>
          </div>
        )}

        <div className="rc-perfil-abas-linha">
          <nav className="rc-perfil-abas" aria-label="Seções do perfil">
            {ABAS.map((a) => (
              <Link
                key={a.id}
                href={a.id === "tudo" ? p.base : `${p.base}?aba=${a.id}`}
                className="rc-perfil-aba"
                aria-current={a.id === p.aba ? "page" : undefined}
                scroll={false}
              >
                {a.rotulo}
              </Link>
            ))}
          </nav>
          <Menu
            rotulo="Mais opções do perfil"
            gatilho={({ aberto, alternar }) => (
              <button
                type="button"
                className="rc-btn rc-btn-neutro rc-perfil-mais"
                aria-label="Mais opções"
                aria-expanded={aberto}
                onClick={alternar}
              >
                <IcoRC.pontos />
              </button>
            )}
          >
            {(fechar) => (
              <ItemMenu
                icone={<IcoRC.link />}
                onClick={() => {
                  void copiarLink();
                  setTimeout(fechar, 900);
                }}
              >
                {copiado ? "Link copiado" : "Copiar link do perfil"}
              </ItemMenu>
            )}
          </Menu>
        </div>
      </div>
    </header>
  );
}
