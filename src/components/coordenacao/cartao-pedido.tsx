"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { TagNivel } from "@/components/atoms";
import { NIVEIS_ORDENADOS, type Qualificacao } from "@/lib/qualificacoes";
import { dataPonto, tempoRelativo } from "@/lib/utils";
import { decidirPedido, sincronizarBase, alterarMembro } from "@/app/coordenacao/actions";
import type { PedidoEntrada } from "@/lib/gestao";
import { CandidatosBase } from "./candidatos-base";

/* Um pedido de entrada: respostas do questionário, dados do cadastro, o
   cruzamento com a base de alunos e a decisão (com o nível já escolhido). */
export function CartaoPedido({ pedido }: { pedido: PedidoEntrada }) {
  const router = useRouter();
  const [nivel, setNivel] = useState<Qualificacao>(pedido.perfil.qualificacao);
  const [motivo, setMotivo] = useState("");
  const [recusando, setRecusando] = useState(false);
  const [base, setBase] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const p = pedido.perfil;

  const decidir = (aprovar: boolean) =>
    start(async () => {
      const r = await decidirPedido(pedido.id, aprovar, motivo, aprovar ? nivel : null);
      if (r.erro) setErro(r.erro);
      else router.refresh();
    });

  return (
    <li className="rounded-2xl p-4" style={{ background: C.surface, border: BORDA }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
            {p.nome}
          </p>
          <p className="text-[13px]" style={{ color: C.muted, fontFamily: F.mono }}>
            {[p.email, p.whatsapp].filter(Boolean).join(" · ")}
          </p>
          <p className="text-[13px]" style={{ color: C.muted }}>
            {[p.profissao, [p.cidade, p.uf].filter(Boolean).join("/")].filter(Boolean).join(" · ") || "Perfil ainda sem profissão e cidade"}
          </p>
        </div>
        <span className="shrink-0 text-[12px]" style={{ color: C.muted }} title={dataPonto(pedido.criado_em)}>
          enviado {tempoRelativo(pedido.criado_em)}
        </span>
      </div>

      <ol className="mt-3 space-y-2">
        {pedido.respostas.map((r, i) => (
          <li key={i} className="rounded-xl p-3" style={{ background: C.paper }}>
            <p className="text-[12px] font-semibold" style={{ color: C.muted }}>
              {r.pergunta}
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-[14px]">{r.resposta}</p>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[12px]" style={{ color: C.muted }}>
        {pedido.aceitou_regras ? "Aceitou as regras da comunidade." : "Não aceitou as regras."}
      </p>

      <div className="mt-3">
        <button onClick={() => setBase((v) => !v)} className="text-[13px] font-semibold" style={{ color: C.petrolDeep }}>
          {base ? "Esconder a base de alunos" : "Procurar na base de alunos (e-mail ou telefone da compra)"}
        </button>
        {base && (
          <div className="mt-2">
            <CandidatosBase perfilId={p.id} />
          </div>
        )}
      </div>

      {recusando ? (
        <div className="mt-4">
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            placeholder="Motivo (fica no registro; ex.: não encontrado na base de alunos)"
            className="w-full resize-none rounded-xl px-3 py-2 text-[14px] outline-none"
            style={{ background: C.paper, border: BORDA, color: C.ink }}
          />
          <div className="mt-2 flex gap-2">
            <button onClick={() => decidir(false)} disabled={pending} className="press rounded-full px-4 text-[14px] font-semibold" style={{ height: 40, background: "#B24A42", color: "#fff" }}>
              Confirmar recusa
            </button>
            <button onClick={() => setRecusando(false)} className="press rounded-full px-4 text-[14px] font-semibold" style={{ height: 40, border: BORDA }}>
              Voltar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            Nível
            <select value={nivel} onChange={(e) => setNivel(e.target.value as Qualificacao)} className="rounded-xl px-2 text-[14px] outline-none" style={{ height: 40, background: C.paper, border: BORDA, color: C.ink }}>
              {NIVEIS_ORDENADOS.map((n) => (
                <option key={n.key} value={n.key}>
                  {n.rotulo}
                </option>
              ))}
            </select>
            <TagNivel qualificacao={nivel} size="sm" />
          </label>
          <button onClick={() => decidir(true)} disabled={pending} className="press ml-auto rounded-full px-5 text-[14px] font-semibold" style={{ height: 40, background: C.laranja, color: C.ink }}>
            Aprovar entrada
          </button>
          <button onClick={() => setRecusando(true)} disabled={pending} className="press rounded-full px-4 text-[14px] font-semibold" style={{ height: 40, border: "1px solid #B24A42", color: "#B24A42" }}>
            Recusar
          </button>
        </div>
      )}
      {erro && (
        <p className="mt-2 text-[13px]" style={{ color: "#B24A42" }}>
          {erro}
        </p>
      )}
    </li>
  );
}

/** Pendente que ainda não respondeu: a coordenação pode liberar direto (ex.: equipe). */
export function LinhaPendenteSemPedido({ perfil }: { perfil: PedidoEntrada["perfil"] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const liberar = () => {
    if (!confirm(`Liberar ${perfil.nome} sem o questionário de entrada?`)) return;
    start(async () => {
      const r = await alterarMembro(perfil.id, { status: "aprovado" });
      if (r.erro) setErro(r.erro);
      else router.refresh();
    });
  };
  return (
    <li className="flex flex-wrap items-center gap-2 py-2.5" style={{ borderTop: BORDA }}>
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold">{perfil.nome}</span>
        <span className="block truncate text-[12px]" style={{ color: C.muted, fontFamily: F.mono }}>
          {perfil.email} · cadastro {tempoRelativo(perfil.criado_em)}
        </span>
      </span>
      <button onClick={liberar} disabled={pending} className="press ml-auto rounded-full px-3 text-[13px] font-semibold" style={{ height: 34, border: BORDA }}>
        Liberar sem questionário
      </button>
      {erro && <span className="w-full text-[12px]" style={{ color: "#B24A42" }}>{erro}</span>}
    </li>
  );
}

export function BotaoSincronizar() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() =>
          start(async () => {
            const r = await sincronizarBase();
            setMsg(r.erro ?? r.mensagem ?? null);
            router.refresh();
          })
        }
        disabled={pending}
        className="press rounded-full px-4 text-[13px] font-semibold"
        style={{ height: 38, border: BORDA, background: C.surface }}
      >
        {pending ? "Sincronizando…" : "Sincronizar base de alunos agora"}
      </button>
      {msg && <span className="text-[13px]" style={{ color: C.muted }}>{msg}</span>}
    </div>
  );
}
