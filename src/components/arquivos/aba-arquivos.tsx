"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { C, F, BORDA } from "@/lib/tokens";
import { Botao, Eyebrow, Segmentado, TagNivel, SeloVerificado } from "@/components/atoms";
import { Ico } from "@/components/icons";
import { Sheet } from "@/components/sheet";
import { createClient } from "@/lib/supabase/browser";
import { norm, dataPonto } from "@/lib/utils";
import {
  BUCKET_ARQUIVOS,
  MAX_MB_ARQUIVO,
  tamanhoLegivel,
  tipoPorMime,
  type Arquivo,
  type MidiaPost,
  type TipoArquivo,
} from "@/lib/arquivos-tipos";
import { apagarArquivo, fixarArquivo, linkDoArquivo, registrarArquivo } from "@/app/arquivos/actions";

const ROTULO_TIPO: Record<TipoArquivo, string> = {
  documento: "Documento",
  imagem: "Imagem",
  video: "Vídeo",
  link: "Link",
};

export function AbaArquivos({
  arquivos,
  midias,
  abaInicial,
  perfilId,
  isAdmin,
}: {
  arquivos: Arquivo[];
  midias: MidiaPost[];
  abaInicial: "arquivos" | "midias";
  perfilId: string;
  isAdmin: boolean;
}) {
  const [aba, setAba] = useState(abaInicial);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<TipoArquivo | "todos">("todos");
  const [enviando, setEnviando] = useState(false);

  const lista = useMemo(() => {
    const q = norm(busca);
    return arquivos.filter(
      (a) =>
        (filtro === "todos" || a.tipo === filtro) &&
        (!q || norm(`${a.titulo} ${a.descricao} ${a.autor?.nome ?? ""}`).includes(q)),
    );
  }, [arquivos, busca, filtro]);

  // Mídias = fotos dos posts + imagens e vídeos enviados na aba de arquivos.
  const midiasArquivo = arquivos.filter((a) => a.tipo === "imagem" || a.tipo === "video");

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Comunidade THB</Eyebrow>
          <h1 className="mt-1 text-[28px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 700 }}>
            Arquivos e mídias
          </h1>
        </div>
        <button
          onClick={() => setEnviando(true)}
          className="press flex items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold"
          style={{ height: 42, background: C.laranja, color: C.ink }}
        >
          <Ico.mais style={{ width: 17, height: 17 }} /> Adicionar
        </button>
      </div>

      <div className="mt-5">
        <Segmentado
          abas={[
            { id: "arquivos", rotulo: "Arquivos", n: arquivos.length },
            { id: "midias", rotulo: "Mídias", n: midias.length + midiasArquivo.length },
          ]}
          ativa={aba}
          onTrocar={(id) => setAba(id as "arquivos" | "midias")}
        />
      </div>

      {aba === "arquivos" ? (
        <>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }}>
                <Ico.busca style={{ width: 17, height: 17 }} />
              </span>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por título, descrição ou autor"
                className="w-full rounded-xl pl-10 pr-4 text-[15px] outline-none"
                style={{ height: 46, background: C.surface, border: BORDA, color: C.ink }}
              />
            </div>
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as TipoArquivo | "todos")}
              className="rounded-xl px-3 text-[14px] outline-none"
              style={{ height: 46, background: C.surface, border: BORDA, color: C.ink }}
              aria-label="Filtrar por tipo"
            >
              <option value="todos">Todos os tipos</option>
              {(Object.keys(ROTULO_TIPO) as TipoArquivo[]).map((t) => (
                <option key={t} value={t}>
                  {ROTULO_TIPO[t]}
                </option>
              ))}
            </select>
          </div>

          {lista.length === 0 ? (
            <div className="mt-4 rounded-2xl p-6 text-center" style={{ background: C.surface, border: BORDA }}>
              <p className="text-[15px]">{busca || filtro !== "todos" ? "Nenhum arquivo com esse filtro." : "Ainda não há arquivos."}</p>
              <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                Modelos, apresentações e materiais de apoio enviados pelos membros aparecem aqui.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {lista.map((a) => (
                <ItemArquivo key={a.id} a={a} podeApagar={isAdmin || a.autor?.id === perfilId} isAdmin={isAdmin} />
              ))}
            </ul>
          )}
        </>
      ) : (
        <GradeMidias midias={midias} arquivos={midiasArquivo} />
      )}

      <FormEnvio aberto={enviando} onFechar={() => setEnviando(false)} perfilId={perfilId} />
    </div>
  );
}

function IconeTipo({ tipo }: { tipo: TipoArquivo }) {
  const I = tipo === "link" ? Ico.externo : tipo === "video" ? Ico.transmissao : tipo === "imagem" ? Ico.olho : Ico.doc;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-xl" style={{ width: 42, height: 42, background: C.petrolSoft, color: C.petrolDeep }}>
      <I style={{ width: 19, height: 19 }} />
    </span>
  );
}

