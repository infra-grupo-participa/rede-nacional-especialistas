"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { salvarDiagnostico } from "@/comunidade/acoes/diagnostico";
import { PERGUNTAS, calcular, type Respostas, type Resultado } from "@/comunidade/lib/diagnostico";
import { Seta, TopoDiag } from "@/comunidade/components/diagnostico/pecas";
import { ResultadoDiag } from "@/comunidade/components/diagnostico/resultado";

/* O teste em si, no formato de teste de personalidade: uma pergunta por tela,
   cartões grandes que avançam sozinhos, voltar, progresso por etapa e teclado
   (1 a 6 escolhem, Enter avança, seta para a esquerda volta). No fim, uma tela
   de cálculo curta e a revelação do resultado. A nota exibida é a que o
   servidor devolve; o cálculo local só serve de reserva e para a prévia. */

type Fase = "pergunta" | "calculando" | "resultado";

const ETAPAS = PERGUNTAS.reduce<{ nome: string; inicio: number; total: number }[]>((acc, p, i) => {
  const ult = acc[acc.length - 1];
  if (ult && ult.nome === p.etapa) ult.total++;
  else acc.push({ nome: p.etapa, inicio: i, total: 1 });
  return acc;
}, []);

const ESPERA_AVANCO = 320;
const ESPERA_CALCULO = 2200;

