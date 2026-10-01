"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminOuNulo } from "@/lib/admin";
import type { Qualificacao } from "@/lib/qualificacoes";
import type { StatusPerfil } from "@/lib/types";
import { candidatosBase, type CandidatoBase } from "@/lib/gestao";

export type AcaoResult = { erro?: string; ok?: boolean; mensagem?: string };

const NIVEIS: Qualificacao[] = ["thb", "aurum", "platina", "diamante", "diamante_vermelho"];
const STATUS: StatusPerfil[] = ["pendente", "aprovado", "recusado", "suspenso"];

function revalidar() {
  revalidatePath("/coordenacao", "layout");
}

/* ------------------------------------------------------------- entrada -- */

/** Aprova ou recusa um pedido de entrada; na aprovação já define o nível. */
export async function decidirPedido(
  pedidoId: string,
  aprovar: boolean,
  motivo: string,
  nivel: Qualificacao | null,
): Promise<AcaoResult> {
  if (!(await adminOuNulo())) return { erro: "Sem permissão." };
  if (nivel && !NIVEIS.includes(nivel)) return { erro: "Nível inválido." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("decidir_pedido", {
    p_pedido: pedidoId,
    p_aprovar: aprovar,
    p_motivo: (motivo || "").trim().slice(0, 500),
    p_qualificacao: nivel,
  });
  if (error) {
    if (error.message.includes("pedido_indisponivel")) return { erro: "Este pedido já foi decidido." };
    return { erro: "Não foi possível registrar a decisão." };
  }
  revalidar();
  return { ok: true };
}

/** Muda nível, status ou o selo de verificado de um membro (só coordenação).
 *  Também usado para liberar direto um pendente sem questionário (equipe). */
export async function alterarMembro(
  perfilId: string,
  mudanca: { nivel?: Qualificacao; status?: StatusPerfil; verificado?: boolean },
): Promise<AcaoResult> {
  if (!(await adminOuNulo())) return { erro: "Sem permissão." };
  const dados: Record<string, string | boolean> = {};
  if (typeof mudanca.verificado === "boolean") dados.verificado = mudanca.verificado;
  if (mudanca.nivel) {
    if (!NIVEIS.includes(mudanca.nivel)) return { erro: "Nível inválido." };
    dados.qualificacao = mudanca.nivel;
  }
  if (mudanca.status) {
    if (!STATUS.includes(mudanca.status)) return { erro: "Status inválido." };
    dados.status = mudanca.status;
  }
  if (Object.keys(dados).length === 0) return { ok: true };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfis")
    .update(dados)
    .eq("id", perfilId)
    .select("verificado")
    .maybeSingle();
  if (error) return { erro: "Não foi possível salvar." };
  // O banco só aceita selo em perfil com login (gatilho da 0008).
  if (mudanca.verificado === true && data && !(data as { verificado: boolean }).verificado)
    return { erro: "Esse membro ainda não criou conta na rede, então não pode receber o selo." };
  revalidar();
  return { ok: true };
}

/** Une o membro ao cadastro da base de alunos (e-mail/telefone da compra). */
export async function vincularBase(perfilId: string, perfilBaseId: string): Promise<AcaoResult> {
  if (!(await adminOuNulo())) return { erro: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("vincular_a_base", { p_perfil: perfilId, p_perfil_base: perfilBaseId });
  if (error) {
    if (error.message.includes("base_ja_tem_login")) return { erro: "Esse cadastro da base já está ligado a outra conta." };
    return { erro: "Não foi possível vincular." };
  }
  revalidar();
  return { ok: true, mensagem: "Vinculado. O membro assumiu o nível e os dados da base." };
}

/** Roda agora o espelho da base de alunos (também roda todo dia às 3h). */
export async function sincronizarBase(): Promise<AcaoResult> {
  if (!(await adminOuNulo())) return { erro: "Sem permissão." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_sincronizar_base");
  if (error) return { erro: "A sincronização falhou." };
  const r = (Array.isArray(data) ? data[0] : data) as { inseridos: number; atualizados: number } | null;
  revalidar();
  return {
    ok: true,
    mensagem: r ? `Base sincronizada: ${r.inseridos} novos, ${r.atualizados} atualizados.` : "Base sincronizada.",
  };
}

/* ------------------------------------------------------ regras / config -- */

function limparHashtags(bruto: string): string[] {
  const vistos = new Set<string>();
  for (const t of bruto.split(/[\s,;]+/)) {
    const h = t
      .replace(/^#+/, "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    if (h) vistos.add(h);
  }
  return [...vistos].slice(0, 40);
}

export async function salvarConfig(input: {
  regras: string;
  perguntas: string[];
  hashtags: string;
  exigirHashtag: boolean;
}): Promise<AcaoResult> {
  if (!(await adminOuNulo())) return { erro: "Sem permissão." };
  const perguntas = input.perguntas.map((p) => p.trim()).filter(Boolean).slice(0, 10);
  if (perguntas.length === 0) return { erro: "Deixe pelo menos uma pergunta de entrada." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("config_comunidade")
    .update({
      regras: input.regras.trim().slice(0, 8000),
      perguntas: perguntas.map((p) => p.slice(0, 300)),
      hashtags: limparHashtags(input.hashtags),
      exigir_hashtag: input.exigirHashtag,
    })
    .eq("id", 1);
  if (error) return { erro: "Não foi possível salvar." };
  revalidar();
  revalidatePath("/regras");
  return { ok: true, mensagem: "Salvo." };
}

export async function adicionarPalavra(termo: string): Promise<AcaoResult> {
  const admin = await adminOuNulo();
  if (!admin) return { erro: "Sem permissão." };
  const t = termo.trim().slice(0, 80);
  if (t.length < 2) return { erro: "Digite a palavra ou expressão." };
  const supabase = await createClient();
  const { error } = await supabase.from("palavras_moderacao").insert({ termo: t, criado_por: admin.id });
  if (error) return { erro: error.code === "23505" ? "Essa palavra já está na lista." : "Não foi possível adicionar." };
  revalidar();
  return { ok: true };
}

export async function removerPalavra(id: string): Promise<AcaoResult> {
  if (!(await adminOuNulo())) return { erro: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("palavras_moderacao").delete().eq("id", id);
  if (error) return { erro: "Não foi possível remover." };
  revalidar();
  return { ok: true };
}

/** Candidatos da base de alunos para um membro (por e-mail, telefone ou nome). */
export async function buscarCandidatos(perfilId: string): Promise<{ erro?: string; candidatos?: CandidatoBase[] }> {
  if (!(await adminOuNulo())) return { erro: "Sem permissão." };
  return { candidatos: await candidatosBase(perfilId) };
}
