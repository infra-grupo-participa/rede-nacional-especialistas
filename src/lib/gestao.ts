import { createClient } from "@/lib/supabase/server";
import type { Qualificacao } from "@/lib/qualificacoes";
import type { Papel, StatusPerfil } from "@/lib/types";

/* ============================================================================
   Camada de dados da coordenação (gestão da comunidade). Tudo aqui depende de
   RPCs SECURITY DEFINER da migration 0006 que só devolvem dados para admin;
   as páginas ainda checam o papel antes de chamar (defesa em profundidade).
   ========================================================================== */

/* ------------------------------------------------------------- período -- */

export const FUSO = "America/Sao_Paulo";

/** Data de hoje em São Paulo no formato AAAA-MM-DD. */
export function hojeSP(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(new Date());
}

/** Soma dias a uma data AAAA-MM-DD (calendário puro, sem fuso). */
export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

export interface Periodo {
  inicio: string;
  fim: string;
}

/** Lê ?inicio=&fim= da URL; padrão = últimos 30 dias. Corrige início > fim. */
export function periodoDe(sp: Record<string, string | string[] | undefined>, diasPadrao = 30): Periodo {
  const hoje = hojeSP();
  const ini = typeof sp.inicio === "string" && RE_DATA.test(sp.inicio) ? sp.inicio : somarDias(hoje, -(diasPadrao - 1));
  const fim = typeof sp.fim === "string" && RE_DATA.test(sp.fim) ? sp.fim : hoje;
  return ini <= fim ? { inicio: ini, fim } : { inicio: fim, fim: ini };
}

/* --------------------------------------------------- relatório por membro -- */

export interface LinhaParticipacao {
  perfil_id: string;
  slug: string | null;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  profissao: string | null;
  cidade: string | null;
  uf: string | null;
  qualificacao: Qualificacao;
  status: StatusPerfil;
  papel: Papel;
  tem_conta: boolean;
  vinculado_base: boolean;
  membro_desde: string;
  posts_periodo: number;
  posts_total: number;
  comentarios_periodo: number;
  comentarios_total: number;
  reacoes_periodo: number;
  reacoes_total: number;
  reacoes_recebidas_total: number;
  artigos_total: number;
  primeiro_acesso: string | null;
  ultimo_acesso: string | null;
  /** true quando o primeiro acesso foi reconstruído de atividade antiga (antes do rastreio). */
  primeiro_acesso_estimado: boolean;
  dias_ativos_periodo: number;
  dias_sem_acesso: number | null;
}

export async function relatorioParticipacao(p: Periodo): Promise<LinhaParticipacao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("relatorio_participacao", {
    p_inicio: p.inicio,
    p_fim: p.fim,
  });
  if (error) throw new Error(`relatorio_participacao: ${error.message}`);
  return (data ?? []) as LinhaParticipacao[];
}

/** Filtros do relatório (vêm da URL, valem para a tela e para a exportação). */
export interface FiltrosRelatorio {
  nivel: Qualificacao | "todos";
  /** "todos" | "ativos" | "inativos" | "nunca" */
  situacao: "todos" | "ativos" | "inativos" | "nunca";
  /** dias sem acesso para contar como inativo (15, 30, 60...). */
  diasInativo: number;
  /** status do perfil; padrão só aprovados. */
  status: StatusPerfil | "todos";
  /** "todos" | "sim" | "nao" (vínculo com a base de alunos). */
  base: "todos" | "sim" | "nao";
  busca: string;
  ordem: "nome" | "ultimo_acesso" | "posts" | "comentarios" | "reacoes" | "dias_ativos";
}

const NIVEIS_OK = ["thb", "aurum", "platina", "diamante", "diamante_vermelho"];

