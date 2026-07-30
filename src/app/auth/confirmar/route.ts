import { type NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/* Confirmação de e-mail. O link do e-mail (enviado pela Edge Function rede-auth-email
   via Resend) traz token_hash + type. Aqui verificamos o OTP, o que estabelece a
   sessão via cookies, e redirecionamos. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // recovery → leva para redefinir a senha; demais → para o destino.
      const destino = type === "recovery" ? "/conta/nova-senha" : next;
      return NextResponse.redirect(new URL(destino, origin));
    }
  }

  return NextResponse.redirect(new URL("/entrar?erro=link-invalido", origin));
}
