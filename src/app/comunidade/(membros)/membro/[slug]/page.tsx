import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IcoRC } from "@/comunidade/components/icones";
import { ListaPosts } from "@/comunidade/components/lista-posts";
import { SobrePerfil } from "@/comunidade/components/perfil/sobre-perfil";
import { TopoPerfil, type AbaPerfil } from "@/comunidade/components/perfil/topo-perfil";
import { lugar, mesDeAno, primeiroNome } from "@/comunidade/components/paginas/textos";
import { comPrevias, listarFeed, type PostFeed } from "@/comunidade/lib/feed";
import { configComunidade } from "@/comunidade/lib/gestao";
import { hrefMembro, membroPorSlug } from "@/comunidade/lib/grupo";
import type { DadosPerfil } from "@/comunidade/lib/perfil-tipos";
import { euDe, exigirMembro } from "@/comunidade/lib/sessao";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Uma leitura por request: o título da página e a página usam o mesmo perfil. */
const lerMembro = cache(membroPorSlug);

/** O endereço chega codificado (acento, espaço); slug malformado vira 404. */
function slugDe(bruto: string): string {
  try {
    return decodeURIComponent(bruto).trim();
  } catch {
    return "";
  }
}

const txt = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** No banco as colunas são jsonb: só entra o que tiver o formato esperado. */
function listaDeTextos(v: unknown): string[] {
  return (Array.isArray(v) ? v : []).filter((e): e is string => typeof e === "string").map((e) => e.trim()).filter(Boolean);
}
function listaDeDestaques(v: unknown): { titulo: string; texto: string }[] {
  return (Array.isArray(v) ? v : [])
    .filter((d): d is Record<string, unknown> => Boolean(d) && typeof d === "object")
    .map((d) => ({ titulo: txt(d.titulo), texto: txt(d.texto) }))
    .filter((d) => d.titulo);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await exigirMembro();
  const chave = slugDe(slug);
  const membro = chave ? await lerMembro(chave) : null;
  return { title: membro?.nome ?? "Membro" };
}

/* Perfil do membro DENTRO da comunidade, no formato do perfil do Facebook:
   capa, foto, nome, e as abas Tudo (apresentação e publicações), Sobre
   (seções; no próprio perfil é ali que se edita) e Fotos. Contato (WhatsApp,
   telefone) só aparece para o dono, na aba Sobre. */
