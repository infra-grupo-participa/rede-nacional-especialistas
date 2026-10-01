import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { limparBusca, type MembroResumo } from "@/comunidade/lib/grupo-tipos";
import { fotosDoPost } from "@/comunidade/lib/feed-tipos";

export * from "@/comunidade/lib/grupo-tipos";

/* Dados do GRUPO (o que o cabeçalho, a aba Sobre e a aba Membros mostram).
   "Membro" aqui é quem está de fato dentro: perfil aprovado E com conta criada
   (auth_id preenchido). Aluno espelhado da base que ainda não criou conta não
   entra na contagem nem na lista. Nunca expor e-mail, WhatsApp ou telefone em
   lista: esses campos ficam só no perfil do próprio membro. */

const CAMPOS_MEMBRO = "id, slug, nome, avatar_url, qualificacao, verificado, papel, profissao, headline, cidade, uf, criado_em";

/** Total de membros (aprovados com conta). Uma leitura por request. */
export const contarMembros = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { count } = await supabase
    .from("perfis")
    .select("id", { count: "exact", head: true })
    .eq("status", "aprovado")
    .not("auth_id", "is", null);
  return count ?? 0;
});

/** Alguns membros para a fileira de fotos do cabeçalho: quem tem foto vem antes. */
export const amostraMembros = cache(async (n = 20): Promise<MembroResumo[]> => {
  const supabase = await createClient();
  const base = () => supabase.from("perfis").select(CAMPOS_MEMBRO).eq("status", "aprovado").not("auth_id", "is", null);
  const { data: comFoto } = await base().neq("avatar_url", "").not("avatar_url", "is", null).order("atualizado_em", { ascending: false }).limit(n);
  const lista = (comFoto ?? []) as unknown as MembroResumo[];
  if (lista.length < n) {
    const { data: resto } = await base().order("criado_em", { ascending: false }).limit(n * 2);
    for (const m of (resto ?? []) as unknown as MembroResumo[]) {
      if (lista.length >= n) break;
      if (!lista.some((x) => x.id === m.id)) lista.push(m);
    }
  }
  return lista;
});

/** A coordenação (administradores do grupo). */
export const coordenacaoDoGrupo = cache(async (): Promise<MembroResumo[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfis")
    .select(CAMPOS_MEMBRO)
    .eq("status", "aprovado")
    .eq("papel", "admin")
    .not("auth_id", "is", null)
    .order("nome", { ascending: true })
    .limit(60);
  return (data ?? []) as unknown as MembroResumo[];
});

/** Lista paginada de membros, com busca por nome. */
export async function listarMembros(opts: { q?: string; pagina?: number; porPagina?: number } = {}): Promise<{ itens: MembroResumo[]; total: number; pagina: number; porPagina: number }> {
  const porPagina = Math.min(Math.max(opts.porPagina ?? 40, 1), 100);
  const pagina = Math.max(opts.pagina ?? 1, 1);
  const q = limparBusca(opts.q);
  const supabase = await createClient();
  let consulta = supabase
    .from("perfis")
    .select(CAMPOS_MEMBRO, { count: "exact" })
    .eq("status", "aprovado")
    .not("auth_id", "is", null);
  if (q) consulta = consulta.ilike("nome", `%${q}%`);
  const { data, count } = await consulta
    .order("nome", { ascending: true })
    .range((pagina - 1) * porPagina, pagina * porPagina - 1);
  return { itens: (data ?? []) as unknown as MembroResumo[], total: count ?? 0, pagina, porPagina };
}

export interface MembroPerfil extends MembroResumo {
  bio: string | null;
  capa_url: string | null;
  cor_capa: string | null;
  especialidades: unknown;
  destaques: unknown;
  espaco: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  tiktok: string | null;
  facebook: string | null;
  site: string | null;
  tem_conta: boolean;
  /** aparece na vitrine pública do blog (não pediu para ficar oculto) */
  na_vitrine: boolean;
}

/** Perfil de um membro pelo slug (ou id). Só aprovado. */
export async function membroPorSlug(slugOuId: string): Promise<MembroPerfil | null> {
  const supabase = await createClient();
  const campos = `${CAMPOS_MEMBRO}, bio, capa_url, cor_capa, especialidades, destaques, espaco, instagram, linkedin, youtube, tiktok, facebook, site, auth_id, oculto`;
  const ehUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOuId);
  const { data } = await supabase
    .from("perfis")
    .select(campos)
    .eq("status", "aprovado")
    .eq(ehUuid ? "id" : "slug", slugOuId)
    .maybeSingle();
  if (!data) return null;
  const { auth_id, oculto, ...resto } = data as unknown as MembroPerfil & { auth_id: string | null; oculto: boolean | null };
  return { ...resto, tem_conta: Boolean(auth_id), na_vitrine: !oculto };
}

export interface AtividadeGrupo {
  postsHoje: number;
  postsMes: number;
  membros: number;
  novosNaSemana: number;
  /** data da primeira publicação da comunidade (ISO) ou null */
  desde: string | null;
}

/** Números da caixa "Atividade" da aba Sobre. Dia e mês no fuso de São Paulo. */
export async function atividadeDoGrupo(): Promise<AtividadeGrupo> {
  const supabase = await createClient();
  const agora = new Date();
  const hojeSP = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora); // AAAA-MM-DD
  const inicioHoje = `${hojeSP}T00:00:00-03:00`;
  const haDias = (d: number) => new Date(agora.getTime() - d * 86400000).toISOString();
  const posts = () => supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "publicado").eq("tipo", "post");

  const [hoje, mes, membros, novos, primeiro] = await Promise.all([
    posts().gte("criado_em", inicioHoje),
    posts().gte("criado_em", haDias(30)),
    contarMembros(),
    supabase.from("perfis").select("id", { count: "exact", head: true }).eq("status", "aprovado").not("auth_id", "is", null).gte("criado_em", haDias(7)),
    supabase.from("posts").select("criado_em").eq("status", "publicado").order("criado_em", { ascending: true }).limit(1),
  ]);
  return {
    postsHoje: hoje.count ?? 0,
    postsMes: mes.count ?? 0,
    membros,
    novosNaSemana: novos.count ?? 0,
    desde: ((primeiro.data ?? [])[0] as { criado_em: string } | undefined)?.criado_em ?? null,
  };
}

/** Últimas fotos publicadas nos posts (caixa "Mídia recente" da lateral).
 *  Post com várias fotos entra com todas, até completar `n`. */
export async function midiaRecente(n = 4): Promise<{ post_id: string; imagem_url: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, imagem_url, imagens")
    .eq("status", "publicado")
    .neq("imagem_url", "")
    .order("criado_em", { ascending: false })
    .limit(n * 3);
  return ((data ?? []) as { id: string; imagem_url: string | null; imagens: unknown }[])
    .flatMap((p) => fotosDoPost(p).map((url) => ({ post_id: p.id, imagem_url: url })))
    .slice(0, n);
}
