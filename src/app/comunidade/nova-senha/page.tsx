import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPerfilAtual } from "@/comunidade/lib/sessao";
import { TelaNovaSenha } from "@/comunidade/components/entrada/tela-senha";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nova senha" };

/* Destino do link de nova senha (depois do verifyOtp em /auth/confirmar). */
export default async function NovaSenhaPage() {
  const perfil = await getPerfilAtual();
  if (!perfil) redirect("/comunidade/entrar?erro=link-invalido");
  return <TelaNovaSenha primeiroNome={perfil.nome.split(" ")[0]} />;
}
