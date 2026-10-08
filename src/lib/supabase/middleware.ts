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

  // Comunidade (v2, sob /comunidade): primeiro e último acesso por membro,
  // inclusive de quem só lê. Um registro a cada 10 min por navegador basta: o
  // cookie segura as chamadas seguintes. Falha aqui nunca derruba a página. O
  // blog fica de fora de propósito: acesso ao blog não é acesso à comunidade.
  if (user && ehNavegacaoDaComunidade(request) && !request.cookies.get(COOKIE_ACESSO)) {
    // O cliente devolve { error } em vez de lançar: só segura as próximas
    // chamadas se o registro entrou; senão a navegação seguinte tenta de novo.
    const { error } = await supabase.rpc("registrar_acesso");
    if (!error) {
      response.cookies.set(COOKIE_ACESSO, "1", {
        maxAge: 60 * 10,
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/comunidade",
      });
    }
  }

  return response;
}

const COOKIE_ACESSO = "rede_acesso";

/** Só navegação de página dentro da comunidade conta como acesso (não conta
 *  prefetch, chamada interna nem as telas de entrada). */
function ehNavegacaoDaComunidade(request: NextRequest): boolean {
  if (request.method !== "GET") return false;
  const caminho = request.nextUrl.pathname;
  if (caminho !== "/comunidade" && !caminho.startsWith("/comunidade/")) return false;
  // O diagnóstico é isca de lead, não uso da comunidade (pedido do Iromar, 08/10/2026).
  if (caminho === "/comunidade/diagnostico" || caminho.startsWith("/comunidade/diagnostico/")) return false;
  const h = request.headers;
  if (h.get("next-router-prefetch") || h.get("purpose") === "prefetch") return false;
  return true;
}