function ItemArquivo({ a, podeApagar, isAdmin }: { a: Arquivo; podeApagar: boolean; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const abrir = () =>
    start(async () => {
      setErro(null);
      // A aba abre já (antes do await) para o navegador não bloquear o pop-up.
      const janela = window.open("", "_blank");
      const r = await linkDoArquivo(a.id);
      if (r.url) {
        if (janela) janela.location.href = r.url;
        else window.location.href = r.url;
      } else {
        janela?.close();
        setErro(r.erro ?? "Não foi possível abrir.");
      }
    });

  const apagar = () => {
    if (!confirm(`Apagar "${a.titulo}"?`)) return;
    start(async () => {
      const r = await apagarArquivo(a.id);
      if (r.erro) setErro(r.erro);
      else router.refresh();
    });
  };

  const fixar = () =>
    start(async () => {
      const r = await fixarArquivo(a.id, !a.fixado);
      if (r.erro) setErro(r.erro);
      else router.refresh();
    });

  return (
    <li className="rounded-2xl p-3.5" style={{ background: C.surface, border: BORDA }}>
      <div className="flex items-start gap-3">
        {a.miniatura ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.miniatura} alt="" className="shrink-0 rounded-xl" style={{ width: 42, height: 42, objectFit: "cover" }} />
        ) : (
          <IconeTipo tipo={a.tipo} />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[15px] font-semibold leading-snug" style={{ fontFamily: F.serif }}>
            {a.fixado && <Ico.pin style={{ width: 14, height: 14, color: C.petrolDeep, flexShrink: 0 }} aria-label="Fixado" />}
            <span className="min-w-0">{a.titulo}</span>
          </p>
          {a.descricao && (
            <p className="mt-0.5 text-[14px] leading-snug" style={{ color: C.muted }}>
              {a.descricao}
            </p>
          )}
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px]" style={{ color: C.muted }}>
            <span>{ROTULO_TIPO[a.tipo]}</span>
            {a.tamanho_bytes > 0 && <span>· {tamanhoLegivel(a.tamanho_bytes)}</span>}
            <span>· {dataPonto(a.criado_em)} ·</span>
            {a.autor && (
              <Link href={`/especialista/${a.autor.slug ?? a.autor.id}`} className="font-semibold" style={{ color: C.ink }}>
                {a.autor.nome}
              </Link>
            )}
            {a.autor?.verificado && <SeloVerificado size="sm" />}
            {a.autor && <TagNivel qualificacao={a.autor.qualificacao} size="sm" />}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={abrir}
          disabled={pending}
          className="press flex items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold"
          style={{ height: 36, background: C.ink, color: C.fundo }}
        >
          {a.url ? "Abrir link" : "Abrir"} <Ico.externo style={{ width: 13, height: 13 }} />
        </button>
        {isAdmin && (
          <button onClick={fixar} disabled={pending} className="press rounded-full px-3 text-[13px] font-semibold" style={{ height: 36, color: C.ink, border: BORDA }}>
            {a.fixado ? "Desafixar" : "Fixar"}
          </button>
        )}
        {podeApagar && (
          <button onClick={apagar} disabled={pending} aria-label="Apagar arquivo" className="ml-auto flex items-center justify-center rounded-full" style={{ width: 36, height: 36, color: C.muted }}>
            <Ico.lixo style={{ width: 15, height: 15 }} />
          </button>
        )}
      </div>
      {erro && (
        <p className="mt-2 text-[12px]" style={{ color: "#B24A42" }}>
          {erro}
        </p>
      )}
    </li>
  );
}

function GradeMidias({ midias, arquivos }: { midias: MidiaPost[]; arquivos: Arquivo[] }) {
  if (midias.length === 0 && arquivos.length === 0) {
    return (
      <div className="mt-4 rounded-2xl p-6 text-center" style={{ background: C.surface, border: BORDA }}>
        <p className="text-[15px]">Ainda não há fotos nem vídeos.</p>
        <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
          As imagens publicadas nos posts do feed aparecem aqui automaticamente.
        </p>
      </div>
    );
  }
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {arquivos.map((a) =>
        a.tipo === "imagem" && a.miniatura ? (
          <figure key={a.id} className="overflow-hidden rounded-xl" style={{ background: C.paper, border: BORDA }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.miniatura} alt={a.titulo} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
            <figcaption className="truncate px-2 py-1.5 text-[12px]" style={{ color: C.muted }}>
              {a.titulo}
            </figcaption>
          </figure>
        ) : (
          <div key={a.id} className="flex flex-col justify-between rounded-xl p-3" style={{ background: C.ink, color: C.fundo, aspectRatio: "1 / 1" }}>
            <Ico.transmissao style={{ width: 22, height: 22 }} />
            <p className="text-[13px] font-semibold leading-snug">{a.titulo}</p>
            <p className="text-[11px] opacity-70">Vídeo · abra pela aba Arquivos</p>
          </div>
        ),
      )}
      {midias.map((m) => (
        <Link key={m.post_id + m.imagem_url} href={`/post/${m.post_id}`} className="card-hover overflow-hidden rounded-xl" style={{ background: C.paper, border: BORDA }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.imagem_url} alt={m.titulo} loading="lazy" style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
          <span className="block truncate px-2 py-1.5 text-[12px]" style={{ color: C.muted }}>
            {m.autor}
          </span>
        </Link>
      ))}
    </div>
  );
}

