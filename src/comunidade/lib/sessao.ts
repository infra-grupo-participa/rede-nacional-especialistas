import { cache } from "react";
import { redirect } from "next/navigation";
import { getPerfilAtual as lerPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";

/** Perfil visto pela comunidade: o do site + o selo de verificado (0008). */
export type PerfilRede = Perfil & { verificado?: boolean };

/** Perfil da sessão, lido uma vez por request (layout e página compartilham). */
export const getPerfilAtual = cache(async (): Promise<PerfilRede | null> => {
  return (await lerPerfil()) as PerfilRede | null;
});

/** E-mail de LOGIN (auth.users). Pode ser diferente de perfis.email: quando a
 *  coordenação vincula a conta ao cadastro da base, o perfil fica com o e-mail
 *  da compra. É este que a conta salva no aparelho precisa guardar. */
export const getEmailLogin = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
});

export interface SessaoNav {
  logado: boolean;
  aprovado: boolean;
  isAdmin: boolean;
  nome: string | null;
  primeiroNome: string | null;
  avatar: string | null;
  slug: string | null;
  email: string | null;
}

export async function getSessaoNav(): Promise<SessaoNav> {
  const [p, emailLogin] = await Promise.all([getPerfilAtual(), getEmailLogin()]);
  return {
    logado: !!p,
    aprovado: p?.status === "aprovado",
    isAdmin: p?.papel === "admin" && p?.status === "aprovado",
    nome: p?.nome ?? null,
    primeiroNome: p ? p.nome.split(" ")[0] : null,
    avatar: p?.avatar_url ?? null,
    slug: p?.slug ?? null,
    email: emailLogin ?? p?.email ?? null,
  };
}

/** Porta da comunidade: sem login vai para a tela de entrada; com login e sem
 *  aprovação, para o questionário. A RLS garante o mesmo no banco; aqui é o
 *  caminho certo para cada caso. */
export async function exigirMembro(): Promise<PerfilRede> {
  const perfil = await getPerfilAtual();
  if (!perfil) redirect("/comunidade/entrar");
  if (perfil.status !== "aprovado") redirect("/comunidade/aguardando");
  return perfil;
}
