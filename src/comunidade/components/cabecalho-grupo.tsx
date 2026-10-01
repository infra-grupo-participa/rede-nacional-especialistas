"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* Cabeçalho do grupo, como no Facebook: capa (só na discussão), nome,
   "Grupo privado · N membros" e as abas. A aba ativa sai da rota. */

type Aba = "discussao" | "arquivos" | "regras" | "coordenacao";

function abaDe(caminho: string): Aba {
  if (caminho.startsWith("/comunidade/arquivos")) return "arquivos";
  if (caminho.startsWith("/comunidade/regras")) return "regras";
  if (caminho.startsWith("/comunidade/coordenacao")) return "coordenacao";
  return "discussao";
}

export function CabecalhoGrupo({
  membros,
  isAdmin,
  pendencias = 0,
}: {
  membros: number;
  isAdmin: boolean;
  /** pedidos de entrada + posts retidos esperando a coordenação */
  pendencias?: number;
}) {
  const caminho = usePathname() ?? "/comunidade";
  const ativa = abaDe(caminho);
  const naDiscussao = caminho === "/comunidade";

  const abas: { id: Aba; rotulo: string; href: string; n?: number }[] = [
    { id: "discussao", rotulo: "Discussão", href: "/comunidade" },
    { id: "arquivos", rotulo: "Arquivos e mídias", href: "/comunidade/arquivos" },
    { id: "regras", rotulo: "Regras", href: "/comunidade/regras" },
  ];
  if (isAdmin) abas.push({ id: "coordenacao", rotulo: "Coordenação", href: "/comunidade/coordenacao", n: pendencias });

  return (
    <div className="rc-grupo">
      <div className="rc-grupo-miolo">
        {naDiscussao && (
          <div className="rc-capa">
            <p className="rc-capa-texto">
              Quem vive holding <b>todo dia.</b>
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/thb-logo.png" alt="" />
          </div>
        )}
        <div className="rc-grupo-nome">
          <h1>Rede Nacional de Especialistas</h1>
          <p className="rc-grupo-meta">
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }} aria-hidden="true">
              <path d="M17 9V7A5 5 0 007 7v2a3 3 0 00-3 3v7a3 3 0 003 3h10a3 3 0 003-3v-7a3 3 0 00-3-3zM9 7a3 3 0 016 0v2H9V7z" />
            </svg>
            Grupo privado · {membros.toLocaleString("pt-BR")} {membros === 1 ? "membro" : "membros"}
          </p>
        </div>
        <nav className="rc-abas" aria-label="Seções da comunidade">
          {abas.map((a) => (
            <Link key={a.id} href={a.href} className="rc-aba" aria-current={a.id === ativa ? "page" : undefined}>
              {a.rotulo}
              {!!a.n && <span className="rc-aba-n">{a.n}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
