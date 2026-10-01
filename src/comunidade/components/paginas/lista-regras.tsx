"use client";

import { useId, useState } from "react";
import { IcoRC } from "@/comunidade/components/icones";
import type { Regra } from "@/comunidade/lib/regras";

/* Lista numerada das regras, que abre e fecha como no grupo do Facebook:
   número, título em negrito e a seta; aberta, mostra a explicação. Todas
   começam abertas. Regra sem explicação não tem seta nem clique. */
export function ListaRegras({ regras }: { regras: Regra[] }) {
  const base = useId();
  const [fechadas, setFechadas] = useState<ReadonlySet<number>>(() => new Set());

  const alternar = (i: number) =>
    setFechadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(i)) nova.delete(i);
      else nova.add(i);
      return nova;
    });

  return (
    <ol className="rc-pg-regras">
      {regras.map((r, i) => {
        const aberta = !fechadas.has(i);
        const idDesc = `${base}-regra-${i}`;
        const miolo = (
          <>
            <span className="rc-pg-regra-n">{i + 1}</span>
            <span className="rc-pg-regra-titulo">{r.titulo}</span>
          </>
        );
        return (
          <li key={i}>
            {r.descricao ? (
              <>
                <button type="button" className="rc-pg-regra-topo" aria-expanded={aberta} aria-controls={idDesc} onClick={() => alternar(i)}>
                  {miolo}
                  {aberta ? <IcoRC.chevronCima /> : <IcoRC.chevronBaixo />}
                </button>
                <p id={idDesc} className="rc-pg-regra-desc" hidden={!aberta}>
                  {r.descricao}
                </p>
              </>
            ) : (
              <div className="rc-pg-regra-topo">{miolo}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
