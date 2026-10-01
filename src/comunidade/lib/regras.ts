/* Regras do grupo. A coordenação escreve em texto livre (Coordenação > Regras)
   e a tela mostra uma lista numerada que abre e fecha, como no Facebook.

   Dois formatos aceitos, para não quebrar o que já está salvo:
   - EM BLOCOS (tem linha em branco no texto): cada bloco é uma regra; a
     primeira linha é o título e o resto é a explicação.
   - UMA POR LINHA (sem linha em branco): cada linha é uma regra, só título. */

export interface Regra {
  titulo: string;
  descricao: string;
}

export function interpretarRegras(texto: string | null | undefined): Regra[] {
  const limpo = (texto ?? "").replace(/\r\n?/g, "\n").trim();
  if (!limpo) return [];
  const semNumero = (s: string) => s.replace(/^\s*\d+\s*[.)\-:]\s*/, "").trim();

  if (/\n\s*\n/.test(limpo)) {
    return limpo
      .split(/\n\s*\n+/)
      .map((bloco) => {
        const linhas = bloco.split("\n").map((l) => l.trim()).filter(Boolean);
        return { titulo: semNumero(linhas[0] ?? ""), descricao: linhas.slice(1).join(" ") };
      })
      .filter((r) => r.titulo);
  }
  return limpo
    .split("\n")
    .map((l) => ({ titulo: semNumero(l), descricao: "" }))
    .filter((r) => r.titulo);
}
