"use client";

import { useState } from "react";
import { Ico } from "@/components/icons";

/* Campo de senha das telas de entrada. O olhinho aparece assim que a pessoa
   começa a digitar e alterna entre esconder e mostrar a senha. */
export function CampoSenha({
  id,
  placeholder = "Senha",
  autoComplete = "current-password",
  autoFocus,
  minLength,
}: {
  id?: string;
  placeholder?: string;
  autoComplete?: "current-password" | "new-password";
  autoFocus?: boolean;
  minLength?: number;
}) {
  const [valor, setValor] = useState("");
  const [ver, setVer] = useState(false);

  return (
    <div className="rc-e-campo-olho">
      <input
        id={id}
        className="rc-e-campo"
        type={ver ? "text" : "password"}
        name="senha"
        placeholder={placeholder}
        aria-label={id ? undefined : "Senha"}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        minLength={minLength}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        required
      />
      {valor.length > 0 && (
        <button
          type="button"
          className="rc-e-olho"
          // mousedown sem troca de foco: o cursor fica no campo e o teclado do celular não fecha
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVer((v) => !v)}
          aria-label={ver ? "Esconder a senha" : "Mostrar a senha"}
        >
          {ver ? <Ico.olhoOff style={{ width: 20, height: 20 }} /> : <Ico.olho style={{ width: 20, height: 20 }} />}
        </button>
      )}
    </div>
  );
}
