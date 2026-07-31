import type { Qualificacao } from "./qualificacoes";

export type Papel = "aluno" | "admin";
export type StatusPerfil = "pendente" | "aprovado" | "recusado" | "suspenso";

export interface Perfil {
  id: string;
  auth_id: string | null;
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
  /** Espaço de Instrução (design novo). */
  espaco: string;
  /** certificado pelo Espaço de Instrução. */
  certificado: boolean;
  /** telefone separado do whatsapp. */
  telefone: string;
  /** título curto sob o nome (estilo LinkedIn). */
  headline: string;
  youtube: string;
  tiktok: string;
  facebook: string;
  /** áreas de atuação como tags. */
  especialidades: string[];
  /** destaques/conquistas: [{titulo, texto}]. */
  destaques: { titulo: string; texto: string }[];
  /** cor/gradiente da capa quando sem imagem. */
  cor_capa: string;
  xp: number;
  nivel_gam: number;
  /** true = veio do espelho da base THB (vw_aluno_360). */
  origem_thb: boolean;
  /** Opt-out: aluno pediu para não aparecer na vitrine pública. */
  oculto: boolean;
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
