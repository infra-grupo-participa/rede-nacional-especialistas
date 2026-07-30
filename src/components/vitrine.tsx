"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Chip, Segmentado } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { Logo } from "@/components/logo";
import { MapaBrasil } from "@/components/mapa-brasil";
import { SheetEstado } from "@/components/sheet-estado";
import { LinhaEstado } from "@/components/linha-estado";
import { BuscaComSugestoes } from "@/components/busca-sugestoes";
import { BlocoNiveis } from "@/components/bloco-niveis";
import { BlocoNewsletter } from "@/components/bloco-newsletter";
import { PainelArtigos } from "@/components/artigo/painel-artigos";
import { Rodape } from "@/components/rodape";
import { ESTADOS, REGIOES, type Regiao } from "@/lib/estados";
import type { Facetas } from "@/lib/queries";
import type { ArtigoComAutor } from "@/lib/artigos";

export interface SessaoInfo {
  nome: string | null;
  primeiroNome: string | null;
  isAdmin: boolean;
  aprovado: boolean;
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

  const total = useMemo(
    () => Object.values(contagem).reduce((a, b) => a + b, 0),
    [contagem],
  );

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
      {/* cabeçalho */}
      <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}>
        <div className="min-w-0 flex-1">
          <Logo altura={26} />
        </div>
        <Link href="/artigos" className="flex items-center gap-1.5 rounded-full px-3.5" style={{ height: 36, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}>
          <Ico.doc style={{ width: 15, height: 15 }} />
          <span className="text-[13px] font-semibold">Artigos</span>
        </Link>
        <Link href="/feed" className="flex items-center gap-1.5 rounded-full px-3.5" style={{ height: 36, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}>
          <Ico.balao style={{ width: 15, height: 15 }} />
          <span className="text-[13px] font-semibold">Feed</span>
        </Link>
        {sessao.isAdmin ? (
          <Link href="/coordenacao" className="flex items-center gap-2 rounded-full px-3" style={{ height: 36, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}>
            <Ico.escudo style={{ width: 15, height: 15 }} />
            <span className="text-[13px] font-semibold">Coordenação</span>
          </Link>
        ) : sessao.primeiroNome ? (
          <Link href="/conta" className="flex items-center gap-2 rounded-full px-3.5" style={{ height: 36, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}>
            <span className="text-[13px] font-semibold">{sessao.primeiroNome}</span>
          </Link>
        ) : (
          <Link href="/entrar" className="rounded-full px-3.5 text-[13px] font-semibold" style={{ height: 36, background: C.surface, border: `1px solid ${C.line}`, color: C.ink, lineHeight: "36px" }}>
            Entrar
          </Link>
        )}
      </header>

      <div className="mx-auto max-w-2xl px-5 pt-6">
        <p className="uppercase" style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: ".14em", color: C.sobreFundo }}>
          Comunidade Time Holding Brasil
        </p>
        <h1 className="mt-2 text-[32px] leading-[1.1]" style={{ fontFamily: F.serif }}>
          Especialistas de todo o Brasil
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: C.sobreFundo }}>
          {total} {total === 1 ? "membro" : "membros"} na rede. Toque no seu estado no mapa
          para ver quem está por perto e falar direto no WhatsApp.
        </p>

        {/* busca com sugestões */}
        <div className="mt-5">
          <BuscaComSugestoes facetas={facetas} />
        </div>

        {/* segmentado profissionais / artigos */}
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
          {/* mapa */}
          <div className="mx-auto max-w-2xl px-5 pt-5">
            <div className="rounded-3xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
              <MapaBrasil contagem={contagem} onEstado={(uf) => setUfSheet(uf)} />
            </div>
          </div>

          {/* níveis */}
          <div className="mx-auto max-w-2xl px-5 pt-6">
            <BlocoNiveis />
          </div>

          {/* filtro de região */}
          <div className="mx-auto max-w-2xl">
            <div className="flex gap-2 overflow-x-auto px-5 pb-3 pt-6" style={{ scrollbarWidth: "none" }}>
              {REGIOES.map((r) => (
                <Chip key={r} ativo={regiao === r} onClick={() => setRegiao(r)}>
                  {r}
                </Chip>
              ))}
            </div>

            {/* grade de estados */}
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

      {/* newsletter */}
      <div className="mx-auto max-w-2xl px-5 pb-12 pt-4">
        <BlocoNewsletter />
      </div>

      <Rodape />

      {/* folha do estado ao tocar no mapa (key p/ remontar limpo por estado) */}
      <SheetEstado key={ufSheet ?? "none"} uf={ufSheet} onFechar={() => setUfSheet(null)} />
    </main>
  );
}
