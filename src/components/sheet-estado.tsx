"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { Botao, Eyebrow } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { profissoesDaUf, type ProfissaoUf } from "@/app/estado/actions";
import { ESTADO_POR_UF } from "@/lib/estados";

/* Folha que abre ao tocar num estado do mapa: contagem + lista de profissões
   daquele estado, com atalho "Ver todos" e filtro por profissão. Portado do MVP. */
export function SheetEstado({ uf, onFechar }: { uf: string | null; onFechar: () => void }) {
  const router = useRouter();
  const [dados, setDados] = useState<{ total: number; profissoes: ProfissaoUf[] } | null>(null);

  // Busca as profissões quando a folha abre. O componente é remontado por key={uf}
  // na Vitrine, então o estado já nasce limpo a cada estado — sem reset síncrono.
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

  const carregando = dados === null;

  // fecha no Escape
  useEffect(() => {
    if (!uf) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [uf, onFechar]);

  if (!uf) return null;
  const info = ESTADO_POR_UF[uf];
  const nome = info?.nome ?? uf;
  const total = dados?.total ?? 0;

  const irTodos = () => router.push(`/estado/${uf}`);
  const irProfissao = (p: string) => router.push(`/estado/${uf}?prof=${encodeURIComponent(p)}`);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center anim-fade" style={{ background: "rgba(17,17,17,.45)" }} onClick={onFechar}>
      <div
        className="anim-sheet w-full max-w-lg rounded-t-3xl"
        style={{ background: C.fundo, maxHeight: "88%", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-2 px-5 pt-4">
          <h2 className="min-w-0 flex-1 text-[19px]" style={{ fontFamily: F.serif, fontWeight: 600 }}>
            {nome}
          </h2>
          <button onClick={onFechar} aria-label="Fechar" className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, color: C.ink }}>
            <Ico.x style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="px-5 pb-6 pt-2">
          <p className="text-[13px]" style={{ color: C.muted, fontFamily: F.mono }}>
            {carregando
              ? "carregando…"
              : `${total} ${total === 1 ? "profissional" : "profissionais"} na rede`}
          </p>

          <div className="mt-3">
            <Botao full onClick={irTodos}>
              {total > 0 ? `Ver todos os ${total}` : "Ver o estado"}
            </Botao>
          </div>

          {dados && dados.profissoes.length > 0 && (
            <div className="mt-5">
              <Eyebrow className="pb-1">Por profissão</Eyebrow>
              <ul>
                {dados.profissoes.map((p) => (
                  <li key={p.nome}>
                    <button
                      onClick={() => irProfissao(p.nome)}
                      className="flex w-full items-center gap-2 text-left"
                      style={{ minHeight: 58, borderBottom: `1px solid ${C.line}` }}
                    >
                      <span className="min-w-0 flex-1 truncate text-[15px]" style={{ color: C.ink }}>
                        {p.nome}
                      </span>
                      <span className="shrink-0 text-[13px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
                        {p.n}
                      </span>
                      <Ico.chevron style={{ width: 16, height: 16, color: C.muted }} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
