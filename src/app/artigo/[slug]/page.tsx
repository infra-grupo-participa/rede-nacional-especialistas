import Link from "next/link";
import { notFound } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Avatar, Botao } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { Capa, Chapeu, BlocosLidos } from "@/components/artigo/atoms-artigo";
import { CopiarLink } from "@/components/artigo/copiar-link";
import { ComentariosArtigo } from "@/components/artigo/comentarios-artigo";
import { artigoPorSlug, chapeuDe, tempoLeitura } from "@/lib/artigos";
import { getPerfilAtual } from "@/lib/auth";
import { incrementarLeitura } from "@/app/artigos/actions";
import { dataPonto, waLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ArtigoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [a, perfil] = await Promise.all([artigoPorSlug(slug), getPerfilAtual()]);
  if (!a) notFound();

  await incrementarLeitura(a.id);

  const autor = a.autor;
  const primeiroNome = autor.nome.split(" ")[0];

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}>
        <Link href="/artigos" aria-label="Voltar" className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 44, color: C.ink }}>
          <Ico.back style={{ width: 21, height: 21 }} />
        </Link>
        <div className="min-w-0 flex-1 text-[13px]" style={{ color: C.sobreFundo, fontFamily: F.mono }}>
          Artigo
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
        <article className="rounded-3xl px-5 pb-8 pt-5" style={{ background: C.surface, border: BORDA }}>
          <Capa titulo={a.titulo} capa={a.capa} variante="alta" />

          <div className="mt-5">
            <Chapeu>{chapeuDe(a)}</Chapeu>
          </div>
          <h1 className="mt-1.5 text-[28px] leading-[1.15]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            {a.titulo}
          </h1>
          {a.resumo && (
            <p className="mt-3 text-[17px] leading-relaxed" style={{ color: C.muted }}>
              {a.resumo}
            </p>
          )}

          <p className="mt-4 text-[12px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
            {dataPonto(a.publicado_em ?? a.criado_em)} · {tempoLeitura(a)} min de leitura
            {a.leituras > 0 ? ` · ${a.leituras.toLocaleString("pt-BR")} leituras` : ""}
          </p>

          {/* cartão do autor — bg paper, sem borda, sem selo (fiel ao MVP) */}
          <Link href={`/especialista/${autor.slug ?? autor.id}`} className="mt-4 flex w-full items-center gap-3 rounded-2xl p-3 text-left" style={{ background: C.paper }}>
            <Avatar nome={autor.nome} foto={autor.avatar_url} size={44} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
                {autor.nome}
              </span>
              <span className="block truncate text-[13px]" style={{ color: C.muted }}>
                {[autor.profissao, autor.cidade].filter(Boolean).join(" · ")}
              </span>
            </span>
            <Ico.chevron style={{ width: 16, height: 16, color: C.muted }} />
          </Link>

          <div className="mt-5" style={{ borderTop: `1px solid ${C.line}` }} />
          <BlocosLidos blocos={a.blocos} />

          {/* CTA WhatsApp */}
          {autor.whatsapp && (
            <div className="mt-10 rounded-2xl p-5" style={{ background: C.paper }}>
              <p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>
                Quer conversar com {primeiroNome} sobre este assunto?
              </p>
              <div className="mt-3">
                <Botao full variante="whats" href={waLink(autor.whatsapp, autor.nome)} icone={<Ico.wa style={{ width: 19, height: 19 }} />}>
                  Falar no WhatsApp
                </Botao>
              </div>
              <CopiarLink />
            </div>
          )}

          {/* comentários dentro do article, como no MVP */}
          <ComentariosArtigo
            artigoId={a.id}
            logado={!!perfil}
            primeiroNome={perfil ? perfil.nome.split(" ")[0] : null}
            isAdmin={perfil?.papel === "admin" && perfil?.status === "aprovado"}
            meuPerfilId={perfil?.id ?? null}
          />
        </article>
      </div>
    </main>
  );
}
