"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";

export type FeedResult = { erro?: string; ok?: boolean };

const MAX_POST = 2000;
const MAX_COMENT = 1000;

/** Publica um POST curto (publica direto — sem fila). */
export async function criarPost(corpoBruto: string): Promise<FeedResult> {
  const corpo = (corpoBruto || "").trim();
  if (!corpo) return { erro: "Escreva algo antes de publicar." };
  if (corpo.length > MAX_POST) return { erro: "Post muito longo." };

  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Entre para publicar." };
  if (perfil.status !== "aprovado")
    return { erro: "Seu acesso ainda está em aprovação pela coordenação." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .insert({ autor_id: perfil.id, tipo: "post", status: "publicado", corpo });

  if (error) return { erro: "Não foi possível publicar. Tente de novo." };
  revalidatePath("/feed");
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

  revalidatePath("/feed");
  return { ok: true };
}

/** Comenta num post. */
export async function criarComentario(
  postId: string,
  corpoBruto: string,
): Promise<FeedResult> {
  const corpo = (corpoBruto || "").trim();
  if (!corpo) return { erro: "Escreva um comentário." };
  if (corpo.length > MAX_COMENT) return { erro: "Comentário muito longo." };

  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Entre para comentar." };
  if (perfil.status !== "aprovado") return { erro: "Acesso em aprovação." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("comentarios")
    .insert({ post_id: postId, autor_id: perfil.id, corpo });

  if (error) return { erro: "Não foi possível comentar. Tente de novo." };
  revalidatePath("/feed");
  return { ok: true };
}

/** Apaga um post (autor ou admin — a RLS reforça). */
export async function apagarPost(postId: string): Promise<FeedResult> {
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Sem permissão." };

  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { erro: "Não foi possível remover." };
  revalidatePath("/feed");
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
