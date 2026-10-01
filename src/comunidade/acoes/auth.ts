"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { URL_CONFIRMAR_AUTH } from "@/lib/supabase/config";

export type AuthState = { erro?: string; ok?: boolean; mensagem?: string };

/** Cookie que diz ao /auth/confirmar que o pedido de nova senha saiu da
 *  comunidade: o link do e-mail volta para /comunidade/nova-senha, e não para
 *  a tela do blog. Vale 1 hora, o mesmo prazo do link. */
const COOKIE_VOLTA = "rede_volta";

function emailValido(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function entrar(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");

  if (!emailValido(email)) return { erro: "Digite um e-mail válido." };
  if (!senha) return { erro: "Digite sua senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: "E-mail ou senha incorretos." };

  revalidatePath("/comunidade", "layout");
  redirect("/comunidade");
}

export async function cadastrar(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const primeiro = String(formData.get("nome") || "").trim();
  const sobrenome = String(formData.get("sobrenome") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");
  const nome = `${primeiro} ${sobrenome}`.replace(/\s+/g, " ").trim();

  if (primeiro.length < 2) return { erro: "Digite seu nome." };
  if (sobrenome.length < 2) return { erro: "Digite seu sobrenome." };
  if (!emailValido(email)) return { erro: "Digite um e-mail válido." };
  if (senha.length < 6) return { erro: "A senha precisa ter pelo menos 6 caracteres." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    // origem='rede' faz o trigger handle_new_user criar o perfil `pendente`.
    options: { data: { origem: "rede", nome } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("registered")) {
      return { erro: "Já existe uma conta com esse e-mail. Entre com sua senha." };
    }
    return { erro: "Não foi possível criar a conta. Tente de novo." };
  }

  // Com a confirmação de e-mail desligada a sessão já vem ativa. A porta da
  // comunidade decide o destino: aluno já aprovado cai no feed; os demais, no
  // questionário de entrada.
  if (data.session) {
    revalidatePath("/comunidade", "layout");
    redirect("/comunidade");
  }

  return {
    ok: true,
    mensagem: "Conta criada. Confirme seu e-mail para continuar. Depois a coordenação libera seu acesso.",
  };
}

export async function recuperarSenha(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!emailValido(email)) return { erro: "Digite um e-mail válido." };

  const supabase = await createClient();
  // Não revelamos se o e-mail existe: a resposta é sempre a mesma.
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: URL_CONFIRMAR_AUTH });

  const jar = await cookies();
  jar.set(COOKIE_VOLTA, "comunidade", {
    maxAge: 60 * 60,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return {
    ok: true,
    mensagem:
      "Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha. Confira a caixa de entrada e o spam.",
  };
}

export async function definirNovaSenha(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const senha = String(formData.get("senha") || "");
  if (senha.length < 6) return { erro: "A senha precisa ter pelo menos 6 caracteres." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: "Não foi possível trocar a senha. Peça um novo link." };

  (await cookies()).delete(COOKIE_VOLTA);
  redirect("/comunidade");
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/comunidade", "layout");
  redirect("/comunidade/entrar");
}

/** Membro logado pede o link para trocar a própria senha (menu da conta). */
export async function pedirNovaSenha(): Promise<{ ok?: boolean; erro?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { erro: "Entre para trocar sua senha." };

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: URL_CONFIRMAR_AUTH });
  if (error) return { erro: "Não foi possível enviar agora. Tente de novo." };

  (await cookies()).set(COOKIE_VOLTA, "comunidade", {
    maxAge: 60 * 60,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return { ok: true };
}
