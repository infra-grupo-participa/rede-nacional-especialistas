import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";
import { FILTRO_PROF_OR, ehProfissaoPermitida } from "@/lib/profissoes-permitidas";

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

/** Contagem de especialistas aprovados por UF (só advogados e contadores). */
export async function contagemPorUf(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfis")
    .select("uf")
    .eq("status", "aprovado")
    .eq("oculto", false)
    .or(FILTRO_PROF_OR);

  const c: Record<string, number> = {};
  for (const row of data ?? []) {
    const uf = (row as { uf: string | null }).uf;
    if (uf) c[uf] = (c[uf] || 0) + 1;
  }
  return c;
}

/** Especialistas aprovados de uma UF (só advogados e contadores). */
export async function membrosPorUf(uf: string): Promise<PerfilCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfis")
    .select(CAMPOS_CARD)
    .eq("status", "aprovado")
    .eq("oculto", false)
    .eq("uf", uf)
    .or(FILTRO_PROF_OR)
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
    .or(FILTRO_PROF_OR)
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
    .eq("oculto", false)
    .or(FILTRO_PROF_OR);

  const prof: Record<string, number> = {};
  const cid: Record<string, { cidade: string; uf: string | null; n: number }> = {};
  for (const row of data ?? []) {
    const r = row as { profissao: string | null; cidade: string | null; uf: string | null };
    if (r.profissao && ehProfissaoPermitida(r.profissao)) {
      const canon = r.profissao.trim();
      prof[canon] = (prof[canon] || 0) + 1;
    }
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

/** Perfil público por slug (para /especialista/[slug]).
 *  Aceita também o id (UUID) como identificador: links antigos/gerados antes do
 *  backfill de slug caíam no id e davam 404. O fallback por id evita isso. */
export async function perfilPorSlug(slug: string): Promise<Perfil | null> {
  const supabase = await createClient();
  const ehUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const { data } = await supabase
    .from("perfis")
    .select("*")
    .eq(ehUuid ? "id" : "slug", slug)
    .eq("status", "aprovado")
    .eq("oculto", false)
    .maybeSingle();
  return (data as Perfil | null) ?? null;
}

export interface PerfilStats {
  n_artigos: number;
  total_leituras: number;
  n_posts: number;
  total_score: number;
}

/** Estatísticas de um perfil (artigos, leituras, posts, score). */
export async function estatisticasPerfil(perfilId: string): Promise<PerfilStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfil_stats")
    .select("n_artigos, total_leituras, n_posts, total_score")
    .eq("perfil_id", perfilId)
    .maybeSingle();
  return (
    (data as PerfilStats | null) ?? {
      n_artigos: 0,
      total_leituras: 0,
      n_posts: 0,
      total_score: 0,
    }
  );
}

export interface AutorRanking {
  perfil_id: string;
  slug: string | null;
  nome: string;
  avatar_url: string;
  qualificacao: string;
  uf: string | null;
  cidade: string;
  profissao: string;
  n_artigos: number;
  total_leituras: number;
  n_posts: number;
  total_score: number;
  pontos: number;
}

/** Ranking de autores por engajamento (top N). */
export async function rankingAutores(limite = 20): Promise<AutorRanking[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ranking_autores")
    .select("*")
    .gt("pontos", 0)
    .limit(limite);
  return (data as AutorRanking[]) ?? [];
}

export interface EspecialistaCatalogo {
  id: string;
  slug: string | null;
  nome: string;
  profissao: string;
  headline: string | null;
  bio: string | null;
  cidade: string;
  uf: string | null;
  whatsapp: string;
  avatar_url: string;
  qualificacao: string;
  certificado: boolean;
  especialidades: string[] | null;
  n_posts: number;
  n_artigos: number;
  total_score: number;
  pontos: number;
  nivel_ordem: number;
}

/** Catálogo completo da vitrine (advogados e contadores aprovados),
 *  ranqueado por relevância: qualificação primeiro, depois engajamento. */
export async function catalogoEspecialistas(): Promise<EspecialistaCatalogo[]> {
  const supabase = await createClient();
  // Colunas explícitas em vez de "*": é página pública (todo acesso paga o
  // payload) e a view traz campos que a vitrine não usa. Sem .limit() de
  // propósito — o mapa por UF filtra no cliente e cortar aqui sumiria com
  // especialistas de estados inteiros.
  const { data } = await supabase
    .from("catalogo_especialistas")
    .select(
      "id, slug, nome, profissao, headline, bio, cidade, uf, whatsapp, avatar_url, qualificacao, certificado, especialidades, n_posts, n_artigos, total_score, pontos, nivel_ordem",
    )
    .order("nivel_ordem", { ascending: false })
    .order("pontos", { ascending: false })
    .order("certificado", { ascending: false })
    .order("nome", { ascending: true });
  return (data as EspecialistaCatalogo[]) ?? [];
}
