"use client";

import { useMemo, useState } from "react";
import { C, F } from "@/lib/tokens";
import { Chip } from "@/components/atoms";
import { norm } from "@/lib/utils";
import type { ArtigoComAutor } from "@/lib/artigos-tipos";
import { CartaoDestaque, CartaoArtigo, LinhaEditorial, BlocoMaisLidos } from "@/components/artigo/cartoes";

/* Painel editorial de artigos — responsivo: hero de destaque + grade de 3 colunas
   no desktop (2 no tablet) / linhas no mobile, filtro por editoria, mais lidos.
   Editorias derivadas da profissão do autor. */

const PASSO = 9;

export function PainelArtigos({
  artigos,
  busca = "",
}: {
  artigos: ArtigoComAutor[];
  busca?: string;
}) {
  const [editoria, setEditoria] = useState<string>("Todas");
  const [mostrar, setMostrar] = useState(PASSO);

  const editorias = useMemo(() => {
    const cont: Record<string, number> = {};
    for (const a of artigos) {
      const key = a.autor.profissao || "Outros";
      cont[key] = (cont[key] ?? 0) + 1;
    }
    const ordenadas = Object.entries(cont)
      .sort((x, y) => y[1] - x[1])
      .map(([k]) => k);
    return ["Todas", ...ordenadas];
  }, [artigos]);

  const lista = useMemo(() => {
    const nq = norm(busca);
    return artigos.filter((a) => {
      if (editoria !== "Todas" && (a.autor.profissao || "Outros") !== editoria) return false;
      if (nq) {
        const alvo = norm(`${a.titulo} ${a.resumo} ${a.chapeu} ${a.autor.nome}`);
        if (!alvo.includes(nq)) return false;
      }
      return true;
    });
  }, [artigos, editoria, busca]);

  const [destaque, ...resto] = lista;
  const visiveis = resto.slice(0, mostrar);
  const restantes = resto.length - visiveis.length;

  return (
    <div>
      {/* chips de editoria */}
      <div className="flex gap-2 overflow-x-auto pb-4 md:flex-wrap md:justify-center" style={{ scrollbarWidth: "none" }}>
        {editorias.map((e) => (
          <Chip
            key={e}
            ativo={editoria === e}
            onClick={() => {
              setEditoria(e);
              setMostrar(PASSO);
            }}
          >
            {e}
          </Chip>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <p className="text-[16px]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600 }}>
            Nenhum artigo encontrado.
          </p>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            Tente pelo nome do autor ou troque a editoria.
          </p>
        </div>
      ) : (
        <>
          {/* HERO de destaque — o mais recente, grande */}
          <div className="mx-auto max-w-2xl">
            <CartaoDestaque a={destaque} />
          </div>

          {resto.length > 0 && (
            <>
              {/* GRADE no desktop, LINHAS no mobile */}
              <div className="mt-4 hidden gap-5 md:grid md:grid-cols-2 lg:grid-cols-3">
                {visiveis.map((a) => (
                  <CartaoArtigo key={a.id} a={a} />
                ))}
              </div>
              <div className="mt-3 space-y-3 md:hidden">
                {visiveis.map((a) => (
                  <LinhaEditorial key={a.id} a={a} />
                ))}
              </div>

              {restantes > 0 && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setMostrar((m) => m + PASSO)}
                    className="press rounded-full px-6 py-3 text-[14px] font-semibold"
                    style={{ background: C.petrolSoft, color: C.petrolDeep }}
                  >
                    Ver mais artigos ({restantes} {restantes === 1 ? "restante" : "restantes"})
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      <div className="mx-auto mt-8 max-w-2xl">
        <BlocoMaisLidos artigos={artigos} />
      </div>
    </div>
  );
}
