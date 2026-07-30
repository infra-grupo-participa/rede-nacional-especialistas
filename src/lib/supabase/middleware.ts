import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_SCHEMA,
  SUPABASE_URL,
  assertSupabaseConfig,
  noStoreFetch,
} from "./config";

/**
 * Renova a sessão a cada request e reescreve os cookies. Chamado do middleware
 * raiz. Mantém o token fresco para Server Components.
 */
export async function updateSession(request: NextRequest) {
  assertSupabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: SUPABASE_SCHEMA },
    global: { fetch: noStoreFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANTE: não colocar lógica entre createServerClient e getUser().
  await supabase.auth.getUser();

  return response;
}
