"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/lib/tokens";
import { Ico } from "@/components/icons";

export function BuscaInput({ inicial }: { inicial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(inicial);

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    router.push(t ? `/buscar?q=${encodeURIComponent(t)}` : "/buscar");
  };

  return (
    <form onSubmit={submeter} className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }}>
        <Ico.busca style={{ width: 17, height: 17 }} />
      </span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nome, cidade ou profissão"
        autoFocus
        className="w-full rounded-2xl pl-10 pr-4 text-[15px] outline-none"
        style={{ height: 44, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}
        aria-label="Buscar especialistas"
      />
    </form>
  );
}
