import { redirect } from "next/navigation";
import { getPerfilAtual } from "@/lib/auth";
import { C, F } from "@/lib/tokens";
import { Botao } from "@/components/atoms";
import { sair } from "@/app/entrar/actions";

export const dynamic = "force-dynamic";

const MENSAGENS: Record<string, { titulo: string; texto: string }> = {
  pendente: {
    titulo: "Seu acesso está em análise",
    texto:
      "A coordenação do Time Holding Brasil vai revisar seu cadastro e liberar seu acesso à comunidade. Você recebe um aviso assim que for aprovado.",
  },
  recusado: {
    titulo: "Cadastro não aprovado",
    texto:
      "Seu acesso não foi liberado pela coordenação. Se acha que houve engano, fale com a secretaria.",
  },
  suspenso: {
    titulo: "Acesso suspenso",
    texto: "Seu acesso à comunidade está suspenso no momento. Fale com a coordenação.",
  },
};

export default async function AguardandoPage() {
  const perfil = await getPerfilAtual();
  if (!perfil) redirect("/entrar");
  if (perfil.status === "aprovado") redirect("/");

  const m = MENSAGENS[perfil.status] ?? MENSAGENS.pendente;

  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-10 text-center"
      style={{ background: C.fundo, color: C.ink }}
    >
      <div className="w-full" style={{ maxWidth: 440 }}>
        <p
          className="uppercase"
          style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: ".14em", color: C.sobreFundo }}
        >
          Rede Nacional de Especialistas
        </p>
        <div className="mt-6 rounded-3xl p-6" style={{ background: C.surface }}>
          <h1 className="text-[24px] leading-tight" style={{ fontFamily: F.serif }}>
            {m.titulo}
          </h1>
          <p className="mx-auto mt-3 text-[15px] leading-relaxed" style={{ color: C.muted }}>
            {m.texto}
          </p>
          <p className="mt-4 text-[13px]" style={{ color: C.muted, fontFamily: F.mono }}>
            {perfil.nome} · {perfil.email}
          </p>
        </div>
        <form action={sair} className="mt-5">
          <Botao full variante="secundario" type="submit">
            Sair da conta
          </Botao>
        </form>
      </div>
    </main>
  );
}
