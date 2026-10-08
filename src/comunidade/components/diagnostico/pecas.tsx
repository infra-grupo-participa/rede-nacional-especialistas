"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

/* Peças comuns do Diagnóstico de Holding Familiar. */

/** Barra do alto: marca à esquerda, conteúdo livre no meio e o tema à direita. */
export function TopoDiag({ children }: { children?: React.ReactNode }) {
  return (
    <header className="rc-d-topo">
      <span className="rc-d-marca">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/thb-logo-96.png" alt="" width={32} height={32} />
        <span>
          Diagnóstico de <b>Holding Familiar</b>
        </span>
      </span>
      <div className="rc-d-topo-meio">{children}</div>
      <div className="rc-d-topo-tema">
        <ThemeToggle />
      </div>
    </header>
  );
}

function semMovimento() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Conta de 0 até `alvo` em `duracao` ms, depois de `atraso` ms (desaceleração no fim). */
export function useContagem(alvo: number, duracao = 1800, atraso = 0) {
  const [valor, setValor] = useState(0);
  useEffect(() => {
    let raf = 0;
    let inicio = 0;
    const passo = (t: number) => {
      if (!inicio) inicio = t;
      const p = Math.min(1, (t - inicio) / duracao);
      const suave = 1 - Math.pow(1 - p, 4);
      setValor(Math.round(alvo * suave));
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    const id = window.setTimeout(
      () => {
        raf = requestAnimationFrame(semMovimento() ? () => setValor(alvo) : passo);
      },
      semMovimento() ? 0 : atraso,
    );
    return () => {
      window.clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [alvo, duracao, atraso]);
  return valor;
}

/** Medidor em meia-lua com as quatro faixas marcadas (40, 60 e 80). */
export function Medidor({ valor }: { valor: number }) {
  // Arco de 180 graus; pathLength=100 deixa o traço em escala de nota.
  const arco = "M 20 110 A 90 90 0 0 1 200 110";
  const ang = Math.PI * (1 - valor / 100);
  const px = 110 + 90 * Math.cos(ang);
  const py = 110 - 90 * Math.sin(ang);
  const marca = (n: number) => {
    const a = Math.PI * (1 - n / 100);
    return { x1: 110 + 74 * Math.cos(a), y1: 110 - 74 * Math.sin(a), x2: 110 + 80 * Math.cos(a), y2: 110 - 80 * Math.sin(a) };
  };
  return (
    <svg className="rc-d-medidor" viewBox="0 0 220 124" aria-hidden="true">
      <path d={arco} pathLength={100} className="rc-d-medidor-trilho" />
      <path d={arco} pathLength={100} className="rc-d-medidor-cheio" strokeDasharray={`${valor} 100`} />
      {[40, 60, 80].map((n) => (
        <line key={n} {...marca(n)} className="rc-d-medidor-marca" />
      ))}
      <circle cx={px} cy={py} r={9} className="rc-d-medidor-ponta" />
    </svg>
  );
}

/** Máscara simples de WhatsApp BR: (11) 98765-4321 ou (11) 3456-7890. */
export function mascararWhats(valor: string) {
  let d = valor.replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function Seta() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
