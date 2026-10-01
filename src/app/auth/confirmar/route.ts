import { type NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { URL_CONFIRMAR_AUTH } from "@/lib/supabase/config";

const ORIGEM_DO_SITE = new URL(URL_CONFIRMAR_AUTH).origin;
const HOST_DO_SITE = new URL(URL_CONFIRMAR_AUTH).host;

/** Origem PÚBLICA para montar o redirect. Atrás do Passenger (Hostinger) o
 *  `request.url` vem com o endereço interno do servidor (`https://0.0.0.0:3000`),
 *  e redirecionar para ele deixava a pessoa numa página que não abre: o link
 *  do e-mail validava a sessão e morria ali. Só confia no Host quando ele é o
 *  do site ou localhost (desenvolvimento); qualquer outro cai no site. */
function origemPublica(request: NextRequest): string {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").toLowerCase();
  if (host === HOST_DO_SITE) return ORIGEM_DO_SITE;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return `http://${host}`;
  return ORIGEM_DO_SITE;
}

/** Só caminho interno: evita que ?next= vire redirecionamento para outro site. */
function caminhoSeguro(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
}

/* Confirmação de e-mail. O link do e-mail (modelo de recuperação do Supabase,
   enviado pelo SMTP do projeto via Resend) traz token_hash + type. Aqui
   verificamos o OTP, o que estabelece a sessão via cookies, e redirecionamos. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origem = origemPublica(request);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = caminhoSeguro(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // recovery → leva para redefinir a senha; demais → para o destino.
      const destino = type === "recovery" ? "/conta/nova-senha" : next;
      return NextResponse.redirect(new URL(destino, origem));
    }
  }

  return NextResponse.redirect(new URL("/entrar?erro=link-invalido", origem));
}
