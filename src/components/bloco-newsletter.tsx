"use client";

import { useState, useTransition } from "react";
import { C, F } from "@/lib/tokens";
import { Eyebrow } from "@/components/atoms";
import { inscreverNewsletter } from "@/app/newsletter/actions";

/* Captura de e-mail da newsletter — persiste em rede.newsletter_inscritos. */
export function BlocoNewsletter() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const inscrever = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setMsg(null);
    start(async () => {
      const r = await inscreverNewsletter(email);
      if (r.erro) setErro(r.erro);
      else {
        setMsg("Inscrição confirmada — você vai receber nossas novidades.");
        setEmail("");
      }
    });
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
      <Eyebrow>Newsletter</Eyebrow>
      <h3 className="mt-2 text-[20px]" style={{ fontFamily: F.serif, fontWeight: 600 }}>
        Novidades da rede no seu e-mail
      </h3>
      <p className="mt-1.5 text-[14px]" style={{ color: C.muted }}>
        Artigos novos, especialistas certificados e avisos da coordenação — sem spam.
      </p>
      <form onSubmit={inscrever} className="mt-3 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com.br"
          className="min-w-0 flex-1 rounded-xl px-3 text-[15px] outline-none"
          style={{ height: 48, background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}
          aria-label="Seu e-mail"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl px-5 text-[15px] font-semibold"
          style={{ height: 48, background: C.laranja, color: C.ink, opacity: pending ? 0.5 : 1 }}
        >
          Inscrever
        </button>
      </form>
      {msg && (
        <p className="mt-2 text-[13px]" style={{ color: "#14504B" }}>
          {msg}
        </p>
      )}
      {erro && (
        <p className="mt-2 text-[13px]" style={{ color: "#B24A42" }}>
          {erro}
        </p>
      )}
    </div>
  );
}
