"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F } from "@/lib/tokens";
import { Botao, Eyebrow } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { Capa, Chapeu, BlocosLidos } from "@/components/artigo/atoms-artigo";
import { CampoImagem } from "@/components/artigo/campo-imagem";
import { salvarRascunho, enviarArtigo } from "@/app/artigos/actions";
import { STATUS_META, tempoLeitura, type Artigo, type Bloco } from "@/lib/artigos-tipos";

const TIPOS_BLOCO: { tipo: Bloco["tipo"]; rotulo: string }[] = [
  { tipo: "h2", rotulo: "Subtítulo" },
  { tipo: "paragrafo", rotulo: "Parágrafo" },
  { tipo: "imagem", rotulo: "Imagem" },
  { tipo: "citacao", rotulo: "Citação" },
];

interface AutorInfo {
  nome: string;
  avatar_url: string;
  profissao: string;
}

export function Editor({ artigo, autor }: { artigo: Artigo; autor: AutorInfo }) {
  const router = useRouter();
  const [d, setD] = useState<Artigo>(artigo);
  const [previa, setPrevia] = useState(false);
  const [validando, setValidando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof Artigo>(campo: K, v: Artigo[K]) =>
    setD((x) => ({ ...x, [campo]: v }));

  const mudarBloco = (id: string, campo: keyof Bloco, v: string) =>
    setD((x) => ({ ...x, blocos: x.blocos.map((b) => (b.id === id ? { ...b, [campo]: v } : b)) }));
  const removerBloco = (id: string) =>
    setD((x) => ({ ...x, blocos: x.blocos.filter((b) => b.id !== id) }));
  const moverBloco = (id: string, dir: -1 | 1) =>
    setD((x) => {
      const i = x.blocos.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= x.blocos.length) return x;
      const blocos = [...x.blocos];
      [blocos[i], blocos[j]] = [blocos[j], blocos[i]];
      return { ...x, blocos };
    });
  const addBloco = (tipo: Bloco["tipo"]) =>
    setD((x) => ({ ...x, blocos: [...x.blocos, { id: `b-${Date.now()}`, tipo, texto: "", url: "", legenda: "" }] }));

  const temTexto = d.blocos.some((b) => b.tipo !== "imagem" && (b.texto ?? "").trim().length > 20);
  const erros: string[] = [];
  if (!d.titulo.trim()) erros.push("Escreva o título do artigo.");
  if (!d.resumo.trim()) erros.push("Escreva a linha fina — é ela que aparece na lista.");
  if (!temTexto) erros.push("O artigo precisa de pelo menos um parágrafo com conteúdo.");

  const payload = () => ({ id: d.id, titulo: d.titulo, chapeu: d.chapeu, resumo: d.resumo, capa: d.capa, blocos: d.blocos });

  const salvar = () => {
    setErro(null);
    start(async () => {
      const r = await salvarRascunho(payload());
      if (r.erro) setErro(r.erro);
      else setMsg("Rascunho salvo");
    });
  };
  const enviar = () => {
    if (erros.length) {
      setValidando(true);
      return;
    }
    setErro(null);
    start(async () => {
      const r = await enviarArtigo(payload());
      if (r.erro) setErro(r.erro);
      else router.push("/meus-artigos");
    });
  };

  return (
    <main className="flex min-h-[100dvh] flex-col" style={{ background: C.fundo, color: C.ink }}>
      <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}>
        <button onClick={() => router.push("/meus-artigos")} aria-label="Voltar" className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 44, color: C.ink }}>
          <Ico.back style={{ width: 21, height: 21 }} />
        </button>
        <div className="min-w-0 flex-1 text-[13px]" style={{ color: C.sobreFundo, fontFamily: F.mono }}>
          Editor
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-5 pt-4">
          {/* devolutiva de ajustes — via tokens STATUS */}
          {d.status === "ajustes" && d.motivo && (
            <div className="mb-4 rounded-2xl p-4" style={{ background: STATUS_META.ajustes.bg }}>
              <p className="text-[11px] uppercase" style={{ color: STATUS_META.ajustes.fg, fontFamily: F.mono, letterSpacing: ".1em" }}>
                A coordenação pediu ajustes
              </p>
              <p className="mt-1 text-[14px]" style={{ color: STATUS_META.ajustes.fg }}>
                {d.motivo}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pb-3">
            <Eyebrow>Modelo 1 · Newsletter</Eyebrow>
            <button
              onClick={() => setPrevia((p) => !p)}
              className="ml-auto rounded-full px-3 text-[13px] font-semibold"
              style={{ height: 34, background: previa ? C.petrol : C.petrolSoft, color: previa ? "#fff" : C.petrol }}
            >
              {previa ? "Voltar a editar" : "Ver como vai ficar"}
            </button>
          </div>

          {previa ? (
            <div>
              <Capa titulo={d.titulo} capa={d.capa} variante="alta" />
              <div className="mt-5">
                <Chapeu>{d.chapeu.trim() || autor.profissao || "Artigo"}</Chapeu>
              </div>
              <h1 className="mt-1.5 text-[26px] leading-[1.15]" style={{ color: C.ink, fontFamily: F.serif, fontWeight: 600, letterSpacing: "-0.018em" }}>
                {d.titulo || "Sem título"}
              </h1>
              {d.resumo && (
                <p className="mt-3 text-[17px] leading-relaxed" style={{ color: C.muted }}>
                  {d.resumo}
                </p>
              )}
              <p className="mt-3 text-[12px]" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
                {autor.nome} · {tempoLeitura(d)} min de leitura
              </p>
              <div className="mt-2" style={{ borderTop: `1px solid ${C.line}` }} />
              <BlocosLidos blocos={d.blocos} />
            </div>
          ) : (
            <>
              <CampoImagem tipo="capa" valor={d.capa} rotulo="Imagem de capa" onMudar={(url) => set("capa", url)} />

              <label className="mt-4 block">
                <span className="mb-1.5 block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums", letterSpacing: ".1em" }}>
                  Chapéu
                </span>
                <input
                  value={d.chapeu || ""}
                  onChange={(e) => set("chapeu", e.target.value)}
                  placeholder="duas ou três palavras que situam o leitor"
                  className="w-full rounded-xl px-3.5 text-[15px] outline-none"
                  style={{ height: 48, background: C.paper, border: `1px solid ${C.line}`, color: C.ink }}
                />
                <span className="mt-1.5 block text-[12px]" style={{ color: C.muted }}>
                  Aparece acima do título na listagem. Se ficar vazio, entra a sua área de atuação.
                </span>
              </label>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums", letterSpacing: ".1em" }}>
                  Título (H1)
                </span>
                <textarea
                  value={d.titulo}
                  onChange={(e) => set("titulo", e.target.value)}
                  rows={2}
                  placeholder="O título do seu artigo"
                  className="w-full rounded-xl px-3.5 py-2.5 outline-none"
                  style={{ background: C.paper, border: `1px solid ${validando && !d.titulo.trim() ? "#C0524A" : C.line}`, color: C.ink, resize: "none", fontFamily: F.serif, fontWeight: 600, fontSize: 20, lineHeight: 1.25, letterSpacing: "-0.018em" }}
                />
              </label>

              <label className="mt-3 block">
                <span className="mb-1.5 block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums", letterSpacing: ".1em" }}>
                  Linha fina
                </span>
                <textarea
                  value={d.resumo}
                  onChange={(e) => set("resumo", e.target.value)}
                  rows={2}
                  placeholder="Uma ou duas frases que resumem o artigo"
                  className="w-full rounded-xl px-3.5 py-2.5 text-[15px] outline-none"
                  style={{ background: C.paper, border: `1px solid ${validando && !d.resumo.trim() ? "#C0524A" : C.line}`, color: C.ink, resize: "none" }}
                />
              </label>

              <div className="mt-6" style={{ borderTop: `1px solid ${C.line}` }}>
                <Eyebrow className="pt-4">Conteúdo</Eyebrow>
                {d.blocos.map((b, i) => (
                  <BlocoEditor key={b.id} b={b} indice={i} total={d.blocos.length} onMudar={mudarBloco} onMover={moverBloco} onRemover={removerBloco} />
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 pb-4">
                {TIPOS_BLOCO.map((t) => (
                  <button
                    key={t.tipo}
                    onClick={() => addBloco(t.tipo)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold"
                    style={{ height: 38, background: C.petrolSoft, color: C.petrol }}
                  >
                    <Ico.mais style={{ width: 14, height: 14 }} /> {t.rotulo}
                  </button>
                ))}
              </div>
            </>
          )}

          {msg && (
            <p className="pb-2 text-[13px]" style={{ color: "#14504B" }}>
              {msg}
            </p>
          )}
        </div>
      </div>

      {/* barra de ação */}
      <div className="px-5 pb-5 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
        {((validando && erros.length > 0) || erro) && (
          <p className="mb-2 text-[13px] leading-relaxed" style={{ color: "#B24A42" }}>
            {erro ?? erros[0]}
          </p>
        )}
        <div className="mx-auto flex max-w-2xl gap-3">
          <button
            onClick={salvar}
            disabled={pending}
            className="rounded-xl px-5 text-[15px] font-semibold"
            style={{ height: 52, color: C.ink, border: `1px solid ${C.line}` }}
          >
            Salvar
          </button>
          <div className="flex-1">
            <Botao full onClick={enviar} disabled={pending}>
              Enviar para aprovação
            </Botao>
          </div>
        </div>
        <p className="mt-2.5 text-center text-[12px]" style={{ color: C.muted }}>
          O artigo só fica visível no diretório depois que a coordenação aprovar.
        </p>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------- BlocoEditor -- */
/* Fiel ao MVP (App.jsx 2205): bloco em paper SEM borda; campos internos em surface;
   botões mover/apagar transparentes só ícone (muted / vermelho). */
function BlocoEditor({
  b,
  indice,
  total,
  onMudar,
  onMover,
  onRemover,
}: {
  b: Bloco;
  indice: number;
  total: number;
  onMudar: (id: string, campo: keyof Bloco, v: string) => void;
  onMover: (id: string, dir: -1 | 1) => void;
  onRemover: (id: string) => void;
}) {
  const rotulo = TIPOS_BLOCO.find((t) => t.tipo === b.tipo)?.rotulo ?? b.tipo;
  const campoCls = "w-full rounded-lg px-3 py-2.5 text-[15px] outline-none";
  const campoStyle = { background: C.surface, border: `1px solid ${C.line}`, color: C.ink, resize: "none" as const };

  return (
    <div className="mt-3 rounded-xl p-3" style={{ background: C.paper }}>
      <div className="flex items-center gap-2 pb-2">
        <span className="text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, fontVariantNumeric: "tabular-nums", letterSpacing: ".1em" }}>
          {rotulo}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => onMover(b.id, -1)} disabled={indice === 0} aria-label="Mover para cima" className="flex items-center justify-center rounded-lg" style={{ width: 34, height: 34, color: C.muted, opacity: indice === 0 ? 0.3 : 1 }}>
            <Ico.cima style={{ width: 16, height: 16 }} />
          </button>
          <button onClick={() => onMover(b.id, 1)} disabled={indice === total - 1} aria-label="Mover para baixo" className="flex items-center justify-center rounded-lg" style={{ width: 34, height: 34, color: C.muted, opacity: indice === total - 1 ? 0.3 : 1 }}>
            <Ico.baixo style={{ width: 16, height: 16 }} />
          </button>
          <button onClick={() => onRemover(b.id)} aria-label="Remover bloco" className="flex items-center justify-center rounded-lg" style={{ width: 34, height: 34, color: "#B24A42" }}>
            <Ico.lixo style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {b.tipo === "imagem" ? (
        <>
          <CampoImagem tipo="bloco" valor={b.url ?? ""} rotulo="Arquivo" onMudar={(url) => onMudar(b.id, "url", url)} />
          <input
            value={b.legenda ?? ""}
            onChange={(e) => onMudar(b.id, "legenda", e.target.value)}
            placeholder="Legenda (opcional)"
            className={`${campoCls} mt-2`}
            style={{ ...campoStyle, height: 44 }}
          />
        </>
      ) : b.tipo === "h2" ? (
        <input
          value={b.texto ?? ""}
          onChange={(e) => onMudar(b.id, "texto", e.target.value)}
          placeholder="Título da seção"
          className={campoCls}
          style={{ ...campoStyle, height: 46, fontFamily: F.serif, fontWeight: 600, fontSize: 17 }}
        />
      ) : (
        <textarea
          value={b.texto ?? ""}
          onChange={(e) => onMudar(b.id, "texto", e.target.value)}
          rows={b.tipo === "citacao" ? 2 : 5}
          placeholder={b.tipo === "citacao" ? "Uma frase que resume a ideia" : "Escreva o parágrafo"}
          className={campoCls}
          style={campoStyle}
        />
      )}
    </div>
  );
}
