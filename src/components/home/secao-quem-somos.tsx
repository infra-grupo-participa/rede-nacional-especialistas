"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { C, F } from "@/lib/tokens";
import { TIPO } from "@/lib/landing";
import { Reveal } from "@/components/home/reveal";

/* Bloco institucional "Quem somos" — fundo claro, id ancorado no scrollspy do
   header. Os três conteúdos (quem somos / liderança / diferencial) viram abas
   para o texto ser escaneável em vez de um paredão de parágrafos.

   Acessibilidade das abas: roving tabindex (só a ativa entra no fluxo de Tab),
   setas nas duas orientações porque o trilho é horizontal no mobile e vertical
   no desktop, Home/End, e seleção acompanha o foco (padrão APG para abas cujo
   painel troca sem custo). A troca do painel reusa a animação `.entra` do
   design system (~fade+translateY), desligada globalmente em reduced-motion. */

/* Destaques do copy aprovado: peso + tinta cheia sobre o corpo em muted.
   Helper em vez de dangerouslySetInnerHTML — o copy fica legível no JSX. */
function Forte({ children }: { children: ReactNode }) {
  return <strong style={{ fontWeight: 700, color: C.ink }}>{children}</strong>;
}

type Aba = { id: string; rotulo: string; conteudo: ReactNode };

const ABAS: readonly Aba[] = [
  {
    id: "quem",
    rotulo: "Quem somos",
    conteudo: (
      <>
        <p>
          <Forte>O Time Holding Brasil</Forte> é orgulhosamente o maior grupo de profissionais
          especialistas em <Forte>estruturação patrimonial e de negócios</Forte> do Brasil.
        </p>
        <p>
          Mais do que uma consultoria, somos uma <Forte>rede de inteligência estratégica</Forte> que
          reúne os maiores nomes do setor para oferecer soluções que garantem{" "}
          <Forte>segurança, eficiência tributária e perpetuidade patrimonial</Forte> aos nossos
          clientes.
        </p>
        <p>
          Nossa atuação é pautada na <Forte>união de forças</Forte>: combinamos conhecimento técnico
          de ponta com visão prática de mercado, transformando estruturas complexas em{" "}
          <Forte>resultados sólidos e acessíveis</Forte> para famílias e empresários em todo o
          território nacional.
        </p>
      </>
    ),
  },
  {
    id: "lideranca",
    rotulo: "Nossa liderança",
    conteudo: (
      <p>
        Fundado por quem entende do negócio — <Forte>Marcio Carvalho de Sá</Forte> é amplamente
        reconhecido como a <Forte>maior referência brasileira em Holding Familiar</Forte>, e lidera a
        formação dos especialistas da rede.
      </p>
    ),
  },
  {
    id: "diferencial",
    rotulo: "Nosso diferencial",
    conteudo: (
      <>
        <p>
          Nenhuma atuação isolada entrega o que a rede entrega unida: são{" "}
          <Forte>especialistas em todos os estados do país</Forte>, formados sob o mesmo padrão
          técnico e conectados em uma comunidade que se fortalece a cada edição.
        </p>
        <p>
          É a <Forte>união de forças</Forte> entre técnica de ponta e prática de mercado que
          transforma autoridade individual em <Forte>resultado coletivo</Forte> — segurança e
          perpetuidade patrimonial ao alcance de famílias e empresários em qualquer lugar do Brasil.
        </p>
      </>
    ),
  },
] as const;

