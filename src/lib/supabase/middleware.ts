import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_SCHEMA,
  SUPABASE_URL,
  noStoreFetch,
} from "./config";

/**
 * Renova a sessão a cada request e reescreve os cookies. Chamado do middleware
 * raiz. Mantém o token fresco para Server Components.
 *
 * NÃO valida a config aqui: o proxy roda em TODA request; se lançasse por env
 * ausente, derrubaria o site inteiro com 500. Sem config, apenas segue sem
 * sessão — as páginas que realmente usam o banco reportam o erro no uso.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Sem Supabase configurado: não há sessão a renovar. Segue a request.
    return response;
  }

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
