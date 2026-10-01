"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IcoRC } from "@/comunidade/components/icones";
import { MenuConta } from "@/comunidade/components/grupo/menu-conta";
import { abaDe, hrefBusca, ROTA_BUSCA } from "@/comunidade/components/grupo/rotas";
import { salvarConta } from "@/comunidade/lib/conta-salva";
import type { SessaoNav } from "@/comunidade/lib/sessao";

/* Barra do topo da Rede de Especialistas, no jeito do Facebook: à esquerda o
   logo e a busca; no centro (só em tela larga) os ícones de navegação com o
   traço laranja no ativo; à direita o avatar, que abre o menu da conta. */

type Secao = "inicio" | "membros" | "midia" | "arquivos" | "coordenacao";

const NAVEGACAO: { id: Secao; rotulo: string; href: string; Icone: (typeof IcoRC)[keyof typeof IcoRC] }[] = [
  { id: "inicio", rotulo: "Início", href: "/comunidade", Icone: IcoRC.casa },
  { id: "membros", rotulo: "Membros", href: "/comunidade/membros", Icone: IcoRC.pessoas },
  { id: "midia", rotulo: "Mídia", href: "/comunidade/midia", Icone: IcoRC.imagem },
  { id: "arquivos", rotulo: "Arquivos", href: "/comunidade/arquivos", Icone: IcoRC.pasta },
];

/** Ícone do centro que acende em cada caminho (as abas de posts contam como Início). */
function secaoDe(caminho: string): Secao | null {
  const aba = abaDe(caminho);
  if (aba === "discussao" || aba === "destaques" || aba === "perguntas") return "inicio";
  if (aba === "membros" || aba === "midia" || aba === "arquivos" || aba === "coordenacao") return aba;
  return null;
}

export function TopoComunidade({
  sessao,
  perfilHref,
  pendencias = 0,
}: {
  sessao: SessaoNav;
  /** perfil de quem está logado, dentro da comunidade */
  perfilHref: string;
  /** pedidos de entrada + posts retidos esperando a coordenação (só admin) */
  pendencias?: number;
}) {
  const caminho = usePathname() ?? "/comunidade";
  const router = useRouter();
  const ativa = secaoDe(caminho);
  const campo = useRef<HTMLInputElement>(null);
  const lupa = useRef<HTMLButtonElement>(null);
  const buscaEsteveAberta = useRef(false);

  const [texto, setTexto] = useState("");
  /* no celular a busca é um botão de lupa que abre o campo por cima da barra */
  const [buscaAberta, setBuscaAberta] = useState(false);

  // Trocou de página: fecha a busca do celular e, fora da busca, limpa o campo.
  const [caminhoVisto, setCaminhoVisto] = useState(caminho);
  if (caminhoVisto !== caminho) {
    setCaminhoVisto(caminho);
    setBuscaAberta(false);
    if (!caminho.startsWith(ROTA_BUSCA)) setTexto("");
  }

  // Abriu: o foco vai para o campo. Fechou: volta para a lupa.
  useEffect(() => {
    if (buscaAberta) {
      buscaEsteveAberta.current = true;
      campo.current?.focus();
    } else if (buscaEsteveAberta.current) {
      buscaEsteveAberta.current = false;
      lupa.current?.focus();
    }
  }, [buscaAberta]);

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    campo.current?.blur();
    setBuscaAberta(false);
    router.push(hrefBusca(texto));
  };

  const itens = sessao.isAdmin
    ? [...NAVEGACAO, { id: "coordenacao" as const, rotulo: "Coordenação", href: "/comunidade/coordenacao", Icone: IcoRC.escudo }]
    : NAVEGACAO;

  return (
    <header className="rc-topo" data-busca={buscaAberta ? "aberta" : undefined}>
      <div className="rc-topo-esq">
        <Link href="/comunidade" className="rc-topo-logo" aria-label="Rede de Especialistas, início" title="Início">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/thb-logo-96.png" alt="" width={48} height={48} />
        </Link>
        <button type="button" className="rc-icone-btn rc-topo-voltar" aria-label="Fechar a busca" onClick={() => setBuscaAberta(false)}>
          <IcoRC.voltar />
        </button>
        <form className="rc-topo-busca" role="search" action={ROTA_BUSCA} onSubmit={buscar}>
          <IcoRC.busca />
          <input
            ref={campo}
            type="search"
            name="q"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setBuscaAberta(false);
            }}
            placeholder="Pesquisar na Rede"
            aria-label="Pesquisar na Rede"
            autoComplete="off"
            enterKeyHint="search"
            maxLength={80}
          />
        </form>
        <button ref={lupa} type="button" className="rc-icone-btn rc-topo-lupa" aria-label="Pesquisar na Rede" aria-expanded={buscaAberta} onClick={() => setBuscaAberta(true)}>
          <IcoRC.busca />
        </button>
      </div>

      <nav className="rc-topo-nav" aria-label="Navegação da Rede">
        {itens.map(({ id, rotulo, href, Icone }) => {
          const n = id === "coordenacao" ? pendencias : 0;
          return (
            <Link
              key={id}
              href={href}
              className="rc-topo-nav-item"
              aria-current={id === ativa ? "page" : undefined}
              aria-label={n ? `${rotulo}, ${n} ${n === 1 ? "pendência" : "pendências"}` : rotulo}
              title={rotulo}
            >
              <Icone />
              {n > 0 && <span className="rc-topo-nav-n">{n > 99 ? "99+" : n}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="rc-topo-dir">
        <MenuConta nome={sessao.nome ?? "Membro"} avatar={sessao.avatar} perfilHref={perfilHref} />
      </div>
      <LembrarConta sessao={sessao} />
    </header>
  );
}

/* Guarda nome, foto e e-mail neste aparelho para a tela de entrada oferecer
   "Continuar" na próxima vez. Nunca guarda senha nem sessão. */
export function LembrarConta({ sessao }: { sessao: Pick<SessaoNav, "nome" | "email" | "avatar"> }) {
  const { nome, email, avatar } = sessao;
  useEffect(() => {
    if (nome && email) salvarConta({ nome, email, avatar });
  }, [nome, email, avatar]);
  return null;
}
