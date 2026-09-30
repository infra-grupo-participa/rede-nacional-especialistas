"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PedidoResult = { erro?: string; ok?: boolean };

const ERROS: Record<string, string> = {
  regras_nao_aceitas: "Para entrar, é preciso aceitar as regras da comunidade.",
  respostas_incompletas: "Responda todas as perguntas.",
  perfil_nao_pendente: "Seu cadastro já foi analisado pela coordenação.",
  sem_perfil: "Não encontramos seu cadastro. Saia e entre de novo.",
};

/** Envia (ou reenvia, enquanto pendente) o questionário de entrada. */
export async function enviarPedido(respostas: string[], aceitouRegras: boolean): Promise<PedidoResult> {
  const limpas = respostas.map((r) => (r || "").trim().slice(0, 1000));
  if (limpas.some((r) => r.length < 2)) return { erro: ERROS.respostas_incompletas };
  if (!aceitouRegras) return { erro: ERROS.regras_nao_aceitas };

  const supabase = await createClient();
  const { error } = await supabase.rpc("enviar_pedido_entrada", {
    p_respostas: limpas,
    p_aceitou_regras: aceitouRegras,
  });
  if (error) {
    const chave = Object.keys(ERROS).find((k) => error.message.includes(k));
    return { erro: chave ? ERROS[chave] : "Não foi possível enviar. Tente de novo." };
  }
  revalidatePath("/aguardando");
  return { ok: true };
}
