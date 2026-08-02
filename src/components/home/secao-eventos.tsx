"use client";

/* ============================================================================
   Seção "Próximos Eventos" — calendário da agenda pública THB 2026.

   Três painéis num único quadro escuro (a "agenda física" da marca): lombada
   de meses → grade do mês → eventos do mês. No mobile a lombada vira trilho
   horizontal de chips e a grade compacta em número + pontos de categoria.
   Subcomponentes e constantes em `calendario/` — este arquivo é o único dono
   do estado (mês, dia selecionado, foco da grade).
   ========================================================================== */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import {
  CATEGORIAS, MESES, DIAS_SEMANA,
  chaveDia, diasDoEvento, eventosDoMes, gradeDoMes, horaDe, paraData, AGENDA,
} from "@/lib/eventos";
import { GRAD, LP, TIPO, textoGradiente } from "@/lib/landing";
import { C, F } from "@/lib/tokens";
import { Ico } from "@/components/icons";
import { Reveal } from "@/components/home/reveal";
import {
  ANO, DIAS_LONGOS, COR_CLARA, ESTILO_LOCAL, POR_DIA,
  assinarNada, lerHojeNoCliente, lerHojeNoServidor,
  mesDoPrimeiroFuturo, proximoComEventos, reduzMotion,
} from "@/components/home/calendario/apoio";
import { Legenda, LombadaMeses, TrilhoMeses } from "@/components/home/calendario/meses";
import { CartaoEvento } from "@/components/home/calendario/cartao-evento";

