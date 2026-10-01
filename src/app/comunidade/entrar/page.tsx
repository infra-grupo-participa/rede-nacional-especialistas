import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPerfilAtual } from "@/comunidade/lib/sessao";
import { TelaEntrar } from "@/comunidade/components/entrada/tela-entrar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Quem já está com a sessão aberta não vê a entrada: vai direto para a comunidade.
  if (await getPerfilAtual()) redirect("/comunidade");
  const sp = await searchParams;
  return <TelaEntrar erro={typeof sp.erro === "string" ? sp.erro : null} />;
}