export function filtrosDe(sp: Record<string, string | string[] | undefined>): FiltrosRelatorio {
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const nivel = NIVEIS_OK.includes(s("nivel")) ? (s("nivel") as Qualificacao) : "todos";
  const situacao = (["ativos", "inativos", "nunca"].includes(s("situacao")) ? s("situacao") : "todos") as FiltrosRelatorio["situacao"];
  const dias = Number.parseInt(s("dias"), 10);
  const status = (["pendente", "aprovado", "recusado", "suspenso", "todos"].includes(s("status"))
    ? s("status")
    : "aprovado") as FiltrosRelatorio["status"];
  const base = (["sim", "nao"].includes(s("base")) ? s("base") : "todos") as FiltrosRelatorio["base"];
  const ordem = (["ultimo_acesso", "posts", "comentarios", "reacoes", "dias_ativos"].includes(s("ordem"))
    ? s("ordem")
    : "nome") as FiltrosRelatorio["ordem"];
  return {
    nivel,
    situacao,
    diasInativo: Number.isFinite(dias) && dias > 0 && dias <= 3650 ? dias : 30,
    status,
    base,
    busca: s("q").trim().slice(0, 80),
    ordem,
  };
}

function semAcento(s: string | null | undefined): string {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Inativo = tem conta e está há `dias` ou mais sem acessar, ou nunca acessou. */
export function ehInativo(l: LinhaParticipacao, dias: number): boolean {
  return l.dias_sem_acesso === null || l.dias_sem_acesso >= dias;
}

export function aplicarFiltros(linhas: LinhaParticipacao[], f: FiltrosRelatorio): LinhaParticipacao[] {
  const q = semAcento(f.busca);
  const out = linhas.filter((l) => {
    if (f.status !== "todos" && l.status !== f.status) return false;
    if (f.nivel !== "todos" && l.qualificacao !== f.nivel) return false;
    if (f.base === "sim" && !l.vinculado_base) return false;
    if (f.base === "nao" && l.vinculado_base) return false;
    if (f.situacao === "nunca" && l.ultimo_acesso !== null) return false;
    if (f.situacao === "inativos" && !ehInativo(l, f.diasInativo)) return false;
    if (f.situacao === "ativos" && (l.dias_sem_acesso === null || l.dias_sem_acesso >= f.diasInativo)) return false;
    if (q && !semAcento(`${l.nome} ${l.email ?? ""} ${l.cidade ?? ""} ${l.whatsapp ?? ""}`).includes(q)) return false;
    return true;
  });

  const porNome = (a: LinhaParticipacao, b: LinhaParticipacao) => a.nome.localeCompare(b.nome, "pt-BR");
  const desc = (k: (l: LinhaParticipacao) => number) => (a: LinhaParticipacao, b: LinhaParticipacao) =>
    k(b) - k(a) || porNome(a, b);

  switch (f.ordem) {
    case "ultimo_acesso":
      return out.sort((a, b) => (b.ultimo_acesso ?? "").localeCompare(a.ultimo_acesso ?? "") || porNome(a, b));
    case "posts":
      return out.sort(desc((l) => l.posts_periodo));
    case "comentarios":
      return out.sort(desc((l) => l.comentarios_periodo));
    case "reacoes":
      return out.sort(desc((l) => l.reacoes_periodo));
    case "dias_ativos":
      return out.sort(desc((l) => l.dias_ativos_periodo));
    default:
      return out.sort(porNome);
  }
}

/* ------------------------------------------------------------- insights -- */

export interface PontoSerie {
  dia: string;
  posts: number;
  comentarios: number;
  reacoes: number;
  ativos: number;
  novos: number;
}

export interface Insights {
  periodo: Periodo;
  totais: {
    membros_aprovados: number;
    membros_com_conta: number;
    novos_no_periodo: number;
    pedidos_pendentes: number;
    posts_retidos: number;
    posts: number;
    comentarios: number;
    reacoes: number;
    ativos: number;
    participantes: number;
  };
  serie: PontoSerie[];
  dias_semana: { dow: number; n: number }[];
  horas: { hora: number; n: number }[];
  top_posts: {
    id: string;
    titulo: string;
    score: number;
    n_comentarios: number;
    criado_em: string;
    autor: string;
    autor_slug: string | null;
    qualificacao: Qualificacao;
  }[];
  top_contribuidores: {
    id: string;
    nome: string;
    slug: string | null;
    qualificacao: Qualificacao;
    posts: number;
    comentarios: number;
    total: number;
  }[];
  por_nivel: { qualificacao: Qualificacao; membros: number; ativos: number; sem_conta: number }[];
}

export async function insights(p: Periodo): Promise<Insights> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("insights", { p_inicio: p.inicio, p_fim: p.fim });
  if (error) throw new Error(`insights: ${error.message}`);
  return data as Insights;
}

