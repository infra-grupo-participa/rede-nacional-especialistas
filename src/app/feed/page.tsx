import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { listarFeed } from "@/lib/feed";
import { getPerfilAtual } from "@/lib/auth";
import { FeedCliente, type SessaoFeed } from "@/components/feed-cliente";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const [posts, perfil] = await Promise.all([listarFeed(), getPerfilAtual()]);

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
      <header
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}
      >
        <Link href="/" className="flex items-center gap-2" aria-label="Voltar à vitrine">
          <Ico.back style={{ width: 18, height: 18 }} />
          <span
            className="text-[18px] font-semibold"
            style={{ color: C.ink, fontFamily: F.serif, letterSpacing: "-0.01em" }}
          >
            Feed
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="rounded-full px-3.5 text-[13px] font-semibold"
            style={{ height: 36, background: C.surface, color: C.ink, lineHeight: "36px" }}
          >
            Vitrine
          </Link>
          {sessao.primeiroNome ? (
            <Link
              href="/conta"
              className="rounded-full px-3.5 text-[13px] font-semibold"
              style={{ height: 36, background: C.surface, color: C.ink, lineHeight: "36px" }}
            >
              {sessao.primeiroNome}
            </Link>
          ) : (
            <Link
              href="/entrar"
              className="rounded-full px-3.5 text-[13px] font-semibold"
              style={{ height: 36, background: C.surface, color: C.ink, lineHeight: "36px" }}
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      <FeedCliente postsIniciais={posts} sessao={sessao} />
    </main>
  );
}
