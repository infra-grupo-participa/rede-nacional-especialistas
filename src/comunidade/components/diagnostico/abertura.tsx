"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { cadastrarDiagnostico, entrarDiagnostico, type DiagState } from "@/comunidade/acoes/diagnostico";
import { PERGUNTAS } from "@/comunidade/lib/diagnostico";
import { CampoSenha } from "@/comunidade/components/entrada/campo-senha";
import { Seta, TopoDiag, mascararWhats } from "@/comunidade/components/diagnostico/pecas";

/* Abertura do diagnóstico, para quem ainda não tem sessão. À esquerda (no
   celular, em cima) o gancho em bloco laranja; à direita, criar conta ou
   entrar. O login e a senha são a captação do lead: a conta nasce com
   origem "diagnostico" e não vira perfil pendente da comunidade. */

type Aba = "criar" | "entrar";

export function AberturaDiagnostico({ abaInicial = "criar" }: { abaInicial?: Aba }) {
  const [aba, setAba] = useState<Aba>(abaInicial);
  const total = PERGUNTAS.length;

  return (
    <div className="rc-d rc-d-abertura">
      <TopoDiag />
      <div className="rc-d-abertura-palco">
        <section className="rc-d-gancho" aria-labelledby="rc-d-gancho-titulo">
          <svg className="rc-d-gancho-arte" viewBox="0 0 220 124" aria-hidden="true">
            <path d="M 20 110 A 90 90 0 0 1 200 110" pathLength={100} />
            <path d="M 44 110 A 66 66 0 0 1 176 110" pathLength={100} />
            <path d="M 68 110 A 42 42 0 0 1 152 110" pathLength={100} />
          </svg>
          <p className="rc-d-selo">Diagnóstico de Holding Familiar</p>
          <h1 id="rc-d-gancho-titulo" className="rc-d-gancho-titulo">
            Descubra suas chances de viver de Holding Familiar.
          </h1>
          <p className="rc-d-gancho-sub">
            Responda com sinceridade. No fim, você recebe uma nota de 0 a 100 e vê onde está forte e onde precisa crescer.
          </p>
          <ul className="rc-d-numeros">
            <li>
              <b>{total}</b>
              <span>perguntas</span>
            </li>
            <li>
              <b>3</b>
              <span>minutos</span>
            </li>
            <li>
              <b>2</b>
              <span>eixos: técnica e comercial</span>
            </li>
          </ul>
        </section>

        <section className="rc-d-acesso" aria-label="Criar conta ou entrar">
          <div className="rc-d-abas" role="tablist" aria-label="Acesso ao diagnóstico">
            <button
              type="button"
              role="tab"
              id="rc-d-aba-criar"
              aria-selected={aba === "criar"}
              aria-controls="rc-d-painel"
              className="rc-d-aba"
              onClick={() => setAba("criar")}
            >
              Começar agora
            </button>
            <button
              type="button"
              role="tab"
              id="rc-d-aba-entrar"
              aria-selected={aba === "entrar"}
              aria-controls="rc-d-painel"
              className="rc-d-aba"
              onClick={() => setAba("entrar")}
            >
              Já tenho conta
            </button>
          </div>
          <div id="rc-d-painel" role="tabpanel" aria-labelledby={aba === "criar" ? "rc-d-aba-criar" : "rc-d-aba-entrar"}>
            {aba === "criar" ? <FormCriar /> : <FormEntrar />}
          </div>
        </section>
      </div>
    </div>
  );
}

function Aviso({ estado }: { estado: DiagState }) {
  if (estado.erro)
    return (
      <p className="rc-d-aviso rc-d-aviso-erro" role="alert">
        {estado.erro}
      </p>
    );
  if (estado.mensagem)
    return (
      <p className="rc-d-aviso" role="status">
        {estado.mensagem}
      </p>
    );
  return null;
}

function FormCriar() {
  const [estado, acao, pending] = useActionState<DiagState, FormData>(cadastrarDiagnostico, {});
  const [whats, setWhats] = useState("");

  return (
    <form action={acao} className="rc-d-form">
      <h2 className="rc-d-form-titulo">Crie seu acesso para fazer o diagnóstico</h2>
      <p className="rc-d-form-sub">Seu resultado fica salvo e você pode voltar para ver quando quiser.</p>

      <div className="rc-d-dupla">
        <label className="rc-d-campo">
          <span>Nome</span>
          <input name="nome" autoComplete="given-name" required />
        </label>
        <label className="rc-d-campo">
          <span>Sobrenome</span>
          <input name="sobrenome" autoComplete="family-name" required />
        </label>
      </div>
      <label className="rc-d-campo">
        <span>E-mail</span>
        <input name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required />
      </label>
      <label className="rc-d-campo">
        <span>WhatsApp</span>
        <input
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(11) 98765-4321"
          pattern="\(\d{2}\) \d{4,5}-\d{4}"
          title="Informe o DDD e o número do WhatsApp."
          value={whats}
          onChange={(e) => setWhats(mascararWhats(e.target.value))}
          required
        />
      </label>
      <label className="rc-d-campo" htmlFor="rc-d-senha-nova">
        <span>Crie uma senha</span>
      </label>
      <div className="rc-d-senha">
        <CampoSenha id="rc-d-senha-nova" placeholder="Mínimo de 6 caracteres" autoComplete="new-password" minLength={6} />
      </div>

      <Aviso estado={estado} />

      <button type="submit" className="rc-d-botao rc-d-botao-laranja" disabled={pending}>
        {pending ? "Criando seu acesso…" : "Começar o diagnóstico"}
        {!pending && <Seta />}
      </button>
    </form>
  );
}

function FormEntrar() {
  const [estado, acao, pending] = useActionState<DiagState, FormData>(entrarDiagnostico, {});

  return (
    <form action={acao} className="rc-d-form">
      <h2 className="rc-d-form-titulo">Entre para continuar</h2>
      <p className="rc-d-form-sub">Já é membro da Rede de Especialistas? Use o mesmo e-mail e a mesma senha.</p>

      <label className="rc-d-campo">
        <span>E-mail</span>
        <input name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required />
      </label>
      <label className="rc-d-campo" htmlFor="rc-d-senha">
        <span>Senha</span>
      </label>
      <div className="rc-d-senha">
        <CampoSenha id="rc-d-senha" />
      </div>

      <Aviso estado={estado} />

      <button type="submit" className="rc-d-botao rc-d-botao-laranja" disabled={pending}>
        {pending ? "Entrando…" : "Entrar e continuar"}
        {!pending && <Seta />}
      </button>
      <p className="rc-d-legal">
        <Link href="/comunidade/recuperar">Esqueci a senha</Link>
      </p>
    </form>
  );
}
