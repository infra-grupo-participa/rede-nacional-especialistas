import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";
import type { Qualificacao } from "@/lib/qualificacoes";

export interface AutorResumo {
  id: string;
  slug: string | null;
  nome: string;
  avatar_url: string;
  qualificacao: Qualificacao;
  headline?: string;
  profissao?: string;
}

export interface PostFeed {
  id: string;
  titulo: string;
  corpo: string;
  imagem_url: string;
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

const CAMPOS_AUTOR = "id, slug, nome, avatar_url, qualificacao, headline, profissao";

/** Feed de posts publicados, ordenado por recência, com autor e meu voto. */
export async function listarFeed(limite = 40): Promise<PostFeed[]> {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select(
      `id, titulo, corpo, imagem_url, score, n_comentarios, criado_em,
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

/** Um post publicado por id, com autor e meu voto (página do post). */
export async function postPorId(id: string): Promise<PostFeed | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(
      `id, titulo, corpo, imagem_url, score, n_comentarios, criado_em,
       autor:autor_id (${CAMPOS_AUTOR})`,
    )
    .eq("id", id)
    .eq("status", "publicado")
    .maybeSingle();
  if (!data) return null;

  const perfil = await getPerfilAtual();
  let meu_voto = 0;
  if (perfil) {
    const { data: v } = await supabase
      .from("votos")
      .select("valor")
      .eq("post_id", id)
      .eq("perfil_id", perfil.id)
      .maybeSingle();
    meu_voto = (v as { valor: number } | null)?.valor ?? 0;
  }
  return { ...(data as unknown as Omit<PostFeed, "meu_voto">), meu_voto };
}

/** Posts publicados de um autor (histórico do perfil, mais recentes primeiro). */
export async function postsDoAutor(autorId: string, limite = 60): Promise<PostFeed[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(
      `id, titulo, corpo, imagem_url, score, n_comentarios, criado_em,
       autor:autor_id (${CAMPOS_AUTOR})`,
    )
    .eq("autor_id", autorId)
    .eq("status", "publicado")
    .eq("tipo", "post")
    .order("criado_em", { ascending: false })
    .limit(limite);
  return ((data ?? []) as unknown as Omit<PostFeed, "meu_voto">[]).map((p) => ({
    ...p,
    meu_voto: 0,
  }));
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
