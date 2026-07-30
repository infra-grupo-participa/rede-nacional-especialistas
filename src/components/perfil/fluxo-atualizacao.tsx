"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Botao, Avatar, Eyebrow } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { salvarPerfil, type PerfilInput } from "@/app/conta/actions";
import type { Perfil } from "@/lib/types";

/* Revisão do perfil por blocos: o dono confirma cada bloco (mesmo os que não
   mudaram) e só então salva. Portado do FluxoAtualizacao do MVP. */

type Campo = keyof PerfilInput;

const BLOCOS: { id: string; titulo: string; campos: [Campo, string][] }[] = [
  { id: "identificacao", titulo: "Identificação", campos: [["nome", "Nome completo"], ["profissao", "Profissão"]] },
  { id: "local", titulo: "Onde você atende", campos: [["cidade", "Cidade"], ["uf", "Estado (UF)"]] },
  { id: "formacao", titulo: "Espaço de Instrução", campos: [["espaco", "Espaço de Instrução"]] },
  { id: "contato", titulo: "Contato", campos: [["telefone", "Telefone"], ["whatsapp", "WhatsApp"], ["email", "E-mail"]] },
  { id: "redes", titulo: "Redes sociais", campos: [["instagram", "Instagram"], ["linkedin", "LinkedIn"], ["site", "Site"]] },
  { id: "sobre", titulo: "Sobre você", campos: [["bio", "Breve descrição"]] },
];

const OPCIONAIS: Campo[] = ["instagram", "linkedin", "site"];

function doPerfil(p: Perfil): PerfilInput {
  return {
    nome: p.nome ?? "",
    profissao: p.profissao ?? "",
    cidade: p.cidade ?? "",
    uf: p.uf ?? "",
    espaco: (p as unknown as { espaco?: string }).espaco ?? "",
    telefone: (p as unknown as { telefone?: string }).telefone ?? "",
    whatsapp: p.whatsapp ?? "",
    email: p.email ?? "",
    instagram: p.instagram ?? "",
    linkedin: p.linkedin ?? "",
    site: p.site ?? "",
    bio: p.bio ?? "",
  };
}

