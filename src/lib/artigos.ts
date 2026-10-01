import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";
import type { Artigo, ArtigoComAutor, StatusArtigo } from "@/lib/artigos-tipos";

/* ============================================================================
   Artigos (newsletter) — QUERIES server (tocam o banco). Os tipos e helpers
   puros vivem em `artigos-tipos.ts` (importável por Client Components).

   Ciclo de status: rascunho → em_analise → publicado ; ramo em_analise → ajustes.
   A "editoria" de um artigo NÃO é uma tabela: é a profissão do autor (padrão MVP).
   ========================================================================== */

// Reexporta os tipos/helpers puros para quem importa "@/lib/artigos".
export type {
  Artigo,
  ArtigoComAutor,
  AutorArtigo,
  Bloco,
  StatusArtigo,
} from "@/lib/artigos-tipos";
export { STATUS_META, chapeuDe, tempoLeitura } from "@/lib/artigos-tipos";

const CAMPOS_AUTOR_ARTIGO =
  "id, slug, nome, avatar_url, qualificacao, profissao, cidade, uf, whatsapp, espaco, certificado";

const CAMPOS_ARTIGO =
  "id, autor_id, slug, titulo, chapeu, resumo, capa, blocos, status, motivo, leituras, criado_em, enviado_em, publicado_em, atualizado_em";

/** Artigos publicados, ordenados por publicação desc (listagem pública). */
export async function listarPublicados(limite = 60): Promise<ArtigoComAutor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("artigos")
    .select(`${CAMPOS_ARTIGO}, autor:autor_id (${CAMPOS_AUTOR_ARTIGO})`)
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false })
    .limit(limite);
  return (data ?? []) as unknown as ArtigoComAutor[];
}

/** Um artigo publicado por slug (leitor público). */
export async function artigoPorSlug(slug: string): Promise<ArtigoComAutor | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("artigos")
    .select(`${CAMPOS_ARTIGO}, autor:autor_id (${CAMPOS_AUTOR_ARTIGO})`)
    .eq("slug", slug)
    .eq("status", "publicado")
    .maybeSingle();
  return (data as unknown as ArtigoComAutor | null) ?? null;
}

/** Artigos publicados de um autor (para a página de perfil). */
export async function artigosDoAutor(autorId: string): Promise<ArtigoComAutor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("artigos")
    .select(`${CAMPOS_ARTIGO}, autor:autor_id (${CAMPOS_AUTOR_ARTIGO})`)
    .eq("autor_id", autorId)
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false });
  return (data ?? []) as unknown as ArtigoComAutor[];
}

/** Meus artigos (todos os status) — exige sessão. */
export async function meusArtigos(): Promise<Artigo[]> {
  const perfil = await getPerfilAtual();
  if (!perfil) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("artigos")
    .select(CAMPOS_ARTIGO)
    .eq("autor_id", perfil.id)
    .order("criado_em", { ascending: false });
  return (data ?? []) as unknown as Artigo[];
}

/** Um artigo do próprio autor por id (para o editor) — exige ser dono/admin (RLS). */
export async function meuArtigo(id: string): Promise<Artigo | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("artigos")
    .select(CAMPOS_ARTIGO)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as Artigo | null) ?? null;
}

/** Um artigo com autor, em qualquer status (revisão da coordenação). */
export async function artigoParaRevisao(id: string): Promise<ArtigoComAutor | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("artigos")
    .select(`${CAMPOS_ARTIGO}, autor:autor_id (${CAMPOS_AUTOR_ARTIGO})`)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as ArtigoComAutor | null) ?? null;
}

/** Fila da coordenação: artigos por status (em_analise/ajustes = mais antigos primeiro). */
export async function filaCoordenacao(
  status: StatusArtigo,
): Promise<ArtigoComAutor[]> {
  const supabase = await createClient();
  const asc = status !== "publicado"; // fila FIFO; publicados = recentes primeiro
  const coluna = status === "publicado" ? "publicado_em" : "enviado_em";
  const { data } = await supabase
    .from("artigos")
    .select(`${CAMPOS_ARTIGO}, autor:autor_id (${CAMPOS_AUTOR_ARTIGO})`)
    .eq("status", status)
    .order(coluna, { ascending: asc, nullsFirst: false })
    .limit(200);
  return (data ?? []) as unknown as ArtigoComAutor[];
}

/** Contagem por status para os badges/contadores da coordenação. */
export async function contagemFila(): Promise<Record<StatusArtigo, number>> {
  const supabase = await createClient();
  const base: Record<StatusArtigo, number> = {
    rascunho: 0,
    em_analise: 0,
    publicado: 0,
    ajustes: 0,
  };
  const { data } = await supabase.from("artigos").select("status");
  for (const row of data ?? []) {
    const s = (row as { status: StatusArtigo }).status;
    if (s in base) base[s] += 1;
  }
  return base;
}
