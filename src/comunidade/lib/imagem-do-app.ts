import { SUPABASE_URL } from "@/lib/supabase/config";

/* Imagem que o próprio app enviou para o Storage (foto de post, de perfil, de
   capa). Nada de endereço de fora: um link externo serviria para rastrear quem
   abre o post. Vazio também vale (sem imagem). */
export function imagemDoApp(url: string): boolean {
  if (url === "") return true;
  return Boolean(SUPABASE_URL) && url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`) && url.length < 600;
}

/** Quantas fotos cabem num post. O banco tem a mesma trava (posts_imagens_max). */
export const MAX_FOTOS_POST = 10;
