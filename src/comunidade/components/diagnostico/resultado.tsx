"use client";

import { MAX_COMERCIAL, MAX_TECNICA, type Resultado } from "@/comunidade/lib/diagnostico";
import { LINK_LIVE, TEXTO_CONVITE_LIVE, TEXTO_FAIXA, leituraComercial, leituraTecnica } from "@/comunidade/lib/diagnostico-textos";
import { Medidor, Seta, useContagem } from "@/comunidade/components/diagnostico/pecas";

/* Revelação do resultado: a nota sobe de 0 até o total junto com o medidor,
   depois entram o título da faixa, o texto, os dois eixos e, só para grandes
   e excelentes, o convite da live. Quem volta a uma nota já salva vê tudo
   sem a animação longa. */

export function ResultadoDiag({
  resultado,
  primeiroNome,
  animar,
  onRefazer,
}: {
  resultado: Resultado;
  primeiroNome: string | null;
  animar: boolean;
  onRefazer: () => void;
}) {
  const { total, tecnica, comercial, faixa } = resultado;
  const nota = useContagem(total, animar ? 2000 : 500, animar ? 350 : 0);
  const alto = faixa.convidaLive;

  return (
    <main className={`rc-d-resultado${animar ? " rc-d-revela" : " rc-d-revela-rapido"}`}>
      <section className={`rc-d-placar ${alto ? "rc-d-placar-alto" : "rc-d-placar-base"}`} aria-labelledby="rc-d-faixa-titulo">
        <p className="rc-d-placar-rotulo rc-d-r1">{primeiroNome ? `${primeiroNome}, o seu resultado` : "O seu resultado"}</p>
        <div className="rc-d-placar-medidor">
          <Medidor valor={nota} />
          <p className="rc-d-nota" aria-hidden="true">
            {nota}
            <span>/100</span>
          </p>
        </div>
        <p className="rc-d-sr">Nota {total} de 100.</p>
        <ol className="rc-d-faixas rc-d-r2" aria-label="Faixas do diagnóstico">
          <li className={faixa.id === "pequenas" ? "rc-d-faixa-sua" : ""}>0 a 39</li>
          <li className={faixa.id === "razoaveis" ? "rc-d-faixa-sua" : ""}>40 a 59</li>
          <li className={faixa.id === "grandes" ? "rc-d-faixa-sua" : ""}>60 a 79</li>
          <li className={faixa.id === "excelentes" ? "rc-d-faixa-sua" : ""}>80 a 100</li>
        </ol>
        <h1 id="rc-d-faixa-titulo" className="rc-d-faixa-titulo rc-d-r3">
          {faixa.titulo} de viver de Holding Familiar
        </h1>
      </section>

      <section className="rc-d-leitura">
        <p className="rc-d-faixa-texto rc-d-r4">{TEXTO_FAIXA[faixa.id]}</p>

        <div className="rc-d-eixos rc-d-r5">
          <Eixo nome="Habilidade técnica" pontos={tecnica} max={MAX_TECNICA} leitura={leituraTecnica(tecnica, MAX_TECNICA)} animar={animar} />
          <Eixo
            nome="Capacidade comercial"
            pontos={comercial}
            max={MAX_COMERCIAL}
            leitura={leituraComercial(comercial, MAX_COMERCIAL)}
            animar={animar}
          />
        </div>

        {alto && (
          <aside className="rc-d-convite rc-d-r6" aria-labelledby="rc-d-convite-titulo">
            <p className="rc-d-convite-selo">Convite</p>
            <h2 id="rc-d-convite-titulo">O seu resultado abriu um convite para a live</h2>
            <p>{TEXTO_CONVITE_LIVE}</p>
            {LINK_LIVE ? (
              <a className="rc-d-botao rc-d-botao-tinta" href={LINK_LIVE} target="_blank" rel="noopener noreferrer">
                Quero participar da live
                <Seta />
              </a>
            ) : (
              <button type="button" className="rc-d-botao rc-d-botao-tinta" disabled>
                Link em breve
              </button>
            )}
          </aside>
        )}

        <div className="rc-d-refazer rc-d-r7">
          <button type="button" className="rc-d-botao rc-d-botao-fantasma" onClick={onRefazer}>
            Refazer o diagnóstico
          </button>
        </div>
      </section>
    </main>
  );
}

function Eixo({ nome, pontos, max, leitura, animar }: { nome: string; pontos: number; max: number; leitura: string; animar: boolean }) {
  const valor = useContagem(pontos, animar ? 1200 : 400, animar ? 2700 : 0);
  return (
    <div className="rc-d-eixo">
      <div className="rc-d-eixo-topo">
        <h3>{nome}</h3>
        <p>
          <b>{valor}</b>/{max}
        </p>
      </div>
      <div
        className="rc-d-eixo-trilho"
        role="meter"
        aria-label={nome}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={pontos}
      >
        <span style={{ width: `${(valor / max) * 100}%` }} />
      </div>
      <p className="rc-d-eixo-leitura">{leitura}</p>
    </div>
  );
}
