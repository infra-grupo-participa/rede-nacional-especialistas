"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type NovaSenhaState = { erro?: string };

export async function definirNovaSenha(
  _prev: NovaSenhaState,
  formData: FormData,
): Promise<NovaSenhaState> {
  const senha = String(formData.get("senha") || "");
  const senha2 = String(formData.get("senha2") || "");

  if (senha.length < 6) return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  if (senha !== senha2) return { erro: "As duas senhas não são iguais." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: "Não foi possível trocar a senha. Tente o link de novo." };

  redirect("/?senha=ok");
}
