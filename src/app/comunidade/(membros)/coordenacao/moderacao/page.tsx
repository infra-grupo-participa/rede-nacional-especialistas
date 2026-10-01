import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { exigirAdminPagina } from "@/comunidade/lib/admin";
import { contadoresCoordenacao, palavrasModeracao, postsPorStatus } from "@/comunidade/lib/gestao";
import { CabecalhoCoordenacao, Caixa } from "@/comunidade/components/coordenacao/cabecalho";
import { CartaoRetido, ListaPalavras } from "@/comunidade/components/coordenacao/moderacao";

export const dynamic = "force-dynamic";

/* Moderação automática: posts retidos por palavra-chave (fila de aprovação) e
   a lista de palavras. Trava de comentários e destaque ficam no próprio post
   (menu da coordenação no feed). */
export default async function ModeracaoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigirAdminPagina();
  const sp = await searchParams;
  const aba = sp.aba === "recusados" ? "recusados" : "retidos";
  const [posts, palavras, contadores] = await Promise.all([
    postsPorStatus(aba === "recusados" ? "recusado" : "pendente"),
    palavrasModeracao(),
    contadoresCoordenacao(),
  ]);

  return (
    <main>
      <CabecalhoCoordenacao ativa="moderacao" contadores={contadores} />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 pt-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-[28px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 700 }}>
            Posts retidos
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: C.muted }}>
            Posts com palavra da lista ao lado não vão ao ar: esperam aqui. O autor vê que o post está em análise.
          </p>
          <div className="mt-4 flex gap-2">
            {[
              { id: "retidos", rotulo: `Aguardando (${contadores.retidos})`, href: "/comunidade/coordenacao/moderacao" },
              { id: "recusados", rotulo: "Recusados", href: "/comunidade/coordenacao/moderacao?aba=recusados" },
            ].map((a) => (
              <Link
                key={a.id}
                href={a.href}
                className="press rounded-full px-4 text-[14px] font-semibold"
                style={{
                  height: 38,
                  lineHeight: "38px",
                  background: aba === a.id ? C.ink : C.surface,
                  color: aba === a.id ? C.fundo : C.ink,
                  border: `1px solid ${aba === a.id ? C.ink : C.line}`,
                }}
              >
                {a.rotulo}
              </Link>
            ))}
          </div>
          {posts.length === 0 ? (
            <Caixa className="mt-4 text-center">
              <p className="text-[15px]">{aba === "retidos" ? "Nenhum post aguardando." : "Nenhum post recusado."}</p>
            </Caixa>
          ) : (
            <ul className="mt-4 space-y-3">
              {posts.map((p) => (
                <CartaoRetido key={p.id} post={p} decidido={aba === "recusados"} />
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-4">
          <Caixa>
            <h2 className="text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
              Palavras que mandam para aprovação
            </h2>
            <p className="mb-3 mt-1 text-[13px]" style={{ color: C.muted }}>
              Casamento por palavra inteira, sem acento e sem maiúscula: &quot;pix&quot; pega &quot;PIX&quot; e &quot;Pix!&quot;, mas não &quot;pixel&quot;.
              Só a coordenação vê a lista.
            </p>
            <ListaPalavras palavras={palavras} />
          </Caixa>
          <Caixa>
            <h2 className="text-[16px] font-semibold" style={{ fontFamily: F.serif }}>
              Travar comentários e fixar
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
              No feed, cada post tem o escudo da moderação: fixar em destaque, travar ou liberar comentários e remover. A regra da #
              (travar automático quem posta sem hashtag) se liga na aba{" "}
              <Link href="/comunidade/coordenacao/regras" className="font-semibold" style={{ color: C.petrolDeep }}>
                Regras
              </Link>
              .
            </p>
          </Caixa>
        </aside>
      </div>
    </main>
  );
}
