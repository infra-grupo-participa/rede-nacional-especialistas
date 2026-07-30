"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import type { Bloco } from "@/lib/artigos";

export type ArtigoResult = { erro?: string; ok?: boolean; id?: string; slug?: string };

interface RascunhoInput {
  id?: string;
  titulo: string;
  chapeu: string;
  resumo: string;
  capa: string;
  blocos: Bloco[];
}

/** Garante slug único (sufixa -2, -3… em colisão). */
async function slugUnico(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  ignoraId?: string,
): Promise<string> {
  const raiz = slugify(base) || "artigo";
  let slug = raiz;
  let n = 1;
  // até achar um livre (ou o próprio artigo).
  // limite de segurança pra não girar sem fim.
  while (n < 50) {
    const { data } = await supabase
      .from("artigos")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    const ocupado = data as { id: string } | null;
    if (!ocupado || ocupado.id === ignoraId) return slug;
    n += 1;
    slug = `${raiz}-${n}`;
  }
  return `${raiz}-${Date.now()}`;
}

/** Cria um artigo vazio (rascunho) e devolve o id para abrir o editor. */
export async function criarArtigo(): Promise<ArtigoResult> {
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Entre para escrever." };
  if (perfil.status !== "aprovado")
    return { erro: "Seu acesso ainda está em aprovação pela coordenação." };

  const blocos: Bloco[] = [
    { id: "b1", tipo: "h2", texto: "" },
    { id: "b2", tipo: "paragrafo", texto: "" },
    { id: "b3", tipo: "imagem", url: "", legenda: "" },
    { id: "b4", tipo: "paragrafo", texto: "" },
  ];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artigos")
    .insert({ autor_id: perfil.id, status: "rascunho", blocos })
    .select("id")
    .single();

  if (error || !data) return { erro: "Não foi possível criar o artigo." };
  return { ok: true, id: (data as { id: string }).id };
}

/** Salva o rascunho (nunca rebaixa um publicado). */
export async function salvarRascunho(input: RascunhoInput): Promise<ArtigoResult> {
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Entre para salvar." };
  if (!input.id) return { erro: "Artigo sem identificador." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("artigos")
    .update({
      titulo: input.titulo.trim(),
      chapeu: input.chapeu.trim(),
      resumo: input.resumo.trim(),
      capa: input.capa,
      blocos: input.blocos,
    })
    .eq("id", input.id);

  if (error) return { erro: "Não foi possível salvar. Tente de novo." };
  revalidatePath("/meus-artigos");
  revalidatePath(`/editor/${input.id}`);
  return { ok: true, id: input.id };
}

/** Envia para aprovação (salva + status em_analise + gera slug). */
export async function enviarArtigo(input: RascunhoInput): Promise<ArtigoResult> {
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Entre para enviar." };
  if (perfil.status !== "aprovado") return { erro: "Acesso em aprovação." };
  if (!input.id) return { erro: "Artigo sem identificador." };

  const titulo = input.titulo.trim();
  if (!titulo) return { erro: "Escreva o título do artigo." };
  if (!input.resumo.trim())
    return { erro: "Escreva a linha fina — é ela que aparece na lista." };
  const temTexto = (input.blocos ?? []).some(
    (b) => b.tipo !== "imagem" && (b.texto ?? "").trim().length > 20,
  );
  if (!temTexto)
    return { erro: "O artigo precisa de pelo menos um parágrafo com conteúdo." };

  const supabase = await createClient();
  const slug = await slugUnico(supabase, titulo, input.id);

  const { error } = await supabase
    .from("artigos")
    .update({
      titulo,
      chapeu: input.chapeu.trim(),
      resumo: input.resumo.trim(),
      capa: input.capa,
      blocos: input.blocos,
      slug,
      motivo: "",
      status: "em_analise", // o trigger carimba enviado_em
    })
    .eq("id", input.id);

  if (error) return { erro: "Não foi possível enviar. Tente de novo." };
  revalidatePath("/meus-artigos");
  revalidatePath("/coordenacao");
  return { ok: true, id: input.id, slug };
}

/** Apaga um artigo (autor ou admin — RLS reforça). */
export async function apagarArtigo(id: string): Promise<ArtigoResult> {
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("artigos").delete().eq("id", id);
  if (error) return { erro: "Não foi possível remover." };
  revalidatePath("/meus-artigos");
  return { ok: true };
}

/* ---------------------------------------------------------------- coordenação */

/** Aprova e publica (admin — o guard de status na 0005 bloqueia autor comum). */
export async function aprovarArtigo(id: string): Promise<ArtigoResult> {
  const perfil = await getPerfilAtual();
  if (perfil?.papel !== "admin") return { erro: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("artigos")
    .update({ status: "publicado", motivo: "" }) // trigger carimba publicado_em
    .eq("id", id);
  if (error) return { erro: "Não foi possível publicar." };
  revalidatePath("/coordenacao");
  revalidatePath("/artigos");
  return { ok: true };
}

/** Devolve para ajustes com motivo (admin). */
export async function pedirAjustes(id: string, motivoBruto: string): Promise<ArtigoResult> {
  const perfil = await getPerfilAtual();
  if (perfil?.papel !== "admin") return { erro: "Sem permissão." };
  const motivo = (motivoBruto || "").trim();
  if (motivo.length < 10) return { erro: "Escreva o que precisa mudar (mín. 10 caracteres)." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("artigos")
    .update({ status: "ajustes", motivo })
    .eq("id", id);
  if (error) return { erro: "Não foi possível enviar a devolutiva." };
  revalidatePath("/coordenacao");
  revalidatePath("/meus-artigos");
  return { ok: true };
}

/** Incrementa leituras ao abrir um artigo publicado (RPC SECURITY DEFINER). */
export async function incrementarLeitura(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("incrementar_leitura", { p_artigo: id });
}
