"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { waLink } from "@/lib/utils";

/* Dock flutuante de WhatsApp (mobile): aparece quando o CTA principal sai da tela.
   Recebe um id do elemento-âncora (o CTA no topo) para observar. */
export function DockWhatsapp({
  whatsapp,
  nome,
  anchorId,
}: {
  whatsapp: string;
  nome: string;
  anchorId: string;
}) {
  const [visivel, setVisivel] = useState(false);
  const observado = useRef(false);

  useEffect(() => {
    const alvo = document.getElementById(anchorId);
    if (!alvo || observado.current) return;
    observado.current = true;
    const obs = new IntersectionObserver(
      ([e]) => setVisivel(!e.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(alvo);
    return () => obs.disconnect();
  }, [anchorId]);

  if (!whatsapp) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 p-4 md:hidden"
      style={{
        background: `linear-gradient(to top, ${C.fundo} 60%, transparent)`,
        transform: visivel ? "translateY(0)" : "translateY(120%)",
        transition: "transform .28s cubic-bezier(.22,.61,.36,1)",
        pointerEvents: visivel ? "auto" : "none",
      }}
    >
      <a
        href={waLink(whatsapp, nome)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold"
        style={{ height: 52, background: C.ink, color: "#fff" }}
      >
        <Ico.wa style={{ width: 19, height: 19 }} />
        Falar no WhatsApp
      </a>
    </div>
  );
}
