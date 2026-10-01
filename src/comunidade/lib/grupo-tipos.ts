import type { Qualificacao } from "@/comunidade/lib/qualificacoes";

/* Tipos e utilitários PUROS do grupo (sem I/O): podem ser importados por
   componentes do navegador. O acesso ao banco fica em lib/grupo.ts. */

/** Textos do grupo. A descrição veio do grupo do Facebook (trecho visível). */
export const GRUPO = {
  nome: "Rede Nacional de Especialistas",
  descricao:
    "Comunidade exclusiva para os alunos do Treinamento Holding Masters do Professor Marcio Carvalho de Sá. Aqui vocês podem tirar dúvidas, interagir e trocar experiência com os colegas.",
  privado: "Somente os membros podem ver quem está no grupo e o que é publicado.",
  entrada: "Quem pede para entrar responde um questionário e a coordenação confere se é aluno.",
} as const;

export interface MembroResumo {
  id: string;
  slug: string | null;
  nome: string;
  avatar_url: string | null;
  qualificacao: Qualificacao;
  verificado: boolean;
  papel: "admin" | "aluno" | string;
  profissao: string | null;
  headline: string | null;
  cidade: string | null;
  uf: string | null;
  criado_em: string;
}

/** "1,3 mil", "12 mil", "847". Igual ao jeito do Facebook de abreviar. */
export function contagemCurta(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(Math.floor(n / 100) / 10).toLocaleString("pt-BR")} mil`;
  if (n < 1000000) return `${Math.floor(n / 1000).toLocaleString("pt-BR")} mil`;
  return `${(Math.floor(n / 100000) / 10).toLocaleString("pt-BR")} mi`;
}

/** Caminho do perfil do membro DENTRO da comunidade. */
export function hrefMembro(m: { slug?: string | null; id: string }): string {
  return `/comunidade/membro/${m.slug || m.id}`;
}

/** Texto de busca seguro para ilike / filtros do PostgREST: sem curingas nem
 *  os caracteres que quebram a sintaxe de `or()`. Máximo de 80 caracteres. */
export function limparBusca(q: string | null | undefined): string {
  return (q ?? "")
    .replace(/[%_*,()\\"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
