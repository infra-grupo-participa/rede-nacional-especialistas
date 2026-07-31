"use server";

import { createClient } from "@/lib/supabase/server";
import { FILTRO_PROF_OR, rotuloProfissao } from "@/lib/profissoes-permitidas";

export interface ProfissaoUf {
  nome: string;
  n: number;
}

/** Profissões (Advogado/Contador) com contagem, dos aprovados de uma UF. */
export async function profissoesDaUf(uf: string): Promise<{ total: number; profissoes: ProfissaoUf[] }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfis")
    .select("profissao")
    .eq("status", "aprovado")
    .eq("oculto", false)
    .eq("uf", uf)
    .or(FILTRO_PROF_OR);

  const cont: Record<string, number> = {};
  for (const row of data ?? []) {
    const p = (row as { profissao: string | null }).profissao;
    const rot = rotuloProfissao(p); // Advogado | Contador
    cont[rot] = (cont[rot] || 0) + 1;
  }
  const profissoes = Object.entries(cont)
    .map(([nome, n]) => ({ nome, n }))
    .sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome));
  return { total: (data ?? []).length, profissoes };
}
