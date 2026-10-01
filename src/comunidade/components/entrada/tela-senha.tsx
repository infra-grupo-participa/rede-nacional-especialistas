"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { definirNovaSenha, recuperarSenha, type AuthState } from "@/comunidade/acoes/auth";
import { MarcaTHB, RodapeEntrada, SetaVoltar } from "@/comunidade/components/entrada/pecas";
import { Ico } from "@/components/icons";

/* "Encontrar minha conta": pede o e-mail e manda o link para criar uma nova senha. */
export function TelaRecuperar() {
  const [email, setEmail] = useState("");
  const [estado, acao, pending] = useActionState<AuthState, FormData>(recuperarSenha, {});

  return (
    <div className="rc-entrada">
      <main className="rc-e-coluna">
        <Link href="/comunidade/entrar" className="rc-e-voltar" aria-label="Voltar">
          <SetaVoltar />
        </Link>
        <div style={{ marginTop: 6 }}>
          <MarcaTHB />
        </div>
        <h1>Encontre sua conta</h1>
        <p className="rc-e-sub">Digite o e-mail da sua conta. Enviamos um link para você criar uma nova senha.</p>

        {estado.ok ? (
          <p className="rc-e-aviso rc-e-ok" role="status">
            {estado.mensagem}
          </p>
        ) : (
          <form action={acao}>
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
            {estado.erro && (
              <p className="rc-e-aviso rc-e-erro" role="alert">
                {estado.erro}
              </p>
            )}
            <button type="submit" className="rc-e-botao rc-e-primario" disabled={pending} style={{ marginTop: 18 }}>
              {pending ? "Enviando…" : "Enviar link"}
            </button>
          </form>
        )}
        <Link href="/comunidade/entrar" className="rc-e-botao rc-e-neutro" style={{ marginTop: 10 }}>
          Voltar para a entrada
        </Link>
      </main>
      <RodapeEntrada />
    </div>
  );
}

/* Destino do link do e-mail: a sessão já está ativa, falta só a senha nova. */
export function TelaNovaSenha({ primeiroNome }: { primeiroNome: string }) {
  const [senha, setSenha] = useState("");
  const [ver, setVer] = useState(false);
  const [estado, acao, pending] = useActionState<AuthState, FormData>(definirNovaSenha, {});

  return (
    <div className="rc-entrada">
      <main className="rc-e-coluna">
        <div style={{ marginTop: 6 }}>
          <MarcaTHB />
        </div>
        <h1>Crie uma nova senha</h1>
        <p className="rc-e-sub">Olá, {primeiroNome}. Escolha a senha que você vai usar para entrar na Rede de Especialistas.</p>
        <form action={acao}>
          <label className="rc-e-rotulo" htmlFor="rc-senha">
            Nova senha
          </label>
          <div className="rc-e-campo-olho">
            <input
              id="rc-senha"
              className="rc-e-campo"
              type={ver ? "text" : "password"}
              name="senha"
              placeholder="Senha (mínimo de 6 caracteres)"
              autoComplete="new-password"
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <button type="button" className="rc-e-olho" onClick={() => setVer((v) => !v)} aria-label={ver ? "Esconder a senha" : "Mostrar a senha"}>
              {ver ? <Ico.olhoOff style={{ width: 20, height: 20 }} /> : <Ico.olho style={{ width: 20, height: 20 }} />}
            </button>
          </div>
          {estado.erro && (
            <p className="rc-e-aviso rc-e-erro" role="alert">
              {estado.erro}
            </p>
          )}
          <button type="submit" className="rc-e-botao rc-e-primario" disabled={pending} style={{ marginTop: 18 }}>
            {pending ? "Salvando…" : "Salvar e entrar"}
          </button>
        </form>
      </main>
      <RodapeEntrada />
    </div>
  );
}
