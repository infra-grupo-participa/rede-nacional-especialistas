"use client";

import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Avatar, Placa, TagNivel } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { waLink } from "@/lib/utils";
import type { PerfilCard } from "@/lib/queries";

export function CardMembro({ m }: { m: PerfilCard }) {
  const href = `/especialista/${m.slug ?? m.id}`;
  return (
    <div
      className="flex w-full items-center gap-3.5 rounded-2xl p-3.5"
      style={{ background: C.surface, border: `1px solid ${C.line}`, minHeight: 92 }}
    >
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3.5">
        <Avatar nome={m.nome} foto={m.avatar_url} size={56} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span
              className="truncate text-[17px] leading-tight"
              style={{ color: C.ink, fontFamily: F.serif }}
            >
              {m.nome}
            </span>
            <TagNivel qualificacao={m.qualificacao} size="sm" />
          </span>
          {m.profissao && (
            <span className="mt-0.5 block truncate text-[14px]" style={{ color: C.petrol }}>
              {m.profissao}
            </span>
          )}
          <span className="mt-1 flex items-center gap-1.5">
            <span className="truncate text-[13px]" style={{ color: C.muted }}>
              {m.cidade}
            </span>
            {m.uf && <Placa uf={m.uf} size="sm" />}
          </span>
        </span>
      </Link>
      {m.whatsapp && (
        <a
          href={waLink(m.whatsapp, m.nome)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Falar com ${m.nome} no WhatsApp`}
          className="flex shrink-0 items-center justify-center rounded-xl"
          style={{ width: 44, height: 44, background: C.whats, color: "#fff" }}
        >
          <Ico.wa style={{ width: 20, height: 20 }} />
        </a>
      )}
    </div>
  );
}