export default async function MembroPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const perfil = await exigirMembro();
  const chave = slugDe(slug);
  const membro = chave ? await lerMembro(chave) : null;
  if (!membro) notFound();

  const ehMeu = membro.id === perfil.id;
  const aba: AbaPerfil = sp.aba === "sobre" ? "sobre" : sp.aba === "fotos" ? "fotos" : "tudo";
  const base = hrefMembro(membro);

  const [posts, config] = await Promise.all([
    aba === "sobre" ? Promise.resolve<PostFeed[]>([]) : listarFeed("novos", { autorId: membro.id, comFixados: true, limite: 60 }).then(comPrevias),
    ehMeu ? configComunidade() : Promise.resolve(null),
  ]);

  const dados: DadosPerfil = {
    nome: txt(membro.nome),
    headline: txt(membro.headline),
    bio: txt(membro.bio),
    profissao: txt(membro.profissao),
    espaco: txt(membro.espaco),
    cidade: txt(membro.cidade),
    uf: txt(membro.uf),
    instagram: txt(membro.instagram),
    linkedin: txt(membro.linkedin),
    youtube: txt(membro.youtube),
    tiktok: txt(membro.tiktok),
    facebook: txt(membro.facebook),
    site: txt(membro.site),
    especialidades: listaDeTextos(membro.especialidades),
    destaques: listaDeDestaques(membro.destaques),
    // contato: só o dono recebe (vem do perfil da sessão, não da leitura pública)
    whatsapp: ehMeu ? txt(perfil.whatsapp) : "",
    telefone: ehMeu ? txt(perfil.telefone) : "",
  };

  const onde = lugar(membro);
  const linha = [dados.headline || dados.profissao, onde].filter(Boolean).join(" · ");
  // todas as fotos de cada post, na ordem
  const fotos = posts.flatMap((p) => p.imagens.map((url) => ({ id: p.id, url })));
  const nome1 = primeiroNome(membro.nome);

  return (
    <main className="rc-perfil">
      <TopoPerfil
        base={base}
        aba={aba}
        ehMeu={ehMeu}
        nome={membro.nome}
        avatar={membro.avatar_url || null}
        capa={txt(membro.capa_url)}
        corCapa={txt(membro.cor_capa)}
        verificado={Boolean(membro.verificado)}
        qualificacao={membro.qualificacao}
        daCoordenacao={membro.papel === "admin"}
        linha={linha}
        eu={ehMeu ? euDe(perfil) : undefined}
        hashtags={config?.hashtags}
        exigirHashtag={config?.exigir_hashtag}
      />

      <div className="rc-perfil-miolo rc-perfil-corpo">
        {aba === "sobre" && <SobrePerfil dados={dados} ehMeu={ehMeu} secaoInicial={typeof sp.secao === "string" ? sp.secao : undefined} />}

        {aba === "fotos" && (
          <section className="rc-cartao rc-perfil-cartao">
            <h2 className="rc-cartao-titulo">Fotos</h2>
            {fotos.length === 0 ? (
              <p className="rc-perfil-vazio">{ehMeu ? "As fotos dos seus posts aparecem aqui." : `${nome1} ainda não publicou fotos.`}</p>
            ) : (
              <div className="rc-perfil-fotos rc-perfil-fotos-todas">
                {fotos.map((p) => (
                  <Link key={p.url} href={`/comunidade/post/${p.id}`} aria-label="Abrir o post desta foto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" loading="lazy" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {aba === "tudo" && (
          <div className="rc-perfil-colunas">
            <div className="rc-perfil-lateral">
              <section className="rc-cartao rc-perfil-cartao">
                <h2 className="rc-cartao-titulo">Apresentação</h2>
                {dados.bio ? <p className="rc-perfil-bio">{dados.bio}</p> : ehMeu ? <p className="rc-perfil-vazio">Conte aos colegas quem é você e com o que trabalha.</p> : null}
                <ul className="rc-perfil-detalhes">
                  {dados.profissao && (
                    <li>
                      <IcoRC.maleta /> {dados.profissao}
                    </li>
                  )}
                  {onde && (
                    <li>
                      <IcoRC.local /> {onde}
                    </li>
                  )}
                  <li>
                    <IcoRC.calendario />
                    {membro.tem_conta ? `Na Rede desde ${mesDeAno(membro.criado_em)}` : "Ainda não criou a conta na Rede"}
                  </li>
                </ul>
                {dados.especialidades.length > 0 && (
                  <ul className="rc-sobre-chips rc-perfil-chips" aria-label="Especialidades">
                    {dados.especialidades.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
                {ehMeu ? (
                  <Link href={`${base}?aba=sobre`} className="rc-btn rc-btn-neutro rc-btn-bloco" scroll={false}>
                    Editar apresentação
                  </Link>
                ) : (
                  <Link href={`${base}?aba=sobre`} className="rc-btn rc-btn-neutro rc-btn-bloco" scroll={false}>
                    Ver mais sobre {nome1}
                  </Link>
                )}
              </section>

              {fotos.length > 0 && (
                <section className="rc-cartao rc-perfil-cartao">
                  <div className="rc-perfil-cartao-topo">
                    <h2 className="rc-cartao-titulo">Fotos</h2>
                    <Link href={`${base}?aba=fotos`} scroll={false}>
                      Ver todas as fotos
                    </Link>
                  </div>
                  <div className="rc-perfil-fotos">
                    {fotos.slice(0, 9).map((p) => (
                      <Link key={p.url} href={`/comunidade/post/${p.id}`} aria-label="Abrir o post desta foto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt="" loading="lazy" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="rc-perfil-posts">
              <h2 className="rc-perfil-titulo-secao">Publicações</h2>
              <ListaPosts posts={posts} eu={euDe(perfil)} vazio={ehMeu ? "Você ainda não publicou. Use o botão Criar post." : `${nome1} ainda não publicou.`} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
