import type { Metadata } from "next";
import { contagemPorUf, catalogoEspecialistas } from "@/lib/queries";
import { listarPublicados } from "@/lib/artigos";
import { C, F } from "@/lib/tokens";
import { LP } from "@/lib/landing";
import { BlocoNewsletter } from "@/components/bloco-newsletter";
import { Reveal } from "@/components/home/reveal";
import { CabecalhoInstitucional } from "@/components/home/cabecalho";
import { HeroInstitucional } from "@/components/home/hero-institucional";
import { SecaoQuemSomos } from "@/components/home/secao-quem-somos";
import { SecaoMembros } from "@/components/home/secao-membros";
import { SecaoArtigos } from "@/components/home/secao-artigos";
import { SecaoRedes } from "@/components/home/secao-redes";
import { SecaoEventos } from "@/components/home/secao-eventos";
import { RodapeInstitucional } from "@/components/home/rodape-institucional";

/* ============================================================================
   Home institucional do Time Holding Brasil.

   A ordem das dobras espelha o menu que o PO definiu no wireframe
   (Quem somos · Membros · Artigos · Nas redes · Próximos eventos) — o
   scrollspy do cabeçalho depende dos ids das seções baterem com `MENU`
   em `src/lib/landing.ts`.

   Ritmo de fundo: escuro (hero) → claro → claro alternado → frio (redes) →
   escuro (agenda) → claro (newsletter) → escuro (rodapé). Os dois blocos
   escuros são as âncoras visuais da página; o resto respira em claro.

   O catálogo de especialistas alimenta duas coisas ao mesmo tempo: o mapa
   (contagem por UF) e a prévia com foto que o PO pediu para ver "como
   ficaria". Uma consulta só, dois usos.
   ========================================================================== */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Time Holding Brasil — A Maior Autoridade em Planejamento Patrimonial do País",
  description:
    "O maior grupo de profissionais especialistas em estruturação patrimonial e de negócios do Brasil. Uma rede de inteligência estratégica presente em todo o território nacional.",
};

export default async function Home() {
  const [contagem, catalogo, artigos] = await Promise.all([
    contagemPorUf(),
    catalogoEspecialistas(),
    listarPublicados(24),
  ]);

  const total = Object.values(contagem).reduce((a, b) => a + b, 0);

  // prévia da seção Membros: quem já tem foto vem primeiro (o catálogo já
  // chega ordenado por qualificação, então os Diamantes lideram a fila),
  // mas sem foto o card fica com as iniciais — não descartamos ninguém.
  const destaques = [...catalogo]
    .sort((a, b) => Number(Boolean(b.avatar_url)) - Number(Boolean(a.avatar_url)))
    .slice(0, 8);

  return (
    <>
      <CabecalhoInstitucional />

      <main style={{ background: C.fundo, color: C.ink }}>
        <HeroInstitucional />
        <SecaoQuemSomos />
        <SecaoMembros contagem={contagem} destaques={destaques} total={total} />
        <SecaoArtigos artigos={artigos} />
        <SecaoRedes />
        <SecaoEventos />

        {/* Boletim informativo — reusa o bloco do app, emoldurado no ritmo da LP. */}
        <section className="lp-secao" style={{ background: C.fundo }}>
          <div className="lp-container">
            <Reveal className="mx-auto" style={{ maxWidth: 720 }}>
              <BlocoNewsletter />
            </Reveal>
          </div>
        </section>
      </main>

      <RodapeInstitucional />

      {/* Faixa de continuidade: quem já é da casa entra direto na rede social
          interna, que é o produto que vive atrás do login. */}
      <div style={{ background: LP.preto, borderTop: `1px solid ${LP.linhaEscura}` }}>
        <div className="lp-container flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-4 text-center">
          <span className="text-[13px]" style={{ color: LP.tintaEscuraFraca }}>
            Já é membro do Time Holding Brasil?
          </span>
          <a
            href="/feed"
            className="press text-[13px] font-semibold"
            style={{ color: C.laranja, fontFamily: F.sans }}
          >
            Entrar na rede →
          </a>
        </div>
      </div>
    </>
  );
}
