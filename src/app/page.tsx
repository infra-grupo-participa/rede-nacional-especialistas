import { contagemPorUf, facetasBusca } from "@/lib/queries";
import { listarPublicados } from "@/lib/artigos";
import { getPerfilAtual } from "@/lib/auth";
import { Vitrine, type SessaoInfo } from "@/components/vitrine";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [contagem, facetas, artigos, perfil] = await Promise.all([
    contagemPorUf(),
    facetasBusca(),
    listarPublicados(24),
    getPerfilAtual(),
  ]);

  const sessao: SessaoInfo = {
    nome: perfil?.nome ?? null,
    primeiroNome: perfil ? perfil.nome.split(" ")[0] : null,
    isAdmin: perfil?.papel === "admin" && perfil?.status === "aprovado",
    aprovado: perfil?.status === "aprovado",
  };

  return <Vitrine contagem={contagem} facetas={facetas} artigos={artigos} sessao={sessao} />;
}