const AVISO_NAO_SALVOU =
  "Não conseguimos salvar o seu resultado agora. Ele aparece abaixo, mas pode não estar disponível quando você voltar.";

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function TesteDiagnostico({
  primeiroNome,
  salvo,
  previa = false,
}: {
  primeiroNome: string | null;
  /** Diagnóstico já feito: abre direto no resultado. */
  salvo: { respostas: Respostas; resultado: Resultado } | null;
  /** Prévia de desenvolvimento: não grava nada no servidor. */
  previa?: boolean;
}) {
  const [fase, setFase] = useState<Fase>(salvo ? "resultado" : "pergunta");
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Respostas>(salvo?.respostas ?? {});
  const [resultado, setResultado] = useState<Resultado | null>(salvo?.resultado ?? null);
  const [direcao, setDirecao] = useState<"frente" | "tras">("frente");
  const [erro, setErro] = useState<string | null>(null);
  const [revelarAgora, setRevelarAgora] = useState(!salvo);
  const travado = useRef(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const pergunta = PERGUNTAS[indice];
  const escolhida = respostas[pergunta?.id];

  const concluir = useCallback(
    async (finais: Respostas) => {
      setFase("calculando");
      setErro(null);
      const local = calcular(finais);
      let final = local;
      if (!previa) {
        const [r] = await Promise.all([salvarDiagnostico(finais).catch(() => null), espera(ESPERA_CALCULO)]);
        // A nota do servidor vale quando vem; o erro aparece sempre, mesmo junto com o resultado
        // (a ação pode calcular e falhar ao gravar). Sem resposta, mostra o cálculo local e avisa.
        if (r?.resultado) final = r.resultado;
        if (r?.erro) setErro(r.erro);
        else if (!r?.resultado) setErro(AVISO_NAO_SALVOU);
      } else {
        await espera(ESPERA_CALCULO);
      }
      if (!final) {
        // Não deveria acontecer: todas as perguntas foram respondidas.
        setErro("Não conseguimos calcular o seu resultado. Revise as respostas e tente de novo.");
        setFase("pergunta");
        travado.current = false;
        return;
      }
      setResultado(final);
      setRevelarAgora(true);
      setFase("resultado");
      travado.current = false;
    },
    [previa],
  );

  const avancar = useCallback(
    (novas: Respostas) => {
      if (indice < PERGUNTAS.length - 1) {
        setDirecao("frente");
        setIndice(indice + 1);
        travado.current = false;
      } else {
        void concluir(novas);
      }
    },
    [indice, concluir],
  );

  const escolher = useCallback(
    (opcaoId: string) => {
      if (travado.current) return;
      travado.current = true;
      const novas = { ...respostas, [pergunta.id]: opcaoId };
      setRespostas(novas);
      window.setTimeout(() => avancar(novas), ESPERA_AVANCO);
    },
    [respostas, pergunta, avancar],
  );

  const voltar = useCallback(() => {
    if (travado.current || indice === 0) return;
    setDirecao("tras");
    setIndice(indice - 1);
  }, [indice]);

  const refazer = () => {
    setErro(null);
    travado.current = false;
    setRespostas({});
    setIndice(0);
    setDirecao("frente");
    setResultado(null);
    setFase("pergunta");
  };

  // Teclado: 1 a 6 escolhem, Enter avança se já houver resposta, seta para a esquerda volta.
  useEffect(() => {
    if (fase !== "pergunta") return;
    const tecla = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const alvo = e.target as HTMLElement | null;
      if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= pergunta.opcoes.length) {
        e.preventDefault();
        escolher(pergunta.opcoes[n - 1].id);
      } else if (e.key === "Enter" && escolhida && !(alvo instanceof HTMLButtonElement)) {
        e.preventDefault();
        if (!travado.current) {
          travado.current = true;
          avancar(respostas);
        }
      } else if (e.key === "ArrowLeft") {
        voltar();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [fase, pergunta, escolhida, escolher, avancar, voltar, respostas]);

  // A cada pergunta nova o foco vai para o título, para o leitor de tela anunciar.
  useEffect(() => {
    if (fase === "pergunta") tituloRef.current?.focus({ preventScroll: true });
  }, [indice, fase]);

  if (fase === "resultado" && resultado) {
    return (
      <div className="rc-d rc-d-tela-resultado">
        <TopoDiag />
        {erro && (
          <p className="rc-d-aviso rc-d-aviso-erro rc-d-aviso-fixo" role="alert">
            {erro}
          </p>
        )}
        <ResultadoDiag resultado={resultado} primeiroNome={primeiroNome} animar={revelarAgora} onRefazer={refazer} />
      </div>
    );
  }

  if (fase === "calculando") {
    return (
      <div className="rc-d rc-d-tela-calculo">
        <TopoDiag />
        <main className="rc-d-calculo" role="status" aria-live="polite">
          <div className="rc-d-calculo-barras" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="rc-d-calculo-titulo">Cruzando as suas respostas</p>
          <ul className="rc-d-calculo-passos">
            <li>Base técnica</li>
            <li>Capacidade comercial</li>
            <li>Sua nota final</li>
          </ul>
        </main>
      </div>
    );
  }

  const etapaAtual = ETAPAS.findIndex((e) => indice >= e.inicio && indice < e.inicio + e.total);

  return (
    <div className="rc-d rc-d-tela-teste">
      <TopoDiag>
        <span className="rc-d-contador">
          {indice + 1}
          <span>/{PERGUNTAS.length}</span>
        </span>
      </TopoDiag>

      <div
        className="rc-d-progresso"
        role="progressbar"
        aria-label="Progresso do diagnóstico"
        aria-valuemin={0}
        aria-valuemax={PERGUNTAS.length}
        aria-valuenow={indice}
        aria-valuetext={`Pergunta ${indice + 1} de ${PERGUNTAS.length}, etapa ${ETAPAS[etapaAtual]?.nome}`}
      >
        {ETAPAS.map((e, i) => {
          const feitas = Math.min(e.total, Math.max(0, indice - e.inicio + (escolhida && i === etapaAtual ? 1 : 0)));
          return (
            <div key={e.nome} className={`rc-d-etapa${i === etapaAtual ? " rc-d-etapa-atual" : ""}${i < etapaAtual ? " rc-d-etapa-feita" : ""}`}>
              <span className="rc-d-etapa-nome">{e.nome}</span>
              <span className="rc-d-etapa-trilho">
                <span style={{ width: `${(feitas / e.total) * 100}%` }} />
              </span>
            </div>
          );
        })}
      </div>

      <main className="rc-d-palco">
        <div key={pergunta.id} className={`rc-d-pergunta rc-d-entra-${direcao}`}>
          <p className="rc-d-etapa-rotulo">
            <span>{String(indice + 1).padStart(2, "0")}</span>
            {pergunta.etapa}
          </p>
          <h1 className="rc-d-pergunta-titulo" ref={tituloRef} tabIndex={-1}>
            {pergunta.titulo}
          </h1>
          {pergunta.ajuda && <p className="rc-d-pergunta-ajuda">{pergunta.ajuda}</p>}

          <div className="rc-d-opcoes" role="group" aria-label="Opções de resposta">
            {pergunta.opcoes.map((o, i) => (
              <button
                key={o.id}
                type="button"
                className="rc-d-opcao"
                aria-pressed={escolhida === o.id}
                onClick={() => escolher(o.id)}
              >
                <kbd className="rc-d-opcao-tecla" aria-hidden="true">
                  {i + 1}
                </kbd>
                <span className="rc-d-opcao-texto">{o.rotulo}</span>
                <span className="rc-d-opcao-marca" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
              </button>
            ))}
          </div>

          {erro && (
            <p className="rc-d-aviso rc-d-aviso-erro" role="alert">
              {erro}
            </p>
          )}
        </div>
      </main>

      <footer className="rc-d-rodape-teste">
        <button type="button" className="rc-d-botao rc-d-botao-fantasma" onClick={voltar} disabled={indice === 0}>
          <span className="rc-d-seta-volta">
            <Seta />
          </span>
          Voltar
        </button>
        <p className="rc-d-dica" aria-hidden="true">
          Use as teclas <kbd>1</kbd> a <kbd>{pergunta.opcoes.length}</kbd> para responder
        </p>
        {escolhida ? (
          <button
            type="button"
            className="rc-d-botao rc-d-botao-tinta"
            onClick={() => {
              if (travado.current) return;
              travado.current = true;
              avancar(respostas);
            }}
          >
            {indice === PERGUNTAS.length - 1 ? "Ver resultado" : "Avançar"}
            <Seta />
          </button>
        ) : (
          <span className="rc-d-rodape-vazio">{primeiroNome ? `${primeiroNome}, escolha uma opção` : "Escolha uma opção"}</span>
        )}
      </footer>
    </div>
  );
}
