"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { C, F, BORDA } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { Chip, Segmentado, Eyebrow } from "@/components/atoms";
import { MapaBrasil } from "@/components/mapa-brasil";
import { SheetEstado } from "@/components/sheet-estado";
import { LinhaEstado } from "@/components/linha-estado";
import { BuscaComSugestoes } from "@/components/busca-sugestoes";
import { BlocoNewsletter } from "@/components/bloco-newsletter";
import { PainelArtigos } from "@/components/artigo/painel-artigos";
import { PainelArtigosDesktop } from "@/components/artigo/painel-artigos-desktop";
import { BlocoMaisLidos } from "@/components/artigo/cartoes";
import { Rodape } from "@/components/rodape";
import { TopNav, type SessaoNav } from "@/components/topnav";
import { HeroHome } from "@/components/hero-home";
import { ESTADOS, REGIOES, type Regiao } from "@/lib/estados";
import type { Facetas } from "@/lib/queries";
import type { ArtigoComAutor } from "@/lib/artigos-tipos";

export function Vitrine({
  contagem,
  facetas,
  artigos,
  sessao,
}: {
  contagem: Record<string, number>;
  facetas: Facetas;
  artigos: ArtigoComAutor[];
  sessao: SessaoNav;
}) {
  const [regiao, setRegiao] = useState<Regiao | "Todos">("Todos");
  const [aba, setAba] = useState<"profissionais" | "artigos">("profissionais");
  const [ufSheet, setUfSheet] = useState<string | null>(null);

  const total = useMemo(() => Object.values(contagem).reduce((a, b) => a + b, 0), [contagem]);

  const estadosVisiveis = useMemo(() => {
    const base = regiao === "Todos" ? ESTADOS : ESTADOS.filter((e) => e.regiao === regiao);
    return [...base].sort((a, b) => {
      const na = contagem[a.uf] ?? 0;
      const nb = contagem[b.uf] ?? 0;
      return nb - na || a.nome.localeCompare(b.nome);
    });
  }, [regiao, contagem]);

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <TopNav sessao={sessao} />

      {/* =============================================================== MOBILE */}
      <div className="lg:hidden">
        <HeroHome compacto />

        <div className="mx-auto max-w-2xl px-5 pt-6">
          <div className="mt-0">
            <BuscaComSugestoes facetas={facetas} />
          </div>

          <div className="mt-5">
            <Segmentado
              abas={[
                { id: "profissionais", rotulo: "Profissionais", n: total },
                { id: "artigos", rotulo: "Artigos", n: artigos.length },
              ]}
              ativa={aba}
              onTrocar={(id) => setAba(id as "profissionais" | "artigos")}
            />
          </div>
        </div>

        {aba === "profissionais" ? (
          <>
            <div className="mx-auto max-w-2xl pt-3">
              <MapaBrasil contagem={contagem} onEstado={(uf) => setUfSheet(uf)} />
            </div>
            <div className="mx-auto max-w-2xl">
              <div className="flex gap-2 overflow-x-auto px-5 pb-3 pt-6" style={{ scrollbarWidth: "none" }}>
                {REGIOES.map((r) => (
                  <Chip key={r} ativo={regiao === r} onClick={() => setRegiao(r)}>
                    {r}
                  </Chip>
                ))}
              </div>
              <div className="space-y-2 px-5">
                {estadosVisiveis.map((e) => (
                  <LinhaEstado key={e.uf} estado={e} n={contagem[e.uf] ?? 0} />
                ))}
              </div>
              <div className="px-5 pb-8 pt-4">
                <Link href="/vitrine" className="press flex w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold" style={{ height: 48, background: C.ink, color: "#fff" }}>
                  Ver catálogo completo de especialistas
                  <Ico.chevron style={{ width: 16, height: 16 }} />
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-2xl px-5 pt-6">
            <PainelArtigos artigos={artigos} />
          </div>
        )}

        <div className="mx-auto max-w-2xl px-5 pb-12 pt-4">
          <BlocoNewsletter />
        </div>
      </div>

      {/* ============================================================== DESKTOP */}
      <div className="hidden lg:block">
        <HeroHome />

        <div className="mx-auto px-10 py-12" style={{ maxWidth: 1160 }}>
          {/* seção 1 — texto+busca | mapa */}
          <div className="grid gap-12" style={{ gridTemplateColumns: "460px 1fr" }}>
            <div>
              <Eyebrow sobreFundo>Encontre um especialista</Eyebrow>
              <h2 className="mt-2 text-[30px] leading-[1.1]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Quem está perto de você
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: C.sobreFundo }}>
                Toque no seu estado no mapa e fale direto no WhatsApp.
              </p>
              <div className="mt-5">
                <BuscaComSugestoes facetas={facetas} />
              </div>
            </div>
            <div className="pt-1">
              <MapaBrasil contagem={contagem} onEstado={(uf) => setUfSheet(uf)} />
              <Link href="/vitrine" className="press mt-5 flex w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold" style={{ height: 48, background: C.ink, color: "#fff" }}>
                Ver catálogo completo de especialistas
                <Ico.chevron style={{ width: 16, height: 16 }} />
              </Link>
            </div>
          </div>

          {/* seção 2 — artigos, 3 colunas centralizadas */}
          <div className="mt-16 pt-14" style={{ borderTop: BORDA }}>
            <div className="text-center">
              <Eyebrow sobreFundo>Artigos</Eyebrow>
              <h2 className="mt-2 text-[28px] leading-[1.15]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
                Conteúdo assinado pelos especialistas da rede
              </h2>
              <p className="mt-2 text-[13px]" style={{ color: C.sobreFundo, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
                {artigos.length} {artigos.length === 1 ? "artigo publicado" : "artigos publicados"}
              </p>
            </div>
            <div className="mt-8">
              <PainelArtigosDesktop artigos={artigos} />
            </div>
          </div>

          {/* seção 3 — mais lidos */}
          <div className="mt-16 pt-14" style={{ borderTop: BORDA }}>
            <div className="mx-auto" style={{ maxWidth: 760 }}>
              <BlocoMaisLidos artigos={artigos} />
            </div>
          </div>

          {/* seção 4 — newsletter */}
          <div className="mt-8">
            <div className="mx-auto" style={{ maxWidth: 760 }}>
              <BlocoNewsletter />
            </div>
          </div>
        </div>

        <Rodape />
      </div>

      {/* folha do estado ao tocar no mapa */}
      <SheetEstado key={ufSheet ?? "none"} uf={ufSheet} onFechar={() => setUfSheet(null)} />
    </main>
  );
}
