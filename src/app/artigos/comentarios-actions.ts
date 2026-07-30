"use server";

import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";

export type ComentarioResult = { erro?: string; ok?: boolean };

const LIMITE = 1500;

/** Comenta num artigo (assinado pelo perfil; tabela rede.artigo_comentarios). */
export async function comentarArtigo(
  artigoId: string,
  textoBruto: string,
): Promise<ComentarioResult> {
  const texto = (textoBruto || "").trim();
  if (texto.length < 2) return { erro: "Escreva um comentário." };
  if (texto.length > LIMITE) return { erro: "Comentário muito longo." };

  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Entre para comentar." };
  if (perfil.status !== "aprovado") return { erro: "Acesso em aprovação." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("artigo_comentarios")
    .insert({ artigo_id: artigoId, autor_id: perfil.id, texto });

  if (error) return { erro: "Não foi possível comentar. Tente de novo." };
  return { ok: true };
}

/** Apaga um comentário de artigo (autor ou admin — a RLS reforça). */
export async function apagarComentarioArtigo(id: string): Promise<ComentarioResult> {
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("artigo_comentarios").delete().eq("id", id);
  if (error) return { erro: "Não foi possível remover." };
  return { ok: true };
}
