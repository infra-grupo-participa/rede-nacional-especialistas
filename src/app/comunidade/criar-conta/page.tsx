import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPerfilAtual } from "@/comunidade/lib/sessao";
import { TelaCriarConta } from "@/comunidade/components/entrada/tela-criar-conta";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Criar conta" };

export default async function CriarContaPage() {
  if (await getPerfilAtual()) redirect("/comunidade");
  return <TelaCriarConta />;
}
