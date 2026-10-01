/* Utilitários PUROS do perfil do membro (servem no servidor e no navegador). */

/** Cor de capa aceita: hexadecimal, variável do tema ou gradiente linear
 *  simples (os que o editor do blog grava). Nada de url() nem de ponto e vírgula. */
export function corDeCapaValida(cor: string): boolean {
  if (cor.length > 220 || /url|expression|[;{}<>"'\\]/i.test(cor)) return false;
  return /^(#[0-9a-f]{3,8}|var\(--[\w-]+(,\s*#[0-9a-f]{3,8})?\)|linear-gradient\([#\w\s,.%()-]+\))$/i.test(cor);
}

export type RedeSocial = "instagram" | "linkedin" | "youtube" | "tiktok" | "facebook" | "site";

/** Endereço seguro (sempre https) a partir do que a pessoa digitou: "@perfil",
 *  "in/perfil", domínio ou URL completa. Devolve null se não der para montar. */
export function urlDaRede(tipo: RedeSocial, valor: string | null | undefined): string | null {
  const v = (valor ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
    } catch {
      return null;
    }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return null; // javascript:, data:, mailto: etc.
  const limpo = v.replace(/^@/, "").replace(/^\/+/, "");
  if (!limpo || /[\s<>"']/.test(limpo)) return null;
  const caminho = encodeURI(limpo);
  // endereço da própria rede colado sem o https:// (instagram.com/perfil).
  // Só os domínios das redes: usuário com ponto ("joao.silva") não é domínio.
  if (/^(www\.|m\.|[a-z]{2}\.)?(instagram\.com|linkedin\.com|youtube\.com|youtu\.be|tiktok\.com|facebook\.com|fb\.com|fb\.me)(\/|$)/i.test(limpo)) return `https://${caminho}`;
  switch (tipo) {
    case "instagram":
      return `https://www.instagram.com/${caminho}`;
    case "linkedin":
      return `https://www.linkedin.com/${/^(in|company)\//i.test(limpo) ? caminho : `in/${caminho}`}`;
    case "youtube":
      return limpo.includes(".") ? `https://${caminho}` : `https://www.youtube.com/@${caminho}`;
    case "tiktok":
      return `https://www.tiktok.com/@${caminho}`;
    case "facebook":
      return limpo.includes(".com") ? `https://${caminho}` : `https://www.facebook.com/${caminho}`;
    case "site":
      return limpo.includes(".") ? `https://${caminho}` : null;
  }
}

/** O que a tela de perfil mostra e edita. Contato só vem preenchido para o dono. */
export interface DadosPerfil {
  nome: string;
  headline: string;
  bio: string;
  profissao: string;
  espaco: string;
  cidade: string;
  uf: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  facebook: string;
  site: string;
  especialidades: string[];
  destaques: { titulo: string; texto: string }[];
  /** só no próprio perfil */
  whatsapp: string;
  telefone: string;
}
