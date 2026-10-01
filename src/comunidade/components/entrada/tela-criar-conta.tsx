"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cadastrar, type AuthState } from "@/comunidade/acoes/auth";
import { ArteRede } from "@/comunidade/components/entrada/arte";
import { BotaoTema, MarcaTHB, RodapeEntrada, SetaVoltar } from "@/comunidade/components/entrada/pecas";
import { CampoSenha } from "@/comunidade/components/entrada/campo-senha";

/* Criar conta. No celular começa pelo convite ("Participe da Rede") e só
   depois abre o formulário; no desktop o formulário já vem aberto, em coluna
   central. A comunidade é fechada: a conta nasce pendente e a pessoa responde
   o questionário de entrada em seguida. */
export function TelaCriarConta() {
  const router = useRouter();
  const [passo, setPasso] = useState<"convite" | "form">("convite");
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [estado, acao, pending] = useActionState<AuthState, FormData>(cadastrar, {});

  const voltar = () => {
    // No celular o formulário volta para o convite; no desktop, para a entrada.
    if (window.matchMedia("(max-width: 899px)").matches && passo === "form") setPasso("convite");
    else router.push("/comunidade/entrar");
  };

  return (
    <div className="rc-entrada">
      <BotaoTema />
      {passo === "convite" && (
        <main className="rc-e-coluna rc-e-convite rc-e-so-celular">
          <Link href="/comunidade/entrar" className="rc-e-voltar" aria-label="Voltar">
            <SetaVoltar />
          </Link>
          <h1>Participe da Rede de Especialistas</h1>
          <div className="rc-arte-faixa">
            <ArteRede />
          </div>
          <p className="rc-e-sub">
            Crie uma conta para trocar experiência com advogados e contadores do Time Holding Brasil, em todo o país.
          </p>
          <div className="rc-e-pilha">
            <button type="button" className="rc-e-botao rc-e-primario" onClick={() => setPasso("form")}>
              Criar nova conta
            </button>
            <Link href="/comunidade/recuperar" className="rc-e-botao rc-e-neutro">
              Encontrar minha conta
            </Link>
          </div>
        </main>
      )}

      <main className={`rc-e-coluna${passo === "convite" ? " rc-e-so-desktop" : ""}`}>
        <button type="button" className="rc-e-voltar" aria-label="Voltar" onClick={voltar}>
          <SetaVoltar />
        </button>
        <div style={{ marginTop: 6 }}>
          <MarcaTHB />
        </div>
        <h1>Crie sua conta na Rede de Especialistas</h1>
        <p className="rc-e-sub">
          A comunidade fechada dos alunos do Time Holding Brasil: dúvidas, casos e materiais de quem trabalha com holding.
        </p>

        {estado.ok ? (
          <>
            <p className="rc-e-aviso rc-e-ok" role="status">
              {estado.mensagem}
            </p>
            <Link href="/comunidade/entrar" className="rc-e-botao rc-e-primario" style={{ marginTop: 18 }}>
              Ir para a entrada
            </Link>
          </>
        ) : (
          <form action={acao}>
            <span className="rc-e-rotulo">Nome</span>
            <div className="rc-e-dupla">
              <input className="rc-e-campo" name="nome" placeholder="Nome" aria-label="Nome" autoComplete="given-name" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <input className="rc-e-campo" name="sobrenome" placeholder="Sobrenome" aria-label="Sobrenome" autoComplete="family-name" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} required />
            </div>

            <label className="rc-e-rotulo" htmlFor="rc-email">
              E-mail
            </label>
            <input
              id="rc-email"
              className="rc-e-campo"
              type="email"
              name="email"
              inputMode="email"
              placeholder="E-mail"
              autoComplete="email"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="rc-e-nota">
              Use o mesmo e-mail da sua matrícula no Time Holding Brasil. É por ele que a coordenação confirma que você é aluno.
            </p>

            <label className="rc-e-rotulo" htmlFor="rc-senha">
              Senha
            </label>
            <CampoSenha id="rc-senha" placeholder="Senha (mínimo de 6 caracteres)" autoComplete="new-password" minLength={6} />

            {estado.erro && (
              <p className="rc-e-aviso rc-e-erro" role="alert">
                {estado.erro}
              </p>
            )}

            <div className="rc-e-legal">
              <p>
                A comunidade é fechada. Depois de criar a conta você responde algumas perguntas e a coordenação libera seu acesso.
              </p>
              <p>
                Ao tocar em Criar conta, você concorda com as{" "}
                <Link href="/comunidade/regras" target="_blank">
                  regras da comunidade
                </Link>
                .
              </p>
            </div>

            <div className="rc-e-pilha">
              <button type="submit" className="rc-e-botao rc-e-primario" disabled={pending}>
                {pending ? "Criando sua conta…" : "Criar conta"}
              </button>
              <Link href="/comunidade/entrar" className="rc-e-botao rc-e-neutro">
                Já tenho uma conta
              </Link>
            </div>
          </form>
        )}
      </main>
      <RodapeEntrada />
    </div>
  );
}
