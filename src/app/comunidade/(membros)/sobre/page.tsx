import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Avatar } from "@/comunidade/components/atoms";
import { IcoRC } from "@/comunidade/components/icones";
import { BlocoRegras } from "@/comunidade/components/paginas/bloco-regras";
import { diaPorExtenso, mesDeAno, primeiroNome, tempoDecorrido } from "@/comunidade/components/paginas/textos";
import { configComunidade } from "@/comunidade/lib/gestao";
import { GRUPO, amostraMembros, atividadeDoGrupo, contagemCurta, contarMembros, coordenacaoDoGrupo, hrefMembro, type MembroResumo } from "@/comunidade/lib/grupo";
import { exigirMembro } from "@/comunidade/lib/sessao";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sobre",
};

/** Quem é da coordenação, em uma frase, com o nome levando ao perfil. */
function FraseCoordenacao({ coordenacao }: { coordenacao: MembroResumo[] }) {
  if (coordenacao.length === 0) return null;
  const nome = (m: MembroResumo, texto: string): ReactNode => (
    <Link key={m.id} href={hrefMembro(m)} className="rc-pg-link-forte">
      {texto}
    </Link>
  );
  const [a, b] = coordenacao;
  let frase: ReactNode;
  if (coordenacao.length === 1) {
    frase = <>{nome(a, a.nome)} é da coordenação.</>;
  } else if (coordenacao.length === 2) {
    frase = (
      <>
        {nome(a, primeiroNome(a.nome))} e {nome(b, primeiroNome(b.nome))} são da coordenação.
      </>
    );
  } else {
    frase = (
      <>
        {nome(a, primeiroNome(a.nome))} e outros {coordenacao.length - 1} membros são da coordenação.
      </>
    );
  }
  return <p className="rc-pg-texto">{frase}</p>;
}

/* Aba Sobre: o que é o grupo, quem está nele, o movimento e as regras. */
export default async function SobrePage() {
  await exigirMembro();
  const [total, amostra, coordenacao, atividade, config] = await Promise.all([
    contarMembros(),
    amostraMembros(13),
    coordenacaoDoGrupo(),
    atividadeDoGrupo(),
    configComunidade(),
  ]);

  return (
    <main className="rc-pg">
      <div className="rc-pg-coluna">
        <section className="rc-cartao rc-pg-bloco" aria-labelledby="sobre-titulo">
          <div className="rc-pg-bloco-topo">
            <h2 id="sobre-titulo" className="rc-cartao-titulo">
              Sobre este grupo
            </h2>
          </div>
          <p className="rc-pg-texto">{GRUPO.descricao}</p>
          <ul className="rc-pg-itens">
            <li className="rc-pg-item">
              <IcoRC.cadeado />
              <span>
                <span className="rc-pg-item-titulo">Privado</span>
                <span className="rc-pg-item-sub">{GRUPO.privado}</span>
              </span>
            </li>
            <li className="rc-pg-item">
              <IcoRC.olho />
              <span>
                <span className="rc-pg-item-titulo">Entrada com aprovação</span>
                <span className="rc-pg-item-sub">{GRUPO.entrada}</span>
              </span>
            </li>
            {atividade.desde && (
              <li className="rc-pg-item">
                <IcoRC.relogio />
                <span>
                  <span className="rc-pg-item-titulo">Histórico</span>
                  <span className="rc-pg-item-sub">No ar desde {mesDeAno(atividade.desde)}.</span>
                </span>
              </li>
            )}
          </ul>
        </section>

        <section className="rc-cartao rc-pg-bloco" aria-labelledby="membros-titulo">
          <div className="rc-pg-bloco-topo">
            <h2 id="membros-titulo" className="rc-cartao-titulo">
              Membros <span className="rc-pg-conta">· {contagemCurta(total)}</span>
            </h2>
          </div>
          {amostra.length > 0 && (
            <ul className="rc-pg-fotos">
              {amostra.map((m) => (
                <li key={m.id}>
                  <Link href={hrefMembro(m)} aria-label={m.nome} title={m.nome}>
                    <Avatar nome={m.nome} foto={m.avatar_url} size={36} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <FraseCoordenacao coordenacao={coordenacao} />
          <Link href="/comunidade/membros" className="rc-btn rc-btn-neutro rc-btn-bloco" style={{ marginTop: 14 }}>
            Ver tudo
          </Link>
        </section>

        <section className="rc-cartao rc-pg-bloco" aria-labelledby="atividade-titulo">
          <div className="rc-pg-bloco-topo">
            <h2 id="atividade-titulo" className="rc-cartao-titulo">
              Atividade
            </h2>
          </div>
          <ul className="rc-pg-itens" data-denso="true">
            <li className="rc-pg-item">
              <IcoRC.conteudo />
              <span>
                <span className="rc-pg-item-titulo">
                  {atividade.postsHoje === 0 ? "Nenhum post novo hoje" : atividade.postsHoje === 1 ? "1 novo post hoje" : `${atividade.postsHoje.toLocaleString("pt-BR")} novos posts hoje`}
                </span>
                <span className="rc-pg-item-sub">{atividade.postsMes.toLocaleString("pt-BR")} no último mês</span>
              </span>
            </li>
            <li className="rc-pg-item">
              <IcoRC.pessoas />
              <span>
                <span className="rc-pg-item-titulo">Total de membros: {atividade.membros.toLocaleString("pt-BR")}</span>
                <span className="rc-pg-item-sub">
                  {atividade.novosNaSemana > 0 ? `+ ${atividade.novosNaSemana.toLocaleString("pt-BR")} na última semana` : "Ninguém novo na última semana"}
                </span>
              </span>
            </li>
            {atividade.desde && (
              <li className="rc-pg-item">
                <IcoRC.calendario />
                <span>
                  <span className="rc-pg-item-titulo">No ar há {tempoDecorrido(atividade.desde)}</span>
                  <span className="rc-pg-item-sub">Primeira publicação em {diaPorExtenso(atividade.desde)}</span>
                </span>
              </li>
            )}
          </ul>
        </section>

        <BlocoRegras config={config} comLinks />
      </div>
    </main>
  );
}
