"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { C, F } from "@/lib/tokens";

/* Primeira dobra da Home — identidade THB: fundo preto profundo, glow laranja,
   headline em Archivo/Manrope, números de autoridade. Entrada com GSAP (stagger),
   glow que respira. Transição suave para a dobra seguinte (fade para o fundo).
   Respeita prefers-reduced-motion. */

// números aspiracionais da marca (definidos pelo Marcio) — não a contagem crua.
const STATS = [
  { n: "1.000+", r: "especialistas na rede" },
  { n: "50+", r: "escritórios Diamantes" },
  { n: "23", r: "edições realizadas" },
];

export function HeroHome({ compacto = false }: { compacto?: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-anim]", { y: 24, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.12 });
      gsap.to("[data-glow]", { opacity: 0.6, scale: 1.14, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="hero-glow" style={{ background: C.preto }}>
      <div
        data-glow
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: "-40%",
          right: "-5%",
          width: "55%",
          height: "180%",
          opacity: 0.32,
          background: `radial-gradient(circle, rgba(255,107,26,.5) 0%, rgba(255,107,26,0) 70%)`,
        }}
      />
      <div className={`relative mx-auto ${compacto ? "px-5 pb-16 pt-10" : "px-10 pb-28 pt-20"}`} style={{ maxWidth: 1160 }}>
        <span data-anim className="inline-block uppercase" style={{ fontFamily: F.mono, fontSize: compacto ? 11 : 12.5, letterSpacing: ".18em", color: C.laranja, fontWeight: 700 }}>
          Comunidade Time Holding Brasil
        </span>
        <h1
          data-anim
          className={`mt-4 ${compacto ? "text-[33px]" : "max-w-4xl text-[58px]"} leading-[1.03]`}
          style={{ color: "#fff", fontFamily: F.serif, fontWeight: 800, letterSpacing: "-0.035em" }}
        >
          A rede dos especialistas em <span style={{ color: C.laranja }}>holding familiar</span> do Brasil
        </h1>
        <p data-anim className={`${compacto ? "mt-4 text-[15px]" : "mt-6 max-w-xl text-[18px]"} leading-relaxed`} style={{ color: "rgba(255,255,255,.7)" }}>
          Advogados e contadores formados e certificados pelos nossos Espaços de Instrução — perto de você, prontos para atender.
        </p>

        <div data-anim className={`${compacto ? "mt-8 gap-8" : "mt-12 gap-14"} flex flex-wrap`}>
          {STATS.map((s) => (
            <div key={s.r}>
              <div className={`${compacto ? "text-[26px]" : "text-[40px]"} font-extrabold leading-none`} style={{ color: C.laranja, fontFamily: F.serif, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                {s.n}
              </div>
              <div className={`mt-2 ${compacto ? "text-[11.5px]" : "text-[13px]"} uppercase`} style={{ color: "rgba(255,255,255,.55)", fontFamily: F.mono, letterSpacing: ".08em" }}>
                {s.r}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* transição suave: o preto do hero desmancha no fundo da próxima dobra */}
      <div aria-hidden style={{ height: 56, background: `linear-gradient(to bottom, ${C.preto}, var(--fundo))` }} />
    </div>
  );
}
