"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Avatar } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { sair } from "@/app/entrar/actions";
import { criarArtigo } from "@/app/artigos/actions";
import { pedirRedefinicaoSenha } from "@/app/conta/senha-actions";

export interface SessaoNav {
  logado: boolean;
  aprovado: boolean;
  isAdmin: boolean;
  nome: string | null;
  primeiroNome: string | null;
  avatar: string | null;
  slug: string | null;
}

/* Barra de navegação unificada (topo). Links principais + botão "+" de publicar
   (dropdown: post/artigo) + menu de conta (avatar → perfil/artigos/senha/sair).
   Padrão LinkedIn/Twitter. Usada em todas as páginas. */
export function TopNav({ sessao, voltar }: { sessao: SessaoNav; voltar?: string }) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-2 px-4 py-2.5"
      style={{ background: "var(--fundo-blur)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}
    >
      {voltar ? (
        <Link href={voltar} aria-label="Voltar" className="press flex shrink-0 items-center justify-center rounded-full" style={{ width: 40, height: 40, color: C.ink, background: C.surface, border: BORDA }}>
          <Ico.back style={{ width: 20, height: 20 }} />
        </Link>
      ) : (
        <Link href="/" aria-label="Início" className="shrink-0">
          <Logo altura={42} />
        </Link>
      )}

      {/* links principais — some no mobile bem estreito */}
      <nav className="ml-2 hidden items-center gap-1 sm:flex">
        <LinkNav href="/" icone={<Ico.cima style={{ width: 16, height: 16 }} />} rotulo="Início" />
        <LinkNav href="/vitrine" icone={<Ico.mapa style={{ width: 16, height: 16 }} />} rotulo="Vitrine" />
        <LinkNav href="/feed" icone={<Ico.balao style={{ width: 16, height: 16 }} />} rotulo="Feed" />
        <LinkNav href="/artigos" icone={<Ico.doc style={{ width: 16, height: 16 }} />} rotulo="Artigos" />
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {sessao.logado && sessao.aprovado && <BotaoPublicar />}
        {sessao.logado ? (
          <MenuConta sessao={sessao} />
        ) : (
          <Link href="/entrar" className="press rounded-full px-4 text-[14px] font-semibold" style={{ height: 40, lineHeight: "40px", background: C.laranja, color: C.ink }}>
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}

function LinkNav({ href, icone, rotulo }: { href: string; icone: React.ReactNode; rotulo: string }) {
  return (
    <Link
      href={href}
      className="press flex items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold"
      style={{ height: 38, color: C.ink }}
    >
      {icone}
      {rotulo}
    </Link>
  );
}

/* Botão "+" de publicar com dropdown. */
function BotaoPublicar() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  useFecharFora(ref, () => setAberto(false));

  const novoArtigo = () =>
    start(async () => {
      const r = await criarArtigo();
      setAberto(false);
      if (r.id) router.push(`/editor/${r.id}`);
    });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Publicar"
        aria-expanded={aberto}
        className="press flex items-center gap-1.5 rounded-full pl-3 pr-3.5 text-[14px] font-semibold"
        style={{ height: 40, background: C.laranja, color: C.ink }}
      >
        <Ico.mais style={{ width: 18, height: 18 }} />
        <span className="hidden sm:inline">Publicar</span>
      </button>

      {aberto && (
        <div
          className="anim-fade absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl"
          style={{ background: C.surface, border: BORDA, boxShadow: "0 16px 40px rgba(17,17,17,.16)" }}
          role="menu"
        >
          <ItemMenu
            icone={<Ico.balao style={{ width: 18, height: 18 }} />}
            titulo="Post no feed"
            sub="Uma ideia rápida, foto ou pergunta"
            onClick={() => { setAberto(false); router.push("/feed?compor=1"); }}
          />
          <div style={{ borderTop: BORDA }} />
          <ItemMenu
            icone={<Ico.doc style={{ width: 18, height: 18 }} />}
            titulo="Escrever artigo"
            sub="Um conteúdo aprofundado (newsletter)"
            onClick={novoArtigo}
            pending={pending}
          />
        </div>
      )}
    </div>
  );
}

/* Menu de conta (avatar → dropdown). */
function MenuConta({ sessao }: { sessao: SessaoNav }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, start] = useTransition();
  const [msgSenha, setMsgSenha] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useFecharFora(ref, () => setAberto(false));

  const redefinir = () =>
    start(async () => {
      const r = await pedirRedefinicaoSenha();
      setMsgSenha(r.ok ? "Enviamos um link no seu e-mail." : (r.erro ?? "Erro."));
    });

  const logout = () =>
    start(async () => {
      await sair();
    });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Sua conta"
        aria-expanded={aberto}
        className="press flex items-center gap-1.5 rounded-full pl-1 pr-2"
        style={{ height: 40, background: C.surface, border: BORDA }}
      >
        <Avatar nome={sessao.nome ?? "?"} foto={sessao.avatar} size={30} />
        <Ico.baixo style={{ width: 15, height: 15, color: C.muted }} />
      </button>

      {aberto && (
        <div
          className="anim-fade absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-2xl"
          style={{ background: C.surface, border: BORDA, boxShadow: "0 16px 40px rgba(17,17,17,.16)" }}
          role="menu"
        >
          {/* cabeçalho da conta */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: BORDA }}>
            <Avatar nome={sessao.nome ?? "?"} foto={sessao.avatar} size={40} />
            <div className="min-w-0">
              <p className="truncate text-[14px]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600 }}>
                {sessao.nome}
              </p>
              <p className="text-[12px]" style={{ color: C.muted }}>
                {sessao.isAdmin ? "Coordenação" : "Especialista"}
              </p>
            </div>
          </div>

          <ItemMenu icone={<Ico.olho style={{ width: 17, height: 17 }} />} titulo="Meu perfil" onClick={() => { setAberto(false); router.push(sessao.slug ? `/especialista/${sessao.slug}` : "/conta"); }} />
          <ItemMenu icone={<Ico.lapis style={{ width: 16, height: 16 }} />} titulo="Editar perfil" onClick={() => { setAberto(false); router.push("/conta"); }} />
          <ItemMenu icone={<Ico.doc style={{ width: 17, height: 17 }} />} titulo="Meus artigos" onClick={() => { setAberto(false); router.push("/meus-artigos"); }} />
          {sessao.isAdmin && (
            <ItemMenu icone={<Ico.escudo style={{ width: 17, height: 17 }} />} titulo="Coordenação" onClick={() => { setAberto(false); router.push("/coordenacao"); }} />
          )}
          <div style={{ borderTop: BORDA }} />
          <ItemMenu icone={<Ico.mail style={{ width: 17, height: 17 }} />} titulo="Redefinir senha" sub={msgSenha ?? undefined} onClick={redefinir} pending={pending} />
          <div style={{ borderTop: BORDA }} />
          <ItemMenu icone={<Ico.back style={{ width: 17, height: 17 }} />} titulo="Sair da conta" destaque="sair" onClick={logout} pending={pending} />
        </div>
      )}
    </div>
  );
}

function ItemMenu({
  icone,
  titulo,
  sub,
  onClick,
  pending,
  destaque,
}: {
  icone: React.ReactNode;
  titulo: string;
  sub?: string;
  onClick: () => void;
  pending?: boolean;
  destaque?: "sair";
}) {
  const cor = destaque === "sair" ? "#B24A42" : C.ink;
  return (
    <button
      onClick={onClick}
      disabled={pending}
      role="menuitem"
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[color:var(--paper)]"
      style={{ color: cor }}
    >
      <span className="shrink-0" style={{ color: destaque === "sair" ? "#B24A42" : C.muted }}>{icone}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold">{titulo}</span>
        {sub && <span className="block truncate text-[12px]" style={{ color: C.muted }}>{sub}</span>}
      </span>
    </button>
  );
}

/* fecha o dropdown ao clicar fora ou apertar Esc. */
function useFecharFora(ref: React.RefObject<HTMLDivElement | null>, onFechar: () => void) {
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onFechar();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [ref, onFechar]);
}
