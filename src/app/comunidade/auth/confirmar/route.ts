import { type NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { URL_CONFIRMAR_COMUNIDADE } from "@/comunidade/lib/urls";

const ORIGEM_DO_SITE = new URL(URL_CONFIRMAR_COMUNIDADE).origin;
const HOST_DO_SITE = new URL(URL_CONFIRMAR_COMUNIDADE).host;

/** Origem PÚBLICA para o redirect. Atrás do Passenger (Hostinger) o
 *  `request.url` vem com o endereço interno do servidor (`https://0.0.0.0:3000`).
 *  Só confia no Host quando ele é o do site ou localhost (desenvolvimento). */
function origemPublica(request: NextRequest): string {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").toLowerCase();
  if (host === HOST_DO_SITE) return ORIGEM_DO_SITE;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return `http://${host}`;
  return ORIGEM_DO_SITE;
}

/* Link do e-mail da comunidade (nova senha). O modelo do e-mail traz
   token_hash + type; aqui o OTP é verificado, a sessão fica nos cookies e a
   pessoa segue DENTRO da comunidade. Os destinos são fixos (não há ?next=),
   então o link não serve para redirecionar para outro site. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origem = origemPublica(request);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const destino = type === "recovery" ? "/comunidade/nova-senha" : "/comunidade";
      return NextResponse.redirect(new URL(destino, origem));
    }
  }

  return NextResponse.redirect(new URL("/comunidade/entrar?erro=link-invalido", origem));
}
