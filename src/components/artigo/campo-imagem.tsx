"use client";

import { useRef, useState } from "react";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { subirImagem, MEDIDAS, type TipoImagem } from "@/lib/subir-imagem";

/* Dropzone de imagem de artigo: mostra a medida certa antes, mede e sobe ao
   escolher. Dois estados: com imagem (preview + trocar/remover) e vazio (botão
   tracejado). */

export function CampoImagem({
  tipo = "bloco",
  valor,
  onMudar,
  rotulo,
}: {
  tipo?: TipoImagem;
  valor: string;
  onMudar: (url: string) => void;
  rotulo?: string;
}) {
  const m = MEDIDAS[tipo];
  const entrada = useRef<HTMLInputElement>(null);
  const [subindo, setSubindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const escolher = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite reescolher o mesmo arquivo
    if (!file) return;
    setErro(null);
    setSubindo(true);
    try {
      const r = await subirImagem(file, tipo);
      onMudar(r.url);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      setSubindo(false);
    }
  };

  return (
    <div>
      {rotulo && (
        <label className="mb-1 block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}>
          {rotulo}
        </label>
      )}

      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={escolher}
        className="hidden"
      />

      {valor ? (
        <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.line}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={valor} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
          <div className="flex items-center justify-between px-3 py-2" style={{ background: C.surface }}>
            <button
              onClick={() => entrada.current?.click()}
              disabled={subindo}
              className="text-[13px] font-semibold"
              style={{ color: C.ink }}
            >
              {subindo ? "Enviando…" : "Trocar imagem"}
            </button>
            <button
              onClick={() => onMudar("")}
              className="text-[13px] font-semibold"
              style={{ color: "#B24A42" }}
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => entrada.current?.click()}
          disabled={subindo}
          className="flex w-full flex-col items-center gap-2 rounded-xl px-4 py-6 text-center"
          style={{
            border: `1.5px dashed ${erro ? "#C0524A" : C.line}`,
            background: C.paper,
          }}
        >
          <span
            className="flex items-center justify-center rounded-full"
            style={{ width: 40, height: 40, background: C.petrolSoft, color: C.petrolDeep }}
          >
            <Ico.mais style={{ width: 20, height: 20 }} />
          </span>
          <span className="text-[15px] font-semibold" style={{ color: C.ink }}>
            {subindo ? "Enviando…" : "Escolher imagem do seu dispositivo"}
          </span>
          <span className="text-[13px]" style={{ color: C.muted }}>
            {m.dica}
          </span>
          <span className="text-[11px]" style={{ color: C.muted, fontFamily: F.mono }}>
            JPG, PNG ou WebP · até {m.maxMB} MB · mínimo {m.minLargura} px de largura
          </span>
        </button>
      )}

      {erro && (
        <p className="mt-1.5 text-[12px]" style={{ color: "#B24A42" }}>
          {erro}
        </p>
      )}
    </div>
  );
}
