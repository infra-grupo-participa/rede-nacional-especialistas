/* Por decisão do Marcio (2026-07-31), a vitrine/mapa mostra APENAS advogados e
   contadores. As profissões na base estão em variações livres (Advogado,
   Advogado(a), Advogada, ADVOGADO, Contador, Contadora, Contabilista…), então o
   match é por radical, não igualdade. */

import { norm } from "@/lib/utils";

/** Filtro OR do PostgREST para restringir a advogados e contadores. */
export const FILTRO_PROF_OR =
  "profissao.ilike.%advog%,profissao.ilike.%contad%,profissao.ilike.%contab%";

/** true se a profissão é advogado ou contador (por radical). */
export function ehProfissaoPermitida(profissao: string | null | undefined): boolean {
  const p = norm(profissao);
  return p.includes("advog") || p.includes("contad") || p.includes("contab");
}

/** Rótulo canônico da profissão para exibição/agrupamento. */
export function rotuloProfissao(profissao: string | null | undefined): string {
  const p = norm(profissao);
  if (p.includes("advog") || p.includes("direito")) return "Advogado";
  if (p.includes("contad") || p.includes("contab")) return "Contador";
  return profissao?.trim() || "Especialista";
}
