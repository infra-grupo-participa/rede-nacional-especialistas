"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Dialogo } from "@/comunidade/components/ui";
import { IcoRC } from "@/comunidade/components/icones";
import { GRUPO, contagemCurta } from "@/comunidade/lib/grupo-tipos";
import { URL_CONVITE, URL_GRUPO } from "@/comunidade/components/grupo/rotas";
import { useCopiar } from "@/comunidade/components/grupo/ganchos";

/* Janelas do cabeçalho do grupo: "Convidar para a Rede" e "Compartilhar". */

function linkWhatsApp(texto: string) {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

/** Campo só leitura com o link: tocar seleciona tudo. */
function CampoLink({ rotulo, valor, campo }: { rotulo: string; valor: string; campo: RefObject<HTMLInputElement | null> }) {
  return (
    <label className="rc-campo-link">
      <span>{rotulo}</span>
      <input ref={campo} type="text" readOnly value={valor} onFocus={(e) => e.currentTarget.select()} onClick={(e) => e.currentTarget.select()} />
    </label>
  );
}

/** Copia o link e, se o navegador recusar, deixa o campo selecionado para a
 *  pessoa copiar à mão. Devolve o rótulo do botão em cada estado. */
function useCopiarLink(link: string) {
  const campo = useRef<HTMLInputElement>(null);
  const [estado, copiar] = useCopiar();
  useEffect(() => {
    if (estado === "falhou") campo.current?.focus(); // o foco seleciona o link
  }, [estado]);
  const rotulo = estado === "copiado" ? "Link copiado" : estado === "falhou" ? "Copie pelo campo" : "Copiar link";
  return { campo, copiado: estado === "copiado", rotulo, copiar: () => copiar(link) };
}

/* ------------------------------------------------------------ Convidar -- */
export function JanelaConvidar({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  return (
    <Dialogo aberto={aberto} onFechar={onFechar} titulo="Convidar para a Rede" largura={500}>
      <MioloConvidar />
    </Dialogo>
  );
}

function MioloConvidar() {
  const { campo, copiado, rotulo, copiar } = useCopiarLink(URL_CONVITE);
  const mensagem = `Entre na ${GRUPO.nome}, a comunidade dos alunos do Time Holding Brasil. Crie a sua conta por aqui: ${URL_CONVITE}`;
  return (
    <div className="rc-janela">
      <p className="rc-janela-texto">
        Envie o link para um colega que também é aluno do Time Holding Brasil. Quem chega pelo convite responde o questionário e passa pela aprovação da coordenação.
      </p>
      <CampoLink rotulo="Link do convite" valor={URL_CONVITE} campo={campo} />
      <div className="rc-janela-acoes">
        <a className="rc-btn rc-btn-primario" href={linkWhatsApp(mensagem)} target="_blank" rel="noopener noreferrer">
          <IcoRC.whatsapp />
          Enviar no WhatsApp
        </a>
        <button type="button" className="rc-btn rc-btn-neutro" onClick={copiar}>
          {copiado ? <IcoRC.marcado /> : <IcoRC.link />}
          <span aria-live="polite">{rotulo}</span>
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------- Compartilhar -- */
export function JanelaCompartilhar({ aberto, onFechar, membros }: { aberto: boolean; onFechar: () => void; membros: number }) {
  return (
    <Dialogo aberto={aberto} onFechar={onFechar} titulo="Compartilhar" largura={500}>
      <MioloCompartilhar membros={membros} />
    </Dialogo>
  );
}

function MioloCompartilhar({ membros }: { membros: number }) {
  const { campo, copiado, rotulo, copiar } = useCopiarLink(URL_GRUPO);
  const mensagem = `${GRUPO.nome}, a comunidade dos alunos do Time Holding Brasil: ${URL_GRUPO}`;
  return (
    <div className="rc-janela">
      <div className="rc-janela-grupo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/thb-logo-96.png" alt="" width={48} height={48} />
        <div>
          <b>{GRUPO.nome}</b>
          <span>
            Grupo privado · {contagemCurta(membros)} {membros === 1 ? "membro" : "membros"}
          </span>
        </div>
      </div>
      <CampoLink rotulo="Link do grupo" valor={URL_GRUPO} campo={campo} />
      <div>
        <h3 className="rc-janela-subtitulo">Compartilhar em</h3>
        <div className="rc-partilha">
          <a className="rc-partilha-item" href={linkWhatsApp(mensagem)} target="_blank" rel="noopener noreferrer">
            <span className="rc-partilha-disco">
              <IcoRC.whatsapp />
            </span>
            WhatsApp
          </a>
          <button type="button" className="rc-partilha-item" onClick={copiar}>
            <span className="rc-partilha-disco" data-feito={copiado || undefined}>
              {copiado ? <IcoRC.marcado /> : <IcoRC.link />}
            </span>
            <span aria-live="polite">{rotulo}</span>
          </button>
        </div>
      </div>
      <p className="rc-janela-nota">Só membros aprovados conseguem abrir o grupo.</p>
    </div>
  );
}
