"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/comunidade/lib/sessao";
import { ehReacao, type Reacao } from "@/comunidade/lib/reacoes";
import { comPrevias, listarFeed, type OrdemFeed, type PostFeed } from "@/comunidade/lib/feed";
import { POSTS_POR_VEZ } from "@/comunidade/lib/feed-tipos";

export type FeedResult = { erro?: string; ok?: boolean; aviso?: string; codigo?: "travado" | "indisponivel" };

const MAX_POST = 2000;
const MAX_TITULO = 140;
const MAX_COMENT = 1000;

export interface PostInput {
  titulo?: string;
  corpo: string;
  imagem_url?: string;
}

/** Publica um POST (publica direto — sem fila). Título e imagem opcionais. */
export async function criarPost(input: PostInput | string): Promise<FeedResult> {
  // compat: aceita string (corpo) ou objeto {titulo, corpo, imagem_url}
  const dados: PostInput = typeof input === "string" ? { corpo: input } : input;
  const corpo = (dados.corpo || "").trim();
  const titulo = (dados.titulo || "").trim().slice(0, MAX_TITULO);
  const imagem_url = (dados.imagem_url || "").trim();

  if (!corpo && !imagem_url && !titulo)
    return { erro: "Escreva algo antes de publicar." };
  if (corpo.length > MAX_POST) return { erro: "Post muito longo." };

  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Entre para publicar." };
  if (perfil.status !== "aprovado")
    return { erro: "Seu acesso ainda está em aprovação pela coordenação." };

  const supabase = await createClient();
  // O banco decide o status final: palavra-chave da lista de moderação retém
  // o post (status 'pendente') e a regra da # pode travar os comentários.
  const { data, error } = await supabase
    .from("posts")
    .insert({ autor_id: perfil.id, tipo: "post", status: "publicado", titulo, corpo, imagem_url })
    .select("status, comentarios_travados")
    .single();

  if (error) return { erro: "Não foi possível publicar. Tente de novo." };
  revalidatePath("/comunidade");
  const criado = data as { status: string; comentarios_travados: boolean } | null;
  if (criado?.status === "pendente")
    return {
      ok: true,
      aviso: "Seu post foi enviado para a moderação e aparece no feed assim que for aprovado.",
    };
  if (criado?.comentarios_travados)
    return {
      ok: true,
      aviso: "Post publicado, mas sem a hashtag do tema: os comentários ficaram travados. Veja as regras.",
    };
  return { ok: true };
}

/** Vota num post. valor ∈ {1,-1}; votar de novo no mesmo lado remove o voto. */
export async function votar(postId: string, valor: 1 | -1): Promise<FeedResult> {
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Entre para votar." };
  if (perfil.status !== "aprovado") return { erro: "Acesso em aprovação." };

  const supabase = await createClient();

  // voto atual
  const { data: atual } = await supabase
    .from("votos")
    .select("valor")
    .eq("post_id", postId)
    .eq("perfil_id", perfil.id)
    .maybeSingle();

  const valorAtual = (atual as { valor: number } | null)?.valor ?? 0;

  if (valorAtual === valor) {
    // clicou de novo no mesmo lado → remove
    await supabase.from("votos").delete().eq("post_id", postId).eq("perfil_id", perfil.id);
  } else {
    // insere ou troca de lado
    await supabase
      .from("votos")
      .upsert(
        { post_id: postId, perfil_id: perfil.id, valor },
        { onConflict: "post_id,perfil_id" },
      );
  }

  revalidatePath("/comunidade");
  return { ok: true };
}

/** Próxima leva de posts da Discussão ("ver mais" / rolagem). Só para membro
 *  aprovado; a RLS garante o mesmo no banco. */
export async function maisPosts(ordem: OrdemFeed, pular: number): Promise<{ posts: PostFeed[]; acabou: boolean; erro?: string }> {
  const perfil = await getPerfilAtual();
  if (!perfil || perfil.status !== "aprovado") return { posts: [], acabou: true, erro: "Entre para ver os posts." };
  const inicio = Number.isFinite(pular) ? Math.min(Math.max(Math.floor(pular), 0), 20000) : 0;
  const posts = await comPrevias(
    await listarFeed(ordem === "atividade" ? "atividade" : "novos", { comFixados: true, limite: POSTS_POR_VEZ, pular: inicio }),
  );
  return { posts, acabou: posts.length < POSTS_POR_VEZ };
}

/** Reage a um post (Curtir, Amei, Risada, Uau, Triste, Raiva). Cada membro tem
 *  uma reação por post: escolher outra troca; `null` tira a reação. */
