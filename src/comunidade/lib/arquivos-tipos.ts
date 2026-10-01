import type { Qualificacao } from "@/comunidade/lib/qualificacoes";

/* Tipos e utilitários puros da aba de arquivos (sem I/O): podem ser
   importados por componentes do navegador. O acesso ao banco fica em
   lib/arquivos.ts. */

export const BUCKET_ARQUIVOS = "rede-arquivos";
export const MAX_MB_ARQUIVO = 50;

export type TipoArquivo = "documento" | "imagem" | "video" | "link";

export interface Arquivo {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoArquivo;
  caminho: string | null;
  url: string | null;
  mime: string;
  tamanho_bytes: number;
  fixado: boolean;
  criado_em: string;
  autor: { id: string; slug: string | null; nome: string; qualificacao: Qualificacao; verificado?: boolean };
  /** URL assinada para miniatura (só imagens enviadas). */
  miniatura?: string | null;
}

export interface MidiaPost {
  post_id: string;
  imagem_url: string;
  titulo: string;
  criado_em: string;
  autor: string;
}

export function tamanhoLegivel(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Tipo pelo mime do arquivo enviado. */
export function tipoPorMime(mime: string): TipoArquivo {
  if (mime.startsWith("image/")) return "imagem";
  if (mime.startsWith("video/")) return "video";
  return "documento";
}
