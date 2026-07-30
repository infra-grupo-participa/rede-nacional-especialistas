import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";

/** Retorna o perfil `rede` da sessão atual, ou null se não logado / sem perfil. */
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

  return (data as Perfil | null) ?? null;
}

export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
