"use client";

import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Placa } from "@/components/atoms";
import { Ico } from "@/components/icons";
import type { Estado } from "@/lib/estados";

export function LinhaEstado({ estado, n }: { estado: Estado; n: number }) {
  const vazio = n === 0;
  const conteudo = (
    <>
      <Placa uf={estado.uf} />
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[16px] font-semibold leading-tight"
          style={{ color: C.ink }}
        >
          {estado.nome}
        </span>
        <span className="block text-[13px]" style={{ color: C.muted, fontFamily: F.mono }}>
          {vazio ? "em breve" : `${n} ${n === 1 ? "especialista" : "especialistas"}`}
        </span>
      </span>
      {!vazio && (
        <Ico.chevron style={{ width: 18, height: 18, color: C.muted, flexShrink: 0 }} />
      )}
    </>
  );

  const style = {
    minHeight: 64,
    background: C.surface,
    border: `1px solid ${C.line}`,
    opacity: vazio ? 0.55 : 1,
  } as const;

  if (vazio) {
    return (
      <div
        className="flex w-full items-center gap-3 rounded-2xl px-3 text-left"
        style={style}
      >
        {conteudo}
      </div>
    );
  }

  return (
    <Link
      href={`/estado/${estado.uf}`}
      className="card-hover flex w-full items-center gap-3 rounded-2xl px-3 text-left"
      style={style}
    >
      {conteudo}
    </Link>
  );
}
