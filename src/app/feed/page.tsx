import { listarFeed } from "@/lib/feed";
import { rankingAutores } from "@/lib/queries";
import { getPerfilAtual, getSessaoNav } from "@/lib/auth";
import { C } from "@/lib/tokens";
import { TopNav } from "@/components/topnav";
import { FeedCliente, type SessaoFeed } from "@/components/feed-cliente";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const [posts, ranking, perfil, nav] = await Promise.all([
    listarFeed(),
    rankingAutores(8),
    getPerfilAtual(),
    getSessaoNav(),
  ]);

  const sessao: SessaoFeed = {
    perfilId: perfil?.id ?? null,
    primeiroNome: perfil ? perfil.nome.split(" ")[0] : null,
    nome: perfil?.nome ?? null,
    avatar: perfil?.avatar_url ?? null,
    aprovado: perfil?.status === "aprovado",
    isAdmin: perfil?.papel === "admin" && perfil?.status === "aprovado",
  };

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <TopNav sessao={nav} />
      <FeedCliente postsIniciais={posts} ranking={ranking} sessao={sessao} />
    </main>
  );
}
