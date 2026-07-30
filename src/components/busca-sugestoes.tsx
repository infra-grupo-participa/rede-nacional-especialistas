"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { Placa } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { norm } from "@/lib/utils";
import type { Facetas } from "@/lib/queries";

/* Busca da home com sugestões agrupadas (profissão / cidade). Pessoas ficam na
   página /buscar (server-side). Portado do Sugestoes do MVP. */
export function BuscaComSugestoes({ facetas }: { facetas: Facetas }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const nq = norm(q);
  const aberto = q.trim().length >= 2;

  const profs = useMemo(
    () => (nq ? facetas.profissoes.filter((p) => norm(p.nome).includes(nq)).slice(0, 3) : []),
    [nq, facetas.profissoes],
  );
  const cids = useMemo(
    () => (nq ? facetas.cidades.filter((c) => norm(c.cidade).includes(nq)).slice(0, 3) : []),
    [nq, facetas.cidades],
  );

  const irBusca = (termo: string) => router.push(`/buscar?q=${encodeURIComponent(termo)}`);

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    if (t) irBusca(t);
  };

  return (
    <div className="relative">
      <form onSubmit={submeter} className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.muted }}>
          <Ico.busca style={{ width: 18, height: 18 }} />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, cidade ou profissão"
          className="w-full rounded-2xl pl-11 pr-4 text-[15px] outline-none"
          style={{ height: 52, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}
          aria-label="Buscar especialistas"
        />
      </form>

      {aberto && (
        <div
          className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl"
          style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: "0 12px 32px rgba(17,17,17,.12)" }}
        >
          {profs.length === 0 && cids.length === 0 ? (
            <div className="px-4 py-5 text-center">
              <p className="text-[14px]" style={{ color: C.ink }}>
                Nenhuma sugestão para “{q.trim()}”.
              </p>
              <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                Toque em “Ver todos os resultados” para buscar por nome.
              </p>
            </div>
          ) : (
            <>
              {profs.length > 0 && (
                <Grupo titulo="Profissão">
                  {profs.map((p) => (
                    <ItemSugestao key={p.nome} onClick={() => irBusca(p.nome)} n={p.n}>
                      <Ico.busca style={{ width: 15, height: 15, color: C.muted }} />
                      <span className="truncate">{p.nome}</span>
                    </ItemSugestao>
                  ))}
                </Grupo>
              )}
              {cids.length > 0 && (
                <Grupo titulo="Cidade">
                  {cids.map((c) => (
                    <ItemSugestao key={`${c.cidade}${c.uf}`} onClick={() => irBusca(c.cidade)} n={c.n}>
                      {c.uf && <Placa uf={c.uf} size="sm" />}
                      <span className="truncate">{c.cidade}</span>
                    </ItemSugestao>
                  ))}
                </Grupo>
              )}
            </>
          )}
          <button
            onClick={() => irBusca(q.trim())}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-[14px] font-semibold"
            style={{ background: C.petrolSoft, color: C.petrolDeep }}
          >
            Ver todos os resultados
            <Ico.seta style={{ width: 16, height: 16 }} />
          </button>
        </div>
      )}
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.line}` }}>
      <p className="px-4 pt-3 text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".12em" }}>
        {titulo}
      </p>
      <div className="py-1">{children}</div>
    </div>
  );
}

function ItemSugestao({
  children,
  onClick,
  n,
}: {
  children: React.ReactNode;
  onClick: () => void;
  n: number;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[15px]" style={{ color: C.ink }}>
      {children}
      <span className="ml-auto shrink-0 text-[12px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
        {n}
      </span>
    </button>
  );
}
