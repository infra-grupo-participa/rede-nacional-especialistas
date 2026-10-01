"use client";

import { useSyncExternalStore } from "react";

/* Conta lembrada neste aparelho (nome, foto e e-mail), como o "Continuar" do
   Facebook. Fica só no navegador da pessoa (localStorage) e nunca guarda senha
   nem sessão: ao continuar, ela digita a senha. A engrenagem da tela de
   entrada remove a conta do aparelho. */

export interface ContaSalva {
  nome: string;
  email: string;
  avatar: string | null;
}

const CHAVE = "rede:conta";
const EVENTO = "rede:conta";

function lerBruto(): string | null {
  try {
    return window.localStorage.getItem(CHAVE);
  } catch {
    return null; // navegação privada ou armazenamento bloqueado
  }
}

function assinar(aoMudar: () => void) {
  window.addEventListener("storage", aoMudar);
  window.addEventListener(EVENTO, aoMudar);
  return () => {
    window.removeEventListener("storage", aoMudar);
    window.removeEventListener(EVENTO, aoMudar);
  };
}

function interpretar(bruto: string | null): ContaSalva | null {
  if (!bruto) return null;
  try {
    const c = JSON.parse(bruto) as Partial<ContaSalva>;
    if (typeof c.nome !== "string" || typeof c.email !== "string" || !c.email.includes("@")) return null;
    return { nome: c.nome, email: c.email, avatar: typeof c.avatar === "string" && c.avatar ? c.avatar : null };
  } catch {
    return null;
  }
}

/** `undefined` enquanto o navegador ainda não leu (servidor e hidratação);
 *  depois, a conta salva ou `null`. */
export function useContaSalva(): ContaSalva | null | undefined {
  const bruto = useSyncExternalStore<string | null | undefined>(assinar, lerBruto, () => undefined);
  return bruto === undefined ? undefined : interpretar(bruto);
}

export function salvarConta(conta: ContaSalva) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(conta));
    window.dispatchEvent(new Event(EVENTO));
  } catch {
    /* sem armazenamento: a entrada segue no modo comum */
  }
}

export function removerConta() {
  try {
    window.localStorage.removeItem(CHAVE);
    window.dispatchEvent(new Event(EVENTO));
  } catch {
    /* nada a remover */
  }
}
