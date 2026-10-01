import type { Metadata } from "next";
import { C, F, BORDA } from "@/lib/tokens";
import Link from "next/link";
import { CascaMembros } from "@/comunidade/components/casca";
import { Eyebrow } from "@/comunidade/components/atoms";
import { getPerfilAtual } from "@/comunidade/lib/sessao";
import { configComunidade } from "@/comunidade/lib/gestao";
import { dataCurta } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Regras da comunidade",
};

/* Regras do grupo (base da moderação). Texto editado pela coordenação em
   /coordenacao/regras; cada linha vira um item. Pública de propósito: quem
   pede entrada precisa ler antes de aceitar. */
export default async function RegrasPage() {
  const [perfil, cfg] = await Promise.all([getPerfilAtual(), configComunidade()]);
  const linhas = cfg.regras
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const conteudo = (
      <div className="mx-auto max-w-2xl px-5 pb-20 pt-8">
        <Eyebrow>Rede de Especialistas</Eyebrow>
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
  );

  // Membro aprovado lê as regras dentro da comunidade (aba Regras).
  if (perfil?.status === "aprovado") {
    return (
      <CascaMembros perfil={perfil}>
        <main>{conteudo}</main>
      </CascaMembros>
    );
  }

  // Visitante ou quem ainda espera a aprovação: página simples, com a volta.
  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <header className="flex items-center gap-3 px-4" style={{ height: 56, background: C.surface, borderBottom: BORDA }}>
        <Link href={perfil ? "/comunidade/aguardando" : "/comunidade/entrar"} className="flex items-center gap-2.5" style={{ color: C.ink }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/thb-logo.png" alt="Time Holding Brasil" style={{ height: 38, width: "auto" }} />
          <span style={{ fontFamily: F.serif, fontWeight: 800, fontSize: 15.5, letterSpacing: "-0.015em" }}>Rede de Especialistas</span>
        </Link>
        <Link
          href={perfil ? "/comunidade/aguardando" : "/comunidade/entrar"}
          className="press ml-auto rounded-full px-4 text-[14px] font-semibold"
          style={{ height: 38, lineHeight: "38px", background: C.laranja, color: "#0E0E0E" }}
        >
          {perfil ? "Meu pedido de entrada" : "Entrar"}
        </Link>
      </header>
      {conteudo}
    </main>
  );
}
