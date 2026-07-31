"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { C, F } from "@/lib/tokens";

/* Primeira dobra da Home — identidade THB: fundo preto profundo, glow laranja,
   headline em Archivo, números de autoridade. Entrada animada com GSAP (stagger)
   + o glow respira. Respeita prefers-reduced-motion. */
export function HeroHome({ total, compacto = false }: { total: number; compacto?: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-anim]", {
        y: 22,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
      });
      gsap.to("[data-glow]", {
        opacity: 0.55,
        scale: 1.12,
        duration: 3.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const stats = [
    { n: `${total.toLocaleString("pt-BR")}+`, r: "especialistas na rede" },
    { n: "50", r: "escritórios Diamantes" },
    { n: "23", r: "edições realizadas" },
  ];

  return (
    <div ref={root} className="hero-glow" style={{ background: C.preto }}>
      {/* glow controlado por GSAP (além do ::before estático) */}
      <div
        data-glow
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: "-40%",
          right: "-5%",
          width: "55%",
          height: "180%",
          opacity: 0.3,
          background: `radial-gradient(circle, rgba(255,107,26,.5) 0%, rgba(255,107,26,0) 70%)`,
        }}
      />
      <div className={`relative mx-auto ${compacto ? "px-5 py-9" : "px-10 py-16"}`} style={{ maxWidth: 1160 }}>
        <span data-anim className="uppercase" style={{ fontFamily: F.mono, fontSize: compacto ? 11 : 12, letterSpacing: ".16em", color: C.laranja, fontWeight: 700 }}>
          Comunidade Time Holding Brasil
        </span>
        <h1
          data-anim
          className={`mt-3 ${compacto ? "text-[31px]" : "max-w-3xl text-[54px]"} leading-[1.02]`}
          style={{ color: "#fff", fontFamily: F.serif, fontWeight: 800, letterSpacing: "-0.03em" }}
        >
          A rede dos especialistas em <span style={{ color: C.laranja }}>holding familiar</span> do Brasil
        </h1>
        <p data-anim className={`mt-4 ${compacto ? "text-[14px]" : "max-w-xl text-[17px]"} leading-relaxed`} style={{ color: "rgba(255,255,255,.72)" }}>
          Advogados e contadores formados e certificados pelos nossos Espaços de Instrução — perto de você, prontos para atender.
        </p>
        <div data-anim className={`mt-${compacto ? "6" : "9"} flex flex-wrap gap-x-10 gap-y-4`}>
          {stats.map((s) => (
            <div key={s.r}>
              <div className={`${compacto ? "text-[24px]" : "text-[32px]"} font-extrabold leading-none`} style={{ color: C.laranja, fontFamily: F.serif, fontVariantNumeric: "tabular-nums" }}>
                {s.n}
              </div>
              <div className={`mt-1 ${compacto ? "text-[11px]" : "text-[13px]"}`} style={{ color: "rgba(255,255,255,.6)" }}>
                {s.r}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
