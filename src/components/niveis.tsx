import type { Qualificacao } from "@/lib/qualificacoes";

/* NÍVEL DE FATURAMENTO REMOVIDO do sistema (decisão Marcio 2026-07-31 — feature
   fica para depois). Estes componentes viram no-op para não quebrar imports;
   quando o nível voltar, reintroduzir aqui. */

export function IconeNivel(_props: { q: Qualificacao; size?: number }) {
  return null;
}

export function SeloNivel(_props: { q: Qualificacao; tamanho?: "sm" | "lg" }) {
  return null;
}
