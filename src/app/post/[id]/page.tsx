import Link from "next/link";
import { notFound } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Avatar, TagNivel, SeloVerificado } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { TopNav } from "@/components/topnav";
import { PostAcoes } from "@/components/post-acoes";
import { Comentarios } from "@/components/comentarios";
import { postPorId } from "@/lib/feed";
import { getPerfilAtual, getSessaoNav } from "@/lib/auth";
import { dataCurta } from "@/lib/utils";

export const dynamic = "force-dynamic";

/* Página do post completo (resolve o "ver o post por completo" + o 404 de rota
   individual). Sem truncar o texto; data por extenso; comentários abertos. */
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, perfil, nav] = await Promise.all([postPorId(id), getPerfilAtual(), getSessaoNav()]);
  // O feed é fechado: quem não é membro aprovado não enxerga o post (RLS). Em
  // vez de um 404 seco, explica e leva para a entrada.
  if (!post && perfil?.status !== "aprovado") {
    return (
      <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
        <TopNav sessao={nav} />
        <div className="mx-auto max-w-md px-5 pt-16 text-center">
          <h1 className="text-[24px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 700 }}>
            Este post é exclusivo dos alunos
          </h1>
          <p className="mt-3 text-[15px]" style={{ color: C.muted }}>
            Entre com sua conta de aluno do Time Holding Brasil para ler e comentar.
          </p>
          <Link
            href={perfil ? "/aguardando" : "/entrar"}
            className="press mt-6 inline-flex items-center justify-center rounded-xl px-6 text-[15px] font-semibold"
            style={{ height: 52, background: C.laranja, color: C.ink }}
          >
            {perfil ? "Ver meu pedido de entrada" : "Entrar"}
          </Link>
        </div>
      </main>
    );
  }
  if (!post) notFound();

  const logado = !!perfil;
  const isAdmin = perfil?.papel === "admin" && perfil?.status === "aprovado";
  const souAutor = perfil?.id === post.autor.id;
  const href = `/especialista/${post.autor.slug ?? post.autor.id}`;
  const subtitulo = post.autor.headline || post.autor.profissao || "";

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <TopNav sessao={nav} voltar="/feed" />

      <div className="mx-auto max-w-2xl px-4 pb-16 pt-5">
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
              meuPerfilId={perfil?.id ?? null}
              travado={post.comentarios_travados}
              motivoTrava={post.travado_motivo}
            />
          </div>
        </article>
      </div>
    </main>
  );
}
