"use client";

// global-error precisa renderizar suas próprias <html>/<body> (substitui o
// layout raiz quando o erro estoura acima dele). Também dá à app um fallback
// próprio em vez do builtin do Next — que o bundler do Turbopack (Next 16) às
// vezes não resolve no manifesto RSC.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full">
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Algo deu errado
          </h1>
          <p style={{ color: "#666", maxWidth: "28rem" }}>
            Tivemos um problema ao carregar esta página. Tente de novo — se
            persistir, avise a coordenação.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#FE7413",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.6rem 1.25rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
        </main>
      </body>
    </html>
  );
}
