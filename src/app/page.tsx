import { contagemPorUf } from "@/lib/queries";
import { getPerfilAtual } from "@/lib/auth";
import { Vitrine, type SessaoInfo } from "@/components/vitrine";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [contagem, perfil] = await Promise.all([contagemPorUf(), getPerfilAtual()]);

  const sessao: SessaoInfo = {
    nome: perfil?.nome ?? null,
    primeiroNome: perfil ? perfil.nome.split(" ")[0] : null,
    isAdmin: perfil?.papel === "admin" && perfil?.status === "aprovado",
    aprovado: perfil?.status === "aprovado",
  };

  return <Vitrine contagem={contagem} sessao={sessao} />;
}
