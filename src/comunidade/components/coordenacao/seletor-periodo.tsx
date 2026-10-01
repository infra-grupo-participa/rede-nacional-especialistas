"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { C, F, BORDA } from "@/lib/tokens";

function somar(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/* Período do relatório (dias civis de São Paulo). Atalhos + datas livres;
   grava em ?inicio=&fim= preservando os outros filtros da URL. */
export function SeletorPeriodo({ inicio, fim, hoje }: { inicio: string; fim: string; hoje: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [ini, setIni] = useState(inicio);
  const [fi, setFi] = useState(fim);

  const ir = (a: string, b: string) => {
    const q = new URLSearchParams(params.toString());
    q.set("inicio", a);
    q.set("fim", b);
    router.push(`${pathname}?${q.toString()}`);
  };

  const atalhos = [
    { rotulo: "7 dias", dias: 7 },
    { rotulo: "30 dias", dias: 30 },
    { rotulo: "90 dias", dias: 90 },
    { rotulo: "12 meses", dias: 365 },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {atalhos.map((a) => {
        const aIni = somar(hoje, -(a.dias - 1));
        const on = inicio === aIni && fim === hoje;
        return (
          <button
            key={a.dias}
            onClick={() => ir(aIni, hoje)}
            className="press rounded-full px-3.5 text-[13px] font-semibold"
            style={{ height: 36, background: on ? C.ink : C.surface, color: on ? C.fundo : C.ink, border: `1px solid ${on ? C.ink : C.line}` }}
          >
            {a.rotulo}
          </button>
        );
      })}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ini && fi) ir(ini <= fi ? ini : fi, ini <= fi ? fi : ini);
        }}
        className="flex items-center gap-1.5"
      >
        <input
          type="date"
          value={ini}
          max={hoje}
          onChange={(e) => setIni(e.target.value)}
          aria-label="Início do período"
          className="rounded-xl px-2 text-[13px] outline-none"
          style={{ height: 36, background: C.surface, border: BORDA, color: C.ink, fontFamily: F.mono }}
        />
        <span className="text-[12px]" style={{ color: C.muted }}>
          a
        </span>
        <input
          type="date"
          value={fi}
          max={hoje}
          onChange={(e) => setFi(e.target.value)}
          aria-label="Fim do período"
          className="rounded-xl px-2 text-[13px] outline-none"
          style={{ height: 36, background: C.surface, border: BORDA, color: C.ink, fontFamily: F.mono }}
        />
        <button type="submit" className="press rounded-full px-3 text-[13px] font-semibold" style={{ height: 36, border: BORDA, color: C.ink }}>
          Aplicar
        </button>
      </form>
    </div>
  );
}
