/* Textos do resultado do Diagnóstico de Holding Familiar.
   Pontos e faixas NÃO moram aqui: a fonte única é diagnostico.ts.

   PROVISÓRIO: todos os textos deste arquivo foram escritos pela equipe para a
   versão local. O convite da live será escrito pelo Marcio; os textos por faixa
   e as leituras dos eixos também precisam da aprovação dele. */

import type { FaixaId } from "@/comunidade/lib/diagnostico";

/** PROVISÓRIO: o Marcio vai escrever esta mensagem. Só aparece para grandes e excelentes. */
export const TEXTO_CONVITE_LIVE =
  "Pelo seu resultado, você tem o perfil que o Prof. Marcio Carvalho quer reunir na live da Black Friday. Garanta o seu lugar.";

/** Link da live. Vazio = botão desativado com "Link em breve". */
export const LINK_LIVE = "";

/** PROVISÓRIO: texto de cada faixa, mostrado abaixo do título do resultado. */
export const TEXTO_FAIXA: Record<FaixaId, string> = {
  pequenas:
    "Hoje a Holding Familiar ainda está longe da sua rotina. Isso não é um ponto final: o diagnóstico mostra onde estão as lacunas, na base técnica, no acesso a clientes ou nos dois. Comece pelo eixo com a nota mais baixa.",
  razoaveis:
    "Você já andou parte do caminho. Algumas peças estão no lugar, mas outras ainda limitam o quanto a Holding Familiar pode render para você. Olhe os dois eixos abaixo: o mais fraco é a sua prioridade.",
  grandes:
    "Você reúne base e mercado para transformar a Holding Familiar em uma frente real de trabalho. O que separa você do próximo nível é método para converter os contatos que já tem.",
  excelentes:
    "Seu perfil tem o que é preciso para viver de Holding Familiar: formação, objetivo claro e gente ao seu redor que precisa desse serviço. Agora é questão de método e execução.",
};

/** PROVISÓRIO: leitura curta de cada eixo, pela proporção da nota no eixo. */
export function leituraTecnica(pontos: number, max: number): string {
  const p = pontos / max;
  if (p >= 0.8) return "Sua formação e seu objetivo colocam a Holding Familiar como trabalho, não como curiosidade.";
  if (p >= 0.4) return "Existe base, mas a formação ou o objetivo ainda não favorecem trabalhar com Holding Familiar.";
  return "A parte técnica é hoje o seu maior obstáculo para trabalhar com Holding Familiar.";
}

export function leituraComercial(pontos: number, max: number): string {
  const p = pontos / max;
  if (p >= 0.6) return "Você conhece gente que precisa de Holding Familiar. O mercado já está ao seu redor.";
  if (p >= 0.3) return "Existe mercado ao seu redor, mas ele ainda é pequeno ou pouco explorado.";
  return "Falta acesso a clientes com perfil para Holding Familiar. Esse é o ponto a construir.";
}
