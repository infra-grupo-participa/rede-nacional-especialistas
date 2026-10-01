import Link from "next/link";
import { listarFeed, listarFixados, meusPostsRetidos, type OrdemFeed } from "@/comunidade/lib/feed";
import { rankingAutores } from "@/comunidade/lib/ranking";
import { exigirMembro } from "@/comunidade/lib/sessao";
import { configComunidade } from "@/comunidade/lib/gestao";
import { C, F, BORDA } from "@/lib/tokens";
import { FeedCliente, type SessaoFeed } from "@/comunidade/components/feed-cliente";

export const dynamic = "force-dynamic";

/* Discussão: a primeira coisa que o membro vê ao entrar. Escrever, posts em
   destaque, o feed (novos posts ou atividade recente) e, ao lado, o "Sobre". */
export default async function DiscussaoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ordem: OrdemFeed = sp.ordem === "atividade" ? "atividade" : "novos";
  const perfil = await exigirMembro();

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

  const sobre = (
    <section key="sobre" className="rounded-2xl p-4" style={{ background: C.surface, border: BORDA }}>
      <h2 className="text-[17px]" style={{ fontFamily: F.serif, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Sobre
      </h2>
      <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: C.ink }}>
        A comunidade dos alunos do Time Holding Brasil: dúvidas, casos e materiais de quem trabalha com holding.
      </p>
      <dl className="mt-3 space-y-3 text-[14px]">
        <div>
          <dt className="font-semibold">Privado</dt>
          <dd style={{ color: C.muted }}>Só membros aprovados veem quem participa e o que é publicado.</dd>
        </div>
        <div>
          <dt className="font-semibold">Entrada com aprovação</dt>
          <dd style={{ color: C.muted }}>Quem pede para entrar responde um questionário e a coordenação confere se é aluno.</dd>
        </div>
      </dl>
      <Link
        href="/comunidade/regras"
        className="press mt-4 flex items-center justify-center rounded-xl text-[14px] font-semibold"
        style={{ height: 40, background: C.paper, color: C.ink, border: BORDA }}
      >
        Ler as regras
      </Link>
    </section>
  );

  return (
    <FeedCliente
      postsIniciais={posts}
      fixados={fixados}
      ordem={ordem}
      ranking={ranking}
      sessao={sessao}
      hashtags={config.hashtags}
      exigirHashtag={config.exigir_hashtag}
      retidos={retidos}
      lateral={sobre}
    />
  );
}
