"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Botao, Eyebrow, Avatar } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { CampoImagem } from "@/components/artigo/campo-imagem";
import { salvarPerfil, type PerfilInput, type Destaque } from "@/app/conta/actions";
import type { Perfil } from "@/lib/types";

/* Editor de perfil rico (estilo LinkedIn): capa, avatar, headline, redes,
   especialidades (tags) e destaques. Tudo do próprio dono. */

function Campo({
  rotulo,
  valor,
  onChange,
  placeholder,
  textarea,
  dica,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  dica?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}>
        {rotulo}
      </span>
      {textarea ? (
        <textarea
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full resize-none rounded-xl px-3.5 py-2.5 text-[15px] outline-none"
          style={{ background: C.paper, border: BORDA, color: C.ink }}
        />
      ) : (
        <input
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl px-3.5 text-[15px] outline-none"
          style={{ height: 48, background: C.paper, border: BORDA, color: C.ink }}
        />
      )}
      {dica && <span className="mt-1 block text-[12px]" style={{ color: C.muted }}>{dica}</span>}
    </label>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: C.surface, border: BORDA }}>
      <Eyebrow className="pb-3">{titulo}</Eyebrow>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function EditorPerfil({ perfil }: { perfil: Perfil }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState(false);

  const [d, setD] = useState<PerfilInput>({
    nome: perfil.nome ?? "",
    profissao: perfil.profissao ?? "",
    headline: perfil.headline ?? "",
    cidade: perfil.cidade ?? "",
    uf: perfil.uf ?? "",
    espaco: perfil.espaco ?? "",
    telefone: perfil.telefone ?? "",
    whatsapp: perfil.whatsapp ?? "",
    email: perfil.email ?? "",
    instagram: perfil.instagram ?? "",
    linkedin: perfil.linkedin ?? "",
    youtube: perfil.youtube ?? "",
    tiktok: perfil.tiktok ?? "",
    facebook: perfil.facebook ?? "",
    site: perfil.site ?? "",
    bio: perfil.bio ?? "",
    avatar_url: perfil.avatar_url ?? "",
    capa_url: perfil.capa_url ?? "",
    cor_capa: perfil.cor_capa ?? "",
    especialidades: Array.isArray(perfil.especialidades) ? perfil.especialidades : [],
    destaques: Array.isArray(perfil.destaques) ? perfil.destaques : [],
  });

  const set = <K extends keyof PerfilInput>(k: K, v: PerfilInput[K]) => setD((x) => ({ ...x, [k]: v }));

  const [novaEsp, setNovaEsp] = useState("");
  const addEsp = () => {
    const e = novaEsp.trim();
    if (e && !d.especialidades.includes(e) && d.especialidades.length < 12) {
      set("especialidades", [...d.especialidades, e]);
    }
    setNovaEsp("");
  };
  const rmEsp = (i: number) => set("especialidades", d.especialidades.filter((_, x) => x !== i));

  const setDest = (i: number, campo: keyof Destaque, v: string) =>
    set("destaques", d.destaques.map((dd, x) => (x === i ? { ...dd, [campo]: v } : dd)));
  const addDest = () => d.destaques.length < 8 && set("destaques", [...d.destaques, { titulo: "", texto: "" }]);
  const rmDest = (i: number) => set("destaques", d.destaques.filter((_, x) => x !== i));

  const salvar = () => {
    setErro(null);
    setOkMsg(false);
    start(async () => {
      const r = await salvarPerfil(d);
      if (r.erro) setErro(r.erro);
      else {
        setOkMsg(true);
        router.refresh();
      }
    });
  };

  const CORES_CAPA = [
    `linear-gradient(120deg, ${C.ink} 0%, ${C.petrolDeep} 60%, ${C.laranja} 100%)`,
    `linear-gradient(120deg, ${C.laranja}, #FFD0A6)`,
    `linear-gradient(120deg, #0C3550, #2F7DE1)`,
    `linear-gradient(120deg, #14504B, #1AA6D8)`,
    C.ink,
  ];

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-4 space-y-3">
      {/* CAPA + AVATAR */}
      <Bloco titulo="Capa e foto">
        <span className="mb-1 block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}>
          Capa
        </span>
        <CampoImagem tipo="perfilcapa" valor={d.capa_url} onMudar={(u) => set("capa_url", u)} />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[12px]" style={{ color: C.muted }}>Ou uma cor:</span>
          {CORES_CAPA.map((cor) => (
            <button
              key={cor}
              onClick={() => { set("cor_capa", cor); set("capa_url", ""); }}
              aria-label="Escolher cor de capa"
              className="h-7 w-10 rounded-md"
              style={{ background: cor, border: d.cor_capa === cor && !d.capa_url ? `2px solid ${C.ink}` : BORDA }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Avatar nome={d.nome || "?"} foto={d.avatar_url} size={64} />
          <div className="flex-1">
            <CampoImagem tipo="avatar" valor={d.avatar_url} rotulo="Foto de perfil" onMudar={(u) => set("avatar_url", u)} />
          </div>
        </div>
      </Bloco>

      {/* IDENTIDADE */}
      <Bloco titulo="Identificação">
        <Campo rotulo="Nome completo" valor={d.nome} onChange={(v) => set("nome", v)} placeholder="Seu nome" />
        <Campo rotulo="Título / headline" valor={d.headline} onChange={(v) => set("headline", v)} placeholder="Ex.: Advogado especialista em holding familiar" dica="Aparece sob o seu nome, como no LinkedIn." />
        <Campo rotulo="Profissão" valor={d.profissao} onChange={(v) => set("profissao", v)} placeholder="Advogado / Contador" />
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2"><Campo rotulo="Cidade" valor={d.cidade} onChange={(v) => set("cidade", v)} /></div>
          <Campo rotulo="UF" valor={d.uf} onChange={(v) => set("uf", v.toUpperCase().slice(0, 2))} />
        </div>
        <Campo rotulo="Espaço de Instrução" valor={d.espaco} onChange={(v) => set("espaco", v)} />
      </Bloco>

      {/* SOBRE */}
      <Bloco titulo="Sobre você">
        <Campo rotulo="Bio" valor={d.bio} onChange={(v) => set("bio", v)} textarea placeholder="Conte sua trajetória, áreas de atuação, o que te diferencia…" />
      </Bloco>

      {/* ESPECIALIDADES */}
      <Bloco titulo="Especialidades">
        <div className="flex flex-wrap gap-2">
          {d.especialidades.map((e, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold" style={{ background: C.petrolSoft, color: C.petrolDeep }}>
              {e}
              <button onClick={() => rmEsp(i)} aria-label={`Remover ${e}`} style={{ color: C.petrolDeep }}>
                <Ico.x style={{ width: 13, height: 13 }} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={novaEsp}
            onChange={(e) => setNovaEsp(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEsp(); } }}
            placeholder="Ex.: Holding, Sucessão, Tributário…"
            className="flex-1 rounded-xl px-3.5 text-[14px] outline-none"
            style={{ height: 44, background: C.paper, border: BORDA, color: C.ink }}
          />
          <button onClick={addEsp} className="press rounded-xl px-4 text-[14px] font-semibold" style={{ height: 44, background: C.laranja, color: C.ink }}>
            Adicionar
          </button>
        </div>
      </Bloco>

      {/* DESTAQUES */}
      <Bloco titulo="Destaques">
        {d.destaques.map((dd, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: C.paper, border: BORDA }}>
            <div className="flex items-center gap-2">
              <input
                value={dd.titulo}
                onChange={(e) => setDest(i, "titulo", e.target.value)}
                placeholder="Título do destaque (ex.: 10 anos de atuação)"
                className="flex-1 rounded-lg px-3 text-[14px] outline-none"
                style={{ height: 40, background: C.surface, border: BORDA, color: C.ink }}
              />
              <button onClick={() => rmDest(i)} aria-label="Remover destaque" style={{ color: "#B24A42" }}>
                <Ico.lixo style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <input
              value={dd.texto}
              onChange={(e) => setDest(i, "texto", e.target.value)}
              placeholder="Descrição (opcional)"
              className="mt-2 w-full rounded-lg px-3 text-[13px] outline-none"
              style={{ height: 38, background: C.surface, border: BORDA, color: C.ink }}
            />
          </div>
        ))}
        {d.destaques.length < 8 && (
          <button onClick={addDest} className="press inline-flex items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold" style={{ height: 38, background: C.petrolSoft, color: C.petrolDeep }}>
            <Ico.mais style={{ width: 14, height: 14 }} /> Adicionar destaque
          </button>
        )}
      </Bloco>

      {/* CONTATO */}
      <Bloco titulo="Contato">
        <Campo rotulo="WhatsApp" valor={d.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="(11) 99999-9999" />
        <Campo rotulo="Telefone" valor={d.telefone} onChange={(v) => set("telefone", v)} />
      </Bloco>

      {/* REDES */}
      <Bloco titulo="Redes sociais">
        <Campo rotulo="Instagram" valor={d.instagram} onChange={(v) => set("instagram", v)} placeholder="@seuperfil" />
        <Campo rotulo="LinkedIn" valor={d.linkedin} onChange={(v) => set("linkedin", v)} placeholder="in/seu-perfil" />
        <Campo rotulo="YouTube" valor={d.youtube} onChange={(v) => set("youtube", v)} placeholder="@seucanal ou URL" />
        <Campo rotulo="TikTok" valor={d.tiktok} onChange={(v) => set("tiktok", v)} placeholder="@seuperfil" />
        <Campo rotulo="Facebook" valor={d.facebook} onChange={(v) => set("facebook", v)} placeholder="seu.perfil ou URL" />
        <Campo rotulo="Site" valor={d.site} onChange={(v) => set("site", v)} placeholder="seusite.com.br" />
      </Bloco>

      {erro && <p className="text-[13px]" style={{ color: "#B24A42" }}>{erro}</p>}
      {okMsg && <p className="text-[13px]" style={{ color: "#14504B" }}>Perfil atualizado!</p>}

      {/* barra fixa */}
      <div className="fixed bottom-0 left-0 right-0" style={{ background: C.fundo, borderTop: BORDA }}>
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          {perfil.slug && (
            <a href={`/especialista/${perfil.slug}`} className="press rounded-xl px-4 text-[14px] font-semibold" style={{ height: 52, lineHeight: "52px", color: C.ink, border: BORDA }}>
              Ver meu perfil
            </a>
          )}
          <div className="flex-1">
            <Botao full onClick={salvar} disabled={pending}>
              {pending ? "Salvando…" : "Salvar alterações"}
            </Botao>
          </div>
        </div>
      </div>
    </div>
  );
}
