import { createClient } from "@/lib/supabase/browser";

/* ============================================================================
   Upload de imagem de artigo (client). Mede o arquivo antes de subir e recusa
   imagem menor que o mínimo — esticar foto pequena estraga a página.
   Bucket `artigos` (público; policy de INSERT exige is_rede_aprovado).
   ========================================================================== */

export const MEDIDAS = {
  capa: {
    rotulo: "Capa do artigo",
    largura: 1200,
    altura: 630,
    minLargura: 800,
    maxMB: 5,
    dica: "1200 × 630 px (paisagem, 1.91:1) — é o que aparece na listagem e ao compartilhar.",
  },
  bloco: {
    rotulo: "Imagem do texto",
    largura: 1200,
    altura: 675,
    minLargura: 800,
    maxMB: 5,
    dica: "1200 × 675 px (paisagem, 16:9) — entra no meio do artigo, na largura da coluna.",
  },
  // perfil
  avatar: {
    rotulo: "Foto de perfil",
    largura: 400,
    altura: 400,
    minLargura: 200,
    maxMB: 4,
    dica: "Quadrada (1:1), mínimo 200 px. Aparece no seu perfil e nos posts.",
  },
  perfilcapa: {
    rotulo: "Capa do perfil",
    largura: 1200,
    altura: 400,
    minLargura: 800,
    maxMB: 5,
    dica: "1200 × 400 px (banner). O fundo do topo do seu perfil.",
  },
} as const;

export type TipoImagem = keyof typeof MEDIDAS;

const TIPOS_OK = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "artigos";

function medir(file: File): Promise<{ largura: number; altura: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ largura: img.naturalWidth, altura: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não consegui ler essa imagem. Tente JPG, PNG ou WebP."));
    };
    img.src = url;
  });
}

export interface ResultadoUpload {
  url: string;
  largura: number;
  altura: number;
}

/** Valida e sobe a imagem. Lança Error com mensagem pronta para o usuário. */
export async function subirImagem(file: File, tipo: TipoImagem = "bloco"): Promise<ResultadoUpload> {
  const m = MEDIDAS[tipo] ?? MEDIDAS.bloco;

  if (!TIPOS_OK.includes(file.type)) {
    throw new Error("Formato não aceito. Use JPG, PNG ou WebP.");
  }
  const mb = file.size / (1024 * 1024);
  if (mb > m.maxMB) {
    throw new Error(`A imagem tem ${mb.toFixed(1)} MB. O limite é ${m.maxMB} MB.`);
  }

  const { largura, altura } = await medir(file);
  if (largura < m.minLargura) {
    throw new Error(
      `Imagem muito pequena (${largura} px de largura). O mínimo é ${m.minLargura} px — o ideal é ${m.largura} × ${m.altura}.`,
    );
  }

  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const caminho = `${tipo}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(caminho, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Falha ao enviar a imagem: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(caminho);
  return { url: data.publicUrl, largura, altura };
}
