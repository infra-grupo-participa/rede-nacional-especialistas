import { redirect } from "next/navigation";
import { getPerfilAtual } from "@/lib/auth";
import type { Perfil } from "@/lib/types";

/** Página da coordenação: sem login vai para /entrar; sem papel admin, para /. */
export async function exigirAdminPagina(): Promise<Perfil> {
  const perfil = await getPerfilAtual();
  if (!perfil) redirect("/entrar");
  if (perfil.papel !== "admin" || perfil.status !== "aprovado") redirect("/");
  return perfil;
}

/** Server Action da coordenação: devolve o perfil admin ou null. */
export async function adminOuNulo(): Promise<Perfil | null> {
  const perfil = await getPerfilAtual();
  return perfil && perfil.papel === "admin" && perfil.status === "aprovado" ? perfil : null;
}
