import { nivelDe, type Qualificacao } from "@/comunidade/lib/qualificacoes";

/* Tag de NÍVEL (qualificação comercial) ao lado do nome: THB, Aurum, Platina,
   Diamante ou Diamante Vermelho. Voltou a aparecer em 30/09/2026 por exigência
   do documento "Comunidade THB no Facebook" (item 5: identificação visível do
   nível, inclusive THB). Continua fora a FAIXA de faturamento (decisão Marcio
   2026-07-31): a tag mostra só o nome do nível. */

export function IconeNivel(_props: { q: Qualificacao; size?: number }) {
  return null;
}

export function SeloNivel({ q, tamanho = "sm" }: { q: Qualificacao; tamanho?: "sm" | "lg" }) {
  const n = nivelDe(q);
  const lg = tamanho === "lg";
  return (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full font-semibold"
      style={{
        height: lg ? 22 : 18,
        paddingLeft: lg ? 9 : 7,
        paddingRight: lg ? 9 : 7,
        fontSize: lg ? 12 : 10.5,
        letterSpacing: ".01em",
        lineHeight: 1,
        background: n.cor,
        color: n.texto,
        border: `1px solid ${n.brilho}`,
      }}
      title={`Nível ${n.rotulo}`}
    >
      {n.rotulo}
    </span>
  );
}
