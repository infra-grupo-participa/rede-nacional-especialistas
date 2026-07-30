import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Avatar, Placa } from "@/components/atoms";
import { SeloNivel } from "@/components/niveis";
import { Ico } from "@/components/icons";
import type { PerfilCard } from "@/lib/queries";

/* Cópia fiel do CardMembro do MVP (App.jsx 665): o card inteiro é clicável, com
   Ico.selo (certificado), SeloNivel na linha da cidade e chevron à direita.
   Sem botão WhatsApp lateral (não existe no MVP). No Next o clique é um Link. */
export function CardMembro({ m, ativo }: { m: PerfilCard; ativo?: boolean }) {
  const href = `/especialista/${m.slug ?? m.id}`;
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left transition-colors"
      style={{ background: C.surface, border: `1px solid ${ativo ? C.petrol : C.line}`, minHeight: 88 }}
    >
      <Avatar nome={m.nome} foto={m.avatar_url} size={56} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span
            className="truncate text-[17px] leading-tight"
            style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}
          >
            {m.nome}
          </span>
          {m.certificado && <Ico.selo style={{ width: 15, height: 15, color: C.brass, flexShrink: 0 }} />}
        </span>
        {m.profissao && (
          <span className="mt-0.5 block truncate text-[14px] font-medium" style={{ color: C.ink }}>
            {m.profissao}
          </span>
        )}
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[13px]" style={{ color: C.muted }}>
            {m.cidade}
          </span>
          {m.uf && <Placa uf={m.uf} size="sm" />}
          <SeloNivel q={m.qualificacao} />
        </span>
      </span>
      <Ico.chevron style={{ width: 18, height: 18, color: C.muted, flexShrink: 0 }} />
    </Link>
  );
}
