import { redirect } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { getPerfilAtual } from "@/lib/auth";
import { FormNovaSenha } from "./form-nova-senha";

export const dynamic = "force-dynamic";

/* Destino do link de recuperação de senha (após verifyOtp em /auth/confirmar).
   A sessão já está ativa aqui; o usuário só define a nova senha. */
export default async function NovaSenhaPage() {
  const perfil = await getPerfilAtual();
  if (!perfil) redirect("/entrar?erro=link-invalido");

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-10" style={{ background: C.fundo, color: C.ink }}>
      <div className="w-full" style={{ maxWidth: 420 }}>
        <div className="text-center">
          <p className="uppercase" style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: ".14em", color: C.sobreFundo }}>
            Rede Nacional de Especialistas
          </p>
          <h1 className="mt-2 text-[28px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            Criar nova senha
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: C.muted }}>
            Olá, {perfil.nome.split(" ")[0]}. Defina uma nova senha para sua conta.
          </p>
        </div>
        <div className="mt-6 rounded-3xl p-5" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <FormNovaSenha />
        </div>
      </div>
    </main>
  );
}
