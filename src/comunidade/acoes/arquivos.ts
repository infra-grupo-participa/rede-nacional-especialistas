"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/comunidade/lib/sessao";
import { BUCKET_ARQUIVOS, type TipoArquivo } from "@/comunidade/lib/arquivos-tipos";

export type ArquivoResult = { erro?: string; ok?: boolean; url?: string };

const TIPOS: TipoArquivo[] = ["documento", "imagem", "video", "link"];

/** Registra um arquivo já enviado ao bucket (pelo navegador) ou um link externo. */
export async function registrarArquivo(input: {
  titulo: string;
  descricao?: string;
  tipo: TipoArquivo;
  caminho?: string;
  url?: string;
  mime?: string;
  tamanho?: number;
}): Promise<ArquivoResult> {
  const perfil = await getPerfilAtual();
  if (!perfil || perfil.status !== "aprovado") return { erro: "Só membros aprovados podem enviar arquivos." };

  const titulo = (input.titulo || "").trim().slice(0, 160);
  if (titulo.length < 2) return { erro: "Dê um título ao arquivo." };
  if (!TIPOS.includes(input.tipo)) return { erro: "Tipo inválido." };

  const caminho = (input.caminho || "").trim() || null;
  let url = (input.url || "").trim() || null;
  if (!caminho && !url) return { erro: "Envie um arquivo ou cole um link." };
  if (caminho && !caminho.startsWith(`${perfil.id}/`)) return { erro: "Caminho inválido." };
  if (url) {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
      url = u.toString();
    } catch {
      return { erro: "Link inválido. Cole o endereço completo (https://…)." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("arquivos").insert({
    autor_id: perfil.id,
    titulo,
    descricao: (input.descricao || "").trim().slice(0, 600),
    tipo: input.tipo,
    caminho,
    url,
    mime: (input.mime || "").slice(0, 120),
    tamanho_bytes: Math.max(0, Math.round(input.tamanho || 0)),
  });
  if (error) return { erro: "Não foi possível salvar o arquivo." };
  revalidatePath("/comunidade/arquivos");
  return { ok: true };
}

/** URL assinada (5 min) para abrir um arquivo do bucket privado. */
export async function linkDoArquivo(id: string): Promise<ArquivoResult> {
  const perfil = await getPerfilAtual();
  if (!perfil || perfil.status !== "aprovado") return { erro: "Acesso só para membros." };
  const supabase = await createClient();
  const { data } = await supabase.from("arquivos").select("caminho, url").eq("id", id).maybeSingle();
  const a = data as { caminho: string | null; url: string | null } | null;
  if (!a) return { erro: "Arquivo não encontrado." };
  if (a.url) return { ok: true, url: a.url };
  const { data: s, error } = await supabase.storage.from(BUCKET_ARQUIVOS).createSignedUrl(a.caminho as string, 60 * 5);
  if (error || !s) return { erro: "Não foi possível abrir o arquivo." };
  return { ok: true, url: s.signedUrl };
}

/** Apaga (autor ou coordenação; a RLS reforça) e remove o objeto do bucket. */
export async function apagarArquivo(id: string): Promise<ArquivoResult> {
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Sem permissão." };
  const supabase = await createClient();
  const { data } = await supabase.from("arquivos").select("caminho").eq("id", id).maybeSingle();
  const { error } = await supabase.from("arquivos").delete().eq("id", id);
  if (error) return { erro: "Não foi possível apagar." };
  const caminho = (data as { caminho: string | null } | null)?.caminho;
  if (caminho) await supabase.storage.from(BUCKET_ARQUIVOS).remove([caminho]);
  revalidatePath("/comunidade/arquivos");
  return { ok: true };
}

/** Fixa/desafixa no topo da aba (só coordenação). */
export async function fixarArquivo(id: string, fixar: boolean): Promise<ArquivoResult> {
  const perfil = await getPerfilAtual();
  if (!perfil || perfil.papel !== "admin" || perfil.status !== "aprovado") return { erro: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("arquivos").update({ fixado: fixar }).eq("id", id);
  if (error) return { erro: "Não foi possível alterar." };
  revalidatePath("/comunidade/arquivos");
  return { ok: true };
}
