"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";

export type PerfilResult = { erro?: string; ok?: boolean };

export interface Destaque {
  titulo: string;
  texto: string;
}

export interface PerfilInput {
  nome: string;
  profissao: string;
  headline: string;
  cidade: string;
  uf: string;
  espaco: string;
  telefone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  facebook: string;
  site: string;
  bio: string;
  avatar_url: string;
  capa_url: string;
  cor_capa: string;
  especialidades: string[];
  destaques: Destaque[];
}

/** Salva os dados que o próprio dono pode editar (o guard congela os privilegiados). */
export async function salvarPerfil(input: PerfilInput): Promise<PerfilResult> {
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Entre para atualizar seus dados." };

  const nome = input.nome.trim();
  if (!nome) return { erro: "O nome não pode ficar vazio." };

  // saneia listas
  const especialidades = (input.especialidades ?? [])
    .map((e) => e.trim())
    .filter(Boolean)
    .slice(0, 12);
  const destaques = (input.destaques ?? [])
    .map((d) => ({ titulo: (d.titulo ?? "").trim(), texto: (d.texto ?? "").trim() }))
    .filter((d) => d.titulo)
    .slice(0, 8);

  const supabase = await createClient();
  const { error } = await supabase
    .from("perfis")
    .update({
      nome,
      profissao: input.profissao.trim(),
      headline: input.headline.trim(),
      cidade: input.cidade.trim(),
      uf: input.uf.trim().toUpperCase() || null,
      espaco: input.espaco.trim(),
      telefone: input.telefone.trim(),
      whatsapp: input.whatsapp.trim(),
      instagram: input.instagram.trim(),
      linkedin: input.linkedin.trim(),
      youtube: input.youtube.trim(),
      tiktok: input.tiktok.trim(),
      facebook: input.facebook.trim(),
      site: input.site.trim(),
      bio: input.bio.trim(),
      avatar_url: input.avatar_url.trim(),
      capa_url: input.capa_url.trim(),
      cor_capa: input.cor_capa.trim(),
      especialidades,
      destaques,
    })
    .eq("id", perfil.id);

  if (error) return { erro: "Não foi possível salvar. Tente de novo." };
  revalidatePath("/conta");
  if (perfil.slug) revalidatePath(`/especialista/${perfil.slug}`);
  return { ok: true };
}
