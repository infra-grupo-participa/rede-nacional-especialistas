import type { CSSProperties } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { CTA, LP, MENU, TIPO } from "@/lib/landing";
import { Ico } from "@/components/icons";
import { Logo } from "@/components/logo";

/* ============================================================================
   Rodapé da landing institucional.

   Server Component de propósito: é conteúdo estático e não deve custar JS no
   bundle da home. O hover (que style inline não sabe fazer) sai via custom
   properties alimentadas pelos tokens — as classes Tailwind só consomem
   `var(--lp-*)`, então nenhuma cor nasce escrita à mão aqui.

   As vars ficam no <footer> e descem por herança para tudo dentro dele.
   ========================================================================== */

const ANO = 2026; // Date.now() indisponível em RSC de build; ver rodape.tsx:8

/** Fundo do rodapé da referência — mais frio que LP.preto para separar do
    hero sem precisar de linha grossa. Não existe em landing.ts porque só este
    bloco usa. */
const FUNDO = "#13171A";

const REDES = [
  // TODO: trocar pelos perfis oficiais quando o PO enviar as URLs. Domínios-raiz
  // seguem o precedente de src/components/rodape.tsx (melhor que inventar handle).
  { nome: "Instagram", href: "https://instagram.com", ico: <Ico.ig style={{ width: 18, height: 18 }} /> },
  { nome: "Facebook", href: "https://facebook.com", ico: <Ico.facebook style={{ width: 17, height: 17 }} /> },
  { nome: "YouTube", href: "https://youtube.com", ico: <Ico.youtube style={{ width: 19, height: 19 }} /> },
  { nome: "LinkedIn", href: "https://linkedin.com", ico: <Ico.li style={{ width: 17, height: 17 }} /> },
  { nome: "TikTok", href: "https://tiktok.com", ico: <Ico.tiktok style={{ width: 17, height: 17 }} /> },
];

const ACESSO = [
  { rotulo: CTA.membro.rotulo, href: CTA.membro.href },
  { rotulo: CTA.inscrever.rotulo, href: CTA.inscrever.href },
  { rotulo: "Vitrine de especialistas", href: "/vitrine" },
  // "Todos os artigos" e não "Artigos": a coluna Navegar já tem um link
  // chamado "Artigos" (âncora da home). Dois links de mesmo nome e destinos
  // diferentes no mesmo rodapé quebram o WCAG 2.4.4 (propósito do link).
  { rotulo: "Todos os artigos", href: "/artigos" },
];

const LEGAIS = [
  { rotulo: "Política de privacidade", href: "/politica-de-privacidade" },
  { rotulo: "Termos de uso", href: "/termos-de-uso" },
];

/** Paleta do bloco escuro exposta como custom properties. */
const VARS = {
  "--lp-tinta": LP.tintaEscuraFraca,
  "--lp-tinta-suave": LP.tintaEscuraSuave,
  "--lp-fio": LP.linhaEscura,
  "--lp-acento": C.laranja,
} as CSSProperties;

/** Classe única dos links de lista — base fraca, acende no hover e no foco. */
const LINK = "text-[color:var(--lp-tinta)] transition-colors hover:text-[color:var(--lp-acento)]";

export function RodapeInstitucional() {
  return (
    <footer style={{ ...VARS, background: FUNDO, fontFamily: F.sans }}>
      {/* fio degradê separando o rodapé da última seção */}
      <span aria-hidden="true" className="lp-fio block" />

      <div className="lp-container py-14 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr] lg:gap-10">
          {/* ----------------------------------------------------- marca -- */}
          <div className="max-w-md">
            {/* `so`: o lockup de logo.tsx usa C.ink e sumiria no fundo escuro. */}
            <Logo altura={58} so />
            <p className="mt-5" style={{ ...TIPO.corpo, color: LP.tintaEscuraFraca }}>
              <strong style={{ color: "#fff", fontWeight: 600 }}>
                Rede Nacional de Especialistas do Time Holding Brasil
              </strong>{" "}
              — profissionais formados e certificados pelos nossos Espaços de Instrução.
            </p>

            <ul className="mt-7 flex flex-wrap items-center gap-2.5">
              {REDES.map((r) => (
                <li key={r.nome}>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${r.nome} do Time Holding Brasil (abre em nova aba)`}
                    className="flex items-center justify-center rounded-full border border-[color:var(--lp-fio)] text-[color:var(--lp-tinta)] transition-colors hover:border-[color:var(--lp-acento)] hover:text-[color:var(--lp-acento)]"
                    style={{ width: 44, height: 44 }} // alvo de toque mínimo
                  >
                    {r.ico}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* -------------------------------------------------- navegar -- */}
          <nav aria-labelledby="rodape-navegar">
            <h2 id="rodape-navegar" style={{ ...TIPO.eyebrow, fontFamily: F.mono, color: LP.tintaEscuraSuave }}>
              Navegar
            </h2>
            <ul className="mt-5 flex flex-col gap-3.5">
              {MENU.map((m) => (
                <li key={m.id}>
                  {/* href absoluto: o rodapé também aparece em rotas internas,
                      onde "#id" sozinho não sairia da página atual. */}
                  <a href={`/#${m.id}`} className={LINK} style={{ ...TIPO.corpo }}>
                    {m.rotulo}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* --------------------------------------------------- acesso -- */}
          <nav aria-labelledby="rodape-acesso">
            <h2 id="rodape-acesso" style={{ ...TIPO.eyebrow, fontFamily: F.mono, color: LP.tintaEscuraSuave }}>
              Acesso
            </h2>
            <ul className="mt-5 flex flex-col gap-3.5">
              {ACESSO.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} className={LINK} style={{ ...TIPO.corpo }}>
                    {a.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* ------------------------------------------------- barra final -- */}
        <div
          className="mt-12 flex flex-col gap-4 pt-7 sm:flex-row sm:items-center sm:justify-between lg:mt-16"
          style={{ borderTop: `1px solid ${LP.linhaEscura}` }}
        >
          <p style={{ fontSize: 12.5, color: LP.tintaEscuraSuave, fontFamily: F.mono }}>
            © {ANO} Time Holding Brasil
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LEGAIS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={LINK} style={{ fontSize: 12.5 }}>
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
