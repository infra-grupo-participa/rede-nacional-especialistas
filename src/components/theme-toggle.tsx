"use client";

import { useSyncExternalStore } from "react";
import { C } from "@/lib/tokens";
import { Ico } from "@/components/icons";

/* Alterna tema claro/escuro. Persiste em localStorage e seta data-theme no <html>.
   Lê o tema atual via useSyncExternalStore (sem setState em effect). O tema inicial
   é aplicado pelo script anti-flash no layout, antes do paint. */

function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
function getSnapshot() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const alternar = () => {
    const novo = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", novo);
    try {
      localStorage.setItem("tema", novo);
    } catch {
      /* localStorage bloqueado — silencioso */
    }
  };

  return (
    <button
      onClick={alternar}
      aria-label={dark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={dark ? "Tema claro" : "Tema escuro"}
      className="press flex shrink-0 items-center justify-center rounded-full"
      style={{ width: 40, height: 40, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}
    >
      {dark ? <Ico.sol style={{ width: 18, height: 18 }} /> : <Ico.lua style={{ width: 17, height: 17 }} />}
    </button>
  );
}
