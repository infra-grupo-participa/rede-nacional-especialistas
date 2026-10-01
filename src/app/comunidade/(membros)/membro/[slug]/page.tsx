import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, SeloVerificado, TagNivel } from "@/comunidade/components/atoms";
import { IcoRC } from "@/comunidade/components/icones";
import { ListaPosts } from "@/comunidade/components/lista-posts";
import { CapaPadrao } from "@/comunidade/components/paginas/capa-padrao";
import { lugar, mesDeAno, primeiroNome } from "@/comunidade/components/paginas/textos";
import { comPrevias, listarFeed } from "@/comunidade/lib/feed";
import { membroPorSlug } from "@/comunidade/lib/grupo";
import { euDe, exigirMembro } from "@/comunidade/lib/sessao";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await exigirMembro();
  const chave = slugDe(slug);
  const membro = chave ? await lerMembro(chave) : null;
  return { title: membro?.nome ?? "Membro" };
}

/* Perfil do membro DENTRO da comunidade: quem é e o que publicou no grupo.
   Contato (e-mail, WhatsApp, telefone) não aparece aqui. */
export default async function MembroPage({ params }: Props) {
  const { slug } = await params;
  const perfil = await exigirMembro();
  const chave = slugDe(slug);
  const membro = chave ? await lerMembro(chave) : null;
  if (!membro) notFound();

  const posts = await comPrevias(await listarFeed("novos", { autorId: membro.id, comFixados: true, limite: 60 }));
  const eu = euDe(perfil);
  const ehMeu = membro.id === perfil.id;
  const linha = membro.headline?.trim() || membro.profissao?.trim() || "";
  const onde = lugar(membro);
  // No banco a coluna é jsonb: só entra o que for lista de textos.
  const especialidades = (Array.isArray(membro.especialidades) ? membro.especialidades : [])
    .filter((e): e is string => typeof e === "string")
    .map((e) => e.trim())
    .filter(Boolean);
  const bio = membro.bio?.trim() ?? "";
  const daCoordenacao = membro.papel === "admin";
  const capa = membro.capa_url?.trim() ?? "";

  return (
    <main className="rc-pg">
      <div className="rc-pg-coluna">
        <article className="rc-cartao rc-pg-perfil">
          <div className="rc-pg-perfil-capa">
            {capa ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={capa} alt="" />
            ) : (
              <CapaPadrao />
            )}
          </div>
          <div className="rc-pg-perfil-corpo">
            <div className="rc-pg-perfil-topo">
              <span className="rc-pg-perfil-foto">
                <Avatar nome={membro.nome} foto={membro.avatar_url} size={120} />
              </span>
              {ehMeu && (
                <Link href="/comunidade/editar-perfil" className="rc-btn rc-btn-neutro">
                  <IcoRC.lapis /> Editar meu perfil
                </Link>
              )}
            </div>

            <h1 className="rc-pg-perfil-nome">
              <span>{membro.nome}</span>
              {membro.verificado && <SeloVerificado size="lg" />}
              <TagNivel qualificacao={membro.qualificacao} size="md" />
              {daCoordenacao && (
                <span className="rc-pg-selo-coord">
                  <IcoRC.escudo /> Coordenação
                </span>
              )}
            </h1>
            {linha && <p className="rc-pg-perfil-linha">{linha}</p>}

            <ul className="rc-pg-perfil-meta">
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

            {bio && <p className="rc-pg-perfil-bio">{bio}</p>}

            {especialidades.length > 0 && (
              <ul className="rc-pg-chips" aria-label="Especialidades" style={{ marginTop: 14 }}>
                {especialidades.map((e) => (
                  <li key={e} className="rc-pg-chip">
                    {e}
                  </li>
                ))}
              </ul>
            )}

          </div>
        </article>

        <h2 className="rc-pg-secao-titulo">Publicações</h2>
        <ListaPosts posts={posts} eu={eu} vazio={`${primeiroNome(membro.nome)} ainda não publicou.`} />
      </div>
    </main>
  );
}
