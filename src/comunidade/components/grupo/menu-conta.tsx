"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/comunidade/components/atoms";
import { IcoRC } from "@/comunidade/components/icones";
import { DivisorMenu, Menu } from "@/comunidade/components/ui";
import { pedirNovaSenha, sair } from "@/comunidade/acoes/auth";
import { useTemaEscuro } from "@/comunidade/components/grupo/ganchos";

/* Menu da conta (o avatar no canto da barra do topo), no jeito do Facebook:
   cartão do perfil no alto, depois as opções com o ícone numa bolinha. Sem
   sino, sem mensagens, sem grade de apps: a Rede não tem nada disso. */
export function MenuConta({ nome, avatar, perfilHref }: { nome: string; avatar: string | null; perfilHref: string }) {
  const [escuro, alternarTema] = useTemaEscuro();
  const [enviando, iniciar] = useTransition();
  const [avisoSenha, setAvisoSenha] = useState<string | null>(null);

  const trocarSenha = () =>
    iniciar(async () => {
      const r = await pedirNovaSenha();
      setAvisoSenha(r.ok ? "Enviamos um link no seu e-mail." : (r.erro ?? "Não foi possível enviar agora. Tente de novo."));
    });

  return (
    <Menu
      rotulo="Sua conta"
      lado="direita"
      gatilho={({ aberto, alternar }) => (
        <button type="button" className="rc-topo-conta rc-anel" aria-label="Sua conta" title="Sua conta" aria-haspopup="menu" aria-expanded={aberto} onClick={alternar}>
          <Avatar nome={nome} foto={avatar} size={40} />
          <span className="rc-topo-conta-seta" aria-hidden="true">
            <IcoRC.chevronBaixo />
          </span>
        </button>
      )}
    >
      {(fechar) => (
        <div className="rc-conta">
          <Link href={perfilHref} className="rc-conta-perfil" role="menuitem" onClick={fechar}>
            <span className="rc-anel">
              <Avatar nome={nome} foto={avatar} size={40} />
            </span>
            <span className="rc-conta-perfil-texto">
              <b>{nome}</b>
              <small>Ver meu perfil</small>
            </span>
          </Link>

          <Link href={`${perfilHref}?aba=sobre`} className="rc-menu-item rc-conta-item" role="menuitem" onClick={fechar}>
            <span className="rc-conta-bolha">
              <IcoRC.lapis />
            </span>
            <span className="rc-conta-rotulo">Editar meu perfil</span>
          </Link>

          <button type="button" className="rc-menu-item rc-conta-item" role="menuitem" onClick={trocarSenha} disabled={enviando}>
            <span className="rc-conta-bolha">
              <IcoRC.cadeado />
            </span>
            <span className="rc-conta-rotulo">
              Trocar senha
              {(enviando || avisoSenha) && (
                <small role="status">{enviando ? "Enviando o link..." : avisoSenha}</small>
              )}
            </span>
          </button>

          <button type="button" className="rc-menu-item rc-conta-item" role="menuitemcheckbox" aria-checked={escuro} onClick={alternarTema}>
            <span className="rc-conta-bolha">
              <IcoRC.lua />
            </span>
            <span className="rc-conta-rotulo">Tela: modo escuro</span>
            <span className="rc-chave" data-ligada={escuro || undefined} aria-hidden="true" />
          </button>

          <Link href="/" className="rc-menu-item rc-conta-item" role="menuitem" onClick={fechar}>
            <span className="rc-conta-bolha">
              <IcoRC.externo />
            </span>
            <span className="rc-conta-rotulo">Blog do Time Holding Brasil</span>
          </Link>

          <DivisorMenu />

          <form action={sair}>
            <button type="submit" className="rc-menu-item rc-conta-item" role="menuitem">
              <span className="rc-conta-bolha">
                <IcoRC.sair />
              </span>
              <span className="rc-conta-rotulo">Sair</span>
            </button>
          </form>
        </div>
      )}
    </Menu>
  );
}
