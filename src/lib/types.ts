import type { Qualificacao } from "./qualificacoes";

export type Papel = "aluno" | "admin";
export type StatusPerfil = "pendente" | "aprovado" | "recusado" | "suspenso";

export interface Perfil {
  id: string;
  slug: string | null;
  nome: string;
  profissao: string;
  bio: string;
  cidade: string;
  uf: string | null;
  whatsapp: string;
  email: string | null;
  avatar_url: string;
  capa_url: string;
  instagram: string;
  linkedin: string;
  site: string;
  qualificacao: Qualificacao;
  papel: Papel;
  status: StatusPerfil;
  xp: number;
  nivel_gam: number;
  atualizado_em: string;
  criado_em: string;
}

/** Campos que o próprio dono pode editar (vitrine). */
export type PerfilEditavel = Pick<
  Perfil,
  | "nome"
  | "profissao"
  | "bio"
  | "cidade"
  | "uf"
  | "whatsapp"
  | "avatar_url"
  | "capa_url"
  | "instagram"
  | "linkedin"
  | "site"
>;