/* ------------------------------------------------------ pedidos de entrada -- */

export interface PedidoEntrada {
  id: string;
  perfil_id: string;
  respostas: { pergunta: string; resposta: string }[];
  aceitou_regras: boolean;
  status: "pendente" | "aprovado" | "recusado";
  motivo: string;
  criado_em: string;
  decidido_em: string | null;
  perfil: {
    id: string;
    nome: string;
    email: string | null;
    whatsapp: string | null;
    profissao: string | null;
    cidade: string | null;
    uf: string | null;
    qualificacao: Qualificacao;
    status: StatusPerfil;
    criado_em: string;
  };
}

export async function pedidosEntrada(status: "pendente" | "aprovado" | "recusado" = "pendente", limite = 100): Promise<PedidoEntrada[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos_entrada")
    .select(
      `id, perfil_id, respostas, aceitou_regras, status, motivo, criado_em, decidido_em,
       perfil:perfil_id (id, nome, email, whatsapp, profissao, cidade, uf, qualificacao, status, criado_em)`,
    )
    .eq("status", status)
    .order("criado_em", { ascending: status === "pendente" })
    .limit(limite);
  return (data ?? []) as unknown as PedidoEntrada[];
}

/** Perfis pendentes que ainda NÃO responderam o questionário. */
export async function pendentesSemPedido(): Promise<PedidoEntrada["perfil"][]> {
  const supabase = await createClient();
  const [{ data: perfis }, { data: pedidos }] = await Promise.all([
    supabase
      .from("perfis")
      .select("id, nome, email, whatsapp, profissao, cidade, uf, qualificacao, status, criado_em")
      .eq("status", "pendente")
      .order("criado_em", { ascending: true })
      .limit(300),
    supabase.from("pedidos_entrada").select("perfil_id").eq("status", "pendente").limit(1000),
  ]);
  const com = new Set((pedidos ?? []).map((p) => (p as { perfil_id: string }).perfil_id));
  return ((perfis ?? []) as PedidoEntrada["perfil"][]).filter((p) => !com.has(p.id));
}

export interface CandidatoBase {
  perfil_id: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  cidade: string | null;
  uf: string | null;
  qualificacao: Qualificacao;
  plano_thb: string | null;
  motivos: string[];
}

export async function candidatosBase(perfilId: string): Promise<CandidatoBase[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("candidatos_base", { p_perfil: perfilId });
  return (data ?? []) as CandidatoBase[];
}

/* -------------------------------------------------------------- moderação -- */

export interface PostRetido {
  id: string;
  titulo: string;
  corpo: string;
  imagem_url: string;
  retido_por: string[];
  status: string;
  criado_em: string;
  moderado_em: string | null;
  autor: { id: string; slug: string | null; nome: string; avatar_url: string; qualificacao: Qualificacao };
}

export async function postsPorStatus(status: "pendente" | "recusado", limite = 100): Promise<PostRetido[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(
      `id, titulo, corpo, imagem_url, retido_por, status, criado_em, moderado_em,
       autor:autor_id (id, slug, nome, avatar_url, qualificacao)`,
    )
    .eq("status", status)
    .order(status === "pendente" ? "criado_em" : "moderado_em", { ascending: status === "pendente" })
    .limit(limite);
  return (data ?? []) as unknown as PostRetido[];
}

export interface PalavraModeracao {
  id: string;
  termo: string;
  criado_em: string;
}

export async function palavrasModeracao(): Promise<PalavraModeracao[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("palavras_moderacao").select("id, termo, criado_em").order("termo");
  return (data ?? []) as PalavraModeracao[];
}

