export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SCHEMA =
  process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "rede";

/**
 * Valida a config no momento de USO (criação do client), não na avaliação do
 * módulo. Se validasse no topo, um `next build` sem as envs (ex.: build da
 * Hostinger antes de configurar o painel) quebraria ao coletar dados das
 * páginas. Aqui o erro continua claro, mas só dispara em runtime real.
 */
export function assertSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Config Supabase ausente: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}

/**
 * O supabase-js usa fetch do Next, que por padrão é cacheado no App Router.
 * Isso devolve dados velhos após mudança no banco. Forçamos no-store em toda
 * chamada (mesmo com route handlers dinâmicos, esse cache persiste).
 */
export const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });
