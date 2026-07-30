import { createClient } from "@/lib/supabase/server";
import { C, F } from "@/lib/tokens";

// A home é dinâmica (dados do banco, sessão por cookie).
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: perfis, error } = await supabase
    .from("perfis")
    .select("id, nome, cidade, uf, qualificacao, status")
    .eq("status", "aprovado")
    .limit(5);

  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
        <p
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.sobreFundo,
          }}
        >
          Rede Nacional de Especialistas
        </p>
        <h1 style={{ fontFamily: F.serif, fontSize: 32, lineHeight: 1.1, marginTop: 8 }}>
          Fundação no ar
        </h1>
        <p style={{ marginTop: 12, color: C.sobreFundo }}>
          Conexão com o banco (schema <code>rede</code>):{" "}
          {error
            ? `erro — ${error.message}`
            : `OK, ${perfis?.length ?? 0} perfis aprovados`}
        </p>
      </div>
    </main>
  );
}
