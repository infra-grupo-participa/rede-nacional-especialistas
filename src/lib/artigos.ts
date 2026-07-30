import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";
import type { AutorResumo } from "@/lib/feed";

/* ============================================================================
   Artigos (newsletter) — tipos e leitura.

   Ciclo de status: rascunho → em_analise → publicado ; ramo em_analise → ajustes.
   A "editoria" de um artigo NÃO é uma tabela: é a profissão do autor (padrão do
   MVP). O "chapéu" cai para a profissão do autor quando vazio.
   ========================================================================== */

export type StatusArtigo = "rascunho" | "em_analise" | "publicado" | "ajustes";

export interface Bloco {
  id: string;
  tipo: "h2" | "paragrafo" | "imagem" | "citacao";
  texto?: string;
  url?: string;
  legenda?: string;
}

export interface Artigo {
  id: string;
  autor_id: string;
  slug: string | null;
  titulo: string;
  chapeu: string;
  resumo: string;
  capa: string;
  blocos: Bloco[];
  status: StatusArtigo;
  motivo: string;
  leituras: number;
  criado_em: string;
  enviado_em: string | null;
  publicado_em: string | null;
  atualizado_em: string;
}

/** Autor com os campos que o card/leitor de artigo mostra. */
export interface AutorArtigo extends AutorResumo {
  profissao: string;
  cidade: string;
  uf: string | null;
  whatsapp: string;
  espaco: string;
  certificado: boolean;
}

export interface ArtigoComAutor extends Artigo {
  autor: AutorArtigo;
}

export const STATUS_META: Record<
  StatusArtigo,
  { rotulo: string; fg: string; bg: string }
> = {
  rascunho: { rotulo: "Rascunho", fg: "#6E7B78", bg: "#EEF0EE" },
  em_analise: { rotulo: "Em análise", fg: "#9C6F3A", bg: "#F4EDE3" },
  publicado: { rotulo: "Publicado", fg: "#14504B", bg: "#E6EEEC" },
  ajustes: { rotulo: "Ajustes pedidos", fg: "#A33F37", bg: "#FBEDEC" },
};

const CAMPOS_AUTOR_ARTIGO =
  "id, slug, nome, avatar_url, qualificacao, profissao, cidade, uf, whatsapp, espaco, certificado";

const CAMPOS_ARTIGO =
  "id, autor_id, slug, titulo, chapeu, resumo, capa, blocos, status, motivo, leituras, criado_em, enviado_em, publicado_em, atualizado_em";

/** Chapéu do artigo; cai para a profissão do autor quando vazio (padrão MVP). */
export function chapeuDe(a: { chapeu: string; autor?: { profissao?: string } }): string {
  return a.chapeu?.trim() || a.autor?.profissao || "Artigo";
}

/** Tempo de leitura em minutos: ~200 palavras/min, mínimo 1. */
export function tempoLeitura(a: Pick<Artigo, "titulo" | "resumo" | "blocos">): number {
  const txt = [a.titulo, a.resumo, ...(a.blocos ?? []).map((b) => b.texto ?? "")]
    .join(" ")
    .trim();
  const palavras = txt ? txt.split(/\s+/).length : 0;
  return Math.max(1, Math.round(palavras / 200));
}

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
