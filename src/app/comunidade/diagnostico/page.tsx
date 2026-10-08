import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { lerMeuDiagnostico, modoPrevia } from "@/comunidade/acoes/diagnostico";
import { calcular, type Respostas } from "@/comunidade/lib/diagnostico";
import { AberturaDiagnostico } from "@/comunidade/components/diagnostico/abertura";
import { TesteDiagnostico } from "@/comunidade/components/diagnostico/teste";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Diagnóstico de Holding Familiar" };

/* Diagnóstico de Holding Familiar (isca da Black do Marcio).
   Sem sessão: abertura com criar conta / entrar. Com sessão: o teste.
   Já respondeu: o resultado salvo, com opção de refazer.
   Modo prévia (só em desenvolvimento com DIAG_PREVIA=1): pula o login e não grava
   nada. ?tela=criar-conta ou ?tela=entrar mostram a abertura; ?resultado=<faixa>
   abre um resultado de exemplo. */

/** Respostas de exemplo para ver cada faixa na prévia. */
const EXEMPLOS: Record<string, Respostas> = {
  excelente: respostasCom("advogado", "viver", "potenciais", "30+", "16+"),
  grande: respostasCom("advogado", "servico", "nao_sei", "6-15", "6-10"),
  razoavel: respostasCom("advogado", "academico", "nenhum", "1-5", "6-10"),
  pequena: respostasCom("estudante", "academico", "nenhum", "1-5", "1-5"),
};

function respostasCom(formacao: string, objetivo: string, carteira: string, contatos: string, clientes: string): Respostas {
  const r: Respostas = { formacao, objetivo, carteira, contatos_1mi: contatos, idade: "35-44" };
  for (const id of ["cli_inventario", "cli_protecao", "cli_legado", "cli_imoveis", "cli_controle", "cli_presumido", "cli_dividendos"]) {
    r[id] = clientes;
  }
  return r;
}

export default async function DiagnosticoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  if (await modoPrevia()) {
    const tela = typeof sp.tela === "string" ? sp.tela : null;
    const exemplo = typeof sp.resultado === "string" ? EXEMPLOS[sp.resultado] : undefined;
    const resultado = exemplo ? calcular(exemplo) : null;
    return (
      <>
        {tela === "entrar" || tela === "criar-conta" ? (
          <AberturaDiagnostico abaInicial={tela === "entrar" ? "entrar" : "criar"} />
        ) : (
          <TesteDiagnostico
            primeiroNome="Ana"
            salvo={exemplo && resultado ? { respostas: exemplo, resultado } : null}
            previa
          />
        )}
        <p className="rc-d-selo-previa">Prévia local</p>
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AberturaDiagnostico abaInicial={sp.tela === "entrar" ? "entrar" : "criar"} />;
  }

  const meta = (user.user_metadata ?? {}) as { nome?: unknown; full_name?: unknown };
  const nome = typeof meta.nome === "string" ? meta.nome : typeof meta.full_name === "string" ? meta.full_name : "";
  const primeiroNome = nome.trim().split(/\s+/)[0] || null;

  const salvo = await lerMeuDiagnostico();
  return <TesteDiagnostico primeiroNome={primeiroNome} salvo={salvo} />;
}
