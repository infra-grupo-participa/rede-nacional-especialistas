import Link from "next/link";
import { C, F, BORDA } from "@/lib/tokens";
import { Avatar, Eyebrow } from "@/components/atoms";
import { dataPonto } from "@/lib/utils";
import { chapeuDe, tempoLeitura, type ArtigoComAutor } from "@/lib/artigos-tipos";
import { Capa, Chapeu } from "@/components/artigo/atoms-artigo";

/* Cartões de artigo — cópia fiel do MVP (App.jsx 951-1026). No Next cada card é
   um Link para /artigo/[slug]; o resto é idêntico ao MVP. */

function hrefDe(a: ArtigoComAutor) {
  return `/artigo/${a.slug ?? a.id}`;
}

/* ------------------------------------------------------------ Assinatura --- */
export function Assinatura({ a, tamanho = 22 }: { a: ArtigoComAutor; tamanho?: number }) {
  return (
    <span className="mt-2.5 flex items-center gap-2">
      <Avatar nome={a.autor.nome} foto={a.autor.avatar_url} size={tamanho} />
      <span className="min-w-0 flex-1 truncate text-[12px]" style={{ color: C.ink }}>
        <strong style={{ fontWeight: 600 }}>{a.autor.nome}</strong>
        <span style={{ color: C.muted }}> · {a.autor.profissao}</span>
      </span>
      <span className="shrink-0 text-[11px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
        {tempoLeitura(a)} min
      </span>
    </span>
  );
}

/* ---------------------------------------------------------- CartaoDestaque -- */
export function CartaoDestaque({ a }: { a: ArtigoComAutor }) {
  return (
    <Link href={hrefDe(a)} className="card-hover block w-full overflow-hidden rounded-2xl text-left" style={{ background: C.surface, border: BORDA }}>
      <Capa titulo={a.titulo} capa={a.capa} variante="destaque" />
      <span className="block px-4 pb-4 pt-3.5">
        <span className="flex items-baseline gap-2">
          <Chapeu>{chapeuDe(a)}</Chapeu>
          <span className="shrink-0 text-[11px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
            {dataPonto(a.publicado_em ?? a.criado_em)}
          </span>
        </span>
        <span className="mt-1.5 block text-[21px] leading-[1.2]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
          {a.titulo}
        </span>
        {a.resumo && (
          <span className="linha3 mt-2 block text-[14px] leading-relaxed" style={{ color: C.muted }}>
            {a.resumo}
          </span>
        )}
        <Assinatura a={a} tamanho={26} />
      </span>
    </Link>
  );
}

/* ---------------------------------------------------------- LinhaEditorial -- */
export function LinhaEditorial({ a }: { a: ArtigoComAutor }) {
  return (
    <Link href={hrefDe(a)} className="card-hover flex w-full items-start gap-3.5 rounded-2xl p-3.5 text-left" style={{ background: C.surface, border: BORDA }}>
      <span className="shrink-0" style={{ width: 96 }}>
        <Capa titulo={a.titulo} capa={a.capa} variante="miniatura" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <Chapeu>{chapeuDe(a)}</Chapeu>
        </span>
        <span className="linha3 mt-1 block text-[15px] leading-snug" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
          {a.titulo}
        </span>
        {a.resumo && (
          <span className="linha2 mt-1.5 block text-[13px] leading-relaxed" style={{ color: C.muted }}>
            {a.resumo}
          </span>
        )}
        <span className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
          <span className="truncate" style={{ color: C.ink }}>{a.autor.nome}</span>
          <span>· {dataPonto(a.publicado_em ?? a.criado_em)}</span>
          <span>· {tempoLeitura(a)} min</span>
        </span>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------ CartaoArtigo -- */
/* Grade de 3 colunas do desktop. */
export function CartaoArtigo({ a }: { a: ArtigoComAutor }) {
  return (
    <Link href={hrefDe(a)} className="card-hover flex h-full w-full flex-col overflow-hidden rounded-2xl text-left" style={{ background: C.surface, border: BORDA }}>
      <Capa titulo={a.titulo} capa={a.capa} variante="baixa" />
      <span className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3.5">
        <span className="flex items-baseline gap-2">
          <Chapeu>{chapeuDe(a)}</Chapeu>
          <span className="shrink-0 text-[11px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
            {dataPonto(a.publicado_em ?? a.criado_em)}
          </span>
        </span>
        <span className="linha3 mt-1.5 block text-[17px] leading-[1.25]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
          {a.titulo}
        </span>
        {a.resumo && (
          <span className="linha2 mt-2 block text-[13px] leading-relaxed" style={{ color: C.muted }}>
            {a.resumo}
          </span>
        )}
        <span className="mt-auto pt-2">
          <Assinatura a={a} tamanho={24} />
        </span>
      </span>
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
    <div className="mt-6 rounded-2xl p-4" style={{ background: C.surface, border: BORDA }}>
      <Eyebrow className="pb-2">Mais lidos da rede</Eyebrow>
      <ol className="space-y-3">
        {top.map((a, i) => (
          <li key={a.id}>
            <Link href={hrefDe(a)} className="flex gap-3">
              <span style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 26, color: C.laranja, lineHeight: 1, width: 28 }}>
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="linha2 block text-[14px] leading-snug" style={{ fontFamily: F.serif, fontWeight: 600, color: C.ink }}>
                  {a.titulo}
                </span>
                <span className="mt-0.5 block text-[12px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
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
