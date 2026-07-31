import Link from "next/link";
import { notFound } from "next/navigation";
import { perfilPorSlug, estatisticasPerfil } from "@/lib/queries";
import { postsDoAutor } from "@/lib/feed";
import { artigosDoAutor } from "@/lib/artigos";
import { getPerfilAtual } from "@/lib/auth";
import { rotuloProfissao } from "@/lib/profissoes-permitidas";
import { C, F, BORDA } from "@/lib/tokens";
import { Avatar, Botao, Placa, Tag, Eyebrow } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { LinhaEditorial } from "@/components/artigo/cartoes";
import { DockWhatsapp } from "@/components/perfil/dock-whatsapp";
import { RodapePerfil } from "@/components/perfil/rodape-perfil";
import { RedesSociais } from "@/components/perfil/redes-sociais";
import { BarraStats } from "@/components/perfil/barra-stats";
import { PostsDoPerfil } from "@/components/perfil/posts-do-perfil";
import { fone, waLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

/* Capa do perfil: imagem, cor/gradiente escolhido, ou o gradiente padrão da marca. */
function fundoCapa(capa_url: string, cor: string): React.CSSProperties {
  if (capa_url) return { background: `center/cover no-repeat url(${capa_url})` };
  if (cor) return { background: cor };
  return { background: `linear-gradient(120deg, ${C.ink} 0%, ${C.petrolDeep} 60%, ${C.laranja} 100%)` };
}

function LinhaContato({
  icone,
  rotulo,
  valor,
  href,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
  href?: string;
}) {
  if (!valor) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-3 py-2.5 text-left">
      <span className="flex shrink-0 items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: C.paper, color: C.ink }}>
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}>
          {rotulo}
        </span>
        <span className="block truncate text-[15px]" style={{ color: C.ink }}>
          {valor}
        </span>
      </span>
      <Ico.chevron style={{ width: 16, height: 16, color: C.line, flexShrink: 0 }} />
    </a>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="px-4 pt-4">
      <div className="rounded-2xl p-4" style={{ background: C.surface, border: BORDA }}>
        <Eyebrow className="pb-2">{titulo}</Eyebrow>
        {children}
      </div>
    </div>
  );
}