export function SecaoQuemSomos() {
  const [ativa, setAtiva] = useState(0);
  const refsAbas = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

  const idAba = (i: number) => `${baseId}-aba-${i}`;
  const idPainel = (i: number) => `${baseId}-painel-${i}`;

  function aoTeclarNaLista(e: KeyboardEvent<HTMLDivElement>) {
    let alvo = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") alvo = (ativa + 1) % ABAS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") alvo = (ativa - 1 + ABAS.length) % ABAS.length;
    else if (e.key === "Home") alvo = 0;
    else if (e.key === "End") alvo = ABAS.length - 1;
    if (alvo < 0) return;
    e.preventDefault(); // evita a página rolar junto com ArrowUp/Down dentro da lista
    setAtiva(alvo);
    refsAbas.current[alvo]?.focus();
  }

  return (
    <section id="quem-somos" className="lp-secao" style={{ background: C.fundo }}>
      <div className="lp-container">
        {/* grid-cols-1 (minmax(0,1fr)) + min-w-0 nos filhos: sem isso o trilho de
            abas (pílulas que não encolhem) infla o track `auto` do grid além do
            viewport no mobile e os parágrafos vazam para fora da tela. */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          {/* coluna de contexto + abas (vira topo empilhado no mobile) */}
          <div className="min-w-0 lg:col-span-5">
            <Reveal>
              <p style={{ ...TIPO.eyebrow, fontFamily: F.mono, color: C.laranja }}>
                Time Holding Brasil
              </p>
              <h2 className="mt-4" style={{ ...TIPO.h2, color: C.ink, textWrap: "balance" }}>
                Uma união de forças em escala nacional
              </h2>
            </Reveal>

            <Reveal atraso={90}>
              <div
                role="tablist"
                aria-label="Sobre o Time Holding Brasil"
                onKeyDown={aoTeclarNaLista}
                className="lp-trilho mt-8 flex gap-2.5 overflow-x-auto pb-1 lg:mt-10 lg:flex-col lg:items-start lg:overflow-visible lg:pb-0"
              >
                {ABAS.map((aba, i) => {
                  const selecionada = ativa === i;
                  return (
                    <button
                      key={aba.id}
                      ref={(el) => {
                        refsAbas.current[i] = el;
                      }}
                      type="button"
                      role="tab"
                      id={idAba(i)}
                      aria-selected={selecionada}
                      aria-controls={idPainel(i)}
                      tabIndex={selecionada ? 0 : -1}
                      onClick={() => setAtiva(i)}
                      className="press flex-none whitespace-nowrap"
                      style={{
                        // pílula = regime de radius dos chips da LP; ativa segue a
                        // regra da marca: sobre laranja, texto sempre preto.
                        height: 44,
                        padding: "0 22px",
                        borderRadius: 9999,
                        fontFamily: F.sans,
                        fontSize: 14.5,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                        background: selecionada ? C.laranja : "transparent",
                        color: selecionada ? "#0C0C0C" : C.sobreFundo,
                        border: `1px solid ${selecionada ? C.laranja : C.line}`,
                        transition: "background-color .18s ease, color .18s ease, border-color .18s ease",
                      }}
                    >
                      {aba.rotulo}
                    </button>
                  );
                })}
              </div>
            </Reveal>
          </div>

          {/* painéis */}
          <Reveal atraso={160} className="min-w-0 lg:col-span-7">
            <div className="flex gap-7 lg:min-h-[320px]">
              {/* fio vertical laranja: a âncora visual do painel (sem sombra). */}
              <div
                aria-hidden
                className="hidden w-0.5 flex-none self-stretch rounded-full lg:block"
                style={{ background: `linear-gradient(180deg, ${C.laranja}, transparent)` }}
              />
              <div className="min-w-0 flex-1">
                {ABAS.map((aba, i) => (
                  <div
                    key={aba.id}
                    role="tabpanel"
                    id={idPainel(i)}
                    aria-labelledby={idAba(i)}
                    tabIndex={0}
                    hidden={ativa !== i}
                  >
                    {/* montar só o painel ativo faz a `.entra` retocar a cada troca */}
                    {ativa === i && (
                      <div
                        className="entra max-w-[62ch] space-y-5"
                        style={{ ...TIPO.leadGrande, fontFamily: F.sans, color: C.sobreFundo }}
                      >
                        {aba.conteudo}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
