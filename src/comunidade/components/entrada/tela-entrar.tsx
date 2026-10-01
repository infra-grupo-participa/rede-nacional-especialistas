"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { entrar, type AuthState } from "@/comunidade/acoes/auth";
import { removerConta, useContaSalva, type ContaSalva } from "@/comunidade/lib/conta-salva";
import { BotaoTema, MarcaTHB, RodapeEntrada, SetaVoltar, VitrineMarca } from "@/comunidade/components/entrada/pecas";
import { CampoSenha } from "@/comunidade/components/entrada/campo-senha";
import { iniciais } from "@/lib/utils";

/* Tela de entrada da Rede de Especialistas. Três estados no mesmo painel:
   - comum: e-mail e senha;
   - conta salva: foto, nome, "Continuar" e "Usar outro perfil";
   - senha da conta salva: depois de "Continuar", só a senha.
   Desktop: marca à esquerda e painel à direita. Celular: coluna única.
   Claro por padrão; o botão do canto troca para o escuro. */

type Modo = "auto" | "outro" | "senha";

const ERROS: Record<string, string> = {
  "link-invalido": "Esse link não vale mais. Peça um novo em Esqueceu a senha.",
};

function Foto({ conta, pequena }: { conta: ContaSalva; pequena?: boolean }) {
  const classe = `rc-e-foto${pequena ? " rc-e-foto-p" : ""}`;
  if (conta.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={classe} src={conta.avatar} alt="" />;
  }
  return (
    <span className={classe} aria-hidden="true">
      {iniciais(conta.nome)}
    </span>
  );
}

export function TelaEntrar({ erro }: { erro?: string | null }) {
  const conta = useContaSalva();
  const [modo, setModo] = useState<Modo>("auto");
  const [menu, setMenu] = useState(false);
  const [email, setEmail] = useState("");
  const [estado, acao, pending] = useActionState<AuthState, FormData>(entrar, {});
  // Erro de uma tentativa não acompanha a pessoa para outro modo: ao trocar,
  // guarda o estado da vez e só mostra erro de um estado mais novo que ele.
  const [estadoAntigo, setEstadoAntigo] = useState<AuthState | null>(null);
  const irPara = (m: Modo) => {
    setEstadoAntigo(estado);
    setMenu(false);
    setModo(m);
  };
  const erroAcao = estado === estadoAntigo ? undefined : estado.erro;
  const erroLink = erro ? ERROS[erro] : null;

  const lendo = conta === undefined;
  const salva = conta && modo === "auto" ? conta : null;
  const senhaDe = conta && modo === "senha" ? conta : null;
  const aviso = erroAcao ?? erroLink;

  const base = (
    <div className="rc-e-base">
      <Link href="/comunidade/criar-conta" className="rc-e-botao rc-e-contorno">
        Criar nova conta
      </Link>
      <MarcaTHB />
    </div>
  );

  let miolo: React.ReactNode;

  if (salva) {
    miolo = (
      <>
        <div className="rc-e-salva">
          <div className="rc-e-engrenagem">
            <button type="button" aria-label="Opções desta conta" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }} aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
            {menu && (
              <>
                <button type="button" className="rc-e-fundo-menu" aria-label="Fechar opções" onClick={() => setMenu(false)} />
                <div className="rc-e-menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      removerConta();
                    }}
                  >
                    Remover conta deste aparelho
                  </button>
                </div>
              </>
            )}
          </div>
          <Foto conta={salva} />
          <p className="rc-e-nome">{salva.nome}</p>
          <div className="rc-e-pilha">
            <button type="button" className="rc-e-botao rc-e-primario" onClick={() => irPara("senha")}>
              Continuar
            </button>
            <button type="button" className="rc-e-botao rc-e-neutro" onClick={() => irPara("outro")}>
              Usar outro perfil
            </button>
          </div>
          {erroLink && (
            <p className="rc-e-aviso rc-e-erro" role="alert" style={{ width: "100%" }}>
              {erroLink}
            </p>
          )}
        </div>
        {base}
      </>
    );
  } else if (senhaDe) {
    miolo = (
      <>
        <form action={acao} className="rc-e-salva">
          <div className="rc-e-titulo" style={{ alignSelf: "flex-start" }}>
            <button type="button" className="rc-e-voltar" aria-label="Voltar" onClick={() => irPara("auto")}>
              <SetaVoltar />
            </button>
            Entrar na Rede de Especialistas
          </div>
          <Foto conta={senhaDe} pequena />
          <p className="rc-e-nome" style={{ marginBottom: 16 }}>
            {senhaDe.nome}
          </p>
          <input type="hidden" name="email" value={senhaDe.email} />
          <div className="rc-e-pilha">
            <CampoSenha autoFocus />
            <button type="submit" className="rc-e-botao rc-e-primario" disabled={pending}>
              {pending ? "Entrando…" : "Entrar"}
            </button>
          </div>
          {aviso && (
            <p className="rc-e-aviso rc-e-erro" role="alert" style={{ width: "100%" }}>
              {erroAcao === "E-mail ou senha incorretos." ? "Senha incorreta. Tente de novo." : aviso}
            </p>
          )}
          <Link href="/comunidade/recuperar" className="rc-e-link">
            Esqueceu a senha?
          </Link>
        </form>
        {base}
      </>
    );
  } else {
    miolo = (
      <>
        <form action={acao}>
          <h1 className={`rc-e-titulo${conta ? "" : " rc-e-so-desktop"}`}>
            {conta && (
              <button type="button" className="rc-e-voltar" aria-label="Voltar" onClick={() => irPara("auto")}>
                <SetaVoltar />
              </button>
            )}
            Entrar na Rede de Especialistas
          </h1>
          <div className="rc-e-campos">
            <input
              className="rc-e-campo"
              type="email"
              name="email"
              inputMode="email"
              placeholder="E-mail"
              aria-label="E-mail"
              autoComplete="username"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <CampoSenha />
            <button type="submit" className="rc-e-botao rc-e-primario" disabled={pending} style={{ marginTop: 6 }}>
              {pending ? "Entrando…" : "Entrar"}
            </button>
          </div>
          {aviso && (
            <p className="rc-e-aviso rc-e-erro" role="alert">
              {aviso}
            </p>
          )}
          <Link href="/comunidade/recuperar" className="rc-e-link">
            Esqueceu a senha?
          </Link>
        </form>
        {base}
      </>
    );
  }

  return (
    <div className="rc-entrada">
      <BotaoTema />
      <div className="rc-e-palco">
        <VitrineMarca />
        <main className="rc-e-painel">
          <div className="rc-e-logo-celular">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/thb-logo-240.png" alt="Time Holding Brasil" />
          </div>
          {/* até o navegador dizer se há conta salva, o painel reserva o espaço sem piscar */}
          <div className={`rc-e-miolo${lendo ? " rc-e-oculto" : ""}`}>{miolo}</div>
        </main>
      </div>
      <RodapeEntrada />
    </div>
  );
}
