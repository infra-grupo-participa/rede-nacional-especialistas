"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { C, F } from "@/lib/tokens";
import { LP, GRAD, TIPO, BOTAO, textoGradiente } from "@/lib/landing";
import { Ico } from "@/components/icons";

/* Primeira dobra da landing institucional do Time Holding Brasil.

   A camada de fundo é a assinatura autoral: uma "malha da rede" — as 27
   capitais brasileiras como nós conectados por fios finos. O desenho não é
   decoração: é o argumento da página ("rede nacional", "todo o território")
   dito em forma, antes de qualquer palavra. A malha nasce em stagger com o
   conteúdo e os polos pulsam devagar; sob prefers-reduced-motion nada disso
   roda e a cena fica estática (o estado final já é o estado bonito).

   Regras herdadas da LP: profundidade só com cor sólida + fio + glow (zero
   box-shadow); sobre laranja o texto é sempre preto; tokens de landing.ts. */

// números aspiracionais validados pela marca — não a contagem crua do banco.
const ESTATISTICAS = [
  { numero: "1.000+", rotulo: "especialistas na rede" },
  { numero: "50+", rotulo: "escritórios Diamantes" },
  { numero: "23", rotulo: "edições realizadas" },
] as const;

/* Capitais em coordenadas normalizadas (projeção linear de lat/long num box
   0–100). A precisão cartográfica não importa aqui — importa a silhueta do
   Brasil ser reconhecível de relance. */
const CAPITAIS: Record<string, readonly [number, number]> = {
  boaVista: [33, 5.6],
  macapa: [57, 12.7],
  belem: [64, 16.5],
  saoLuis: [74, 19],
  fortaleza: [89, 22],
  natal: [97, 27.6],
  joaoPessoa: [98, 31],
  recife: [97.4, 33.8],
  maceio: [96, 37.6],
  aracaju: [92, 40.8],
  salvador: [89, 46],
  manaus: [35, 20.8],
  rioBranco: [15.5, 38.4],
  portoVelho: [25, 35],
  palmas: [64, 39],
  teresina: [78, 26],
  cuiaba: [45, 52.8],
  brasilia: [65, 53.3],
  goiania: [61.5, 56],
  campoGrande: [48.5, 65],
  beloHorizonte: [75, 63.8],
  vitoria: [84, 64.9],
  rio: [77, 71.5],
  saoPaulo: [68.5, 73],
  curitiba: [62, 78],
  florianopolis: [64, 83.6],
  portoAlegre: [57, 89.7],
};

/* Ligações plausíveis (eixos rodoviários/aéreos reais): costa nordestina em
   cadeia, arco norte, e Brasília como principal hub — o que também é verdade
   sobre a rede de especialistas. */
const LIGACOES: ReadonlyArray<readonly [string, string]> = [
  ["boaVista", "manaus"],
  ["macapa", "belem"],
  ["manaus", "belem"],
  ["manaus", "portoVelho"],
  ["portoVelho", "rioBranco"],
  ["portoVelho", "cuiaba"],
  ["belem", "saoLuis"],
  ["belem", "palmas"],
  ["saoLuis", "teresina"],
  ["teresina", "fortaleza"],
  ["teresina", "palmas"],
  ["fortaleza", "natal"],
  ["natal", "joaoPessoa"],
  ["joaoPessoa", "recife"],
  ["recife", "maceio"],
  ["maceio", "aracaju"],
  ["aracaju", "salvador"],
  ["salvador", "brasilia"],
  ["salvador", "beloHorizonte"],
  ["palmas", "brasilia"],
  ["cuiaba", "brasilia"],
  ["cuiaba", "campoGrande"],
  ["brasilia", "goiania"],
  ["goiania", "campoGrande"],
  ["brasilia", "beloHorizonte"],
  ["beloHorizonte", "vitoria"],
  ["beloHorizonte", "rio"],
  ["rio", "saoPaulo"],
  ["campoGrande", "saoPaulo"],
  ["saoPaulo", "curitiba"],
  ["curitiba", "florianopolis"],
  ["florianopolis", "portoAlegre"],
] as const;

/* Nós que pulsam (os "hubs" da rede). Poucos de propósito: mais que isso e o
   fundo compete com a manchete. */
const POLOS = new Set(["brasilia", "saoPaulo", "salvador", "manaus"]);

