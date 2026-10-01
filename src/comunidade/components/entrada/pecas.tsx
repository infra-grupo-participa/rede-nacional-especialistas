import Link from "next/link";
import { ArteRede } from "@/comunidade/components/entrada/arte";
import { ThemeToggle } from "@/components/theme-toggle";

/* Peças comuns às telas de entrada da Rede de Especialistas. */

/** Claro ou escuro, no canto da tela. O claro é o padrão; a escolha fica salva
 *  no aparelho e vale também para dentro da comunidade. */
export function BotaoTema() {
  return (
    <div className="rc-e-tema">
      <ThemeToggle />
    </div>
  );
}

/** Assinatura da marca no pé do painel (o lugar do "Meta" na referência). */
export function MarcaTHB() {
  return (
    <span className="rc-e-marca">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/thb-logo-96.png" alt="" />
      Time Holding Brasil
    </span>
  );
}

/** Coluna da marca no desktop: logo no alto, colagem no centro e chamada embaixo. */
export function VitrineMarca() {
  return (
    <section className="rc-e-vitrine" aria-label="Rede de Especialistas do Time Holding Brasil">
      <Link href="/comunidade/entrar" className="rc-e-vitrine-logo" aria-label="Rede de Especialistas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/thb-logo-240.png" alt="Time Holding Brasil" />
      </Link>
      <ArteRede />
      <p className="rc-e-chamada">
        Converse com
        <br />
        quem vive holding
        <br />
        <em>todo dia.</em>
      </p>
    </section>
  );
}

/** Rodapé do desktop. */
export function RodapeEntrada() {
  return (
    <footer className="rc-e-rodape">
      <Link href="/comunidade/criar-conta">Criar conta</Link>
      <Link href="/comunidade/entrar">Entrar</Link>
      <Link href="/comunidade/recuperar">Esqueci a senha</Link>
      <Link href="/comunidade/regras">Regras da comunidade</Link>
      <Link href="/">Blog do Time Holding Brasil</Link>
      <span>Time Holding Brasil © {new Date().getFullYear()}</span>
    </footer>
  );
}

export function SetaVoltar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }} aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
