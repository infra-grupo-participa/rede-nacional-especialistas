import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Avatar } from "@/components/atoms";
import { Eyebrow } from "@/components/atoms";
import { dataPonto } from "@/lib/utils";
import { chapeuDe, tempoLeitura, type ArtigoComAutor } from "@/lib/artigos";
import { Capa, Chapeu } from "@/components/artigo/atoms-artigo";

/* Cartões de listagem de artigos, portados do MVP (App.jsx §5.5). Cada um é um
   link para /artigo/[slug]. */

function hrefDe(a: ArtigoComAutor) {
  return `/artigo/${a.slug ?? a.id}`;
}

/* ------------------------------------------------------------ Assinatura --- */
export function Assinatura({ a, size = 26 }: { a: ArtigoComAutor; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar nome={a.autor.nome} foto={a.autor.avatar_url} size={size} />
      <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: C.muted }}>
        <strong style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600 }}>
          {a.autor.nome}
        </strong>
        {a.autor.profissao && ` · ${a.autor.profissao}`}
      </span>
      <span
        className="shrink-0 text-[12px]"
        style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}
      >
        {tempoLeitura(a)} min
      </span>
    </div>
  );
}

/* ---------------------------------------------------------- CartaoDestaque -- */
export function CartaoDestaque({ a }: { a: ArtigoComAutor }) {
  return (
    <Link href={hrefDe(a)} className="block">
      <article className="overflow-hidden rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <Capa titulo={a.titulo} capa={a.capa} variante="destaque" />
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Chapeu>{chapeuDe(a)}</Chapeu>
            <span className="text-[11px]" style={{ color: C.muted, fontFamily: F.mono }}>
              · {dataPonto(a.publicado_em ?? a.criado_em)}
            </span>
          </div>
          <h3
            className="mt-2 text-[21px] leading-tight linha3"
            style={{ fontFamily: F.serif, fontWeight: 600, color: C.ink }}
          >
            {a.titulo}
          </h3>
          {a.resumo && (
            <p className="mt-1.5 text-[14px] leading-snug linha3" style={{ color: C.muted }}>
              {a.resumo}
            </p>
          )}
          <div className="mt-3">
            <Assinatura a={a} size={26} />
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ---------------------------------------------------------- LinhaEditorial -- */
export function LinhaEditorial({ a }: { a: ArtigoComAutor }) {
  return (
    <Link href={hrefDe(a)} className="block">
      <article className="flex gap-3 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <div style={{ width: 96, flexShrink: 0 }}>
          <Capa titulo={a.titulo} capa={a.capa} variante="miniatura" />
        </div>
        <div className="min-w-0 flex-1">
          <Chapeu>{chapeuDe(a)}</Chapeu>
          <h3
            className="mt-0.5 text-[15px] leading-tight linha3"
            style={{ fontFamily: F.serif, fontWeight: 600, color: C.ink }}
          >
            {a.titulo}
          </h3>
          {a.resumo && (
            <p className="mt-1 text-[13px] leading-snug linha2" style={{ color: C.muted }}>
              {a.resumo}
            </p>
          )}
          <p
            className="mt-1.5 text-[11px]"
            style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}
          >
            {a.autor.nome} · {dataPonto(a.publicado_em ?? a.criado_em)} · {tempoLeitura(a)} min
          </p>
        </div>
      </article>
    </Link>
  );
}

/* ------------------------------------------------------------ CartaoArtigo -- */
/* Coluna (grade desktop). */
export function CartaoArtigo({ a }: { a: ArtigoComAutor }) {
  return (
    <Link href={hrefDe(a)} className="flex">
      <article
        className="flex w-full flex-col overflow-hidden rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <Capa titulo={a.titulo} capa={a.capa} variante="baixa" />
        <div className="flex flex-1 flex-col p-3.5">
          <div className="flex items-center gap-2">
            <Chapeu>{chapeuDe(a)}</Chapeu>
            <span className="text-[11px]" style={{ color: C.muted, fontFamily: F.mono }}>
              · {dataPonto(a.publicado_em ?? a.criado_em)}
            </span>
          </div>
          <h3
            className="mt-1.5 text-[17px] leading-tight linha3"
            style={{ fontFamily: F.serif, fontWeight: 600, color: C.ink }}
          >
            {a.titulo}
          </h3>
          {a.resumo && (
            <p className="mt-1 text-[13px] leading-snug linha2" style={{ color: C.muted }}>
              {a.resumo}
            </p>
          )}
          <div className="mt-auto pt-3">
            <Assinatura a={a} size={24} />
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ------------------------------------------------------------ BlocoMaisLidos */
export function BlocoMaisLidos({ artigos }: { artigos: ArtigoComAutor[] }) {
  const top = [...artigos]
    .sort((x, y) => y.leituras - x.leituras)
    .slice(0, 5)
    .filter((a) => a.leituras > 0);
  if (top.length === 0) return null;
  return (
    <div className="mt-6 rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      <Eyebrow className="pb-2">Mais lidos da rede</Eyebrow>
      <ol className="space-y-3">
        {top.map((a, i) => (
          <li key={a.id}>
            <Link href={hrefDe(a)} className="flex gap-3">
              <span
                style={{
                  fontFamily: F.serif,
                  fontWeight: 700,
                  fontSize: 26,
                  color: C.laranja,
                  lineHeight: 1,
                  width: 28,
                }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[14px] leading-snug linha2"
                  style={{ fontFamily: F.serif, fontWeight: 600, color: C.ink }}
                >
                  {a.titulo}
                </span>
                <span className="mt-0.5 block text-[12px]" style={{ color: C.muted, fontFamily: F.mono }}>
                  {a.autor.nome} · {a.leituras.toLocaleString("pt-BR")} leituras
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
