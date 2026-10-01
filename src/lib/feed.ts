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
  /** perfil verificado pela coordenação (selo laranja). */
  verificado?: boolean;
}

export interface PostFeed {
  id: string;
  titulo: string;
  corpo: string;
  imagem_url: string;
  score: number;
  n_comentarios: number;
  criado_em: string;
  /** criação ou último comentário (filtro "atividade recente"). */
  ultima_atividade_em: string;
  /** em destaque no topo do feed (só a coordenação fixa). */
  fixado: boolean;
  /** comentários travados pela moderação (ou pela regra da #). */
  comentarios_travados: boolean;
  travado_motivo: string;
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

const CAMPOS_AUTOR = "id, slug, nome, avatar_url, qualificacao, headline, profissao, verificado";

const CAMPOS_POST = `id, titulo, corpo, imagem_url, score, n_comentarios, criado_em,
       ultima_atividade_em, fixado, comentarios_travados, travado_motivo,
       autor:autor_id (${CAMPOS_AUTOR})`;

/** Os dois filtros do grupo do Facebook: "novos posts" (ordem de criação) e
 *  "atividade recente" (o post sobe quando alguém comenta). */
export type OrdemFeed = "novos" | "atividade";

async function comMeusVotos(lista: Omit<PostFeed, "meu_voto">[]): Promise<PostFeed[]> {
  if (lista.length === 0) return [];
  const perfil = await getPerfilAtual();
  const meusVotos: Record<string, number> = {};
  if (perfil) {
    const supabase = await createClient();
    const { data: votos } = await supabase
      .from("votos")
      .select("post_id, valor")
      .eq("perfil_id", perfil.id)
      .in("post_id", lista.map((p) => p.id));
    for (const v of votos ?? []) {
      meusVotos[(v as { post_id: string }).post_id] = (v as { valor: number }).valor;
    }
  }
  return lista.map((p) => ({ ...p, meu_voto: meusVotos[p.id] ?? 0 }));
}

/** Feed de posts publicados (sem os fixados, que vêm à parte), com autor e meu voto. */
export async function listarFeed(ordem: OrdemFeed = "novos", limite = 40): Promise<PostFeed[]> {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select(CAMPOS_POST)
    .eq("status", "publicado")
    .eq("tipo", "post")
    .eq("fixado", false)
    .order(ordem === "atividade" ? "ultima_atividade_em" : "criado_em", { ascending: false })
    .limit(limite);
  return comMeusVotos((posts ?? []) as unknown as Omit<PostFeed, "meu_voto">[]);
}

/** Posts fixados em destaque (mais recente fixação primeiro). */
export async function listarFixados(): Promise<PostFeed[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(CAMPOS_POST)
    .eq("status", "publicado")
    .eq("fixado", true)
    .order("fixado_em", { ascending: false })
    .limit(10);
  return comMeusVotos((data ?? []) as unknown as Omit<PostFeed, "meu_voto">[]);
}

/** Posts do próprio autor que estão retidos aguardando a moderação. */
export async function meusPostsRetidos(perfilId: string): Promise<{ id: string; titulo: string; corpo: string; criado_em: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, titulo, corpo, criado_em")
    .eq("autor_id", perfilId)
    .eq("status", "pendente")
    .order("criado_em", { ascending: false })
    .limit(5);
  return (data ?? []) as { id: string; titulo: string; corpo: string; criado_em: string }[];
}

/** Um post publicado por id, com autor e meu voto (página do post). */
export async function postPorId(id: string): Promise<PostFeed | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(CAMPOS_POST)
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
    .select(CAMPOS_POST)
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
