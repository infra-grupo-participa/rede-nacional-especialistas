import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";

const CAMPOS_CARD =
  "id, slug, nome, profissao, cidade, uf, whatsapp, avatar_url, qualificacao, bio, certificado";

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
  | "certificado"
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

/** Especialistas aprovados de uma qualificação (diretório por nível). */
export async function membrosPorNivel(qualificacao: string): Promise<PerfilCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfis")
    .select(CAMPOS_CARD)
    .eq("status", "aprovado")
    .eq("oculto", false)
    .eq("qualificacao", qualificacao)
    .order("nome");
  return (data as PerfilCard[]) ?? [];
}

export interface Facetas {
  profissoes: { nome: string; n: number }[];
  cidades: { cidade: string; uf: string | null; n: number }[];
}

/** Facetas leves para as sugestões de busca (profissões e cidades com contagem). */
export async function facetasBusca(): Promise<Facetas> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfis")
    .select("profissao, cidade, uf")
    .eq("status", "aprovado")
    .eq("oculto", false);

  const prof: Record<string, number> = {};
  const cid: Record<string, { cidade: string; uf: string | null; n: number }> = {};
  for (const row of data ?? []) {
    const r = row as { profissao: string | null; cidade: string | null; uf: string | null };
    if (r.profissao) prof[r.profissao] = (prof[r.profissao] || 0) + 1;
    if (r.cidade) {
      const chave = `${r.cidade}|${r.uf ?? ""}`;
      cid[chave] = cid[chave]
        ? { ...cid[chave], n: cid[chave].n + 1 }
        : { cidade: r.cidade, uf: r.uf, n: 1 };
    }
  }
  return {
    profissoes: Object.entries(prof)
      .map(([nome, n]) => ({ nome, n }))
      .sort((a, b) => b.n - a.n),
    cidades: Object.values(cid).sort((a, b) => b.n - a.n),
  };
}

/** Contagem de aprovados por qualificação (para os cards de nível). */
export async function contagemPorNivel(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfis")
    .select("qualificacao")
    .eq("status", "aprovado")
    .eq("oculto", false);
  const c: Record<string, number> = {};
  for (const row of data ?? []) {
    const q = (row as { qualificacao: string }).qualificacao;
    if (q) c[q] = (c[q] || 0) + 1;
  }
  return c;
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
