"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IcoRC } from "@/comunidade/components/icones";
import { salvarCamposPerfil, type CamposPerfil } from "@/comunidade/acoes/perfil";
import { urlDaRede, type DadosPerfil, type RedeSocial } from "@/comunidade/lib/perfil-tipos";

/* Aba "Sobre" do perfil, no formato do Facebook: menu de seções à esquerda e,
   à direita, os itens da seção. No próprio perfil cada item tem o lápis e é
   editado ali mesmo (um item por vez, com Salvar e Cancelar). Quem visita vê
   só o que está preenchido, e nunca vê os dados de contato. */

type Secao = "apresentacao" | "pessoais" | "trabalho" | "links" | "contato";

const SECOES: { id: Secao; rotulo: string; soDono?: boolean }[] = [
  { id: "apresentacao", rotulo: "Apresentação" },
  { id: "pessoais", rotulo: "Dados pessoais" },
  { id: "trabalho", rotulo: "Trabalho" },
  { id: "links", rotulo: "Links" },
  { id: "contato", rotulo: "Informações de contato", soDono: true },
];

type ChaveTexto = "nome" | "headline" | "bio" | "profissao" | "espaco" | "cidade" | "uf" | "whatsapp" | "telefone" | RedeSocial;

interface CampoTexto {
  chave: ChaveTexto;
  rotulo: string;
  /** texto-fantasma quando vazio (só o dono vê) */
  vazio: string;
  icone: ReactNode;
  area?: boolean;
  max: number;
  dica?: string;
  rede?: RedeSocial;
}

const REDES: CampoTexto[] = [
  { chave: "instagram", rede: "instagram", rotulo: "Instagram", vazio: "Adicionar Instagram", icone: <IcoRC.link />, max: 200, dica: "@seuperfil" },
  { chave: "linkedin", rede: "linkedin", rotulo: "LinkedIn", vazio: "Adicionar LinkedIn", icone: <IcoRC.link />, max: 200, dica: "in/seu-perfil" },
  { chave: "youtube", rede: "youtube", rotulo: "YouTube", vazio: "Adicionar YouTube", icone: <IcoRC.link />, max: 200, dica: "@seucanal ou o endereço" },
  { chave: "tiktok", rede: "tiktok", rotulo: "TikTok", vazio: "Adicionar TikTok", icone: <IcoRC.link />, max: 200, dica: "@seuperfil" },
  { chave: "facebook", rede: "facebook", rotulo: "Facebook", vazio: "Adicionar Facebook", icone: <IcoRC.link />, max: 200, dica: "seu.perfil ou o endereço" },
  { chave: "site", rede: "site", rotulo: "Site", vazio: "Adicionar site", icone: <IcoRC.externo />, max: 200, dica: "seusite.com.br" },
];

