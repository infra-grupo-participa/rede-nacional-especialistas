"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";

export type PerfilResult = { erro?: string; ok?: boolean };

export interface PerfilInput {
  nome: string;
  profissao: string;
  cidade: string;
  uf: string;
  espaco: string;
  telefone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  linkedin: string;
  site: string;
  bio: string;
}

/** Salva os dados que o próprio dono pode editar (o guard congela os privilegiados). */
export async function salvarPerfil(input: PerfilInput): Promise<PerfilResult> {
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Entre para atualizar seus dados." };

  const nome = input.nome.trim();
  if (!nome) return { erro: "O nome não pode ficar vazio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("perfis")
    .update({
      nome,
      profissao: input.profissao.trim(),
      cidade: input.cidade.trim(),
      uf: input.uf.trim().toUpperCase() || null,
      espaco: input.espaco.trim(),
      telefone: input.telefone.trim(),
      whatsapp: input.whatsapp.trim(),
      instagram: input.instagram.trim(),
      linkedin: input.linkedin.trim(),
      site: input.site.trim(),
      bio: input.bio.trim(),
    })
    .eq("id", perfil.id);

  if (error) return { erro: "Não foi possível salvar. Tente de novo." };
  revalidatePath("/conta");
  if (perfil.slug) revalidatePath(`/especialista/${perfil.slug}`);
  return { ok: true };
}
