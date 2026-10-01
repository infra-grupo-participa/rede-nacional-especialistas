/* Rotas do grupo: qual aba está ativa em cada caminho e os endereços públicos
   usados em "Convidar" e "Compartilhar". Puro (serve no servidor e no
   navegador). */

export type AbaGrupo = "sobre" | "discussao" | "destaques" | "perguntas" | "membros" | "midia" | "arquivos" | "coordenacao";

/** Endereço público do grupo (só membro aprovado consegue abrir). */
export const URL_GRUPO = "https://blog.timeholdingbrasil.com.br/comunidade";
/** Endereço do convite: quem chega cria a conta e responde o questionário. */
export const URL_CONVITE = "https://blog.timeholdingbrasil.com.br/comunidade/criar-conta";

export const ROTA_BUSCA = "/comunidade/busca";

/** Aba ativa a partir do caminho. `null` = nenhuma (busca, seu conteúdo). */
export function abaDe(caminho: string): AbaGrupo | null {
  const c = caminho.replace(/\/+$/, "") || "/comunidade";
  const sob = (base: string) => c === base || c.startsWith(`${base}/`);
  if (c === "/comunidade" || sob("/comunidade/post")) return "discussao";
  if (sob("/comunidade/sobre") || sob("/comunidade/regras")) return "sobre";
  if (sob("/comunidade/destaques")) return "destaques";
  if (sob("/comunidade/perguntas")) return "perguntas";
  if (sob("/comunidade/membros") || sob("/comunidade/membro") || sob("/comunidade/editar-perfil")) return "membros";
  if (sob("/comunidade/midia")) return "midia";
  if (sob("/comunidade/arquivos")) return "arquivos";
  if (sob("/comunidade/coordenacao")) return "coordenacao";
  return null;
}

/** Endereço da busca para um texto (vazio leva à página da busca sem termo). */
export function hrefBusca(texto: string): string {
  const q = texto.replace(/\s+/g, " ").trim().slice(0, 80);
  return q ? `${ROTA_BUSCA}?q=${encodeURIComponent(q)}` : ROTA_BUSCA;
}
