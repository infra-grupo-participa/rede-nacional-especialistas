"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

/* Entrada por scroll da landing. Um único IntersectionObserver por instância,
   que se desconecta assim que o bloco aparece — nada fica observando a página
   inteira depois que o usuário passou.

   Por que não animar com GSAP/Framer aqui: o estado inicial (invisível) mora no
   CSS (`.lp-reveal` em globals.css). Se o JS não rodar — erro, browser antigo,
   bot de SEO — a mídia `prefers-reduced-motion` e a ausência da classe não
   escondem o conteúdo para sempre, porque este componente também aplica
   `.visivel` no primeiro efeito quando o IntersectionObserver não existe. */

export function Reveal({
  children,
  atraso = 0,
  como: Tag = "div",
  className = "",
  style,
  id,
}: {
  children: ReactNode;
  /** atraso em ms para escalonar blocos irmãos. */
  atraso?: number;
  como?: ElementType;
  className?: string;
  style?: CSSProperties;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mostrar = () => el.classList.add("visivel");

    // sem suporte a IntersectionObserver: mostra na hora, sem animar.
    if (typeof IntersectionObserver === "undefined") {
      mostrar();
      return;
    }

    // já está na viewport no primeiro paint (primeira dobra): não espera scroll.
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            mostrar();
            obs.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.06 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      className={`lp-reveal ${className}`}
      style={{ transitionDelay: atraso ? `${atraso}ms` : undefined, ...style }}
    >
      {children}
    </Tag>
  );
}
