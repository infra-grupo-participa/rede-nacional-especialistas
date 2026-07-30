import Link from "next/link";
import { notFound } from "next/navigation";
import { perfilPorSlug } from "@/lib/queries";
import { artigosDoAutor } from "@/lib/artigos";
import { getPerfilAtual } from "@/lib/auth";
import { C, F, BORDA } from "@/lib/tokens";
import { Avatar, Botao, Placa, Tag, Eyebrow } from "@/components/atoms";
import { SeloNivel } from "@/components/niveis";
import { Ico } from "@/components/icons";
import { LinhaEditorial } from "@/components/artigo/cartoes";
import { DockWhatsapp } from "@/components/perfil/dock-whatsapp";
import { RodapePerfil } from "@/components/perfil/rodape-perfil";
import { fone, waLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

/* Linha de contato — fiel ao MVP (App.jsx 1684). */
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
        <span className="block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums", letterSpacing: ".1em" }}>
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

export default async function EspecialistaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [m, sessao] = await Promise.all([perfilPorSlug(slug), getPerfilAtual()]);
  if (!m) notFound();
  const artigos = await artigosDoAutor(m.id);
  const primeiroNome = m.nome.split(" ")[0];
  const ehMeuPerfil = sessao?.id === m.id;

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}>
        <Link href={m.uf ? `/estado/${m.uf}` : "/"} aria-label="Voltar" className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 44, color: C.ink }}>
          <Ico.back style={{ width: 21, height: 21 }} />
        </Link>
        <div className="min-w-0 flex-1 text-[13px]" style={{ color: C.sobreFundo, fontFamily: F.mono }}>
          Perfil
        </div>
      </div>

      <div className="relative mx-auto max-w-2xl" style={{ paddingBottom: 100 }}>
        {/* identidade — direto sobre o branco, SEM capa (fiel ao MVP) */}
        <div className="px-5 pt-6 text-center">
          <div className="flex justify-center">
            <Avatar nome={m.nome} foto={m.avatar_url} size={104} />
          </div>
          <h1 className="mt-4 text-[27px] leading-tight" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
            {m.nome}
          </h1>
          {m.profissao && (
            <p className="mt-1 text-[16px] font-semibold" style={{ color: C.ink }}>
              {m.profissao}
            </p>
          )}
          <p className="mt-1.5 flex items-center justify-center gap-2 text-[14px]" style={{ color: C.sobreFundo }}>
            {m.cidade}
            {m.uf && <Placa uf={m.uf} size="sm" tom="escuro" />}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <SeloNivel q={m.qualificacao} tamanho="lg" />
            {m.espaco && <Tag>{m.espaco}</Tag>}
            {m.certificado && <Tag tom="brass">✓ Certificado</Tag>}
          </div>
          {m.bio && (
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed" style={{ color: C.sobreFundo }}>
              {m.bio}
            </p>
          )}
        </div>

        {/* CTA WhatsApp */}
        {m.whatsapp && (
          <div id="cta-whatsapp" className="px-5 pt-5">
            <Botao full variante="whats" href={waLink(m.whatsapp, m.nome)} icone={<Ico.wa style={{ width: 19, height: 19 }} />}>
              Falar no WhatsApp
            </Botao>
          </div>
        )}

        {/* contato */}
        <div className="px-4 pt-5">
          <div className="rounded-2xl px-4 py-3" style={{ background: C.surface, border: BORDA }}>
            <Eyebrow className="pb-1">Contato</Eyebrow>
            <div style={{ borderTop: `1px solid ${C.line}` }} className="divide-y">
              <LinhaContato icone={<Ico.tel style={{ width: 18, height: 18 }} />} rotulo="Telefone" valor={fone(m.telefone || m.whatsapp)} href={`tel:+55${(m.telefone || m.whatsapp).replace(/\D/g, "")}`} />
              {m.email && <LinhaContato icone={<Ico.mail style={{ width: 18, height: 18 }} />} rotulo="E-mail" valor={m.email} href={`mailto:${m.email}`} />}
              {m.instagram && <LinhaContato icone={<Ico.ig style={{ width: 18, height: 18 }} />} rotulo="Instagram" valor={m.instagram} href={`https://instagram.com/${m.instagram.replace("@", "")}`} />}
              {m.linkedin && <LinhaContato icone={<Ico.li style={{ width: 17, height: 17 }} />} rotulo="LinkedIn" valor={m.linkedin} href={`https://linkedin.com/${m.linkedin}`} />}
              {m.site && <LinhaContato icone={<Ico.site style={{ width: 18, height: 18 }} />} rotulo="Site" valor={m.site} href={`https://${m.site.replace(/^https?:\/\//, "")}`} />}
            </div>
          </div>
        </div>

        {/* artigos do autor */}
        {artigos.length > 0 && (
          <div className="px-4 pt-5">
            <Eyebrow className="px-1 pb-2.5" sobreFundo>
              Artigos publicados
            </Eyebrow>
            <div className="space-y-2.5">
              {artigos.slice(0, 2).map((a) => (
                <LinhaEditorial key={a.id} a={a} />
              ))}
              {artigos.length > 2 && (
                <Link href={`/especialista/${m.slug ?? m.id}/artigos`} className="block w-full rounded-2xl py-3.5 text-center text-[14px] font-semibold" style={{ background: C.surface, color: C.ink, border: BORDA }}>
                  + artigos de {primeiroNome} ({artigos.length} no total)
                </Link>
              )}
            </div>
          </div>
        )}

        {/* rodapé */}
        <RodapePerfil email={m.email} atualizadoEm={m.atualizado_em} ehMeuPerfil={ehMeuPerfil} />
      </div>

      {/* dock flutuante de WhatsApp no mobile */}
      {m.whatsapp && <DockWhatsapp whatsapp={m.whatsapp} nome={m.nome} anchorId="cta-whatsapp" />}
    </main>
  );
}