function FormEnvio({ aberto, onFechar, perfilId }: { aberto: boolean; onFechar: () => void; perfilId: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<"arquivo" | "link">("arquivo");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [tipoLink, setTipoLink] = useState<"link" | "video">("link");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const limpar = () => {
    setTitulo("");
    setDescricao("");
    setArquivo(null);
    setLink("");
    setErro(null);
  };

  const escolher = (f: File | null) => {
    setErro(null);
    if (f && f.size > MAX_MB_ARQUIVO * 1024 * 1024) {
      setErro(`O arquivo tem ${(f.size / 1048576).toFixed(1)} MB. O limite é ${MAX_MB_ARQUIVO} MB; para vídeos longos, cole o link do YouTube ou Drive.`);
      setArquivo(null);
      return;
    }
    setArquivo(f);
    if (f && !titulo) setTitulo(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  };

  const salvar = () =>
    start(async () => {
      setErro(null);
      if (modo === "arquivo") {
        if (!arquivo) return setErro("Escolha um arquivo.");
        const supabase = createClient();
        const nomeSeguro = arquivo.name.normalize("NFD").replace(/[^\w.-]+/g, "-").slice(-80);
        const caminho = `${perfilId}/${crypto.randomUUID()}-${nomeSeguro}`;
        const { error } = await supabase.storage.from(BUCKET_ARQUIVOS).upload(caminho, arquivo, {
          contentType: arquivo.type || "application/octet-stream",
          upsert: false,
        });
        if (error) return setErro(`Falha ao enviar: ${error.message}`);
        const r = await registrarArquivo({
          titulo,
          descricao,
          tipo: tipoPorMime(arquivo.type || ""),
          caminho,
          mime: arquivo.type,
          tamanho: arquivo.size,
        });
        if (r.erro) {
          await supabase.storage.from(BUCKET_ARQUIVOS).remove([caminho]);
          return setErro(r.erro);
        }
      } else {
        const r = await registrarArquivo({ titulo, descricao, tipo: tipoLink, url: link });
        if (r.erro) return setErro(r.erro);
      }
      limpar();
      onFechar();
      router.refresh();
    });

  const campo = "w-full rounded-xl px-3 text-[15px] outline-none";
  const estilo = { background: C.paper, border: BORDA, color: C.ink } as const;

  return (
    <Sheet
      aberto={aberto}
      onFechar={onFechar}
      titulo="Adicionar à aba de arquivos"
      rodape={
        <Botao full onClick={salvar} disabled={pending || titulo.trim().length < 2 || (modo === "arquivo" ? !arquivo : !link.trim())}>
          {pending ? "Enviando…" : "Salvar"}
        </Botao>
      }
    >
      <Segmentado
        abas={[
          { id: "arquivo", rotulo: "Enviar arquivo" },
          { id: "link", rotulo: "Colar link" },
        ]}
        ativa={modo}
        onTrocar={(id) => setModo(id as "arquivo" | "link")}
      />
      {modo === "arquivo" ? (
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] font-semibold">Arquivo (até {MAX_MB_ARQUIVO} MB)</span>
          <input type="file" onChange={(e) => escolher(e.target.files?.[0] ?? null)} className="block w-full text-[14px]" />
          {arquivo && (
            <span className="mt-1 block text-[12px]" style={{ color: C.muted }}>
              {arquivo.name} · {tamanhoLegivel(arquivo.size)}
            </span>
          )}
        </label>
      ) : (
        <>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[13px] font-semibold">Link</span>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" className={campo} style={{ ...estilo, height: 46 }} />
          </label>
          <label className="mt-3 flex items-center gap-2 text-[14px]">
            <input type="checkbox" checked={tipoLink === "video"} onChange={(e) => setTipoLink(e.target.checked ? "video" : "link")} style={{ accentColor: "#141210" }} />
            É um vídeo (YouTube, Vimeo, Drive)
          </label>
        </>
      )}
      <label className="mt-4 block">
        <span className="mb-1.5 block text-[13px] font-semibold">Título</span>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={160} className={campo} style={{ ...estilo, height: 46 }} />
      </label>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[13px] font-semibold">Descrição (opcional)</span>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} maxLength={600} className={`${campo} resize-none py-2.5`} style={estilo} />
      </label>
      {erro && (
        <p className="mt-3 text-[13px]" style={{ color: "#B24A42" }} role="alert">
          {erro}
        </p>
      )}
    </Sheet>
  );
}