export function SobrePerfil({ dados, ehMeu, secaoInicial }: { dados: DadosPerfil; ehMeu: boolean; secaoInicial?: string }) {
  const router = useRouter();
  const secoes = SECOES.filter((s) => ehMeu || !s.soDono);
  const [secao, setSecao] = useState<Secao>(secoes.find((s) => s.id === secaoInicial)?.id ?? "apresentacao");
  const [valores, setValores] = useState<DadosPerfil>(dados);
  const [editando, setEditando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // dados novos do servidor (router.refresh) voltam a mandar: ajuste no render
  const [visto, setVisto] = useState(dados);
  if (visto !== dados) {
    setVisto(dados);
    setValores(dados);
  }

  const salvar = (campos: CamposPerfil, local: Partial<DadosPerfil>) => {
    setErro(null);
    start(async () => {
      const r = await salvarCamposPerfil(campos);
      if (r.erro) {
        setErro(r.erro);
        return;
      }
      setValores((v) => ({ ...v, ...local }));
      setEditando(null);
      router.refresh();
    });
  };

  const abrir = (chave: string) => {
    setErro(null);
    setEditando(chave);
  };
  const fechar = () => {
    setErro(null);
    setEditando(null);
  };

  /** Uma linha de texto: valor (ou o texto-fantasma) e, em edição, o campo. */
  const linha = (c: CampoTexto) => {
    const valor = (valores[c.chave] ?? "").trim();
    if (!ehMeu && !valor) return null;
    if (editando === c.chave) {
      return (
        <EditorTexto
          key={c.chave}
          campo={c}
          inicial={valor}
          pending={pending}
          erro={erro}
          onCancelar={fechar}
          onSalvar={(novo) => salvar({ [c.chave]: novo } as CamposPerfil, { [c.chave]: c.chave === "uf" ? novo.toUpperCase() : novo } as Partial<DadosPerfil>)}
        />
      );
    }
    const href = c.rede && valor ? urlDaRede(c.rede, valor) : null;
    return (
      <div key={c.chave} className="rc-sobre-item">
        <span className="rc-sobre-icone">{c.icone}</span>
        <div className="rc-sobre-texto">
          {valor ? (
            <>
              {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="rc-sobre-valor rc-sobre-link">
                  {valor}
                </a>
              ) : (
                <span className={`rc-sobre-valor${c.area ? " rc-sobre-area" : ""}`}>{valor}</span>
              )}
              <small>{c.rotulo}</small>
            </>
          ) : (
            <button type="button" className="rc-sobre-vazio" onClick={() => abrir(c.chave)}>
              {c.vazio}
            </button>
          )}
        </div>
        {ehMeu && valor && (
          <button type="button" className="rc-icone-btn rc-sobre-lapis" aria-label={`Editar ${c.rotulo}`} title="Editar" onClick={() => abrir(c.chave)}>
            <IcoRC.lapis />
          </button>
        )}
      </div>
    );
  };

  const grupo = (titulo: string, itens: (ReactNode | null)[], vazioVisitante = "Nada informado.") => {
    const visiveis = itens.filter(Boolean);
    return (
      <section className="rc-sobre-grupo">
        <h3>{titulo}</h3>
        {visiveis.length > 0 ? visiveis : <p className="rc-sobre-nada">{vazioVisitante}</p>}
      </section>
    );
  };

  let conteudo: ReactNode;
  switch (secao) {
    case "apresentacao":
      conteudo = (
        <>
          {grupo("Bio", [
            linha({ chave: "bio", rotulo: "Sobre você", vazio: "Sobre você", icone: <IcoRC.mao />, area: true, max: 1500 }),
            linha({ chave: "headline", rotulo: "Título", vazio: "Adicionar um título (aparece embaixo do seu nome)", icone: <IcoRC.info />, max: 140 }),
          ])}
          <section className="rc-sobre-grupo">
            <h3>Destaques</h3>
            <Destaques
              itens={valores.destaques}
              ehMeu={ehMeu}
              editando={editando === "destaques"}
              pending={pending}
              erro={erro}
              onAbrir={() => abrir("destaques")}
              onCancelar={fechar}
              onSalvar={(lista) => salvar({ destaques: lista }, { destaques: lista })}
            />
          </section>
        </>
      );
      break;
    case "pessoais":
      conteudo = grupo("Dados pessoais", [
        linha({ chave: "nome", rotulo: "Nome", vazio: "Adicionar nome", icone: <IcoRC.pessoa />, max: 120 }),
        linha({ chave: "cidade", rotulo: "Cidade", vazio: "Adicionar cidade", icone: <IcoRC.local />, max: 80 }),
        linha({ chave: "uf", rotulo: "Estado (UF)", vazio: "Adicionar estado (UF)", icone: <IcoRC.local />, max: 2, dica: "Duas letras, por exemplo SP" }),
      ]);
      break;
    case "trabalho":
      conteudo = (
        <>
          {grupo("Trabalho", [
            linha({ chave: "profissao", rotulo: "Profissão", vazio: "Adicionar profissão", icone: <IcoRC.maleta />, max: 80 }),
            linha({ chave: "espaco", rotulo: "Espaço de Instrução", vazio: "Adicionar Espaço de Instrução", icone: <IcoRC.casa />, max: 120 }),
          ])}
          <section className="rc-sobre-grupo">
            <h3>Especialidades</h3>
            <Especialidades
              itens={valores.especialidades}
              ehMeu={ehMeu}
              editando={editando === "especialidades"}
              pending={pending}
              erro={erro}
              onAbrir={() => abrir("especialidades")}
              onCancelar={fechar}
              onSalvar={(lista) => salvar({ especialidades: lista }, { especialidades: lista })}
            />
          </section>
        </>
      );
      break;
    case "links":
      conteudo = grupo("Links", REDES.map(linha), "Nenhum link informado.");
      break;
    case "contato":
      conteudo = (
        <>
          {grupo("Informações de contato", [
            linha({ chave: "whatsapp", rotulo: "WhatsApp", vazio: "Adicionar WhatsApp", icone: <IcoRC.whatsapp />, max: 30, dica: "(11) 99999-9999" }),
            linha({ chave: "telefone", rotulo: "Telefone", vazio: "Adicionar telefone", icone: <IcoRC.telefone />, max: 30 }),
          ])}
          <p className="rc-sobre-aviso">
            <IcoRC.cadeado /> Aqui na comunidade só você vê estes dados.
          </p>
        </>
      );
      break;
  }

  return (
    <section className="rc-cartao rc-sobre" aria-label="Sobre">
      <nav className="rc-sobre-menu" aria-label="Seções do Sobre">
        <h2>Sobre</h2>
        {secoes.map((s) => (
          <button
            key={s.id}
            type="button"
            className="rc-sobre-menu-item"
            aria-current={s.id === secao ? "true" : undefined}
            onClick={() => {
              fechar();
              setSecao(s.id);
            }}
          >
            {s.rotulo}
          </button>
        ))}
      </nav>
      <div className="rc-sobre-conteudo">{conteudo}</div>
    </section>
  );
}

