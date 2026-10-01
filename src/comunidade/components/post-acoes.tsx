"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IcoRC } from "@/comunidade/components/icones";
import { DivisorMenu, ItemMenu, Menu } from "@/comunidade/components/ui";
import { votar, apagarPost, fixarPost, travarComentarios } from "@/comunidade/acoes/feed";
import type { PostFeed } from "@/comunidade/lib/feed";
import type { Eu } from "@/comunidade/lib/sessao";

/** Endereço do post para copiar e mandar a um colega (só membro abre). */
function linkDoPost(postId: string): string {
  return `${window.location.origin}/comunidade/post/${postId}`;
}

/** Copia para a área de transferência. Devolve false se o navegador negar. */
async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // sem a API (endereço sem https, navegador antigo): caminho de reserva
    try {
      const campo = document.createElement("textarea");
      campo.value = texto;
      campo.setAttribute("readonly", "");
      campo.style.position = "fixed";
      campo.style.opacity = "0";
      document.body.appendChild(campo);
      campo.select();
      const ok = document.execCommand("copy");
      campo.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/* Linha de ações do post, como no grupo do Facebook: curtir (com o número),
   comentar (com o número de comentários) e compartilhar (copia o link). */
export function PostAcoes({
  post,
  nComentarios,
  onComentar,
}: {
  post: PostFeed;
  /** contagem viva dos comentários (o cartão recebe da lista de comentários) */
  nComentarios: number;
  onComentar: () => void;
}) {
  const [voto, setVoto] = useState({ meu: post.meu_voto, score: post.score });
  const [copiado, setCopiado] = useState(false);
  const [pending, start] = useTransition();

  // Quando o servidor manda números novos (router.refresh), eles voltam a
  // mandar: ajuste de estado durante o render, sem effect.
  const [visto, setVisto] = useState({ meu: post.meu_voto, score: post.score });
  if (visto.meu !== post.meu_voto || visto.score !== post.score) {
    setVisto({ meu: post.meu_voto, score: post.score });
    setVoto({ meu: post.meu_voto, score: post.score });
  }

  const curti = voto.meu === 1;

  const curtir = () => {
    const anterior = voto;
    const novo = anterior.meu === 1 ? 0 : 1;
    setVoto({ meu: novo, score: anterior.score - anterior.meu + novo });
    start(async () => {
      const r = await votar(post.id, 1);
      if (r.erro) setVoto(anterior);
    });
  };

  const compartilhar = async () => {
    const link = linkDoPost(post.id);
    if (!(await copiarTexto(link))) {
      // navegador que não deixa copiar sozinho: mostra o link para a pessoa copiar
      window.prompt("Copie o link do post:", link);
      return;
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const rotuloCurtir = `${curti ? "Desfazer curtida" : "Curtir"}${voto.score > 0 ? ` (${voto.score} ${voto.score === 1 ? "curtida" : "curtidas"})` : ""}`;
  const rotuloComentar = `Comentar${nComentarios > 0 ? ` (${nComentarios} ${nComentarios === 1 ? "comentário" : "comentários"})` : ""}`;

  return (
    <div className="rc-post-acoes">
      <button type="button" className="rc-acao" data-ativo={curti || undefined} aria-pressed={curti} aria-label={rotuloCurtir} title={curti ? "Desfazer curtida" : "Curtir"} disabled={pending} onClick={curtir}>
        {curti ? <IcoRC.curtido /> : <IcoRC.curtir />}
        {voto.score > 0 && <span>{voto.score}</span>}
      </button>
      <button type="button" className="rc-acao" aria-label={rotuloComentar} title="Comentar" onClick={onComentar}>
        <IcoRC.comentar />
        {nComentarios > 0 && <span>{nComentarios}</span>}
      </button>
      <button type="button" className="rc-acao" aria-label="Compartilhar: copiar o link do post" title="Copiar o link do post" onClick={compartilhar}>
        <IcoRC.compartilhar />
        {copiado && (
          <span className="rc-acao-nota" role="status">
            Link copiado
          </span>
        )}
      </button>
    </div>
  );
}

/* Menu "…" do post: copiar o link; quem escreveu (ou a coordenação) remove; a
   coordenação fixa em destaque e trava ou libera os comentários (com motivo).
   Cada ação de moderação cai no registro de atividades do banco. */
export function MenuPost({
  post,
  eu,
  onRemovido,
}: {
  post: PostFeed;
  eu: Eu;
  /** o cartão some da tela assim que o post é removido */
  onRemovido?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pending, start] = useTransition();
  const souAutor = eu.perfilId === post.autor.id;

  const executar = (fn: () => Promise<{ erro?: string }>, fechar: () => void) =>
    start(async () => {
      setErro(null);
      const r = await fn();
      if (r.erro) setErro(r.erro);
      else {
        fechar();
        router.refresh();
      }
    });

  const alternarTrava = (fechar: () => void) => {
    if (post.comentarios_travados) {
      executar(() => travarComentarios(post.id, false), fechar);
      return;
    }
    const motivo = prompt("Motivo da trava (aparece para os membros). Pode deixar em branco.", "Post fora da regra da #.");
    if (motivo === null) return;
    executar(() => travarComentarios(post.id, true, motivo), fechar);
  };

  const remover = (fechar: () => void) => {
    if (!confirm("Remover este post?")) return;
    start(async () => {
      setErro(null);
      const r = await apagarPost(post.id);
      if (r.erro) {
        setErro(r.erro);
        return;
      }
      fechar();
      onRemovido?.();
      // na página do próprio post não sobra o que mostrar: volta para a Discussão
      if (pathname.startsWith("/comunidade/post/")) router.push("/comunidade");
      else router.refresh();
    });
  };

  const copiar = async (fechar: () => void) => {
    const link = linkDoPost(post.id);
    if (!(await copiarTexto(link))) {
      // navegador que não deixa copiar sozinho: mostra o link para a pessoa copiar
      fechar();
      window.prompt("Copie o link do post:", link);
      return;
    }
    setErro(null);
    setCopiado(true);
    setTimeout(() => {
      setCopiado(false);
      fechar();
    }, 1200);
  };

  return (
    <Menu
      rotulo="Opções do post"
      gatilho={({ aberto, alternar }) => (
        <button type="button" className="rc-post-pontos" aria-label="Opções do post" aria-haspopup="menu" aria-expanded={aberto} onClick={alternar}>
          <IcoRC.pontos />
        </button>
      )}
    >
      {(fechar) => (
        <>
          <ItemMenu icone={copiado ? <IcoRC.marcado /> : <IcoRC.link />} onClick={() => copiar(fechar)}>
            {copiado ? "Link copiado" : "Copiar link do post"}
          </ItemMenu>
          {eu.isAdmin && (
            <>
              <ItemMenu
                icone={<IcoRC.pin />}
                disabled={pending}
                onClick={() => executar(() => fixarPost(post.id, !post.fixado), fechar)}
                sub={post.fixado ? "Sai da caixa Em destaque" : "Vai para a caixa Em destaque"}
              >
                {post.fixado ? "Tirar do destaque" : "Fixar em destaque"}
              </ItemMenu>
              <ItemMenu
                icone={post.comentarios_travados ? <IcoRC.comentar /> : <IcoRC.balaoTravado />}
                disabled={pending}
                onClick={() => alternarTrava(fechar)}
                sub={post.comentarios_travados ? "Os membros voltam a comentar" : "Só a coordenação comenta"}
              >
                {post.comentarios_travados ? "Liberar comentários" : "Travar comentários"}
              </ItemMenu>
            </>
          )}
          {(souAutor || eu.isAdmin) && (
            <>
              <DivisorMenu />
              <ItemMenu icone={<IcoRC.lixo />} perigo disabled={pending} onClick={() => remover(fechar)}>
                Remover post
              </ItemMenu>
            </>
          )}
          {erro && (
            <p className="rc-erro-texto rc-menu-erro" role="alert">
              {erro}
            </p>
          )}
        </>
      )}
    </Menu>
  );
}
