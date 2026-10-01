"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IcoRC } from "@/comunidade/components/icones";
import { ItemMenu, Menu } from "@/comunidade/components/ui";
import { abaDe, hrefBusca, type AbaGrupo } from "@/comunidade/components/grupo/rotas";

/* Barra de abas do grupo. Fica presa logo abaixo da barra do topo quando a
   página rola. À direita, dois botões quadrados: a lupa (troca as abas por um
   campo de busca) e o "…" (seu conteúdo, compartilhar, regras). No celular as
   abas rolam na horizontal e os dois botões ficam fixos à direita. */

const ABAS: { id: AbaGrupo; rotulo: string; href: string }[] = [
  { id: "sobre", rotulo: "Sobre", href: "/comunidade/sobre" },
  { id: "discussao", rotulo: "Discussão", href: "/comunidade" },
  { id: "destaques", rotulo: "Em destaque", href: "/comunidade/destaques" },
  { id: "perguntas", rotulo: "Perguntas abertas", href: "/comunidade/perguntas" },
  { id: "membros", rotulo: "Membros", href: "/comunidade/membros" },
  { id: "midia", rotulo: "Mídia", href: "/comunidade/midia" },
  { id: "arquivos", rotulo: "Arquivos", href: "/comunidade/arquivos" },
];

export function BarraAbas({
  isAdmin,
  pendencias = 0,
  onCompartilhar,
}: {
  isAdmin: boolean;
  /** pedidos de entrada + posts retidos esperando a coordenação */
  pendencias?: number;
  onCompartilhar: () => void;
}) {
  const caminho = usePathname() ?? "/comunidade";
  const router = useRouter();
  const ativa = abaDe(caminho);
  const trilho = useRef<HTMLElement>(null);
  const lupa = useRef<HTMLButtonElement>(null);

  const [buscando, setBuscando] = useState(false);
  const [texto, setTexto] = useState("");

  // Trocou de página: as abas voltam ao lugar do campo de busca.
  const [caminhoVisto, setCaminhoVisto] = useState(caminho);
  if (caminhoVisto !== caminho) {
    setCaminhoVisto(caminho);
    setBuscando(false);
    setTexto("");
  }

  // No celular a aba ativa pode estar fora da tela: traz para o meio do trilho.
  useEffect(() => {
    const nav = trilho.current;
    const aba = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && aba) nav.scrollLeft = aba.offsetLeft - (nav.clientWidth - aba.offsetWidth) / 2;
  }, [ativa, buscando]);

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    router.push(hrefBusca(texto));
  };

  const abas = isAdmin ? [...ABAS, { id: "coordenacao" as const, rotulo: "Coordenação", href: "/comunidade/coordenacao" }] : ABAS;

  return (
    <div className="rc-abas-barra">
      <div className="rc-abas-miolo">
        {buscando ? (
          <form className="rc-abas-busca" role="search" onSubmit={buscar}>
            <IcoRC.busca />
            <input
              type="search"
              name="q"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setBuscando(false);
                  lupa.current?.focus();
                }
              }}
              placeholder="Pesquisar neste grupo"
              aria-label="Pesquisar neste grupo"
              autoComplete="off"
              enterKeyHint="search"
              maxLength={80}
              autoFocus
            />
          </form>
        ) : (
          <nav ref={trilho} className="rc-abas" aria-label="Seções do grupo">
            {abas.map((a) => {
              const n = a.id === "coordenacao" ? pendencias : 0;
              return (
                <Link key={a.id} href={a.href} className="rc-aba" aria-current={a.id === ativa ? "page" : undefined}>
                  {a.rotulo}
                  {n > 0 && (
                    <span className="rc-aba-n" aria-label={`${n} ${n === 1 ? "pendência" : "pendências"}`}>
                      {n > 99 ? "99+" : n}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="rc-abas-ferramentas">
          <button
            ref={lupa}
            type="button"
            className="rc-quadrado"
            aria-label={buscando ? "Fechar a busca" : "Pesquisar neste grupo"}
            title={buscando ? "Fechar a busca" : "Pesquisar neste grupo"}
            aria-expanded={buscando}
            onClick={() => setBuscando((v) => !v)}
          >
            {buscando ? <IcoRC.x /> : <IcoRC.busca />}
          </button>
          <Menu
            rotulo="Mais opções do grupo"
            lado="direita"
            gatilho={({ aberto, alternar }) => (
              <button type="button" className="rc-quadrado" aria-label="Mais opções do grupo" title="Mais opções" aria-haspopup="menu" aria-expanded={aberto} onClick={alternar}>
                <IcoRC.pontos />
              </button>
            )}
          >
            {(fechar) => (
              <>
                <ItemMenu icone={<IcoRC.conteudo />} href="/comunidade/seu-conteudo" onClick={fechar}>
                  Seu conteúdo
                </ItemMenu>
                <ItemMenu
                  icone={<IcoRC.compartilhar />}
                  onClick={() => {
                    fechar();
                    onCompartilhar();
                  }}
                >
                  Compartilhar
                </ItemMenu>
                <ItemMenu icone={<IcoRC.regras />} href="/comunidade/sobre#regras" onClick={fechar}>
                  Regras do grupo
                </ItemMenu>
              </>
            )}
          </Menu>
        </div>
      </div>
    </div>
  );
}
