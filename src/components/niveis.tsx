import { C, F } from "@/lib/tokens";
import { nivelDe, type Qualificacao } from "@/lib/qualificacoes";

/* Ícone e selo de nível (design novo). Estrela p/ ouro/platina, gema p/
   diamante/vermelho. THB (base) não tem ícone → SeloNivel retorna null. */

export function IconeNivel({ q, size = 16 }: { q: Qualificacao; size?: number }) {
  const n = nivelDe(q);
  if (n.icone === null) return null;
  const cor = n.cor;

  if (n.icone === "estrela") {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path
          d="M12 2.5l2.95 6.2 6.85.63-5.18 4.6 1.55 6.72L12 16.98l-6.17 3.67 1.55-6.72-5.18-4.6 6.85-.63L12 2.5z"
          fill={cor}
          stroke={cor}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // gema
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M6.5 3h11L21 9l-9 12L3 9l3.5-6z" fill={cor} />
      <path d="M6.5 3h11L21 9H3l3.5-6z" fill="#fff" fillOpacity="0.28" />
      <path
        d="M9 3L7.2 9M15 3l1.8 6M3 9h18M12 21V9"
        stroke="#fff"
        strokeOpacity="0.35"
        strokeWidth="0.6"
        fill="none"
      />
    </svg>
  );
}

export function SeloNivel({
  q,
  tamanho = "sm",
}: {
  q: Qualificacao;
  tamanho?: "sm" | "lg";
}) {
  const n = nivelDe(q);
  if (n.icone === null) return null; // THB não tem selo
  const grande = tamanho === "lg";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md align-middle"
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        padding: grande ? "4px 10px" : "2px 7px",
      }}
      title={`Nível: ${n.rotulo}`}
    >
      <IconeNivel q={q} size={grande ? 15 : 13} />
      <span
        style={{
          fontFamily: F.mono,
          fontVariantNumeric: "tabular-nums",
          fontWeight: 600,
          fontSize: grande ? 12 : 11,
          color: C.ink,
        }}
      >
        {n.rotulo}
      </span>
    </span>
  );
}
