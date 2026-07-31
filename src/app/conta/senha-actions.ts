"use server";

import { createClient } from "@/lib/supabase/server";

export type SenhaResult = { erro?: string; ok?: boolean };

/** Dispara o e-mail de redefinição de senha para o próprio usuário logado. */
export async function pedirRedefinicaoSenha(): Promise<SenhaResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { erro: "Entre para redefinir sua senha." };

  const { error } = await supabase.auth.resetPasswordForEmail(user.email);
  if (error) return { erro: "Não foi possível enviar agora. Tente de novo." };
  return { ok: true };
}
