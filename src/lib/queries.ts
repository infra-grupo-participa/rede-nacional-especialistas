import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";

const CAMPOS_CARD =
  "id, slug, nome, profissao, cidade, uf, whatsapp, avatar_url, qualificacao, bio";

export type PerfilCard = Pick<
  Perfil,
  | "id"
  | "slug"
  | "nome"
  | "profissao"
  | "cidade"
  | "uf"
  | "whatsapp"
  | "avatar_url"
  | "qualificacao"
  | "bio"
>;

/** Contagem de especialistas aprovados por UF. */
export async function contagemPorUf(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfis")
    .select("uf")
    .eq("status", "aprovado")
    .eq("oculto", false);

  const c: Record<string, number> = {};
  for (const row of data ?? []) {
    const uf = (row as { uf: string | null }).uf;
    if (uf) c[uf] = (c[uf] || 0) + 1;
  }
  return c;
}

/** Especialistas aprovados de uma UF. */
export async function membrosPorUf(uf: string): Promise<PerfilCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfis")
    .select(CAMPOS_CARD)
    .eq("status", "aprovado")
    .eq("oculto", false)
    .eq("uf", uf)
    .order("nome");
  return (data as PerfilCard[]) ?? [];
}

/** Busca global de especialistas aprovados (nome, cidade, profissão). */
export async function buscarMembros(termo: string): Promise<PerfilCard[]> {
  const supabase = await createClient();
  const t = termo.trim();
  let query = supabase
    .from("perfis")
    .select(CAMPOS_CARD)
    .eq("status", "aprovado")
    .eq("oculto", false)
    .order("nome")
    .limit(60);

  if (t) {
    // ilike em vários campos via or().
    query = query.or(
      `nome.ilike.%${t}%,cidade.ilike.%${t}%,profissao.ilike.%${t}%`,
    );
  }
  const { data } = await query;
  return (data as PerfilCard[]) ?? [];
}

/** Perfil público por slug (para /especialista/[slug]). */
export async function perfilPorSlug(slug: string): Promise<Perfil | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfis")
    .select("*")
    .eq("slug", slug)
    .eq("status", "aprovado")
    .eq("oculto", false)
    .maybeSingle();
  return (data as Perfil | null) ?? null;
}
