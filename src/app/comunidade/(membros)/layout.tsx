import { exigirMembro } from "@/comunidade/lib/sessao";
import { CascaMembros } from "@/comunidade/components/casca";

export const dynamic = "force-dynamic";

/* Tudo aqui dentro é só para membro aprovado. Sem login, a porta manda para a
   tela de entrada; com login e sem aprovação, para o questionário. */
export default async function MembrosLayout({ children }: { children: React.ReactNode }) {
  const perfil = await exigirMembro();
  return <CascaMembros perfil={perfil}>{children}</CascaMembros>;
}
