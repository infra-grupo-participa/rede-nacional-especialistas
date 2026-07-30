"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { Ico } from "@/components/icons";

/** Copia a URL atual do artigo para a área de transferência. */
export function CopiarLink() {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* área de transferência bloqueada — silencioso */
    }
  };
  return (
    <button
      onClick={copiar}
      className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-semibold"
      style={{ color: C.muted }}
    >
      <Ico.share style={{ width: 15, height: 15 }} />
      {copiado ? "Link copiado" : "Copiar link do artigo"}
    </button>
  );
}
