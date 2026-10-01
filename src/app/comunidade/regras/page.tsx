import type { Metadata } from "next";
import Link from "next/link";
import { CascaMembros } from "@/comunidade/components/casca";
import { ThemeToggle } from "@/components/theme-toggle";
import { IcoRC } from "@/comunidade/components/icones";
import { BlocoRegras } from "@/comunidade/components/paginas/bloco-regras";
import { getPerfilAtual } from "@/comunidade/lib/sessao";
import { configComunidade } from "@/comunidade/lib/gestao";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Regras da comunidade",
};

/* Regras do grupo (base da moderação). Texto editado pela coordenação em
   Coordenação > Regras. Pública de propósito: quem pede entrada precisa ler
   antes de aceitar. O membro aprovado vê a mesma lista dentro do grupo. */
export default async function RegrasPage() {
  const [perfil, config] = await Promise.all([getPerfilAtual(), configComunidade()]);

  // Membro aprovado lê as regras dentro da comunidade (aba Sobre).
  if (perfil?.status === "aprovado") {
    return (
      <CascaMembros perfil={perfil}>
        <main className="rc-pg">
          <div className="rc-pg-coluna">
            <div className="rc-pg-cabeca" style={{ paddingTop: 0 }}>
              <Link href="/comunidade/sobre" className="rc-btn rc-btn-fantasma" style={{ marginLeft: -8, paddingLeft: 8, paddingRight: 12 }}>
                <IcoRC.voltar /> Sobre o grupo
              </Link>
            </div>
            <BlocoRegras config={config} comLinks />
          </div>
        </main>
      </CascaMembros>
    );
  }

  // Visitante ou quem ainda espera a aprovação: página simples, com a volta.
  const volta = perfil ? "/comunidade/aguardando" : "/comunidade/entrar";
  return (
    <div className="rc-app">
      <header className="rc-pg-visitante-topo">
        <Link href={volta} className="rc-pg-visitante-marca">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/thb-logo-96.png" alt="Time Holding Brasil" />
          <span>Rede de Especialistas</span>
        </Link>
        <ThemeToggle />
        <Link href={volta} className="rc-btn rc-btn-primario">
          {perfil ? "Meu pedido de entrada" : "Entrar"}
        </Link>
      </header>
      <main className="rc-pg">
        <div className="rc-pg-coluna">
          <div className="rc-pg-cabeca">
            <h1 className="rc-pg-titulo" style={{ fontSize: 24 }}>
              Regras da comunidade
            </h1>
            <p className="rc-pg-texto-apoio" style={{ marginTop: 6 }}>
              A coordenação usa estas regras para reter, travar ou remover publicações. Leia antes de pedir a entrada.
            </p>
          </div>
          <BlocoRegras config={config} />
        </div>
      </main>
    </div>
  );
}
