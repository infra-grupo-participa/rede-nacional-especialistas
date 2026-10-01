"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { getPerfilAtual } from "@/comunidade/lib/sessao";
import { corDeCapaValida } from "@/comunidade/lib/perfil-tipos";

/* Edição do próprio perfil, campo a campo (a tela "Sobre" do perfil salva um
   bloco por vez, como no Facebook). Só o dono grava, e só os campos desta
   lista: nível, papel, status e selo são congelados pelo banco. */

export type PerfilResult = { ok?: boolean; erro?: string };

export interface Destaque {
  titulo: string;
  texto: string;
}

export type CamposPerfil = Partial<{
  nome: string;
  headline: string;
  bio: string;
  profissao: string;
  espaco: string;
  cidade: string;
  uf: string;
  whatsapp: string;
  telefone: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  facebook: string;
  site: string;
  avatar_url: string;
  capa_url: string;
  cor_capa: string;
  especialidades: string[];
  destaques: Destaque[];
}>;

const LIMITE: Record<string, number> = {
  nome: 120,
  headline: 140,
  bio: 1500,
  profissao: 80,
  espaco: 120,
  cidade: 80,
  whatsapp: 30,
  telefone: 30,
  instagram: 200,
  linkedin: 200,
  youtube: 200,
  tiktok: 200,
  facebook: 200,
  site: 200,
};

/** Imagem de perfil só pode ser a que o próprio app enviou para o Storage. */
function imagemDoApp(url: string): boolean {
  if (url === "") return true;
  return Boolean(SUPABASE_URL) && url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`) && url.length < 600;
}

export async function salvarCamposPerfil(campos: CamposPerfil): Promise<PerfilResult> {
  const perfil = await getPerfilAtual();
  if (!perfil) return { erro: "Entre para atualizar seu perfil." };
  if (!campos || typeof campos !== "object") return { erro: "Nada para salvar." };

  const mudanca: Record<string, unknown> = {};

  for (const chave of Object.keys(LIMITE)) {
    const bruto = (campos as Record<string, unknown>)[chave];
    if (bruto === undefined) continue;
    if (typeof bruto !== "string") return { erro: "Valor inválido." };
    const valor = bruto.trim();
    if (valor.length > LIMITE[chave]) return { erro: `Texto longo demais (o limite é ${LIMITE[chave]} letras).` };
    mudanca[chave] = valor;
  }
  if ("nome" in mudanca && String(mudanca.nome).length < 3) return { erro: "Digite seu nome completo." };

  if (campos.uf !== undefined) {
    const uf = String(campos.uf ?? "").trim().toUpperCase();
    if (uf && !/^[A-Z]{2}$/.test(uf)) return { erro: "A UF tem duas letras (ex.: SP)." };
    mudanca.uf = uf || null;
  }

  for (const chave of ["avatar_url", "capa_url"] as const) {
    const url = campos[chave];
    if (url === undefined) continue;
    if (typeof url !== "string" || !imagemDoApp(url.trim())) return { erro: "Imagem inválida. Envie a foto de novo." };
    mudanca[chave] = url.trim();
  }

  if (campos.cor_capa !== undefined) {
    const cor = String(campos.cor_capa ?? "").trim();
    if (cor && !corDeCapaValida(cor)) return { erro: "Cor de capa inválida." };
    mudanca.cor_capa = cor;
  }

  if (campos.especialidades !== undefined) {
    if (!Array.isArray(campos.especialidades)) return { erro: "Valor inválido." };
    const vistas = new Set<string>();
    mudanca.especialidades = campos.especialidades
      .filter((e): e is string => typeof e === "string")
      .map((e) => e.trim().slice(0, 40))
      .filter((e) => e && !vistas.has(e.toLowerCase()) && vistas.add(e.toLowerCase()))
      .slice(0, 12);
  }

  if (campos.destaques !== undefined) {
    if (!Array.isArray(campos.destaques)) return { erro: "Valor inválido." };
    mudanca.destaques = campos.destaques
      .filter((d) => d && typeof d === "object")
      .map((d) => ({ titulo: String(d.titulo ?? "").trim().slice(0, 80), texto: String(d.texto ?? "").trim().slice(0, 200) }))
      .filter((d) => d.titulo)
      .slice(0, 8);
  }

  if (Object.keys(mudanca).length === 0) return { erro: "Nada para salvar." };

  const supabase = await createClient();
  const { error } = await supabase.from("perfis").update(mudanca).eq("id", perfil.id);
  if (error) return { erro: "Não foi possível salvar. Tente de novo." };

  revalidatePath("/comunidade", "layout");
  return { ok: true };
}
