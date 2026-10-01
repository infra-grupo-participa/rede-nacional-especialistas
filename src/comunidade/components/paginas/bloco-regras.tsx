import Link from "next/link";
import { ListaRegras } from "@/comunidade/components/paginas/lista-regras";
import { diaPorExtenso } from "@/comunidade/components/paginas/textos";
import { interpretarRegras } from "@/comunidade/lib/regras";
import type { ConfigComunidade } from "@/comunidade/lib/gestao";

/* Cartão "Regras da coordenação para o grupo": a lista que abre e fecha, as
   hashtags dos temas e a data da última alteração. Serve na aba Sobre (dentro
   do grupo) e na página pública das regras (quem ainda vai pedir entrada).
   `comLinks` liga cada hashtag à busca do grupo: só para quem está dentro. */
export function BlocoRegras({ config, comLinks = false }: { config: ConfigComunidade; comLinks?: boolean }) {
  const regras = interpretarRegras(config.regras);

  return (
    <section id="regras" className="rc-cartao rc-pg-bloco rc-pg-regras-ancora" aria-labelledby="regras-titulo">
      <div className="rc-pg-bloco-topo">
        <h2 id="regras-titulo" className="rc-cartao-titulo">
          Regras da coordenação para o grupo
        </h2>
      </div>

      {regras.length === 0 ? (
        <p className="rc-pg-texto-apoio">A coordenação ainda não publicou as regras.</p>
      ) : (
        <ListaRegras regras={regras} />
      )}

      {config.hashtags.length > 0 && (
        <>
          <hr className="rc-pg-fio" />
          <h3 className="rc-pg-subtitulo">Hashtags dos temas</h3>
          <p className="rc-pg-nota" style={{ marginTop: 4 }}>
            {config.exigir_hashtag
              ? "Comece o post com uma delas. Post sem a hashtag do tema fica com os comentários travados."
              : "Use a hashtag do tema no começo do post para facilitar a busca."}
          </p>
          <ul className="rc-pg-chips">
            {config.hashtags.map((h) => (
              <li key={h}>
                {comLinks ? (
                  <Link href={`/comunidade/busca?q=${encodeURIComponent(`#${h}`)}`} className="rc-pg-chip rc-pg-chip-tema" title={`Ver os posts com #${h}`}>
                    #{h}
                  </Link>
                ) : (
                  <span className="rc-pg-chip rc-pg-chip-tema">#{h}</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {config.atualizado_em && regras.length > 0 && (
        <p className="rc-pg-nota" style={{ marginTop: 16 }}>
          Atualizadas em {diaPorExtenso(config.atualizado_em)}.
        </p>
      )}
    </section>
  );
}
