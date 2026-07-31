import { C, F } from "@/lib/tokens";

/* Logo THB: monograma oficial HT (H laranja / T branco) dentro de um quadrado
   preto arredondado — assim o "T" branco aparece em qualquer fundo (claro ou
   escuro) — + o nome ao lado em Archivo. `so` = só o monograma (sem texto). */
export function Logo({ altura = 40, so = false }: { altura?: number; so?: boolean }) {
  const caixa = Math.round(altura);
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{ width: caixa, height: caixa, background: C.preto, borderRadius: caixa * 0.26 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-ht.png" alt="Time Holding Brasil" style={{ height: caixa * 0.66, width: "auto", display: "block" }} />
      </span>
      {!so && (
        <span className="hidden leading-none sm:flex sm:flex-col">
          <span style={{ fontFamily: F.serif, fontWeight: 800, fontSize: 15, color: C.ink, letterSpacing: "-0.01em" }}>
            Rede Nacional
          </span>
          <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 10, color: C.muted, letterSpacing: ".12em", textTransform: "uppercase", marginTop: 2 }}>
            Time Holding Brasil
          </span>
        </span>
      )}
    </span>
  );
}
