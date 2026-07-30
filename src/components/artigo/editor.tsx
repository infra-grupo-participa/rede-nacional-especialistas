"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Botao, Eyebrow, Avatar } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { Capa, Chapeu, BlocosLidos } from "@/components/artigo/atoms-artigo";
import { CampoImagem } from "@/components/artigo/campo-imagem";
import { salvarRascunho, enviarArtigo } from "@/app/artigos/actions";
import { tempoLeitura, type Artigo, type Bloco } from "@/lib/artigos";

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
    setD((x) => ({
      ...x,
      blocos: x.blocos.map((b) => (b.id === id ? { ...b, [campo]: v } : b)),
    }));

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
    setD((x) => ({
      ...x,
      blocos: [...x.blocos, { id: `b-${Date.now()}`, tipo, texto: "", url: "", legenda: "" }],
    }));

  const temTexto = d.blocos.some(
    (b) => b.tipo !== "imagem" && (b.texto ?? "").trim().length > 20,
  );
  const erros: string[] = [];
  if (!d.titulo.trim()) erros.push("Escreva o título do artigo.");
  if (!d.resumo.trim()) erros.push("Escreva a linha fina — é ela que aparece na lista.");
  if (!temTexto) erros.push("O artigo precisa de pelo menos um parágrafo com conteúdo.");

  const payload = () => ({
    id: d.id,
    titulo: d.titulo,
    chapeu: d.chapeu,
    resumo: d.resumo,
    capa: d.capa,
    blocos: d.blocos,
  });

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
      setErro(erros[0]);
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
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <header className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid rgba(17,17,17,.14)` }}>
        <button onClick={() => router.push("/meus-artigos")} aria-label="Voltar" className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 44, color: C.ink }}>
          <Ico.back style={{ width: 21, height: 21 }} />
        </button>
        <div className="min-w-0 flex-1">
          <Eyebrow>Modelo 1 · Newsletter</Eyebrow>
        </div>
        <button onClick={() => setPrevia((p) => !p)} className="rounded-full px-3.5 text-[13px] font-semibold" style={{ height: 36, background: C.surface, border: BORDA, color: C.ink }}>
          {previa ? "Voltar a editar" : "Ver como vai ficar"}
        </button>
      </header>

      <div className="mx-auto max-w-2xl px-5 pb-32 pt-5">
        {/* devolutiva da coordenação */}
        {d.status === "ajustes" && d.motivo && (
          <div className="mb-4 rounded-2xl p-4" style={{ background: "#FBEDEC" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#A33F37" }}>
              A coordenação pediu ajustes
            </p>
            <p className="mt-1 text-[14px]" style={{ color: "#7A2F29" }}>
              {d.motivo}
            </p>
          </div>
        )}

        {previa ? (
          <article>
            <Capa titulo={d.titulo} capa={d.capa} variante="alta" />
            <div className="mt-4">
              <Chapeu>{d.chapeu.trim() || autor.profissao || "Artigo"}</Chapeu>
            </div>
            <h1 className="mt-2 text-[26px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 600 }}>
              {d.titulo || "Sem título"}
            </h1>
            {d.resumo && (
              <p className="mt-2 text-[16px]" style={{ color: C.muted }}>
                {d.resumo}
              </p>
            )}
            <p className="mt-3 text-[13px]" style={{ color: C.muted, fontFamily: F.mono }}>
              {autor.nome} · {tempoLeitura(d)} min de leitura
            </p>
            <div className="my-5" style={{ borderTop: `1px solid ${C.line}` }} />
            <BlocosLidos blocos={d.blocos} />
          </article>
        ) : (
          <>
            {/* capa */}
            <CampoImagem tipo="capa" rotulo="Imagem de capa" valor={d.capa} onMudar={(u) => set("capa", u)} />

            {/* chapéu */}
            <div className="mt-5">
              <label className="mb-1 block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}>
                Chapéu
              </label>
              <input
                value={d.chapeu}
                onChange={(e) => set("chapeu", e.target.value)}
                placeholder="duas ou três palavras que situam o leitor"
                className="w-full rounded-xl px-3 py-2.5 text-[15px] outline-none"
                style={{ background: C.surface, border: BORDA, color: C.ink }}
              />
              <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                Aparece acima do título na listagem. Se ficar vazio, entra a sua área de atuação.
              </p>
            </div>

            {/* título */}
            <div className="mt-4">
              <label className="mb-1 block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}>
                Título (H1)
              </label>
              <textarea
                value={d.titulo}
                onChange={(e) => set("titulo", e.target.value)}
                placeholder="O título do seu artigo"
                rows={2}
                className="w-full resize-none rounded-xl px-3 py-2.5 outline-none"
                style={{
                  background: C.surface,
                  border: `1px solid ${validando && !d.titulo.trim() ? "#C0524A" : C.line}`,
                  color: C.ink,
                  fontFamily: F.serif,
                  fontSize: 20,
                  fontWeight: 600,
                }}
              />
            </div>

            {/* resumo */}
            <div className="mt-4">
              <label className="mb-1 block text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}>
                Linha fina
              </label>
              <textarea
                value={d.resumo}
                onChange={(e) => set("resumo", e.target.value)}
                placeholder="Uma ou duas frases que resumem o artigo"
                rows={2}
                className="w-full resize-none rounded-xl px-3 py-2.5 text-[15px] outline-none"
                style={{
                  background: C.surface,
                  border: `1px solid ${validando && !d.resumo.trim() ? "#C0524A" : C.line}`,
                  color: C.ink,
                }}
              />
            </div>

            {/* blocos */}
            <div className="mt-6">
              <Eyebrow className="pb-2">Conteúdo</Eyebrow>
              <div className="space-y-3">
                {d.blocos.map((b, i) => (
                  <BlocoEditor
                    key={b.id}
                    b={b}
                    indice={i}
                    total={d.blocos.length}
                    onMudar={mudarBloco}
                    onMover={moverBloco}
                    onRemover={removerBloco}
                  />
                ))}
              </div>

              {/* adicionar bloco */}
              <div className="mt-3 flex flex-wrap gap-2">
                {TIPOS_BLOCO.map((t) => (
                  <button
                    key={t.tipo}
                    onClick={() => addBloco(t.tipo)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold"
                    style={{ background: C.surface, border: BORDA, color: C.ink }}
                  >
                    <Ico.mais style={{ width: 14, height: 14 }} />
                    {t.rotulo}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {erro && (
          <p className="mt-4 text-[13px]" style={{ color: "#B24A42" }}>
            {erro}
          </p>
        )}
        {msg && (
          <p className="mt-4 text-[13px]" style={{ color: "#14504B" }}>
            {msg}
          </p>
        )}
      </div>

      {/* barra de ação fixa */}
      <div className="fixed bottom-0 left-0 right-0" style={{ background: C.fundo, borderTop: BORDA }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3">
          <div className="flex items-center gap-2 pr-1">
            <Avatar nome={autor.nome} foto={autor.avatar_url} size={32} />
          </div>
          <Botao variante="secundario" onClick={salvar} disabled={pending}>
            Salvar
          </Botao>
          <div className="flex-1">
            <Botao full onClick={enviar} disabled={pending}>
              Enviar para aprovação
            </Botao>
          </div>
        </div>
        <p className="px-5 pb-2 text-center text-[11px]" style={{ color: C.muted }}>
          O artigo só fica visível no diretório depois que a coordenação aprovar.
        </p>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------- BlocoEditor -- */
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
  const rotulo = TIPOS_BLOCO.find((t) => t.tipo === b.tipo)?.rotulo ?? "Bloco";
  const btn = { width: 34, height: 34 };

  return (
    <div className="rounded-xl p-3" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
      <div className="mb-2 flex items-center">
        <span className="text-[11px] uppercase" style={{ color: C.muted, fontFamily: F.mono, letterSpacing: ".1em" }}>
          {rotulo}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => onMover(b.id, -1)} disabled={indice === 0} aria-label="Mover para cima" className="flex items-center justify-center rounded-lg" style={{ ...btn, background: C.surface, color: C.ink, opacity: indice === 0 ? 0.35 : 1 }}>
            <Ico.cima style={{ width: 16, height: 16 }} />
          </button>
          <button onClick={() => onMover(b.id, 1)} disabled={indice === total - 1} aria-label="Mover para baixo" className="flex items-center justify-center rounded-lg" style={{ ...btn, background: C.surface, color: C.ink, opacity: indice === total - 1 ? 0.35 : 1 }}>
            <Ico.baixo style={{ width: 16, height: 16 }} />
          </button>
          <button onClick={() => onRemover(b.id)} aria-label="Remover bloco" className="flex items-center justify-center rounded-lg" style={{ ...btn, background: C.surface, color: "#B24A42" }}>
            <Ico.lixo style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {b.tipo === "imagem" ? (
        <div className="space-y-2">
          <CampoImagem tipo="bloco" rotulo="Arquivo" valor={b.url ?? ""} onMudar={(u) => onMudar(b.id, "url", u)} />
          <input
            value={b.legenda ?? ""}
            onChange={(e) => onMudar(b.id, "legenda", e.target.value)}
            placeholder="Legenda (opcional)"
            className="w-full rounded-lg px-3 text-[14px] outline-none"
            style={{ height: 44, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}
          />
        </div>
      ) : b.tipo === "h2" ? (
        <input
          value={b.texto ?? ""}
          onChange={(e) => onMudar(b.id, "texto", e.target.value)}
          placeholder="Título da seção"
          className="w-full rounded-lg px-3 py-2 outline-none"
          style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.ink, fontFamily: F.serif, fontSize: 17, fontWeight: 600 }}
        />
      ) : (
        <textarea
          value={b.texto ?? ""}
          onChange={(e) => onMudar(b.id, "texto", e.target.value)}
          placeholder={b.tipo === "citacao" ? "Uma frase que resume a ideia" : "Escreva o parágrafo"}
          rows={b.tipo === "citacao" ? 2 : 5}
          className="w-full resize-none rounded-lg px-3 py-2 text-[15px] outline-none"
          style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}
        />
      )}
    </div>
  );
}
