import { createClient } from "@/lib/supabase/server";
import { adminOuNulo } from "@/lib/admin";
import { aplicarFiltros, filtrosDe, periodoDe, relatorioParticipacao, type LinhaParticipacao } from "@/lib/gestao";
import { nivelDe } from "@/lib/qualificacoes";

export const dynamic = "force-dynamic";

/* Exportação do relatório por membro (item 7). CSV com BOM e ponto e vírgula:
   abre direto no Excel em português e importa no Google Sheets. Usa os mesmos
   filtros da tela e fica registrado no log (dado pessoal saindo do sistema). */

function dataBR(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function celula(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutraliza fórmula de planilha (=, +, -, @) vinda de campo digitado pelo usuário.
  const seguro = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[";\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

const COLUNAS: [string, (l: LinhaParticipacao) => unknown][] = [
  ["Nome", (l) => l.nome],
  ["E-mail", (l) => l.email],
  ["WhatsApp", (l) => l.whatsapp],
  ["Profissão", (l) => l.profissao],
  ["Cidade", (l) => l.cidade],
  ["UF", (l) => l.uf],
  ["Nível", (l) => nivelDe(l.qualificacao).rotulo],
  ["Status", (l) => l.status],
  ["Tem conta na rede", (l) => (l.tem_conta ? "sim" : "não")],
  ["Vinculado à base de alunos", (l) => (l.vinculado_base ? "sim" : "não")],
  ["Posts no período", (l) => l.posts_periodo],
  ["Posts desde a entrada", (l) => l.posts_total],
  ["Comentários no período", (l) => l.comentarios_periodo],
  ["Comentários desde a entrada", (l) => l.comentarios_total],
  ["Reações no período", (l) => l.reacoes_periodo],
  ["Reações desde a entrada", (l) => l.reacoes_total],
  ["Reações recebidas", (l) => l.reacoes_recebidas_total],
  ["Artigos publicados", (l) => l.artigos_total],
  ["Primeiro acesso", (l) => dataBR(l.primeiro_acesso)],
  ["Primeiro acesso estimado", (l) => (l.primeiro_acesso ? (l.primeiro_acesso_estimado ? "sim" : "não") : "")],
  ["Último acesso", (l) => dataBR(l.ultimo_acesso)],
  ["Dias sem acesso", (l) => l.dias_sem_acesso ?? ""],
  ["Dias com acesso no período", (l) => l.dias_ativos_periodo],
  ["Perfil", (l) => (l.slug ? `https://blog.timeholdingbrasil.com.br/especialista/${l.slug}` : "")],
];

export async function GET(request: Request) {
  if (!(await adminOuNulo())) return new Response("Sem permissão.", { status: 403 });

  const url = new URL(request.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const periodo = periodoDe(sp, 30);
  const filtros = filtrosDe(sp);
  const linhas = aplicarFiltros(await relatorioParticipacao(periodo), filtros);

  const supabase = await createClient();
  await supabase.rpc("registrar_exportacao", {
    p_filtros: { ...periodo, ...filtros },
    p_linhas: linhas.length,
  });

  const csv =
    "﻿" +
    [COLUNAS.map(([t]) => celula(t)).join(";"), ...linhas.map((l) => COLUNAS.map(([, f]) => celula(f(l))).join(";"))].join("\r\n") +
    "\r\n";

  const nome = `participacao-comunidade-${periodo.inicio}-a-${periodo.fim}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "no-store",
    },
  });
}
