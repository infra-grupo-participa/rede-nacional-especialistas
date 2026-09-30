"use client";

import { useState } from "react";
import Link from "next/link";
import { C, F, BORDA } from "@/lib/tokens";
import { TagNivel } from "@/components/atoms";
import type { LinhaParticipacao } from "@/lib/gestao";
import { GerenciarMembro, type MembroGerenciavel } from "./gerenciar-membro";

const POR_PAGINA = 100;

function data(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(iso));
}

function Par({ periodo, total }: { periodo: number; total: number }) {
  return (
    <span className="tabular-nums" style={{ fontFamily: F.mono }}>
      <strong style={{ color: periodo > 0 ? C.ink : C.muted }}>{periodo}</strong>
      <span style={{ color: C.muted }}> / {total}</span>
    </span>
  );
}

/* Uma linha por aluno com todos os indicadores (item 1 do documento).
   Período / total em cada contador: o primeiro número é do período filtrado,
   o segundo é desde a entrada. */
export function TabelaParticipacao({ linhas, diasInativo }: { linhas: LinhaParticipacao[]; diasInativo: number }) {
  const [limite, setLimite] = useState(POR_PAGINA);
  const [membro, setMembro] = useState<MembroGerenciavel | null>(null);

  if (linhas.length === 0) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: C.surface, border: BORDA }}>
        <p className="text-[15px]">Nenhum membro com esses filtros.</p>
      </div>
    );
  }

  const th = "whitespace-nowrap px-3 py-2 text-left text-[12px] font-semibold";
  const td = "whitespace-nowrap px-3 py-2.5 align-top text-[13px]";

  return (
    <>
      <div className="overflow-x-auto rounded-2xl" style={{ background: C.surface, border: BORDA }}>
        <table className="w-full min-w-[1080px]">
          <thead>
            <tr style={{ color: C.muted, borderBottom: BORDA }}>
              <th className={th}>Membro</th>
              <th className={th}>Nível</th>
              <th className={`${th} text-right`} title="no período / desde a entrada">Posts</th>
              <th className={`${th} text-right`} title="no período / desde a entrada">Comentários</th>
              <th className={`${th} text-right`} title="dadas no período / desde a entrada">Reações</th>
              <th className={th}>Primeiro acesso</th>
              <th className={th}>Último acesso</th>
              <th className={`${th} text-right`}>Dias c/ acesso</th>
              <th className={th}>Base</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {linhas.slice(0, limite).map((l) => {
              const inativo = l.dias_sem_acesso === null || l.dias_sem_acesso >= diasInativo;
              return (
                <tr key={l.perfil_id} style={{ borderTop: BORDA }}>
                  <td className={`${td} max-w-[260px]`}>
                    {l.slug ? (
                      <Link href={`/especialista/${l.slug}`} target="_blank" className="block truncate font-semibold" style={{ color: C.ink }}>
                        {l.nome || "(sem nome)"}
                      </Link>
                    ) : (
                      <span className="block truncate font-semibold">{l.nome || "(sem nome)"}</span>
                    )}
                    <span className="block truncate text-[12px]" style={{ color: C.muted }}>
                      {l.email}
                    </span>
                    {l.status !== "aprovado" && (
                      <span className="text-[11px] font-semibold uppercase" style={{ color: "#B24A42", letterSpacing: ".06em" }}>
                        {l.status}
                      </span>
                    )}
                  </td>
                  <td className={td}>
                    <TagNivel qualificacao={l.qualificacao} size="sm" />
                  </td>
                  <td className={`${td} text-right`}>
                    <Par periodo={l.posts_periodo} total={l.posts_total} />
                  </td>
                  <td className={`${td} text-right`}>
                    <Par periodo={l.comentarios_periodo} total={l.comentarios_total} />
                  </td>
                  <td className={`${td} text-right`}>
                    <Par periodo={l.reacoes_periodo} total={l.reacoes_total} />
                  </td>
                  <td className={td}>
                    {l.primeiro_acesso ? (
                      <span className="tabular-nums" title={l.primeiro_acesso_estimado ? "Estimado pela atividade antiga (antes do rastreio de acesso)" : undefined}>
                        {data(l.primeiro_acesso)}
                        {l.primeiro_acesso_estimado && <span style={{ color: C.muted }}> *</span>}
                      </span>
                    ) : (
                      <span style={{ color: C.muted }}>{l.tem_conta ? "nunca" : "sem conta"}</span>
                    )}
                  </td>
                  <td className={td}>
                    {l.ultimo_acesso ? (
                      <>
                        <span className="tabular-nums">{data(l.ultimo_acesso)}</span>
                        <span className="block text-[12px] font-semibold" style={{ color: inativo ? "#B24A42" : C.muted }}>
                          {l.dias_sem_acesso === 0 ? "hoje" : `há ${l.dias_sem_acesso} ${l.dias_sem_acesso === 1 ? "dia" : "dias"}`}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: "#B24A42" }}>nunca</span>
                    )}
                  </td>
                  <td className={`${td} text-right tabular-nums`} style={{ fontFamily: F.mono }}>
                    {l.dias_ativos_periodo}
                  </td>
                  <td className={td}>
                    <span className="text-[12px]" style={{ color: l.vinculado_base ? C.ink : C.muted }}>
                      {l.vinculado_base ? "vinculado" : "sem vínculo"}
                    </span>
                  </td>
                  <td className={td}>
                    <button
                      onClick={() =>
                        setMembro({
                          perfil_id: l.perfil_id,
                          slug: l.slug,
                          nome: l.nome,
                          email: l.email,
                          qualificacao: l.qualificacao,
                          status: l.status,
                          vinculado_base: l.vinculado_base,
                          tem_conta: l.tem_conta,
                        })
                      }
                      className="press rounded-full px-3 text-[12px] font-semibold"
                      style={{ height: 30, border: BORDA, color: C.ink }}
                    >
                      Gerenciar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {linhas.length > limite && (
        <div className="mt-3 text-center">
          <button onClick={() => setLimite((n) => n + POR_PAGINA)} className="press rounded-full px-5 text-[14px] font-semibold" style={{ height: 42, border: BORDA, background: C.surface }}>
            Mostrar mais {Math.min(POR_PAGINA, linhas.length - limite)} de {linhas.length - limite}
          </button>
        </div>
      )}

      <GerenciarMembro key={membro?.perfil_id ?? "nenhum"} membro={membro} aberto={membro !== null} onFechar={() => setMembro(null)} />
    </>
  );
}
