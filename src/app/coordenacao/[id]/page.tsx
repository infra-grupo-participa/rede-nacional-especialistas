import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { Avatar } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { Capa, Chapeu, TagStatus, BlocosLidos } from "@/components/artigo/atoms-artigo";
import { AcoesRevisao } from "@/components/coordenacao/acoes-revisao";
import { getPerfilAtual } from "@/lib/auth";
import { artigoParaRevisao, chapeuDe, tempoLeitura } from "@/lib/artigos";
import { dataCurta } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RevisaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfil = await getPerfilAtual();
  if (!perfil) redirect("/entrar");
  if (perfil.papel !== "admin" || perfil.status !== "aprovado") redirect("/");

  const a = await artigoParaRevisao(id);
  if (!a) notFound();
  const autor = a.autor;

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}>
        <Link href="/coordenacao" aria-label="Voltar" className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 44, color: C.ink }}>
          <Ico.back style={{ width: 21, height: 21 }} />
        </Link>
        <div className="min-w-0 flex-1 text-[13px]" style={{ color: C.sobreFundo, fontFamily: F.mono }}>
          Revisão
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 pb-32 pt-5">
        {/* status + autor */}
        <div className="flex items-center gap-2">
          <TagStatus status={a.status} />
          {a.enviado_em && (
            <span className="text-[12px]" style={{ color: C.muted, fontFamily: F.mono }}>
              enviado em {dataCurta(a.enviado_em)}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <Avatar nome={autor.nome} foto={autor.avatar_url} size={44} />
          <span className="min-w-0">
            <span className="block truncate text-[15px]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600 }}>
              {autor.nome}
            </span>
            <span className="block truncate text-[13px]" style={{ color: C.muted }}>
              {[autor.profissao, autor.espaco].filter(Boolean).join(" · ")}
            </span>
          </span>
        </div>

        {a.status === "ajustes" && a.motivo && (
          <div className="mt-3 rounded-2xl p-4" style={{ background: "#FBEDEC" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#A33F37" }}>
              Ajustes já pedidos
            </p>
            <p className="mt-1 text-[14px]" style={{ color: "#7A2F29" }}>
              {a.motivo}
            </p>
          </div>
        )}

        {/* o artigo */}
        <article className="mt-5">
          <Capa titulo={a.titulo} capa={a.capa} variante="alta" />
          <div className="mt-4">
            <Chapeu>{chapeuDe(a)}</Chapeu>
          </div>
          <h1 className="mt-2 text-[26px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 600 }}>
            {a.titulo || "Sem título"}
          </h1>
          {a.resumo && (
            <p className="mt-2 text-[16px]" style={{ color: C.muted }}>
              {a.resumo}
            </p>
          )}
          <p className="mt-3 text-[13px]" style={{ color: C.muted, fontFamily: F.mono }}>
            {tempoLeitura(a)} min de leitura
          </p>
          <div className="my-5" style={{ borderTop: `1px solid ${C.line}` }} />
          <BlocosLidos blocos={a.blocos} />
        </article>
      </div>

      {a.status !== "publicado" && <AcoesRevisao artigoId={a.id} />}
    </main>
  );
}