/* ----------------------------------------------------------- editores -- */

function Botoes({ pending, onCancelar, podeSalvar = true }: { pending: boolean; onCancelar: () => void; podeSalvar?: boolean }) {
  return (
    <div className="rc-sobre-botoes">
      <button type="button" className="rc-btn rc-btn-neutro" onClick={onCancelar} disabled={pending}>
        Cancelar
      </button>
      <button type="submit" className="rc-btn rc-btn-primario" disabled={pending || !podeSalvar}>
        {pending ? "Salvando…" : "Salvar"}
      </button>
    </div>
  );
}

function EditorTexto({
  campo,
  inicial,
  pending,
  erro,
  onCancelar,
  onSalvar,
}: {
  campo: CampoTexto;
  inicial: string;
  pending: boolean;
  erro: string | null;
  onCancelar: () => void;
  onSalvar: (valor: string) => void;
}) {
  const [valor, setValor] = useState(inicial);
  const id = `rc-sobre-${campo.chave}`;
  return (
    <form
      className="rc-sobre-editor"
      onSubmit={(e) => {
        e.preventDefault();
        onSalvar(valor.trim());
      }}
    >
      <label htmlFor={id}>{campo.rotulo}</label>
      {campo.area ? (
        <textarea id={id} className="rc-sobre-campo" rows={5} maxLength={campo.max} value={valor} onChange={(e) => setValor(e.target.value)} autoFocus />
      ) : (
        <input
          id={id}
          className="rc-sobre-campo"
          maxLength={campo.max}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={campo.dica}
          autoCapitalize={campo.chave === "uf" ? "characters" : undefined}
          autoFocus
        />
      )}
      {campo.area && (
        <small className="rc-sobre-conta">
          {valor.length}/{campo.max}
        </small>
      )}
      {erro && (
        <p className="rc-erro-texto rc-sobre-erro" role="alert">
          {erro}
        </p>
      )}
      <Botoes pending={pending} onCancelar={onCancelar} />
    </form>
  );
}

