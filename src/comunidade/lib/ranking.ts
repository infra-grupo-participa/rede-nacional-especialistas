import { createClient } from "@/lib/supabase/server";
import { idsVerificados } from "@/comunidade/lib/verificados";

export interface AutorRanking {
  perfil_id: string;
  slug: string | null;
  nome: string;
  avatar_url: string | null;
  qualificacao: string;
  n_artigos: number;
  total_leituras: number;
  n_posts: number;
  total_score: number;
  pontos: number;
  /** marcado aqui, cruzando com idsVerificados() (a view não traz a coluna). */
  verificado?: boolean;
}

/** Quem mais contribui (top N por engajamento), com o selo de verificado. */
export async function rankingAutores(limite = 8): Promise<AutorRanking[]> {
  const supabase = await createClient();
  const [{ data }, verificados] = await Promise.all([
    supabase.from("ranking_autores").select("*").gt("pontos", 0).limit(limite),
    idsVerificados(),
  ]);
  return ((data as AutorRanking[]) ?? []).map((a) => ({ ...a, verificado: verificados.has(a.perfil_id) }));
}

/** Quantos membros aprovados a comunidade tem (linha "N membros" do cabeçalho). */
export async function totalMembros(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("perfis")
    .select("id", { count: "exact", head: true })
    .eq("status", "aprovado");
  return count ?? 0;
}
