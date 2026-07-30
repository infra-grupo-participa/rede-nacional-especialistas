"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { useMediaQuery } from "@/lib/use-media-query";

/* Sheet base — cópia fiel do MVP (App.jsx 692). Mobile: folha que sobe do rodapé
   (anim-sheet). Desktop (≥1024px): diálogo centralizado (anim-modal). Fecha no
   Escape, no overlay ou no X. */
export function Sheet({
  aberto,
  onFechar,
  titulo,
  children,
  rodape,
  alto,
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: ReactNode;
  rodape?: ReactNode;
  alto?: boolean;
}) {
  const desktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    if (aberto) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col ${desktop ? "items-center justify-center p-6" : "justify-end"}`}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div className="absolute inset-0 anim-fade" style={{ background: "rgba(17,17,17,.45)" }} onClick={onFechar} />
      <div
        className={`relative flex w-full flex-col ${desktop ? "anim-modal" : "anim-sheet"}`}
        style={
          desktop
            ? {
                background: C.surface,
                borderRadius: 20,
                maxWidth: 480,
                maxHeight: alto ? "88vh" : "min(640px, 88vh)",
                boxShadow: "0 24px 64px rgba(17,17,17,.22)",
              }
            : {
                background: C.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: alto ? "94%" : "82%",
              }
        }
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-[19px] font-semibold" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            {titulo}
          </h2>
          <button onClick={onFechar} aria-label="Fechar" className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, background: C.paper, color: C.ink }}>
            <Ico.x style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {rodape && (
          <div className="px-5 pb-5 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
            {rodape}
          </div>
        )}
      </div>
    </div>
  );
}
