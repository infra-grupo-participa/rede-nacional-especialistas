"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* Ganchos do casco: tema (claro/escuro) e copiar para a área de transferência. */

/* ---------------------------------------------------------------- tema -- */
/* Mesmo mecanismo do botão de tema do blog (src/components/theme-toggle.tsx):
   atributo data-theme no <html> + localStorage 'tema'. O tema inicial é posto
   pelo script anti-flash do layout raiz, antes da primeira pintura. */

function assinarTema(aoMudar: () => void) {
  const obs = new MutationObserver(aoMudar);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
function temaEscuroAgora() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

/** `[escuro, alternar]`. No servidor e na hidratação responde claro. */
export function useTemaEscuro(): [boolean, () => void] {
  const escuro = useSyncExternalStore(assinarTema, temaEscuroAgora, () => false);
  const alternar = useCallback(() => {
    const novo = temaEscuroAgora() ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", novo);
    try {
      localStorage.setItem("tema", novo);
    } catch {
      /* armazenamento bloqueado: o tema vale só para esta visita */
    }
  }, []);
  return [escuro, alternar];
}

/* -------------------------------------------------------------- copiar -- */

async function escrever(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    /* cai no método antigo */
  }
  try {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    const ok = document.execCommand("copy");
    campo.remove();
    return ok;
  } catch {
    return false;
  }
}

export type EstadoCopia = "parado" | "copiado" | "falhou";

/** `[estado, copiar]`: depois de copiar, o estado fica "copiado" por 2 segundos.
 *  Se o navegador recusar a cópia, fica "falhou" (quem usa mostra o link para a
 *  pessoa copiar à mão). */
export function useCopiar(): [EstadoCopia, (texto: string) => void] {
  const [estado, setEstado] = useState<EstadoCopia>("parado");
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (relogio.current) clearTimeout(relogio.current);
    },
    [],
  );

  const copiar = useCallback((texto: string) => {
    void escrever(texto).then((ok) => {
      setEstado(ok ? "copiado" : "falhou");
      if (relogio.current) clearTimeout(relogio.current);
      relogio.current = setTimeout(() => setEstado("parado"), ok ? 2000 : 4000);
    });
  }, []);

  return [estado, copiar];
}
