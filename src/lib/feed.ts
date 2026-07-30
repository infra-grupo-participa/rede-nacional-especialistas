import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";
import type { Qualificacao } from "@/lib/qualificacoes";

export interface AutorResumo {
  id: string;
  slug: string | null;
  nome: string;
  avatar_url: string;
  qualificacao: Qualificacao;
}

export interface PostFeed {
  id: string;
  corpo: string;
  score: number;
  n_comentarios: number;
  criado_em: string;
  autor: AutorResumo;
  /** voto do usuário logado neste post: 1, -1 ou 0. */
  meu_voto: number;
}

export interface ComentarioFeed {
  id: string;
  corpo: string;
  criado_em: string;
  autor: AutorResumo;
}

const CAMPOS_AUTOR = "id, slug, nome, avatar_url, qualificacao";

/** Feed de posts publicados, ordenado por recência, com autor e meu voto. */
export async function listarFeed(limite = 40): Promise<PostFeed[]> {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select(
      `id, corpo, score, n_comentarios, criado_em,
       autor:autor_id (${CAMPOS_AUTOR})`,
    )
    .eq("status", "publicado")
    .eq("tipo", "post")
    .order("criado_em", { ascending: false })
    .limit(limite);

  const lista = (posts ?? []) as unknown as Omit<PostFeed, "meu_voto">[];
  if (lista.length === 0) return [];

  // Voto do usuário logado nos posts carregados (1 query).
  const perfil = await getPerfilAtual();
  const meusVotos: Record<string, number> = {};
  if (perfil) {
    const ids = lista.map((p) => p.id);
    const { data: votos } = await supabase
      .from("votos")
      .select("post_id, valor")
      .eq("perfil_id", perfil.id)
      .in("post_id", ids);
    for (const v of votos ?? []) {
      meusVotos[(v as { post_id: string }).post_id] = (v as { valor: number }).valor;
    }
  }

  return lista.map((p) => ({ ...p, meu_voto: meusVotos[p.id] ?? 0 }));
}

/** Comentários de um post (ordem cronológica), com autor. */
export async function listarComentarios(postId: string): Promise<ComentarioFeed[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comentarios")
    .select(`id, corpo, criado_em, autor:autor_id (${CAMPOS_AUTOR})`)
    .eq("post_id", postId)
    .order("criado_em", { ascending: true });
  return (data ?? []) as unknown as ComentarioFeed[];
}
