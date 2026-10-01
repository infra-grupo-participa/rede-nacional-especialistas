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

      {/* cabeçalho editorial — largura de leitura confortável */}
      <div className="mx-auto px-5 pt-8 text-center" style={{ maxWidth: 720 }}>
        <Chapeu>{chapeuDe(a)}</Chapeu>
        <h1 className="mx-auto mt-3 text-[34px] leading-[1.12] md:text-[42px]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 700, letterSpacing: "-0.025em" }}>
          {a.titulo}
        </h1>
        {a.resumo && (
          <p className="mx-auto mt-4 max-w-2xl text-[19px] leading-relaxed" style={{ color: C.muted }}>
            {a.resumo}
          </p>
        )}

        {/* meta: autor + data + tempo */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href={`/especialista/${autor.slug ?? autor.id}`} className="press flex items-center gap-2.5">
            <Avatar nome={autor.nome} foto={autor.avatar_url} size={40} />
            <span className="text-left">
              <span className="block text-[14px]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600 }}>
                {autor.nome}
              </span>
              <span className="block text-[12px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
                {dataPonto(a.publicado_em ?? a.criado_em)} · {tempoLeitura(a)} min
                {a.leituras > 0 ? ` · ${a.leituras.toLocaleString("pt-BR")} leituras` : ""}
              </span>
            </span>
          </Link>
        </div>
      </div>

      {/* capa grande sangrada */}
      <div className="mx-auto mt-8 px-4" style={{ maxWidth: 920 }}>
        <div className="overflow-hidden rounded-3xl">
          <Capa titulo={a.titulo} capa={a.capa} variante="alta" />
        </div>
      </div>

      {/* corpo — coluna de leitura */}
      <div className="mx-auto px-5 pb-10 pt-8" style={{ maxWidth: 680 }}>
        <article>
          <BlocosLidos blocos={a.blocos} />

          {/* CTA WhatsApp */}
          {autor.whatsapp && (
            <div className="mt-12 rounded-3xl p-6 text-center" style={{ background: C.paper }}>
              <Avatar nome={autor.nome} foto={autor.avatar_url} size={56} />
              <p className="mt-3 text-[16px] leading-relaxed" style={{ color: C.ink }}>
                Quer conversar com <strong>{primeiroNome}</strong> sobre este assunto?
              </p>
              <div className="mx-auto mt-4 max-w-xs">
                <Botao full variante="whats" href={waLink(autor.whatsapp, autor.nome)} icone={<Ico.wa style={{ width: 19, height: 19 }} />}>
                  Falar no WhatsApp
                </Botao>
              </div>
              <div className="mt-2 flex justify-center">
                <CopiarLink />
              </div>
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
