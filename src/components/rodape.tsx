import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { Logo } from "@/components/logo";

/* Rodapé institucional (desktop). Logo + descrição à esquerda; links, redes e
   copyright à direita. Portado do Rodape do MVP. */

const ANO = 2026; // Date.now() indisponível em RSC de build; ano fixo (revisar anualmente)

const REDES = [
  { nome: "Instagram", href: "https://instagram.com", ico: <Ico.ig style={{ width: 17, height: 17 }} /> },
  { nome: "LinkedIn", href: "https://linkedin.com", ico: <Ico.li style={{ width: 16, height: 16 }} /> },
  { nome: "Site", href: "https://timeholdingbrasil.com.br", ico: <Ico.site style={{ width: 17, height: 17 }} /> },
];

export function Rodape() {
  return (
    <footer className="mt-10 hidden md:block" style={{ borderTop: `1px solid ${C.line}`, background: C.paper }}>
      <div className="mx-auto flex max-w-[1160px] items-start justify-between gap-8 px-6 py-8">
        <div className="max-w-md">
          <Logo altura={56} />
          <p className="mt-3 text-[13px] leading-relaxed" style={{ color: C.muted }}>
            Rede Nacional de Especialistas — profissionais formados e certificados pelos nossos
            Espaços de Instrução.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-4 text-[13px]" style={{ color: C.muted }}>
            <a href="/politica-de-privacidade" style={{ color: C.muted }}>
              Política de privacidade
            </a>
            <a href="/termos-de-uso" style={{ color: C.muted }}>
              Termos de uso
            </a>
          </div>
          <div className="flex items-center gap-2">
            {REDES.map((r) => (
              <a
                key={r.nome}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={r.nome}
                className="flex items-center justify-center rounded-full"
                style={{ width: 36, height: 36, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}
              >
                {r.ico}
              </a>
            ))}
          </div>
          <span className="text-[12px]" style={{ color: C.muted, fontFamily: F.mono }}>
            © {ANO} Time Holding Brasil
          </span>
        </div>
      </div>
    </footer>
  );
}
