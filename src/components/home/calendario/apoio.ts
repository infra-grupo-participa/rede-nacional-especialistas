/* ============================================================================
   Apoio do calendário de "Próximos Eventos": constantes derivadas da AGENDA,
   paleta sobre fundo escuro e o CSS local da seção.

   MÓDULO PURO — nada de I/O nem de `new Date()` no caminho de módulo: os
   índices são calculados uma vez porque a AGENDA é estática.
   ========================================================================== */

import {
  AGENDA, contagemPorMes, chaveDia, indicePorDia, paraData, proximos,
  type CategoriaEvento,
} from "@/lib/eventos";
import { LP } from "@/lib/landing";
import { C } from "@/lib/tokens";

export const ANO = 2026;

/** Referência determinística para o primeiro render (server === client).
    `Date.now()` não existe no build de RSC (ver rodape.tsx:8); o relógio real
    só entra via useSyncExternalStore, depois da hidratação. */
export const REF_HOJE = "2026-08-02";

export const POR_DIA = indicePorDia(AGENDA);
export const CONTAGENS = contagemPorMes(AGENDA, ANO);
const ULTIMO_MES_COM_EVENTOS = CONTAGENS.reduce((ult, n, i) => (n > 0 ? i : ult), 0);

/* CATEGORIAS[].cor foi calibrada para superfícies claras; sobre #131313 os
   tons frios (#1F6F6B, #4A5B8C) ficam abaixo de 3:1. Estes são os mesmos
   matizes clareados até passarem 4.5:1 sobre o preto dos painéis. */
export const COR_CLARA: Record<CategoriaEvento, string> = {
  encontro: "#FFA163",
  formacao: "#5FC4BE",
  clinica: "#FF9C78",
  consultoria: "#ADBCEC",
  diamantes: "#C7ACF2",
};

/* DIAS_SEMANA são abreviações visuais; o leitor de tela recebe o nome inteiro. */
export const DIAS_LONGOS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

/** Mês (0-11) do primeiro evento futuro; se a agenda acabou, o último mês com eventos. */
export function mesDoPrimeiroFuturo(ref: Date): number {
  const [prox] = proximos(AGENDA, ref, 1);
  if (!prox) return ULTIMO_MES_COM_EVENTOS;
  const d = paraData(prox.inicio);
  return d.getFullYear() === ANO ? d.getMonth() : ULTIMO_MES_COM_EVENTOS;
}

/** Próximo mês com eventos depois de `aPartir`; -1 quando não há mais. */
export function proximoComEventos(aPartir: number): number {
  return CONTAGENS.findIndex((n, i) => i > aPartir && n > 0);
}

export function reduzMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* "Hoje" sem mismatch de hidratação: useSyncExternalStore entrega REF_HOJE no
   render de servidor/hidratação e a data real logo depois — é o mecanismo do
   React para esse par server/client, sem setState dentro de effect. A data não
   muda durante a visita, então não há nada a assinar. */
export const assinarNada = () => () => {};
export const lerHojeNoCliente = () => chaveDia(new Date());
export const lerHojeNoServidor = () => REF_HOJE;

/* CSS local prefixado `sev-` — globals.css é contrato de outro agente, então
   os keyframes e o hover que o inline-style mataria (especificidade) moram
   aqui. O bloco de reduced-motion espelha o de globals por segurança. */
export const ESTILO_LOCAL = `
@keyframes sevEntra{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.sev-entra{animation:sevEntra .22s cubic-bezier(.22,.61,.36,1) both}
@keyframes sevPulso{0%{opacity:.85;transform:scale(1)}70%,100%{opacity:0;transform:scale(1.5)}}
.sev-pulso{position:absolute;inset:-3px;border-radius:9999px;border:1px solid ${C.laranja};animation:sevPulso 2.8s ease-out infinite;pointer-events:none}
.sev-foco:focus-visible{outline:2px solid #FFB648;outline-offset:2px}
/* fundo da célula fica na classe (não inline) para o :hover ter como vencer. */
.sev-celula{background-color:${LP.pretoCard};transition:background-color .15s ease}
@media(hover:hover){.sev-celula:hover{background-color:#1A1A1A}}
.sev-card{background:${LP.pretoCard};border:1px solid var(--sev-borda,${LP.linhaEscura});border-left:3px solid var(--sev-cat,${LP.linhaEscura});transition:background-color .18s ease,border-color .18s ease}
@media(hover:hover){.sev-card:hover{background:#181614;border-color:rgba(255,107,26,.5);border-left-color:var(--sev-cat)}}
@media(prefers-reduced-motion:reduce){.sev-entra,.sev-pulso{animation:none}.sev-pulso{opacity:0}}
`;
