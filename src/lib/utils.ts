/* Utilitários puros — portados do MVP .jsx (norm, slug, iniciais, fone, datas,
   waLink, tintas determinísticas). Sem I/O, sem DOM. */

// Range de marcas diacríticas combinantes (U+0300–U+036F), escrito por código
// para não depender de como o editor salvou os bytes.
const DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g");

export function norm(s: string | null | undefined): string {
  return (s || "").normalize("NFD").replace(DIACRITICOS, "").toLowerCase().trim();
}

export function slugify(s: string): string {
  return norm(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

export function fone(v: string): string {
  const d = (v || "").replace(/\D/g, "");
  if (d.length < 10) return v;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function dataCurta(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

export function dataPonto(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${MESES[d.getMonth()]}.${d.getFullYear()}`;
}

export function mesAno(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${MESES[d.getMonth()]}/${d.getFullYear()}`;
}

/** Tempo relativo curto, estilo "há 3d" / "há 2h" / "agora". */
export function tempoRelativo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d}d`;
  return dataPonto(iso);
}

export function waLink(whatsapp: string, nome: string): string {
  const primeiro = nome.split(" ")[0];
  const texto = `Olá, ${primeiro}! Encontrei seu perfil na Rede Nacional de Especialistas e gostaria de conversar.`;
  return `https://wa.me/55${(whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
}

export function tintaAvatar(nome: string): [string, string] {
  const paleta: [string, string][] = [
    ["#FE7413", "#111111"],
    ["#111111", "#FFFFFF"],
    ["#FFD0A6", "#111111"],
  ];
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return paleta[h % paleta.length];
}

export function tintaCapa(titulo: string): [string, string, string] {
  const paleta: [string, string, string][] = [
    ["#FE7413", "#FFD0A6", "#111111"],
    ["#111111", "#FE7413", "#FFFFFF"],
    ["#FFB877", "#FFF1E4", "#111111"],
  ];
  let h = 0;
  for (let i = 0; i < titulo.length; i++) h = (h * 31 + titulo.charCodeAt(i)) >>> 0;
  return paleta[h % paleta.length];
}
