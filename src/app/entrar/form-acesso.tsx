"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { Botao } from "@/components/atoms";
import { entrar, cadastrar, recuperarSenha, type AuthState } from "./actions";

function CampoSenha({
  name,
  rotulo,
  placeholder,
}: {
  name: string;
  rotulo: string;
  placeholder: string;
}) {
  const [ver, setVer] = useState(false);
  return (
    <label className="block pt-4">
      <span
        className="mb-1.5 block text-[11px] uppercase"
        style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}
      >
        {rotulo}
      </span>
      <div className="relative">
        <input
          type={ver ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-2xl pl-4 pr-14 text-[15px] outline-none"
          style={{ height: 52, background: C.paper, border: `1px solid ${C.line}`, color: C.ink }}
        />
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          aria-label={ver ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 flex items-center justify-center rounded-xl"
          style={{ transform: "translateY(-50%)", width: 44, height: 44, color: C.muted }}
        >
          {ver ? (
            <Ico.olhoOff style={{ width: 20, height: 20 }} />
          ) : (
            <Ico.olho style={{ width: 20, height: 20 }} />
          )}
        </button>
      </div>
    </label>
  );
}

export function FormAcesso() {
  const [modo, setModo] = useState<"entrar" | "cadastrar" | "recuperar">("entrar");
  const acao = modo === "entrar" ? entrar : modo === "cadastrar" ? cadastrar : recuperarSenha;
  const [estado, formAction, pending] = useActionState<AuthState, FormData>(acao, {});

  const entrando = modo === "entrar";
  const recuperando = modo === "recuperar";

  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-10"
      style={{ background: C.fundo, color: C.ink }}
    >
      <div className="w-full" style={{ maxWidth: 420 }}>
        <div className="text-center">
          <p
            className="uppercase"
            style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: ".14em", color: C.sobreFundo }}
          >
            Rede Nacional de Especialistas
          </p>
          <h1 className="mt-2 text-[28px] leading-tight" style={{ fontFamily: F.serif }}>
            {entrando ? "Entrar na comunidade" : recuperando ? "Recuperar acesso" : "Criar minha conta"}
          </h1>
        </div>

        <div className="mt-6 rounded-3xl p-5" style={{ background: C.surface }}>
          <form action={formAction} key={modo}>
            {!entrando && (
              <label className="block">
                <span
                  className="mb-1.5 block text-[11px] uppercase"
                  style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}
                >
                  Nome completo
                </span>
                <input
                  name="nome"
                  placeholder="como você quer aparecer na rede"
                  className="w-full rounded-2xl px-4 text-[15px] outline-none"
                  style={{ height: 52, background: C.paper, border: `1px solid ${C.line}`, color: C.ink }}
                />
              </label>
            )}

            <label className={`block ${entrando ? "" : "pt-4"}`}>
              <span
                className="mb-1.5 block text-[11px] uppercase"
                style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}
              >
                E-mail
              </span>
              <input
                name="email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="seu@email.com.br"
                className="w-full rounded-2xl px-4 text-[15px] outline-none"
                style={{ height: 52, background: C.paper, border: `1px solid ${C.line}`, color: C.ink }}
              />
            </label>

            {!recuperando && (
              <CampoSenha
                name="senha"
                rotulo="Senha"
                placeholder={entrando ? "sua senha" : "mínimo de 6 caracteres"}
              />
            )}
            {modo === "cadastrar" && (
              <CampoSenha name="senha2" rotulo="Repita a senha" placeholder="digite de novo" />
            )}
            {entrando && (
              <button
                type="button"
                onClick={() => setModo("recuperar")}
                className="mt-3 text-[13px] font-semibold"
                style={{ color: C.petrol }}
              >
                Esqueci minha senha
              </button>
            )}

            {estado.erro && (
              <p
                className="mt-3 rounded-xl px-3 py-2.5 text-[13px] leading-relaxed"
                style={{ background: "#FBEDEC", color: "#A33F37" }}
              >
                {estado.erro}
              </p>
            )}
            {estado.ok && estado.mensagem && (
              <p
                className="mt-3 rounded-xl px-3 py-2.5 text-[13px] leading-relaxed"
                style={{ background: "#E6EEEC", color: "#14504B" }}
              >
                {estado.mensagem}
              </p>
            )}

            <div className="mt-5">
              <Botao full type="submit" disabled={pending}>
                {pending
                  ? "Aguarde…"
                  : entrando
                    ? "Entrar"
                    : recuperando
                      ? "Enviar link de recuperação"
                      : "Criar conta e continuar"}
              </Botao>
            </div>
          </form>

          <button
            onClick={() => setModo(entrando || recuperando ? "cadastrar" : "entrar")}
            className="mt-4 w-full text-center text-[14px] font-semibold"
            style={{ color: C.petrol }}
          >
            {entrando || recuperando ? "Não tenho conta — cadastrar-me" : "Já tenho conta — entrar"}
          </button>
          {recuperando && (
            <button
              onClick={() => setModo("entrar")}
              className="mt-2 w-full text-center text-[13px]"
              style={{ color: C.muted }}
            >
              ← Voltar para entrar
            </button>
          )}
        </div>

        <p className="mt-5 text-center text-[13px]" style={{ color: C.sobreFundo }}>
          <Link href="/" style={{ color: C.ink, fontWeight: 600 }}>
            ← Voltar para a vitrine
          </Link>
        </p>
      </div>
    </main>
  );
}
