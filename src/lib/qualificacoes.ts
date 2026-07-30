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
  /** ícone do selo (design novo): estrela p/ ouro/platina, gema p/ diamantes,
   *  nenhum p/ o nível base THB (decisão Marcio: esconder selo do THB). */
  icone: "estrela" | "gema" | null;
  /** faixa comercial exibida no BlocoNiveis (origem = plano THB). */
  faixa: string;
}

/* Cores/ícones do design novo (App.jsx NIVEIS): ouro #E3A81C, platina #2F7DE1,
   diamante #1AA6D8, vermelho #D6362F. O THB (base) não tem selo. */
export const NIVEIS: Record<Qualificacao, NivelInfo> = {
  thb: {
    key: "thb",
    rotulo: "THB",
    ordem: 0,
    cor: "#E7E1D9",
    texto: "#4A443F",
    brilho: "#CDBFB0",
    icone: null,
    faixa: "Comunidade THB",
  },
  aurum: {
    key: "aurum",
    rotulo: "Ouro",
    ordem: 1,
    cor: "#E3A81C", // dourado
    texto: "#3D2A00",
    brilho: "#FFD873",
    icone: "estrela",
    faixa: "até R$ 50 mil",
  },
  platina: {
    key: "platina",
    rotulo: "Platina",
    ordem: 2,
    cor: "#2F7DE1", // azul
    texto: "#FFFFFF",
    brilho: "#8FC0F5",
    icone: "estrela",
    faixa: "acima de R$ 50 mil",
  },
  diamante: {
    key: "diamante",
    rotulo: "Diamante",
    ordem: 3,
    cor: "#1AA6D8", // azul diamante
    texto: "#FFFFFF",
    brilho: "#7FD6F0",
    icone: "gema",
    faixa: "acima de R$ 1 milhão",
  },
  diamante_vermelho: {
    key: "diamante_vermelho",
    rotulo: "Diamante Vermelho",
    ordem: 4,
    cor: "#D6362F", // vermelho — topo
    texto: "#FFFFFF",
    brilho: "#FF7A72",
    icone: "gema",
    faixa: "acima de R$ 2 milhões",
  },
};

/** true quando o nível deve exibir selo (todos, menos o base THB). */
export function temSelo(q: Qualificacao | null | undefined): boolean {
  return nivelDe(q).icone !== null;
}

export const NIVEIS_ORDENADOS: NivelInfo[] = Object.values(NIVEIS).sort(
  (a, b) => a.ordem - b.ordem,
);

export function nivelDe(q: Qualificacao | null | undefined): NivelInfo {
  return NIVEIS[q ?? "thb"] ?? NIVEIS.thb;
}
