"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { C, F, BORDA } from "@/lib/tokens";
import { Avatar } from "@/comunidade/components/atoms";
import { Ico } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { pedirNovaSenha, sair } from "@/comunidade/acoes/auth";
import { salvarConta } from "@/comunidade/lib/conta-salva";
import type { SessaoNav } from "@/comunidade/lib/sessao";

/* Barra do topo da Rede de Especialistas: marca à esquerda, conta à direita.
   A navegação da comunidade fica nas abas do grupo, logo abaixo. */
export function TopoComunidade({ sessao }: { sessao: SessaoNav }) {
  return (
    <header className="rc-topo">
      <Link href="/comunidade" className="rc-topo-marca" aria-label="Rede de Especialistas, início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/thb-logo.png" alt="Time Holding Brasil" />
        <span>Rede de Especialistas</span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <MenuConta sessao={sessao} />
      </div>
      <LembrarConta sessao={sessao} />
    </header>
  );
}

/* Guarda nome, foto e e-mail neste aparelho para a tela de entrada oferecer
   "Continuar" na próxima vez. Nunca guarda senha nem sessão. */
export function LembrarConta({ sessao }: { sessao: Pick<SessaoNav, "nome" | "email" | "avatar"> }) {
  const { nome, email, avatar } = sessao;
  useEffect(() => {
    if (nome && email) salvarConta({ nome, email, avatar });
  }, [nome, email, avatar]);
  return null;
}

function MenuConta({ sessao }: { sessao: SessaoNav }) {
  const [aberto, setAberto] = useState(false);
  const [pending, start] = useTransition();
  const [msgSenha, setMsgSenha] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const trocarSenha = () =>
    start(async () => {
      const r = await pedirNovaSenha();
      setMsgSenha(r.ok ? "Enviamos um link no seu e-mail." : (r.erro ?? "Não foi possível enviar."));
    });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Sua conta"
        aria-expanded={aberto}
        className="press flex items-center gap-1.5 rounded-full pl-1 pr-2"
        style={{ height: 40, background: C.paper, border: BORDA }}
      >
        <Avatar nome={sessao.nome ?? "?"} foto={sessao.avatar} size={30} />
        <Ico.baixo style={{ width: 15, height: 15, color: C.muted }} />
      </button>

      {aberto && (
        <div className="anim-fade absolute right-0 z-50 mt-2 w-72 rounded-2xl p-1.5" style={{ background: C.surface, border: BORDA }} role="menu">
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar nome={sessao.nome ?? "?"} foto={sessao.avatar} size={42} />
            <div className="min-w-0">
              <p className="truncate text-[15px]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 700 }}>
                {sessao.nome}
              </p>
              <p className="truncate text-[12.5px]" style={{ color: C.muted }}>
                {sessao.isAdmin ? "Coordenação" : "Membro"}
              </p>
            </div>
          </div>
          <div className="my-1" style={{ borderTop: BORDA }} />
          <Link href="/conta" className="rc-menu-item" role="menuitem" onClick={() => setAberto(false)}>
            <Ico.lapis style={{ width: 17, height: 17, color: C.muted }} />
            Editar meu perfil
          </Link>
          <button type="button" className="rc-menu-item" role="menuitem" onClick={trocarSenha} disabled={pending}>
            <Ico.mail style={{ width: 17, height: 17, color: C.muted }} />
            <span className="min-w-0">
              <span className="block">Trocar senha</span>
              {msgSenha && (
                <span className="block text-[12.5px] font-normal" style={{ color: C.muted }}>
                  {msgSenha}
                </span>
              )}
            </span>
          </button>
          <Link href="/" className="rc-menu-item" role="menuitem" onClick={() => setAberto(false)}>
            <Ico.externo style={{ width: 17, height: 17, color: C.muted }} />
            Blog do Time Holding Brasil
          </Link>
          <div className="my-1" style={{ borderTop: BORDA }} />
          <form action={sair}>
            <button type="submit" className="rc-menu-item" role="menuitem" style={{ color: "#B24A42" }}>
              <Ico.back style={{ width: 17, height: 17 }} />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
