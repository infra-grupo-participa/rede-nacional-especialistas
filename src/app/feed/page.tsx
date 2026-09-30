import Link from "next/link";
import { listarFeed, listarFixados, meusPostsRetidos, type OrdemFeed } from "@/lib/feed";
import { rankingAutores } from "@/lib/queries";
import { getPerfilAtual, getSessaoNav } from "@/lib/auth";
import { configComunidade } from "@/lib/gestao";
import { C, F, BORDA } from "@/lib/tokens";
import { TopNav } from "@/components/topnav";
import { FeedCliente, type SessaoFeed } from "@/components/feed-cliente";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ordem: OrdemFeed = sp.ordem === "atividade" ? "atividade" : "novos";
  const [perfil, nav] = await Promise.all([getPerfilAtual(), getSessaoNav()]);
  const aprovado = perfil?.status === "aprovado";

  // Comunidade fechada, como o grupo privado do Facebook: só membro aprovado
  // lê o feed. A RLS garante o mesmo no banco; aqui é só a mensagem certa.
  if (!aprovado) {
    return (
      <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
        <TopNav sessao={nav} />
        <div className="mx-auto max-w-md px-5 pt-16 text-center">
          <p className="uppercase" style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: ".14em", color: C.sobreFundo }}>
            Comunidade THB
          </p>
          <h1 className="mt-2 text-[26px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 700 }}>
            O feed é exclusivo dos alunos
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.muted }}>
            {perfil
              ? "Seu acesso ainda não foi liberado. Responda o questionário de entrada para a coordenação analisar."
              : "Entre com sua conta de aluno do Time Holding Brasil para ver e participar das conversas."}
          </p>
          <Link
            href={perfil ? "/aguardando" : "/entrar"}
            className="press mt-6 inline-flex items-center justify-center rounded-xl px-6 text-[15px] font-semibold"
            style={{ height: 52, background: C.laranja, color: C.ink }}
          >
            {perfil ? "Ver meu pedido de entrada" : "Entrar"}
          </Link>
          <p className="mt-4 text-[13px]" style={{ color: C.muted }}>
            <Link href="/regras" style={{ color: C.petrolDeep, fontWeight: 600 }}>
              Ler as regras da comunidade
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const [posts, fixados, ranking, config, retidos] = await Promise.all([
    listarFeed(ordem),
    listarFixados(),
    rankingAutores(8),
    configComunidade(),
    meusPostsRetidos(perfil.id),
  ]);

  const sessao: SessaoFeed = {
    perfilId: perfil.id,
    primeiroNome: perfil.nome.split(" ")[0],
    nome: perfil.nome,
    avatar: perfil.avatar_url ?? null,
    aprovado: true,
    isAdmin: perfil.papel === "admin",
  };

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <TopNav sessao={nav} />
      <FeedCliente
        postsIniciais={posts}
        fixados={fixados}
        ordem={ordem}
        ranking={ranking}
        sessao={sessao}
        hashtags={config.hashtags}
        exigirHashtag={config.exigir_hashtag}
        retidos={retidos}
      />
      <p className="pb-10 text-center text-[13px]" style={{ color: C.muted }}>
        <Link href="/regras" style={{ color: C.petrolDeep, fontWeight: 600, borderBottom: BORDA }}>
          Regras da comunidade
        </Link>
      </p>
    </main>
  );
}