function MalhaBrasil() {
  return (
    <svg
      viewBox="-4 -3 108 106"
      aria-hidden="true"
      className="pointer-events-none absolute hidden lg:block"
      style={{
        top: "50%",
        right: "-3%",
        width: "min(44%, 600px)",
        transform: "translateY(-50%)",
        // dissolve na direção do texto: a malha é cenário, não competidora.
        WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 34%)",
        maskImage: "linear-gradient(90deg, transparent 0%, #000 34%)",
        opacity: 0.85,
      }}
    >
      <g data-malha stroke="rgba(255,255,255,.09)" strokeWidth="0.22">
        {LIGACOES.map(([a, b]) => {
          const [x1, y1] = CAPITAIS[a];
          const [x2, y2] = CAPITAIS[b];
          return <line key={`${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      {Object.entries(CAPITAIS).map(([id, [x, y]]) => {
        const polo = POLOS.has(id);
        return (
          <circle
            key={id}
            data-no
            data-polo={polo ? "" : undefined}
            cx={x}
            cy={y}
            r={polo ? 1.35 : 0.85}
            fill={C.laranja}
            opacity={polo ? 0.95 : 0.5}
          />
        );
      })}
    </svg>
  );
}

export function HeroInstitucional() {
  const raiz = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    // guard obrigatório: com reduced-motion nenhum tween é criado.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-anim]", { y: 26, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.11 });
      gsap.from("[data-malha]", { opacity: 0, duration: 1.4, ease: "power3.out", delay: 0.35 });
      // nós nascem em ordem aleatória — a rede "acende" pelo país, não em varredura.
      gsap.from("[data-no]", {
        attr: { r: 0 },
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        delay: 0.3,
        stagger: { amount: 1, from: "random" },
      });
      gsap.to("[data-polo]", {
        opacity: 0.35,
        duration: 2.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.85,
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={raiz} className="relative overflow-hidden" style={{ background: LP.preto }}>
      {/* glow assinatura da LP, ancorado atrás da malha; respiração via CSS
          (.lp-respira), que o media query global já desliga em reduced-motion. */}
      <div
        aria-hidden
        className="lp-glow lp-respira"
        style={{ top: "-30%", right: "-14%", width: "58%", height: "130%", background: GRAD.glow, opacity: 0.7 }}
      />
      {/* contraluz fraca no canto oposto, só para o preto não ficar chapado. */}
      <div
        aria-hidden
        className="lp-glow"
        style={{ bottom: "-40%", left: "-20%", width: "44%", height: "85%", background: GRAD.glow, opacity: 0.22 }}
      />
      <MalhaBrasil />

      <div className="lp-container lp-secao relative">
        <p
          data-anim
          style={{ ...TIPO.eyebrow, fontFamily: F.mono, color: C.laranja }}
        >
          Rede Nacional de Especialistas
        </p>

        {/* sem max-width: no desktop a segunda linha precisa caber inteira —
            manchete em DUAS linhas é decisão do PO. Em telas médias o
            text-wrap:balance reparte as quebras extras sem viúva. */}
        <h1 data-anim className="mt-5" style={{ ...TIPO.display, color: "#fff", textWrap: "balance" }}>
          <span className="block">A Maior Autoridade em</span>
          {/* fallback real do gradiente: `textoGradiente` deixa color:transparent;
              sobrescrevemos para laranja sólido — se background-clip:text não
              pintar, o texto continua legível em vez de sumir. */}
          <span className="block" style={{ ...textoGradiente, color: C.laranja }}>
            Planejamento Patrimonial do País
          </span>
        </h1>

        <div data-anim className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/entrar?intencao=cadastro" className="press" style={BOTAO.pilula}>
            Quero ser um Membro
            <Ico.seta width={18} height={18} />
          </Link>
          <Link href="/vitrine" className="press" style={BOTAO.pilulaOutlineEscuro}>
            Quero ser atendido por um Membro
          </Link>
        </div>

        <div data-anim className="mt-16 flex flex-wrap gap-x-12 gap-y-8 md:mt-20">
          {ESTATISTICAS.map((e) => (
            <div key={e.rotulo} className="pl-5" style={{ borderLeft: `1px solid ${LP.linhaEscura}` }}>
              <div
                style={{
                  fontFamily: F.serif,
                  fontWeight: 800,
                  fontSize: "clamp(1.9rem, 1.4rem + 1.7vw, 2.6rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: C.laranja,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {e.numero}
              </div>
              <div
                className="mt-2"
                style={{
                  fontFamily: F.mono,
                  fontSize: 12.5,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: LP.tintaEscuraFraca,
                }}
              >
                {e.rotulo}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* fio degradê fecha a dobra escura — a divisa da LP, no lugar de sombra. */}
      <div aria-hidden className="lp-fio" />
    </section>
  );
}
