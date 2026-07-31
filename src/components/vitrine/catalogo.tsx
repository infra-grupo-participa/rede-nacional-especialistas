"use client";

import { useMemo, useState } from "react";
import { C, F, BORDA } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { nomeEstado } from "@/lib/estados";
import { rotuloProfissao } from "@/lib/profissoes-permitidas";
import { norm } from "@/lib/utils";
import { CardEspecialista } from "@/components/vitrine/card-especialista";
import type { EspecialistaCatalogo } from "@/lib/queries";

type FiltroProf = "todos" | "Advogado" | "Contador";

export function Catalogo({ especialistas }: { especialistas: EspecialistaCatalogo[] }) {
  const [busca, setBusca] = useState("");
  const [uf, setUf] = useState<string>("");
  const [prof, setProf] = useState<FiltroProf>("todos");

  // UFs presentes + contagem, para o seletor de região.
  const ufs = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of especialistas) if (e.uf) c[e.uf] = (c[e.uf] || 0) + 1;
    return Object.entries(c)
      .map(([uf, n]) => ({ uf, n, nome: nomeEstado(uf) }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  }, [especialistas]);

  const filtrados = useMemo(() => {
    const t = norm(busca);
    return especialistas.filter((e) => {
      if (uf && e.uf !== uf) return false;
      if (prof === "Advogado" && rotuloProfissao(e.profissao) !== "Advogado") return false;
      if (prof === "Contador" && rotuloProfissao(e.profissao) !== "Contador") return false;
      if (t) {
        const alvo = norm(`${e.nome} ${e.cidade} ${e.profissao} ${e.headline ?? ""} ${(e.especialidades ?? []).join(" ")}`);
        if (!alvo.includes(t)) return false;
      }
      return true;
    });
  }, [especialistas, busca, uf, prof]);

  const profs: { id: FiltroProf; rotulo: string }[] = [
    { id: "todos", rotulo: "Todos" },
    { id: "Advogado", rotulo: "Advogados" },
    { id: "Contador", rotulo: "Contadores" },
  ];

  return (
    <div>
      {/* controles */}
      <div className="sticky top-[57px] z-10 -mx-4 mb-4 px-4 py-3" style={{ background: "var(--fundo-blur)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}` }}>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* busca */}
          <label className="flex flex-1 items-center gap-2 rounded-xl px-3" style={{ height: 46, background: C.surface, border: BORDA }}>
            <Ico.busca style={{ width: 17, height: 17, color: C.muted }} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, cidade ou especialidade"
              className="w-full bg-transparent text-[14px] outline-none"
              style={{ color: C.ink }}
            />
            {busca && (
              <button onClick={() => setBusca("")} aria-label="Limpar" className="press">
                <Ico.x style={{ width: 16, height: 16, color: C.muted }} />
              </button>
            )}
          </label>

          {/* UF */}
          <select
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            className="rounded-xl px-3 text-[14px] outline-none"
            style={{ height: 46, background: C.surface, border: BORDA, color: C.ink, minWidth: 170 }}
          >
            <option value="">Todos os estados</option>
            {ufs.map((e) => (
              <option key={e.uf} value={e.uf}>
                {e.nome} ({e.n})
              </option>
            ))}
          </select>
        </div>

        {/* profissão */}
        <div className="mt-2.5 flex gap-1 rounded-xl p-1" style={{ background: C.paper, border: BORDA, width: "fit-content" }}>
          {profs.map((p) => {
            const ativo = prof === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setProf(p.id)}
                className="press rounded-lg px-3.5 py-1.5 text-[13px] font-semibold"
                style={{
                  background: ativo ? C.surface : "transparent",
                  color: ativo ? C.ink : C.muted,
                  border: ativo ? BORDA : "1px solid transparent",
                }}
              >
                {p.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      {/* contagem */}
      <p className="mb-3 px-1 text-[13px]" style={{ color: C.muted, fontFamily: F.mono }}>
        {filtrados.length} {filtrados.length === 1 ? "especialista" : "especialistas"}
        {uf && ` em ${nomeEstado(uf)}`}
      </p>

      {/* grade */}
      {filtrados.length === 0 ? (
        <div className="rounded-2xl px-4 py-12 text-center" style={{ background: C.surface, border: BORDA }}>
          <p className="text-[14px]" style={{ color: C.muted }}>
            Nenhum especialista encontrado com esses filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((m) => (
            <CardEspecialista key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}
