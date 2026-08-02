"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { BOTAO, CTA, LP, MENU, TIPO } from "@/lib/landing";
import { Ico } from "@/components/icons";
import { Logo } from "@/components/logo";

/* ============================================================================
   Cabeçalho da landing institucional.

   Barra retangular full-width sobre preto (não é pílula flutuante — a auditoria
   do G4, referência que o PO citou, usa barra). Fio degradê de 1px na base.

   Três comportamentos que precisam andar juntos e por isso moram no mesmo
   componente (o estado de um alimenta o outro):

   1. CONDENSA ao rolar — a barra encolhe e vira vidro fosco depois de 24px.
   2. SCROLLSPY — destaca o item da seção que está passando sob a barra.
   3. ÂNCORA COM OFFSET — clicar rola compensando a altura da barra, senão o
      título da seção fica escondido atrás dela.

   Requisito do integrador: as 5 seções precisam existir no DOM do primeiro
   paint com os ids de `MENU` (quem-somos, membros, artigos, nas-redes,
   proximos-eventos). O observer é montado uma vez; seção que aparece só depois
   (client-only, lazy) não entra no scrollspy.
   ========================================================================== */

/* Duas constantes que precisam andar juntas — a relação entre elas é o que faz
   o scrollspy concordar com o clique na âncora:

   OFFSET_ANCORA  onde o topo da seção pousa depois de um clique no menu.
   LINHA_LEITURA  onde o scrollspy considera que a seção "entrou".

   LINHA_LEITURA TEM que ser maior que OFFSET_ANCORA. Se forem iguais, a seção
   pousa exatamente em cima da linha e quem ganha o destaque é a seção ANTERIOR
   (o bug que apareceu no teste: clicar em "Artigos" acendia "Membros"). */
const OFFSET_ANCORA = 80;
const LINHA_LEITURA = 96;

/** A barra condensa depois desta rolagem. Curto de propósito: o usuário deve
    perceber a mudança já no primeiro gesto. */
const LIMIAR_CONDENSA = 24;

/** Transição compartilhada dos CTAs. O `BOTAO.barra` já traz a dele, mas sem
    `filter` — e o hover global `.press` mexe justamente em filter. Sem isso a
    transição inline sobrescreve a de `.press` e o brilho muda de estalo. */
const TRANSICAO_CTA = `${BOTAO.barra.transition}, filter .16s ease`;

/* Paleta do bloco escuro exposta como custom properties. Serve aos estados de
   :hover, que style inline não sabe expressar — as classes Tailwind consomem
   `var(--lp-*)` e nenhuma cor precisa ser reescrita à mão.
   Regra dura aprendida aqui: onde existe hover, a propriedade NÃO pode sair em
   style inline (inline vence qualquer classe, e o hover viraria código morto). */
const VARS_ESCURAS = {
  "--lp-veu": LP.linhaEscura, // véu branco de 12% — o mesmo valor do fio escuro
  "--lp-acento": C.laranja,
  "--lp-tinta": LP.tintaEscuraFraca,
} as CSSProperties;

