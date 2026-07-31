import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";

/** Retorna o perfil `rede` da sessão atual, ou null se não logado.
 *
 *  Blindagem: se o usuário está logado mas ainda não tem perfil na rede (caso da
 *  equipe @advmais e de quem já existia em outros sistemas GP), provisiona o
 *  perfil na hora via rede.garantir_perfil() — reconcilia com a base THB por
 *  e-mail ou cria um novo. Assim ninguém loga sem poder usar a rede. */
export async function getPerfilAtual(): Promise<Perfil | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Vínculo perfil↔auth é por auth_id (id do perfil é PK própria desde a 0003).
  const { data } = await supabase
    .from("perfis")
    .select("*")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (data) return data as Perfil;

  // Sem perfil: provisiona (idempotente, SECURITY DEFINER) e relê.
  const { error } = await supabase.rpc("garantir_perfil");
  if (error) return null;

  const { data: novo } = await supabase
    .from("perfis")
    .select("*")
    .eq("auth_id", user.id)
    .maybeSingle();

  return (novo as Perfil | null) ?? null;
}

export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

import type { SessaoNav } from "@/components/topnav";

/** Monta a sessão para a barra de navegação (TopNav) a partir do perfil atual. */
export async function getSessaoNav(): Promise<SessaoNav> {
  const p = await getPerfilAtual();
  return {
    logado: !!p,
    aprovado: p?.status === "aprovado",
    isAdmin: p?.papel === "admin" && p?.status === "aprovado",
    nome: p?.nome ?? null,
    primeiroNome: p ? p.nome.split(" ")[0] : null,
    avatar: p?.avatar_url ?? null,
    slug: p?.slug ?? null,
  };
}
