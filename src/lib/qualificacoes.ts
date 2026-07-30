/* ============================================================================
   Os 5 níveis de QUALIFICAÇÃO comercial (tag estilizada no nome).
   Ordem base → topo. Só o admin define/altera. NÃO é gamificação.

   THB              base geral (ainda não comprou o ingresso do Aurum)
   Aurum            começo da elite — dourado
   Platina          azul claro
   Diamante         azul escuro e intenso
   Diamante Vermelho topo — vermelho
   ========================================================================== */

export type Qualificacao =
  | "thb"
  | "aurum"
  | "platina"
  | "diamante"
  | "diamante_vermelho";

export interface NivelInfo {
  key: Qualificacao;
  rotulo: string;
  ordem: number; // 0 = base, 4 = topo
  /** cor principal da tag */
  cor: string;
  /** cor do texto sobre a tag */
  texto: string;
  /** brilho/borda para o efeito estilizado */
  brilho: string;
}

export const NIVEIS: Record<Qualificacao, NivelInfo> = {
  thb: {
    key: "thb",
    rotulo: "THB",
    ordem: 0,
    cor: "#E7E1D9",
    texto: "#4A443F",
    brilho: "#CDBFB0",
  },
  aurum: {
    key: "aurum",
    rotulo: "Aurum",
    ordem: 1,
    cor: "#E8B23A", // dourado
    texto: "#3D2A00",
    brilho: "#FFD873",
  },
  platina: {
    key: "platina",
    rotulo: "Platina",
    ordem: 2,
    cor: "#8FC7E8", // azul claro
    texto: "#0C3550",
    brilho: "#CDE9F8",
  },
  diamante: {
    key: "diamante",
    rotulo: "Diamante",
    ordem: 3,
    cor: "#1E5BC6", // azul escuro e intenso
    texto: "#FFFFFF",
    brilho: "#5B93F0",
  },
  diamante_vermelho: {
    key: "diamante_vermelho",
    rotulo: "Diamante Vermelho",
    ordem: 4,
    cor: "#D31F2B", // vermelho — topo
    texto: "#FFFFFF",
    brilho: "#FF5C67",
  },
};

export const NIVEIS_ORDENADOS: NivelInfo[] = Object.values(NIVEIS).sort(
  (a, b) => a.ordem - b.ordem,
);

export function nivelDe(q: Qualificacao | null | undefined): NivelInfo {
  return NIVEIS[q ?? "thb"] ?? NIVEIS.thb;
}