export function SecaoEventos() {
  const hoje = useSyncExternalStore(assinarNada, lerHojeNoCliente, lerHojeNoServidor);

  /* O mês exibido é DERIVADO de "hoje" (primeiro evento futuro) até o visitante
     escolher um — assim o primeiro render é determinístico e, se ele chegar
     depois de REF_HOJE, a seção avança sozinha sem setState em effect. */
  const [mesEscolhido, setMesEscolhido] = useState<number | null>(null);
  const mes = mesEscolhido ?? mesDoPrimeiroFuturo(paraData(`${hoje}T00:00`));

  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  /* Roving tabindex: -1 = "sem foco explícito", cai no padrão do mês. */
  const [focoDia, setFocoDia] = useState(-1);

  const refCelulas = useRef<(HTMLDivElement | null)[]>([]);
  const refEventos = useRef<Record<string, HTMLAnchorElement | null>>({});

  const grade = useMemo(() => gradeDoMes(ANO, mes), [mes]);
  const eventos = useMemo(() => eventosDoMes(AGENDA, ANO, mes), [mes]);

  const idxHoje = grade.findIndex((c) => c.doMes && chaveDia(c.data) === hoje);
  const focoPadrao = idxHoje >= 0 ? idxHoje : grade.findIndex((c) => c.doMes);
  const foco = focoDia >= 0 ? focoDia : focoPadrao;

  const irParaMes = (m: number) => {
    if (m < 0 || m > 11 || m === mes) return;
    setMesEscolhido(m);
    setDiaSelecionado(null);
    setFocoDia(-1);
  };

  /* Seleciona o dia e rola o painel até o primeiro evento dele. */
  useEffect(() => {
    if (!diaSelecionado) return;
    const [primeiro] = POR_DIA[diaSelecionado] ?? [];
    if (!primeiro) return;
    refEventos.current[primeiro.id]?.scrollIntoView({
      block: "nearest",
      behavior: reduzMotion() ? "auto" : "smooth",
    });
  }, [diaSelecionado]);

  const ativarCelula = (cel: { data: Date; doMes: boolean }, viaTeclado = false) => {
    const { data, doMes } = cel;
    if (data.getFullYear() !== ANO) return; // borda dez/2025 e jan/2027 da grade
    if (!doMes) {
      /* Clique em dia vizinho navega até o mês dele; no teclado não, porque o
         remount da grade jogaria o foco para o body. */
      if (viaTeclado) return;
      setMesEscolhido(data.getMonth());
      setFocoDia(-1);
    }
    const chave = chaveDia(data);
    if (POR_DIA[chave]?.length) setDiaSelecionado(chave);
  };

  const aoTeclarNaCelula = (ev: KeyboardEvent, i: number) => {
    const saltos: Record<string, number> = {
      ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + 7, ArrowUp: i - 7,
      Home: i - (i % 7), End: i - (i % 7) + 6,
    };
    if (ev.key in saltos) {
      ev.preventDefault();
      const alvo = Math.min(41, Math.max(0, saltos[ev.key]));
      setFocoDia(alvo);
      refCelulas.current[alvo]?.focus();
      return;
    }
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      ativarCelula(grade[i], true);
    }
  };

  const rotuloCelula = (data: Date) => {
    const evs = POR_DIA[chaveDia(data)] ?? [];
    const base = `${data.getDate()} de ${MESES[data.getMonth()].toLowerCase()}`;
    if (!evs.length) return `${base}, sem eventos`;
    return `${base}, ${evs.length === 1 ? "1 evento" : `${evs.length} eventos`}: ${evs.map((e) => e.titulo).join("; ")}`;
  };

  return (
    <section
      id="proximos-eventos"
      aria-labelledby="titulo-proximos-eventos"
      className="lp-secao relative overflow-hidden"
      style={{ background: LP.pretoFrio }}
    >
      <style>{ESTILO_LOCAL}</style>

      {/* glow frio atrás do quadro + eco laranja discreto — profundidade sem sombra. */}
      <div aria-hidden className="lp-glow lp-respira" style={{ background: GRAD.glowFrio, width: 980, height: 980, top: -220, right: -260 }} />
      <div aria-hidden className="lp-glow" style={{ background: GRAD.glow, width: 620, height: 620, bottom: -340, left: -240, opacity: 0.45 }} />

      <div className="lp-container relative">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="max-w-2xl">
              <p style={TIPO.eyebrow}>
                <span style={textoGradiente}>Agenda 2026</span>
              </p>
              <h2 id="titulo-proximos-eventos" className="mt-3" style={{ ...TIPO.h2, color: "#fff" }}>
                Próximos Eventos
              </h2>
              <p className="mt-4" style={{ ...TIPO.leadGrande, color: LP.tintaEscuraFraca }}>
                O calendário oficial da rede: Encontro Nacional, Curso Nacional em Formação,
                clínicas de casos e plantões de consultoria. Clique em um evento para abrir a inscrição.
              </p>
            </div>
            <p className="flex items-center gap-2" style={{ fontSize: 12.5, fontFamily: F.mono, color: LP.tintaEscuraSuave }}>
              <Ico.relogio aria-hidden style={{ width: 14, height: 14 }} />
              Horários no fuso de Brasília
            </p>
          </div>
        </Reveal>

        {/* anúncio discreto da troca de mês para leitores de tela. */}
        <p className="sr-only" aria-live="polite">
          {MESES[mes]} de {ANO}: {eventos.length === 1 ? "1 evento" : `${eventos.length} eventos`}
        </p>

        <Reveal atraso={60}>
          <TrilhoMeses mes={mes} aoEscolher={irParaMes} />
        </Reveal>

        {/* ------------------------------------------------ quadro de 3 painéis */}
        <Reveal atraso={90}>
          <div
            className="mt-4 overflow-hidden rounded-[20px] lg:mt-12 lg:grid lg:grid-cols-[232px_minmax(0,1fr)_336px]"
            style={{ background: LP.pretoCard, border: `1px solid ${LP.linhaEscura}` }}
          >
            <LombadaMeses mes={mes} aoEscolher={irParaMes} />

            {/* grade central. */}
            <div className="px-3 pb-4 lg:px-5 lg:pb-5">
              <div className="flex items-center justify-between py-4">
                <h3 style={{ ...TIPO.h3, color: "#fff" }}>
                  {MESES[mes]}{" "}
                  <span style={{ fontFamily: F.mono, fontVariantNumeric: "tabular-nums", fontWeight: 500, color: LP.tintaEscuraSuave }}>{ANO}</span>
                </h3>
                <div className="flex gap-2">
                  {[
                    { rotulo: "Mês anterior", salto: -1, Icone: Ico.esquerda },
                    { rotulo: "Próximo mês", salto: 1, Icone: Ico.chevron },
                  ].map(({ rotulo, salto, Icone }) => (
                    <button
                      key={rotulo}
                      type="button"
                      aria-label={rotulo}
                      disabled={salto < 0 ? mes === 0 : mes === 11}
                      onClick={() => irParaMes(mes + salto)}
                      className="sev-foco flex h-9 w-9 items-center justify-center rounded-full disabled:cursor-default disabled:opacity-35"
                      style={{ border: `1px solid ${LP.linhaEscura}`, color: "#fff" }}
                    >
                      <Icone aria-hidden style={{ width: 16, height: 16 }} />
                    </button>
                  ))}
                </div>
              </div>

              <div role="grid" aria-label={`Calendário de ${MESES[mes].toLowerCase()} de ${ANO}`}>
                <div role="row" className="grid grid-cols-7 gap-px pb-2">
                  {DIAS_SEMANA.map((d, i) => (
                    <div
                      key={d}
                      role="columnheader"
                      aria-label={DIAS_LONGOS[i]}
                      className="text-center uppercase"
                      style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: "0.12em", color: LP.tintaEscuraSuave }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* key={mes} remonta a grade com a entrada de 220ms; o gap-px
                    sobre fundo claro desenha as hairlines sem 42 bordas. */}
                <div key={mes} className="sev-entra overflow-hidden rounded-xl" style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.07)" }}>
                  {Array.from({ length: 6 }, (_, s) => (
                    <div key={s} role="row" className="grid grid-cols-7 gap-px" style={{ marginTop: s ? 1 : 0 }}>
                      {grade.slice(s * 7, s * 7 + 7).map((cel, col) => {
                        const i = s * 7 + col;
                        const chave = chaveDia(cel.data);
                        const evs = POR_DIA[chave] ?? [];
                        const ehHoje = cel.doMes && chave === hoje;
                        const selecionado = chave === diaSelecionado && cel.doMes;
                        return (
                          <div
                            key={chave}
                            ref={(el) => { refCelulas.current[i] = el; }}
                            role="gridcell"
                            tabIndex={i === foco ? 0 : -1}
                            aria-selected={selecionado}
                            aria-current={ehHoje ? "date" : undefined}
                            aria-label={rotuloCelula(cel.data)}
                            onClick={() => { setFocoDia(i); ativarCelula(cel); }}
                            onKeyDown={(ev) => aoTeclarNaCelula(ev, i)}
                            className="sev-foco sev-celula flex min-h-[46px] flex-col items-center gap-1 p-1 lg:min-h-[82px] lg:items-stretch lg:p-1.5"
                            style={{ cursor: evs.length || !cel.doMes ? "pointer" : "default" }}
                          >
                            <span
                              className="relative flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full"
                              style={{
                                fontFamily: F.mono, fontVariantNumeric: "tabular-nums", fontSize: 12.5,
                                fontWeight: ehHoje ? 800 : 600,
                                background: ehHoje ? C.laranja : "transparent",
                                border: selecionado && !ehHoje ? `1px solid ${C.laranja}` : "1px solid transparent",
                                color: ehHoje ? "#0C0C0C" : cel.doMes ? "#fff" : LP.tintaEscuraSuave,
                              }}
                            >
                              {ehHoje && <span aria-hidden className="sev-pulso" />}
                              {cel.data.getDate()}
                            </span>

                            {/* mobile: pontos de categoria; desktop: pílulas com rótulo. */}
                            {evs.length > 0 && (
                              <span aria-hidden className={`flex gap-[3px] lg:hidden ${cel.doMes ? "" : "opacity-40"}`}>
                                {evs.slice(0, 3).map((e) => (
                                  <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: COR_CLARA[e.categoria] }} />
                                ))}
                              </span>
                            )}
                            <span aria-hidden className={`hidden min-w-0 flex-col gap-0.5 lg:flex ${cel.doMes ? "" : "opacity-40"}`}>
                              {evs.slice(0, 2).map((e) => (
                                /* tabIndex -1: o teclado abre pelo painel direito; a
                                   pílula é atalho de mouse (pedido do wireframe). */
                                <a
                                  key={e.id}
                                  href={e.linkInscricao}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  tabIndex={-1}
                                  onClick={(ev) => ev.stopPropagation()}
                                  className="flex items-center gap-1 truncate rounded-full px-1.5 py-px"
                                  style={{ background: `${COR_CLARA[e.categoria]}1F`, color: COR_CLARA[e.categoria], fontSize: 10.5, fontWeight: 600, lineHeight: "15px" }}
                                >
                                  {horaDe(e) && (
                                    <span className="hidden xl:inline" style={{ fontFamily: F.mono, fontVariantNumeric: "tabular-nums" }}>
                                      {horaDe(e)}
                                    </span>
                                  )}
                                  <span className="truncate">{CATEGORIAS[e.categoria].rotulo}</span>
                                </a>
                              ))}
                              {evs.length > 2 && (
                                <span className="px-1.5" style={{ fontSize: 10, color: LP.tintaEscuraSuave }}>+{evs.length - 2}</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 lg:hidden">
                <Legenda horizontal />
              </div>
            </div>

            {/* painel de eventos do mês. */}
            <aside
              aria-label={`Eventos de ${MESES[mes].toLowerCase()}`}
              className="border-t p-4 lg:max-h-[660px] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:p-5"
              style={{ borderColor: LP.linhaEscura }}
            >
              <p className="hidden lg:block" style={{ ...TIPO.eyebrow, color: LP.tintaEscuraSuave }}>Eventos do mês</p>
              <div key={mes} className="sev-entra mt-0 flex flex-col gap-3 lg:mt-4">
                {eventos.length === 0 ? (
                  <div className="flex flex-col items-start gap-3 rounded-2xl p-4" style={{ border: `1px dashed ${LP.linhaEscura}` }}>
                    <Ico.calendario aria-hidden style={{ width: 20, height: 20, color: LP.tintaEscuraSuave }} />
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: LP.tintaEscuraFraca }}>
                      Nenhum evento em {MESES[mes].toLowerCase()}. A agenda da rede se concentra no segundo semestre.
                    </p>
                    {proximoComEventos(mes) > -1 && (
                      <button
                        type="button"
                        onClick={() => irParaMes(proximoComEventos(mes))}
                        className="sev-foco flex items-center gap-1.5 rounded-full px-3.5 py-2"
                        style={{ border: `1px solid rgba(255,107,26,.4)`, color: C.laranja, fontSize: 12.5, fontWeight: 700 }}
                      >
                        Ir para {MESES[proximoComEventos(mes)].toLowerCase()}
                        <Ico.chevron aria-hidden style={{ width: 13, height: 13 }} />
                      </button>
                    )}
                  </div>
                ) : (
                  eventos.map((e) => (
                    <CartaoEvento
                      key={e.id}
                      evento={e}
                      ativo={!!diaSelecionado && diasDoEvento(e).includes(diaSelecionado)}
                      aoRef={(el) => { refEventos.current[e.id] = el; }}
                    />
                  ))
                )}
              </div>
            </aside>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
