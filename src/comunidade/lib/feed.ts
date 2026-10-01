import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/comunidade/lib/sessao";
import { CAMPOS_COMENTARIO } from "@/comunidade/lib/feed-tipos";
import { limparBusca } from "@/comunidade/lib/grupo-tipos";
import { ehReacao, lerContagem, type ContagemReacoes, type Reacao } from "@/comunidade/lib/reacoes";
import type { Qualificacao } from "@/comunidade/lib/qualificacoes";

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
  /** hashtags extraídas do texto pelo banco, sem o "#" e em minúsculas. */
  hashtags: string[];
  autor: AutorResumo;
  /** voto do usuário logado neste post: 1, -1 ou 0. */
  meu_voto: number;
  /** contagem de reações por tipo (curtir, amei, risada, uau, triste, raiva). */
  reacoes: ContagemReacoes;
  /** reação do usuário logado neste post, se houver. */
  minha_reacao: Reacao | null;
  /** último comentário de primeiro nível, para a prévia no cartão (só nas
   *  listas montadas com `comPrevias`). */
  previa?: ComentarioFeed | null;
}

export interface ComentarioFeed {
  id: string;
  /** resposta a outro comentário (um nível só); null = comentário do post. */
  parent_id: string | null;
  corpo: string;
  criado_em: string;
  autor: AutorResumo;
}

export { CAMPOS_COMENTARIO } from "@/comunidade/lib/feed-tipos";

const CAMPOS_AUTOR = "id, slug, nome, avatar_url, qualificacao, headline, profissao, verificado";

const CAMPOS_POST = `id, titulo, corpo, imagem_url, score, n_comentarios, criado_em,
       ultima_atividade_em, fixado, comentarios_travados, travado_motivo, hashtags, reacoes,
       autor:autor_id (${CAMPOS_AUTOR})`;

/** Os dois filtros do grupo do Facebook: "novos posts" (ordem de criação) e
 *  "atividade recente" (o post sobe quando alguém comenta). */
export type OrdemFeed = "novos" | "atividade";

/** Post como vem do banco, antes de juntar o voto e a reação de quem olha. */
type PostSemVoto = Omit<PostFeed, "meu_voto" | "minha_reacao">;

function comReacao(p: PostSemVoto, voto: { valor: number; reacao?: unknown } | undefined): PostFeed {
  const valor = voto?.valor ?? 0;
  return {
    ...p,
    reacoes: lerContagem(p.reacoes),
    meu_voto: valor,
    minha_reacao: valor > 0 ? (ehReacao(voto?.reacao) ? voto.reacao : "curtir") : null,
  };
}

async function comMeusVotos(lista: PostSemVoto[]): Promise<PostFeed[]> {
  if (lista.length === 0) return [];
  const perfil = await getPerfilAtual();
  const meus = new Map<string, { valor: number; reacao?: unknown }>();
  if (perfil) {
    const supabase = await createClient();
    const { data: votos } = await supabase
      .from("votos")
      .select("post_id, valor, reacao")
      .eq("perfil_id", perfil.id)
      .in("post_id", lista.map((p) => p.id));
    for (const v of (votos ?? []) as { post_id: string; valor: number; reacao?: unknown }[]) meus.set(v.post_id, v);
  }
  return lista.map((p) => comReacao(p, meus.get(p.id)));
}

/** Filtros das listas de posts. */
export interface FiltroFeed {
  limite?: number;
  /** quantos posts pular antes de começar (as levas seguintes da Discussão) */
  pular?: number;
  /** true inclui os fixados na lista (busca, perfil, meu conteúdo). */
  comFixados?: boolean;
  /** só posts sem nenhum comentário e com comentários abertos ("Perguntas abertas"). */
  semResposta?: boolean;
  /** só posts deste autor (perfil do membro e "Seu conteúdo"). */
  autorId?: string;
  /** só posts com esta hashtag (sem o "#"). */
  hashtag?: string;
  /** texto procurado no título ou no corpo. */
  q?: string;
}

/** Feed de posts publicados, com autor e meu voto. A Discussão pede com
 *  `comFixados` (o post em destaque continua na lista, no lugar dele pela
 *  data) e em levas (`limite` + `pular`). */
export async function listarFeed(ordem: OrdemFeed = "novos", filtro: FiltroFeed = {}): Promise<PostFeed[]> {
  const supabase = await createClient();
  const limite = Math.min(Math.max(filtro.limite ?? 40, 1), 100);
  const pular = Math.max(Math.floor(filtro.pular ?? 0), 0);
  let consulta = supabase.from("posts").select(CAMPOS_POST).eq("status", "publicado").eq("tipo", "post");
  if (!filtro.comFixados) consulta = consulta.eq("fixado", false);
  if (filtro.semResposta) consulta = consulta.eq("n_comentarios", 0).eq("comentarios_travados", false);
  if (filtro.autorId) consulta = consulta.eq("autor_id", filtro.autorId);
  const tag = (filtro.hashtag ?? "").replace(/^#/, "").trim().toLowerCase();
  if (tag) consulta = consulta.contains("hashtags", [tag]);
  const q = limparBusca(filtro.q);
  if (q) consulta = consulta.or(`titulo.ilike.%${q}%,corpo.ilike.%${q}%`);
  const { data: posts } = await consulta
    .order(ordem === "atividade" ? "ultima_atividade_em" : "criado_em", { ascending: false })
    // desempate estável: sem ele, posts com a mesma data trocam de lugar entre as levas
    .order("id", { ascending: false })
    .range(pular, pular + limite - 1);
  return comMeusVotos((posts ?? []) as unknown as PostSemVoto[]);
}

/** Acrescenta a cada post a prévia do último comentário de primeiro nível
 *  (uma consulta só para a lista inteira). */
export async function comPrevias(posts: PostFeed[]): Promise<PostFeed[]> {
  const comComentario = posts.filter((p) => p.n_comentarios > 0).map((p) => p.id);
  if (comComentario.length === 0) return posts.map((p) => ({ ...p, previa: null }));
  const supabase = await createClient();
  const { data } = await supabase
    .from("comentarios")
    .select(`post_id, ${CAMPOS_COMENTARIO}`)
    .in("post_id", comComentario)
    .is("parent_id", null)
    .order("criado_em", { ascending: false })
    .limit(Math.min(comComentario.length * 15, 600));
  const ultimo = new Map<string, ComentarioFeed>();
  for (const c of (data ?? []) as unknown as (ComentarioFeed & { post_id: string })[]) {
    if (!ultimo.has(c.post_id)) ultimo.set(c.post_id, c);
  }
  return posts.map((p) => ({ ...p, previa: ultimo.get(p.id) ?? null }));
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
  return comMeusVotos((data ?? []) as unknown as PostSemVoto[]);
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
  let voto: { valor: number; reacao?: unknown } | undefined;
  if (perfil) {
    const { data: v } = await supabase
      .from("votos")
      .select("valor, reacao")
      .eq("post_id", id)
      .eq("perfil_id", perfil.id)
      .maybeSingle();
    voto = (v as { valor: number; reacao?: unknown } | null) ?? undefined;
  }
  return comReacao(data as unknown as PostSemVoto, voto);
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
  return ((data ?? []) as unknown as PostSemVoto[]).map((p) => comReacao(p, undefined));
}

/** Comentários de um post (ordem cronológica), com autor. */
export async function listarComentarios(postId: string): Promise<ComentarioFeed[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comentarios")
    .select(CAMPOS_COMENTARIO)
    .eq("post_id", postId)
    .order("criado_em", { ascending: true });
  return (data ?? []) as unknown as ComentarioFeed[];
}