/** true quando o usuário pediu menos movimento — some com o scroll suave. */
function semMovimento() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CabecalhoInstitucional() {
  const barraRef = useRef<HTMLElement>(null);
  const hamburguerRef = useRef<HTMLButtonElement>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  const [condensado, setCondensado] = useState(false);
  const [aberto, setAberto] = useState(false);
  // Topo da página = primeira seção. Sem isso a nav começa sem nenhum destaque,
  // o que lê como "quebrado" antes do primeiro scroll.
  const [ativo, setAtivo] = useState<string>(MENU[0].id);

  /* ---------------------------------------------------------- condensação -- */
  /* Ref (e não o estado) porque o listener de scroll é registrado uma vez só e
     precisa enxergar o valor atual sem ser recriado a cada abertura. */
  const abertoRef = useRef(false);
  useEffect(() => {
    abertoRef.current = aberto;
  }, [aberto]);

  useEffect(() => {
    let agendado = false;
    const aoRolar = () => {
      /* Com o painel aberto o body está `position: fixed` e `window.scrollY`
         vira 0 — a trava inclusive dispara um evento de scroll ao aplicar. Sem
         esta guarda a barra "descondensaria" no meio do menu aberto e voltaria
         a encolher ao fechar, animando a altura e roubando 8px da rolagem
         restaurada (comportamento medido no navegador). */
      if (abertoRef.current) return;
      if (agendado) return;
      agendado = true;
      // 1 leitura de scrollY por frame. Sem isso o handler dispara dezenas de
      // vezes por gesto e cada um vira um setState.
      requestAnimationFrame(() => {
        agendado = false;
        setCondensado(window.scrollY > LIMIAR_CONDENSA);
      });
    };
    aoRolar(); // reload no meio da página já nasce condensado
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  /* ------------------------------------------------------------ scrollspy -- */
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const alvos = MENU.map((m) => document.getElementById(m.id)).filter((e): e is HTMLElement => e !== null);
    if (alvos.length === 0) return;

    /* Um observer só, com a raiz recortada logo abaixo da barra. O conjunto de
       seções que cruzam essa raiz muda apenas nas viradas — e a ativa é sempre
       a mais alta do conjunto (a que está encostando na barra). Assim não
       precisamos de listener de scroll nem recriar o observer no resize. */
    const visiveis = new Set<string>();

    const observer = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) visiveis.add(e.target.id);
          else visiveis.delete(e.target.id);
        }
        // Conjunto vazio = estamos no hero (antes da 1ª seção) ou no rodapé
        // (depois da última): mantém o último destaque em vez de apagar tudo.
        if (visiveis.size === 0) return;

        let topo: { id: string; y: number } | null = null;
        for (const id of visiveis) {
          const el = document.getElementById(id);
          if (!el) continue;
          const y = el.getBoundingClientRect().top;
          if (topo === null || y < topo.y) topo = { id, y };
        }
        if (topo) setAtivo(topo.id);
      },
      { rootMargin: `-${LINHA_LEITURA}px 0px 0px 0px`, threshold: 0 },
    );

    for (const alvo of alvos) observer.observe(alvo);
    return () => observer.disconnect();
  }, []);

  /* --------------------------------------------------- rolagem com offset -- */
  /* `destinoPronto` existe para o caminho mobile: lá a conta precisa ser feita
     ANTES de fechar o painel (ver `irDoPainel`), porque depois do fechamento a
     geometria passa por estados intermediários. */
  const rolarPara = useCallback((id: string, destinoPronto?: number) => {
    const alvo = document.getElementById(id);
    if (!alvo) return;

    /* Offset constante em vez da altura medida: no instante do clique a barra
       ainda pode estar em repouso (84px), mas ela condensa durante a própria
       rolagem — medir agora erraria por 16px. 80 dá 12px de folga sobre a barra
       condensada de desktop (68) e 20px sobre a de mobile (60). */
    const destino =
      destinoPronto ?? Math.max(0, alvo.getBoundingClientRect().top + window.scrollY - OFFSET_ANCORA);

    window.scrollTo({ top: destino, behavior: semMovimento() ? "auto" : "smooth" });

    // URL compartilhável sem o pulo que `location.hash = ...` provocaria.
    history.replaceState(null, "", `#${id}`);

    // Leitor de tela / teclado precisam ir junto com a página. `preventScroll`
    // impede que o foco cancele a rolagem suave que acabamos de iniciar.
    alvo.setAttribute("tabindex", "-1");
    alvo.focus({ preventScroll: true });
    setAtivo(id);
  }, []);

  // Deep link (`/#membros`): o browser pula sem descontar a barra e o título
  // some atrás dela. Recolocamos assim que o layout estabiliza.
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id || !MENU.some((m) => m.id === id)) return;
    const t = window.setTimeout(() => rolarPara(id), 120);
    return () => window.clearTimeout(t);
  }, [rolarPara]);

  /* --------------------------------------------------------- painel mobile -- */
  const fechar = useCallback(() => {
    setAberto(false);
    hamburguerRef.current?.focus();
  }, []);

  /* Trava do scroll do body. `position: fixed` + `top: -y` é o único jeito que
     segura o iOS; em troca precisamos devolver o scrollY na saída, senão a
     página volta pro topo ao fechar o menu.

     Efeito colateral medido no navegador: com o body fixo o documento deixa de
     rolar, e a barra `sticky` some para fora da tela (ficou em top:-200px no
     teste a 892px de rolagem). Por isso, enquanto o painel está aberto, a barra
     passa a `fixed` (ver o style do <header>) — e o body ganha um padding-top
     do tamanho dela para compensar a saída do fluxo, senão o conteúdo por baixo
     do overlay salta para cima. */
  useEffect(() => {
    if (!aberto) return;

    const y = window.scrollY;
    const body = document.body;
    const alturaBarra = barraRef.current?.offsetHeight ?? 0;
    const larguraBarraRolagem = window.innerWidth - document.documentElement.clientWidth;
    const anterior = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      paddingTop: body.style.paddingTop,
      paddingRight: body.style.paddingRight,
    };

    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.paddingTop = `${alturaBarra}px`;
    // Sem isso o conteúdo salta pro lado quando a barra de rolagem some.
    if (larguraBarraRolagem > 0) body.style.paddingRight = `${larguraBarraRolagem}px`;

    return () => {
      Object.assign(body.style, anterior);
      window.scrollTo(0, y);
    };
  }, [aberto]);

  // Esc + foco preso no painel.
  useEffect(() => {
    if (!aberto) return;

    fecharRef.current?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        fechar();
        return;
      }
      if (e.key !== "Tab") return;

      const painel = painelRef.current;
      if (!painel) return;
      const focaveis = Array.from(
        painel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      ).filter((el) => el.offsetParent !== null);
      if (focaveis.length === 0) return;

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const foco = document.activeElement;

      // Circula em vez de escapar para a página atrás do overlay.
      if (e.shiftKey && (foco === primeiro || !painel.contains(foco))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (foco === ultimo || !painel.contains(foco))) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, fechar]);

  /* Clique numa âncora do painel.

     Entre "fechar o painel" e "a página voltar ao normal" existem estados
     intermediários (a barra volta ao fluxo antes de o padding-top do body
     sair), e medir a seção em qualquer um deles erra por uma altura de header
     — no teste a seção pousava a 12px do topo em vez de 80px.

     Então a conta é feita AQUI, com a trava ainda de pé, onde os termos são
     conhecidos. A trava é neutra em layout de propósito (a barra sai do fluxo e
     o body ganha um padding-top do MESMO tamanho), então basta somar de volta o
     deslocamento guardado em `body.style.top`. Convertido para pixels de
     documento, o destino independe de quando o destrave acontece. */
  const irDoPainel = (e: React.MouseEvent, id: string) => {
    const alvo = document.getElementById(id);
    if (!alvo) return; // sem a seção, o link nativo #id resolve
    e.preventDefault();

    const deslocamento = Math.abs(parseFloat(document.body.style.top || "0"));
    const destino = Math.max(0, alvo.getBoundingClientRect().top + deslocamento - OFFSET_ANCORA);

    fechar();
    requestAnimationFrame(() => rolarPara(id, destino));
  };

  const aoClicarAncora = (e: React.MouseEvent, id: string) => {
    if (!document.getElementById(id)) return; // seção ausente: deixa o link nativo agir
    e.preventDefault();
    rolarPara(id);
  };

  return (
    <>
      <header
        ref={barraRef}
        className="sticky top-0 z-50 w-full"
        style={{
          ...VARS_ESCURAS,
          // com o body travado (`position: fixed`), `sticky` perde a referência
          // de rolagem e a barra escapa da tela — daí o `fixed` temporário.
          position: aberto ? "fixed" : undefined,
          // Condensado vira vidro fosco; parado é preto chapado.
          background: condensado ? "rgba(12,12,12,.82)" : LP.preto,
          backdropFilter: condensado ? "saturate(140%) blur(14px)" : undefined,
          WebkitBackdropFilter: condensado ? "saturate(140%) blur(14px)" : undefined,
          transition: "background-color .3s ease",
        }}
      >
        <div
          /* Grid de 3 colunas no desktop (1fr · auto · 1fr) em vez de flex: com
             flex + mx-auto a nav centraliza no espaço que sobra entre marca e
             CTAs, que têm larguras diferentes — e ela nasce torta. O grid
             centraliza de verdade. No mobile volta a ser flex, porque só há
             marca + hambúrguer. */
          className={`lp-container flex items-center gap-4 transition-[height] duration-300 ease-out lg:grid lg:grid-cols-[1fr_auto_1fr] ${
            condensado ? "h-[60px] lg:h-[68px]" : "h-[68px] lg:h-[84px]"
          }`}
        >
          {/* ------------------------------------------------------- marca -- */}
          <Link
            href="/"
            aria-label="Time Holding Brasil — início"
            className="press flex min-w-0 shrink-0 items-center gap-2.5 lg:justify-self-start"
          >
            {/* `so`: o lockup de logo.tsx pinta o texto com C.ink (escuro) e
                sumiria na barra preta. O selo em si é laranja chapado e lê bem
                sobre #0C0C0C, então só o texto precisa ser refeito aqui. */}
            <Logo altura={42} so />
            {/* Some entre 1024 e 1279: nessa faixa a nav de 5 itens + os 2 CTAs
                ocupam a largura inteira e o lockup empurraria tudo para 2 linhas.
                O selo sozinho já identifica a marca. */}
            <span className="hidden leading-none sm:flex sm:flex-col lg:hidden xl:flex">
              <span style={{ fontFamily: F.serif, fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-0.015em" }}>
                Rede Nacional
              </span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontWeight: 600,
                  fontSize: 10,
                  color: LP.tintaEscuraFraca,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  marginTop: 3,
                }}
              >
                de Especialistas
              </span>
            </span>
          </Link>

          {/* --------------------------------------------- navegação (≥lg) -- */}
          <nav aria-label="Seções da página" className="mx-auto hidden items-center lg:flex">
            {MENU.map((item) => {
              const selecionado = ativo === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => aoClicarAncora(e, item.id)}
                  aria-current={selecionado ? "location" : undefined}
                  className="relative flex items-center whitespace-nowrap px-2.5 text-[color:var(--cor-item)] transition-colors hover:text-[color:var(--cor-hover)] xl:px-3.5"
                  style={
                    {
                      height: 38,
                      fontFamily: F.sans,
                      fontSize: 13.5,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      // cor sai por var (e não inline) porque o hover é CSS puro
                      "--cor-item": selecionado ? C.laranja : LP.tintaEscuraFraca,
                      "--cor-hover": selecionado ? C.laranja : "#fff",
                    } as CSSProperties
                  }
                >
                  {item.rotulo}
                  {/* Fio de 2px que cresce a partir do centro — o destaque não
                      pode empurrar layout, por isso é absoluto + scaleX. */}
                  <span
                    aria-hidden="true"
                    // insets acompanham o padding do item (px-2.5 / xl:px-3.5)
                    className="absolute inset-x-2.5 bottom-0 xl:inset-x-3.5"
                    style={{
                      height: 2,
                      borderRadius: 2,
                      background: C.laranja,
                      transform: selecionado ? "scaleX(1)" : "scaleX(0)",
                      transformOrigin: "center",
                      transition: "transform .24s cubic-bezier(.22,.61,.36,1)",
                    }}
                  />
                </a>
              );
            })}
          </nav>

          {/* -------------------------------------------------- CTAs (≥lg) -- */}
          <div className="ml-auto hidden items-center gap-2.5 lg:flex">
            {/* Ordem "inscrever → área do membro" é a do wireframe do PO e a do
                G4, que ele deu como referência. Também é a leitura certa: o
                visitante novo (maioria) encontra primeiro o CTA que é dele. */}
            <CtaBarra href={CTA.inscrever.href} rotulo={CTA.inscrever.rotulo} variante="solido" />
            <CtaBarra href={CTA.membro.href} rotulo={CTA.membro.rotulo} variante="contorno" />
          </div>

          {/* ------------------------------------------- hambúrguer (<lg) -- */}
          <button
            ref={hamburguerRef}
            type="button"
            onClick={() => setAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={aberto}
            aria-controls="painel-menu-institucional"
            className="press ml-auto flex items-center justify-center bg-transparent transition-colors hover:bg-[color:var(--lp-veu)] lg:hidden"
            style={{
              width: 44, // alvo de toque mínimo
              height: 44,
              borderRadius: 10,
              color: "#fff",
              border: `1px solid ${LP.linhaEscura}`,
            }}
          >
            <Ico.menu style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Fio degradê da base — assinatura da LP no lugar da sombra. */}
        <span aria-hidden="true" className="lp-fio absolute inset-x-0 bottom-0 block" />
      </header>

      {/* ------------------------------------------------- painel off-canvas -- */}
      {/* Sempre montado (o `aria-controls` do hambúrguer precisa de um alvo real
          e a saída também precisa animar). `visibility: hidden` tira do tab e da
          árvore de acessibilidade quando fechado; o wrapper fixo com overflow
          hidden impede que o painel deslocado crie rolagem horizontal. */}
      <div
        className="fixed inset-0 z-[60] overflow-hidden lg:hidden"
        style={{
          ...VARS_ESCURAS,
          visibility: aberto ? "visible" : "hidden",
          pointerEvents: aberto ? "auto" : "none",
          // some só depois da animação de saída terminar
          transition: aberto ? "visibility 0s" : "visibility 0s linear .28s",
        }}
      >
        <div
          aria-hidden="true"
          onClick={fechar}
          className="absolute inset-0"
          style={{
            background: "rgba(6,6,6,.72)",
            opacity: aberto ? 1 : 0,
            transition: "opacity .28s ease",
          }}
        />

        <div
          ref={painelRef}
          id="painel-menu-institucional"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          className="absolute inset-y-0 right-0 flex flex-col"
          style={{
            width: "min(88vw, 360px)",
            background: LP.preto,
            borderLeft: `1px solid ${LP.linhaEscura}`,
            transform: aberto ? "none" : "translateX(100%)",
            transition: "transform .28s cubic-bezier(.22,.61,.36,1)",
          }}
        >
          <div className="flex items-center justify-between px-5" style={{ height: 68 }}>
            <Logo altura={38} so />
            <button
              ref={fecharRef}
              type="button"
              onClick={fechar}
              aria-label="Fechar menu"
              className="press flex items-center justify-center bg-transparent transition-colors hover:bg-[color:var(--lp-veu)]"
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                color: "#fff",
                border: `1px solid ${LP.linhaEscura}`,
              }}
            >
              <Ico.x style={{ width: 20, height: 20 }} />
            </button>
          </div>
          <span aria-hidden="true" className="lp-fio block" />

          <nav aria-label="Seções da página" className="lp-trilho flex-1 overflow-y-auto px-5 py-2">
            {MENU.map((item) => {
              const selecionado = ativo === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => irDoPainel(e, item.id)}
                  aria-current={selecionado ? "location" : undefined}
                  className="flex items-center justify-between gap-3"
                  style={{
                    minHeight: 56, // alvo de toque confortável
                    borderBottom: `1px solid ${LP.linhaEscura}`,
                    color: selecionado ? C.laranja : "#fff",
                    fontFamily: F.serif,
                    fontSize: TIPO.h3.fontSize,
                    fontWeight: 700,
                    letterSpacing: TIPO.h3.letterSpacing,
                  }}
                >
                  {item.rotulo}
                  <Ico.chevron
                    style={{ width: 16, height: 16, flexShrink: 0, color: selecionado ? C.laranja : LP.tintaEscuraSuave }}
                  />
                </a>
              );
            })}
          </nav>

          <div className="flex flex-col gap-2.5 px-5 pb-6 pt-4">
            <CtaBarra href={CTA.inscrever.href} rotulo={CTA.inscrever.rotulo} variante="solido" bloco onNavegar={fechar} />
            <CtaBarra href={CTA.membro.href} rotulo={CTA.membro.rotulo} variante="contorno" bloco onNavegar={fechar} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------------
   CTA da barra (sólido ou contorno), do header e do painel mobile.

   O `background: transparent` do `BOTAO.barraOutline` é retirado do style e
   reposto como classe: se ficasse inline, venceria o `hover:bg-*` e o botão de
   contorno nunca acenderia. O sólido não muda de cor no hover — quem cuida
   disso é o `.press` global (brightness), a convenção do resto do app.
   ------------------------------------------------------------------------- */
function CtaBarra({
  href,
  rotulo,
  variante,
  bloco = false,
  onNavegar,
}: {
  href: string;
  rotulo: string;
  variante: "solido" | "contorno";
  /** largura total — usado no rodapé do painel mobile. */
  bloco?: boolean;
  onNavegar?: () => void;
}) {
  const solido = variante === "solido";
  // `background: undefined` faz o React não emitir a propriedade — é assim que
  // o fundo sai do inline e passa a ser responsabilidade das classes.
  const base = solido ? BOTAO.barra : { ...BOTAO.barraOutline, background: undefined };

  return (
    <Link
      href={href}
      onClick={onNavegar}
      className={[
        "press",
        bloco ? "w-full" : "",
        // sem `transition-colors`: TRANSICAO_CTA (inline) já cobre background-color
        solido ? "" : "bg-transparent hover:bg-[color:var(--lp-veu)]",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...base,
        transition: TRANSICAO_CTA,
        ...(bloco ? { width: "100%", height: 48 } : null),
      }}
    >
      {rotulo}
    </Link>
  );
}
