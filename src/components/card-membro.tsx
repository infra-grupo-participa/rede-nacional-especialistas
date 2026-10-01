import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Avatar, Placa } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { waLink } from "@/lib/utils";
import { rotuloProfissao } from "@/lib/profissoes-permitidas";
import type { PerfilCard } from "@/lib/queries";

/* Card de apresentação do especialista — estilo cartão social. Faixa de topo
   com a cor da marca, avatar sobreposto, nome + profissão canônica, cidade com
   placa, e ação de WhatsApp. Todo o card é clicável (leva ao perfil); o botão
   de WhatsApp é uma ação à parte. */
export function CardMembro({ m }: { m: PerfilCard }) {
  const href = `/especialista/${m.slug ?? m.id}`;
  const prof = rotuloProfissao(m.profissao);

  return (
    <div
      className="card-hover group relative overflow-hidden rounded-2xl"
      style={{ background: C.surface, border: `1px solid ${C.line}` }}
    >
      {/* faixa superior sutil da marca */}
      <div style={{ height: 44, background: `linear-gradient(120deg, ${C.petrolSoft}, #FFFFFF)` }} />

      <Link href={href} className="block px-4 pb-3" aria-label={`Ver perfil de ${m.nome}`}>
        <div className="-mt-7 flex items-end gap-3">
          <span className="rounded-full" style={{ padding: 3, background: C.surface }}>
            <Avatar nome={m.nome} foto={m.avatar_url} size={56} />
          </span>
          {m.certificado && (
            <span
              className="mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: C.brassSoft, color: C.brass, border: `1px solid #EADFCE` }}
            >
              <Ico.selo style={{ width: 12, height: 12 }} /> Certificado
            </span>
          )}
        </div>

        <div className="mt-2">
          <p className="truncate text-[17px] leading-tight" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            {m.nome}
          </p>
          <p className="mt-0.5 text-[13px] font-semibold" style={{ color: C.petrolDeep }}>
            {prof}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            {m.uf && <Placa uf={m.uf} size="sm" />}
            <span className="truncate">{m.cidade}</span>
          </p>
        </div>
      </Link>

      {/* ação de contato */}
      {m.whatsapp && (
        <div className="px-4 pb-4">
          <a
            href={waLink(m.whatsapp, m.nome)}
            target="_blank"
            rel="noopener noreferrer"
            className="press flex w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold"
            style={{ height: 44, background: C.ink, color: "#fff" }}
          >
            <Ico.wa style={{ width: 17, height: 17 }} />
            Falar no WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
