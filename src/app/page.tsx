import { contagemPorUf, facetasBusca } from "@/lib/queries";
import { listarPublicados } from "@/lib/artigos";
import { getSessaoNav } from "@/lib/auth";
import { Vitrine } from "@/components/vitrine";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [contagem, facetas, artigos, sessao] = await Promise.all([
    contagemPorUf(),
    facetasBusca(),
    listarPublicados(24),
    getSessaoNav(),
  ]);

  return <Vitrine contagem={contagem} facetas={facetas} artigos={artigos} sessao={sessao} />;
}
