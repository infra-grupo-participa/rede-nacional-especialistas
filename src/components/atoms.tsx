"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { C, F, BORDA } from "@/lib/tokens";
import { iniciais, tintaAvatar } from "@/lib/utils";
import { nivelDe, type Qualificacao } from "@/lib/qualificacoes";

/* ---------------------------------------------------------------- Placa -- */
/* A "placa": sigla do estado em tabular. É o elemento que substitui o mapa. */
export function Placa({
  uf,
  tom = "claro",
  size = "md",
}: {
  uf: string;
  tom?: "claro" | "escuro";
  size?: "sm" | "md";
}) {
  const dims =
    size === "sm" ? { height: 24, padding: "0 6px", fontSize: 12 } : { height: 40, width: 40, fontSize: 14 };
  const cor =
    tom === "escuro"
      ? { background: C.ink, color: "#fff" }
      : { background: C.petrolSoft, color: C.petrolDeep };
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg font-semibold shrink-0"
      style={{
        ...dims,
        ...cor,
        fontFamily: F.mono,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.02em",
      }}
    >
      {uf}
    </span>
  );
}

/* --------------------------------------------------------------- Avatar -- */
export function Avatar({
  nome,
  foto,
  size = 56,
}: {
  nome: string;
  foto?: string | null;
  size?: number;
}) {
  const [bg, fg] = tintaAvatar(nome);
  if (foto) {
    return (
      <Image
        src={foto}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0 select-none"
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontFamily: F.serif,
        fontSize: size * 0.38,
        letterSpacing: "0.01em",
      }}
      aria-hidden="true"
    >
      {iniciais(nome)}
    </span>
  );
}

/* ------------------------------------------------------------- TagNivel -- */
/* Tag de QUALIFICAÇÃO estilizada ao lado do nome. Peça central do produto.
   THB é discreta; Aurum→D.Vermelho ganham brilho e gradiente. */
export function TagNivel({
  qualificacao,
  size = "md",
}: {
  qualificacao: Qualificacao;
  size?: "sm" | "md";
}) {
  const n = nivelDe(qualificacao);
  const alto = n.ordem >= 3; // diamante e diamante vermelho
  const dims =
    size === "sm"
      ? { height: 16, padding: "0 6px", fontSize: 9.5, gap: 3 }
      : { height: 20, padding: "0 8px", fontSize: 11, gap: 4 };

  return (
    <span
      className="inline-flex items-center rounded-full font-bold uppercase shrink-0 align-middle"
      style={{
        ...dims,
        fontFamily: F.mono,
        letterSpacing: "0.04em",
        color: n.texto,
        background: `linear-gradient(135deg, ${n.cor}, ${n.brilho})`,
        border: `1px solid ${n.cor}`,
        boxShadow: alto ? `0 0 0 1px ${n.brilho}55, 0 1px 4px ${n.cor}44` : "none",
      }}
      title={`Qualificação: ${n.rotulo}`}
    >
      {n.ordem >= 1 && (
        <span
          style={{
            width: dims.fontSize * 0.55,
            height: dims.fontSize * 0.55,
            borderRadius: 2,
            background: n.texto,
            opacity: 0.85,
            marginRight: dims.gap,
            transform: "rotate(45deg)",
          }}
        />
      )}
      {n.rotulo}
    </span>
  );
}

/* --------------------------------------------------------------- Eyebrow -- */
export function Eyebrow({
  children,
  className = "",
  sobreFundo,
  style,
}: {
  children: ReactNode;
  className?: string;
  sobreFundo?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`uppercase ${className}`}
      style={{
        fontFamily: F.mono,
        fontVariantNumeric: "tabular-nums",
        fontSize: 11,
        letterSpacing: "0.14em",
        color: sobreFundo ? C.sobreFundo : C.muted,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Tag -- */
export function Tag({
  children,
  tom = "neutro",
}: {
  children: ReactNode;
  tom?: "neutro" | "brass";
}) {
  const estilos: Record<string, CSSProperties> = {
    neutro: { background: C.paper, color: C.muted, border: `1px solid ${C.line}` },
    brass: { background: C.brassSoft, color: C.brass, border: `1px solid #EADFCE` },
  };
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs"
      style={estilos[tom]}
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------- Chip -- */
export function Chip({
  children,
  ativo,
  onClick,
}: {
  children: ReactNode;
  ativo?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-full px-3.5 text-sm transition-colors"
      style={{
        height: 36,
        background: ativo ? C.laranja : C.surface,
        color: C.ink,
        border: `1px solid ${ativo ? C.laranja : C.line}`,
      }}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------- Botao -- */
export function Botao({
  children,
  onClick,
  href,
  variante = "primario",
  full,
  disabled,
  icone,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variante?: "primario" | "whats" | "secundario" | "fantasma";
  full?: boolean;
  disabled?: boolean;
  icone?: ReactNode;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-opacity";
  const estilos: Record<string, CSSProperties> = {
    // sobre laranja a letra é sempre preta (contraste); whats/contato é preto.
    primario: { background: C.laranja, color: C.ink },
    whats: { background: C.ink, color: "#fff" },
    secundario: { background: C.surface, color: C.ink, border: BORDA },
    fantasma: { background: "transparent", color: C.ink },
  };
  const style: CSSProperties = {
    ...estilos[variante],
    height: 52,
    paddingLeft: 20,
    paddingRight: 20,
    opacity: disabled ? 0.4 : 1,
  };
  const className = `${base} ${full ? "w-full" : ""}`;

  if (href && !disabled) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {icone}
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className} style={style}>
      {icone}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------ Segmentado -- */
/* Toggle em pílula com contagem — usado na home (Profissionais / Artigos). */
export function Segmentado({
  abas,
  ativa,
  onTrocar,
}: {
  abas: { id: string; rotulo: string; n?: number }[];
  ativa: string;
  onTrocar: (id: string) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full p-1"
      style={{ background: C.paper, border: BORDA, height: 40 }}
    >
      {abas.map((a) => {
        const on = a.id === ativa;
        return (
          <button
            key={a.id}
            onClick={() => onTrocar(a.id)}
            className="rounded-full px-4 text-[13px] font-semibold transition-colors"
            style={{
              background: on ? C.surface : "transparent",
              color: C.ink,
              border: on ? BORDA : "1px solid transparent",
            }}
          >
            {a.rotulo}
            {typeof a.n === "number" && (
              <span
                className="ml-1.5"
                style={{
                  color: C.muted,
                  fontFamily: F.mono,
                  fontVariantNumeric: "tabular-nums",
                  fontSize: 12,
                }}
              >
                {a.n}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------- Toast -- */
export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div
      className="fixed left-1/2 z-50 rounded-xl px-4 py-3 text-sm text-white"
      style={{ bottom: 96, transform: "translateX(-50%)", background: C.ink, maxWidth: 320 }}
      role="status"
    >
      {msg}
    </div>
  );
}
