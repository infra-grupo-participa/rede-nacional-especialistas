"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, BORDA } from "@/lib/tokens";
import { Botao } from "@/components/atoms";
import { Sheet } from "@/components/sheet";
import { aprovarArtigo, pedirAjustes } from "@/app/artigos/actions";

/* Barra de ação da revisão: aprovar e publicar, ou pedir ajustes (sheet com
   motivo, mín. 10 caracteres). Só aparece quando o artigo não está publicado. */

export function AcoesRevisao({ artigoId }: { artigoId: string }) {
  const router = useRouter();
  const [sheet, setSheet] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const aprovar = () =>
    start(async () => {
      const r = await aprovarArtigo(artigoId);
      if (r.erro) setErro(r.erro);
      else router.push("/coordenacao");
    });

  const enviarAjustes = () =>
    start(async () => {
      const r = await pedirAjustes(artigoId, motivo);
      if (r.erro) setErro(r.erro);
      else router.push("/coordenacao");
    });

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0" style={{ background: C.fundo, borderTop: BORDA }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3">
          <button
            onClick={() => setSheet(true)}
            disabled={pending}
            className="rounded-xl px-4 text-[15px] font-semibold"
            style={{ height: 52, border: `1px solid #A33F37`, color: "#A33F37", background: C.surface }}
          >
            Pedir ajustes
          </button>
          <div className="flex-1">
            <Botao full onClick={aprovar} disabled={pending}>
              Aprovar e publicar
            </Botao>
          </div>
        </div>
        {erro && (
          <p className="px-5 pb-2 text-center text-[12px]" style={{ color: "#B24A42" }}>
            {erro}
          </p>
        )}
      </div>

      {/* sheet de ajustes (Sheet base: mobile folha / desktop diálogo) */}
      <Sheet
        aberto={sheet}
        onFechar={() => setSheet(false)}
        titulo="Pedir ajustes"
        rodape={
          <Botao full onClick={enviarAjustes} disabled={pending || motivo.trim().length < 10}>
            Enviar para o autor
          </Botao>
        }
      >
        <p className="text-[14px]" style={{ color: C.muted }}>
          Diga o que precisa mudar. O autor recebe esse texto junto com o artigo para corrigir.
        </p>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={5}
          placeholder="Ex.: o segundo parágrafo precisa de uma fonte; a conclusão ficou vaga…"
          className="mt-3 w-full resize-none rounded-xl px-3 py-2.5 text-[15px] outline-none"
          style={{ background: C.paper, border: BORDA, color: C.ink }}
        />
      </Sheet>
    </>
  );
}
