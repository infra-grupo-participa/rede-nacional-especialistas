import type { AutorResumo } from "@/lib/feed";

/* ============================================================================
   Artigos — tipos e helpers PUROS (sem I/O). Este módulo pode ser importado por
   Client Components. As queries que tocam o banco ficam em `artigos.ts` (server).
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
