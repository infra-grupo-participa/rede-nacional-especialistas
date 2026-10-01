import { TopoComunidade } from "@/comunidade/components/topo";
import { CabecalhoGrupo } from "@/comunidade/components/cabecalho-grupo";
import { contadoresCoordenacao } from "@/comunidade/lib/gestao";
import { amostraMembros, contarMembros, hrefMembro } from "@/comunidade/lib/grupo";
import { getEmailLogin, type PerfilRede } from "@/comunidade/lib/sessao";

/* Casco da comunidade para o membro aprovado: barra do topo, cabeçalho do
   grupo (capa, nome, fotos, botões e abas) e, embaixo, a seção da vez. */
export async function CascaMembros({ perfil, children }: { perfil: PerfilRede; children: React.ReactNode }) {
  const isAdmin = perfil.papel === "admin";
  const [membros, amostra, contadores, emailLogin] = await Promise.all([
    contarMembros(),
    amostraMembros(20),
    isAdmin ? contadoresCoordenacao() : null,
    getEmailLogin(),
  ]);
  const pendencias = contadores ? contadores.pedidos + contadores.retidos : 0;

  return (
    <div className="rc-app">
      <TopoComunidade
        sessao={{
          logado: true,
          aprovado: true,
          isAdmin,
          nome: perfil.nome,
          primeiroNome: perfil.nome.split(" ")[0],
          avatar: perfil.avatar_url || null,
          slug: perfil.slug ?? null,
          email: emailLogin ?? perfil.email ?? null,
        }}
        perfilHref={hrefMembro({ slug: perfil.slug, id: perfil.id })}
        pendencias={pendencias}
      />
      <CabecalhoGrupo
        membros={membros}
        amostra={amostra.map((m) => ({ id: m.id, slug: m.slug, nome: m.nome, avatar_url: m.avatar_url || null }))}
        isAdmin={isAdmin}
        pendencias={pendencias}
      />
      {children}
    </div>
  );
}
