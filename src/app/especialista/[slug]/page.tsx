import Link from "next/link";
import { notFound } from "next/navigation";
import { perfilPorSlug } from "@/lib/queries";
import { artigosDoAutor } from "@/lib/artigos";
import { C, F } from "@/lib/tokens";
import { Avatar, Botao, Placa, Tag, TagNivel, Eyebrow } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { LinhaEditorial } from "@/components/artigo/cartoes";
import { DockWhatsapp } from "@/components/perfil/dock-whatsapp";
import { fone, mesAno, waLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
  const conteudo = (
    <>
      <span
        className="flex shrink-0 items-center justify-center rounded-xl"
        style={{ width: 40, height: 40, background: C.paper, color: C.ink }}
      >
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block text-[11px] uppercase"
          style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}
        >
          {rotulo}
        </span>
        <span className="block truncate text-[15px]" style={{ color: C.ink }}>
          {valor}
        </span>
      </span>
    </>
  );
  const cls = "flex w-full items-center gap-3 py-2.5 text-left";
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {conteudo}
    </a>
  ) : (
    <div className={cls}>{conteudo}</div>
  );
}

export default async function EspecialistaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = await perfilPorSlug(slug);
  if (!m) notFound();
  const artigos = await artigosDoAutor(m.id);
  const primeiroNome = m.nome.split(" ")[0];

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}
      >
        <Link
          href={m.uf ? `/estado/${m.uf}` : "/"}
          aria-label="Voltar"
          className="flex shrink-0 items-center justify-center"
          style={{ width: 44, height: 44, color: C.ink }}
        >
          <Ico.back style={{ width: 21, height: 21 }} />
        </Link>
        <div className="min-w-0 flex-1 text-[13px]" style={{ color: C.sobreFundo, fontFamily: F.mono }}>
          Perfil
        </div>
      </div>

      <div className="mx-auto max-w-2xl pb-16">
        {/* capa */}
        <div
          style={{
            height: 150,
            background: m.capa_url
              ? `center/cover no-repeat url(${m.capa_url})`
              : `linear-gradient(135deg, ${C.ink}, ${C.laranja})`,
          }}
        />

        {/* identidade */}
        <div className="px-5 text-center" style={{ marginTop: -52 }}>
          <div className="flex justify-center">
            <span
              className="rounded-full"
              style={{ padding: 4, background: C.fundo, borderRadius: 999 }}
            >
              <Avatar nome={m.nome} foto={m.avatar_url} size={104} />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <h1 className="text-[27px] leading-tight" style={{ color: C.ink, fontFamily: F.serif }}>
              {m.nome}
            </h1>
            <TagNivel qualificacao={m.qualificacao} />
          </div>
          {m.profissao && (
            <p className="mt-1 text-[16px] font-semibold" style={{ color: C.ink }}>
              {m.profissao}
            </p>
          )}
          <p
            className="mt-1.5 flex items-center justify-center gap-2 text-[14px]"
            style={{ color: C.sobreFundo }}
          >
            {m.cidade}
            {m.uf && <Placa uf={m.uf} size="sm" tom="escuro" />}
          </p>

          {/* selos: espaço + certificado */}
          {(m.espaco || m.certificado) && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {m.espaco && <Tag>{m.espaco}</Tag>}
              {m.certificado && <Tag tom="brass">✓ Certificado</Tag>}
            </div>
          )}

          {m.bio && (
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed" style={{ color: C.sobreFundo }}>
              {m.bio}
            </p>
          )}
        </div>

        {/* whatsapp */}
        {m.whatsapp && (
          <div id="cta-whatsapp" className="px-5 pt-5">
            <Botao
              full
              variante="whats"
              href={waLink(m.whatsapp, m.nome)}
              icone={<Ico.wa style={{ width: 19, height: 19 }} />}
            >
              Falar no WhatsApp
            </Botao>
          </div>
        )}

        {/* contato */}
        <div className="px-4 pt-5">
          <div className="rounded-2xl px-4 py-3" style={{ background: C.surface }}>
            <Eyebrow className="pb-1">Contato</Eyebrow>
            <div style={{ borderTop: `1px solid ${C.line}` }} className="divide-y">
              <LinhaContato
                icone={<Ico.tel style={{ width: 18, height: 18 }} />}
                rotulo="WhatsApp"
                valor={fone(m.whatsapp)}
                href={waLink(m.whatsapp, m.nome)}
              />
              {m.telefone && m.telefone !== m.whatsapp && (
                <LinhaContato
                  icone={<Ico.tel style={{ width: 18, height: 18 }} />}
                  rotulo="Telefone"
                  valor={fone(m.telefone)}
                  href={`tel:+55${m.telefone.replace(/\D/g, "")}`}
                />
              )}
              {m.email && (
                <LinhaContato
                  icone={<Ico.mail style={{ width: 18, height: 18 }} />}
                  rotulo="E-mail"
                  valor={m.email}
                  href={`mailto:${m.email}`}
                />
              )}
              {m.instagram && (
                <LinhaContato
                  icone={<Ico.ig style={{ width: 18, height: 18 }} />}
                  rotulo="Instagram"
                  valor={m.instagram}
                  href={`https://instagram.com/${m.instagram.replace("@", "")}`}
                />
              )}
              {m.linkedin && (
                <LinhaContato
                  icone={<Ico.li style={{ width: 17, height: 17 }} />}
                  rotulo="LinkedIn"
                  valor={m.linkedin}
                  href={`https://linkedin.com/${m.linkedin}`}
                />
              )}
              {m.site && (
                <LinhaContato
                  icone={<Ico.site style={{ width: 18, height: 18 }} />}
                  rotulo="Site"
                  valor={m.site}
                  href={`https://${m.site.replace(/^https?:\/\//, "")}`}
                />
              )}
            </div>
          </div>
        </div>

        {/* artigos do autor */}
        {artigos.length > 0 && (
          <div className="px-4 pt-6">
            <Eyebrow className="pb-2">Artigos publicados</Eyebrow>
            <div className="space-y-3">
              {artigos.slice(0, 3).map((a) => (
                <LinhaEditorial key={a.id} a={a} />
              ))}
            </div>
            {artigos.length > 3 && (
              <p className="mt-3 text-center text-[13px]" style={{ color: C.muted }}>
                {primeiroNome} tem {artigos.length} artigos publicados.
              </p>
            )}
          </div>
        )}

        <div className="px-4 pt-5">
          <div className="rounded-2xl p-4" style={{ background: C.surface }}>
            <p className="text-[13px]" style={{ color: C.muted }}>
              Perfil atualizado em{" "}
              <span style={{ fontFamily: F.mono, color: C.ink }}>{mesAno(m.atualizado_em)}</span>.
            </p>
            <div className="mt-2">
              <Tag tom="brass">Membro da Comunidade THB</Tag>
            </div>
          </div>
        </div>
      </div>

      {/* dock flutuante de WhatsApp no mobile */}
      {m.whatsapp && <DockWhatsapp whatsapp={m.whatsapp} nome={m.nome} anchorId="cta-whatsapp" />}
    </main>
  );
}
