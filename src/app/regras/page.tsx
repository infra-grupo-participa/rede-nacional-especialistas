import type { Metadata } from "next";
import { C, F, BORDA } from "@/lib/tokens";
import { TopNav } from "@/components/topnav";
import { Eyebrow } from "@/components/atoms";
import { getSessaoNav } from "@/lib/auth";
import { configComunidade } from "@/lib/gestao";
import { dataCurta } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Regras da comunidade · Rede Nacional de Especialistas",
};

/* Regras do grupo (base da moderação). Texto editado pela coordenação em
   /coordenacao/regras; cada linha vira um item. Pública de propósito: quem
   pede entrada precisa ler antes de aceitar. */
export default async function RegrasPage() {
  const [nav, cfg] = await Promise.all([getSessaoNav(), configComunidade()]);
  const linhas = cfg.regras
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <TopNav sessao={nav} voltar="/feed" />
      <div className="mx-auto max-w-2xl px-5 pb-20 pt-8">
        <Eyebrow>Comunidade THB</Eyebrow>
        <h1 className="mt-2 text-[30px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 700 }}>
          Regras da comunidade
        </h1>
        <p className="mt-2 text-[15px]" style={{ color: C.muted }}>
          A moderação usa estas regras para reter, travar ou remover publicações.
        </p>

        {linhas.length === 0 ? (
          <p className="mt-8 text-[15px]" style={{ color: C.muted }}>
            A coordenação ainda não publicou as regras.
          </p>
        ) : (
          <ol className="mt-6 space-y-2.5">
            {linhas.map((l, i) => (
              <li key={i} className="rounded-2xl px-4 py-3.5 text-[16px] leading-relaxed" style={{ background: C.surface, border: BORDA }}>
                {l}
              </li>
            ))}
          </ol>
        )}

        {cfg.hashtags.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[18px]" style={{ fontFamily: F.serif, fontWeight: 700 }}>
              Hashtags dos temas
            </h2>
            <p className="mt-1 text-[14px]" style={{ color: C.muted }}>
              {cfg.exigir_hashtag
                ? "Comece o post com uma delas. Post sem a hashtag do tema tem os comentários travados."
                : "Use a hashtag do tema no começo do post para facilitar a busca."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cfg.hashtags.map((h) => (
                <span key={h} className="rounded-full px-3 py-1 text-[14px] font-semibold" style={{ background: C.petrolSoft, color: C.petrolDeep }}>
                  #{h}
                </span>
              ))}
            </div>
          </section>
        )}

        {cfg.atualizado_em && (
          <p className="mt-10 text-[12px]" style={{ color: C.muted, fontFamily: F.mono }}>
            Atualizadas em {dataCurta(cfg.atualizado_em)}
          </p>
        )}
      </div>
    </main>
  );
}
