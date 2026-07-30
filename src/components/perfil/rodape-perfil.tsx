"use client";

import { useState } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { BORDA } from "@/lib/tokens";
import { mesAno } from "@/lib/utils";

/* Rodapé do perfil — fiel ao MVP (App.jsx 1782-1802): confirmação + "É você?
   Atualize seus dados" + (se meu) "Meus artigos" + "Copiar e-mail". */
export function RodapePerfil({
  email,
  atualizadoEm,
  ehMeuPerfil,
}: {
  email: string | null;
  atualizadoEm: string;
  ehMeuPerfil: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* silencioso */
    }
  };

  return (
    <div className="px-4 pb-8 pt-3">
      <div className="rounded-2xl p-4" style={{ background: C.surface, border: BORDA }}>
        <p className="text-[13px]" style={{ color: C.muted }}>
          {ehMeuPerfil ? (
            "Este é o seu perfil. Você está conectado."
          ) : (
            <>
              Dados confirmados pelo próprio profissional em{" "}
              <span style={{ fontFamily: F.mono, fontVariantNumeric: "tabular-nums", color: C.ink }}>
                {mesAno(atualizadoEm)}
              </span>
              .
            </>
          )}
        </p>
        <Link href="/conta" className="mt-2 flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: C.ink }}>
          <Ico.lapis style={{ width: 14, height: 14 }} />
          {ehMeuPerfil ? "Atualizar meus dados" : "É você? Atualize seus dados"}
        </Link>
        {ehMeuPerfil && (
          <Link href="/meus-artigos" className="mt-2 flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: C.ink }}>
            <Ico.doc style={{ width: 14, height: 14 }} /> Meus artigos
          </Link>
        )}
      </div>
      {email && (
        <button onClick={copiar} className="mt-4 w-full text-center text-[13px]" style={{ color: C.sobreFundo }}>
          {copiado ? "E-mail copiado" : "Copiar e-mail"}
        </button>
      )}
    </div>
  );
}
