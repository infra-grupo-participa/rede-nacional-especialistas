"use client";

import { useState } from "react";
import { C, F } from "@/lib/tokens";

/* Logo da rede. Usa /logo.svg; se falhar, cai para o texto "Rede Nacional". */
export function Logo({ altura = 24 }: { altura?: number }) {
  const [quebrou, setQuebrou] = useState(false);
  if (quebrou) {
    return (
      <span style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 18, color: C.ink }}>
        Rede Nacional
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt="Rede Nacional de Especialistas"
      onError={() => setQuebrou(true)}
      style={{ height: altura, width: "auto", display: "block" }}
    />
  );
}
