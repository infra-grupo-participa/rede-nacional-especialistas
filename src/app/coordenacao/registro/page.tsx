import Link from "next/link";
import { C, F, BORDA } from "@/lib/tokens";
import { exigirAdminPagina } from "@/lib/admin";
import { contadoresCoordenacao, registroAtividades, ROTULO_ACAO, type LinhaLog } from "@/lib/gestao";
import { nivelDe, type Qualificacao } from "@/lib/qualificacoes";
import { CabecalhoCoordenacao, Caixa } from "@/components/coordenacao/cabecalho";

export const dynamic = "force-dynamic";

const GRUPOS = [
  { id: "", rotulo: "Tudo" },
  { id: "entrada", rotulo: "Entrada" },
  { id: "membro", rotulo: "Membros" },
  { id: "post", rotulo: "Posts" },
  { id: "comentario", rotulo: "Comentários" },
  { id: "artigo", rotulo: "Artigos" },
  { id: "arquivo", rotulo: "Arquivos" },
  { id: "palavra", rotulo: "Palavras-chave" },
  { id: "config", rotulo: "Regras" },
  { id: "relatorio", rotulo: "Exportações" },
  { id: "base", rotulo: "Base de alunos" },
];

const POR_PAGINA = 80;

function quando(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function rotuloValor(v: unknown): string {
  const s = String(v ?? "");
  if (["thb", "aurum", "platina", "diamante", "diamante_vermelho"].includes(s)) return nivelDe(s as Qualificacao).rotulo;
  return s;
}

/** Resumo legível dos detalhes (de → para, motivo, trecho). */
function detalhe(l: LinhaLog): string {
  const d = l.detalhes ?? {};
  const partes: string[] = [];
  if ("de" in d && "para" in d) partes.push(`${rotuloValor(d.de)} → ${rotuloValor(d.para)}`);
  if (typeof d.motivo === "string" && d.motivo) partes.push(`motivo: ${d.motivo}`);
  if (typeof d.autor === "string" && d.autor) partes.push(`autor: ${d.autor}`);
  if (typeof d.trecho === "string" && d.trecho) partes.push(`"${d.trecho.slice(0, 120)}${d.trecho.length > 120 ? "…" : ""}"`);
  if (typeof d.linhas === "number") partes.push(`${d.linhas} linhas`);
  if (typeof d.inseridos === "number") partes.push(`${d.inseridos} novos, ${d.atualizados} atualizados`);
  if (typeof d.email_base === "string") partes.push(`login ${d.email_login} → base ${d.email_base}`);
  if (Array.isArray(d.retido_por) && d.retido_por.length) partes.push(`retido por: ${d.retido_por.join(", ")}`);
  return partes.join(" · ");
}

/* Registro de atividades da coordenação (auditoria). Imutável: nasce por
   gatilho no banco, ninguém edita nem apaga. */
export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigirAdminPagina();
  const sp = await searchParams;
  const grupo = typeof sp.grupo === "string" && GRUPOS.some((g) => g.id === sp.grupo) ? sp.grupo : "";
  const antes = typeof sp.antes === "string" ? Number.parseInt(sp.antes, 10) : undefined;
  const [linhas, contadores] = await Promise.all([
    registroAtividades({ acao: grupo ? `${grupo}` : undefined, limite: POR_PAGINA, antesDe: Number.isFinite(antes) ? antes : undefined }),
    contadoresCoordenacao(),
  ]);
  const ultimo = linhas.length === POR_PAGINA ? linhas[linhas.length - 1].id : null;

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <CabecalhoCoordenacao ativa="registro" contadores={contadores} />
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-6">
        <h1 className="text-[28px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 700 }}>
          Registro de atividades
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: C.muted }}>
          Tudo o que a coordenação fez: aprovações, remoções, travas, mudanças de nível, regras e exportações. Ninguém edita nem apaga este registro.
        </p>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {GRUPOS.map((g) => (
            <Link
              key={g.id}
              href={g.id ? `/coordenacao/registro?grupo=${g.id}` : "/coordenacao/registro"}
              className="press shrink-0 rounded-full px-3.5 text-[13px] font-semibold"
              style={{
                height: 34,
                lineHeight: "34px",
                background: grupo === g.id ? C.ink : C.surface,
                color: grupo === g.id ? C.fundo : C.ink,
                border: `1px solid ${grupo === g.id ? C.ink : C.line}`,
              }}
            >
              {g.rotulo}
            </Link>
          ))}
        </div>

        {linhas.length === 0 ? (
          <Caixa className="mt-4 text-center">
            <p className="text-[15px]">Nenhuma atividade registrada {grupo ? "neste grupo" : "ainda"}.</p>
          </Caixa>
        ) : (
          <ul className="mt-4 overflow-hidden rounded-2xl" style={{ background: C.surface, border: BORDA }}>
            {linhas.map((l, i) => (
              <li key={l.id} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:gap-4" style={{ borderTop: i ? BORDA : undefined }}>
                <span className="shrink-0 text-[12px] tabular-nums sm:w-28" style={{ color: C.muted, fontFamily: F.mono }}>
                  {quando(l.criado_em)}
                </span>
                <span className="min-w-0 flex-1 text-[14px]">
                  <strong>{l.ator_nome || "Sistema"}</strong> · {ROTULO_ACAO[l.acao] ?? l.acao}
                  {l.alvo_rotulo && (
                    <>
                      {": "}
                      <span className="font-semibold">{l.alvo_rotulo}</span>
                    </>
                  )}
                  {detalhe(l) && (
                    <span className="block text-[12px]" style={{ color: C.muted }}>
                      {detalhe(l)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {ultimo && (
          <div className="mt-3 text-center">
            <Link
              href={`/coordenacao/registro?${new URLSearchParams({ ...(grupo ? { grupo } : {}), antes: String(ultimo) }).toString()}`}
              className="press inline-block rounded-full px-5 text-[14px] font-semibold"
              style={{ height: 42, lineHeight: "42px", border: BORDA, background: C.surface }}
            >
              Mais antigas
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
