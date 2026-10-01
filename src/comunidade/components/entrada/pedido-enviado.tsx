"use client";

import { useState } from "react";
import { C, BORDA } from "@/lib/tokens";
import { FormPedido } from "./form-pedido";

/* Pedido já enviado: mostra as respostas e deixa corrigir enquanto pendente. */
export function PedidoEnviado({
  respostas,
  perguntas,
  regras,
}: {
  respostas: { pergunta: string; resposta: string }[];
  perguntas: string[];
  regras: string[];
}) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <FormPedido
        perguntas={perguntas}
        regras={regras}
        respostasIniciais={respostas.map((r) => r.resposta)}
        onCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="text-left">
      <ul className="mt-4 space-y-3">
        {respostas.map((r, i) => (
          <li key={i} className="rounded-2xl p-3.5" style={{ background: C.paper, border: BORDA }}>
            <p className="text-[13px] font-semibold" style={{ color: C.muted }}>
              {r.pergunta}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[15px]" style={{ color: C.ink }}>
              {r.resposta}
            </p>
          </li>
        ))}
      </ul>
      <button onClick={() => setEditando(true)} className="mt-3 text-[14px] font-semibold" style={{ color: C.petrolDeep }}>
        Corrigir minhas respostas
      </button>
    </div>
  );
}
