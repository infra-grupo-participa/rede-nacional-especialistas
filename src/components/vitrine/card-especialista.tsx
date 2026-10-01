import Link from "next/link";
import { C, F, BORDA } from "@/lib/tokens";
import { Avatar, Placa } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { waLink } from "@/lib/utils";
import { rotuloProfissao } from "@/lib/profissoes-permitidas";
import type { EspecialistaCatalogo } from "@/lib/queries";

/* Card aprofundado do catálogo: apresentação de cada especialista.
   headline como chamada; se não houver, cai num resumo derivado (profissão +
   cidade). Especialidades e atividade dão corpo. Todo o card leva ao perfil. */
export function CardEspecialista({ m }: { m: EspecialistaCatalogo }) {
  const href = `/especialista/${m.slug ?? m.id}`;
  const prof = rotuloProfissao(m.profissao);
  const especialidades = Array.isArray(m.especialidades) ? m.especialidades : [];

  // Apresentação: headline > bio (1ª linha) > resumo derivado dos campos.
  const resumoDerivado =
    `${prof}${m.cidade ? ` em ${m.cidade}` : ""}${m.uf ? `/${m.uf}` : ""}`.trim();
  const apresentacao =
    m.headline?.trim() ||
    m.bio?.trim().split("\n")[0] ||
    resumoDerivado;

  return (
    <div className="card-hover group flex h-full flex-col overflow-hidden rounded-2xl" style={{ background: C.surface, border: BORDA }}>
      <div style={{ height: 52, background: `linear-gradient(120deg, ${C.petrolSoft}, ${C.surface})` }} />

      <Link href={href} className="flex flex-1 flex-col px-4 pb-3" aria-label={`Ver perfil de ${m.nome}`}>
        <div className="-mt-8 flex items-end justify-between">
          <span className="rounded-full" style={{ padding: 3, background: C.surface }}>
            <Avatar nome={m.nome} foto={m.avatar_url} size={62} />
          </span>
          {m.certificado && (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: C.brassSoft, color: C.brass, border: "1px solid #EADFCE" }}>
              <Ico.selo style={{ width: 12, height: 12 }} /> Certificado
            </span>
          )}
        </div>

        <p className="mt-2.5 truncate text-[17px] leading-tight" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
          {m.nome}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: C.petrolDeep }}>
          {prof}
        </p>

        {/* apresentação (2 linhas) */}
        <p className="mt-2 text-[13.5px] leading-snug" style={{ color: C.sobreFundo, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {apresentacao}
        </p>

        {/* localização */}
        {m.cidade && (
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px]" style={{ color: C.muted }}>
            {m.uf && <Placa uf={m.uf} size="sm" />}
            <span className="truncate">{m.cidade}</span>
          </p>
        )}

        {/* especialidades (até 3) */}
        {especialidades.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {especialidades.slice(0, 3).map((e, i) => (
              <span key={i} className="rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold" style={{ background: C.petrolSoft, color: C.petrolDeep }}>
                {e}
              </span>
            ))}
            {especialidades.length > 3 && (
              <span className="rounded-full px-2 py-0.5 text-[11.5px] font-semibold" style={{ color: C.muted }}>
                +{especialidades.length - 3}
              </span>
            )}
          </div>
        )}

        {/* atividade na rede */}
        {(m.n_posts > 0 || m.n_artigos > 0) && (
          <p className="mt-2.5 flex items-center gap-3 text-[12px]" style={{ color: C.muted }}>
            {m.n_posts > 0 && (
              <span className="inline-flex items-center gap-1">
                <Ico.balao style={{ width: 13, height: 13 }} /> {m.n_posts} {m.n_posts === 1 ? "publicação" : "publicações"}
              </span>
            )}
            {m.n_artigos > 0 && (
              <span className="inline-flex items-center gap-1">
                <Ico.livro style={{ width: 13, height: 13 }} /> {m.n_artigos} {m.n_artigos === 1 ? "artigo" : "artigos"}
              </span>
            )}
          </p>
        )}

        <span className="mt-auto" />
      </Link>

      {m.whatsapp && (
        <div className="px-4 pb-4">
          <a href={waLink(m.whatsapp, m.nome)} target="_blank" rel="noopener noreferrer" className="press flex w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold" style={{ height: 44, background: C.ink, color: "#fff" }}>
            <Ico.wa style={{ width: 17, height: 17 }} /> Falar no WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
