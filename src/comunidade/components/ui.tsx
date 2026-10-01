"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { IcoRC } from "@/comunidade/components/icones";

/* Peças de interface comuns da comunidade: janela (diálogo) e menu suspenso.
   Os estilos ficam em src/app/comunidade/base.css (.rc-dialogo*, .rc-menu*). */

/* ------------------------------------------------------------- Dialogo -- */
/** Janela centralizada (no celular sobe de baixo). Fecha no X, no Esc e no
 *  clique fora. Trava a rolagem da página enquanto está aberta. */
export function Dialogo({
  aberto,
  onFechar,
  titulo,
  largura = 500,
  children,
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  /** largura máxima em px no desktop */
  largura?: number;
  children: ReactNode;
}) {
  const idTitulo = useId();
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", esc);
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    caixa.current?.focus();
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = rolagem;
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;
  return (
    <div
      className="rc-dialogo-fundo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div ref={caixa} className="rc-dialogo" role="dialog" aria-modal="true" aria-labelledby={idTitulo} tabIndex={-1} style={{ maxWidth: largura, outline: "none" }}>
        <div className="rc-dialogo-topo">
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="rc-icone-btn rc-dialogo-fechar" aria-label="Fechar" onClick={onFechar}>
            <IcoRC.x />
          </button>
        </div>
        <div className="rc-dialogo-corpo">{children}</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Menu -- */
/** Menu suspenso. `gatilho` desenha o botão (recebe `aberto` e `alternar`);
 *  `children` recebe `fechar` para os itens fecharem o menu ao agir. Fecha no
 *  clique fora e no Esc. */
export function Menu({
  gatilho,
  children,
  lado = "direita",
  rotulo,
}: {
  gatilho: (p: { aberto: boolean; alternar: () => void }) => ReactNode;
  children: (fechar: () => void) => ReactNode;
  /** borda do gatilho em que o menu se alinha */
  lado?: "direita" | "esquerda";
  /** nome do menu para leitor de tela */
  rotulo?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  return (
    <div ref={ref} className="rc-menu-ancora">
      {gatilho({ aberto, alternar: () => setAberto((v) => !v) })}
      {aberto && (
        <div className="rc-menu" role="menu" aria-label={rotulo} data-lado={lado}>
          {children(() => setAberto(false))}
        </div>
      )}
    </div>
  );
}

/** Item de menu: link (com `href`) ou botão (com `onClick`). `sub` é a linha
 *  de apoio em letra menor. */
export function ItemMenu({
  icone,
  children,
  sub,
  href,
  onClick,
  perigo,
  disabled,
  externo,
}: {
  icone?: ReactNode;
  children: ReactNode;
  sub?: ReactNode;
  href?: string;
  onClick?: () => void;
  perigo?: boolean;
  disabled?: boolean;
  /** abre em nova aba */
  externo?: boolean;
}) {
  const miolo = (
    <>
      {icone}
      <span style={{ minWidth: 0 }}>
        {children}
        {sub && <small>{sub}</small>}
      </span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="rc-menu-item" role="menuitem" data-perigo={perigo || undefined} onClick={onClick} target={externo ? "_blank" : undefined}>
        {miolo}
      </Link>
    );
  }
  return (
    <button type="button" className="rc-menu-item" role="menuitem" data-perigo={perigo || undefined} onClick={onClick} disabled={disabled}>
      {miolo}
    </button>
  );
}

export function DivisorMenu() {
  return <div className="rc-menu-divisor" role="separator" />;
}
