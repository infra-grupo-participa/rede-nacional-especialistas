"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { C, F, BORDA } from "@/lib/tokens";
import { Chip, Segmentado, Eyebrow } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { Logo } from "@/components/logo";
import { MapaBrasil } from "@/components/mapa-brasil";
import { SheetEstado } from "@/components/sheet-estado";
import { LinhaEstado } from "@/components/linha-estado";
import { BuscaComSugestoes } from "@/components/busca-sugestoes";
import { BlocoNiveis } from "@/components/bloco-niveis";
import { BlocoNewsletter } from "@/components/bloco-newsletter";
import { PainelArtigos } from "@/components/artigo/painel-artigos";
import { PainelArtigosDesktop } from "@/components/artigo/painel-artigos-desktop";
import { BlocoMaisLidos } from "@/components/artigo/cartoes";
import { Rodape } from "@/components/rodape";
import { ESTADOS, REGIOES, type Regiao } from "@/lib/estados";
import type { Facetas } from "@/lib/queries";
import type { ArtigoComAutor } from "@/lib/artigos-tipos";

export interface SessaoInfo {
  nome: string | null;
  primeiroNome: string | null;
  isAdmin: boolean;
  aprovado: boolean;
}

/* Botão de conta no topo (mobile e desktop). */
function BotaoConta({ sessao }: { sessao: SessaoInfo }) {
  const cls = "flex items-center gap-1.5 rounded-full px-3.5";
  const style = { height: 40, background: C.surface, border: BORDA, color: C.ink } as const;
  if (sessao.isAdmin)
    return (
      <Link href="/coordenacao" className={cls} style={style}>
        <Ico.escudo style={{ width: 16, height: 16 }} />
        <span className="text-[14px] font-semibold">Coordenação</span>
      </Link>
    );
  if (sessao.primeiroNome)
    return (
      <Link href="/conta" className={cls} style={style}>
        <span className="text-[14px] font-semibold">{sessao.primeiroNome}</span>
      </Link>
    );
  return (
    <Link href="/entrar" className={cls} style={{ ...style, lineHeight: "40px" }}>
      <span className="text-[14px] font-semibold">Entrar</span>
    </Link>
  );
}

export function Vitrine({
  contagem,
  facetas,
  artigos,
  sessao,
}: {
  contagem: Record<string, number>;
  facetas: Facetas;
  artigos: ArtigoComAutor[];
  sessao: SessaoInfo;
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
      {/* =============================================================== MOBILE */}
      <div className="lg:hidden">
        {/* cabeçalho mobile */}
        <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}>
          <div className="min-w-0 flex-1">
            <Logo altura={26} />
          </div>
          <Link href="/artigos" className="flex items-center gap-1.5 rounded-full px-3.5" style={{ height: 36, background: C.surface, border: BORDA, color: C.ink }}>
            <Ico.doc style={{ width: 15, height: 15 }} />
            <span className="text-[13px] font-semibold">Artigos</span>
          </Link>
          <Link href="/feed" className="flex items-center gap-1.5 rounded-full px-3.5" style={{ height: 36, background: C.surface, border: BORDA, color: C.ink }}>
            <Ico.balao style={{ width: 15, height: 15 }} />
            <span className="text-[13px] font-semibold">Feed</span>
          </Link>
          {sessao.isAdmin ? (
            <Link href="/coordenacao" className="flex items-center gap-2 rounded-full px-3" style={{ height: 36, background: C.surface, border: BORDA, color: C.ink }}>
              <Ico.escudo style={{ width: 15, height: 15 }} />
              <span className="text-[13px] font-semibold">Coordenação</span>
            </Link>
          ) : sessao.primeiroNome ? (
            <Link href="/conta" className="flex items-center gap-2 rounded-full px-3.5" style={{ height: 36, background: C.surface, border: BORDA, color: C.ink }}>
              <span className="text-[13px] font-semibold">{sessao.primeiroNome}</span>
            </Link>
          ) : (
            <Link href="/entrar" className="rounded-full px-3.5 text-[13px] font-semibold" style={{ height: 36, background: C.surface, border: BORDA, color: C.ink, lineHeight: "36px" }}>
              Entrar
            </Link>
          )}
        </header>

        <div className="mx-auto max-w-2xl px-5 pt-6">
          <Eyebrow sobreFundo>Comunidade Time Holding Brasil</Eyebrow>
          <h1 className="mt-2 text-[32px] leading-[1.1]" style={{ fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            Encontre um especialista
          </h1>
          <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: C.sobreFundo }}>
            Profissionais formados e certificados pelos nossos Espaços de Instrução, em todo o Brasil.
          </p>

          <div className="mt-5">
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
            <div className="mx-auto max-w-2xl px-5 pt-2">
              <BlocoNiveis />
            </div>
            <div className="mx-auto max-w-2xl">
              <div className="flex gap-2 overflow-x-auto px-5 pb-3 pt-6" style={{ scrollbarWidth: "none" }}>
                {REGIOES.map((r) => (
                  <Chip key={r} ativo={regiao === r} onClick={() => setRegiao(r)}>
                    {r}
                  </Chip>
                ))}
              </div>
              <div className="space-y-2 px-5 pb-8">
                {estadosVisiveis.map((e) => (
                  <LinhaEstado key={e.uf} estado={e} n={contagem[e.uf] ?? 0} />
                ))}
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
        {/* barra superior */}
        <div className="flex shrink-0 items-center justify-between px-8" style={{ height: 88, borderBottom: BORDA, background: C.fundo }}>
          <Logo altura={64} />
          <div className="flex items-center gap-2">
            <Link href="/artigos" className="flex items-center gap-1.5 rounded-full px-3.5" style={{ height: 40, background: C.surface, border: BORDA, color: C.ink }}>
              <Ico.doc style={{ width: 16, height: 16 }} />
              <span className="text-[14px] font-semibold">Artigos</span>
            </Link>
            <Link href="/feed" className="flex items-center gap-1.5 rounded-full px-3.5" style={{ height: 40, background: C.surface, border: BORDA, color: C.ink }}>
              <Ico.balao style={{ width: 16, height: 16 }} />
              <span className="text-[14px] font-semibold">Feed</span>
            </Link>
            <BotaoConta sessao={sessao} />
          </div>
        </div>

        <div className="mx-auto px-10 py-12" style={{ maxWidth: 1160 }}>
          {/* seção 1 — texto+busca | mapa */}
          <div className="grid gap-12" style={{ gridTemplateColumns: "460px 1fr" }}>
            <div>
              <Eyebrow sobreFundo>Rede Nacional de Especialistas</Eyebrow>
              <h1 className="mt-2 text-[34px] leading-[1.1]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
                Encontre um especialista
              </h1>
              <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: C.sobreFundo }}>
                Profissionais formados e certificados pelos nossos Espaços de Instrução, em todo o Brasil.
              </p>
              <div className="mt-5">
                <BuscaComSugestoes facetas={facetas} />
              </div>
              <div className="mt-6">
                <BlocoNiveis />
              </div>
            </div>
            <div className="pt-1">
              <MapaBrasil contagem={contagem} onEstado={(uf) => setUfSheet(uf)} />
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
