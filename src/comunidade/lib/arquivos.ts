import { createClient } from "@/lib/supabase/server";
import { BUCKET_ARQUIVOS, type Arquivo, type MidiaPost } from "@/comunidade/lib/arquivos-tipos";

export * from "@/comunidade/lib/arquivos-tipos";

/* Aba de arquivos e mídias (o repositório do grupo do Facebook). Arquivo
   enviado fica no bucket PRIVADO `rede-arquivos`; quem abre recebe uma URL
   assinada de curta duração. Link externo (Drive, YouTube) fica só como URL. */

export async function listarArquivos(): Promise<Arquivo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("arquivos")
    .select(
      `id, titulo, descricao, tipo, caminho, url, mime, tamanho_bytes, fixado, criado_em,
       autor:autor_id (id, slug, nome, qualificacao, verificado)`,
    )
    .order("fixado", { ascending: false })
    .order("criado_em", { ascending: false })
    .limit(300);
  const lista = (data ?? []) as unknown as Arquivo[];

  // Miniaturas das imagens enviadas: uma chamada assinando todas (1 h).
  const caminhos = lista.filter((a) => a.tipo === "imagem" && a.caminho).map((a) => a.caminho as string);
  if (caminhos.length > 0) {
    const { data: assinadas } = await supabase.storage.from(BUCKET_ARQUIVOS).createSignedUrls(caminhos, 60 * 60);
    const mapa = new Map((assinadas ?? []).map((s) => [s.path, s.signedUrl]));
    for (const a of lista) if (a.caminho) a.miniatura = mapa.get(a.caminho) ?? null;
  }
  return lista;
}

/** Fotos publicadas nos posts do feed (a parte "mídias" da aba). */
export async function midiasDosPosts(limite = 120): Promise<MidiaPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, imagem_url, titulo, corpo, criado_em, autor:autor_id (nome)")
    .eq("status", "publicado")
    .neq("imagem_url", "")
    .order("criado_em", { ascending: false })
    .limit(limite);
  return ((data ?? []) as unknown as {
    id: string;
    imagem_url: string;
    titulo: string;
    corpo: string;
    criado_em: string;
    autor: { nome: string } | null;
  }[])
    .filter((p) => p.imagem_url && p.imagem_url.trim().length > 1)
    .map((p) => ({
      post_id: p.id,
      imagem_url: p.imagem_url,
      titulo: p.titulo || p.corpo.slice(0, 80),
      criado_em: p.criado_em,
      autor: p.autor?.nome ?? "",
    }));
}
