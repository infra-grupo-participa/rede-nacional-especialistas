"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcular, PERGUNTAS, type Resultado, type Respostas } from "@/comunidade/lib/diagnostico";

export type DiagState = { erro?: string; ok?: boolean; mensagem?: string };

const ROTA = "/comunidade/diagnostico";

function campo(fd: FormData, nome: string): string {
  const valor = fd.get(nome);
  return typeof valor === "string" ? valor : "";
}

function emailValido(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Nunca registrar mensagem, detalhe, respostas ou identificador do usuário.
function registrarFalha(operacao: string) {
  console.error(`[diagnostico] Falha em ${operacao}; nenhum dado pessoal foi registrado.`);
}

function normalizarRespostas(entrada: unknown): Respostas | null {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) return null;
  const respostas: Respostas = {};
  for (const pergunta of PERGUNTAS) {
    const valor = Object.prototype.hasOwnProperty.call(entrada, pergunta.id)
      ? (entrada as Record<string, unknown>)[pergunta.id]
      : undefined;
    if (typeof valor !== "string" || !pergunta.opcoes.some((opcao) => opcao.id === valor)) return null;
    respostas[pergunta.id] = valor;
  }
  return respostas;
}

async function concluirEntrada(): Promise<never> {
  (await cookies()).delete({ name: "rede_acesso", path: "/comunidade" });
  revalidatePath("/comunidade", "layout");
  redirect(ROTA);
}

export async function modoPrevia(): Promise<boolean> {
  return process.env.NODE_ENV === "development" && process.env.DIAG_PREVIA === "1";
}

export async function cadastrarDiagnostico(_prev: DiagState, fd: FormData): Promise<DiagState> {
  const primeiro = campo(fd, "nome").trim();
  const sobrenome = campo(fd, "sobrenome").trim();
  const email = campo(fd, "email").trim().toLowerCase();
  const whatsapp = campo(fd, "whatsapp").replace(/\D/g, "");
  const senha = campo(fd, "senha");
  const nome = `${primeiro} ${sobrenome}`.replace(/\s+/g, " ");

  if (primeiro.length < 2 || primeiro.length > 100) return { erro: "Digite seu nome (de 2 a 100 caracteres)." };
  if (sobrenome.length < 2 || sobrenome.length > 100) return { erro: "Digite seu sobrenome (de 2 a 100 caracteres)." };
  if (!emailValido(email)) return { erro: "Digite um e-mail válido." };
  if (!/^(?:55)?[1-9]\d{9,10}$/.test(whatsapp)) return { erro: "Digite um WhatsApp válido com DDD." };
  if (senha.length < 6 || senha.length > 128) return { erro: "A senha precisa ter de 6 a 128 caracteres." };
  if (await modoPrevia()) return { erro: "Cadastro indisponível na prévia local. Volte ao diagnóstico para testar." };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { origem: "diagnostico", nome, sobrenome, whatsapp } },
    });
    if (error) return { erro: "Não foi possível criar a conta. Se já tem cadastro, entre com sua senha." };
    if (!data.session) {
      return { ok: true, mensagem: "Confira seu e-mail para confirmar a conta. Depois entre com sua senha para responder ao diagnóstico." };
    }
  } catch {
    registrarFalha("cadastro");
    return { erro: "O cadastro está indisponível agora. Tente novamente mais tarde." };
  }
  return concluirEntrada();
}

export async function entrarDiagnostico(_prev: DiagState, fd: FormData): Promise<DiagState> {
  const email = campo(fd, "email").trim().toLowerCase();
  const senha = campo(fd, "senha");
  if (!emailValido(email)) return { erro: "Digite um e-mail válido." };
  if (!senha || senha.length > 128) return { erro: "Digite sua senha." };
  if (await modoPrevia()) return { erro: "Login indisponível na prévia local. Volte ao diagnóstico para testar." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return { erro: "E-mail ou senha incorretos." };
  } catch {
    registrarFalha("login");
    return { erro: "O login está indisponível agora. Tente novamente mais tarde." };
  }
  return concluirEntrada();
}

export async function salvarDiagnostico(entrada: Record<string, string>): Promise<{ erro?: string; resultado?: Resultado }> {
  const respostas = normalizarRespostas(entrada);
  const resultado = respostas && calcular(respostas);
  if (!respostas || !resultado) return { erro: "Responda todas as perguntas com uma opção válida." };
  if (await modoPrevia()) return { resultado };

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { erro: "Entre com sua conta para salvar o diagnóstico." };

    // A RPC deriva a identidade de auth.uid() e recalcula no banco.
    // Nunca enviamos pontos, contato, faixa ou auth_id do navegador.
    const { data, error } = await supabase.rpc("salvar_diagnostico", { p_respostas: respostas });
    if (error) {
      registrarFalha("gravação");
      // Schema ausente ainda permite revelar o resultado calculado.
      if (["42P01", "42883", "PGRST202", "PGRST205", "PGRST106"].includes(error.code)) return { resultado };
      return { erro: "Seu resultado foi calculado, mas não pôde ser salvo. Tente novamente mais tarde.", resultado };
    }
    if (!data || data.pontos_total !== resultado.total || data.pontos_tecnica !== resultado.tecnica
      || data.pontos_comercial !== resultado.comercial || data.faixa !== resultado.faixa.id
      || data.mql !== resultado.mql || data.convidado_live !== resultado.faixa.convidaLive) {
      registrarFalha("paridade da classificação SQL/TypeScript");
    }
    revalidatePath(ROTA);
    return { resultado };
  } catch {
    registrarFalha("gravação");
    return { erro: "Não foi possível salvar agora. Tente novamente mais tarde." };
  }
}

export async function lerMeuDiagnostico(): Promise<{ respostas: Respostas; resultado: Resultado } | null> {
  if (await modoPrevia()) return null;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;
    const { data, error } = await supabase.from("diagnosticos").select("respostas")
      .eq("auth_id", user.id).maybeSingle();
    if (error) { registrarFalha("leitura"); return null; }
    const respostas = normalizarRespostas(data?.respostas);
    const resultado = respostas && calcular(respostas);
    return respostas && resultado ? { respostas, resultado } : null;
  } catch {
    registrarFalha("leitura");
    return null;
  }
}