export default async function EspecialistaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [m, sessao] = await Promise.all([perfilPorSlug(slug), getPerfilAtual()]);
  if (!m) notFound();
  const [artigos, stats, posts] = await Promise.all([
    artigosDoAutor(m.id),
    estatisticasPerfil(m.id),
    postsDoAutor(m.id),
  ]);
  const primeiroNome = m.nome.split(" ")[0];
  const ehMeuPerfil = sessao?.id === m.id;
  const perfilIncompleto = ehMeuPerfil && !m.bio && !m.headline;
  const prof = rotuloProfissao(m.profissao);
  const especialidades = Array.isArray(m.especialidades) ? m.especialidades : [];
  const destaques = Array.isArray(m.destaques) ? m.destaques : [];

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      {/* topo fixo minimalista */}
      <div className="sticky top-0 z-20 flex items-center gap-2 px-4 py-3" style={{ background: "var(--fundo-blur)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}` }}>
        <Link href={m.uf ? `/estado/${m.uf}` : "/"} aria-label="Voltar" className="press flex shrink-0 items-center justify-center rounded-full" style={{ width: 40, height: 40, color: C.ink, background: C.surface, border: BORDA }}>
          <Ico.back style={{ width: 20, height: 20 }} />
        </Link>
        <div className="min-w-0 flex-1 truncate text-[14px] font-semibold" style={{ color: C.ink, fontFamily: F.serif }}>
          {m.nome}
        </div>
      </div>

      <div className="relative mx-auto max-w-2xl" style={{ paddingBottom: 100 }}>
        {/* CAPA */}
        <div style={{ height: 160, ...fundoCapa(m.capa_url, m.cor_capa) }} />

        {/* identidade sobreposta à capa (estilo LinkedIn) */}
        <div className="px-5">
          <div className="flex items-end justify-between" style={{ marginTop: -48 }}>
            <span className="rounded-full" style={{ padding: 4, background: C.fundo }}>
              <Avatar nome={m.nome} foto={m.avatar_url} size={104} />
            </span>
            {ehMeuPerfil && (
              <Link href="/conta" className="press mb-2 inline-flex items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold" style={{ height: 38, background: C.surface, border: BORDA, color: C.ink }}>
                <Ico.lapis style={{ width: 14, height: 14 }} /> Editar perfil
              </Link>
            )}
          </div>

          <h1 className="mt-3 text-[26px] leading-tight" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            {m.nome}
          </h1>
          {m.headline ? (
            <p className="mt-1 text-[15px] leading-snug" style={{ color: C.ink }}>
              {m.headline}
            </p>
          ) : (
            m.profissao && (
              <p className="mt-1 text-[15px] font-semibold" style={{ color: C.petrolDeep }}>
                {prof}
              </p>
            )
          )}
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[14px]" style={{ color: C.sobreFundo }}>
            {m.cidade && (
              <span className="inline-flex items-center gap-1.5">
                {m.uf && <Placa uf={m.uf} size="sm" tom="escuro" />}
                {m.cidade}
              </span>
            )}
            {m.espaco && <Tag>{m.espaco}</Tag>}
            {m.certificado && (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold" style={{ background: C.brassSoft, color: C.brass, border: "1px solid #EADFCE" }}>
                <Ico.selo style={{ width: 12, height: 12 }} /> Certificado
              </span>
            )}
          </p>

          {/* redes sociais (linktree) */}
          <div className="mt-3">
            <RedesSociais perfil={m} />
          </div>
        </div>

        {/* aviso: você está vendo sua prévia pública (como os outros veem) */}
        {ehMeuPerfil && (
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5" style={{ background: C.petrolSoft, border: `1px solid ${C.petrolDeep}22` }}>
              <Ico.olho style={{ width: 16, height: 16, color: C.petrolDeep, flexShrink: 0 }} />
              <span className="text-[13px] leading-snug" style={{ color: C.petrolDeep }}>
                Esta é a sua <strong>prévia pública</strong> — é assim que os outros especialistas veem o seu perfil.
              </span>
            </div>
          </div>
        )}

        {/* CTA: complete bio/headline para encorpar o perfil e a vitrine */}
        {perfilIncompleto && (
          <div className="px-4 pt-3">
            <Link href="/conta" className="press flex items-center gap-3 rounded-xl px-3.5 py-3" style={{ background: C.brassSoft, border: "1px solid #EADFCE" }}>
              <Ico.lapis style={{ width: 16, height: 16, color: C.brass, flexShrink: 0 }} />
              <span className="min-w-0 flex-1 text-[13px] leading-snug" style={{ color: C.brass }}>
                Seu perfil está sem <strong>apresentação</strong>. Adicione um resumo e uma frase de destaque para aparecer melhor na vitrine.
              </span>
              <Ico.chevron style={{ width: 15, height: 15, color: C.brass, flexShrink: 0 }} />
            </Link>
          </div>
        )}

        {/* stats */}
        <div className="px-4 pt-4">
          <BarraStats stats={stats} />
        </div>

        {/* CTA WhatsApp */}
        {m.whatsapp && (
          <div id="cta-whatsapp" className="px-4 pt-4">
            <Botao full variante="whats" href={waLink(m.whatsapp, m.nome)} icone={<Ico.wa style={{ width: 19, height: 19 }} />}>
              Falar no WhatsApp
            </Botao>
          </div>
        )}

        {/* Sobre */}
        {m.bio && (
          <Secao titulo="Sobre">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed" style={{ color: C.ink }}>
              {m.bio}
            </p>
          </Secao>
        )}

        {/* Especialidades */}
        {especialidades.length > 0 && (
          <Secao titulo="Especialidades">
            <div className="flex flex-wrap gap-2">
              {especialidades.map((e, i) => (
                <span key={i} className="rounded-full px-3 py-1 text-[13px] font-semibold" style={{ background: C.petrolSoft, color: C.petrolDeep }}>
                  {e}
                </span>
              ))}
            </div>
          </Secao>
        )}

        {/* Destaques */}
        {destaques.length > 0 && (
          <Secao titulo="Destaques">
            <div className="space-y-3">
              {destaques.map((d, i) => (
                <div key={i} className="flex gap-3">
                  <span className="mt-0.5 flex shrink-0 items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: C.petrolSoft, color: C.petrolDeep }}>
                    <Ico.troféu style={{ width: 17, height: 17 }} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold" style={{ color: C.ink }}>{d.titulo}</p>
                    {d.texto && <p className="text-[13px] leading-snug" style={{ color: C.muted }}>{d.texto}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Secao>
        )}

        {/* contato */}
        <Secao titulo="Contato">
          <div style={{ borderTop: `1px solid ${C.line}` }} className="divide-y">
            <LinhaContato icone={<Ico.tel style={{ width: 18, height: 18 }} />} rotulo="Telefone" valor={fone(m.telefone || m.whatsapp)} href={`tel:+55${(m.telefone || m.whatsapp).replace(/\D/g, "")}`} />
            {m.email && <LinhaContato icone={<Ico.mail style={{ width: 18, height: 18 }} />} rotulo="E-mail" valor={m.email} href={`mailto:${m.email}`} />}
          </div>
        </Secao>

        {/* histórico de publicações do autor (feed do perfil) */}
        <div className="px-4 pt-5">
          <Eyebrow className="px-1 pb-2.5" sobreFundo>
            Publicações de {primeiroNome}
          </Eyebrow>
          <PostsDoPerfil posts={posts} primeiroNome={primeiroNome} />
        </div>

        {/* artigos do autor */}
        {artigos.length > 0 && (
          <div className="px-4 pt-4">
            <Eyebrow className="px-1 pb-2.5" sobreFundo>
              Artigos de {primeiroNome}
            </Eyebrow>
            <div className="space-y-2.5">
              {artigos.slice(0, 3).map((a) => (
                <LinhaEditorial key={a.id} a={a} />
              ))}
              {artigos.length > 3 && (
                <Link href={`/especialista/${m.slug ?? m.id}/artigos`} className="press block w-full rounded-2xl py-3.5 text-center text-[14px] font-semibold" style={{ background: C.surface, color: C.ink, border: BORDA }}>
                  Ver todos os {artigos.length} artigos
                </Link>
              )}
            </div>
          </div>
        )}

        {/* rodapé */}
        <RodapePerfil email={m.email} atualizadoEm={m.atualizado_em} ehMeuPerfil={ehMeuPerfil} />
      </div>

      {m.whatsapp && <DockWhatsapp whatsapp={m.whatsapp} nome={m.nome} anchorId="cta-whatsapp" />}
    </main>
  );
}