export async function reagir(postId: string, reacao: Reacao | null): Promise<FeedResult> {
  if (reacao !== null && !ehReacao(reacao)) return { erro: "Reação inválida." };
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Entre para reagir." };
  if (perfil.status !== "aprovado") return { erro: "Acesso em aprovação." };

  const supabase = await createClient();
  const { error } =
    reacao === null
      ? await supabase.from("votos").delete().eq("post_id", postId).eq("perfil_id", perfil.id)
      : await supabase
          .from("votos")
          .upsert({ post_id: postId, perfil_id: perfil.id, valor: 1, reacao }, { onConflict: "post_id,perfil_id" });
  if (error) return { erro: "Não foi possível registrar a reação. Tente de novo." };

  revalidatePath("/comunidade");
  return { ok: true };
}

/** Comenta num post. */
export async function criarComentario(
  postId: string,
  corpoBruto: string,
  /** id do comentário respondido (resposta de um nível); vazio = comentário do post */
  respostaA?: string | null,
): Promise<FeedResult> {
  const corpo = (corpoBruto || "").trim();
  if (!corpo) return { erro: "Escreva um comentário." };
  if (corpo.length > MAX_COMENT) return { erro: "Comentário muito longo." };

  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Entre para comentar." };
  if (perfil.status !== "aprovado") return { erro: "Acesso em aprovação." };

  const supabase = await createClient();

  // Resposta: o comentário respondido tem de ser deste post. As respostas têm
  // um nível só, então responder a uma resposta cai no comentário de origem.
  let parent_id: string | null = null;
  if (respostaA) {
    const { data: alvo } = await supabase
      .from("comentarios")
      .select("id, post_id, parent_id")
      .eq("id", respostaA)
      .maybeSingle();
    const a = alvo as { id: string; post_id: string; parent_id: string | null } | null;
    if (!a || a.post_id !== postId) return { erro: "O comentário respondido não existe mais." };
    parent_id = a.parent_id ?? a.id;
  }

  const { error } = await supabase
    .from("comentarios")
    .insert({ post_id: postId, autor_id: perfil.id, corpo, parent_id });

  if (error) {
    if (error.message.includes("comentarios_travados"))
      return { erro: "A moderação travou os comentários deste post.", codigo: "travado" };
    if (error.message.includes("post_indisponivel"))
      return { erro: "Este post não está mais disponível.", codigo: "indisponivel" };
    return { erro: "Não foi possível comentar. Tente de novo." };
  }
  revalidatePath("/comunidade");
  return { ok: true };
}

/** Apaga um post (autor ou admin — a RLS reforça). */
export async function apagarPost(postId: string): Promise<FeedResult> {
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Sem permissão." };

  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { erro: "Não foi possível remover." };
  revalidatePath("/comunidade");
  return { ok: true };
}

/** Apaga um comentário (autor ou admin — a RLS reforça). */
export async function apagarComentario(comentarioId: string): Promise<FeedResult> {
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Sem permissão." };

  const supabase = await createClient();
  const { error } = await supabase.from("comentarios").delete().eq("id", comentarioId);
  if (error) return { erro: "Não foi possível remover." };
  return { ok: true };
}

/* ---------------------------------------------------------------------------
   Moderação (só coordenação). O banco também barra: o guard de posts congela
   estes campos para quem não é admin, e cada mudança cai no registro.
   ------------------------------------------------------------------------- */

async function exigirAdmin(): Promise<boolean> {
  const perfil = await getPerfilAtual();
  return Boolean(perfil && perfil.papel === "admin" && perfil.status === "aprovado");
}

function revalidarFeed(postId: string) {
  revalidatePath("/comunidade");
  revalidatePath(`/comunidade/post/${postId}`);
  revalidatePath("/comunidade/coordenacao", "layout");
}

/** Fixa ou desafixa um post no topo do feed. */
export async function fixarPost(postId: string, fixar: boolean): Promise<FeedResult> {
  if (!(await exigirAdmin())) return { erro: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("posts").update({ fixado: fixar }).eq("id", postId);
  if (error) return { erro: "Não foi possível alterar o destaque." };
  revalidarFeed(postId);
  return { ok: true };
}

/** Trava ou libera os comentários de um post (com motivo opcional). */
export async function travarComentarios(postId: string, travar: boolean, motivo = ""): Promise<FeedResult> {
  if (!(await exigirAdmin())) return { erro: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ comentarios_travados: travar, travado_motivo: travar ? motivo.trim().slice(0, 200) : "" })
    .eq("id", postId);
  if (error) return { erro: "Não foi possível alterar os comentários." };
  revalidarFeed(postId);
  return { ok: true };
}

/** Decide um post retido pela palavra-chave (ou remove um publicado). */
export async function moderarPost(
  postId: string,
  decisao: "publicado" | "recusado" | "removido",
): Promise<FeedResult> {
  if (!(await exigirAdmin())) return { erro: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("posts").update({ status: decisao }).eq("id", postId);
  if (error) return { erro: "Não foi possível moderar o post." };
  revalidarFeed(postId);
  return { ok: true };
}
