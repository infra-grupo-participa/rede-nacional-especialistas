"use client";

import { useMemo, useState } from "react";
import { C, F, BORDA } from "@/lib/tokens";
import { Chip, Botao } from "@/components/atoms";
import type { ArtigoComAutor } from "@/lib/artigos-tipos";
import { CartaoArtigo } from "@/components/artigo/cartoes";

/* Painel de artigos do desktop — grade de 3 colunas, chips centralizados, sem
   rolagem lateral. Cópia fiel do MVP (App.jsx 1030). */

const PASSO = 9;

export function PainelArtigosDesktop({ artigos }: { artigos: ArtigoComAutor[] }) {
  const [editoria, setEditoria] = useState("Todas");
  const [mostrar, setMostrar] = useState(PASSO);

  const editorias = useMemo(() => {
    const cont: Record<string, number> = {};
    for (const a of artigos) {
      const k = a.autor.profissao || "Outros";
      cont[k] = (cont[k] ?? 0) + 1;
    }
    return ["Todas", ...Object.keys(cont).sort((x, y) => cont[y] - cont[x])];
  }, [artigos]);

  const lista = useMemo(
    () => artigos.filter((a) => editoria === "Todas" || (a.autor.profissao || "Outros") === editoria),
    [artigos, editoria],
  );

  const visiveis = lista.slice(0, mostrar);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
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
        <div className="mt-8 rounded-2xl px-5 py-14 text-center" style={{ background: C.surface, border: BORDA }}>
          <p className="text-[16px]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            Nenhum artigo nesta editoria.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-5" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {visiveis.map((a) => (
              <CartaoArtigo key={a.id} a={a} />
            ))}
          </div>
          {lista.length > mostrar && (
            <div className="mt-6 flex justify-center">
              <Botao variante="secundario" onClick={() => setMostrar((n) => n + PASSO)}>
                Ver mais artigos ({lista.length - mostrar} restantes)
              </Botao>
            </div>
          )}
        </>
      )}
    </div>
  );
}
