/* Constantes puras do feed (sem I/O): servem no servidor e no navegador. */

/** Colunas de um comentário com o autor. A mesma lista vale para a leitura no
 *  servidor (lib/feed.ts) e no navegador (components/comentarios.tsx). */
export const CAMPOS_COMENTARIO =
  "id, parent_id, corpo, criado_em, autor:autor_id (id, slug, nome, avatar_url, qualificacao, verificado)";
