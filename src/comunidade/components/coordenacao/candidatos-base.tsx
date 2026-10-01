"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { TagNivel } from "@/comunidade/components/atoms";
import { buscarCandidatos, vincularBase } from "@/comunidade/acoes/coordenacao";
import type { CandidatoBase } from "@/comunidade/lib/gestao";

/* Cruzamento com a base de alunos (item 8): lista quem da base casa com o
   membro por e-mail, telefone ou nome, e une os dois cadastros num clique.
   O membro assume o nível (tag) e o vínculo comercial da base. */
export function CandidatosBase({ perfilId, onVinculado }: { perfilId: string; onVinculado?: () => void }) {
  const router = useRouter();
  const [lista, setLista] = useState<CandidatoBase[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let ativo = true;
    buscarCandidatos(perfilId).then((r) => {
      if (!ativo) return;
      if (r.erro) setErro(r.erro);
      else setLista(r.candidatos ?? []);
    });
    return () => {
      ativo = false;
    };
  }, [perfilId]);

  const vincular = (c: CandidatoBase) => {
    if (!confirm(`Unir este membro ao cadastro de ${c.nome} (${c.email ?? "sem e-mail"}) da base? O login e o conteúdo passam para o cadastro da base.`)) return;
    start(async () => {
      const r = await vincularBase(perfilId, c.perfil_id);
      if (r.erro) setErro(r.erro);
      else {
        setMsg(r.mensagem ?? "Vinculado.");
        onVinculado?.();
        router.refresh();
      }
    });
  };

  if (msg) return <p className="text-[13px] font-semibold" style={{ color: C.ink }}>{msg}</p>;
  if (erro) return <p className="text-[13px]" style={{ color: "#B24A42" }}>{erro}</p>;
  if (!lista) return <p className="text-[13px]" style={{ color: C.muted }}>Procurando na base de alunos…</p>;
  if (lista.length === 0)
    return (
      <p className="text-[13px]" style={{ color: C.muted }}>
        Nenhum aluno da base casa com este cadastro por e-mail, telefone ou nome. Se a pessoa comprou recentemente, sincronize a base na aba Entrada e tente de novo.
      </p>
    );

  return (
    <ul className="space-y-2">
      {lista.map((c) => (
        <li key={c.perfil_id} className="rounded-xl p-3" style={{ background: C.paper, border: BORDA }}>
          <div className="flex items-center gap-2">
            <span className="min-w-0 truncate text-[14px] font-semibold">{c.nome}</span>
            <TagNivel qualificacao={c.qualificacao} size="sm" />
          </div>
          <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted, fontFamily: F.mono }}>
            {[c.email, c.whatsapp, [c.cidade, c.uf].filter(Boolean).join("/")].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[12px]" style={{ color: C.muted }}>
              casa por: <strong style={{ color: C.ink }}>{c.motivos.join(", ")}</strong>
            </span>
            <button
              onClick={() => vincular(c)}
              disabled={pending}
              className="press ml-auto rounded-full px-3 text-[13px] font-semibold"
              style={{ height: 32, background: C.ink, color: C.fundo }}
            >
              Vincular
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
