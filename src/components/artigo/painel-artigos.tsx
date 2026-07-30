"use client";

import { useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { Chip } from "@/components/atoms";
import { norm } from "@/lib/utils";
import type { ArtigoComAutor } from "@/lib/artigos";
import { CartaoDestaque, LinhaEditorial, BlocoMaisLidos } from "@/components/artigo/cartoes";

/* Painel de artigos (mobile / coluna única). Editorias derivadas da profissão do
   autor, ordenadas por contagem. Destaque + linhas paginadas + mais lidos. */

const PASSO = 8;

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
      <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
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
        <div className="rounded-2xl p-6 text-center" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <p className="text-[15px]" style={{ color: C.ink }}>
            Nenhum artigo encontrado.
          </p>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            Tente pelo nome do autor ou troque a editoria.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <CartaoDestaque a={destaque} />
          {visiveis.map((a) => (
            <LinhaEditorial key={a.id} a={a} />
          ))}
          {restantes > 0 && (
            <button
              onClick={() => setMostrar((m) => m + PASSO)}
              className="w-full rounded-xl py-3 text-[14px] font-semibold"
              style={{ background: C.petrolSoft, color: C.petrolDeep }}
            >
              + artigos ({restantes} {restantes === 1 ? "restante" : "restantes"})
            </button>
          )}
        </div>
      )}

      <BlocoMaisLidos artigos={artigos} />
    </div>
  );
}
