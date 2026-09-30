"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Botao } from "@/components/atoms";
import { enviarPedido } from "./actions";

/* Questionário de entrada (as perguntas vêm da config da comunidade) + aceite
   das regras. Equivale às 3 perguntas obrigatórias do grupo do Facebook. */
export function FormPedido({
  perguntas,
  regras,
  respostasIniciais = [],
  onCancelar,
}: {
  perguntas: string[];
  regras: string[];
  respostasIniciais?: string[];
  onCancelar?: () => void;
}) {
  const router = useRouter();
  const [respostas, setRespostas] = useState<string[]>(() => perguntas.map((_, i) => respostasIniciais[i] ?? ""));
  const [aceitou, setAceitou] = useState(false);
  const [verRegras, setVerRegras] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const completo = respostas.every((r) => r.trim().length >= 2) && aceitou;

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    start(async () => {
      const r = await enviarPedido(respostas, aceitou);
      if (r.erro) setErro(r.erro);
      else router.refresh();
    });
  };

  return (
    <form onSubmit={enviar} className="text-left">
      {perguntas.map((p, i) => (
        <label key={i} className="block pt-4">
          <span className="mb-1.5 block text-[14px] font-semibold leading-snug" style={{ color: C.ink }}>
            {i + 1}. {p}
          </span>
          <textarea
            value={respostas[i]}
            onChange={(e) => setRespostas((rs) => rs.map((r, j) => (j === i ? e.target.value : r)))}
            rows={2}
            maxLength={1000}
            required
            className="w-full resize-none rounded-2xl px-4 py-3 text-[15px] outline-none"
            style={{ background: C.paper, border: BORDA, color: C.ink }}
          />
        </label>
      ))}

      <div className="mt-5 rounded-2xl p-4" style={{ background: C.paper, border: BORDA }}>
        <button type="button" onClick={() => setVerRegras((v) => !v)} className="text-[14px] font-semibold" style={{ color: C.petrolDeep }}>
          {verRegras ? "Esconder as regras" : "Ler as regras da comunidade"}
        </button>
        {verRegras && (
          <ol className="mt-3 space-y-1.5 text-[14px] leading-relaxed" style={{ color: C.ink }}>
            {regras.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ol>
        )}
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[14px]" style={{ color: C.ink }}>
          <input
            type="checkbox"
            checked={aceitou}
            onChange={(e) => setAceitou(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0"
            style={{ accentColor: "#141210" }}
          />
          <span>
            Li e aceito as{" "}
            <Link href="/regras" target="_blank" className="font-semibold" style={{ color: C.petrolDeep }}>
              regras da comunidade
            </Link>
            .
          </span>
        </label>
      </div>

      {erro && (
        <p className="mt-3 text-[13px]" style={{ color: "#B4342A" }} role="alert">
          {erro}
        </p>
      )}

      <div className="mt-5 space-y-2">
        <Botao full type="submit" disabled={pending || !completo}>
          {pending ? "Enviando…" : "Enviar para a coordenação"}
        </Botao>
        {onCancelar && (
          <Botao full variante="fantasma" onClick={onCancelar}>
            Cancelar
          </Botao>
        )}
      </div>
      <p className="mt-3 text-center text-[12px]" style={{ color: C.muted, fontFamily: F.sans }}>
        Suas respostas só são vistas pela coordenação do Time Holding Brasil.
      </p>
    </form>
  );
}
