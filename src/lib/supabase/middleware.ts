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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Primeiro/último acesso por membro, inclusive de quem só lê (item 4 do
  // documento da comunidade). Um registro a cada 10 min por navegador basta:
  // o cookie segura as chamadas seguintes. Falha aqui nunca derruba a página.
  if (user && !request.cookies.get(COOKIE_ACESSO) && ehNavegacao(request)) {
    try {
      await supabase.rpc("registrar_acesso");
      response.cookies.set(COOKIE_ACESSO, "1", {
        maxAge: 60 * 10,
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
      });
    } catch {
      // sem registro desta vez; a próxima navegação tenta de novo
    }
  }

  return response;
}

const COOKIE_ACESSO = "rede_acesso";

/** Só navegação de página conta como acesso (não prefetch nem chamada interna). */
function ehNavegacao(request: NextRequest): boolean {
  if (request.method !== "GET") return false;
  const h = request.headers;
  if (h.get("next-router-prefetch") || h.get("purpose") === "prefetch") return false;
  return true;
}
