"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Botao, TagNivel } from "@/components/atoms";
import { Sheet } from "@/components/sheet";
import { NIVEIS_ORDENADOS, type Qualificacao } from "@/lib/qualificacoes";
import type { StatusPerfil } from "@/lib/types";
import { alterarMembro } from "@/app/coordenacao/actions";
import { CandidatosBase } from "./candidatos-base";

export interface MembroGerenciavel {
  perfil_id: string;
  slug: string | null;
  nome: string;
  email: string | null;
  qualificacao: Qualificacao;
  status: StatusPerfil;
  vinculado_base: boolean;
  tem_conta: boolean;
}

const ROTULO_STATUS: Record<StatusPerfil, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
  suspenso: "Suspenso",
};

/* Ficha rápida do membro para a coordenação: nível (tag), status e o
   cruzamento com a base de alunos. Toda mudança cai no registro. */
export function GerenciarMembro({ membro, aberto, onFechar }: { membro: MembroGerenciavel | null; aberto: boolean; onFechar: () => void }) {
  const router = useRouter();
  const [nivel, setNivel] = useState<Qualificacao | null>(null);
  const [status, setStatus] = useState<StatusPerfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!membro) return null;
  const nivelAtual = nivel ?? membro.qualificacao;
  const statusAtual = status ?? membro.status;
  const mudou = nivelAtual !== membro.qualificacao || statusAtual !== membro.status;

  const fechar = () => {
    setNivel(null);
    setStatus(null);
    setErro(null);
    onFechar();
  };

  const salvar = () =>
    start(async () => {
      const r = await alterarMembro(membro.perfil_id, {
        nivel: nivelAtual !== membro.qualificacao ? nivelAtual : undefined,
        status: statusAtual !== membro.status ? statusAtual : undefined,
      });
      if (r.erro) setErro(r.erro);
      else {
        fechar();
        router.refresh();
      }
    });

  const sel = "w-full rounded-xl px-3 text-[15px] outline-none";

  return (
    <Sheet
      aberto={aberto}
      onFechar={fechar}
      titulo={membro.nome}
      alto
      rodape={
        <Botao full onClick={salvar} disabled={pending || !mudou}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </Botao>
      }
    >
      <p className="text-[13px]" style={{ color: C.muted, fontFamily: F.mono }}>
        {membro.email ?? "sem e-mail"}
      </p>
      <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
        {membro.tem_conta ? "Tem conta na rede" : "Ainda não criou conta na rede"} ·{" "}
        {membro.vinculado_base ? "Vinculado à base de alunos" : "Sem vínculo com a base de alunos"}
        {membro.slug && (
          <>
            {" · "}
            <Link href={`/especialista/${membro.slug}`} target="_blank" className="font-semibold" style={{ color: C.petrolDeep }}>
              ver perfil
            </Link>
          </>
        )}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold">
            Nível <TagNivel qualificacao={nivelAtual} size="sm" />
          </span>
          <select value={nivelAtual} onChange={(e) => setNivel(e.target.value as Qualificacao)} className={sel} style={{ height: 46, background: C.paper, border: BORDA, color: C.ink }}>
            {NIVEIS_ORDENADOS.map((n) => (
              <option key={n.key} value={n.key}>
                {n.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Status</span>
          <select value={statusAtual} onChange={(e) => setStatus(e.target.value as StatusPerfil)} className={sel} style={{ height: 46, background: C.paper, border: BORDA, color: C.ink }}>
            {(Object.keys(ROTULO_STATUS) as StatusPerfil[]).map((s) => (
              <option key={s} value={s}>
                {ROTULO_STATUS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {membro.vinculado_base && nivelAtual !== membro.qualificacao && (
        <p className="mt-2 text-[12px]" style={{ color: "#B24A42" }}>
          Este membro está vinculado à base: a sincronização diária volta o nível para o plano comprado.
        </p>
      )}

      {!membro.vinculado_base && membro.tem_conta && (
        <div className="mt-5">
          <p className="mb-2 text-[13px] font-semibold">Cruzar com a base de alunos</p>
          <CandidatosBase perfilId={membro.perfil_id} onVinculado={fechar} />
        </div>
      )}

      {erro && (
        <p className="mt-3 text-[13px]" style={{ color: "#B24A42" }}>
          {erro}
        </p>
      )}
    </Sheet>
  );
}
