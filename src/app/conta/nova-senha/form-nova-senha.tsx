"use client";

import { useActionState } from "react";
import { C, F } from "@/lib/tokens";
import { Botao } from "@/components/atoms";
import { definirNovaSenha, type NovaSenhaState } from "./actions";

export function FormNovaSenha() {
  const [estado, formAction, pending] = useActionState<NovaSenhaState, FormData>(definirNovaSenha, {});
  return (
    <form action={formAction}>
      <label className="block">
        <span className="mb-1.5 block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}>
          Nova senha
        </span>
        <input
          type="password"
          name="senha"
          placeholder="mínimo de 6 caracteres"
          autoComplete="new-password"
          className="w-full rounded-2xl px-4 text-[15px] outline-none"
          style={{ height: 52, background: C.paper, border: `1px solid ${C.line}`, color: C.ink }}
        />
      </label>
      <label className="block pt-4">
        <span className="mb-1.5 block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}>
          Repita a senha
        </span>
        <input
          type="password"
          name="senha2"
          placeholder="digite de novo"
          autoComplete="new-password"
          className="w-full rounded-2xl px-4 text-[15px] outline-none"
          style={{ height: 52, background: C.paper, border: `1px solid ${C.line}`, color: C.ink }}
        />
      </label>
      {estado.erro && (
        <p className="mt-3 rounded-xl px-3 py-2.5 text-[13px] leading-relaxed" style={{ background: "#FBEDEC", color: "#A33F37" }}>
          {estado.erro}
        </p>
      )}
      <div className="mt-5">
        <Botao full type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar nova senha"}
        </Botao>
      </div>
    </form>
  );
}
