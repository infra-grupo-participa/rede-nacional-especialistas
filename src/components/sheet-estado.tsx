"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Botao, Eyebrow } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { Sheet } from "@/components/sheet";
import { profissoesDaUf, type ProfissaoUf } from "@/app/estado/actions";
import { ESTADO_POR_UF } from "@/lib/estados";

/* Folha do estado ao tocar no mapa — usa o Sheet base (mobile folha / desktop
   diálogo). Conteúdo fiel ao MVP (App.jsx 1244): contagem + "Ver todos" +
   profissões daquele estado. */
export function SheetEstado({ uf, onFechar }: { uf: string | null; onFechar: () => void }) {
  const router = useRouter();
  const [dados, setDados] = useState<{ total: number; profissoes: ProfissaoUf[] } | null>(null);

  useEffect(() => {
    if (!uf) return;
    let ativo = true;
    profissoesDaUf(uf).then((d) => {
      if (ativo) setDados(d);
    });
    return () => {
      ativo = false;
    };
  }, [uf]);

  if (!uf) return null;
  const nome = ESTADO_POR_UF[uf]?.nome ?? uf;
  const total = dados?.total ?? 0;

  const irTodos = () => router.push(`/estado/${uf}`);
  const irProfissao = (p: string) => router.push(`/estado/${uf}?prof=${encodeURIComponent(p)}`);

  return (
    <Sheet aberto={!!uf} onFechar={onFechar} titulo={nome} alto>
      <p className="pb-3 pt-1 text-[13px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
        {dados ? `${total} ${total === 1 ? "profissional na rede" : "profissionais na rede"}` : "carregando…"}
      </p>

      <Botao full onClick={irTodos}>
        {total > 0 ? `Ver todos os ${total}` : "Ver o estado"}
      </Botao>

      {dados && dados.profissoes.length > 0 && (
        <>
          <Eyebrow className="pb-2 pt-6">Por profissão</Eyebrow>
          <div className="grid grid-cols-2 gap-2.5">
            {dados.profissoes.map((p) => {
              const adv = p.nome.toLowerCase().includes("advog");
              return (
                <button
                  key={p.nome}
                  onClick={() => irProfissao(p.nome)}
                  className="card-hover flex flex-col items-start gap-2 rounded-2xl p-3.5 text-left"
                  style={{ background: C.surface, border: BORDA, minHeight: 96 }}
                >
                  <span
                    className="flex items-center justify-center rounded-xl"
                    style={{ width: 38, height: 38, background: C.petrolSoft, color: C.petrolDeep }}
                  >
                    {adv ? <Ico.escudo style={{ width: 20, height: 20 }} /> : <Ico.doc style={{ width: 20, height: 20 }} />}
                  </span>
                  <span className="text-[15px] font-semibold" style={{ color: C.ink }}>
                    {p.nome}
                  </span>
                  <span className="text-[12px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
                    {p.n} {p.n === 1 ? "profissional" : "profissionais"}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Sheet>
  );
}
