"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { IcoRC } from "@/comunidade/components/icones";
import { reagir } from "@/comunidade/acoes/feed";
import {
  REACOES,
  ROTULO_REACAO,
  reacoesOrdenadas,
  totalReacoes,
  trocarReacao,
  type ContagemReacoes,
  type Reacao,
} from "@/comunidade/lib/reacoes";

/* Reações do post, no jeito do Facebook e na cor do THB: seis carinhas laranja
   (a "moeda" do logo como mascote). Passar o mouse (ou segurar o dedo) no
   curtir abre a bandeja com as seis; tocar no curtir sem abrir a bandeja dá
   Curtir ou tira a reação. Estilos e animações em reacoes.css. */

const TINTA = "#1b1410"; // traço das carinhas (preto quente, como o do logo)
const CREME = "#fff4ea";

/** Disco laranja com volume (sombra embaixo, brilho em cima), sem gradiente
 *  com id: várias carinhas na mesma página não disputam o mesmo <defs>. */
function Disco({ base = "#ff6b1a", sombra = "#c9440d", brilho = "#ffc39a" }: { base?: string; sombra?: string; brilho?: string }) {
  return (
    <>
      <circle cx="24" cy="24" r="22" fill={base} />
      <path d="M3.4 31.6A22 22 0 0 0 44.6 31.6 27 27 0 0 1 3.4 31.6Z" fill={sombra} opacity="0.5" />
      <ellipse cx="17" cy="12.5" rx="9" ry="4.6" transform="rotate(-24 17 12.5)" fill={brilho} opacity="0.75" />
    </>
  );
}

