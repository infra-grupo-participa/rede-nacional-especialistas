/* Constantes puras do feed (sem I/O): servem no servidor e no navegador. */

import { imagemDoApp } from "@/comunidade/lib/imagem-do-app";

/** Colunas de um comentário com o autor. A mesma lista vale para a leitura no
 *  servidor (lib/feed.ts) e no navegador (components/comentarios.tsx). */
export const CAMPOS_COMENTARIO =
  "id, parent_id, corpo, criado_em, autor:autor_id (id, slug, nome, avatar_url, qualificacao, verificado)";

/** Quantos posts a Discussão traz por vez (a primeira leva e cada "ver mais"). */
export const POSTS_POR_VEZ = 20;

/** Fotos de um post: a lista nova ou, em post antigo, a foto única. Só entra
 *  imagem enviada pelo próprio app: a ação de publicar já recusa endereço de
 *  fora, e aqui a leitura repete a trava para o que chegar por outro caminho
 *  (um link externo serviria para rastrear quem abre o post). */
export function fotosDoPost(p: { imagens?: unknown; imagem_url?: string | null }): string[] {
  const vale = (u: unknown): u is string => typeof u === "string" && u.trim().length > 1 && imagemDoApp(u.trim());
  const lista = (Array.isArray(p.imagens) ? p.imagens : []).filter(vale).map((u) => u.trim());
  if (lista.length > 0) return [...new Set(lista)];
  const uma = (p.imagem_url ?? "").trim();
  return vale(uma) ? [uma] : [];
}

/** As fotos como estão gravadas, sem a trava de origem: só para a coordenação,
 *  que precisa ver tudo o que o post traz antes de aprovar. */
export function fotosGravadas(p: { imagens?: unknown; imagem_url?: string | null }): string[] {
  const lista = (Array.isArray(p.imagens) ? p.imagens : []).filter((u): u is string => typeof u === "string" && u.trim().length > 1);
  if (lista.length > 0) return lista;
  const uma = (p.imagem_url ?? "").trim();
  return uma.length > 1 ? [uma] : [];
}
