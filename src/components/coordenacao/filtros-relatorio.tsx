"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { C, BORDA } from "@/lib/tokens";
import { NIVEIS_ORDENADOS } from "@/lib/qualificacoes";
import type { FiltrosRelatorio } from "@/lib/gestao";

/* Filtros do relatório por membro. Tudo mora na URL (dá para mandar o link do
   recorte para o time de sucesso do aluno, e a exportação usa os mesmos). */
export function FiltrosRelatorioBarra({ filtros }: { filtros: FiltrosRelatorio }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [busca, setBusca] = useState(filtros.busca);

  const setar = (mudancas: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(mudancas)) {
      if (v === null || v === "") q.delete(k);
      else q.set(k, v);
    }
    router.push(`${pathname}?${q.toString()}`, { scroll: false });
  };

  // busca com atraso curto (não recarrega a cada tecla)
  useEffect(() => {
    if (busca === filtros.busca) return;
    const t = setTimeout(() => setar({ q: busca || null }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const sel = "rounded-xl px-2.5 text-[13px] outline-none";
  const estilo = { height: 38, background: C.surface, border: BORDA, color: C.ink } as const;
  const chip = (on: boolean) =>
    ({
      height: 34,
      background: on ? C.ink : C.surface,
      color: on ? C.fundo : C.ink,
      border: `1px solid ${on ? C.ink : C.line}`,
    }) as const;

  const inativoDias = [15, 30, 60, 90];

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold uppercase" style={{ color: C.muted, letterSpacing: ".1em" }}>
          Situação
        </span>
        <button onClick={() => setar({ situacao: null })} className="press rounded-full px-3 text-[13px] font-semibold" style={chip(filtros.situacao === "todos")}>
          Todos
        </button>
        <button onClick={() => setar({ situacao: "ativos" })} className="press rounded-full px-3 text-[13px] font-semibold" style={chip(filtros.situacao === "ativos")}>
          Ativos
        </button>
        {inativoDias.map((d) => (
          <button
            key={d}
            onClick={() => setar({ situacao: "inativos", dias: String(d) })}
            className="press rounded-full px-3 text-[13px] font-semibold"
            style={chip(filtros.situacao === "inativos" && filtros.diasInativo === d)}
          >
            Sem acesso há {d}+ dias
          </button>
        ))}
        <button onClick={() => setar({ situacao: "nunca" })} className="press rounded-full px-3 text-[13px] font-semibold" style={chip(filtros.situacao === "nunca")}>
          Nunca acessou
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar nome, e-mail, cidade ou telefone"
          className="min-w-[220px] flex-1 rounded-xl px-3 text-[14px] outline-none"
          style={estilo}
        />
        <select value={filtros.nivel} onChange={(e) => setar({ nivel: e.target.value === "todos" ? null : e.target.value })} className={sel} style={estilo} aria-label="Nível">
          <option value="todos">Todos os níveis</option>
          {[...NIVEIS_ORDENADOS].reverse().map((n) => (
            <option key={n.key} value={n.key}>
              {n.rotulo}
            </option>
          ))}
        </select>
        <select value={filtros.status} onChange={(e) => setar({ status: e.target.value === "aprovado" ? null : e.target.value })} className={sel} style={estilo} aria-label="Status do cadastro">
          <option value="aprovado">Aprovados</option>
          <option value="pendente">Pendentes</option>
          <option value="suspenso">Suspensos</option>
          <option value="recusado">Recusados</option>
          <option value="todos">Todos os status</option>
        </select>
        <select value={filtros.base} onChange={(e) => setar({ base: e.target.value === "todos" ? null : e.target.value })} className={sel} style={estilo} aria-label="Vínculo com a base">
          <option value="todos">Com e sem vínculo à base</option>
          <option value="sim">Vinculados à base de alunos</option>
          <option value="nao">Sem vínculo com a base</option>
        </select>
        <select value={filtros.ordem} onChange={(e) => setar({ ordem: e.target.value === "nome" ? null : e.target.value })} className={sel} style={estilo} aria-label="Ordenar por">
          <option value="nome">Ordem: nome</option>
          <option value="ultimo_acesso">Ordem: último acesso</option>
          <option value="dias_ativos">Ordem: dias com acesso</option>
          <option value="posts">Ordem: posts no período</option>
          <option value="comentarios">Ordem: comentários no período</option>
          <option value="reacoes">Ordem: reações no período</option>
        </select>
      </div>
    </div>
  );
}
