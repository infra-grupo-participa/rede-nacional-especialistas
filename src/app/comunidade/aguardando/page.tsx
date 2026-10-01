import { redirect } from "next/navigation";
import { getEmailLogin, getPerfilAtual } from "@/comunidade/lib/sessao";
import { C, F } from "@/lib/tokens";
import { Botao } from "@/comunidade/components/atoms";
import { sair } from "@/comunidade/acoes/auth";
import { createClient } from "@/lib/supabase/server";
import { configComunidade } from "@/comunidade/lib/gestao";
import { FormPedido } from "@/comunidade/components/entrada/form-pedido";
import { PedidoEnviado } from "@/comunidade/components/entrada/pedido-enviado";
import { LembrarConta } from "@/comunidade/components/topo";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

const MENSAGENS: Record<string, { titulo: string; texto: string }> = {
  questionario: {
    titulo: "Falta pouco para entrar",
    texto:
      "A comunidade é exclusiva dos alunos do Time Holding Brasil. Responda as perguntas abaixo para a coordenação confirmar seu cadastro.",
  },
  pendente: {
    titulo: "Seu acesso está em análise",
    texto:
      "A coordenação do Time Holding Brasil vai revisar suas respostas e liberar seu acesso à comunidade.",
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
  if (!perfil) redirect("/comunidade/entrar");
  if (perfil.status === "aprovado") redirect("/comunidade");

  // Pendente: primeiro responde o questionário; depois aguarda a análise.
  type PedidoMeu = { respostas: { pergunta: string; resposta: string }[] };
  let pedido: PedidoMeu | null = null;
  const cfg = perfil.status === "pendente" ? await configComunidade() : null;
  if (perfil.status === "pendente") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pedidos_entrada")
      .select("respostas")
      .eq("perfil_id", perfil.id)
      .eq("status", "pendente")
      .maybeSingle();
    pedido = (data as PedidoMeu | null) ?? null;
  }
  const regras = (cfg?.regras ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const precisaResponder = perfil.status === "pendente" && !pedido && (cfg?.perguntas.length ?? 0) > 0;

  const m = precisaResponder ? MENSAGENS.questionario : (MENSAGENS[perfil.status] ?? MENSAGENS.pendente);

  return (
    <main
      className="relative flex min-h-[100dvh] flex-col items-center justify-center px-5 py-10 text-center"
      style={{ background: C.fundo, color: C.ink }}
    >
      <div className="absolute right-4 top-3.5">
        <ThemeToggle />
      </div>
      <div className="w-full" style={{ maxWidth: precisaResponder || pedido ? 520 : 440 }}>
        <p
          className="uppercase"
          style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: ".14em", color: C.sobreFundo }}
        >
          Rede de Especialistas
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
          {precisaResponder && cfg && <FormPedido perguntas={cfg.perguntas} regras={regras} />}
          {pedido && cfg && <PedidoEnviado respostas={pedido.respostas} perguntas={cfg.perguntas} regras={regras} />}
        </div>
        <LembrarConta sessao={{ nome: perfil.nome, email: (await getEmailLogin()) ?? perfil.email ?? null, avatar: perfil.avatar_url ?? null }} />
        <form action={sair} className="mt-5">
          <Botao full variante="secundario" type="submit">
            Sair da conta
          </Botao>
        </form>
      </div>
    </main>
  );
}