/* -------------------------------------------------------- config / regras -- */

export interface ConfigComunidade {
  regras: string;
  perguntas: string[];
  hashtags: string[];
  exigir_hashtag: boolean;
  atualizado_em: string;
}

const CONFIG_VAZIA: ConfigComunidade = {
  regras: "",
  perguntas: [],
  hashtags: [],
  exigir_hashtag: false,
  atualizado_em: "",
};

export async function configComunidade(): Promise<ConfigComunidade> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("config_comunidade")
    .select("regras, perguntas, hashtags, exigir_hashtag, atualizado_em")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return CONFIG_VAZIA;
  const c = data as ConfigComunidade;
  return { ...c, perguntas: Array.isArray(c.perguntas) ? c.perguntas : [] };
}

/* ------------------------------------------------- registro de atividades -- */

export interface LinhaLog {
  id: number;
  ator_id: string | null;
  ator_nome: string;
  acao: string;
  alvo_tipo: string;
  alvo_id: string | null;
  alvo_rotulo: string;
  detalhes: Record<string, unknown>;
  criado_em: string;
}

export async function registroAtividades(opts: { acao?: string; ator?: string; limite?: number; antesDe?: number }): Promise<LinhaLog[]> {
  const supabase = await createClient();
  let q = supabase
    .from("log_moderacao")
    .select("id, ator_id, ator_nome, acao, alvo_tipo, alvo_id, alvo_rotulo, detalhes, criado_em")
    .order("id", { ascending: false })
    .limit(opts.limite ?? 100);
  if (opts.acao) q = q.like("acao", `${opts.acao}%`);
  if (opts.ator) q = q.eq("ator_id", opts.ator);
  if (opts.antesDe) q = q.lt("id", opts.antesDe);
  const { data } = await q;
  return (data ?? []) as LinhaLog[];
}

/** Nome legível de cada ação do registro. */
export const ROTULO_ACAO: Record<string, string> = {
  "post.aprovado": "Aprovou post retido",
  "post.recusado": "Recusou post",
  "post.removido": "Removeu post",
  "post.restaurado": "Restaurou post",
  "post.apagado": "Apagou post",
  "post.fixado": "Fixou post",
  "post.desafixado": "Desafixou post",
  "post.comentarios_travados": "Travou comentários",
  "post.comentarios_liberados": "Liberou comentários",
  "comentario.apagado": "Apagou comentário",
  "comentario_artigo.apagado": "Apagou comentário de artigo",
  "artigo.publicado": "Publicou artigo",
  "artigo.ajustes": "Pediu ajustes em artigo",
  "artigo.apagado": "Apagou artigo",
  "membro.status": "Mudou status do membro",
  "membro.nivel": "Mudou nível do membro",
  "membro.papel": "Mudou papel do membro",
  "membro.visibilidade": "Mudou visibilidade do membro",
  "membro.vinculado_base": "Vinculou membro à base de alunos",
  "entrada.aprovada": "Aprovou entrada",
  "entrada.recusada": "Recusou entrada",
  "config.alterada": "Alterou regras/configuração",
  "palavra.adicionada": "Adicionou palavra-chave",
  "palavra.removida": "Removeu palavra-chave",
  "arquivo.apagado": "Apagou arquivo",
  "arquivo.fixado": "Fixou arquivo",
  "arquivo.desafixado": "Desafixou arquivo",
  "base.sincronizada": "Sincronizou a base de alunos",
  "relatorio.exportado": "Exportou relatório",
};

/** Contadores das abas da coordenação (badges). */
export async function contadoresCoordenacao(): Promise<{ pedidos: number; retidos: number; artigos: number }> {
  const supabase = await createClient();
  const [ped, ret, art] = await Promise.all([
    supabase.from("pedidos_entrada").select("id", { count: "exact", head: true }).eq("status", "pendente"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "pendente"),
    supabase.from("artigos").select("id", { count: "exact", head: true }).eq("status", "em_analise"),
  ]);
  return { pedidos: ped.count ?? 0, retidos: ret.count ?? 0, artigos: art.count ?? 0 };
}
