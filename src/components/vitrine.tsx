"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { Chip } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { MapaBrasil } from "@/components/mapa-brasil";
import { LinhaEstado } from "@/components/linha-estado";
import { ESTADOS, REGIOES, type Regiao } from "@/lib/estados";

export interface SessaoInfo {
  nome: string | null;
  primeiroNome: string | null;
  isAdmin: boolean;
  aprovado: boolean;
}

export function Vitrine({
  contagem,
  sessao,
}: {
  contagem: Record<string, number>;
  sessao: SessaoInfo;
}) {
  const router = useRouter();
  const [regiao, setRegiao] = useState<Regiao | "Todos">("Todos");
  const [busca, setBusca] = useState("");

  const total = useMemo(
    () => Object.values(contagem).reduce((a, b) => a + b, 0),
    [contagem],
  );

  const estadosVisiveis = useMemo(() => {
    const base =
      regiao === "Todos" ? ESTADOS : ESTADOS.filter((e) => e.regiao === regiao);
    return [...base].sort((a, b) => {
      const na = contagem[a.uf] ?? 0;
      const nb = contagem[b.uf] ?? 0;
      return nb - na || a.nome.localeCompare(b.nome);
    });
  }, [regiao, contagem]);

  const submeterBusca = (e: React.FormEvent) => {
    e.preventDefault();
    const q = busca.trim();
    if (q) router.push(`/buscar?q=${encodeURIComponent(q)}`);
  };

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      {/* cabeçalho */}
      <header
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}
      >
        <div className="min-w-0 flex-1">
          <span
            className="text-[18px] font-semibold"
            style={{ color: C.ink, fontFamily: F.serif, letterSpacing: "-0.01em" }}
          >
            Rede Nacional
          </span>
        </div>
        {sessao.isAdmin ? (
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-full px-3"
            style={{ height: 36, background: C.surface, color: C.ink }}
          >
            <Ico.escudo style={{ width: 15, height: 15 }} />
            <span className="text-[13px] font-semibold">Coordenação</span>
          </Link>
        ) : sessao.primeiroNome ? (
          <Link
            href="/conta"
            className="flex items-center gap-2 rounded-full px-3.5"
            style={{ height: 36, background: C.surface, color: C.ink }}
          >
            <span className="text-[13px] font-semibold">{sessao.primeiroNome}</span>
          </Link>
        ) : (
          <Link
            href="/entrar"
            className="rounded-full px-3.5 text-[13px] font-semibold"
            style={{ height: 36, background: C.surface, color: C.ink, lineHeight: "36px" }}
          >
            Entrar
          </Link>
        )}
      </header>

      <div className="mx-auto max-w-2xl px-5 pt-6">
        <p
          className="uppercase"
          style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: ".14em", color: C.sobreFundo }}
        >
          Comunidade Time Holding Brasil
        </p>
        <h1 className="mt-2 text-[32px] leading-[1.1]" style={{ fontFamily: F.serif }}>
          Especialistas de todo o Brasil
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: C.sobreFundo }}>
          {total} {total === 1 ? "membro" : "membros"} na rede. Toque no seu estado no mapa
          para ver quem está por perto e falar direto no WhatsApp.
        </p>

        {/* busca */}
        <form onSubmit={submeterBusca} className="relative mt-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.muted }}>
            <Ico.busca style={{ width: 18, height: 18 }} />
          </span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, cidade ou profissão"
            className="w-full rounded-2xl pl-11 pr-4 text-[15px] outline-none"
            style={{ height: 52, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}
            aria-label="Buscar especialistas"
          />
        </form>
      </div>

      {/* mapa */}
      <div className="mx-auto max-w-2xl px-5 pt-6">
        <div className="rounded-3xl p-4" style={{ background: C.surface }}>
          <MapaBrasil contagem={contagem} />
        </div>
      </div>

      {/* filtro de região */}
      <div className="mx-auto max-w-2xl">
        <div
          className="flex gap-2 overflow-x-auto px-5 pb-3 pt-5"
          style={{ scrollbarWidth: "none" }}
        >
          {REGIOES.map((r) => (
            <Chip key={r} ativo={regiao === r} onClick={() => setRegiao(r)}>
              {r}
            </Chip>
          ))}
        </div>

        {/* grade de estados */}
        <div className="space-y-2 px-5 pb-16">
          {estadosVisiveis.map((e) => (
            <LinhaEstado key={e.uf} estado={e} n={contagem[e.uf] ?? 0} />
          ))}
        </div>
      </div>
    </main>
  );
}
