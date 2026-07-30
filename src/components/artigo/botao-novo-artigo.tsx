"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { criarArtigo } from "@/app/artigos/actions";

export function BotaoNovoArtigo({ full = false }: { full?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const criar = () =>
    start(async () => {
      const r = await criarArtigo();
      if (r.erro) setErro(r.erro);
      else if (r.id) router.push(`/editor/${r.id}`);
    });

  return (
    <div className={full ? "w-full" : ""}>
      <button
        onClick={criar}
        disabled={pending}
        className={`inline-flex items-center justify-center gap-2 rounded-xl text-[15px] font-semibold ${full ? "w-full" : ""}`}
        style={{ height: 52, paddingLeft: 20, paddingRight: 20, background: C.laranja, color: C.ink, opacity: pending ? 0.5 : 1 }}
      >
        <Ico.mais style={{ width: 18, height: 18 }} />
        {pending ? "Criando…" : "Escrever artigo"}
      </button>
      {erro && (
        <p className="mt-2 text-[13px]" style={{ color: "#B24A42" }}>
          {erro}
        </p>
      )}
    </div>
  );
}
