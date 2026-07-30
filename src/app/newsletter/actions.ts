"use server";

import { createClient } from "@/lib/supabase/server";

export type NewsletterResult = { erro?: string; ok?: boolean };

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Inscreve um e-mail na newsletter (idempotente por e-mail; persiste de verdade). */
export async function inscreverNewsletter(emailBruto: string): Promise<NewsletterResult> {
  const email = (emailBruto || "").trim().toLowerCase();
  if (!RE_EMAIL.test(email)) return { erro: "Digite um e-mail válido." };

  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_inscritos").insert({ email });

  // índice único por lower(email): duplicado = já inscrito, tratamos como sucesso.
  if (error && !`${error.code}`.includes("23505") && !/duplicate|unique/i.test(error.message)) {
    return { erro: "Não foi possível inscrever agora. Tente de novo." };
  }
  return { ok: true };
}
