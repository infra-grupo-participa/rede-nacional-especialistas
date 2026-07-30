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
          <Eyebrow className="pb-1 pt-6">Por profissão</Eyebrow>
          <div style={{ borderTop: BORDA }}>
            {dados.profissoes.map((p) => (
              <button
                key={p.nome}
                onClick={() => irProfissao(p.nome)}
                className="flex w-full items-center gap-3 text-left"
                style={{ minHeight: 58, borderBottom: BORDA }}
              >
                <span className="min-w-0 flex-1 truncate text-[16px]" style={{ color: C.ink }}>
                  {p.nome}
                </span>
                <span className="shrink-0 text-[13px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
                  {p.n}
                </span>
                <Ico.chevron style={{ width: 16, height: 16, color: C.muted, flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}
