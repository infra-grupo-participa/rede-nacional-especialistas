import Link from "next/link";
import { redirect } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { Eyebrow } from "@/components/atoms";
import { getPerfilAtual } from "@/lib/auth";
import { meusArtigos, tempoLeitura, type Artigo } from "@/lib/artigos";
import { TagStatus } from "@/components/artigo/atoms-artigo";
import { BotaoNovoArtigo } from "@/components/artigo/botao-novo-artigo";
import { dataPonto } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ORDEM: Record<Artigo["status"], number> = {
  ajustes: 0,
  rascunho: 1,
  em_analise: 2,
  publicado: 3,
};

export default async function MeusArtigosPage() {
  const perfil = await getPerfilAtual();
  if (!perfil) redirect("/entrar");
  if (perfil.status !== "aprovado") redirect("/aguardando");

  const artigos = await meusArtigos();
  const ordenados = [...artigos].sort(
    (a, b) => ORDEM[a.status] - ORDEM[b.status] || b.criado_em.localeCompare(a.criado_em),
  );
  const contar = (s: Artigo["status"]) => artigos.filter((a) => a.status === s).length;

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}>
        <Link href="/artigos" aria-label="Voltar" className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 44, color: C.ink }}>
          <Ico.back style={{ width: 21, height: 21 }} />
        </Link>
        <div className="min-w-0 flex-1 text-[13px]" style={{ color: C.sobreFundo, fontFamily: F.mono }}>
          Área do membro
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 pb-28 pt-6">
        <Eyebrow>Área do membro</Eyebrow>
        <h1 className="mt-2 text-[28px]" style={{ fontFamily: F.serif }}>
          Meus artigos
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
          {contar("publicado")} publicados · {contar("em_analise")} em análise · {contar("ajustes")} com ajustes
        </p>

        {ordenados.length === 0 ? (
          <div className="mt-6 rounded-2xl p-6 text-center" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <p className="text-[15px]" style={{ color: C.ink }}>
              Você ainda não escreveu nenhum artigo.
            </p>
            <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
              Compartilhe sua experiência com a rede — a coordenação revisa antes de publicar.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-2">
            {ordenados.map((a) => (
              <li key={a.id}>
                <Link
                  href={a.status === "publicado" ? `/artigo/${a.slug ?? a.id}` : `/editor/${a.id}`}
                  className="flex items-center gap-3 rounded-2xl p-3.5"
                  style={{ background: C.surface, border: `1px solid ${C.line}` }}
                >
                  <span className="flex shrink-0 items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: C.paper, color: C.ink }}>
                    <Ico.doc style={{ width: 18, height: 18 }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600 }}>
                      {a.titulo || "Sem título"}
                    </span>
                    <span className="block text-[12px]" style={{ color: C.muted, fontFamily: F.mono }}>
                      {dataPonto(a.criado_em)} · {tempoLeitura(a)} min
                    </span>
                  </span>
                  <TagStatus status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* rodapé fixo */}
      <div className="fixed bottom-0 left-0 right-0" style={{ background: C.fundo, borderTop: `1px solid ${C.line}` }}>
        <div className="mx-auto max-w-2xl px-5 py-3">
          <BotaoNovoArtigo full />
        </div>
      </div>
    </main>
  );
}
