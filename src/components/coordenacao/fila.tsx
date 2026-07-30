"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Avatar } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { norm, dataPonto } from "@/lib/utils";
import type { ArtigoComAutor, StatusArtigo } from "@/lib/artigos";

/* Fila da coordenação: abas (em análise / ajustes / publicados), busca e
   contadores. FIFO nas filas de trabalho; publicados = mais recentes primeiro. */

const ABAS: { id: StatusArtigo; rotulo: string }[] = [
  { id: "em_analise", rotulo: "Em análise" },
  { id: "ajustes", rotulo: "Ajustes" },
  { id: "publicado", rotulo: "Publicados" },
];

export function Fila({
  porStatus,
  contagem,
}: {
  porStatus: Record<StatusArtigo, ArtigoComAutor[]>;
  contagem: Record<StatusArtigo, number>;
}) {
  const [aba, setAba] = useState<StatusArtigo>("em_analise");
  const [busca, setBusca] = useState("");

  const lista = useMemo(() => {
    const base = porStatus[aba] ?? [];
    const nq = norm(busca);
    if (!nq) return base;
    return base.filter((a) => norm(`${a.titulo} ${a.autor.nome}`).includes(nq));
  }, [porStatus, aba, busca]);

  return (
    <div>
      {/* abas com contadores */}
      <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
        {ABAS.map((a) => {
          const on = a.id === aba;
          return (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className="shrink-0 rounded-full px-4 text-[14px] font-semibold"
              style={{
                height: 38,
                background: on ? C.laranja : C.surface,
                color: C.ink,
                border: `1px solid ${on ? C.laranja : C.line}`,
              }}
            >
              {a.rotulo}
              <span className="ml-1.5" style={{ color: on ? C.ink : C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
                {contagem[a.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* busca */}
      <div className="relative mb-3">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }}>
          <Ico.busca style={{ width: 17, height: 17 }} />
        </span>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título ou autor"
          className="w-full rounded-xl pl-10 pr-4 text-[15px] outline-none"
          style={{ height: 48, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}
        />
      </div>

      {aba !== "publicado" && lista.length > 0 && (
        <p className="mb-2 text-[12px]" style={{ color: C.muted, fontFamily: F.mono }}>
          mais antigos primeiro
        </p>
      )}

      {lista.length === 0 ? (
        <div className="rounded-2xl p-6 text-center" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <p className="text-[15px]" style={{ color: C.ink }}>
            {busca ? "Nenhum artigo com esse termo." : "Nada nesta fila."}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            {busca ? "Tente pelo nome do autor." : "Quando um membro enviar um artigo, ele aparece aqui."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {lista.map((a) => (
            <li key={a.id}>
              <Link
                href={`/coordenacao/${a.id}`}
                className="flex items-center gap-3 rounded-2xl p-3.5"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <Avatar nome={a.autor.nome} foto={a.autor.avatar_url} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600 }}>
                    {a.titulo || "Sem título"}
                  </span>
                  <span className="block truncate text-[12px]" style={{ color: C.muted }}>
                    {a.autor.nome}
                    {a.autor.cidade && ` · ${a.autor.cidade}`}
                    {a.autor.uf && `/${a.autor.uf}`}
                  </span>
                </span>
                <span className="shrink-0 text-[11px]" style={{ color: C.muted, fontFamily: F.mono }}>
                  {dataPonto(a.enviado_em ?? a.publicado_em ?? a.criado_em)}
                </span>
                <Ico.chevron style={{ width: 18, height: 18, color: C.muted }} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