export function FluxoAtualizacao({ perfil }: { perfil: Perfil }) {
  const router = useRouter();
  const [d, setD] = useState<PerfilInput>(() => doPerfil(perfil));
  const [confirmados, setConfirmados] = useState<Record<string, boolean>>({});
  const [passo, setPasso] = useState<"revisar" | "pronto">("revisar");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const nConf = Object.values(confirmados).filter(Boolean).length;
  const tudo = nConf === BLOCOS.length;
  const primeiroNome = d.nome.split(" ")[0] || "você";

  const set = (campo: Campo, v: string) => setD((x) => ({ ...x, [campo]: v }));
  const confirmar = (id: string) => setConfirmados((c) => ({ ...c, [id]: !c[id] }));

  const salvar = () => {
    setErro(null);
    start(async () => {
      const r = await salvarPerfil(d);
      if (r.erro) setErro(r.erro);
      else setPasso("pronto");
    });
  };

  if (passo === "pronto") {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <span className="mx-auto flex items-center justify-center rounded-full" style={{ width: 64, height: 64, background: C.petrolSoft, color: C.petrolDeep }}>
          <Ico.check style={{ width: 30, height: 30 }} />
        </span>
        <h1 className="mt-4 text-[24px]" style={{ fontFamily: F.serif, fontWeight: 600 }}>
          Tudo certo, {primeiroNome}.
        </h1>
        <p className="mt-2 text-[15px]" style={{ color: C.muted }}>
          Seu perfil já aparece atualizado no diretório e a data de confirmação passou a ser hoje.
          A coordenação revisa as alterações de nome, profissão e Espaço de Instrução.
        </p>
        <div className="mt-6">
          <Botao full onClick={() => router.push(perfil.slug ? `/especialista/${perfil.slug}` : "/")}>
            Ver meu perfil
          </Botao>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 pb-28 pt-5">
      {/* cabeçalho */}
      <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: C.petrolSoft }}>
        <Avatar nome={d.nome || "?"} foto={perfil.avatar_url} size={40} />
        <div>
          <p className="text-[13px]" style={{ color: C.petrolDeep, fontFamily: F.mono }}>
            Você está editando o seu perfil
          </p>
          <p className="text-[15px]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600 }}>
            {d.nome || "Sem nome"}
          </p>
        </div>
      </div>
      <p className="mt-4 text-[14px]" style={{ color: C.muted }}>
        Revise cada bloco e confirme, mesmo os que não mudaram. É assim que o diretório se mantém
        confiável.
      </p>

      {/* blocos */}
      <div className="mt-4">
        {BLOCOS.map((b) => (
          <div key={b.id} className="py-4" style={{ borderBottom: BORDA }}>
            <h3 className="text-[16px]" style={{ fontFamily: F.serif, fontWeight: 600 }}>
              {b.titulo}
            </h3>
            <div className="mt-2 space-y-3">
              {b.campos.map(([campo, rotulo]) => (
                <label key={campo} className="block">
                  <span className="mb-1 block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}>
                    {rotulo}
                  </span>
                  {campo === "bio" ? (
                    <textarea
                      value={d[campo]}
                      onChange={(e) => set(campo, e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl px-3 py-2 text-[15px] outline-none"
                      style={{ background: C.paper, border: BORDA, color: C.ink }}
                    />
                  ) : (
                    <input
                      value={d[campo]}
                      onChange={(e) => set(campo, e.target.value)}
                      placeholder={OPCIONAIS.includes(campo) ? "opcional" : ""}
                      disabled={campo === "email"}
                      className="w-full rounded-xl px-3 text-[15px] outline-none"
                      style={{ height: 48, background: C.paper, border: BORDA, color: campo === "email" ? C.muted : C.ink }}
                    />
                  )}
                </label>
              ))}
            </div>
            <button
              onClick={() => confirmar(b.id)}
              aria-pressed={!!confirmados[b.id]}
              className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: confirmados[b.id] ? C.petrolSoft : C.paper, border: BORDA }}
            >
              <span
                className="flex items-center justify-center rounded-md"
                style={{
                  width: 22,
                  height: 22,
                  background: confirmados[b.id] ? C.petrol : "transparent",
                  border: `1px solid ${confirmados[b.id] ? C.petrol : C.line}`,
                  color: C.ink,
                }}
              >
                {confirmados[b.id] && <Ico.check style={{ width: 14, height: 14 }} />}
              </span>
              <span className="text-[14px] font-semibold" style={{ color: confirmados[b.id] ? C.petrolDeep : C.muted }}>
                Confirmo que estes dados estão corretos
              </span>
            </button>
          </div>
        ))}
      </div>

      {erro && (
        <p className="mt-3 text-[13px]" style={{ color: "#B24A42" }}>
          {erro}
        </p>
      )}

      {/* barra fixa: progresso + salvar */}
      <div className="fixed bottom-0 left-0 right-0" style={{ background: C.fundo, borderTop: BORDA }}>
        <div className="mx-auto max-w-lg px-5 py-3">
          <div className="mb-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: C.line }}>
              <div style={{ width: `${(nConf / BLOCOS.length) * 100}%`, height: "100%", background: C.petrol, transition: "width .2s" }} />
            </div>
            <span className="text-[12px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
              {nConf}/{BLOCOS.length}
            </span>
          </div>
          <Botao full onClick={salvar} disabled={!tudo || pending}>
            {tudo ? "Salvar e publicar" : "Confirme todos os blocos"}
          </Botao>
        </div>
      </div>

      <div className="mt-6">
        <Eyebrow>Área do membro</Eyebrow>
      </div>
    </div>
  );
}