/** Carinha de uma reação. `vivo` liga a animação em laço (só na bandeja). */
export function IconeReacao({ tipo, tamanho = 22, vivo = false, className = "" }: { tipo: Reacao; tamanho?: number; vivo?: boolean; className?: string }) {
  const traco = { fill: "none", stroke: TINTA, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  let miolo: React.ReactNode;

  switch (tipo) {
    case "curtir":
      miolo = (
        <>
          <Disco />
          <g className="rc-r-mao" fill={TINTA}>
            <path d="M13.2 23h3.6a1 1 0 0 1 1 1v10.6a1 1 0 0 1-1 1h-3.6a1.4 1.4 0 0 1-1.4-1.4V24.4A1.4 1.4 0 0 1 13.2 23z" />
            <path d="M20 23.4l4.6-9.1a2 2 0 0 1 2.3-1c1.7.4 2.7 2 2.4 3.7l-.8 4h5.5a2.8 2.8 0 0 1 2.7 3.4l-1.7 8a4 4 0 0 1-3.9 3.2H21a1 1 0 0 1-1-1z" />
          </g>
        </>
      );
      break;
    case "amei":
      miolo = (
        <>
          <Disco base="#f2481b" sombra="#b02a0a" brilho="#ff9d73" />
          <path
            className="rc-r-coracao"
            d="M24 36.2c-7.8-5.6-12-9.7-12-14.7 0-3.7 2.9-6.5 6.4-6.5 2.2 0 4.2 1.1 5.6 2.9 1.4-1.8 3.4-2.9 5.6-2.9 3.5 0 6.4 2.8 6.4 6.5 0 5-4.2 9.1-12 14.7z"
            fill={CREME}
          />
        </>
      );
      break;
    case "risada":
      miolo = (
        <g className="rc-r-rosto">
          <Disco />
          <path d="M12.5 17l6.2 3-6.2 3" {...traco} strokeWidth="2.6" />
          <path d="M35.5 17l-6.2 3 6.2 3" {...traco} strokeWidth="2.6" />
          <g className="rc-r-boca">
            <path d="M12 27h24c0 7-5.3 12-12 12s-12-5-12-12z" fill={TINTA} />
            <path d="M14.4 27h19.2v2.8H14.4z" fill={CREME} />
            <ellipse cx="24" cy="35.4" rx="5.6" ry="2.6" fill="#ff8a5c" />
          </g>
        </g>
      );
      break;
    case "uau":
      miolo = (
        <>
          <Disco />
          <g className="rc-r-sobrancelhas">
            <path d="M12.5 14.5q3.8-3.2 7.6 0" {...traco} strokeWidth="2.3" />
            <path d="M27.9 14.5q3.8-3.2 7.6 0" {...traco} strokeWidth="2.3" />
          </g>
          <ellipse cx="16.3" cy="21.8" rx="2.7" ry="3.5" fill={TINTA} />
          <ellipse cx="31.7" cy="21.8" rx="2.7" ry="3.5" fill={TINTA} />
          <ellipse className="rc-r-o" cx="24" cy="33.4" rx="4.8" ry="6.2" fill={TINTA} />
        </>
      );
      break;
    case "triste":
      miolo = (
        <g className="rc-r-rosto">
          <Disco />
          <path d="M12.4 17.8l7.2-2.8" {...traco} strokeWidth="2.3" />
          <path d="M35.6 17.8l-7.2-2.8" {...traco} strokeWidth="2.3" />
          <ellipse cx="16.4" cy="22.8" rx="2.4" ry="2.9" fill={TINTA} />
          <ellipse cx="31.6" cy="22.8" rx="2.4" ry="2.9" fill={TINTA} />
          <path d="M17 36q7-6.2 14 0" {...traco} strokeWidth="2.7" />
          <path className="rc-r-lagrima" d="M34.2 26.5c2.1 3.3 3.2 5.2 3.2 6.7a3.2 3.2 0 0 1-6.4 0c0-1.5 1.1-3.4 3.2-6.7z" fill="#8fd8f5" stroke="#ffffff" strokeWidth="0.8" />
        </g>
      );
      break;
    case "raiva":
      miolo = (
        <g className="rc-r-rosto">
          <Disco base="#e5381a" sombra="#8f1c0a" brilho="#ff8a66" />
          <path d="M11.8 15.8l8.4 3.8" {...traco} strokeWidth="2.9" />
          <path d="M36.2 15.8l-8.4 3.8" {...traco} strokeWidth="2.9" />
          <circle cx="16.8" cy="23.6" r="2.4" fill={TINTA} />
          <circle cx="31.2" cy="23.6" r="2.4" fill={TINTA} />
          <path d="M17.2 35.6q6.8-4.8 13.6 0" {...traco} strokeWidth="2.8" />
        </g>
      );
      break;
  }

  return (
    <svg
      viewBox="0 0 48 48"
      width={tamanho}
      height={tamanho}
      className={`rc-r rc-r-${tipo}${vivo ? " rc-r-vivo" : ""}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
      focusable="false"
    >
      {miolo}
    </svg>
  );
}

/** As reações mais usadas do post, em bolinhas sobrepostas (até 3). */
export function ResumoReacoes({ contagem }: { contagem: ContagemReacoes }) {
  const ordem = reacoesOrdenadas(contagem);
  if (ordem.length === 0) return null;
  const texto = ordem.map((r) => `${r.n} ${ROTULO_REACAO[r.tipo]}`).join(" · ");
  return (
    <span className="rc-reacoes-resumo" role="img" aria-label={`Reações: ${texto}`} title={texto}>
      {ordem.slice(0, 3).map((r) => (
        <IconeReacao key={r.tipo} tipo={r.tipo} tamanho={20} />
      ))}
    </span>
  );
}

const ESPERA_ABRIR = 380; // mouse parado em cima do botão
const ESPERA_FECHAR = 320; // mouse saiu do botão e da bandeja
const TOQUE_LONGO = 420; // dedo segurando o botão

export interface EstadoReacoes {
  minha: Reacao | null;
  contagem: ContagemReacoes;
}

/** Estado das reações de um post, com troca otimista. Quem usa: a linha de
 *  ações do post (o botão e o resumo leem o mesmo estado). */
export function useReacoes(postId: string, minha: Reacao | null, contagem: ContagemReacoes) {
  const [estado, setEstado] = useState<EstadoReacoes>({ minha, contagem });
  const [erro, setErro] = useState<string | null>(null);
  const [, start] = useTransition();
  const pedido = useRef(0);

  // Quando o servidor manda números novos (router.refresh), eles voltam a
  // mandar: ajuste de estado durante o render, sem effect.
  const [visto, setVisto] = useState({ minha, contagem });
  if (visto.minha !== minha || visto.contagem !== contagem) {
    setVisto({ minha, contagem });
    setEstado({ minha, contagem });
  }

  const escolher = (nova: Reacao | null) => {
    setErro(null);
    const anterior = estado;
    if (anterior.minha === nova) return;
    setEstado({ minha: nova, contagem: trocarReacao(anterior.contagem, anterior.minha, nova) });
    const meu = ++pedido.current;
    start(async () => {
      const r = await reagir(postId, nova);
      // só desfaz se este ainda é o último pedido (a pessoa pode ter trocado de novo)
      if (r.erro && pedido.current === meu) {
        setEstado(anterior);
        setErro(r.erro);
      }
    });
  };

  return { estado, escolher, erro };
}

/** Botão de reagir do post, com a bandeja das seis reações. */
export function BotaoReagir({
  estado,
  onEscolher,
  erro,
}: {
  estado: EstadoReacoes;
  onEscolher: (nova: Reacao | null) => void;
  erro?: string | null;
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toqueLongo = useRef(false);

  const limparRelogio = () => {
    if (relogio.current) clearTimeout(relogio.current);
    relogio.current = null;
  };
  const agendar = (fn: () => void, ms: number) => {
    limparRelogio();
    relogio.current = setTimeout(fn, ms);
  };

  useEffect(() => limparRelogio, []);

  // bandeja aberta: fecha no toque fora e no Esc
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAberto(false);
      caixa.current?.querySelector<HTMLButtonElement>(".rc-reagir-botao")?.focus();
    };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const escolher = (nova: Reacao | null) => {
    limparRelogio();
    setAberto(false);
    onEscolher(nova);
  };

  const total = totalReacoes(estado.contagem);
  const rotulo = estado.minha
    ? `Sua reação: ${ROTULO_REACAO[estado.minha]}. Tocar para tirar; segurar para trocar.`
    : "Curtir. Segurar ou passar o mouse para escolher outra reação.";

  return (
    <div
      ref={caixa}
      className="rc-reagir"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") agendar(() => setAberto(true), aberto ? 0 : ESPERA_ABRIR);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") agendar(() => setAberto(false), ESPERA_FECHAR);
      }}
    >
      <button
        type="button"
        className="rc-acao rc-reagir-botao"
        data-ativo={estado.minha ? true : undefined}
        data-reacao={estado.minha ?? undefined}
        aria-label={`${rotulo}${total > 0 ? ` ${total} ${total === 1 ? "reação" : "reações"} no post.` : ""}`}
        aria-haspopup="menu"
        aria-expanded={aberto}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          toqueLongo.current = false;
          agendar(() => {
            toqueLongo.current = true;
            setAberto(true);
          }, TOQUE_LONGO);
        }}
        onPointerUp={(e) => {
          if (e.pointerType !== "mouse" && !toqueLongo.current) limparRelogio();
        }}
        onPointerCancel={limparRelogio}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          // o toque longo já abriu a bandeja: este clique é só o dedo soltando
          if (toqueLongo.current) {
            toqueLongo.current = false;
            return;
          }
          escolher(estado.minha ? null : "curtir");
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            setAberto(true);
            requestAnimationFrame(() => caixa.current?.querySelector<HTMLButtonElement>(".rc-bandeja-item")?.focus());
          }
        }}
      >
        {estado.minha ? <IconeReacao key={estado.minha} tipo={estado.minha} tamanho={22} className="rc-r-entra" /> : <IcoRC.curtir />}
        {total > 0 && <span>{total}</span>}
      </button>

      {aberto && (
        <div className="rc-bandeja" role="menu" aria-label="Escolher a reação">
          {REACOES.map((tipo, i) => (
            <button
              key={tipo}
              type="button"
              role="menuitemradio"
              aria-checked={estado.minha === tipo}
              aria-label={ROTULO_REACAO[tipo]}
              className="rc-bandeja-item"
              style={{ animationDelay: `${i * 35}ms` }}
              onClick={() => escolher(estado.minha === tipo ? null : tipo)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                e.preventDefault();
                const itens = Array.from(caixa.current?.querySelectorAll<HTMLButtonElement>(".rc-bandeja-item") ?? []);
                const prox = (i + (e.key === "ArrowRight" ? 1 : -1) + itens.length) % itens.length;
                itens[prox]?.focus();
              }}
            >
              <span className="rc-bandeja-rotulo" aria-hidden="true">
                {ROTULO_REACAO[tipo]}
              </span>
              <IconeReacao tipo={tipo} tamanho={40} vivo />
            </button>
          ))}
        </div>
      )}

      {erro && (
        <span className="rc-acao-nota rc-erro-texto" role="alert">
          {erro}
        </span>
      )}
    </div>
  );
}
