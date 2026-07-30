import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_SCHEMA,
  SUPABASE_URL,
  noStoreFetch,
} from "./config";

/**
 * Client Supabase para Server Components, Route Handlers e Server Actions.
 * Lê/escreve a sessão via cookies. Schema `rede`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: SUPABASE_SCHEMA },
    global: { fetch: noStoreFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado de um Server Component (read-only). O middleware renova a
          // sessão, então é seguro ignorar aqui.
        }
      },
    },
  });
}
