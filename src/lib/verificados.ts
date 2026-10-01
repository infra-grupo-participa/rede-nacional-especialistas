import { createClient } from "@/lib/supabase/server";

/** Ids dos perfis verificados pela coordenação (selo laranja). São poucos; a
 *  vitrine e o ranking leem de views que não trazem a coluna, então marcam o
 *  selo cruzando com esta lista. Se a consulta falhar, ninguém aparece com
 *  selo (a página segue no ar) e o erro vai para o log do servidor. */
export async function idsVerificados(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("perfis").select("id").eq("verificado", true);
  if (error) console.error("[verificados] não foi possível ler os perfis verificados:", error.message);
  return new Set((data ?? []).map((r) => (r as { id: string }).id));
}
