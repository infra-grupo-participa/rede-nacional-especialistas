import { C } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import type { Perfil } from "@/lib/types";

/* Barra de redes sociais do perfil (estilo linktree): só mostra as que o aluno
   preencheu. Ícones em botões redondos com hover. */

interface Rede {
  chave: keyof Perfil;
  label: string;
  href: (v: string) => string;
  icone: React.ReactNode;
}

const REDES: Rede[] = [
  { chave: "instagram", label: "Instagram", href: (v) => `https://instagram.com/${v.replace("@", "")}`, icone: <Ico.ig style={{ width: 19, height: 19 }} /> },
  { chave: "linkedin", label: "LinkedIn", href: (v) => `https://linkedin.com/${v.replace(/^\/+/, "")}`, icone: <Ico.li style={{ width: 18, height: 18 }} /> },
  { chave: "youtube", label: "YouTube", href: (v) => (v.startsWith("http") ? v : `https://youtube.com/${v.replace("@", "@")}`), icone: <Ico.youtube style={{ width: 19, height: 19 }} /> },
  { chave: "tiktok", label: "TikTok", href: (v) => `https://tiktok.com/@${v.replace("@", "")}`, icone: <Ico.tiktok style={{ width: 18, height: 18 }} /> },
  { chave: "facebook", label: "Facebook", href: (v) => (v.startsWith("http") ? v : `https://facebook.com/${v}`), icone: <Ico.facebook style={{ width: 18, height: 18 }} /> },
  { chave: "site", label: "Site", href: (v) => `https://${v.replace(/^https?:\/\//, "")}`, icone: <Ico.site style={{ width: 18, height: 18 }} /> },
];

export function RedesSociais({ perfil }: { perfil: Perfil }) {
  const ativas = REDES.filter((r) => {
    const v = perfil[r.chave];
    return typeof v === "string" && v.trim().length > 0;
  });
  if (ativas.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ativas.map((r) => (
        <a
          key={r.chave}
          href={r.href(String(perfil[r.chave]))}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={r.label}
          className="press flex items-center justify-center rounded-full"
          style={{ width: 42, height: 42, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}
        >
          {r.icone}
        </a>
      ))}
    </div>
  );
}
