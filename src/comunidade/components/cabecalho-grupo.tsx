"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/comunidade/components/atoms";
import { IcoRC } from "@/comunidade/components/icones";
import { DivisorMenu, ItemMenu, Menu } from "@/comunidade/components/ui";
import { BarraAbas } from "@/comunidade/components/grupo/barra-abas";
import { CapaGrupo } from "@/comunidade/components/grupo/capa";
import { JanelaCompartilhar, JanelaConvidar } from "@/comunidade/components/grupo/janelas";
import { sair } from "@/comunidade/acoes/auth";
import { GRUPO, contagemCurta, hrefMembro, type MembroResumo } from "@/comunidade/lib/grupo-tipos";

/* Cabeçalho do grupo, como no Facebook: capa (só na Discussão), nome,
   "Grupo privado · N membros", a fileira de fotos, os botões Convidar /
   Compartilhar / Entrou e, embaixo, a barra de abas (que gruda no topo ao
   rolar). Nas outras abas o cabeçalho começa no nome. */

/** O que a fileira de fotos precisa de cada membro. */
export type FotoMembro = Pick<MembroResumo, "id" | "slug" | "nome" | "avatar_url">;

export function CabecalhoGrupo({
  membros,
  amostra,
  isAdmin,
  pendencias = 0,
}: {
  /** total de membros do grupo */
  membros: number;
  /** alguns membros para a fileira de fotos (até 20) */
  amostra: FotoMembro[];
  isAdmin: boolean;
  /** pedidos de entrada + posts retidos esperando a coordenação */
  pendencias?: number;
}) {
  const caminho = usePathname() ?? "/comunidade";
  const naDiscussao = (caminho.replace(/\/+$/, "") || "/comunidade") === "/comunidade";

  const [janela, setJanela] = useState<"convidar" | "compartilhar" | null>(null);
  const fecharJanela = useCallback(() => setJanela(null), []);
  const abrirCompartilhar = useCallback(() => setJanela("compartilhar"), []);

  // No perfil de um membro a página é o perfil (capa, foto, abas do perfil),
  // como no Facebook: o cabeçalho do grupo não aparece.
  if (caminho.startsWith("/comunidade/membro/")) return null;

  return (
    <>
      <section className="rc-grupo" aria-label={GRUPO.nome}>
        {naDiscussao && <CapaGrupo />}

        <div className="rc-grupo-miolo">
          {naDiscussao ? (
            <h1 className="rc-grupo-nome">{GRUPO.nome}</h1>
          ) : (
            <p className="rc-grupo-nome">
              <Link href="/comunidade">{GRUPO.nome}</Link>
            </p>
          )}
          <p className="rc-grupo-meta">
            <IcoRC.cadeado />
            <span>Grupo privado</span>
            <span aria-hidden="true">·</span>
            <Link href="/comunidade/membros">
              {contagemCurta(membros)} {membros === 1 ? "membro" : "membros"}
            </Link>
          </p>

          <div className="rc-grupo-linha">
            {amostra.length > 0 && (
              <ul className="rc-grupo-fotos" aria-label="Alguns membros do grupo">
                {amostra.slice(0, 20).map((m) => (
                  <li key={m.id}>
                    <Link href={hrefMembro(m)} className="rc-anel" aria-label={m.nome} title={m.nome}>
                      <Avatar nome={m.nome} foto={m.avatar_url} size={36} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="rc-grupo-acoes">
              <button type="button" className="rc-btn rc-btn-primario rc-grupo-convidar" onClick={() => setJanela("convidar")}>
                <IcoRC.mais />
                Convidar
              </button>
              <button type="button" className="rc-btn rc-btn-neutro" onClick={abrirCompartilhar}>
                <IcoRC.compartilhar />
                Compartilhar
              </button>
              <Menu
                rotulo="Você no grupo"
                lado="direita"
                gatilho={({ aberto, alternar }) => (
                  <button type="button" className="rc-btn rc-btn-neutro" aria-haspopup="menu" aria-expanded={aberto} onClick={alternar}>
                    <IcoRC.entrou />
                    Entrou
                    <IcoRC.setaBaixo className="rc-btn-seta" />
                  </button>
                )}
              >
                {(fechar) => (
                  <>
                    <ItemMenu icone={<IcoRC.conteudo />} href="/comunidade/seu-conteudo" onClick={fechar}>
                      Seu conteúdo
                    </ItemMenu>
                    <ItemMenu icone={<IcoRC.regras />} href="/comunidade/sobre#regras" onClick={fechar}>
                      Regras do grupo
                    </ItemMenu>
                    <DivisorMenu />
                    <form action={sair}>
                      <button type="submit" className="rc-menu-item" role="menuitem">
                        <IcoRC.sair />
                        <span>Sair da conta</span>
                      </button>
                    </form>
                  </>
                )}
              </Menu>
            </div>
          </div>
        </div>
      </section>

      <BarraAbas isAdmin={isAdmin} pendencias={pendencias} onCompartilhar={abrirCompartilhar} />

      {/* As janelas ficam fora da barra de abas (que cria camada própria ao
          grudar), para cobrir também a barra do topo. */}
      <JanelaConvidar aberto={janela === "convidar"} onFechar={fecharJanela} />
      <JanelaCompartilhar aberto={janela === "compartilhar"} onFechar={fecharJanela} membros={membros} />
    </>
  );
}
