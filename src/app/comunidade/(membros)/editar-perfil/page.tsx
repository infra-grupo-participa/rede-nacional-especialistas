import { redirect } from "next/navigation";
import { hrefMembro } from "@/comunidade/lib/grupo-tipos";
import { exigirMembro } from "@/comunidade/lib/sessao";

export const dynamic = "force-dynamic";

/* Editar o perfil é no próprio perfil, na aba Sobre (como no Facebook). Este
   endereço fica só para quem chega por um link antigo. */
export default async function EditarPerfilPage() {
  const perfil = await exigirMembro();
  redirect(`${hrefMembro(perfil)}?aba=sobre`);
}
