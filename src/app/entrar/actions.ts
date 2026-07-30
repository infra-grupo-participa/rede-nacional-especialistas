"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { erro?: string; ok?: boolean; mensagem?: string };

function emailValido(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function entrar(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");

  if (!emailValido(email)) return { erro: "Digite um e-mail válido." };
  if (!senha) return { erro: "Digite sua senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return { erro: "E-mail ou senha incorretos." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function cadastrar(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");
  const senha2 = String(formData.get("senha2") || "");

  if (nome.length < 3) return { erro: "Digite seu nome completo." };
  if (!emailValido(email)) return { erro: "Digite um e-mail válido." };
  if (senha.length < 6) return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  if (senha !== senha2) return { erro: "As duas senhas não são iguais." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      // origem='rede' faz o trigger handle_new_user criar o perfil `pendente`.
      data: { origem: "rede", nome },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("registered")) {
      return { erro: "Já existe uma conta com esse e-mail. Entre com sua senha." };
    }
    return { erro: "Não foi possível criar a conta. Tente de novo." };
  }

  // Se a confirmação de e-mail estiver desligada, a sessão já vem ativa.
  if (data.session) {
    revalidatePath("/", "layout");
    // Aluno da base THB já vem espelhado e aprovado (o trigger vinculou o
    // auth_id ao perfil existente). Nesse caso pula a fila e entra direto.
    const jaAprovado = data.user
      ? Boolean(
          (
            await supabase
              .from("perfis")
              .select("status")
              .eq("auth_id", data.user.id)
              .maybeSingle()
          ).data?.status === "aprovado",
        )
      : false;
    redirect(jaAprovado ? "/" : "/aguardando");
  }

  return {
    ok: true,
    mensagem:
      "Conta criada. Confirme seu e-mail para continuar — depois a coordenação aprova seu acesso.",
  };
}

export async function recuperarSenha(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!emailValido(email)) return { erro: "Digite um e-mail válido." };

  const supabase = await createClient();
  // O e-mail sai pela Edge Function rede-auth-email (Resend). Não revelamos se o
  // e-mail existe — resposta é sempre a mesma.
  await supabase.auth.resetPasswordForEmail(email);

  return {
    ok: true,
    mensagem:
      "Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. Confira sua caixa de entrada.",
  };
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
