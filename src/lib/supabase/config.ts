export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const SUPABASE_SCHEMA =
  process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "rede";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Falha cedo e claro — evita erro obscuro em runtime.
  throw new Error(
    "Config Supabase ausente: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

/**
 * O supabase-js usa fetch do Next, que por padrão é cacheado no App Router.
 * Isso devolve dados velhos após mudança no banco. Forçamos no-store em toda
 * chamada (mesmo com route handlers dinâmicos, esse cache persiste).
 */
export const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });
