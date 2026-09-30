"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Botao } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { salvarConfig } from "@/app/coordenacao/actions";
import type { ConfigComunidade } from "@/lib/gestao";

/* Regras do grupo, perguntas obrigatórias de entrada e a regra da #. */
export function FormConfig({ config }: { config: ConfigComunidade }) {
  const router = useRouter();
  const [regras, setRegras] = useState(config.regras);
  const [perguntas, setPerguntas] = useState<string[]>(config.perguntas.length ? config.perguntas : ["", "", ""]);
  const [hashtags, setHashtags] = useState(config.hashtags.map((h) => `#${h}`).join(" "));
  const [exigir, setExigir] = useState(config.exigir_hashtag);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, start] = useTransition();

  const salvar = () =>
    start(async () => {
      const r = await salvarConfig({ regras, perguntas, hashtags, exigirHashtag: exigir });
      setMsg(r.erro ? { ok: false, texto: r.erro } : { ok: true, texto: r.mensagem ?? "Salvo." });
      if (!r.erro) router.refresh();
    });

  const campo = { background: C.paper, border: BORDA, color: C.ink } as const;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl p-4 sm:p-5" style={{ background: C.surface, border: BORDA }}>
        <h2 className="text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
          Regras da comunidade
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
          Uma regra por linha. Aparecem em /regras e no questionário de entrada, onde a pessoa precisa aceitá-las.
        </p>
        <textarea value={regras} onChange={(e) => setRegras(e.target.value)} rows={9} className="mt-3 w-full rounded-xl px-3 py-2.5 text-[14px] leading-relaxed outline-none" style={campo} />
      </section>

      <section className="rounded-2xl p-4 sm:p-5" style={{ background: C.surface, border: BORDA }}>
        <h2 className="text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
          Perguntas obrigatórias de entrada
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
          Quem se cadastra responde antes de a coordenação aprovar. Pergunte o e-mail ou telefone da compra: é por ele que a base de alunos é cruzada.
        </p>
        <ol className="mt-3 space-y-2">
          {perguntas.map((p, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-right text-[13px] tabular-nums" style={{ color: C.muted, fontFamily: F.mono }}>
                {i + 1}
              </span>
              <input
                value={p}
                onChange={(e) => setPerguntas((ps) => ps.map((x, j) => (j === i ? e.target.value : x)))}
                maxLength={300}
                className="min-w-0 flex-1 rounded-xl px-3 text-[14px] outline-none"
                style={{ ...campo, height: 44 }}
              />
              <button
                onClick={() => setPerguntas((ps) => ps.filter((_, j) => j !== i))}
                disabled={perguntas.length <= 1}
                aria-label={`Remover pergunta ${i + 1}`}
                className="flex items-center justify-center rounded-full"
                style={{ width: 36, height: 36, color: C.muted, opacity: perguntas.length <= 1 ? 0.3 : 1 }}
              >
                <Ico.x style={{ width: 15, height: 15 }} />
              </button>
            </li>
          ))}
        </ol>
        {perguntas.length < 10 && (
          <button onClick={() => setPerguntas((ps) => [...ps, ""])} className="mt-2 text-[13px] font-semibold" style={{ color: C.petrolDeep }}>
            + Adicionar pergunta
          </button>
        )}
      </section>

      <section className="rounded-2xl p-4 sm:p-5" style={{ background: C.surface, border: BORDA }}>
        <h2 className="text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
          Regra da #
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
          Hashtags dos temas, separadas por espaço. Aparecem como atalho no campo de post.
        </p>
        <input
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="#duvida #caso #material"
          className="mt-3 w-full rounded-xl px-3 text-[14px] outline-none"
          style={{ ...campo, height: 44 }}
        />
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[14px]">
          <input type="checkbox" checked={exigir} onChange={(e) => setExigir(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0" style={{ accentColor: "#141210" }} />
          <span>
            Travar os comentários automaticamente quando o post não tiver uma dessas hashtags
            <span className="block text-[12px]" style={{ color: C.muted }}>
              Sem hashtags na lista, qualquer hashtag vale. A trava pode ser desfeita no próprio post.
            </span>
          </span>
        </label>
      </section>

      <div className="flex items-center gap-3">
        <div className="w-60">
          <Botao full onClick={salvar} disabled={pending}>
            {pending ? "Salvando…" : "Salvar"}
          </Botao>
        </div>
        {msg && (
          <span className="text-[14px] font-semibold" style={{ color: msg.ok ? C.ink : "#B24A42" }} role="status">
            {msg.texto}
          </span>
        )}
      </div>
    </div>
  );
}
