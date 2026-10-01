import { TopoComunidade } from "@/comunidade/components/topo";
import { CabecalhoGrupo } from "@/comunidade/components/cabecalho-grupo";
import { contadoresCoordenacao } from "@/comunidade/lib/gestao";
import { totalMembros } from "@/comunidade/lib/ranking";
import type { PerfilRede } from "@/comunidade/lib/sessao";

/* Casco da comunidade para o membro aprovado: barra do topo, cabeçalho do
   grupo com as abas e, embaixo, a seção da vez. */
export async function CascaMembros({ perfil, children }: { perfil: PerfilRede; children: React.ReactNode }) {
  const isAdmin = perfil.papel === "admin";
  const [membros, contadores] = await Promise.all([totalMembros(), isAdmin ? contadoresCoordenacao() : null]);

  return (
    <div className="rc-app">
      <TopoComunidade
        sessao={{
          logado: true,
          aprovado: true,
          isAdmin,
          nome: perfil.nome,
          primeiroNome: perfil.nome.split(" ")[0],
          avatar: perfil.avatar_url ?? null,
          slug: perfil.slug ?? null,
          email: perfil.email ?? null,
        }}
      />
      <CabecalhoGrupo membros={membros} isAdmin={isAdmin} pendencias={contadores ? contadores.pedidos + contadores.retidos : 0} />
      {children}
    </div>
  );
}
