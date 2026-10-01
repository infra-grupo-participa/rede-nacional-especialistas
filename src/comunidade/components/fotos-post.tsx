"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IcoRC } from "@/comunidade/components/icones";

/* Fotos de um post, como no Facebook: uma foto ocupa a largura; duas ficam
   lado a lado; três, uma em cima e duas embaixo; com quatro ou mais aparecem
   as três primeiras e a quarta desfocada, com o "+N" das que faltam. Tocar em
   qualquer uma abre o visor, que passa por todas. */

export function FotosPost({ fotos }: { fotos: string[] }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const fechar = useCallback(() => setAberta(null), []);
  if (fotos.length === 0) return null;

  const visiveis = fotos.slice(0, 4);
  const ocultas = fotos.length > 3 ? fotos.length - 3 : 0;

  return (
    <>
      <div className="rc-fotos" data-n={Math.min(fotos.length, 4)}>
        {visiveis.map((url, i) => {
          const mais = ocultas > 0 && i === 3;
          return (
            <button
              key={`${url}-${i}`}
              type="button"
              className="rc-fotos-item"
              data-mais={mais || undefined}
              aria-label={mais ? (ocultas === 1 ? "Ver mais 1 foto" : `Ver mais ${ocultas} fotos`) : fotos.length === 1 ? "Ampliar a foto" : `Ampliar a foto ${i + 1} de ${fotos.length}`}
              onClick={() => setAberta(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" loading="lazy" />
              {mais && (
                <span className="rc-fotos-mais" aria-hidden="true">
                  +{ocultas}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {aberta !== null && <VisorFotos fotos={fotos} inicio={aberta} onFechar={fechar} />}
    </>
  );
}

/** Visor em tela cheia: seta para os lados (ou deslizar o dedo), contador,
 *  abrir a foto em tamanho real e fechar no X, no Esc ou tocando fora dela. */
export function VisorFotos({ fotos, inicio = 0, onFechar }: { fotos: string[]; inicio?: number; onFechar: () => void }) {
  const [i, setI] = useState(Math.min(Math.max(inicio, 0), fotos.length - 1));
  const caixa = useRef<HTMLDivElement>(null);
  /** o dedo que começou o deslize (um só: dois dedos são pinça, não troca de foto) */
  const toque = useRef<{ id: number; x: number } | null>(null);
  const varias = fotos.length > 1;

  const ir = useCallback((passo: number) => setI((atual) => (atual + passo + fotos.length) % fotos.length), [fotos.length]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
      else if (e.key === "ArrowRight") ir(1);
      else if (e.key === "ArrowLeft") ir(-1);
    };
    document.addEventListener("keydown", tecla);
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    caixa.current?.focus();
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = rolagem;
    };
  }, [ir, onFechar]);

  return (
    <div
      ref={caixa}
      className="rc-visor"
      role="dialog"
      aria-modal="true"
      aria-label={varias ? `Foto ${i + 1} de ${fotos.length}` : "Foto do post"}
      tabIndex={-1}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") return;
        toque.current = e.isPrimary ? { id: e.pointerId, x: e.clientX } : null;
      }}
      onPointerUp={(e) => {
        const t = toque.current;
        if (!t || t.id !== e.pointerId) return;
        toque.current = null;
        const dx = e.clientX - t.x;
        if (varias && Math.abs(dx) > 48) ir(dx < 0 ? 1 : -1);
      }}
      onPointerCancel={() => {
        toque.current = null;
      }}
    >
      <div className="rc-visor-topo">
        {varias && (
          <span className="rc-visor-conta" aria-live="polite">
            {i + 1} de {fotos.length}
          </span>
        )}
        <a className="rc-visor-btn" href={fotos[i]} target="_blank" rel="noopener noreferrer" aria-label="Abrir a foto em tamanho real" title="Abrir a foto em tamanho real">
          <IcoRC.externo />
        </a>
        <button type="button" className="rc-visor-btn rc-visor-fechar" aria-label="Fechar" onClick={onFechar}>
          <IcoRC.x />
        </button>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={fotos[i]} className="rc-visor-foto" src={fotos[i]} alt={varias ? `Foto ${i + 1} de ${fotos.length}` : "Foto do post"} draggable={false} />

      {varias && (
        <>
          <button type="button" className="rc-visor-btn rc-visor-seta" data-lado="antes" aria-label="Foto anterior" onClick={() => ir(-1)}>
            <IcoRC.chevronDireita />
          </button>
          <button type="button" className="rc-visor-btn rc-visor-seta" data-lado="depois" aria-label="Próxima foto" onClick={() => ir(1)}>
            <IcoRC.chevronDireita />
          </button>
          {/* já deixa a vizinha carregada, para a troca não piscar */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotos[(i + 1) % fotos.length]} alt="" hidden />
        </>
      )}
    </div>
  );
}
