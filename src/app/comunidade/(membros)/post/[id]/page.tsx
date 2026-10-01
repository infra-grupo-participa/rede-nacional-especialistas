import Link from "next/link";
import { notFound } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Avatar, TagNivel, SeloVerificado } from "@/comunidade/components/atoms";
import { Ico } from "@/components/icons";
import { PostAcoes } from "@/comunidade/components/post-acoes";
import { Comentarios } from "@/comunidade/components/comentarios";
import { postPorId } from "@/comunidade/lib/feed";
import { exigirMembro } from "@/comunidade/lib/sessao";
import { dataCurta } from "@/lib/utils";

export const dynamic = "force-dynamic";

/* Página do post completo (resolve o "ver o post por completo" + o 404 de rota
   individual). Sem truncar o texto; data por extenso; comentários abertos. */
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, perfil] = await Promise.all([postPorId(id), exigirMembro()]);
  if (!post) notFound();

  const logado = true;
  const isAdmin = perfil.papel === "admin";
  const souAutor = perfil.id === post.autor.id;
  const href = `/especialista/${post.autor.slug ?? post.autor.id}`;
  const subtitulo = post.autor.headline || post.autor.profissao || "";

  return (
    <main>
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-4">
        <Link href="/comunidade" className="press mb-3 inline-flex items-center gap-1.5 rounded-full pr-3 text-[14px] font-semibold" style={{ height: 36, color: C.muted }}>
          <Ico.back style={{ width: 18, height: 18 }} /> Discussão
        </Link>
        <article className="overflow-hidden rounded-2xl" style={{ background: C.surface, border: BORDA }}>
          {/* cabeçalho */}
          <div className="flex items-center gap-3 px-5 pt-5">
            <Link href={href} className="shrink-0">
              <Avatar nome={post.autor.nome} foto={post.autor.avatar_url} size={48} />
            </Link>
            <div className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-1.5">
                <Link href={href} className="truncate text-[16px] leading-tight" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
                  {post.autor.nome}
                </Link>
                {post.autor.verificado && <SeloVerificado size="md" />}
                <TagNivel qualificacao={post.autor.qualificacao} size="md" />
              </span>
              {subtitulo && (
                <span className="block truncate text-[13px]" style={{ color: C.muted }}>
                  {subtitulo}
                </span>
              )}
            </div>
          </div>

          {/* título + corpo completo (sem truncar) */}
          <div className="px-5 pt-3">
            {post.titulo && (
              <h1 className="mb-2 text-[24px] leading-snug" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 700, letterSpacing: "-0.02em" }}>
                {post.titulo}
              </h1>
            )}
            {post.corpo && (
              <p className="whitespace-pre-wrap text-[17px]" style={{ color: C.ink, lineHeight: 1.7 }}>
                {post.corpo}
              </p>
            )}
          </div>

          {post.imagem_url && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.imagem_url} alt="" style={{ width: "100%", maxHeight: 560, objectFit: "cover", display: "block" }} />
            </div>
          )}

          {/* data por extenso */}
          <p className="px-5 pt-4 text-[13px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
            {dataCurta(post.criado_em)}
          </p>

          {/* ações (curtir/comentar/compartilhar) */}
          <div className="mt-3 px-3">
            <PostAcoes post={post} logado={logado} souAutor={souAutor} isAdmin={isAdmin} semComentarInline />
          </div>

          {/* comentários abertos */}
          <div className="px-5 pb-5">
            <Comentarios
              postId={post.id}
              logado={logado}
              isAdmin={isAdmin}
              meuPerfilId={perfil.id}
              travado={post.comentarios_travados}
              motivoTrava={post.travado_motivo}
            />
          </div>
        </article>
      </div>
    </main>
  );
}