function Especialidades({
  itens,
  ehMeu,
  editando,
  pending,
  erro,
  onAbrir,
  onCancelar,
  onSalvar,
}: {
  itens: string[];
  ehMeu: boolean;
  editando: boolean;
  pending: boolean;
  erro: string | null;
  onAbrir: () => void;
  onCancelar: () => void;
  onSalvar: (lista: string[]) => void;
}) {
  const [lista, setLista] = useState(itens);
  const [nova, setNova] = useState("");

  if (!editando) {
    if (itens.length === 0) {
      return ehMeu ? (
        <div className="rc-sobre-item">
          <span className="rc-sobre-icone">
            <IcoRC.estrela />
          </span>
          <div className="rc-sobre-texto">
            <button
              type="button"
              className="rc-sobre-vazio"
              onClick={() => {
                setLista(itens);
                setNova("");
                onAbrir();
              }}
            >
              Adicionar especialidades
            </button>
          </div>
        </div>
      ) : (
        <p className="rc-sobre-nada">Nada informado.</p>
      );
    }
    return (
      <div className="rc-sobre-item">
        <span className="rc-sobre-icone">
          <IcoRC.estrela />
        </span>
        <ul className="rc-sobre-chips">
          {itens.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        {ehMeu && (
          <button
            type="button"
            className="rc-icone-btn rc-sobre-lapis"
            aria-label="Editar especialidades"
            title="Editar"
            onClick={() => {
              setLista(itens);
              setNova("");
              onAbrir();
            }}
          >
            <IcoRC.lapis />
          </button>
        )}
      </div>
    );
  }

  const incluir = () => {
    const e = nova.trim().slice(0, 40);
    if (e && lista.length < 12 && !lista.some((x) => x.toLowerCase() === e.toLowerCase())) setLista([...lista, e]);
    setNova("");
  };

  return (
    <form
      className="rc-sobre-editor"
      onSubmit={(e) => {
        e.preventDefault();
        const pendente = nova.trim().slice(0, 40);
        onSalvar(pendente && lista.length < 12 && !lista.some((x) => x.toLowerCase() === pendente.toLowerCase()) ? [...lista, pendente] : lista);
      }}
    >
      <label htmlFor="rc-sobre-esp">Especialidades (até 12)</label>
      {lista.length > 0 && (
        <ul className="rc-sobre-chips">
          {lista.map((e) => (
            <li key={e}>
              {e}
              <button type="button" aria-label={`Tirar ${e}`} onClick={() => setLista(lista.filter((x) => x !== e))}>
                <IcoRC.x />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="rc-sobre-junto">
        <input
          id="rc-sobre-esp"
          className="rc-sobre-campo"
          value={nova}
          maxLength={40}
          placeholder="Ex.: Holding familiar"
          onChange={(e) => setNova(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              incluir();
            }
          }}
          autoFocus
        />
        <button type="button" className="rc-btn rc-btn-neutro" onClick={incluir} disabled={!nova.trim() || lista.length >= 12}>
          Adicionar
        </button>
      </div>
      {erro && (
        <p className="rc-erro-texto rc-sobre-erro" role="alert">
          {erro}
        </p>
      )}
      <Botoes pending={pending} onCancelar={onCancelar} />
    </form>
  );
}

function Destaques({
  itens,
  ehMeu,
  editando,
  pending,
  erro,
  onAbrir,
  onCancelar,
  onSalvar,
}: {
  itens: { titulo: string; texto: string }[];
  ehMeu: boolean;
  editando: boolean;
  pending: boolean;
  erro: string | null;
  onAbrir: () => void;
  onCancelar: () => void;
  onSalvar: (lista: { titulo: string; texto: string }[]) => void;
}) {
  const [lista, setLista] = useState(itens);

  const comecar = () => {
    setLista(itens.length > 0 ? itens : [{ titulo: "", texto: "" }]);
    onAbrir();
  };

  if (!editando) {
    if (itens.length === 0) {
      return ehMeu ? (
        <div className="rc-sobre-item">
          <span className="rc-sobre-icone">
            <IcoRC.pin />
          </span>
          <div className="rc-sobre-texto">
            <button type="button" className="rc-sobre-vazio" onClick={comecar}>
              Adicionar destaques (conquistas, casos, títulos)
            </button>
          </div>
        </div>
      ) : (
        <p className="rc-sobre-nada">Nada informado.</p>
      );
    }
    return (
      <>
        {itens.map((d, i) => (
          <div key={`${d.titulo}-${i}`} className="rc-sobre-item">
            <span className="rc-sobre-icone">
              <IcoRC.pin />
            </span>
            <div className="rc-sobre-texto">
              <span className="rc-sobre-valor">{d.titulo}</span>
              {d.texto && <small>{d.texto}</small>}
            </div>
            {ehMeu && i === 0 && (
              <button type="button" className="rc-icone-btn rc-sobre-lapis" aria-label="Editar destaques" title="Editar" onClick={comecar}>
                <IcoRC.lapis />
              </button>
            )}
          </div>
        ))}
      </>
    );
  }

  const mudar = (i: number, campo: "titulo" | "texto", valor: string) => setLista(lista.map((d, x) => (x === i ? { ...d, [campo]: valor } : d)));

  return (
    <form
      className="rc-sobre-editor"
      onSubmit={(e) => {
        e.preventDefault();
        onSalvar(lista.map((d) => ({ titulo: d.titulo.trim(), texto: d.texto.trim() })).filter((d) => d.titulo));
      }}
    >
      {lista.map((d, i) => (
        <div key={i} className="rc-sobre-destaque">
          <div>
            <input className="rc-sobre-campo" value={d.titulo} maxLength={80} placeholder="Título do destaque" aria-label={`Título do destaque ${i + 1}`} onChange={(e) => mudar(i, "titulo", e.target.value)} autoFocus={i === 0} />
            <input className="rc-sobre-campo" value={d.texto} maxLength={200} placeholder="Descrição (opcional)" aria-label={`Descrição do destaque ${i + 1}`} onChange={(e) => mudar(i, "texto", e.target.value)} />
          </div>
          <button type="button" className="rc-icone-btn" aria-label={`Remover o destaque ${i + 1}`} title="Remover" onClick={() => setLista(lista.filter((_, x) => x !== i))}>
            <IcoRC.lixo />
          </button>
        </div>
      ))}
      {lista.length < 8 && (
        <button type="button" className="rc-btn rc-btn-neutro rc-sobre-mais" onClick={() => setLista([...lista, { titulo: "", texto: "" }])}>
          <IcoRC.mais /> Adicionar destaque
        </button>
      )}
      {erro && (
        <p className="rc-erro-texto rc-sobre-erro" role="alert">
          {erro}
        </p>
      )}
      <Botoes pending={pending} onCancelar={onCancelar} />
    </form>
  );
}
